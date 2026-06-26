from enum import Enum
from datetime import datetime, timedelta
from typing import List

class EstadoSlot(Enum):
    LIBRE = "LIBRE"
    RESERVADO = "RESERVADO"
    OCUPADO = "OCUPADO"

class SlotHorario:
    def __init__(self, id_slot: str, doctor, fecha_hora: datetime, duracion_minutos: int = 30):
        self._id_slot = id_slot
        self._doctor = doctor
        self._fecha_hora = fecha_hora
        self._duracion_minutos = duracion_minutos
        self._estado = EstadoSlot.LIBRE
        self._version = 0

    @property
    def id_slot(self) -> str:
        return self._id_slot

    @property
    def doctor(self):
        return self._doctor

    @property
    def fecha_hora(self) -> datetime:
        return self._fecha_hora

    @property
    def duracion_minutos(self) -> int:
        return self._duracion_minutos

    @property
    def estado(self) -> EstadoSlot:
        return self._estado

    @property
    def version(self) -> int:
        return self._version

    def get_estado(self) -> EstadoSlot:
        return self._estado

    def get_version(self) -> int:
        return self._version

    def reservar(self, version_esperada: int) -> bool:
        if self._version == version_esperada and self._estado == EstadoSlot.LIBRE:
            self._estado = EstadoSlot.RESERVADO
            self._version += 1
            return True
        return False

    def liberar(self, version_esperada: int) -> bool:
        if self._version == version_esperada and self._estado == EstadoSlot.RESERVADO:
            self._estado = EstadoSlot.LIBRE
            self._version += 1
            return True
        return False

    def ocupar(self, version_esperada: int) -> bool:
        if self._version == version_esperada and self._estado == EstadoSlot.RESERVADO:
            self._estado = EstadoSlot.OCUPADO
            self._version += 1
            return True
        return False

    def to_dict(self) -> dict:
        return {
            "id_slot": self._id_slot,
            "fecha_hora": self._fecha_hora.isoformat(),
            "duracion_minutos": self._duracion_minutos,
            "estado": self._estado.value,
            "version": self._version,
            "doctor_id": self._doctor.id if self._doctor else None
        }

class AgendaDoctor:
    def __init__(self, doctor):
        self._doctor = doctor
        self._slots: List[SlotHorario] = []

    @property
    def doctor(self):
        return self._doctor

    @property
    def slots(self) -> List[SlotHorario]:
        return self._slots

    def obtener_slots_libres(self) -> List[SlotHorario]:
        return [s for s in self._slots if s.estado == EstadoSlot.LIBRE]

    def obtener_slot_por_fecha_hora(self, fecha_hora: datetime) -> SlotHorario:
        for slot in self._slots:
            if slot.fecha_hora == fecha_hora:
                return slot
        return None

    def generar_slots(self, dia: datetime, intervalo_minutos: int = 30) -> None:
        inicio = datetime(dia.year, dia.month, dia.day, 8, 0, 0)
        fin = datetime(dia.year, dia.month, dia.day, 17, 0, 0)
        actual = inicio
        idx = len(self._slots)
        while actual < fin:
            id_slot = f"S-{self._doctor.id}-{actual.strftime('%Y%m%d%H%M')}"
            slot = SlotHorario(id_slot, self._doctor, actual, intervalo_minutos)
            self._slots.append(slot)
            actual += timedelta(minutes=intervalo_minutos)
            idx += 1

    def to_dict(self) -> dict:
        return {
            "doctor_id": self._doctor.id if self._doctor else None,
            "slots": [s.to_dict() for s in self._slots]
        }
