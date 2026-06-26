from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api import auth, citas, usuarios
from .services.gestor_citas import GestorCitas
from .services.notificaciones import NotificadorEmail, AdaptadorSMS
from .data.memoria import Memoria

# Forzar inicialización de Memoria (carga datos por defecto)
_ = Memoria()

app = FastAPI(
    title="Clinica API",
    description="Backend para gestion de citas medicas",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

gestor = GestorCitas.get_instancia()
gestor.enlazar_observador(NotificadorEmail())
gestor.enlazar_observador(AdaptadorSMS())

app.include_router(auth.router)
app.include_router(citas.router)
app.include_router(usuarios.router)

@app.get("/")
def root():
    return {"mensaje": "Bienvenido a la API de la Clinica"}
