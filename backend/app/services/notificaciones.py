from .gestor_citas import Observador
from ..models.cita import Cita

class NotificadorEmail(Observador):
    def actualizar(self, cita: Cita) -> None:
        paciente = cita.get_paciente()
        if paciente:
            print(f"[EMAIL] Notificacion a {paciente.get_email()}: "
                  f"Cita {cita.id_cita} - Estado: {cita.get_estado().value}")

class ServicioSMSTerceros:
    def enviar_texto(self, numero: str, mensaje: str) -> bool:
        print(f"[SMS-TERCEROS] Enviando SMS a {numero}: {mensaje}")
        return True

class AdaptadorSMS(Observador):
    def __init__(self):
        self._servicio_externo = ServicioSMSTerceros()

    def actualizar(self, cita: Cita) -> None:
        paciente = cita.get_paciente()
        if paciente and hasattr(paciente, 'get_telefono'):
            telefono = paciente.get_telefono()
            mensaje = f"Cita {cita.id_cita} - Estado: {cita.get_estado().value}"
            self._servicio_externo.enviar_texto(telefono, mensaje)
