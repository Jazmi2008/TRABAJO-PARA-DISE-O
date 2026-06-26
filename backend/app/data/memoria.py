from typing import List, Dict, Any
from datetime import datetime, timedelta

from ..models.usuario import Usuario, Rol
from ..models.paciente import Paciente
from ..models.doctor import Doctor
from ..models.agenda import AgendaDoctor, SlotHorario, EstadoSlot
from ..models.cita import Cita, EstadoCita

class Memoria:
    _instancia = None

    def __new__(cls):
        if cls._instancia is None:
            cls._instancia = super().__new__(cls)
            cls._instancia._inicializar()
        return cls._instancia

    def _inicializar(self):
        self.usuarios: List = []
        self.citas: List = []
        self.agendas: Dict[str, Any] = {}
        self._cargar_datos_por_defecto()

    def _cargar_datos_por_defecto(self):
        # --- RECEPCIONISTA ---
        recepcionista = Usuario(
            id="R-001",
            nombre="Maria Lopez",
            email="recepcion@clinica.com",
            password="recepcion123",
            rol=Rol.RECEPCIONISTA
        )
        self.usuarios.append(recepcionista)

        # --- DOCTORES ---
        doctor1 = Doctor(
            id="D-001",
            nombre="Dr. Carlos Mendez",
            email="carlos.mendez@clinica.com",
            password="doctor123",
            especialidad="Cardiologia"
        )
        doctor2 = Doctor(
            id="D-002",
            nombre="Dra. Ana Torres",
            email="ana.torres@clinica.com",
            password="doctor123",
            especialidad="Dermatologia"
        )
        doctor3 = Doctor(
            id="D-003",
            nombre="Dr. Luis Ramirez",
            email="luis.ramirez@clinica.com",
            password="doctor123",
            especialidad="Medicina General"
        )
        self.usuarios.extend([doctor1, doctor2, doctor3])

        # --- PACIENTES ---
        paciente1 = Paciente(
            id="P-001",
            nombre="Juan Perez",
            email="juan.perez@email.com",
            password="paciente123",
            telefono="+51999111222"
        )
        paciente2 = Paciente(
            id="P-002",
            nombre="Maria Garcia",
            email="maria.garcia@email.com",
            password="paciente123",
            telefono="+51999888777"
        )
        paciente3 = Paciente(
            id="P-003",
            nombre="Pedro Sanchez",
            email="pedro.sanchez@email.com",
            password="paciente123",
            telefono="+51999666555"
        )
        self.usuarios.extend([paciente1, paciente2, paciente3])

        # --- AGENDAS CON SLOTS ---
        hoy = datetime.now()
        for doctor in [doctor1, doctor2, doctor3]:
            agenda = AgendaDoctor(doctor)
            # Generar slots para hoy y mañana
            for i in range(2):
                dia = hoy + timedelta(days=i)
                agenda.generar_slots(dia, intervalo_minutos=30)
            self.agendas[doctor.id] = agenda

        # --- CITAS DE EJEMPLO ---
        from ..factories.creador_citas import FabricaConsultaGeneral
        from ..services.gestor_citas import GestorCitas

        gestor = GestorCitas.get_instancia()

        # Cita 1: Juan Perez con Dr. Carlos Mendez
        agenda1 = self.agendas[doctor1.id]
        slots_libres1 = agenda1.obtener_slots_libres()
        if len(slots_libres1) > 0:
            slot1 = slots_libres1[0]
            fabrica1 = FabricaConsultaGeneral(nro_consultorio="101")
            cita1 = gestor.registrar_cita(paciente1, doctor1, fabrica1, slot1)
            cita1._id_cita = "C-001"

        # Cita 2: Maria Garcia con Dra. Ana Torres
        agenda2 = self.agendas[doctor2.id]
        slots_libres2 = agenda2.obtener_slots_libres()
        if len(slots_libres2) > 0:
            slot2 = slots_libres2[0]
            fabrica2 = FabricaConsultaGeneral(nro_consultorio="202")
            cita2 = gestor.registrar_cita(paciente2, doctor2, fabrica2, slot2)
            cita2._id_cita = "C-002"

        # Cita 3: Pedro Sanchez con Dr. Luis Ramirez (Laboratorio)
        from ..factories.creador_citas import FabricaCitaLaboratorio
        agenda3 = self.agendas[doctor3.id]
        slots_libres3 = agenda3.obtener_slots_libres()
        if len(slots_libres3) > 0:
            slot3 = slots_libres3[0]
            fabrica3 = FabricaCitaLaboratorio(tipo_analisis="Sangre", requiere_ayuno=True)
            cita3 = gestor.registrar_cita(paciente3, doctor3, fabrica3, slot3)
            cita3._id_cita = "C-003"
