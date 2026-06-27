from datetime import datetime
from typing import List, Optional, Dict
from ..models.cita import Cita, EstadoCita
from ..models.agenda import AgendaDoctor, SlotHorario, EstadoSlot
from ..factories.creador_citas import CreadorCitas

class IConsultaCitas:
    def consultar_cita(self, id_cita: str) -> Optional[Cita]:
        raise NotImplementedError

    def consultar_todas_mis_citas(self, id_paciente: str) -> List[Cita]:
        raise NotImplementedError

    def obtener_citas_por_doctor(self, id_doctor: str) -> List[Cita]:
        raise NotImplementedError

class IGestionCitas:
    def registrar_cita(self, paciente, doctor, fabrica: CreadorCitas, slot: SlotHorario) -> Cita:
        raise NotImplementedError

    def actualizar_fecha_cita(self, id_cita: str, nueva_fecha: datetime, version_slot: int) -> bool:
        raise NotImplementedError

    def cancelar_cita(self, id_cita: str) -> bool:
        raise NotImplementedError

class IConfiguracionAgenda:
    def obtener_agenda_doctor(self, id_doctor: str) -> Optional[AgendaDoctor]:
        raise NotImplementedError

    def cambiar_estado_cita(self, id_cita: str, nuevo_estado: EstadoCita) -> bool:
        raise NotImplementedError

class Observador:
    def actualizar(self, cita: Cita) -> None:
        raise NotImplementedError

class EstrategiaAsignacion:
    def asignar_horario(self, cita: Cita, doctor) -> datetime:
        raise NotImplementedError

class AsignacionPorDisponibilidad(EstrategiaAsignacion):
    def asignar_horario(self, cita: Cita, doctor) -> datetime:
        agenda = cita.doctor.consultar_agenda()
        if agenda:
            libres = agenda.obtener_slots_libres()
            if libres:
                return libres[0].fecha_hora
        return datetime.now()

class AsignacionPorUrgencia(EstrategiaAsignacion):
    def asignar_horario(self, cita: Cita, doctor) -> datetime:
        return datetime.now()

class GestorCitas(IConsultaCitas, IGestionCitas, IConfiguracionAgenda):
    _instancia = None

    def __new__(cls):
        if cls._instancia is None:
            cls._instancia = super().__new__(cls)
            cls._instancia._inicializar()
        return cls._instancia

    def _inicializar(self):
        self._observadores: List[Observador] = []
        self._estrategia_asignacion: Optional[EstrategiaAsignacion] = None
        self._contador_citas = 0

    @classmethod
    def get_instancia(cls):
        if cls._instancia is None:
            cls._instancia = cls()
        return cls._instancia

    def _get_memoria(self):
        from ..data.memoria import Memoria
        return Memoria()

    def set_estrategia_asignacion(self, estrategia: EstrategiaAsignacion) -> None:
        self._estrategia_asignacion = estrategia

    def enlazar_observador(self, o: Observador) -> None:
        self._observadores.append(o)

    def desenlazar_observador(self, o: Observador) -> None:
        if o in self._observadores:
            self._observadores.remove(o)

    def notificar_observadores(self, cita: Cita) -> None:
        for obs in self._observadores:
            try:
                obs.actualizar(cita)
            except Exception as e:
                print(f"[NOTIFICACION-ERROR] {type(obs).__name__}: {str(e)}")

    def registrar_cita(self, paciente, doctor, fabrica: CreadorCitas, slot: SlotHorario) -> Cita:
        if slot.estado != EstadoSlot.LIBRE:
            raise ValueError("El slot no esta libre")

        if not slot.reservar(slot.version):
            raise ValueError("No se pudo reservar el slot (optimistic locking fallido)")

        self._contador_citas += 1
        id_cita = f"C-{self._contador_citas}"
        cita = fabrica.crear_cita(paciente, doctor, slot)
        cita._id_cita = id_cita
        cita._fecha_hora = slot.fecha_hora

        mem = self._get_memoria()
        mem.citas.append(cita)

        if doctor.id not in mem.agendas:
            mem.agendas[doctor.id] = AgendaDoctor(doctor)
        mem.agendas[doctor.id].slots.append(slot)

        self.notificar_observadores(cita)
        return cita

    def actualizar_fecha_cita(self, id_cita: str, nueva_fecha: datetime, version_slot: int) -> bool:
        cita = self.consultar_cita(id_cita)
        if not cita:
            return False

        nuevo_slot = None
        agenda = self.obtener_agenda_doctor(cita.doctor.id)
        if agenda:
            nuevo_slot = agenda.obtener_slot_por_fecha_hora(nueva_fecha)

        if not nuevo_slot or nuevo_slot.estado != EstadoSlot.LIBRE:
            return False

        if not nuevo_slot.reservar(nuevo_slot.version):
            return False

        if cita.slot and not cita.slot.liberar(version_slot):
            nuevo_slot.liberar(nuevo_slot.version)
            return False

        cita.set_fecha_hora(nueva_fecha)
        cita.set_estado(EstadoCita.MODIFICADA)
        cita._slot = nuevo_slot
        self.notificar_observadores(cita)
        return True

    def modificar_cita_completa(self, id_cita: str, nuevo_doctor=None, nuevo_slot=None, nuevo_tipo=None) -> bool:
        cita = self.consultar_cita(id_cita)
        if not cita:
            return False

        if cita.slot:
            cita.slot.liberar(cita.slot.version)

        if nuevo_doctor and nuevo_doctor.id != cita.doctor.id:
            cita._doctor = nuevo_doctor

        if nuevo_slot:
            if nuevo_slot.estado != EstadoSlot.LIBRE:
                return False
            if not nuevo_slot.reservar(nuevo_slot.version):
                return False
            cita._slot = nuevo_slot
            cita._fecha_hora = nuevo_slot.fecha_hora

        cita.set_estado(EstadoCita.MODIFICADA)
        self.notificar_observadores(cita)
        return True

    def cancelar_cita(self, id_cita: str) -> bool:
        cita = self.consultar_cita(id_cita)
        if not cita:
            return False
        cita.set_estado(EstadoCita.CANCELADA)
        if cita.slot:
            cita.slot.liberar(cita.slot.version)
        self.notificar_observadores(cita)
        return True

    def consultar_cita(self, id_cita: str) -> Optional[Cita]:
        mem = self._get_memoria()
        for c in mem.citas:
            if c.id_cita == id_cita:
                return c
        return None

    def consultar_todas_mis_citas(self, id_paciente: str) -> List[Cita]:
        mem = self._get_memoria()
        return [c for c in mem.citas if c.paciente.id == id_paciente]

    def obtener_citas_por_doctor(self, id_doctor: str) -> List[Cita]:
        mem = self._get_memoria()
        return [c for c in mem.citas if c.doctor.id == id_doctor]

    def obtener_todas_las_citas(self) -> List[Cita]:
        mem = self._get_memoria()
        return mem.citas

    def buscar_citas(self, fecha: Optional[str] = None, nombre: Optional[str] = None, id_cita: Optional[str] = None,
                     doctor_id: Optional[str] = None, paciente_id: Optional[str] = None) -> List[Cita]:
        mem = self._get_memoria()
        resultados = mem.citas[:]

        if id_cita:
            return [c for c in resultados if c.id_cita == id_cita]

        if fecha:
            from datetime import date
            try:
                fecha_busqueda = date.fromisoformat(fecha)
                resultados = [c for c in resultados if c.fecha_hora.date() == fecha_busqueda]
            except ValueError:
                pass

        if nombre:
            nombre_lower = nombre.lower()
            resultados = [c for c in resultados if nombre_lower in c.paciente.nombre.lower()]

        if doctor_id:
            resultados = [c for c in resultados if c.doctor.id == doctor_id]

        if paciente_id:
            resultados = [c for c in resultados if c.paciente.id == paciente_id]

        return resultados

    def obtener_agenda_doctor(self, id_doctor: str) -> Optional[AgendaDoctor]:
        mem = self._get_memoria()
        return mem.agendas.get(id_doctor)

    def cambiar_estado_cita(self, id_cita: str, nuevo_estado: EstadoCita) -> bool:
        cita = self.consultar_cita(id_cita)
        if not cita:
            return False
        cita.set_estado(nuevo_estado)
        if nuevo_estado == EstadoCita.COMPLETADA and cita.slot:
            cita.slot.ocupar(cita.slot.version)
        self.notificar_observadores(cita)
        return True
