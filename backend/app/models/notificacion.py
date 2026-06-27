from datetime import datetime
import uuid

class Notificacion:
    def __init__(self, mensaje: str, tipo: str = "cita", cita_id: str = None):
        self._id = str(uuid.uuid4())
        self._mensaje = mensaje
        self._tipo = tipo
        self._cita_id = cita_id
        self._fecha = datetime.now()
        self._leida = False

    @property
    def id(self) -> str:
        return self._id

    @property
    def mensaje(self) -> str:
        return self._mensaje

    @property
    def tipo(self) -> str:
        return self._tipo

    @property
    def cita_id(self) -> str:
        return self._cita_id

    @property
    def fecha(self) -> datetime:
        return self._fecha

    @property
    def leida(self) -> bool:
        return self._leida

    def marcar_leida(self) -> None:
        self._leida = True

    def to_dict(self) -> dict:
        return {
            "id": self._id,
            "mensaje": self._mensaje,
            "tipo": self._tipo,
            "cita_id": self._cita_id,
            "fecha": self._fecha.isoformat(),
            "leida": self._leida
        }
