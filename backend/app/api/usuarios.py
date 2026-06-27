from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from ..services.autenticacion import ServicioAutenticacion
from ..services.gestor_citas import GestorCitas
from ..models.usuario import Usuario, Rol
from ..models.paciente import Paciente
from ..models.doctor import Doctor
from datetime import datetime, timedelta

router = APIRouter(prefix="/usuarios", tags=["Usuarios"])

auth_service = ServicioAutenticacion()
gestor = GestorCitas.get_instancia()

class ActualizarHistorialRequest(BaseModel):
    diagnostico: Optional[str] = None
    alergia: Optional[str] = None
    medicamento: Optional[str] = None

class CrearUsuarioRequest(BaseModel):
    id: str
    nombre: str
    email: str
    password: str
    rol: str
    telefono: Optional[str] = ""
    especialidad: Optional[str] = ""

class ActualizarUsuarioRequest(BaseModel):
    nombre: Optional[str] = None
    email: Optional[str] = None
    password: Optional[str] = None
    telefono: Optional[str] = None
    especialidad: Optional[str] = None

# ==================== LISTAR POR ROL ====================

@router.get("/doctores")
def listar_doctores():
    from ..data.memoria import Memoria
    from ..models.usuario import Rol
    mem = Memoria()
    doctores = [u.to_dict() for u in mem.usuarios if u.rol == Rol.DOCTOR]
    return {"doctores": doctores}

@router.get("/pacientes")
def listar_pacientes():
    from ..data.memoria import Memoria
    from ..models.usuario import Rol
    mem = Memoria()
    pacientes = [u.to_dict() for u in mem.usuarios if u.rol == Rol.PACIENTE]
    return {"pacientes": pacientes}

@router.get("/recepcionistas")
def listar_recepcionistas():
    from ..data.memoria import Memoria
    from ..models.usuario import Rol
    mem = Memoria()
    recepcionistas = [u.to_dict() for u in mem.usuarios if u.rol == Rol.RECEPCIONISTA]
    return {"recepcionistas": recepcionistas}

@router.get("/administradores")
def listar_administradores():
    from ..data.memoria import Memoria
    from ..models.usuario import Rol
    mem = Memoria()
    admins = [u.to_dict() for u in mem.usuarios if u.rol == Rol.ADMINISTRADOR]
    return {"administradores": admins}

# ==================== CRUD USUARIOS ====================

@router.get("/todos")
def listar_todos_usuarios():
    from ..data.memoria import Memoria
    mem = Memoria()
    return {
        "usuarios": [u.to_dict() for u in mem.usuarios],
        "estadisticas": auth_service.obtener_estadisticas()
    }

@router.post("/")
def crear_usuario(req: CrearUsuarioRequest):
    try:
        rol = Rol(req.rol.upper())
    except ValueError:
        raise HTTPException(status_code=400, detail="Rol invalido")

    if rol == Rol.PACIENTE:
        usuario = Paciente(req.id, req.nombre, req.email, req.password, req.telefono or "")
    elif rol == Rol.DOCTOR:
        usuario = Doctor(req.id, req.nombre, req.email, req.password, req.especialidad or "")
    else:
        usuario = Usuario(req.id, req.nombre, req.email, req.password, rol)

    ok = auth_service.registrar_usuario(usuario)
    if not ok:
        raise HTTPException(status_code=400, detail="El usuario ya existe (email duplicado)")
    return {"mensaje": "Usuario creado exitosamente", "usuario": usuario.to_dict()}

@router.get("/{usuario_id}")
def obtener_usuario(usuario_id: str):
    usuario = auth_service.buscar_por_id(usuario_id)
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return {"usuario": usuario.to_dict()}

@router.put("/{usuario_id}")
def actualizar_usuario(usuario_id: str, req: ActualizarUsuarioRequest):
    datos = {}
    if req.nombre is not None:
        datos["nombre"] = req.nombre
    if req.email is not None:
        datos["email"] = req.email
    if req.password is not None:
        datos["password"] = req.password
    if req.telefono is not None:
        datos["telefono"] = req.telefono
    if req.especialidad is not None:
        datos["especialidad"] = req.especialidad

    usuario = auth_service.actualizar_usuario(usuario_id, datos)
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado o email duplicado")
    return {"mensaje": "Usuario actualizado", "usuario": usuario.to_dict()}

@router.delete("/{usuario_id}")
def eliminar_usuario(usuario_id: str):
    ok = auth_service.eliminar_usuario(usuario_id)
    if not ok:
        raise HTTPException(status_code=400, detail="No se pudo eliminar el usuario")
    return {"mensaje": "Usuario eliminado exitosamente"}

# ==================== NOTIFICACIONES ====================

@router.get("/{paciente_id}/notificaciones")
def obtener_notificaciones_paciente(paciente_id: str):
    """Obtener las notificaciones del paciente (para el dashboard)"""
    paciente = auth_service.obtener_usuario_por_id(paciente_id)
    if not paciente:
        raise HTTPException(status_code=404, detail="Paciente no encontrado")

    if not hasattr(paciente, 'obtener_notificaciones'):
        return {"notificaciones": [], "no_leidas": 0}

    notifs = paciente.obtener_notificaciones()
    return {
        "notificaciones": [n.to_dict() for n in notifs],
        "no_leidas": sum(1 for n in notifs if not n.leida)
    }

@router.put("/{paciente_id}/notificaciones/{notificacion_id}/leer")
def marcar_notificacion_leida(paciente_id: str, notificacion_id: str):
    """Marcar una notificacion como leida"""
    paciente = auth_service.obtener_usuario_por_id(paciente_id)
    if not paciente:
        raise HTTPException(status_code=404, detail="Paciente no encontrado")

    if not hasattr(paciente, 'marcar_notificacion_leida'):
        raise HTTPException(status_code=400, detail="El usuario no tiene notificaciones")

    ok = paciente.marcar_notificacion_leida(notificacion_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Notificacion no encontrada")
    return {"mensaje": "Notificacion marcada como leida"}

# ==================== HISTORIAL MEDICO ====================

@router.get("/pacientes/{paciente_id}/historial")
def obtener_historial_paciente(paciente_id: str):
    paciente = auth_service.obtener_usuario_por_id(paciente_id)
    if not paciente:
        raise HTTPException(status_code=404, detail="Paciente no encontrado")

    if hasattr(paciente, 'historial_medico'):
        return {"historial": paciente.historial_medico.to_dict()}
    return {"historial": None}

@router.put("/pacientes/{paciente_id}/historial")
def actualizar_historial_paciente(paciente_id: str, req: ActualizarHistorialRequest):
    paciente = auth_service.obtener_usuario_por_id(paciente_id)
    if not paciente:
        raise HTTPException(status_code=404, detail="Paciente no encontrado")

    if not hasattr(paciente, 'historial_medico'):
        raise HTTPException(status_code=400, detail="El paciente no tiene historial medico")

    historial = paciente.historial_medico

    if req.diagnostico:
        historial.agregar_diagnostico(req.diagnostico)
    if req.alergia:
        historial.agregar_alergia(req.alergia)
    if req.medicamento:
        historial.agregar_medicamento(req.medicamento)

    return {
        "mensaje": "Historial actualizado",
        "historial": historial.to_dict()
    }

# ==================== AGENDA DOCTOR ====================

@router.post("/{doctor_id}/agenda/generar")
def generar_agenda(doctor_id: str, dias: int = 7):
    doctor = auth_service.obtener_usuario_por_id(doctor_id)
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor no encontrado")

    agenda = gestor.obtener_agenda_doctor(doctor_id)
    if not agenda:
        from ..models.agenda import AgendaDoctor
        agenda = AgendaDoctor(doctor)
        from ..data.memoria import Memoria
        Memoria().agendas[doctor_id] = agenda

    hoy = datetime.now()
    for i in range(dias):
        dia = hoy + timedelta(days=i)
        agenda.generar_slots(dia)

    return {"agenda": agenda.to_dict()}

@router.get("/{doctor_id}/agenda")
def obtener_agenda(doctor_id: str):
    agenda = gestor.obtener_agenda_doctor(doctor_id)
    if not agenda:
        raise HTTPException(status_code=404, detail="Agenda no encontrada")
    return {"agenda": agenda.to_dict()}

@router.get("/{doctor_id}/agenda/slots-libres")
def slots_libres(doctor_id: str):
    agenda = gestor.obtener_agenda_doctor(doctor_id)
    if not agenda:
        raise HTTPException(status_code=404, detail="Agenda no encontrada")
    return {"slots": [s.to_dict() for s in agenda.obtener_slots_libres()]}
