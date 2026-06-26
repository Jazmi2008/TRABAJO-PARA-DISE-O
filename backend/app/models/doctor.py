from .usuario import Usuario, Rol

class Doctor(Usuario):
    def __init__(self, id: str, nombre: str, email: str, password: str, especialidad: str):
        super().__init__(id, nombre, email, password, Rol.DOCTOR)
        self._especialidad = especialidad
        self._agenda_config = None
        self._consultor = None

    @property
    def especialidad(self) -> str:
        return self._especialidad

    def consultar_agenda(self):
        if self._agenda_config:
            return self._agenda_config.obtener_agenda_doctor(self.id)
        return None

    def marcar_cita_como_completada(self, id_cita: str) -> bool:
        if self._agenda_config:
            return self._agenda_config.cambiar_estado_cita(id_cita, "COMPLETADA")
        return False

    def set_agenda_config(self, config):
        self._agenda_config = config

    def set_consultor(self, consultor):
        self._consultor = consultor

    def to_dict(self) -> dict:
        data = super().to_dict()
        data["especialidad"] = self._especialidad
        return data
