from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from ..services.autenticacion import ServicioAutenticacion
from ..services.gestor_citas import GestorCitas
from datetime import datetime, timedelta

router = APIRouter(prefix="/usuarios", tags=["Usuarios"])

auth_service = ServicioAutenticacion()
gestor = GestorCitas.get_instancia()

class ActualizarHistorialRequest(BaseModel):
    diagnostico: Optional[str] = None
    alergia: Optional[str] = None
    medicamento: Optional[str] = None

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

@router.get("/pacientes/{paciente_id}/historial")
def obtener_historial_paciente(paciente_id: str):
    """Obtener el historial medico completo de un paciente"""
    paciente = auth_service.obtener_usuario_por_id(paciente_id)
    if not paciente:
        raise HTTPException(status_code=404, detail="Paciente no encontrado")

    if hasattr(paciente, 'historial_medico'):
        return {"historial": paciente.historial_medico.to_dict()}
    return {"historial": None}

@router.put("/pacientes/{paciente_id}/historial")
def actualizar_historial_paciente(paciente_id: str, req: ActualizarHistorialRequest):
    """Agregar diagnostico, alergia o medicamento al historial del paciente"""
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
