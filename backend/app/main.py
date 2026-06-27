import os
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api import auth, citas, usuarios
from .services.gestor_citas import GestorCitas
from .services.notificaciones import NotificadorEmail, AdaptadorSMS, NotificadorConsola
from .data.memoria import Memoria

# Cargar variables de entorno desde .env
load_dotenv()

# Forzar inicializacion de Memoria (carga datos por defecto)
_ = Memoria()

app = FastAPI(
    title="Clinica API",
    description="Backend para gestion de citas medicas - Con notificaciones reales por Email y SMS",
    version="3.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

gestor = GestorCitas.get_instancia()

# Registrar observadores de notificacion
# 1. Email (SMTP real)
gestor.enlazar_observador(NotificadorEmail())

# 2. SMS (Twilio real)
gestor.enlazar_observador(AdaptadorSMS())

# 3. Consola (fallback si no hay credenciales configuradas)
gestor.enlazar_observador(NotificadorConsola())

app.include_router(auth.router)
app.include_router(citas.router)
app.include_router(usuarios.router)

@app.get("/")
def root():
    email_configurado = bool(os.getenv("SMTP_HOST") and os.getenv("SMTP_USER"))
    sms_configurado = bool(os.getenv("TWILIO_ACCOUNT_SID") and os.getenv("TWILIO_AUTH_TOKEN"))

    return {
        "mensaje": "Bienvenido a la API de la Clinica",
        "version": "3.0.0",
        "roles_soportados": ["PACIENTE", "DOCTOR", "RECEPCIONISTA", "ADMINISTRADOR"],
        "notificaciones": {
            "email_configurado": email_configurado,
            "sms_configurado": sms_configurado,
            "instrucciones": "Configura las variables de entorno en el archivo .env para activar notificaciones reales"
        },
        "admin_default": {
            "email": "admin@clinica.com",
            "password": "admin123"
        }
    }
