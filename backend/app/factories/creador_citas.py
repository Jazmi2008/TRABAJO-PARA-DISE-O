from abc import ABC, abstractmethod
from datetime import datetime
from ..models.cita import Cita, CitaLaboratorio, CitaTelemedicina, ConsultaGeneral
from ..models.agenda import SlotHorario

class CreadorCitas(ABC):
    @abstractmethod
    def crear_cita(self, paciente, doctor, slot: SlotHorario) -> Cita:
        pass

class FabricaCitaLaboratorio(CreadorCitas):
    def __init__(self, tipo_analisis: str = "Sangre", requiere_ayuno: bool = False):
        self._tipo_analisis = tipo_analisis
        self._requiere_ayuno = requiere_ayuno

    def crear_cita(self, paciente, doctor, slot: SlotHorario) -> Cita:
        return CitaLaboratorio(
            id_cita="",
            fecha_hora=slot.fecha_hora,
            paciente=paciente,
            doctor=doctor,
            slot=slot,
            tipo_analisis=self._tipo_analisis,
            requiere_ayuno=self._requiere_ayuno
        )

class FabricaCitaTelemedicina(CreadorCitas):
    def __init__(self, url_plataforma: str = "https://telemedicina.clinica.com",
                 link_acceso: str = "https://meet.clinica.com/abc123"):
        self._url_plataforma = url_plataforma
        self._link_acceso = link_acceso

    def crear_cita(self, paciente, doctor, slot: SlotHorario) -> Cita:
        return CitaTelemedicina(
            id_cita="",
            fecha_hora=slot.fecha_hora,
            paciente=paciente,
            doctor=doctor,
            slot=slot,
            url_plataforma=self._url_plataforma,
            link_acceso=self._link_acceso
        )

class FabricaConsultaGeneral(CreadorCitas):
    def __init__(self, nro_consultorio: str = "101"):
        self._nro_consultorio = nro_consultorio

    def crear_cita(self, paciente, doctor, slot: SlotHorario) -> Cita:
        return ConsultaGeneral(
            id_cita="",
            fecha_hora=slot.fecha_hora,
            paciente=paciente,
            doctor=doctor,
            slot=slot,
            nro_consultorio=self._nro_consultorio
        )
