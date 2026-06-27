# UNIVERSIDAD LA SALLE
## Carrera Profesional de Ingeniería de Software

---

# FUNDAMENTOS DE DISEÑO DE SOFTWARE

## TRABAJO FINAL
### Aplicación de Patrones de Diseño en un Sistema de Gestión de Citas Médicas

---

**Docente:**  
M.Sc. Ing. R. Fabrizio Calienes Rodríguez

**Integrantes:**  
- Ana Jazmín Duarte Guzmán
- Danny Quispe Cjuiro
- Selena Grisel Morales Díaz
- Dayana Briyith Carrizales Salcedo
- Rafaela Valeria Paredes Segura

---

**Arequipa, Perú — 2026**

---

# MEDICITAS FULLSTACK

Sistema de gestión de citas médicas con backend en FastAPI (Python) y frontend en React 19.

## Datos por defecto (listos para usar)

### Administrador
| Email | Password |
|-------|----------|
| admin@clinica.com | admin123 |

### Recepcionista
| Email | Password |
|-------|----------|
| recepcion@clinica.com | recepcion123 |

### Doctores
| ID | Nombre | Email | Password | Especialidad |
|----|--------|-------|----------|--------------|
| D-001 | Dr. Carlos Mendez | carlos.mendez@clinica.com | doctor123 | Cardiologia |
| D-002 | Dra. Ana Torres | ana.torres@clinica.com | doctor123 | Dermatologia |
| D-003 | Dr. Luis Ramirez | luis.ramirez@clinica.com | doctor123 | Medicina General |

### Pacientes
| ID | Nombre | Email | Password | Telefono |
|----|--------|-------|----------|----------|
| P-001 | Juan Perez | juan.perez@email.com | paciente123 | +51999111222 |
| P-002 | Maria Garcia | maria.garcia@email.com | paciente123 | +51999888777 |
| P-003 | Pedro Sanchez | pedro.sanchez@email.com | paciente123 | +51999666555 |

### Citas pre-cargadas
| ID | Paciente | Doctor | Tipo | Estado |
|----|----------|--------|------|--------|
| C-001 | Juan Perez | Dr. Carlos Mendez | Consulta General | AGENDADA |
| C-002 | Maria Garcia | Dra. Ana Torres | Consulta General | AGENDADA |
| C-003 | Pedro Sanchez | Dr. Luis Ramirez | Laboratorio | AGENDADA |

---

## Funcionalidades por Rol

### Paciente
- Dashboard con estadisticas personales y proxima cita destacada
- Ver todas sus citas (solo lectura)
- **Ver detalle completo de cita** (tipo, consultorio, link telemedicina, etc.)
- **Cancelar su propia cita** desde el modal de detalle

### Doctor
- Dashboard con estadisticas de sus citas
- Ver citas asignadas con **historial medico editable del paciente**
- **Agregar diagnosticos, alergias y medicamentos** al historial
- **Solo puede marcar citas como COMPLETADAS** (no cancelar)
- Gestionar su agenda (generar slots)

### Recepcionista
- Dashboard con estadisticas de TODAS las citas del sistema
- **Buscar citas** por: nombre de paciente, fecha o ID de cita
- **Filtrar por estado** (Todas/Agendada/Modificada/Completada/Cancelada)
- **Modificar citas**: cambiar doctor, horario o tipo
- **Cancelar y completar** cualquier cita
- Agendar nuevas citas

### Administrador
- Dashboard con estadisticas del sistema
- **CRUD de usuarios** (pacientes, doctores, recepcionistas)
- Listado de todas las citas del sistema
- **Busqueda avanzada** por doctor, paciente, fecha o recepcionista
- Gestion completa de usuarios

---

## Estructura del Proyecto

```
proyecto-clinica/
├── backend/
│   ├── app/
│   │   ├── models/       # Entidades del dominio
│   │   ├── services/     # Logica de negocio (Singleton, Strategy, Observer)
│   │   ├── factories/    # Factory Method para citas
│   │   ├── api/          # Endpoints REST
│   │   ├── data/         # Almacenamiento en memoria + datos por defecto
│   │   └── main.py       # Punto de entrada FastAPI
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── DashboardPaciente.jsx
│   │   │   ├── DashboardDoctor.jsx
│   │   │   ├── DashboardRecepcionista.jsx
│   │   │   ├── DashboardAdmin.jsx
│   │   │   ├── CitasPaciente.jsx
│   │   │   ├── CitasDoctor.jsx
│   │   │   ├── CitasRecepcionista.jsx
│   │   │   ├── AgendarCita.jsx
│   │   │   └── AgendaDoctor.jsx
│   │   ├── components/
│   │   │   ├── Layout.jsx
│   │   │   ├── Layout.css
│   │   │   ├── ProtectedRoute.jsx
│   │   │   ├── CitaCard.jsx
│   │   │   ├── SlotSelector.jsx
│   │   │   ├── HistorialMedicoCard.jsx
│   │   │   ├── HistorialMedicoEditable.jsx
│   │   │   ├── CitaDetalleModal.jsx
│   │   │   └── ModificarCitaModal.jsx
│   │   ├── services/
│   │   │   ├── api.js
│   │   │   ├── authService.js
│   │   │   ├── citaService.js
│   │   │   └── usuarioService.js
│   │   ├── contexts/
│   │   │   └── AuthContext.jsx
│   │   ├── hooks/
│   │   │   ├── useCitas.js
│   │   │   ├── useDoctores.js
│   │   │   ├── useAgenda.js
│   │   │   └── useHistorial.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   ├── vite.config.js
│   └── index.html
│
└── README.md
```

---

## Como ejecutar el BACKEND

```bash
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```

- Swagger UI: http://localhost:8000/docs
- Redoc: http://localhost:8000/redoc

---

## Como ejecutar el FRONTEND

```bash
cd frontend
python -m http.server 5500
```

- Frontend: http://127.0.0.1:5500
- El proxy en `vite.config.js` redirige `/api` al backend en `localhost:8000`

---

## MEDICITAS FRONTEND - PASOS RAPIDOS

1) Primero prende el backend:
   ```bash
   cd carpeta-del-backend
   pip install -r requirements.txt
   python -m uvicorn app.main:app --reload
   ```

2) Luego abre el frontend:
   - En Windows: doble clic en `abrir_frontend.bat`
   - O manualmente:
   ```bash
   python -m http.server 5500
   ```

3) Entra a:
   http://127.0.0.1:5500

4) Credenciales:
   | Rol | Email | Password |
   |-----|-------|----------|
   | Admin | admin@clinica.com | admin123 |
   | Recepcionista | recepcion@clinica.com | recepcion123 |
   | Medico | carlos.mendez@clinica.com | doctor123 |
   | Paciente | juan.perez@email.com | paciente123 |

5) URL del backend dentro del frontend:
   http://127.0.0.1:8000

---

## Rutas del Frontend

| Ruta | Rol | Descripcion |
|------|-----|-------------|
| `/login` | Publico | Inicio de sesion |
| `/dashboard-paciente` | PACIENTE | Dashboard personal con proxima cita |
| `/dashboard-doctor` | DOCTOR | Dashboard con historial editable |
| `/dashboard-recepcionista` | RECEPCIONISTA | Panel con busqueda y filtros |
| `/dashboard-admin` | ADMINISTRADOR | Panel de administracion de usuarios |
| `/citas-paciente` | PACIENTE | Mis citas + detalle + cancelar |
| `/citas-doctor` | DOCTOR | Citas + historial editable |
| `/citas-recepcionista` | RECEPCIONISTA | Todas las citas + buscar + modificar |
| `/agendar` | RECEPCIONISTA | Agendar nueva cita |
| `/agenda` | DOCTOR | Gestion de agenda y slots |

---

## Nuevos Endpoints del Backend

| Endpoint | Metodo | Descripcion |
|----------|--------|-------------|
| `/citas/todas` | GET | Todas las citas del sistema |
| `/citas/buscar` | GET | Buscar por fecha, nombre o ID |
| `/citas/{id}/modificar` | PUT | Modificar doctor/slot/tipo |
| `/usuarios/pacientes/{id}/historial` | GET | Obtener historial medico |
| `/usuarios/pacientes/{id}/historial` | PUT | Agregar diagnostico/alergia/medicamento |

---

## Patrones implementados (Backend)

- **Singleton**: `GestorCitas`
- **Factory Method**: `CreadorCitas` y fabricas concretas
- **Strategy**: `EstrategiaAsignacion`
- **Observer**: `NotificadorEmail`, `AdaptadorSMS`
- **Adapter**: `AdaptadorSMS` para servicio de terceros
- **DIP/ISP**: Interfaces `IConsultaCitas`, `IGestionCitas`, `IConfiguracionAgenda`
- **Optimistic Locking**: `SlotHorario` con versionado

## Patrones implementados (Frontend)

- **Context API**: `AuthContext` para autenticacion global
- **Custom Hooks**: `useCitas`, `useDoctores`, `useAgenda`, `useHistorial`
- **Protected Routes**: `ProtectedRoute` con control por rol
- **Compound-like**: `SlotSelector`, `CitaCard`, `HistorialMedicoEditable`
- **Container/Presentational**: Pages (data) + Components (UI)
- **Modal Pattern**: `CitaDetalleModal`, `ModificarCitaModal`
