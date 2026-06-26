from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from ..services.autenticacion import ServicioAutenticacion
from ..models.usuario import Usuario, Rol

router = APIRouter(prefix="/auth", tags=["Autenticacion"])

auth_service = ServicioAutenticacion()

class LoginRequest(BaseModel):
    email: str
    password: str

class RegistroRequest(BaseModel):
    id: str
    nombre: str
    email: str
    password: str
    rol: str
    telefono: str = ""
    especialidad: str = ""

@router.post("/login")
def login(req: LoginRequest):
    usuario = auth_service.iniciar_sesion(req.email, req.password)
    if not usuario:
        raise HTTPException(status_code=401, detail="Credenciales invalidas")
    return {"usuario": usuario.to_dict()}

@router.post("/registro")
def registro(req: RegistroRequest):
    from ..models.paciente import Paciente
    from ..models.doctor import Doctor

    rol = Rol(req.rol.upper())
    if rol == Rol.PACIENTE:
        usuario = Paciente(req.id, req.nombre, req.email, req.password, req.telefono)
    elif rol == Rol.DOCTOR:
        usuario = Doctor(req.id, req.nombre, req.email, req.password, req.especialidad)
    else:
        usuario = Usuario(req.id, req.nombre, req.email, req.password, rol)

    ok = auth_service.registrar_usuario(usuario)
    if not ok:
        raise HTTPException(status_code=400, detail="El usuario ya existe")
    return {"mensaje": "Usuario registrado", "usuario": usuario.to_dict()}

@router.get("/usuarios")
def listar_usuarios():
    from ..data.memoria import Memoria
    mem = Memoria()
    return {"usuarios": [u.to_dict() for u in mem.usuarios]}
