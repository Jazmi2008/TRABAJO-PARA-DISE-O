from enum import Enum
from datetime import datetime
from typing import Optional

class EstadoCita(Enum):
    AGENDADA = "AGENDADA"
    MODIFICADA = "MODIFICADA"
    CANCELADA = "CANCELADA"
    COMPLETADA = "COMPLETADA"

class Cita:
    def __init__(self, id_cita: str, fecha_hora: datetime, paciente, doctor, slot):
        self._id_cita = id_cita
        self._fecha_hora = fecha_hora
        self._estado = EstadoCita.AGENDADA
        self._paciente = paciente
        self._doctor = doctor
        self._slot = slot

    @property
    def id_cita(self) -> str:
        return self._id_cita

    @property
    def fecha_hora(self) -> datetime:
        return self._fecha_hora

    @property
    def estado(self) -> EstadoCita:
        return self._estado

    @property
    def paciente(self):
        return self._paciente

    @property
    def doctor(self):
        return self._doctor

    @property
    def slot(self):
        return self._slot

    def set_estado(self, nuevo_estado: EstadoCita) -> None:
        self._estado = nuevo_estado

    def set_fecha_hora(self, nueva_fecha: datetime) -> None:
        self._fecha_hora = nueva_fecha

    def get_paciente(self):
        return self._paciente

    def get_doctor(self):
        return self._doctor

    def get_estado(self) -> EstadoCita:
        return self._estado

    def obtener_detalles_servicio(self) -> str:
        raise NotImplementedError("Metodo abstracto")

    def to_dict(self) -> dict:
        return {
            "id_cita": self._id_cita,
            "fecha_hora": self._fecha_hora.isoformat(),
            "estado": self._estado.value,
            "paciente": self._paciente.to_dict() if self._paciente else None,
            "doctor": self._doctor.to_dict() if self._doctor else None,
            "slot_id": self._slot.id_slot if self._slot else None,
            "tipo": self.__class__.__name__,
            "detalles": self.obtener_detalles_servicio()
        }

class CitaLaboratorio(Cita):
    def __init__(self, id_cita: str, fecha_hora: datetime, paciente, doctor, slot,
                 tipo_analisis: str, requiere_ayuno: bool):
        super().__init__(id_cita, fecha_hora, paciente, doctor, slot)
        self._tipo_analisis = tipo_analisis
        self._requiere_ayuno = requiere_ayuno

    def obtener_detalles_servicio(self) -> str:
        ayuno = "Requiere ayuno" if self._requiere_ayuno else "No requiere ayuno"
        return f"Laboratorio - {self._tipo_analisis}. {ayuno}"

    def to_dict(self) -> dict:
        data = super().to_dict()
        data["tipo_analisis"] = self._tipo_analisis
        data["requiere_ayuno"] = self._requiere_ayuno
        return data

class CitaTelemedicina(Cita):
    def __init__(self, id_cita: str, fecha_hora: datetime, paciente, doctor, slot,
                 url_plataforma: str, link_acceso: str):
        super().__init__(id_cita, fecha_hora, paciente, doctor, slot)
        self._url_plataforma = url_plataforma
        self._link_acceso = link_acceso

    def obtener_detalles_servicio(self) -> str:
        return f"Telemedicina - Plataforma: {self._url_plataforma}"

    def to_dict(self) -> dict:
        data = super().to_dict()
        data["url_plataforma"] = self._url_plataforma
        data["link_acceso"] = self._link_acceso
        return data

class ConsultaGeneral(Cita):
    def __init__(self, id_cita: str, fecha_hora: datetime, paciente, doctor, slot,
                 nro_consultorio: str):
        super().__init__(id_cita, fecha_hora, paciente, doctor, slot)
        self._nro_consultorio = nro_consultorio

    def obtener_detalles_servicio(self) -> str:
        return f"Consulta General - Consultorio: {self._nro_consultorio}"

    def to_dict(self) -> dict:
        data = super().to_dict()
        data["nro_consultorio"] = self._nro_consultorio
        return data
