/* MediCitas - App web funcional sin dependencias externas.
   Implementa: Singleton+Roles, Factory Method, Observer extendido,
   Adapter SMS, Strategy, Design by Contract, trazabilidad y alertas predictivas. */

(() => {
  "use strict";

  const STORAGE_KEY = "medicitas_app_completa_v1";
  const SESSION_KEY = "medicitas_session_v1";

  const Rol = Object.freeze({
    RECEPCIONISTA: "RECEPCIONISTA",
    PACIENTE: "PACIENTE",
    MEDICO: "MEDICO",
    ADMIN: "ADMIN",
  });

  const EstadoCita = Object.freeze({
    PENDIENTE: "PENDIENTE",
    CONFIRMADA: "CONFIRMADA",
    CANCELADA: "CANCELADA",
  });

  const TipoCita = Object.freeze({
    CONSULTA: "consulta",
    TELEMEDICINA: "telemedicina",
    LABORATORIO: "laboratorio",
  });

  const Estrategia = Object.freeze({
    DISPONIBILIDAD: "DISPONIBILIDAD",
    URGENCIA: "URGENCIA",
    ORDEN_LLEGADA: "ORDEN_LLEGADA",
  });

  const PERMISOS = Object.freeze({
    [Rol.RECEPCIONISTA]: [
      "CREATE_APPOINTMENT", "EDIT_APPOINTMENT", "CANCEL_APPOINTMENT", "VIEW_ALL_APPOINTMENTS",
      "REGISTER_PATIENT", "SEARCH", "VIEW_PATIENTS", "VIEW_NOTIFICATIONS",
    ],
    [Rol.PACIENTE]: [
      "VIEW_OWN_APPOINTMENTS", "CONFIRM_OWN_APPOINTMENT", "CANCEL_OWN_APPOINTMENT",
      "VIEW_OWN_HISTORY", "SEARCH", "VIEW_NOTIFICATIONS",
    ],
    [Rol.MEDICO]: [
      "VIEW_OWN_AGENDA", "BLOCK_SLOT", "VIEW_ASSIGNED_PATIENTS", "SEARCH", "VIEW_NOTIFICATIONS",
    ],
    [Rol.ADMIN]: [
      "MANAGE_ACCOUNTS", "MODIFY_ACCOUNTS", "VIEW_LOGS", "VIEW_ALERTS", "VIEW_ALL_APPOINTMENTS",
      "CHANGE_STRATEGY", "VIEW_PATIENTS", "SEARCH", "VIEW_NOTIFICATIONS", "REGISTER_PATIENT",
      "CREATE_APPOINTMENT", "EDIT_APPOINTMENT", "CANCEL_APPOINTMENT",
    ],
  });

  const HORARIOS = ["08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00"];

  const SPECIALTIES = ["Medicina General", "Telemedicina", "Laboratorio", "Pediatría", "Dermatología", "Ginecología", "Traumatología"];

  const Demo = {
    users: [
      { id: "U001", name: "Administrador", email: "admin@medicitas.com", password: "admin123", role: Rol.ADMIN, status: "ACTIVO", avatar: "AD", phone: "900000001" },
      { id: "U002", name: "Recepción Central", email: "recepcion@medicitas.com", password: "recep123", role: Rol.RECEPCIONISTA, status: "ACTIVO", avatar: "RC", phone: "900000002" },
      { id: "U003", name: "Ana Duarte", email: "ana@medicitas.com", password: "paciente123", role: Rol.PACIENTE, status: "ACTIVO", avatar: "AN", phone: "984123456", patientId: "P001" },
      { id: "U004", name: "Carlos Quispe", email: "carlos@medicitas.com", password: "paciente123", role: Rol.PACIENTE, status: "ACTIVO", avatar: "CQ", phone: "985234567", patientId: "P002" },
      { id: "U005", name: "Selena Morales", email: "selena@medicitas.com", password: "paciente123", role: Rol.PACIENTE, status: "ACTIVO", avatar: "SM", phone: "986345678", patientId: "P003" },
      { id: "U006", name: "Dr. Smith", email: "smith@medicitas.com", password: "medico123", role: Rol.MEDICO, status: "ACTIVO", avatar: "DS", phone: "987456321", doctorId: "M001" },
      { id: "U007", name: "Dra. Ramos", email: "ramos@medicitas.com", password: "medico123", role: Rol.MEDICO, status: "ACTIVO", avatar: "DR", phone: "987456322", doctorId: "M002" },
      { id: "U008", name: "Dr. Torres", email: "torres@medicitas.com", password: "medico123", role: Rol.MEDICO, status: "ACTIVO", avatar: "DT", phone: "987456323", doctorId: "M003" },
    ],
    patients: [
      { id: "P001", name: "Ana Duarte", dni: "70000001", phone: "984123456", email: "ana@medicitas.com", birth: "1999-04-18", history: [] },
      { id: "P002", name: "Carlos Quispe", dni: "70000002", phone: "985234567", email: "carlos@medicitas.com", birth: "1994-09-02", history: [] },
      { id: "P003", name: "Selena Morales", dni: "70000003", phone: "986345678", email: "selena@medicitas.com", birth: "2001-02-15", history: [] },
    ],
    doctors: [
      { id: "M001", name: "Dr. Smith", specialty: "Medicina General", email: "smith@medicitas.com", phone: "987456321", assignedPatients: ["P001", "P002"], blockedSlots: [] },
      { id: "M002", name: "Dra. Ramos", specialty: "Laboratorio", email: "ramos@medicitas.com", phone: "987456322", assignedPatients: ["P003"], blockedSlots: [] },
      { id: "M003", name: "Dr. Torres", specialty: "Telemedicina", email: "torres@medicitas.com", phone: "987456323", assignedPatients: ["P001", "P003"], blockedSlots: [] },
    ],
    appointments: [
      { id: "C001", type: TipoCita.CONSULTA, patientId: "P001", doctorId: "M001", date: "2026-07-10", time: "09:00", status: EstadoCita.PENDIENTE, detail: "Consulta general", createdAt: "2026-06-25 09:00", updatedAt: "2026-06-25 09:00" },
      { id: "C002", type: TipoCita.TELEMEDICINA, patientId: "P002", doctorId: "M003", date: "2026-07-11", time: "10:30", status: EstadoCita.CONFIRMADA, detail: "https://meet.example.com/abc", createdAt: "2026-06-25 09:10", updatedAt: "2026-06-25 09:20" },
      { id: "C003", type: TipoCita.LABORATORIO, patientId: "P003", doctorId: "M002", date: "2026-07-12", time: "08:00", status: EstadoCita.PENDIENTE, detail: "Hemograma · requiere ayuno", createdAt: "2026-06-25 09:15", updatedAt: "2026-06-25 09:15" },
    ],
    notifications: [],
    smsOutbox: [],
    logs: [],
    settings: { strategy: Estrategia.DISPONIBILIDAD, notifyBrowser: false },
  };

  const labels = {
    [TipoCita.CONSULTA]: "Consulta general",
    [TipoCita.TELEMEDICINA]: "Telemedicina",
    [TipoCita.LABORATORIO]: "Laboratorio",
    [EstadoCita.PENDIENTE]: "Pendiente",
    [EstadoCita.CONFIRMADA]: "Confirmada",
    [EstadoCita.CANCELADA]: "Cancelada",
    [Rol.ADMIN]: "Administrador",
    [Rol.RECEPCIONISTA]: "Recepcionista",
    [Rol.PACIENTE]: "Paciente",
    [Rol.MEDICO]: "Médico",
  };

  // ===== POO explícita: clases de dominio y excepciones propias =====
  // Estas clases permiten sustentar el paradigma de Orientación a Objetos dentro del proyecto.
  class MediCitasException extends Error {
    constructor(message, code = "MEDICITAS_EXCEPTION") {
      super(cleanExceptionMessage(message));
      this.name = this.constructor.name;
      this.code = code;
    }
  }

  class ValidacionException extends MediCitasException {
    constructor(message) { super(message, "VALIDACION"); }
  }

  class AccesoNoPermitidoException extends MediCitasException {
    constructor(message) { super(message, "ACCESO_NO_PERMITIDO"); }
  }

  class EntidadNoEncontradaException extends MediCitasException {
    constructor(message) { super(message, "ENTIDAD_NO_ENCONTRADA"); }
  }

  class EstadoInvalidoException extends MediCitasException {
    constructor(message) { super(message, "ESTADO_INVALIDO"); }
  }

  class HorarioOcupadoException extends MediCitasException {
    constructor(message) { super(message, "HORARIO_OCUPADO"); }
  }

  class Usuario {
    constructor({ id, name, email, password, role, status = "ACTIVO", avatar = "", phone = "", patientId = "", doctorId = "" }) {
      this.id = id;
      this.name = name;
      this.email = email;
      this.password = password;
      this.role = role;
      this.status = status;
      this.avatar = avatar || initials(name);
      this.phone = phone;
      if (patientId) this.patientId = patientId;
      if (doctorId) this.doctorId = doctorId;
    }

    tienePermiso(action) {
      return PERMISOS[this.role]?.includes(action) || false;
    }

    toJSON() {
      return { ...this };
    }
  }

  class Paciente {
    constructor({ id, name, dni = "", phone = "", email = "", birth = "", history = [] }) {
      this.id = id;
      this.name = name;
      this.dni = dni;
      this.phone = phone;
      this.email = email;
      this.birth = birth;
      this.history = Array.isArray(history) ? history : [];
    }

    agregarHistorial(evento) {
      this.history.push(evento);
    }

    toJSON() {
      return { ...this };
    }
  }

  class Medico {
    constructor({ id, name, specialty = "Medicina General", email = "", phone = "", assignedPatients = [], blockedSlots = [] }) {
      this.id = id;
      this.name = name;
      this.specialty = specialty;
      this.email = email;
      this.phone = phone;
      this.assignedPatients = Array.isArray(assignedPatients) ? assignedPatients : [];
      this.blockedSlots = Array.isArray(blockedSlots) ? blockedSlots : [];
    }

    asignarPaciente(patientId) {
      if (!this.assignedPatients.includes(patientId)) this.assignedPatients.push(patientId);
    }

    toJSON() {
      return { ...this };
    }
  }

  class Cita {
    constructor({ id, type, patientId, doctorId, date, time, status = EstadoCita.PENDIENTE, detail = "", createdAt = now(), updatedAt = now() }) {
      this.id = id;
      this.type = type;
      this.patientId = patientId;
      this.doctorId = doctorId;
      this.date = date;
      this.time = time;
      this.status = status;
      this.detail = detail;
      this.createdAt = createdAt;
      this.updatedAt = updatedAt;
    }

    resumen() {
      return `${labels[this.type] || this.type} · ${this.date} ${this.time}`;
    }

    cambiarEstado(status) {
      Contract.require(Object.values(EstadoCita).includes(status), "EstadoInvalidoException: Estado de cita inválido.");
      this.status = status;
      this.updatedAt = now();
    }

    toJSON() {
      return { ...this };
    }
  }

  class CitaConsulta extends Cita {
    constructor(data) {
      super({ ...data, type: TipoCita.CONSULTA, detail: data.detail || "Consulta general" });
    }
  }

  class CitaTelemedicina extends Cita {
    constructor(data) {
      super({ ...data, type: TipoCita.TELEMEDICINA, detail: data.detail || "Link pendiente de envío" });
    }
  }

  class CitaLaboratorio extends Cita {
    constructor(data) {
      super({ ...data, type: TipoCita.LABORATORIO, detail: data.detail || "Examen por definir" });
    }
  }

  const ExceptionFactory = {
    from(message, Fallback = ValidacionException) {
      const raw = String(message || "Ocurrió un error inesperado.");
      if (raw.includes("AccesoNoPermitidoException")) return new AccesoNoPermitidoException(raw);
      if (raw.includes("CitaNoEncontradaException") || raw.includes("Cuenta no encontrada") || raw.includes("Paciente no encontrado")) return new EntidadNoEncontradaException(raw);
      if (raw.includes("IllegalStateException")) {
        if (raw.toLowerCase().includes("horario") || raw.toLowerCase().includes("ocupado")) return new HorarioOcupadoException(raw);
        return new EstadoInvalidoException(raw);
      }
      if (raw.includes("EstadoInvalidoException")) return new EstadoInvalidoException(raw);
      return new Fallback(raw);
    },
  };

  const ArchitectureCatalog = [
    {
      title: "Paradigma POO",
      body: "Se agregaron clases de dominio: Usuario, Paciente, Medico, Cita y subclases CitaConsulta, CitaTelemedicina y CitaLaboratorio. Cada clase encapsula datos y comportamiento.",
      where: "app.js · sección POO explícita"
    },
    {
      title: "Factory Method",
      body: "CitaFactory decide qué tipo de cita crear según el tipo seleccionado: consulta, telemedicina o laboratorio.",
      where: "CitaFactory.create(cita)"
    },
    {
      title: "Strategy",
      body: "Strategy.assign cambia la forma de asignar horarios sin modificar el formulario de citas: disponibilidad, urgencia u orden de llegada.",
      where: "Configuración · Estrategias"
    },
    {
      title: "Observer",
      body: "Observer.notifyAppointment avisa automáticamente a paciente, médico y administrador cuando una cita se crea, modifica, confirma o cancela.",
      where: "Notificaciones + Trazabilidad"
    },
    {
      title: "Adapter",
      body: "SMSAdapter desacopla el envío de SMS. Hoy simula el envío, pero podría reemplazarse por Twilio, AWS SNS u otro proveedor.",
      where: "Configuración · SMSAdapter"
    },
    {
      title: "Manejo de excepciones",
      body: "Se agregaron excepciones personalizadas y un manejador central App.handleError para mostrar errores, evitar caídas y registrar eventos críticos.",
      where: "MediCitasException + Contract.require"
    }
  ];

  const App = {
    state: null,
    session: null,
    view: "dashboard",
    query: "",
    filters: {},
    lastToastTimer: null,

    start() {
      this.state = Store.load();
      this.session = Store.loadSession();
      if (this.state.logs.length === 0) {
        Trace.registrar("SISTEMA", "INICIO", "Sistema MediCitas iniciado con datos demo");
      }
      this.hydrateDemoHistories();
      this.render();
    },

    hydrateDemoHistories() {
      let changed = false;
      this.state.appointments.forEach(cita => {
        const p = this.findPatient(cita.patientId);
        if (p && !p.history.some(h => h.appointmentId === cita.id && h.action === "CITA_INICIAL")) {
          p.history.push({ id: genId("H"), ts: now(), appointmentId: cita.id, action: "CITA_INICIAL", status: cita.status, detail: `Cita ${labels[cita.type]} registrada para ${cita.date} ${cita.time}` });
          changed = true;
        }
      });
      if (changed) Store.save();
    },

    currentUser() {
      if (!this.session?.userId) return null;
      return this.state.users.find(u => u.id === this.session.userId) || null;
    },

    has(action) {
      const user = this.currentUser();
      return !!user && PERMISOS[user.role]?.includes(action);
    },

    require(action) {
      const user = this.currentUser();
      if (!user) throw new AccesoNoPermitidoException("Debe iniciar sesión.");
      const usuario = new Usuario(user);
      if (!usuario.tienePermiso(action)) {
        Trace.registrar(user.role, "ACCESO_DENEGADO", `${user.name} intentó ejecutar ${action}`);
        throw new AccesoNoPermitidoException(`El rol ${user.role} no tiene permiso para ${action}.`);
      }
    },

    findPatient(id) { return this.state.patients.find(p => p.id === id); },
    findDoctor(id) { return this.state.doctors.find(d => d.id === id); },
    findUser(id) { return this.state.users.find(u => u.id === id); },
    patientUser(patientId) { return this.state.users.find(u => u.role === Rol.PACIENTE && u.patientId === patientId); },
    doctorUser(doctorId) { return this.state.users.find(u => u.role === Rol.MEDICO && u.doctorId === doctorId); },

    render() {
      const root = document.getElementById("app");
      if (!this.currentUser()) {
        root.innerHTML = Views.login();
        return;
      }
      root.innerHTML = Views.layout();
      const content = document.getElementById("content");
      const view = this.view;
      if (view === "dashboard") content.innerHTML = Views.dashboard();
      if (view === "appointments") content.innerHTML = Views.appointments();
      if (view === "patients") content.innerHTML = Views.patients();
      if (view === "agenda") content.innerHTML = Views.agenda();
      if (view === "history") content.innerHTML = Views.history();
      if (view === "accounts") content.innerHTML = Views.accounts();
      if (view === "logs") content.innerHTML = Views.logs();
      if (view === "alerts") content.innerHTML = Views.alerts();
      if (view === "notifications") content.innerHTML = Views.notifications();
      if (view === "settings") content.innerHTML = Views.settings();
      if (view === "search") content.innerHTML = Views.search();
    },

    setView(view) {
      this.view = view;
      this.closeModal();
      this.render();
    },

    toast(message, type = "ok") {
      const root = document.getElementById("toast-root");
      root.innerHTML = `<div class="toast ${type}"><b>${type === "error" ? "Error" : type === "warn" ? "Aviso" : "Correcto"}</b><div>${esc(message)}</div></div>`;
      clearTimeout(this.lastToastTimer);
      this.lastToastTimer = setTimeout(() => { root.innerHTML = ""; }, 3800);
    },

    handleError(err) {
      const handled = err instanceof MediCitasException
        ? err
        : new MediCitasException(err?.message || "Ocurrió un error inesperado.", "ERROR_NO_CONTROLADO");
      try {
        if (this.state?.logs) {
          const user = this.currentUser();
          this.state.logs.push({
            id: genId("L"),
            ts: now(),
            rol: user?.role || "SISTEMA",
            accion: "EXCEPCION_CONTROLADA",
            detalle: `${handled.name}: ${handled.message}`
          });
          Store.save();
        }
      } catch (_) {
        // Evita que un error de trazabilidad o almacenamiento oculte el error original.
      }
      this.toast(`${handled.name}: ${handled.message}`, "error");
    },

    modal(title, bodyHtml) {
      document.getElementById("modal-root").innerHTML = `
        <div class="modal-backdrop" onclick="App.backdropClose(event)">
          <div class="modal" role="dialog" aria-modal="true">
            <div class="modal-head"><h2>${esc(title)}</h2><button class="btn ghost small" onclick="App.closeModal()">Cerrar</button></div>
            <div class="modal-body">${bodyHtml}</div>
          </div>
        </div>`;
    },

    backdropClose(event) {
      if (event.target.classList.contains("modal-backdrop")) this.closeModal();
    },

    closeModal() { document.getElementById("modal-root").innerHTML = ""; },

    login(event) {
      event.preventDefault();
      const email = document.getElementById("loginEmail").value.trim().toLowerCase();
      const password = document.getElementById("loginPassword").value;
      const user = this.state.users.find(u => u.email.toLowerCase() === email && u.password === password);
      if (!user) {
        Trace.registrar("SISTEMA", "ACCESO_DENEGADO", `Intento de ingreso fallido con correo ${email || "(vacío)"}`);
        Store.save();
        this.toast("Correo o contraseña incorrectos.", "error");
        return;
      }
      if (user.status !== "ACTIVO") {
        Trace.registrar("SISTEMA", "ACCESO_DENEGADO", `Cuenta inactiva intentó ingresar: ${email}`);
        Store.save();
        this.toast("La cuenta está inactiva. Contacta al administrador.", "error");
        return;
      }
      this.session = { userId: user.id, startedAt: now() };
      Store.saveSession(this.session);
      Trace.registrar(user.role, "LOGIN", `${user.name} inició sesión`);
      Store.save();
      this.view = "dashboard";
      this.toast(`Bienvenido/a, ${user.name}.`, "ok");
      this.render();
    },

    fillLogin(email, password) {
      document.getElementById("loginEmail").value = email;
      document.getElementById("loginPassword").value = password;
    },

    logout() {
      const user = this.currentUser();
      if (user) Trace.registrar(user.role, "LOGOUT", `${user.name} cerró sesión`);
      Store.save();
      this.session = null;
      localStorage.removeItem(SESSION_KEY);
      this.view = "dashboard";
      this.render();
    },

    resetDemo() {
      if (!confirm("¿Restaurar los datos demo? Se borrarán los cambios locales.")) return;
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(SESSION_KEY);
      this.state = Store.seed();
      this.session = null;
      this.view = "dashboard";
      this.toast("Datos demo restaurados.", "ok");
      this.render();
    },

    globalSearch(event) {
      event.preventDefault();
      this.query = document.getElementById("globalSearch").value.trim();
      this.view = "search";
      this.render();
    },

    toggleBrowserNotifications() {
      if (!("Notification" in window)) {
        this.toast("Tu navegador no soporta notificaciones del sistema.", "warn");
        return;
      }
      Notification.requestPermission().then(permission => {
        this.state.settings.notifyBrowser = permission === "granted";
        Store.save();
        this.toast(permission === "granted" ? "Notificaciones del navegador activadas." : "Permiso de notificación no concedido.", permission === "granted" ? "ok" : "warn");
        this.render();
      });
    },

    markNotificationRead(id) {
      const n = this.state.notifications.find(x => x.id === id);
      if (n) n.read = true;
      Store.save();
      this.render();
    },

    markAllNotificationsRead() {
      const user = this.currentUser();
      this.state.notifications.filter(n => n.userId === user.id).forEach(n => n.read = true);
      Store.save();
      this.render();
    },

    openAppointmentModal(id = null) {
      const isEdit = !!id;
      const cita = isEdit ? this.state.appointments.find(c => c.id === id) : null;
      const user = this.currentUser();
      if (isEdit) this.require("EDIT_APPOINTMENT"); else this.require("CREATE_APPOINTMENT");
      const minDate = todayISO();
      this.modal(isEdit ? "Modificar cita" : "Agendar cita médica", `
        <form onsubmit="App.saveAppointment(event, '${id || ""}')">
          <div class="form-grid">
            <div>
              <label>Tipo de cita *</label>
              <select id="apptType" required>
                ${option(TipoCita.CONSULTA, labels[TipoCita.CONSULTA], cita?.type)}
                ${option(TipoCita.TELEMEDICINA, labels[TipoCita.TELEMEDICINA], cita?.type)}
                ${option(TipoCita.LABORATORIO, labels[TipoCita.LABORATORIO], cita?.type)}
              </select>
            </div>
            <div>
              <label>Fecha *</label>
              <input id="apptDate" type="date" min="${minDate}" value="${esc(cita?.date || "")}" required />
            </div>
            <div>
              <label>Paciente *</label>
              <select id="apptPatient" required ${user.role === Rol.PACIENTE ? "disabled" : ""}>
                <option value="">Seleccionar paciente</option>
                ${this.state.patients.map(p => option(p.id, `${p.name} · ${p.dni || "sin DNI"}`, cita?.patientId || (user.role === Rol.PACIENTE ? user.patientId : ""))).join("")}
              </select>
            </div>
            <div>
              <label>Médico *</label>
              <select id="apptDoctor" required>
                <option value="">Seleccionar médico</option>
                ${this.state.doctors.map(d => option(d.id, `${d.name} · ${d.specialty}`, cita?.doctorId)).join("")}
              </select>
            </div>
            <div>
              <label>Hora</label>
              <select id="apptTime">
                <option value="">Asignar automáticamente (${this.state.settings.strategy})</option>
                ${HORARIOS.map(h => option(h, h, cita?.time)).join("")}
              </select>
            </div>
            <div>
              <label>Estado</label>
              <select id="apptStatus" ${isEdit ? "" : "disabled"}>
                ${option(EstadoCita.PENDIENTE, "Pendiente", cita?.status || EstadoCita.PENDIENTE)}
                ${option(EstadoCita.CONFIRMADA, "Confirmada", cita?.status)}
                ${option(EstadoCita.CANCELADA, "Cancelada", cita?.status)}
              </select>
            </div>
            <div class="full">
              <label>Detalle / link / examen</label>
              <textarea id="apptDetail" rows="3" placeholder="Ej.: link de telemedicina, examen de laboratorio o motivo de consulta">${esc(cita?.detail || "")}</textarea>
            </div>
          </div>
          <p class="muted" style="font-size:13px">DbC: paciente y médico registrados, tipo válido, fecha futura, horario sin solapamiento y rol autorizado.</p>
          <div class="actions" style="justify-content:flex-end;margin-top:16px">
            <button type="button" class="btn ghost" onclick="App.closeModal()">Cancelar</button>
            <button class="btn primary" type="submit">${isEdit ? "Guardar cambios" : "Agendar cita"}</button>
          </div>
        </form>`);
    },

    saveAppointment(event, id = "") {
      event.preventDefault();
      try {
        const isEdit = !!id;
        if (isEdit) this.require("EDIT_APPOINTMENT"); else this.require("CREATE_APPOINTMENT");
        const user = this.currentUser();
        const type = value("apptType");
        const date = value("apptDate");
        const patientId = user.role === Rol.PACIENTE ? user.patientId : value("apptPatient");
        const doctorId = value("apptDoctor");
        let time = value("apptTime");
        const status = isEdit ? value("apptStatus") : EstadoCita.PENDIENTE;
        const detail = value("apptDetail").trim();

        Contract.require(Object.values(TipoCita).includes(type), "TipoCitaInvalidoException: Tipo de cita no válido.");
        Contract.require(this.findPatient(patientId), "IllegalArgumentException: El paciente debe estar registrado.");
        Contract.require(this.findDoctor(doctorId), "IllegalArgumentException: El médico debe estar registrado.");
        Contract.require(isFutureDate(date), "IllegalArgumentException: La fecha de la cita debe ser futura.");
        if (!time) time = Strategy.assign(this.state.settings.strategy, date, doctorId, id);
        Contract.require(HORARIOS.includes(time), "IllegalArgumentException: Horario inválido.");
        Contract.require(!this.isBlocked(doctorId, date, time), "IllegalStateException: El médico bloqueó ese horario.");
        Contract.require(!this.slotTaken(doctorId, date, time, id), "IllegalStateException: El horario ya está ocupado para ese médico.");

        const doctor = this.findDoctor(doctorId);
        if (!doctor.assignedPatients.includes(patientId)) doctor.assignedPatients.push(patientId);

        if (isEdit) {
          const cita = this.state.appointments.find(c => c.id === id);
          Contract.require(cita, "CitaNoEncontradaException: La cita no existe.");
          Object.assign(cita, { type, date, patientId, doctorId, time, status, detail, updatedAt: now() });
          History.add(patientId, id, "CITA_MODIFICADA", status, `Cita modificada: ${labels[type]} para ${date} ${time}`);
          Observer.notifyAppointment(cita, "Cita modificada", `Tu cita ${labels[type]} fue modificada para ${date} a las ${time}.`);
          Trace.registrar(user.role, "MODIFICAR_CITA", `${user.name} modificó la cita ${id}`);
          this.toast("Cita modificada correctamente.", "ok");
        } else {
          const newId = genId("C");
          const cita = CitaFactory.create({ id: newId, type, patientId, doctorId, date, time, status, detail, createdAt: now(), updatedAt: now() });
          this.state.appointments.push(cita.toJSON());
          History.add(patientId, newId, "CITA_AGENDADA", status, `Cita ${labels[type]} agendada para ${date} ${time}`);
          Observer.notifyAppointment(cita, "Nueva cita agendada", `Tu cita ${labels[type]} fue agendada para ${date} a las ${time}.`);
          Trace.registrar(user.role, "AGENDAR_CITA", `${user.name} agendó la cita ${newId} (${labels[type]})`);
          Contract.ensure(this.state.appointments.some(c => c.id === newId), "Postcondición fallida: la cita no fue agregada.");
          this.toast(`Cita agendada. Horario asignado: ${time}.`, "ok");
        }
        Store.save();
        this.closeModal();
        this.render();
      } catch (err) {
        this.handleError(err);
      }
    },

    cancelAppointment(id, actor = "RECEPCIONISTA") {
      try {
        const user = this.currentUser();
        const cita = this.state.appointments.find(c => c.id === id);
        Contract.require(cita, "CitaNoEncontradaException: La cita no existe.");
        if (user.role === Rol.PACIENTE) {
          this.require("CANCEL_OWN_APPOINTMENT");
          Contract.require(cita.patientId === user.patientId, "AccesoNoPermitidoException: Solo puedes cancelar tus propias citas.");
        } else {
          this.require("CANCEL_APPOINTMENT");
        }
        if (cita.status === EstadoCita.CANCELADA) throw new EstadoInvalidoException("La cita ya está cancelada.");
        cita.status = EstadoCita.CANCELADA;
        cita.updatedAt = now();
        History.add(cita.patientId, cita.id, user.role === Rol.PACIENTE ? "CANCELADA_PACIENTE" : "CITA_CANCELADA", EstadoCita.CANCELADA, `Cita ${cita.id} cancelada por ${user.name}`);
        Observer.notifyAppointment(cita, "Cita cancelada", `La cita ${cita.id} fue cancelada.`);
        Trace.registrar(user.role, user.role === Rol.PACIENTE ? "CANCELAR_MI_CITA" : "CANCELAR_CITA", `${user.name} canceló la cita ${id}`);
        Store.save();
        this.toast("Cita cancelada y paciente notificado.", "warn");
        this.render();
      } catch (err) {
        this.handleError(err);
      }
    },

    confirmAppointment(id) {
      try {
        const user = this.currentUser();
        this.require("CONFIRM_OWN_APPOINTMENT");
        const cita = this.state.appointments.find(c => c.id === id);
        Contract.require(cita, "CitaNoEncontradaException: La cita no existe.");
        Contract.require(cita.patientId === user.patientId, "AccesoNoPermitidoException: Solo puedes confirmar tus propias citas.");
        Contract.require(cita.status === EstadoCita.PENDIENTE, `IllegalStateException: La cita debe estar PENDIENTE. Estado actual: ${cita.status}.`);
        const another = this.state.appointments.find(c => c.patientId === user.patientId && c.status === EstadoCita.CONFIRMADA && c.id !== id);
        Contract.require(!another, "IllegalStateException: Ya tienes otra cita activa confirmada.");
        cita.status = EstadoCita.CONFIRMADA;
        cita.updatedAt = now();
        History.add(cita.patientId, cita.id, "CITA_CONFIRMADA", EstadoCita.CONFIRMADA, `Cita ${cita.id} confirmada por el paciente`);
        Observer.notifyAppointment(cita, "Cita confirmada", `Confirmaste tu cita ${cita.id} para ${cita.date} a las ${cita.time}.`);
        Trace.registrar(user.role, "CONFIRMAR_CITA", `${user.name} confirmó la cita ${id}`);
        Store.save();
        this.toast("Cita confirmada correctamente.", "ok");
        this.render();
      } catch (err) { this.handleError(err); }
    },

    isBlocked(doctorId, date, time) {
      const doctor = this.findDoctor(doctorId);
      return !!doctor?.blockedSlots?.some(s => s.date === date && s.time === time);
    },

    slotTaken(doctorId, date, time, ignoreId = "") {
      return this.state.appointments.some(c => c.id !== ignoreId && c.doctorId === doctorId && c.date === date && c.time === time && c.status !== EstadoCita.CANCELADA);
    },

    openPatientModal(id = null) {
      const isEdit = !!id;
      if (isEdit) this.require("MODIFY_ACCOUNTS"); else this.require("REGISTER_PATIENT");
      const p = isEdit ? this.findPatient(id) : null;
      this.modal(isEdit ? "Editar paciente" : "Registrar paciente", `
        <form onsubmit="App.savePatient(event, '${id || ""}')">
          <div class="form-grid">
            <div><label>Nombre completo *</label><input id="patientName" value="${esc(p?.name || "")}" required /></div>
            <div><label>DNI</label><input id="patientDni" value="${esc(p?.dni || "")}" maxlength="12" /></div>
            <div><label>Teléfono / contacto *</label><input id="patientPhone" value="${esc(p?.phone || "")}" required /></div>
            <div><label>Correo *</label><input id="patientEmail" type="email" value="${esc(p?.email || "")}" required /></div>
            <div><label>Fecha de nacimiento</label><input id="patientBirth" type="date" value="${esc(p?.birth || "")}" /></div>
            <div><label>Crear cuenta de acceso</label><select id="patientCreateAccount" ${isEdit ? "disabled" : ""}><option value="yes">Sí</option><option value="no">No</option></select></div>
            <div class="full"><label>Contraseña inicial</label><input id="patientPassword" value="paciente123" ${isEdit ? "disabled" : ""} /></div>
          </div>
          <p class="muted" style="font-size:13px">RF01: nombre y contacto no vacíos. Si se crea cuenta, el paciente podrá iniciar sesión con correo y contraseña.</p>
          <div class="actions" style="justify-content:flex-end;margin-top:16px"><button type="button" class="btn ghost" onclick="App.closeModal()">Cancelar</button><button class="btn primary">Guardar</button></div>
        </form>`);
    },

    savePatient(event, id = "") {
      event.preventDefault();
      try {
        const isEdit = !!id;
        if (isEdit) this.require("MODIFY_ACCOUNTS"); else this.require("REGISTER_PATIENT");
        const user = this.currentUser();
        const name = value("patientName").trim();
        const dni = value("patientDni").trim();
        const phone = value("patientPhone").trim();
        const email = value("patientEmail").trim().toLowerCase();
        const birth = value("patientBirth");
        Contract.require(name, "IllegalArgumentException: El nombre no puede estar vacío.");
        Contract.require(phone, "IllegalArgumentException: El contacto no puede estar vacío.");
        Contract.require(email, "IllegalArgumentException: El correo no puede estar vacío.");
        if (isEdit) {
          const p = this.findPatient(id);
          Contract.require(p, "CitaNoEncontradaException: Paciente no encontrado.");
          Object.assign(p, { name, dni, phone, email, birth });
          const u = this.patientUser(id);
          if (u) Object.assign(u, { name, email, phone, avatar: initials(name) });
          Trace.registrar(user.role, "MODIFICAR_PACIENTE", `${user.name} actualizó a ${name}`);
        } else {
          Contract.require(!this.state.patients.some(p => p.email.toLowerCase() === email), "IllegalStateException: Ya existe un paciente con ese correo.");
          const patientId = genId("P");
          this.state.patients.push({ id: patientId, name, dni, phone, email, birth, history: [] });
          if (value("patientCreateAccount") === "yes") {
            Contract.require(!this.state.users.some(u => u.email.toLowerCase() === email), "IllegalStateException: Ya existe una cuenta con ese correo.");
            this.state.users.push({ id: genId("U"), name, email, password: value("patientPassword") || "paciente123", role: Rol.PACIENTE, status: "ACTIVO", avatar: initials(name), phone, patientId });
          }
          Trace.registrar(user.role, "REGISTRAR_PACIENTE", `${user.name} registró al paciente ${name}`);
        }
        Store.save();
        this.closeModal();
        this.toast("Paciente guardado correctamente.", "ok");
        this.render();
      } catch (err) { this.handleError(err); }
    },

    openAccountModal(id = null) {
      const isEdit = !!id;
      this.require("MANAGE_ACCOUNTS");
      const u = isEdit ? this.findUser(id) : null;
      this.modal(isEdit ? "Modificar cuenta" : "Añadir cuenta", `
        <form onsubmit="App.saveAccount(event, '${id || ""}')">
          <div class="form-grid">
            <div><label>Nombre *</label><input id="accName" value="${esc(u?.name || "")}" required /></div>
            <div><label>Correo *</label><input id="accEmail" type="email" value="${esc(u?.email || "")}" required /></div>
            <div><label>Contraseña *</label><input id="accPassword" value="${esc(u?.password || "")}" required /></div>
            <div><label>Teléfono</label><input id="accPhone" value="${esc(u?.phone || "")}" /></div>
            <div><label>Rol *</label><select id="accRole" required>${Object.values(Rol).map(r => option(r, labels[r], u?.role)).join("")}</select></div>
            <div><label>Estado</label><select id="accStatus"><option value="ACTIVO" ${u?.status !== "INACTIVO" ? "selected" : ""}>Activo</option><option value="INACTIVO" ${u?.status === "INACTIVO" ? "selected" : ""}>Inactivo</option></select></div>
            <div class="full"><label>Especialidad médica (solo si el rol es médico)</label><select id="accSpecialty"><option value="">— no aplica —</option>${SPECIALTIES.map(s => option(s, s, u?.doctorId ? this.findDoctor(u.doctorId)?.specialty : "")).join("")}</select></div>
          </div>
          <p class="muted" style="font-size:13px">Solo ADMIN puede añadir, modificar, activar/desactivar cuentas y cambiar roles.</p>
          <div class="actions" style="justify-content:flex-end;margin-top:16px"><button type="button" class="btn ghost" onclick="App.closeModal()">Cancelar</button><button class="btn primary">Guardar cuenta</button></div>
        </form>`);
    },

    saveAccount(event, id = "") {
      event.preventDefault();
      try {
        this.require("MODIFY_ACCOUNTS");
        const admin = this.currentUser();
        const isEdit = !!id;
        const name = value("accName").trim();
        const email = value("accEmail").trim().toLowerCase();
        const password = value("accPassword");
        const phone = value("accPhone").trim();
        const role = value("accRole");
        const status = value("accStatus");
        const specialty = value("accSpecialty") || "Medicina General";
        Contract.require(name && email && password && role, "IllegalArgumentException: Nombre, correo, contraseña y rol son obligatorios.");
        Contract.require(Object.values(Rol).includes(role), "IllegalArgumentException: Rol inválido.");
        const repeated = this.state.users.find(u => u.email.toLowerCase() === email && u.id !== id);
        Contract.require(!repeated, "IllegalStateException: Ya existe una cuenta con ese correo.");

        if (isEdit) {
          const u = this.findUser(id);
          Contract.require(u, "CitaNoEncontradaException: Cuenta no encontrada.");
          Object.assign(u, { name, email, password, role, status, phone, avatar: initials(name) });
          this.syncEntityForUser(u, specialty);
          Trace.registrar(admin.role, "MODIFICAR_CUENTA", `${admin.name} modificó la cuenta ${email}`);
        } else {
          const user = new Usuario({ id: genId("U"), name, email, password, role, status, phone, avatar: initials(name) }).toJSON();
          this.syncEntityForUser(user, specialty, true);
          this.state.users.push(user);
          Trace.registrar(admin.role, "AÑADIR_CUENTA", `${admin.name} añadió cuenta ${email} con rol ${role}`);
        }
        Store.save();
        this.closeModal();
        this.toast("Cuenta guardada correctamente.", "ok");
        this.render();
      } catch (err) { this.handleError(err); }
    },

    syncEntityForUser(user, specialty = "Medicina General", isNew = false) {
      if (user.role === Rol.PACIENTE) {
        let p = user.patientId ? this.findPatient(user.patientId) : this.state.patients.find(x => x.email.toLowerCase() === user.email.toLowerCase());
        if (!p) {
          p = new Paciente({ id: genId("P"), name: user.name, dni: "", phone: user.phone || "", email: user.email, birth: "", history: [] }).toJSON();
          this.state.patients.push(p);
        } else {
          Object.assign(p, { name: user.name, phone: user.phone || p.phone, email: user.email });
        }
        user.patientId = p.id;
        delete user.doctorId;
      } else if (user.role === Rol.MEDICO) {
        let d = user.doctorId ? this.findDoctor(user.doctorId) : this.state.doctors.find(x => x.email.toLowerCase() === user.email.toLowerCase());
        if (!d) {
          d = new Medico({ id: genId("M"), name: user.name, specialty, email: user.email, phone: user.phone || "", assignedPatients: [], blockedSlots: [] }).toJSON();
          this.state.doctors.push(d);
        } else {
          Object.assign(d, { name: user.name, specialty, email: user.email, phone: user.phone || d.phone });
        }
        user.doctorId = d.id;
        delete user.patientId;
      } else {
        delete user.patientId;
        delete user.doctorId;
      }
    },

    toggleAccountStatus(id) {
      try {
        this.require("MODIFY_ACCOUNTS");
        const user = this.findUser(id);
        Contract.require(user, "Cuenta no encontrada.");
        if (user.id === this.currentUser().id) throw new EstadoInvalidoException("No puedes desactivar tu propia cuenta activa.");
        user.status = user.status === "ACTIVO" ? "INACTIVO" : "ACTIVO";
        Trace.registrar(this.currentUser().role, "CAMBIAR_ESTADO_CUENTA", `${user.email} ahora está ${user.status}`);
        Store.save();
        this.toast(`Cuenta ${user.status.toLowerCase()}.`, "ok");
        this.render();
      } catch (err) { this.handleError(err); }
    },

    openBlockSlotModal() {
      this.require("BLOCK_SLOT");
      this.modal("Bloquear horario médico", `
        <form onsubmit="App.saveBlockedSlot(event)">
          <div class="form-grid">
            <div><label>Fecha *</label><input id="blockDate" type="date" min="${todayISO()}" required /></div>
            <div><label>Hora *</label><select id="blockTime" required><option value="">Seleccionar</option>${HORARIOS.map(h => option(h, h)).join("")}</select></div>
            <div class="full"><label>Motivo</label><textarea id="blockReason" rows="3" placeholder="Ej.: capacitación, reunión, atención externa"></textarea></div>
          </div>
          <p class="muted" style="font-size:13px">CU03: el horario debe ser futuro, no estar asignado y pertenecer al médico autenticado.</p>
          <div class="actions" style="justify-content:flex-end;margin-top:16px"><button type="button" class="btn ghost" onclick="App.closeModal()">Cancelar</button><button class="btn primary">Bloquear</button></div>
        </form>`);
    },

    saveBlockedSlot(event) {
      event.preventDefault();
      try {
        this.require("BLOCK_SLOT");
        const user = this.currentUser();
        const doctor = this.findDoctor(user.doctorId);
        Contract.require(doctor, "IllegalStateException: La cuenta médica no está vinculada a un médico.");
        const date = value("blockDate");
        const time = value("blockTime");
        const reason = value("blockReason").trim() || "Horario no disponible";
        Contract.require(isFutureDate(date), "IllegalArgumentException: El horario debe ser futuro.");
        Contract.require(!this.isBlocked(doctor.id, date, time), "IllegalStateException: Ese horario ya está bloqueado.");
        Contract.require(!this.slotTaken(doctor.id, date, time), "IllegalStateException: Ese horario ya tiene una cita asignada.");
        doctor.blockedSlots.push({ id: genId("B"), date, time, reason, createdAt: now() });
        Trace.registrar(user.role, "BLOQUEAR_HORARIO", `${doctor.name} bloqueó ${date} ${time}: ${reason}`);
        Store.save();
        this.closeModal();
        this.toast("Horario bloqueado correctamente.", "ok");
        this.render();
      } catch (err) { this.handleError(err); }
    },

    removeBlockedSlot(id) {
      try {
        this.require("BLOCK_SLOT");
        const user = this.currentUser();
        const doctor = this.findDoctor(user.doctorId);
        doctor.blockedSlots = doctor.blockedSlots.filter(s => s.id !== id);
        Trace.registrar(user.role, "DESBLOQUEAR_HORARIO", `${doctor.name} desbloqueó un horario`);
        Store.save();
        this.toast("Horario desbloqueado.", "ok");
        this.render();
      } catch (err) { this.handleError(err); }
    },

    changeStrategy(strategy) {
      try {
        this.require("CHANGE_STRATEGY");
        Contract.require(Object.values(Estrategia).includes(strategy), "IllegalArgumentException: Estrategia inválida.");
        this.state.settings.strategy = strategy;
        Trace.registrar(this.currentUser().role, "CAMBIAR_ESTRATEGIA", `Estrategia activa: ${strategy}`);
        Store.save();
        this.toast(`Estrategia cambiada a ${strategy}.`, "ok");
        this.render();
      } catch (err) { this.handleError(err); }
    },

    exportLogs() {
      try {
        this.require("VIEW_LOGS");
        const blob = new Blob([JSON.stringify(this.state.logs, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `medicitas-trazabilidad-${todayISO()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        Trace.registrar(this.currentUser().role, "EXPORTAR_LOGS", "Exportó trazabilidad JSON");
        Store.save();
        this.toast("Log exportado.", "ok");
      } catch (err) { this.handleError(err); }
    },
  };

  const Store = {
    seed() {
      const data = structuredClone(Demo);
      data.logs = [{ id: genId("L"), ts: now(), rol: "SISTEMA", accion: "INICIO", detalle: "Sistema inicializado con datos de demostración" }];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      return data;
    },
    load() {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return this.seed();
      try {
        const data = JSON.parse(raw);
        return Object.assign(structuredClone(Demo), data, {
          users: data.users || [], patients: data.patients || [], doctors: data.doctors || [],
          appointments: data.appointments || [], notifications: data.notifications || [],
          smsOutbox: data.smsOutbox || [], logs: data.logs || [], settings: Object.assign({ strategy: Estrategia.DISPONIBILIDAD, notifyBrowser: false }, data.settings || {}),
        });
      } catch {
        return this.seed();
      }
    },
    save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(App.state)); },
    loadSession() {
      try { return JSON.parse(localStorage.getItem(SESSION_KEY) || "null"); } catch { return null; }
    },
    saveSession(session) { localStorage.setItem(SESSION_KEY, JSON.stringify(session)); },
  };

  const Contract = {
    require(condition, message, ExceptionClass = ValidacionException) {
      if (!condition) throw ExceptionFactory.from(message, ExceptionClass);
    },
    ensure(condition, message) {
      if (!condition) throw ExceptionFactory.from(message, EstadoInvalidoException);
    },
  };

  const Trace = {
    registrar(rol, accion, detalle) {
      Contract.require(rol && accion && detalle !== undefined, "IllegalArgumentException: Evento de trazabilidad incompleto.");
      App.state.logs.push({ id: genId("L"), ts: now(), rol, accion, detalle: String(detalle) });
    },
    filter({ rol = "", accion = "", q = "" } = {}) {
      const query = q.toLowerCase();
      return App.state.logs.filter(l => (!rol || l.rol === rol) && (!accion || l.accion.includes(accion)) && (!query || `${l.rol} ${l.accion} ${l.detalle} ${l.ts}`.toLowerCase().includes(query)));
    },
  };

  const CitaFactory = {
    create(cita) {
      Contract.require(Object.values(TipoCita).includes(cita.type), "TipoCitaInvalidoException: Tipo de cita inválido.");
      if (cita.type === TipoCita.TELEMEDICINA) return new CitaTelemedicina(cita);
      if (cita.type === TipoCita.LABORATORIO) return new CitaLaboratorio(cita);
      return new CitaConsulta(cita);
    },
  };

  const Strategy = {
    assign(strategy, date, doctorId, ignoreId = "") {
      Contract.require(strategy, "IllegalArgumentException: La estrategia no puede ser nula.");
      const free = HORARIOS.filter(h => !App.slotTaken(doctorId, date, h, ignoreId) && !App.isBlocked(doctorId, date, h));
      Contract.require(free.length > 0, "IllegalStateException: No hay horarios disponibles para ese médico en la fecha seleccionada.");
      if (strategy === Estrategia.URGENCIA) return free[0];
      if (strategy === Estrategia.ORDEN_LLEGADA) return free[free.length - 1];
      return free[Math.min(2, free.length - 1)];
    },
  };

  const Observer = {
    notifyAppointment(cita, title, message) {
      const patientUser = App.patientUser(cita.patientId);
      const doctorUser = App.doctorUser(cita.doctorId);
      const recipients = [patientUser, doctorUser].filter(Boolean);
      const admins = App.state.users.filter(u => u.role === Rol.ADMIN && u.status === "ACTIVO");
      recipients.concat(admins).forEach(u => Notifications.create(u.id, title, message, cita.id));
      SMSAdapter.send(cita.patientId, `MediCitas: ${message}`);
      Trace.registrar("OBSERVER", "NOTIFICACION", `${title}: cita ${cita.id}`);
    },
  };

  const SMSAdapter = {
    send(patientId, message) {
      const patient = App.findPatient(patientId);
      Contract.require(patient?.phone, "IllegalArgumentException: El número SMS no puede estar vacío.");
      Contract.require(message, "IllegalArgumentException: El mensaje SMS no puede estar vacío.");
      App.state.smsOutbox.push({ id: genId("SMS"), ts: now(), phone: patient.phone, patientId, message, status: "ENVIADO_SIMULADO" });
      Trace.registrar("SMS_ADAPTER", "NOTIFICACION_SMS", `SMS simulado enviado a ${patient.phone}: ${message}`);
    },
  };

  const Notifications = {
    create(userId, title, message, appointmentId = "") {
      const n = { id: genId("N"), userId, ts: now(), title, message, appointmentId, read: false, channel: "APP" };
      App.state.notifications.push(n);
      const current = App.currentUser();
      if (current?.id === userId && App.state.settings.notifyBrowser && "Notification" in window && Notification.permission === "granted") {
        new Notification(title, { body: message });
      }
      return n;
    },
  };

  const History = {
    add(patientId, appointmentId, action, status, detail) {
      const patient = App.findPatient(patientId);
      if (!patient) return;
      if (!Array.isArray(patient.history)) patient.history = [];
      patient.history.push({ id: genId("H"), ts: now(), appointmentId, action, status, detail });
    },
  };

  const Views = {
    login() {
      return `
        <div class="login-shell">
          <section class="login-hero">
            <div class="logo-row"><div class="logo">MC</div><div><b>MediCitas</b><br><span class="muted">Sistema de gestión médica</span></div></div>
            <div>
              <h1>Agenda médica digital para una atención más ordenada.</h1>
              <p>Organiza citas, pacientes, médicos, horarios y notificaciones desde una sola plataforma, con acceso diferenciado para cada usuario de la clínica.</p>
            </div>
            <div class="feature-grid">
              ${feature("Gestión de citas", "Reserva, edición, confirmación y cancelación de turnos médicos.")}
              ${feature("Pacientes e historial", "Registro de pacientes y seguimiento de sus atenciones.")}
              ${feature("Agenda médica", "Horarios por médico, especialidad y disponibilidad.")}
              ${feature("Panel administrativo", "Cuentas, trazabilidad, alertas y configuración del sistema.")}
            </div>
          </section>
          <section style="display:grid;place-items:center;padding:24px">
            <div class="login-card">
              <h2 style="margin:0 0 4px;font-size:24px">Iniciar sesión</h2>
              <p class="muted" style="margin:0 0 20px">Ingresa con correo y contraseña.</p>
              <form onsubmit="App.login(event)">
                <label>Correo electrónico</label>
                <input id="loginEmail" type="email" placeholder="admin@medicitas.com" required autocomplete="username" />
                <div style="height:12px"></div>
                <label>Contraseña</label>
                <input id="loginPassword" type="password" placeholder="••••••••" required autocomplete="current-password" />
                <div class="actions" style="margin-top:18px">
                  <button class="btn primary" style="width:100%" type="submit">Entrar al sistema</button>
                </div>
              </form>
              <div class="quick-credentials">
                <div class="cred"><span><b>Admin</b> admin@medicitas.com / admin123</span><button onclick="App.fillLogin('admin@medicitas.com','admin123')">usar</button></div>
                <div class="cred"><span><b>Recepción</b> recepcion@medicitas.com / recep123</span><button onclick="App.fillLogin('recepcion@medicitas.com','recep123')">usar</button></div>
                <div class="cred"><span><b>Paciente</b> ana@medicitas.com / paciente123</span><button onclick="App.fillLogin('ana@medicitas.com','paciente123')">usar</button></div>
                <div class="cred"><span><b>Médico</b> smith@medicitas.com / medico123</span><button onclick="App.fillLogin('smith@medicitas.com','medico123')">usar</button></div>
              </div>
              <button class="btn ghost" style="width:100%;margin-top:14px" onclick="App.resetDemo()">Restaurar datos demo</button>
            </div>
          </section>
        </div>`;
    },

    layout() {
      const user = App.currentUser();
      const unread = App.state.notifications.filter(n => n.userId === user.id && !n.read).length;
      const navItems = this.navItems(user);
      return `
        <div class="app-shell">
          <aside class="sidebar">
            <div class="side-brand"><div class="logo small">MC</div><div><h2>MediCitas</h2><span>Clínica de Atención General</span></div></div>
            <nav class="nav">
              ${navItems.map(item => `<button class="${App.view === item.id ? "active" : ""}" onclick="App.setView('${item.id}')"><span>${item.icon}</span>${item.label}${item.id === "notifications" && unread ? `<b style="margin-left:auto" class="badge error">${unread}</b>` : ""}</button>`).join("")}
            </nav>
            <div class="sidebar-footer">
              <div class="user-mini"><div class="avatar ${user.role}">${esc(user.avatar || initials(user.name))}</div><div style="min-width:0"><b>${esc(user.name)}</b><br><span class="badge ${user.role}">${labels[user.role]}</span></div></div>
              <button class="btn ghost" onclick="App.logout()">Cerrar sesión</button>
            </div>
          </aside>
          <main class="main">
            <header class="topbar">
              <form class="searchbar" onsubmit="App.globalSearch(event)">
                <input id="globalSearch" value="${esc(App.query)}" placeholder="Buscar citas, pacientes, médicos, cuentas o logs..." />
                <button class="btn primary" type="submit">Buscar</button>
              </form>
              <div class="actions">
                <button class="btn ghost" onclick="App.setView('notifications')">Notificaciones ${unread ? `<span class="badge error">${unread}</span>` : ""}</button>
                <button class="btn ghost" onclick="App.toggleBrowserNotifications()">${App.state.settings.notifyBrowser ? "🔔" : "🔕"}</button>
              </div>
            </header>
            <section id="content" class="content"></section>
          </main>
        </div>`;
    },

    navItems(user) {
      const base = [{ id: "dashboard", label: "Inicio", icon: "🏠" }, { id: "notifications", label: "Notificaciones", icon: "🔔" }];
      if (user.role === Rol.RECEPCIONISTA) return base.concat([{ id: "appointments", label: "Citas", icon: "📅" }, { id: "patients", label: "Pacientes", icon: "👤" }, { id: "search", label: "Búsqueda", icon: "🔎" }]);
      if (user.role === Rol.PACIENTE) return base.concat([{ id: "appointments", label: "Mis citas", icon: "📅" }, { id: "history", label: "Mi historial", icon: "🧾" }, { id: "search", label: "Búsqueda", icon: "🔎" }]);
      if (user.role === Rol.MEDICO) return base.concat([{ id: "agenda", label: "Mi agenda", icon: "🩺" }, { id: "patients", label: "Mis pacientes", icon: "👥" }, { id: "search", label: "Búsqueda", icon: "🔎" }]);
      return base.concat([{ id: "appointments", label: "Citas", icon: "📅" }, { id: "patients", label: "Pacientes", icon: "👤" }, { id: "accounts", label: "Cuentas", icon: "🔐" }, { id: "logs", label: "Trazabilidad", icon: "📜" }, { id: "alerts", label: "Alertas", icon: "⚠️" }, { id: "settings", label: "Configuración", icon: "⚙️" }]);
    },

    dashboard() {
      const user = App.currentUser();
      const visibleAppointments = data.visibleAppointments();
      const active = visibleAppointments.filter(c => c.status !== EstadoCita.CANCELADA).length;
      const confirmed = visibleAppointments.filter(c => c.status === EstadoCita.CONFIRMADA).length;
      const pending = visibleAppointments.filter(c => c.status === EstadoCita.PENDIENTE).length;
      const alerts = data.alerts();
      return `
        <div class="page-title">
          <div><h1>Hola, ${esc(user.name)}</h1><p>Panel ${labels[user.role]} · permisos activos: ${PERMISOS[user.role].length}</p></div>
          <div class="actions">
            ${(user.role === Rol.RECEPCIONISTA || user.role === Rol.ADMIN) ? `<button class="btn primary" onclick="App.openAppointmentModal()">+ Agendar cita</button>` : ""}
            ${user.role === Rol.ADMIN ? `<button class="btn ghost" onclick="App.openAccountModal()">+ Añadir cuenta</button>` : ""}
            ${user.role === Rol.MEDICO ? `<button class="btn primary" onclick="App.openBlockSlotModal()">Bloquear horario</button>` : ""}
          </div>
        </div>
        <div class="grid stats">
          ${stat("Citas visibles", visibleAppointments.length, "Según tu rol")}
          ${stat("Activas", active, "Pendientes + confirmadas")}
          ${stat("Confirmadas", confirmed, "Atenciones aseguradas")}
          ${stat("Pendientes", pending, "Requieren acción")}
        </div>
        <div class="grid two">
          <div class="card pad">
            <h3 style="margin-top:0">Próximas citas</h3>
            <div class="list">
              ${visibleAppointments.filter(c => c.status !== EstadoCita.CANCELADA).sort(sortByDateTime).slice(0, 5).map(c => appointmentMini(c)).join("") || `<div class="empty">No hay citas próximas.</div>`}
            </div>
          </div>
          <div class="card pad">
            <h3 style="margin-top:0">Estado del sistema</h3>
            <div class="list">
              ${alerts.slice(0, 4).map(a => `<div class="appointment-card"><div class="appointment-head"><b>${esc(a.title)}</b><span class="badge ${a.type}">${a.type === "ok" ? "OK" : a.type === "warn" ? "Riesgo" : "Crítico"}</span></div><p class="muted" style="margin:0">${esc(a.message)}</p></div>`).join("")}
            </div>
          </div>
        </div>`;
    },

    appointments() {
      const user = App.currentUser();
      const citas = data.visibleAppointments();
      const q = getFilter("appointmentFilter");
      const filtered = data.filterAppointments(citas, q);
      const canCreate = App.has("CREATE_APPOINTMENT");
      const title = user.role === Rol.PACIENTE ? "Mis citas" : "Gestión de citas";
      return `
        <div class="page-title">
          <div><h1>${title}</h1><p>Ciclo completo: creación, asignación de horario, confirmación, cancelación, notificación y trazabilidad.</p></div>
          ${canCreate ? `<button class="btn primary" onclick="App.openAppointmentModal()">+ Agendar cita</button>` : ""}
        </div>
        <div class="card pad" style="margin-bottom:16px">
          <div class="form-grid">
            <div class="full"><label>Búsqueda de citas</label><input id="appointmentFilter" value="${esc(q)}" oninput="App.filters.appointmentFilter=this.value;App.render()" placeholder="Paciente, médico, tipo, estado, fecha o ID" /></div>
          </div>
        </div>
        ${filtered.length ? `<div class="table-wrap"><table><thead><tr><th>ID</th><th>Tipo</th><th>Paciente</th><th>Médico</th><th>Fecha / hora</th><th>Estado</th><th>Detalle</th><th>Acciones</th></tr></thead><tbody>
          ${filtered.map(c => appointmentRow(c, user)).join("")}
        </tbody></table></div>` : `<div class="empty">No se encontraron citas con ese criterio.</div>`}`;
    },

    patients() {
      const user = App.currentUser();
      let patients = [];
      if (user.role === Rol.MEDICO) {
        const doctor = App.findDoctor(user.doctorId);
        patients = App.state.patients.filter(p => doctor?.assignedPatients.includes(p.id));
      } else if (user.role === Rol.PACIENTE) {
        patients = App.state.patients.filter(p => p.id === user.patientId);
      } else {
        patients = App.state.patients;
      }
      const q = getFilter("patientFilter").toLowerCase();
      const filtered = patients.filter(p => !q || `${p.name} ${p.dni} ${p.phone} ${p.email}`.toLowerCase().includes(q));
      return `
        <div class="page-title">
          <div><h1>${user.role === Rol.MEDICO ? "Mis pacientes asignados" : "Pacientes"}</h1><p>Privacidad por rol: el médico solo visualiza pacientes asignados y el paciente solo ve su propia información.</p></div>
          ${(App.has("REGISTER_PATIENT") && user.role !== Rol.MEDICO && user.role !== Rol.PACIENTE) ? `<button class="btn primary" onclick="App.openPatientModal()">+ Registrar paciente</button>` : ""}
        </div>
        <div class="card pad" style="margin-bottom:16px"><label>Buscar paciente</label><input id="patientFilter" value="${esc(q)}" oninput="App.filters.patientFilter=this.value;App.render()" placeholder="Nombre, DNI, teléfono o correo" /></div>
        <div class="grid three">
          ${filtered.map(p => patientCard(p, user)).join("") || `<div class="empty" style="grid-column:1/-1">No hay pacientes visibles.</div>`}
        </div>`;
    },

    agenda() {
      const user = App.currentUser();
      const doctor = App.findDoctor(user.doctorId);
      const citas = App.state.appointments.filter(c => c.doctorId === doctor?.id && c.status !== EstadoCita.CANCELADA).sort(sortByDateTime);
      return `
        <div class="page-title">
          <div><h1>Mi agenda médica</h1><p>${esc(doctor?.name || "Médico")} · ${esc(doctor?.specialty || "Especialidad")}. Puedes consultar citas y bloquear horarios no disponibles.</p></div>
          <button class="btn primary" onclick="App.openBlockSlotModal()">Bloquear horario</button>
        </div>
        <div class="grid stats">
          ${stat("Citas activas", citas.length, "Asignadas a ti")}
          ${stat("Pacientes", doctor?.assignedPatients.length || 0, "Propios")}
          ${stat("Horarios bloqueados", doctor?.blockedSlots.length || 0, "No disponibles")}
          ${stat("Confirmadas", citas.filter(c => c.status === EstadoCita.CONFIRMADA).length, "Confirmadas")}
        </div>
        <div class="grid two">
          <div class="card pad"><h3 style="margin-top:0">Citas de agenda</h3><div class="list">${citas.map(c => appointmentMini(c, true)).join("") || `<div class="empty">No hay citas asignadas.</div>`}</div></div>
          <div class="card pad"><h3 style="margin-top:0">Horarios bloqueados</h3><div class="list">${(doctor?.blockedSlots || []).map(s => `<div class="appointment-card"><div class="appointment-head"><div><b>${esc(s.date)} · ${esc(s.time)}</b><p class="muted" style="margin:4px 0 0">${esc(s.reason)}</p></div><button class="btn danger small" onclick="App.removeBlockedSlot('${s.id}')">Quitar</button></div></div>`).join("") || `<div class="empty">No hay horarios bloqueados.</div>`}</div></div>
        </div>`;
    },

    history() {
      const user = App.currentUser();
      const patient = App.findPatient(user.patientId);
      const history = [...(patient?.history || [])].reverse();
      return `
        <div class="page-title"><div><h1>Mi historial</h1><p>Registro personal del paciente: citas agendadas, confirmadas, canceladas o modificadas.</p></div></div>
        <div class="grid two" style="margin-bottom:18px">
          ${stat("Eventos de historial", history.length, "Persistentes")}
          ${stat("Citas totales", App.state.appointments.filter(c => c.patientId === user.patientId).length, "Del paciente")}
        </div>
        <div class="timeline">
          ${history.map(h => `<div class="timeline-item"><div class="appointment-head"><b>${esc(h.action)}</b><span class="badge ${h.status}">${labels[h.status] || h.status}</span></div><p style="margin:6px 0" class="muted">${esc(h.detail)}</p><span class="mono muted-2">${esc(h.ts)} · ${esc(h.appointmentId)}</span></div>`).join("") || `<div class="empty">Todavía no tienes historial registrado.</div>`}
        </div>`;
    },

    accounts() {
      App.require("MANAGE_ACCOUNTS");
      const q = getFilter("accountFilter").toLowerCase();
      const users = App.state.users.filter(u => !q || `${u.name} ${u.email} ${u.role} ${u.status}`.toLowerCase().includes(q));
      return `
        <div class="page-title">
          <div><h1>Cuentas y roles</h1><p>El administrador puede añadir cuentas, modificar datos, cambiar roles y activar/desactivar accesos.</p></div>
          <button class="btn primary" onclick="App.openAccountModal()">+ Añadir cuenta</button>
        </div>
        <div class="card pad" style="margin-bottom:16px"><label>Buscar cuenta</label><input id="accountFilter" value="${esc(q)}" oninput="App.filters.accountFilter=this.value;App.render()" placeholder="Nombre, correo, rol o estado" /></div>
        <div class="table-wrap"><table><thead><tr><th>Cuenta</th><th>Correo</th><th>Rol</th><th>Estado</th><th>Vinculación</th><th>Acciones</th></tr></thead><tbody>
          ${users.map(u => `<tr><td><div style="display:flex;align-items:center;gap:10px"><div class="avatar ${u.role}" style="width:34px;height:34px;font-size:12px">${esc(u.avatar || initials(u.name))}</div><b>${esc(u.name)}</b></div></td><td>${esc(u.email)}</td><td><span class="badge ${u.role}">${labels[u.role]}</span></td><td><span class="badge ${u.status}">${u.status}</span></td><td class="mono muted">${esc(u.patientId || u.doctorId || "—")}</td><td><div class="actions"><button class="btn small ghost" onclick="App.openAccountModal('${u.id}')">Editar</button><button class="btn small ${u.status === "ACTIVO" ? "danger" : "success"}" onclick="App.toggleAccountStatus('${u.id}')">${u.status === "ACTIVO" ? "Desactivar" : "Activar"}</button></div></td></tr>`).join("")}
        </tbody></table></div>`;
    },

    logs() {
      App.require("VIEW_LOGS");
      const q = getFilter("logFilter");
      const rol = getFilter("logRole");
      const logs = Trace.filter({ q, rol }).reverse();
      return `
        <div class="page-title"><div><h1>Trazabilidad</h1><p>Registro auditable con timestamp, rol, acción y detalle de cada operación implementada.</p></div><button class="btn ghost" onclick="App.exportLogs()">Exportar JSON</button></div>
        <div class="card pad" style="margin-bottom:16px"><div class="form-grid"><div><label>Rol</label><select id="logRole" onchange="App.filters.logRole=this.value;App.render()"><option value="">Todos</option>${["SISTEMA", "OBSERVER", "SMS_ADAPTER"].concat(Object.values(Rol)).map(r => option(r, r, rol)).join("")}</select></div><div><label>Buscar en log</label><input id="logFilter" value="${esc(q)}" oninput="App.filters.logFilter=this.value;App.render()" placeholder="Acción, detalle o fecha" /></div></div></div>
        <div class="table-wrap"><table><thead><tr><th>Timestamp</th><th>Rol</th><th>Acción</th><th>Detalle</th></tr></thead><tbody>
          ${logs.map(l => `<tr><td class="mono muted">${esc(l.ts)}</td><td><span class="badge ${l.rol}">${esc(l.rol)}</span></td><td class="mono">${esc(l.accion)}</td><td>${esc(l.detalle)}</td></tr>`).join("") || `<tr><td colspan="4" class="empty">No hay eventos.</td></tr>`}
        </tbody></table></div>`;
    },

    alerts() {
      App.require("VIEW_ALERTS");
      const alerts = data.alerts();
      return `
        <div class="page-title"><div><h1>Alertas predictivas</h1><p>Análisis preventivo basado en los eventos de trazabilidad y patrones operativos registrados.</p></div></div>
        <div class="grid two">
          ${alerts.map(a => `<div class="card pad"><div class="appointment-head"><h3 style="margin:0">${esc(a.title)}</h3><span class="badge ${a.type}">${a.type === "ok" ? "Normal" : a.type === "warn" ? "Riesgo" : "Crítico"}</span></div><p class="muted">${esc(a.message)}</p><p class="muted-2" style="font-size:13px;margin-bottom:0"><b>Mitigación:</b> ${esc(a.mitigation)}</p></div>`).join("")}
        </div>`;
    },

    notifications() {
      const user = App.currentUser();
      const notifications = App.state.notifications.filter(n => n.userId === user.id).sort((a,b) => b.id.localeCompare(a.id));
      return `
        <div class="page-title"><div><h1>Notificaciones</h1><p>Los cambios de citas generan avisos internos para mantener informados a pacientes, médicos y administración.</p></div><button class="btn ghost" onclick="App.markAllNotificationsRead()">Marcar todo como leído</button></div>
        <div class="list">
          ${notifications.map(n => `<div class="appointment-card" style="border-color:${n.read ? "var(--border)" : "#185fa5"}"><div class="appointment-head"><div><b>${esc(n.title)}</b><p class="muted" style="margin:5px 0">${esc(n.message)}</p><span class="mono muted-2">${esc(n.ts)} ${n.appointmentId ? "· " + esc(n.appointmentId) : ""}</span></div><div class="actions"><span class="badge ${n.read ? "ok" : "warn"}">${n.read ? "Leída" : "Nueva"}</span>${!n.read ? `<button class="btn small ghost" onclick="App.markNotificationRead('${n.id}')">Marcar leída</button>` : ""}</div></div></div>`).join("") || `<div class="empty">No tienes notificaciones.</div>`}
        </div>`;
    },

    settings() {
      App.require("CHANGE_STRATEGY");
      return `
        <div class="page-title"><div><h1>Configuración</h1><p>Ajusta la forma en que el sistema asigna horarios disponibles para las citas.</p></div></div>
        <div class="grid two">
          ${strategyCard(Estrategia.DISPONIBILIDAD, "Por disponibilidad", "Selecciona un horario libre intermedio para distribuir la agenda.")}
          ${strategyCard(Estrategia.URGENCIA, "Por urgencia", "Toma el horario libre más temprano disponible.")}
          ${strategyCard(Estrategia.ORDEN_LLEGADA, "Por orden de llegada", "Asigna el último horario libre de la cola de atención.")}
        </div>
        <div class="card pad" style="margin-top:16px"><h3 style="margin-top:0">Mensajes SMS simulados</h3><p class="muted">Los mensajes se registran como envíos simulados para dejar constancia de las comunicaciones generadas por el sistema.</p><div class="table-wrap"><table><thead><tr><th>Fecha</th><th>Teléfono</th><th>Mensaje</th><th>Estado</th></tr></thead><tbody>${App.state.smsOutbox.slice().reverse().map(s => `<tr><td class="mono muted">${esc(s.ts)}</td><td>${esc(s.phone)}</td><td>${esc(s.message)}</td><td><span class="badge ok">${esc(s.status)}</span></td></tr>`).join("") || `<tr><td colspan="4" class="empty">Aún no hay SMS enviados.</td></tr>`}</tbody></table></div></div>`;
    },

    search() {
      const q = (App.query || getFilter("searchFilter")).toLowerCase();
      const citas = data.filterAppointments(data.visibleAppointments(), q);
      const patients = data.visiblePatients().filter(p => !q || `${p.name} ${p.email} ${p.phone} ${p.dni}`.toLowerCase().includes(q));
      const users = App.currentUser().role === Rol.ADMIN ? App.state.users.filter(u => !q || `${u.name} ${u.email} ${u.role}`.toLowerCase().includes(q)) : [];
      return `
        <div class="page-title"><div><h1>Búsqueda general</h1><p>Resultados filtrados por permisos del usuario actual.</p></div></div>
        <div class="card pad" style="margin-bottom:16px"><label>Buscar</label><input id="searchFilter" value="${esc(q)}" oninput="App.query=this.value;App.render()" placeholder="Escribe un criterio" /></div>
        <div class="grid two">
          <div class="card pad"><h3 style="margin-top:0">Citas (${citas.length})</h3><div class="list">${citas.slice(0,10).map(c => appointmentMini(c)).join("") || `<div class="empty">Sin citas.</div>`}</div></div>
          <div class="card pad"><h3 style="margin-top:0">Pacientes (${patients.length})</h3><div class="list">${patients.slice(0,10).map(p => `<div class="appointment-card"><b>${esc(p.name)}</b><span class="muted">${esc(p.email)} · ${esc(p.phone)}</span></div>`).join("") || `<div class="empty">Sin pacientes.</div>`}</div></div>
          ${users.length ? `<div class="card pad" style="grid-column:1/-1"><h3 style="margin-top:0">Cuentas (${users.length})</h3><div class="list">${users.map(u => `<div class="appointment-card"><div class="appointment-head"><div><b>${esc(u.name)}</b><p class="muted" style="margin:4px 0 0">${esc(u.email)}</p></div><span class="badge ${u.role}">${labels[u.role]}</span></div></div>`).join("")}</div></div>` : ""}
        </div>`;
    },
  };

  const data = {
    visibleAppointments() {
      const user = App.currentUser();
      if (!user) return [];
      if (user.role === Rol.PACIENTE) return App.state.appointments.filter(c => c.patientId === user.patientId);
      if (user.role === Rol.MEDICO) return App.state.appointments.filter(c => c.doctorId === user.doctorId);
      return App.state.appointments;
    },
    visiblePatients() {
      const user = App.currentUser();
      if (user.role === Rol.PACIENTE) return App.state.patients.filter(p => p.id === user.patientId);
      if (user.role === Rol.MEDICO) {
        const d = App.findDoctor(user.doctorId);
        return App.state.patients.filter(p => d?.assignedPatients.includes(p.id));
      }
      return App.state.patients;
    },
    filterAppointments(citas, q = "") {
      q = String(q || "").toLowerCase();
      return citas.filter(c => {
        const p = App.findPatient(c.patientId);
        const d = App.findDoctor(c.doctorId);
        return !q || `${c.id} ${c.type} ${labels[c.type]} ${c.status} ${c.date} ${c.time} ${c.detail} ${p?.name} ${d?.name} ${d?.specialty}`.toLowerCase().includes(q);
      }).sort(sortByDateTime);
    },
    alerts() {
      const logs = App.state.logs;
      const cancelaciones = logs.filter(l => l.accion.includes("CANCELAR") || l.accion === "CITA_CANCELADA").length;
      const denegados = logs.filter(l => l.accion === "ACCESO_DENEGADO" || l.detalle.includes("AccesoNoPermitidoException")).length;
      const bloqueos = logs.filter(l => l.accion === "BLOQUEAR_HORARIO").length;
      const sms = App.state.smsOutbox.length;
      const alerts = [
        { type: "ok", title: "Roles activos", message: "El acceso se controla por permisos antes de ejecutar acciones sensibles.", mitigation: "Mantener la tabla de permisos actualizada según rol." },
        { type: "ok", title: "Trazabilidad operativa", message: `Hay ${logs.length} eventos auditables con timestamp, rol, acción y detalle.`, mitigation: "Exportar logs periódicamente para respaldo." },
      ];
      alerts.push(cancelaciones > 3 ? { type: "warn", title: "Alto número de cancelaciones", message: `Se detectaron ${cancelaciones} cancelaciones. Puede indicar sobrecarga o mala planificación.`, mitigation: "Revisar disponibilidad médica y reajustar estrategia de horarios." } : { type: "ok", title: "Cancelaciones controladas", message: `Cancelaciones registradas: ${cancelaciones}.`, mitigation: "Mantener seguimiento en trazabilidad." });
      alerts.push(denegados > 2 ? { type: "error", title: "Accesos denegados reiterados", message: `Se detectaron ${denegados} intentos denegados.`, mitigation: "Revisar cuentas, roles y posibles intentos indebidos." } : { type: "ok", title: "Seguridad estable", message: `Intentos denegados: ${denegados}.`, mitigation: "Conservar restricciones por rol." });
      alerts.push(bloqueos > 4 ? { type: "warn", title: "Muchos horarios bloqueados", message: `Bloqueos de horarios: ${bloqueos}.`, mitigation: "Coordinar agenda médica para evitar falta de cupos." } : { type: "ok", title: "Disponibilidad médica normal", message: `Bloqueos registrados: ${bloqueos}.`, mitigation: "Revisar cupos por fecha antes de agendar." });
      alerts.push({ type: sms ? "ok" : "warn", title: "Canal de mensajes", message: sms ? `SMS simulados enviados: ${sms}.` : "Aún no se generaron envíos SMS simulados.", mitigation: "Para producción, conectar un proveedor SMS real." });
      return alerts;
    },
  };

  function appointmentRow(c, user) {
    const p = App.findPatient(c.patientId);
    const d = App.findDoctor(c.doctorId);
    let actions = "";
    if ((user.role === Rol.RECEPCIONISTA || user.role === Rol.ADMIN) && c.status !== EstadoCita.CANCELADA) {
      actions += `<button class="btn small ghost" onclick="App.openAppointmentModal('${c.id}')">Editar</button>`;
      actions += `<button class="btn small danger" onclick="App.cancelAppointment('${c.id}')">Cancelar</button>`;
    }
    if (user.role === Rol.PACIENTE && c.patientId === user.patientId) {
      if (c.status === EstadoCita.PENDIENTE) actions += `<button class="btn small success" onclick="App.confirmAppointment('${c.id}')">Confirmar</button>`;
      if (c.status !== EstadoCita.CANCELADA) actions += `<button class="btn small danger" onclick="App.cancelAppointment('${c.id}', 'PACIENTE')">Cancelar</button>`;
    }
    if (!actions) actions = `<span class="muted-2">—</span>`;
    return `<tr>
      <td class="mono muted">${esc(c.id)}</td>
      <td><span class="badge ${c.type}">${labels[c.type]}</span></td>
      <td>${esc(p?.name || "—")}</td>
      <td>${esc(d?.name || "—")}<br><span class="muted" style="font-size:12px">${esc(d?.specialty || "")}</span></td>
      <td>${esc(c.date)}<br><span class="mono muted">${esc(c.time)}</span></td>
      <td><span class="badge ${c.status}">${labels[c.status]}</span></td>
      <td class="muted">${esc(c.detail || "—")}</td>
      <td><div class="actions">${actions}</div></td>
    </tr>`;
  }

  function appointmentMini(c, medical = false) {
    const p = App.findPatient(c.patientId);
    const d = App.findDoctor(c.doctorId);
    const user = App.currentUser();
    const patientVisible = user.role !== Rol.MEDICO || d?.assignedPatients.includes(c.patientId);
    return `<div class="appointment-card">
      <div class="appointment-head">
        <div>
          <div class="kpi-row"><span class="badge ${c.type}">${labels[c.type]}</span><span class="badge ${c.status}">${labels[c.status]}</span></div>
          <h3 style="margin:8px 0 2px;font-size:16px">${patientVisible ? esc(p?.name || "Paciente") : "Paciente restringido"}</h3>
          <p class="muted" style="margin:0">${esc(d?.name || "Médico")} · ${esc(d?.specialty || "")}</p>
        </div>
        <div style="text-align:right"><b>${esc(c.date)}</b><br><span class="mono muted">${esc(c.time)}</span></div>
      </div>
      ${c.detail ? `<p class="muted" style="margin:0">${esc(c.detail)}</p>` : ""}
    </div>`;
  }

  function patientCard(p, user) {
    const citas = App.state.appointments.filter(c => c.patientId === p.id);
    const canEdit = user.role === Rol.ADMIN;
    return `<div class="card pad">
      <div class="appointment-head"><div><h3 style="margin:0">${esc(p.name)}</h3><p class="muted" style="margin:5px 0 0">${esc(p.email)} · ${esc(p.phone)}</p></div><span class="badge PACIENTE">Paciente</span></div>
      <div class="kpi-row" style="margin:14px 0"><span class="badge ok">${citas.length} citas</span><span class="badge warn">${(p.history || []).length} eventos</span><span class="badge SISTEMA">DNI ${esc(p.dni || "—")}</span></div>
      <p class="muted" style="font-size:13px">Nacimiento: ${esc(p.birth || "No registrado")}</p>
      ${canEdit ? `<button class="btn small ghost" onclick="App.openPatientModal('${p.id}')">Editar paciente</button>` : ""}
    </div>`;
  }

  function strategyCard(key, title, desc) {
    const active = App.state.settings.strategy === key;
    return `<button class="card pad" style="text-align:left;border:${active ? "2px solid var(--blue)" : "1px solid var(--border)"}" onclick="App.changeStrategy('${key}')">
      <div class="appointment-head"><h3 style="margin:0;color:${active ? "var(--blue-2)" : "var(--text)"}">${esc(title)}</h3><span class="badge ${active ? "ok" : "SISTEMA"}">${active ? "Activa" : "Disponible"}</span></div>
      <p class="muted" style="margin-bottom:0">${esc(desc)}</p>
    </button>`;
  }

  function stat(label, value, small) {
    return `<div class="stat"><span>${esc(label)}</span><strong>${esc(value)}</strong><small>${esc(small || "")}</small></div>`;
  }

  function feature(title, text) {
    return `<div class="feature"><b>${esc(title)}</b><span>${esc(text)}</span></div>`;
  }

  function getFilter(id) {
    return App.filters[id] || "";
  }

  function value(id) {
    const el = document.getElementById(id);
    return el ? el.value : "";
  }

  function option(value, text, selected = "") {
    return `<option value="${esc(value)}" ${String(selected) === String(value) ? "selected" : ""}>${esc(text)}</option>`;
  }

  function esc(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function cleanExceptionMessage(message) {
    return String(message || "")
      .replace(/^[A-Za-z]+Exception:\s*/u, "")
      .replace(/^IllegalArgumentException:\s*/u, "")
      .replace(/^IllegalStateException:\s*/u, "")
      .trim() || "Ocurrió un error inesperado.";
  }

  function genId(prefix) {
    return `${prefix}${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
  }

  function initials(name) {
    return String(name || "MC").trim().split(/\s+/).slice(0, 2).map(x => x[0]?.toUpperCase()).join("") || "MC";
  }

  function now() {
    const d = new Date();
    return d.toLocaleString("es-PE", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
  }

  function todayISO() {
    return new Date().toISOString().split("T")[0];
  }

  function isFutureDate(date) {
    if (!date) return false;
    const d = new Date(date + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return d > today;
  }

  function sortByDateTime(a, b) {
    return `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`);
  }

  window.App = App;
  document.addEventListener("DOMContentLoaded", () => App.start());
})();
