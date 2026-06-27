import os
import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
from ..models.cita import Cita
from ..models.notificacion import Notificacion

# Intentar importar Twilio (opcional)
try:
    from twilio.rest import Client as TwilioClient
    TWILIO_DISPONIBLE = True
except ImportError:
    TWILIO_DISPONIBLE = False

class Observador:
    def actualizar(self, cita: Cita) -> None:
        raise NotImplementedError

class NotificadorEmail(Observador):
    """Envia notificaciones reales por correo electronico usando SMTP."""

    def __init__(self):
        self._smtp_host = os.getenv("SMTP_HOST", "")
        self._smtp_port = int(os.getenv("SMTP_PORT", "587"))
        self._smtp_user = os.getenv("SMTP_USER", "")
        self._smtp_password = os.getenv("SMTP_PASSWORD", "")
        self._smtp_from = os.getenv("SMTP_FROM", self._smtp_user)
        self._habilitado = bool(self._smtp_host and self._smtp_user and self._smtp_password)

    def _enviar_email(self, destinatario: str, asunto: str, cuerpo_html: str, cuerpo_texto: str) -> bool:
        if not self._habilitado:
            print(f"[EMAIL-DESACTIVADO] Configura SMTP_HOST, SMTP_USER y SMTP_PASSWORD en variables de entorno")
            return False

        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = asunto
            msg["From"] = self._smtp_from
            msg["To"] = destinatario

            msg.attach(MIMEText(cuerpo_texto, "plain", "utf-8"))
            msg.attach(MIMEText(cuerpo_html, "html", "utf-8"))

            context = ssl.create_default_context()
            with smtplib.SMTP(self._smtp_host, self._smtp_port) as server:
                server.starttls(context=context)
                server.login(self._smtp_user, self._smtp_password)
                server.sendmail(self._smtp_from, destinatario, msg.as_string())

            print(f"[EMAIL-ENVIADO] A {destinatario}: {asunto}")
            return True
        except Exception as e:
            print(f"[EMAIL-ERROR] No se pudo enviar a {destinatario}: {str(e)}")
            return False

    def _construir_mensaje(self, cita: Cita) -> tuple:
        estado = cita.get_estado().value
        paciente = cita.get_paciente()
        doctor = cita.get_doctor()
        fecha = cita.fecha_hora.strftime("%d/%m/%Y %H:%M")

        asunto = f"Clinica - Tu cita {cita.id_cita} esta {estado}"

        cuerpo_texto = f"""
Hola {paciente.nombre},

Tu cita medica ha cambiado de estado:

ID de Cita: {cita.id_cita}
Estado: {estado}
Doctor: {doctor.nombre}
Especialidad: {getattr(doctor, 'especialidad', 'N/A')}
Fecha y Hora: {fecha}
Detalles: {cita.obtener_detalles_servicio()}

Gracias por confiar en nosotros.
Clinica
"""

        cuerpo_html = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
                <h2 style="color: #2563eb;">Notificacion de Cita Medica</h2>
                <p>Hola <strong>{paciente.nombre}</strong>,</p>
                <p>Tu cita medica ha cambiado de estado:</p>
                <div style="background: #f3f4f6; padding: 15px; border-radius: 6px; margin: 15px 0;">
                    <p><strong>ID de Cita:</strong> {cita.id_cita}</p>
                    <p><strong>Estado:</strong> <span style="color: #2563eb;">{estado}</span></p>
                    <p><strong>Doctor:</strong> {doctor.nombre}</p>
                    <p><strong>Especialidad:</strong> {getattr(doctor, 'especialidad', 'N/A')}</p>
                    <p><strong>Fecha y Hora:</strong> {fecha}</p>
                    <p><strong>Detalles:</strong> {cita.obtener_detalles_servicio()}</p>
                </div>
                <p style="color: #6b7280; font-size: 0.9rem;">Gracias por confiar en nosotros.</p>
                <p style="color: #6b7280; font-size: 0.9rem;"><strong>Clinica</strong></p>
            </div>
        </body>
        </html>
        """

        return asunto, cuerpo_html, cuerpo_texto

    def actualizar(self, cita: Cita) -> None:
        paciente = cita.get_paciente()
        if not paciente:
            return

        email = paciente.get_email()
        if not email:
            return

        asunto, cuerpo_html, cuerpo_texto = self._construir_mensaje(cita)
        self._enviar_email(email, asunto, cuerpo_html, cuerpo_texto)

        # Agregar notificacion interna al paciente
        self._agregar_notificacion_interna(paciente, cita)

    def _agregar_notificacion_interna(self, paciente, cita: Cita) -> None:
        """Agrega una notificacion interna al paciente para mostrar en el dashboard."""
        if hasattr(paciente, 'agregar_notificacion'):
            mensaje = f"Tu cita {cita.id_cita} cambio a estado {cita.get_estado().value}"
            notif = Notificacion(mensaje=mensaje, tipo="cita", cita_id=cita.id_cita)
            paciente.agregar_notificacion(notif)


class ServicioSMSTerceros:
    """Servicio SMS real usando Twilio."""

    def __init__(self):
        self._account_sid = os.getenv("TWILIO_ACCOUNT_SID", "")
        self._auth_token = os.getenv("TWILIO_AUTH_TOKEN", "")
        self._phone_number = os.getenv("TWILIO_PHONE_NUMBER", "")
        self._habilitado = TWILIO_DISPONIBLE and bool(self._account_sid and self._auth_token and self._phone_number)
        self._client = None
        if self._habilitado:
            try:
                self._client = TwilioClient(self._account_sid, self._auth_token)
            except Exception as e:
                print(f"[SMS-ERROR] No se pudo inicializar Twilio: {str(e)}")
                self._habilitado = False

    def enviar_texto(self, numero: str, mensaje: str) -> bool:
        if not self._habilitado:
            print(f"[SMS-DESACTIVADO] Instala 'twilio' y configura TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER")
            return False

        try:
            message = self._client.messages.create(
                body=mensaje,
                from_=self._phone_number,
                to=numero
            )
            print(f"[SMS-ENVIADO] A {numero}: SID={message.sid}, Estado={message.status}")
            return True
        except Exception as e:
            print(f"[SMS-ERROR] No se pudo enviar a {numero}: {str(e)}")
            return False


class AdaptadorSMS(Observador):
    """Adaptador que envia SMS reales cuando cambia el estado de una cita."""

    def __init__(self):
        self._servicio_externo = ServicioSMSTerceros()

    def actualizar(self, cita: Cita) -> None:
        paciente = cita.get_paciente()
        if not paciente or not hasattr(paciente, 'get_telefono'):
            return

        telefono = paciente.get_telefono()
        if not telefono:
            return

        mensaje = f"Clinica: Tu cita {cita.id_cita} esta {cita.get_estado().value}. Doctor: {cita.get_doctor().nombre}. Fecha: {cita.fecha_hora.strftime('%d/%m/%Y %H:%M')}"
        self._servicio_externo.enviar_texto(telefono, mensaje)


class NotificadorConsola(Observador):
    """Notificador de fallback que solo imprime en consola (para desarrollo)."""

    def actualizar(self, cita: Cita) -> None:
        paciente = cita.get_paciente()
        if paciente:
            print(f"[CONSOLA] Notificacion a {paciente.get_email()}: Cita {cita.id_cita} - Estado: {cita.get_estado().value}")
            if hasattr(paciente, 'agregar_notificacion'):
                mensaje = f"Tu cita {cita.id_cita} cambio a estado {cita.get_estado().value}"
                notif = Notificacion(mensaje=mensaje, tipo="cita", cita_id=cita.id_cita)
                paciente.agregar_notificacion(notif)
