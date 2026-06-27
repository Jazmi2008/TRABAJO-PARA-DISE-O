# MediCitas Frontend

Frontend creado para conectarse con el backend FastAPI `proyecto-clinica-backend-v2`.

## Qué incluye

- Interfaz de inicio de sesión y registro de cuentas.
- Dashboards según rol: Paciente, Doctor, Recepcionista y Administrador.
- Gestión de citas: listar, buscar, crear, cancelar, completar y ver detalle.
- Agenda médica: ver slots, generar agenda de 7 días y seleccionar horarios libres.
- Gestión de usuarios: crear, editar y eliminar usuarios desde recepción/administración.
- Historial médico: consulta para paciente y actualización para roles operativos.
- Notificaciones internas para pacientes.
- Trazabilidad local de acciones del frontend: timestamp, rol, acción y detalle.
- Pantalla de patrones de diseño: Singleton, Factory Method, Observer, Adapter, Strategy y Design by Contract.

## Cómo abrirlo

### 1. Ejecuta el backend

En la carpeta del backend:

```bash
pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```

Debe quedar activo en:

```text
http://127.0.0.1:8000
```

### 2. Abre el frontend

Opción fácil:

- Abre `index.html` con doble clic.

Opción recomendada:

```bash
cd medicitas-frontend
python -m http.server 5500
```

Luego abre:

```text
http://127.0.0.1:5500
```

## Credenciales de prueba

| Rol | Correo | Contraseña |
|---|---|---|
| Administrador | admin@clinica.com | admin123 |
| Recepcionista | recepcion@clinica.com | recepcion123 |
| Médico | carlos.mendez@clinica.com | doctor123 |
| Paciente | juan.perez@email.com | paciente123 |

## Nota importante

El backend actual no usa JWT ni sesiones reales; por eso el frontend guarda el usuario activo en `localStorage` y aplica permisos visuales por rol. Las acciones reales se ejecutan contra los endpoints disponibles del backend.

El backend entregado no expone un endpoint de trazabilidad; por eso el frontend incluye una trazabilidad local en `localStorage` para registrar las acciones ejecutadas desde la interfaz.
