from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from ..services.gestor_citas import GestorCitas
from ..services.autenticacion import ServicioAutenticacion
from ..factories.creador_citas import FabricaConsultaGeneral, FabricaCitaLaboratorio, FabricaCitaTelemedicina
from ..models.cita import EstadoCita

router = APIRouter(prefix="/citas", tags=["Citas"])

gestor = GestorCitas.get_instancia()
auth_service = ServicioAutenticacion()

class CrearCitaRequest(BaseModel):
    paciente_id: str
    doctor_id: str
    slot_id: str
    tipo: str
    tipo_analisis: Optional[str] = None
    requiere_ayuno: Optional[bool] = None
    url_plataforma: Optional[str] = None
    link_acceso: Optional[str] = None
    nro_consultorio: Optional[str] = None

class ModificarCitaRequest(BaseModel):
    doctor_id: Optional[str] = None
    slot_id: Optional[str] = None
    tipo: Optional[str] = None

class ModificarFechaRequest(BaseModel):
    nueva_fecha: datetime
    version_slot: int

@router.post("/")
def crear_cita(req: CrearCitaRequest):
    paciente = auth_service.obtener_usuario_por_id(req.paciente_id)
    doctor = auth_service.obtener_usuario_por_id(req.doctor_id)

    if not paciente or not doctor:
        raise HTTPException(status_code=404, detail="Paciente o doctor no encontrado")

    agenda = gestor.obtener_agenda_doctor(doctor.id)
    if not agenda:
        raise HTTPException(status_code=404, detail="Agenda no encontrada")

    slot = None
    for s in agenda.slots:
        if s.id_slot == req.slot_id:
            slot = s
            break

    if not slot:
        raise HTTPException(status_code=404, detail="Slot no encontrado")

    if req.tipo == "laboratorio":
        fabrica = FabricaCitaLaboratorio(
            req.tipo_analisis or "Sangre",
            req.requiere_ayuno or False
        )
    elif req.tipo == "telemedicina":
        fabrica = FabricaCitaTelemedicina(
            req.url_plataforma or "https://telemedicina.clinica.com",
            req.link_acceso or "https://meet.clinica.com/abc123"
        )
    else:
        fabrica = FabricaConsultaGeneral(req.nro_consultorio or "101")

    try:
        cita = gestor.registrar_cita(paciente, doctor, fabrica, slot)
        return {"cita": cita.to_dict()}
    except ValueError as e:
        raise HTTPException(status_code=409, detail=str(e))

@router.get("/todas")
def obtener_todas_las_citas():
    citas = gestor.obtener_todas_las_citas()
    return {"citas": [c.to_dict() for c in citas]}

@router.get("/buscar")
def buscar_citas(
    fecha: Optional[str] = Query(None, description="Fecha en formato YYYY-MM-DD"),
    nombre: Optional[str] = Query(None, description="Nombre del paciente (parcial)"),
    id_cita: Optional[str] = Query(None, description="ID exacto de la cita"),
    doctor_id: Optional[str] = Query(None, description="ID del doctor"),
    paciente_id: Optional[str] = Query(None, description="ID del paciente")
):
    resultados = gestor.buscar_citas(fecha=fecha, nombre=nombre, id_cita=id_cita,
                                      doctor_id=doctor_id, paciente_id=paciente_id)
    return {"citas": [c.to_dict() for c in resultados]}

@router.get("/{id_cita}")
def obtener_cita(id_cita: str):
    cita = gestor.consultar_cita(id_cita)
    if not cita:
        raise HTTPException(status_code=404, detail="Cita no encontrada")
    return {"cita": cita.to_dict()}

@router.get("/{id_cita}/detalle-completo")
def obtener_cita_detalle_completo(id_cita: str):
    cita = gestor.consultar_cita(id_cita)
    if not cita:
        raise HTTPException(status_code=404, detail="Cita no encontrada")

    detalle = cita.to_dict()
    if cita.slot:
        detalle["slot"] = cita.slot.to_dict()
    if hasattr(cita.paciente, 'to_dict'):
        detalle["paciente_completo"] = cita.paciente.to_dict()
    if hasattr(cita.doctor, 'to_dict'):
        detalle["doctor_completo"] = cita.doctor.to_dict()

    return {"cita": detalle}

@router.put("/{id_cita}/modificar")
def modificar_cita(id_cita: str, req: ModificarCitaRequest):
    cita = gestor.consultar_cita(id_cita)
    if not cita:
        raise HTTPException(status_code=404, detail="Cita no encontrada")

    nuevo_doctor = None
    if req.doctor_id:
        nuevo_doctor = auth_service.obtener_usuario_por_id(req.doctor_id)
        if not nuevo_doctor:
            raise HTTPException(status_code=404, detail="Doctor no encontrado")

    nuevo_slot = None
    if req.slot_id:
        doctor_para_slot = nuevo_doctor or cita.doctor
        agenda = gestor.obtener_agenda_doctor(doctor_para_slot.id)
        if not agenda:
            raise HTTPException(status_code=404, detail="Agenda no encontrada")
        for s in agenda.slots:
            if s.id_slot == req.slot_id:
                nuevo_slot = s
                break
        if not nuevo_slot:
            raise HTTPException(status_code=404, detail="Slot no encontrado")

    ok = gestor.modificar_cita_completa(id_cita, nuevo_doctor, nuevo_slot, req.tipo)
    if not ok:
        raise HTTPException(status_code=409, detail="No se pudo modificar la cita")
    return {"mensaje": "Cita modificada exitosamente"}

@router.get("/paciente/{paciente_id}")
def citas_por_paciente(paciente_id: str):
    return {"citas": [c.to_dict() for c in gestor.consultar_todas_mis_citas(paciente_id)]}

@router.get("/doctor/{doctor_id}")
def citas_por_doctor(doctor_id: str):
    return {"citas": [c.to_dict() for c in gestor.obtener_citas_por_doctor(doctor_id)]}

@router.put("/{id_cita}/fecha")
def modificar_fecha(id_cita: str, req: ModificarFechaRequest):
    ok = gestor.actualizar_fecha_cita(id_cita, req.nueva_fecha, req.version_slot)
    if not ok:
        raise HTTPException(status_code=409, detail="No se pudo modificar la cita")
    return {"mensaje": "Cita modificada"}

@router.put("/{id_cita}/cancelar")
def cancelar_cita(id_cita: str):
    ok = gestor.cancelar_cita(id_cita)
    if not ok:
        raise HTTPException(status_code=404, detail="Cita no encontrada")
    return {"mensaje": "Cita cancelada"}

@router.put("/{id_cita}/completar")
def completar_cita(id_cita: str):
    ok = gestor.cambiar_estado_cita(id_cita, EstadoCita.COMPLETADA)
    if not ok:
        raise HTTPException(status_code=404, detail="Cita no encontrada")
    return {"mensaje": "Cita completada"}
