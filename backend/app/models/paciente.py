from .usuario import Usuario, Rol
from .historial_medico import HistorialMedico

class Paciente(Usuario):
    def __init__(self, id: str, nombre: str, email: str, password: str, telefono: str):
        super().__init__(id, nombre, email, password, Rol.PACIENTE)
        self._telefono = telefono
        self._historial_medico = HistorialMedico(id_historial=f"HM-{id}")
        self._gestor = None
        self._consultor = None

    @property
    def telefono(self) -> str:
        return self._telefono

    @property
    def historial_medico(self) -> HistorialMedico:
        return self._historial_medico

    def get_telefono(self) -> str:
        return self._telefono

    def consultar_cita(self, id_cita: str):
        if self._consultor:
            return self._consultor.consultar_cita(id_cita)
        return None

    def consultar_todas_mis_citas(self):
        if self._consultor:
            return self._consultor.consultar_todas_mis_citas(self.id)
        return []

    def cancelar_cita(self, id_cita: str) -> bool:
        if self._gestor:
            return self._gestor.cancelar_cita(id_cita)
        return False

    def set_gestor(self, gestor):
        self._gestor = gestor

    def set_consultor(self, consultor):
        self._consultor = consultor

    def to_dict(self) -> dict:
        data = super().to_dict()
        data["telefono"] = self._telefono
        data["historial_medico"] = self._historial_medico.to_dict()
        return data
