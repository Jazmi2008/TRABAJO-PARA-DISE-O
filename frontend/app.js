const state = {
  apiUrl: localStorage.getItem("medicitasApiUrl") || "http://127.0.0.1:8000",
  user: safeJson(localStorage.getItem("medicitasUser")),
  authTab: "login",
  route: localStorage.getItem("medicitasRoute") || "inicio",
  cache: {
    usuarios: [],
    pacientes: [],
    doctores: [],
    citas: [],
    stats: {},
  },
  selectedDoctorId: "",
  selectedPatientId: "",
  audit: safeJson(localStorage.getItem("medicitasAudit"), []),
};

const app = document.getElementById("app");
const toastRoot = document.getElementById("toast");

const ROLE_LABELS = {
  PACIENTE: "Paciente",
  DOCTOR: "Médico",
  RECEPCIONISTA: "Recepcionista",
  ADMINISTRADOR: "Administrador",
};

const ROLE_BADGE = {
  PACIENTE: "green",
  DOCTOR: "teal",
  RECEPCIONISTA: "orange",
  ADMINISTRADOR: "purple",
};

const ESTADO_BADGE = {
  AGENDADA: "green",
  MODIFICADA: "orange",
  CANCELADA: "red",
  COMPLETADA: "gray",
};

function safeJson(value, fallback = null) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return escapeHtml(value);
  return date.toLocaleString("es-PE", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function onlyDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toISOString().slice(0, 10);
}

function normalizeTipo(tipo) {
  const raw = String(tipo || "").toLowerCase();
  if (raw.includes("laboratorio")) return "laboratorio";
  if (raw.includes("telemedicina")) return "telemedicina";
  return "consulta";
}

function tipoPretty(tipo) {
  const t = normalizeTipo(tipo);
  return t === "laboratorio" ? "Laboratorio" : t === "telemedicina" ? "Telemedicina" : "Consulta general";
}

function badge(text, type = "gray") {
  return `<span class="badge ${type}">${escapeHtml(text)}</span>`;
}

function audit(accion, detalle = "") {
  const item = {
    timestamp: new Date().toISOString(),
    rol: state.user?.rol || "ANONIMO",
    usuario: state.user?.email || "sin sesión",
    accion,
    detalle,
  };
  state.audit = [item, ...state.audit].slice(0, 180);
  localStorage.setItem("medicitasAudit", JSON.stringify(state.audit));
}

function toast(message, type = "info") {
  const node = document.createElement("div");
  node.className = `toast-message ${type}`;
  node.textContent = message;
  toastRoot.appendChild(node);
  setTimeout(() => node.remove(), 4200);
}

function setLoading(target, label = "Cargando...") {
  target.innerHTML = `<div class="loader">${escapeHtml(label)}</div>`;
}

async function api(path, options = {}) {
  const url = `${state.apiUrl}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const text = await response.text();
  const payload = text ? safeJson(text, text) : {};

  if (!response.ok) {
    const detail = payload?.detail || payload?.mensaje || payload || `Error HTTP ${response.status}`;
    throw new Error(Array.isArray(detail) ? detail.map((d) => d.msg).join(". ") : String(detail));
  }
  return payload;
}

function saveSession(user) {
  state.user = user;
  localStorage.setItem("medicitasUser", JSON.stringify(user));
  state.route = "inicio";
  localStorage.setItem("medicitasRoute", state.route);
}

function clearSession() {
  state.user = null;
  localStorage.removeItem("medicitasUser");
  state.route = "inicio";
  localStorage.setItem("medicitasRoute", state.route);
}

function isAdminLike() {
  return ["ADMINISTRADOR", "RECEPCIONISTA"].includes(state.user?.rol);
}

function canManageUsers() {
  return ["ADMINISTRADOR", "RECEPCIONISTA"].includes(state.user?.rol);
}

function canCreateCitas() {
  return ["ADMINISTRADOR", "RECEPCIONISTA"].includes(state.user?.rol);
}

function availableRoutes() {
  if (!state.user) return [];
  const common = [
    ["inicio", "Inicio", "⌂"],
    ["citas", state.user.rol === "PACIENTE" ? "Mis citas" : "Citas", "＋"],
  ];

  if (["ADMINISTRADOR", "RECEPCIONISTA", "DOCTOR"].includes(state.user.rol)) {
    common.push(["agenda", "Agenda", "▦"]);
  }
  if (canManageUsers()) {
    common.push(["usuarios", "Usuarios", "◎"]);
    common.push(["trazabilidad", "Trazabilidad", "◉"]);
  }
  if (["PACIENTE", "ADMINISTRADOR", "RECEPCIONISTA", "DOCTOR"].includes(state.user.rol)) {
    common.push(["historial", "Historial", "✚"]);
  }
  if (state.user.rol === "PACIENTE") {
    common.push(["notificaciones", "Notificaciones", "✉"]);
  }
  common.push(["arquitectura", "Patrones", "◇"]);
  common.push(["perfil", "Perfil", "☷"]);
  return common;
}

function ensureRoute() {
  const routes = availableRoutes().map((r) => r[0]);
  if (!routes.includes(state.route)) state.route = "inicio";
}

async function refreshBaseData() {
  if (!state.user) return;
  try {
    const [doctores, pacientes] = await Promise.all([
      api("/usuarios/doctores").catch(() => ({ doctores: [] })),
      api("/usuarios/pacientes").catch(() => ({ pacientes: [] })),
    ]);
    state.cache.doctores = doctores.doctores || [];
    state.cache.pacientes = pacientes.pacientes || [];
  } catch (error) {
    console.warn(error);
  }
}

async function loadUsuarios() {
  const data = await api("/usuarios/todos");
  state.cache.usuarios = data.usuarios || [];
  state.cache.stats = data.estadisticas || {};
  state.cache.doctores = state.cache.usuarios.filter((u) => u.rol === "DOCTOR");
  state.cache.pacientes = state.cache.usuarios.filter((u) => u.rol === "PACIENTE");
  return data;
}

async function loadCitasForCurrentRole(params = "") {
  let data;
  if (state.user.rol === "PACIENTE") {
    data = await api(`/citas/paciente/${state.user.id}`);
  } else if (state.user.rol === "DOCTOR") {
    data = await api(`/citas/doctor/${state.user.id}`);
  } else if (params) {
    data = await api(`/citas/buscar${params}`);
  } else {
    data = await api("/citas/todas");
  }
  state.cache.citas = data.citas || [];
  return state.cache.citas;
}

function render() {
  if (!state.user) {
    renderAuth();
    return;
  }
  ensureRoute();
  localStorage.setItem("medicitasRoute", state.route);
  renderShell();
}

function renderAuth() {
  app.innerHTML = `
    <main class="login-page">
      <section class="hero">
        <div class="brand">
          <div class="logo">MC</div>
          <div>
            <h1>MediCitas</h1>
            <p>Sistema de gestión de citas médicas</p>
          </div>
        </div>
        
        <p>
          Interfaz para pacientes, médicos, recepcionistas y administradores. Permite iniciar sesión,
          registrar cuentas, gestionar citas, revisar agenda, ver notificaciones e historial médico,
          siguiendo los módulos del informe: roles, citas, notificaciones, agenda, patrones y contratos.
        </p>
        <div class="hero-list">
          <div><strong>Roles diferenciados</strong><br><span class="muted">Paciente, médico, recepcionista y administrador.</span></div>
          <div><strong>Agenda médica</strong><br><span class="muted">Slots libres, generación de agenda y reservas.</span></div>
          <div><strong>Citas médicas</strong><br><span class="muted">Crear, buscar, cancelar, completar y consultar detalles.</span></div>
          <div><strong>Notificaciones</strong><br><span class="muted">Panel para avisos internos del paciente.</span></div>
        </div>
      </section>

      <section class="card auth-card">
        <div class="tabs">
          <button class="${state.authTab === "login" ? "active" : ""}" data-action="auth-tab" data-tab="login">Iniciar sesión</button>
          <button class="${state.authTab === "registro" ? "active" : ""}" data-action="auth-tab" data-tab="registro">Crear cuenta</button>
        </div>
        ${state.authTab === "login" ? authLoginTemplate() : authRegistroTemplate()}
      </section>
    </main>
  `;
}

function authLoginTemplate() {
  return `
    <form class="form" id="login-form">
      <div class="form-row">
        <label>URL del backend</label>
        <input name="apiUrl" value="${escapeHtml(state.apiUrl)}" placeholder="http://127.0.0.1:8000" />
      </div>
      <div class="form-row">
        <label>Correo</label>
        <input name="email" type="email" value="admin@clinica.com" required />
      </div>
      <div class="form-row">
        <label>Contraseña</label>
        <input name="password" type="password" value="admin123" required />
      </div>
      <button class="btn" type="submit">Entrar al sistema</button>
      <button class="btn secondary" type="button" data-action="test-api">Probar conexión API</button>
    </form>
    
  `;
}

function authRegistroTemplate() {
  return `
    <form class="form" id="registro-form">
      <div class="form-row">
        <label>URL del backend</label>
        <input name="apiUrl" value="${escapeHtml(state.apiUrl)}" />
      </div>
      <div class="form-grid">
        <div class="form-row">
          <label>ID</label>
          <input name="id" placeholder="P-010" required />
        </div>
        <div class="form-row">
          <label>Rol</label>
          <select name="rol" id="registro-rol">
            <option value="PACIENTE">Paciente</option>
            
          </select>
        </div>
      </div>
      <div class="form-row">
        <label>Nombre completo</label>
        <input name="nombre" required />
      </div>
      <div class="form-row">
        <label>Correo</label>
        <input name="email" type="email" required />
      </div>
      <div class="form-row">
        <label>Contraseña</label>
        <input name="password" type="password" required />
      </div>
      <div class="form-grid">
        <div class="form-row" data-role-field="PACIENTE">
          <label>Teléfono</label>
          <input name="telefono" placeholder="+51999999999" />
        </div>
        <div class="form-row" data-role-field="DOCTOR">
          <label>Especialidad</label>
          <input name="especialidad" placeholder="Medicina General" />
        </div>
      </div>
      <button class="btn" type="submit">Crear cuenta</button>
      <p class="muted">Después de registrar la cuenta, inicia sesión con el correo y contraseña creados.</p>
    </form>
  `;
}

function renderShell() {
  const routes = availableRoutes();
  const routeTitle = routes.find((r) => r[0] === state.route)?.[1] || "Inicio";
  app.innerHTML = `
    <div class="app-shell">
      <aside class="sidebar">
        <div class="brand">
          <div class="logo">MC</div>
          <div>
            <h1>MediCitas</h1>
            <p>Frontend clínico</p>
          </div>
        </div>

        <div class="user-card">
          <strong>${escapeHtml(state.user.nombre)}</strong>
          ${badge(ROLE_LABELS[state.user.rol] || state.user.rol, ROLE_BADGE[state.user.rol] || "gray")}
          <p class="muted" style="margin-bottom:0;">${escapeHtml(state.user.email)}</p>
        </div>

        <nav class="nav">
          ${routes.map(([route, label, icon]) => `
            <button class="${state.route === route ? "active" : ""}" data-action="nav" data-route="${route}">
              <span>${icon}</span> ${escapeHtml(label)}
            </button>
          `).join("")}
        </nav>

        <button class="btn ghost" data-action="logout">Cerrar sesión</button>
      </aside>

      <main class="main">
        <div class="topbar">
          <div>
            <h2>${escapeHtml(routeTitle)}</h2>
            <p>API conectada a: <strong>${escapeHtml(state.apiUrl)}</strong></p>
          </div>
          <div class="actions">
            <button class="btn secondary" data-action="refresh">Actualizar</button>
            <button class="btn ghost" data-action="nav" data-route="perfil">Configurar API</button>
          </div>
        </div>
        <section id="content"><div class="loader">Preparando pantalla...</div></section>
      </main>
    </div>
  `;
  renderRouteContent();
}

async function renderRouteContent() {
  const content = document.getElementById("content");
  try {
    if (state.route === "inicio") await renderDashboard(content);
    if (state.route === "citas") await renderCitas(content);
    if (state.route === "agenda") await renderAgenda(content);
    if (state.route === "usuarios") await renderUsuarios(content);
    if (state.route === "historial") await renderHistorial(content);
    if (state.route === "notificaciones") await renderNotificaciones(content);
    if (state.route === "trazabilidad") renderTrazabilidad(content);
    if (state.route === "arquitectura") renderArquitectura(content);
    if (state.route === "perfil") renderPerfil(content);
  } catch (error) {
    content.innerHTML = errorPanel(error);
    toast(error.message, "error");
  }
}

function errorPanel(error) {
  return `
    <div class="panel">
      <h3>No se pudo cargar esta sección</h3>
      <p class="muted">${escapeHtml(error.message)}</p>
      <div class="quick-actions">
        <button class="btn" data-action="refresh">Reintentar</button>
        <button class="btn secondary" data-action="nav" data-route="perfil">Cambiar URL API</button>
      </div>
    </div>
  `;
}

async function renderDashboard(content) {
  setLoading(content, "Cargando resumen...");
  await refreshBaseData();
  const citas = await loadCitasForCurrentRole().catch(() => []);
  const usuariosData = isAdminLike() ? await loadUsuarios().catch(() => null) : null;
  const notifs = state.user.rol === "PACIENTE" ? await api(`/usuarios/${state.user.id}/notificaciones`).catch(() => ({ no_leidas: 0 })) : { no_leidas: 0 };

  const stats = usuariosData?.estadisticas || state.cache.stats || {};
  const agendadas = citas.filter((c) => c.estado === "AGENDADA").length;
  const canceladas = citas.filter((c) => c.estado === "CANCELADA").length;
  const completadas = citas.filter((c) => c.estado === "COMPLETADA").length;

  content.innerHTML = `
    <div class="grid four">
      <div class="stat-card"><span>Citas visibles</span><strong>${citas.length}</strong></div>
      <div class="stat-card"><span>Agendadas</span><strong>${agendadas}</strong></div>
      <div class="stat-card"><span>Completadas</span><strong>${completadas}</strong></div>
      <div class="stat-card"><span>${state.user.rol === "PACIENTE" ? "Notif. no leídas" : "Canceladas"}</span><strong>${state.user.rol === "PACIENTE" ? notifs.no_leidas : canceladas}</strong></div>
    </div>

    ${isAdminLike() ? `
      <div style="height:18px"></div>
      <div class="grid four">
        <div class="stat-card"><span>Total usuarios</span><strong>${stats.total_usuarios || 0}</strong></div>
        <div class="stat-card"><span>Pacientes</span><strong>${stats.pacientes || state.cache.pacientes.length}</strong></div>
        <div class="stat-card"><span>Médicos</span><strong>${stats.doctores || state.cache.doctores.length}</strong></div>
        <div class="stat-card"><span>Recepción/Admin</span><strong>${(stats.recepcionistas || 0) + (stats.administradores || 0)}</strong></div>
      </div>` : ""}

    <div style="height:18px"></div>
    <div class="split">
      <section class="panel">
        <h3 class="section-title">Acciones rápidas</h3>
        <div class="quick-actions">
          ${canCreateCitas() ? `<button class="btn" data-action="nav" data-route="citas">Agendar cita</button>` : ""}
          ${["DOCTOR", "RECEPCIONISTA", "ADMINISTRADOR"].includes(state.user.rol) ? `<button class="btn secondary" data-action="nav" data-route="agenda">Ver agenda</button>` : ""}
          ${canManageUsers() ? `<button class="btn secondary" data-action="nav" data-route="usuarios">Gestionar usuarios</button>` : ""}
          ${canManageUsers() ? `<button class="btn ghost" data-action="nav" data-route="trazabilidad">Ver trazabilidad</button>` : ""}
          ${state.user.rol === "PACIENTE" ? `<button class="btn" data-action="nav" data-route="notificaciones">Ver notificaciones</button>` : ""}
          <button class="btn ghost" data-action="nav" data-route="arquitectura">Ver patrones del sistema</button>
        </div>
      </section>
      <section class="panel">
        <h3 class="section-title">Últimas citas</h3>
        ${citas.length ? citasTable(citas.slice(0, 5), false) : `<div class="empty">Aún no hay citas para mostrar.</div>`}
      </section>
    </div>
  `;
}

async function renderCitas(content) {
  setLoading(content, "Cargando citas...");
  await refreshBaseData();
  const citas = await loadCitasForCurrentRole();

  content.innerHTML = `
    <div class="grid ${canCreateCitas() ? "two" : ""}">
      ${canCreateCitas() ? crearCitaPanel() : ""}
      <section class="panel">
        <h3 class="section-title">${state.user.rol === "PACIENTE" ? "Mis citas" : state.user.rol === "DOCTOR" ? "Mis atenciones" : "Registro de citas"}</h3>
        ${isAdminLike() ? searchCitasForm() : ""}
        <div style="height:14px"></div>
        <div id="citas-list">${citas.length ? citasTable(citas, true) : `<div class="empty">No se encontraron citas.</div>`}</div>
      </section>
    </div>
  `;
  updateCitaExtraFields();
}

function crearCitaPanel() {
  return `
    <section class="panel">
      <h3 class="section-title">Agendar nueva cita</h3>
      <form class="form" id="crear-cita-form">
        <div class="form-row">
          <label>Paciente</label>
          <select name="paciente_id" required>
            <option value="">Seleccionar paciente</option>
            ${state.cache.pacientes.map((p) => `<option value="${escapeHtml(p.id)}">${escapeHtml(p.nombre)} · ${escapeHtml(p.id)}</option>`).join("")}
          </select>
        </div>
        <div class="form-row">
          <label>Médico</label>
          <select name="doctor_id" id="crear-cita-doctor" required>
            <option value="">Seleccionar médico</option>
            ${state.cache.doctores.map((d) => `<option value="${escapeHtml(d.id)}">${escapeHtml(d.nombre)} · ${escapeHtml(d.especialidad || "Sin especialidad")}</option>`).join("")}
          </select>
        </div>
        <div class="form-row">
          <label>Horario disponible</label>
          <select name="slot_id" id="crear-cita-slot" required>
            <option value="">Primero elige un médico</option>
          </select>
          <button class="btn secondary small" type="button" data-action="generate-agenda-for-form">Generar agenda si no hay horarios</button>
        </div>
        <div class="form-row">
          <label>Tipo de cita</label>
          <select name="tipo" id="crear-cita-tipo" required>
            <option value="consulta">Consulta general</option>
            <option value="telemedicina">Telemedicina</option>
            <option value="laboratorio">Laboratorio</option>
          </select>
        </div>
        <div id="tipo-extra-fields"></div>
        <button class="btn" type="submit">Guardar cita</button>
      </form>
    </section>
  `;
}

function searchCitasForm() {
  return `
    <form class="form" id="buscar-citas-form">
      <div class="form-grid">
        <div class="form-row"><label>Fecha</label><input name="fecha" type="date"></div>
        <div class="form-row"><label>Paciente</label><input name="nombre" placeholder="Nombre parcial"></div>
        <div class="form-row"><label>ID cita</label><input name="id_cita" placeholder="C-001"></div>
        <div class="form-row">
          <label>Médico</label>
          <select name="doctor_id">
            <option value="">Todos</option>
            ${state.cache.doctores.map((d) => `<option value="${escapeHtml(d.id)}">${escapeHtml(d.nombre)}</option>`).join("")}
          </select>
        </div>
      </div>
      <div class="quick-actions">
        <button class="btn secondary" type="submit">Buscar</button>
        <button class="btn ghost" type="button" data-action="clear-cita-search">Limpiar</button>
      </div>
    </form>
  `;
}

function citasTable(citas, withActions = true) {
  return `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Fecha</th>
            <th>Paciente</th>
            <th>Médico</th>
            <th>Tipo</th>
            <th>Estado</th>
            ${withActions ? "<th>Acciones</th>" : ""}
          </tr>
        </thead>
        <tbody>
          ${citas.map((c) => citaRow(c, withActions)).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function citaRow(cita, withActions) {
  const paciente = cita.paciente?.nombre || "—";
  const doctor = cita.doctor?.nombre || "—";
  const estadoType = ESTADO_BADGE[cita.estado] || "gray";
  return `
    <tr>
      <td><strong>${escapeHtml(cita.id_cita)}</strong><br><span class="muted">${escapeHtml(cita.slot_id || "sin slot")}</span></td>
      <td>${formatDate(cita.fecha_hora)}</td>
      <td>${escapeHtml(paciente)}</td>
      <td>${escapeHtml(doctor)}<br><span class="muted">${escapeHtml(cita.doctor?.especialidad || "")}</span></td>
      <td>${badge(tipoPretty(cita.tipo), "teal")}<br><span class="muted">${escapeHtml(cita.detalles || "")}</span></td>
      <td>${badge(cita.estado || "—", estadoType)}</td>
      ${withActions ? `<td>${citaActions(cita)}</td>` : ""}
    </tr>
  `;
}

function citaActions(cita) {
  const closed = ["CANCELADA", "COMPLETADA"].includes(cita.estado);
  const actions = [];
  actions.push(`<button class="btn ghost small" data-action="view-cita" data-id="${escapeHtml(cita.id_cita)}">Detalle</button>`);
  if (["PACIENTE", "RECEPCIONISTA", "ADMINISTRADOR"].includes(state.user.rol) && !closed) {
    actions.push(`<button class="btn danger small" data-action="cancel-cita" data-id="${escapeHtml(cita.id_cita)}">Cancelar</button>`);
  }
  if (["DOCTOR", "RECEPCIONISTA", "ADMINISTRADOR"].includes(state.user.rol) && !closed) {
    actions.push(`<button class="btn secondary small" data-action="complete-cita" data-id="${escapeHtml(cita.id_cita)}">Completar</button>`);
  }
  return `<div class="quick-actions">${actions.join("")}</div>`;
}

async function loadSlotsForDoctor(doctorId, selectId = "crear-cita-slot") {
  const select = document.getElementById(selectId);
  if (!select) return;
  if (!doctorId) {
    select.innerHTML = `<option value="">Primero elige un médico</option>`;
    return;
  }
  select.innerHTML = `<option value="">Cargando horarios...</option>`;
  try {
    const data = await api(`/usuarios/${doctorId}/agenda/slots-libres`);
    const slots = data.slots || [];
    select.innerHTML = slots.length
      ? `<option value="">Selecciona un horario</option>${slots.map((s) => `<option value="${escapeHtml(s.id_slot)}">${formatDate(s.fecha_hora)} · ${s.duracion_minutos} min</option>`).join("")}`
      : `<option value="">No hay horarios libres</option>`;
  } catch (error) {
    select.innerHTML = `<option value="">Sin agenda generada</option>`;
  }
}

function updateCitaExtraFields() {
  const tipo = document.getElementById("crear-cita-tipo")?.value || "consulta";
  const target = document.getElementById("tipo-extra-fields");
  if (!target) return;

  if (tipo === "laboratorio") {
    target.innerHTML = `
      <div class="form-grid">
        <div class="form-row"><label>Tipo de análisis</label><input name="tipo_analisis" value="Sangre"></div>
        <div class="form-row"><label>¿Requiere ayuno?</label><select name="requiere_ayuno"><option value="false">No</option><option value="true">Sí</option></select></div>
      </div>`;
  } else if (tipo === "telemedicina") {
    target.innerHTML = `
      <div class="form-row"><label>URL plataforma</label><input name="url_plataforma" value="https://telemedicina.clinica.com"></div>
      <div class="form-row"><label>Link de acceso</label><input name="link_acceso" value="https://meet.clinica.com/abc123"></div>`;
  } else {
    target.innerHTML = `<div class="form-row"><label>Nro. consultorio</label><input name="nro_consultorio" value="101"></div>`;
  }
}

async function renderAgenda(content) {
  setLoading(content, "Cargando agenda...");
  await refreshBaseData();
  const defaultDoctor = state.user.rol === "DOCTOR" ? state.user.id : (state.selectedDoctorId || state.cache.doctores[0]?.id || "");
  state.selectedDoctorId = defaultDoctor;

  let agenda = null;
  if (defaultDoctor) {
    agenda = await api(`/usuarios/${defaultDoctor}/agenda`).catch(() => null);
  }
  const doctorActual = state.cache.doctores.find((d) => d.id === defaultDoctor) || (state.user.rol === "DOCTOR" ? state.user : null);
  const slots = agenda?.agenda?.slots || [];

  content.innerHTML = `
    <section class="panel">
      <div class="topbar" style="margin-bottom:16px;">
        <div>
          <h3 class="section-title">Agenda médica</h3>
          <p class="muted">${doctorActual ? `${escapeHtml(doctorActual.nombre)} · ${escapeHtml(doctorActual.especialidad || "")}` : "Selecciona un médico para revisar horarios."}</p>
        </div>
        <div class="quick-actions">
          ${state.user.rol !== "DOCTOR" ? `
            <select id="agenda-doctor-select" style="min-width:260px;">
              ${state.cache.doctores.map((d) => `<option value="${escapeHtml(d.id)}" ${d.id === defaultDoctor ? "selected" : ""}>${escapeHtml(d.nombre)} · ${escapeHtml(d.especialidad || "")}</option>`).join("")}
            </select>` : ""}
          <button class="btn secondary" data-action="generate-agenda" data-id="${escapeHtml(defaultDoctor)}">Generar 7 días</button>
        </div>
      </div>
      ${slots.length ? slotGrid(slots) : `<div class="empty">No hay agenda generada para este médico. Usa “Generar 7 días”.</div>`}
    </section>
  `;
}

function slotGrid(slots) {
  return `
    <div class="slot-grid">
      ${slots.map((s) => {
        const cls = s.estado === "LIBRE" ? "free" : s.estado === "RESERVADO" ? "reserved" : "busy";
        const btype = s.estado === "LIBRE" ? "green" : s.estado === "RESERVADO" ? "orange" : "red";
        return `
          <div class="slot ${cls}">
            <strong>${formatDate(s.fecha_hora)}</strong>
            <p class="muted">Duración: ${s.duracion_minutos} min · Versión ${s.version}</p>
            ${badge(s.estado, btype)}
          </div>
        `;
      }).join("")}
    </div>
  `;
}

async function renderUsuarios(content) {
  setLoading(content, "Cargando usuarios...");
  const data = await loadUsuarios();
  const usuarios = data.usuarios || [];
  content.innerHTML = `
    <div class="split">
      <section class="panel">
        <h3 class="section-title">Crear usuario</h3>
        ${usuarioFormTemplate()}
      </section>
      <section class="panel">
        <h3 class="section-title">Usuarios registrados</h3>
        ${usuarios.length ? usuariosTable(usuarios) : `<div class="empty">No hay usuarios.</div>`}
      </section>
    </div>
  `;
}

function usuarioFormTemplate(user = null) {
  const isEdit = Boolean(user);
  return `
    <form class="form" id="${isEdit ? "editar-usuario-form" : "crear-usuario-form"}">
      ${isEdit ? `<input type="hidden" name="id" value="${escapeHtml(user.id)}">` : `
        <div class="form-row"><label>ID</label><input name="id" placeholder="P-010" required></div>
        <div class="form-row">
          <label>Rol</label>
          <select name="rol" required>
            <option value="PACIENTE">Paciente</option>
            <option value="DOCTOR">Médico</option>
            <option value="RECEPCIONISTA">Recepcionista</option>
            <option value="ADMINISTRADOR">Administrador</option>
          </select>
        </div>`}
      <div class="form-row"><label>Nombre</label><input name="nombre" value="${escapeHtml(user?.nombre || "")}" required></div>
      <div class="form-row"><label>Correo</label><input name="email" type="email" value="${escapeHtml(user?.email || "")}" required></div>
      <div class="form-row"><label>Contraseña</label><input name="password" type="password" ${isEdit ? "placeholder='Dejar vacío para no cambiar'" : "required"}></div>
      <div class="form-row"><label>Teléfono</label><input name="telefono" value="${escapeHtml(user?.telefono || "")}"></div>
      <div class="form-row"><label>Especialidad</label><input name="especialidad" value="${escapeHtml(user?.especialidad || "")}"></div>
      <button class="btn" type="submit">${isEdit ? "Actualizar" : "Crear"}</button>
    </form>
  `;
}

function usuariosTable(usuarios) {
  return `
    <div class="table-wrap">
      <table>
        <thead><tr><th>ID</th><th>Nombre</th><th>Correo</th><th>Rol</th><th>Datos</th><th>Acciones</th></tr></thead>
        <tbody>
          ${usuarios.map((u) => `
            <tr>
              <td><strong>${escapeHtml(u.id)}</strong></td>
              <td>${escapeHtml(u.nombre)}</td>
              <td>${escapeHtml(u.email)}</td>
              <td>${badge(ROLE_LABELS[u.rol] || u.rol, ROLE_BADGE[u.rol] || "gray")}</td>
              <td><span class="muted">${escapeHtml(u.telefono || u.especialidad || "—")}</span></td>
              <td>
                <div class="quick-actions">
                  <button class="btn ghost small" data-action="edit-user" data-id="${escapeHtml(u.id)}">Editar</button>
                  <button class="btn danger small" data-action="delete-user" data-id="${escapeHtml(u.id)}" ${u.id === "A-001" ? "disabled" : ""}>Eliminar</button>
                </div>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
    <div id="edit-user-panel" style="margin-top:16px;"></div>
  `;
}

async function renderHistorial(content) {
  setLoading(content, "Cargando historial...");
  await refreshBaseData();
  const patientId = state.user.rol === "PACIENTE" ? state.user.id : (state.selectedPatientId || state.cache.pacientes[0]?.id || "");
  state.selectedPatientId = patientId;
  const data = patientId ? await api(`/usuarios/pacientes/${patientId}/historial`).catch(() => ({ historial: null })) : { historial: null };
  const patient = state.cache.pacientes.find((p) => p.id === patientId) || (state.user.rol === "PACIENTE" ? state.user : null);

  content.innerHTML = `
    <section class="panel">
      <div class="topbar" style="margin-bottom:16px;">
        <div>
          <h3 class="section-title">Historial médico</h3>
          <p class="muted">${patient ? `${escapeHtml(patient.nombre)} · ${escapeHtml(patient.id)}` : "Selecciona un paciente."}</p>
        </div>
        ${state.user.rol !== "PACIENTE" ? `
          <select id="historial-paciente-select" style="max-width:320px;">
            ${state.cache.pacientes.map((p) => `<option value="${escapeHtml(p.id)}" ${p.id === patientId ? "selected" : ""}>${escapeHtml(p.nombre)} · ${escapeHtml(p.id)}</option>`).join("")}
          </select>` : ""}
      </div>

      ${historialTemplate(data.historial)}

      ${state.user.rol !== "PACIENTE" && patientId ? `
        <div style="height:18px"></div>
        <section class="card">
          <h3 class="section-title">Actualizar historial</h3>
          <form class="form" id="historial-form">
            <input type="hidden" name="paciente_id" value="${escapeHtml(patientId)}">
            <div class="form-grid">
              <div class="form-row"><label>Diagnóstico</label><input name="diagnostico" placeholder="Ej. Control general"></div>
              <div class="form-row"><label>Alergia</label><input name="alergia" placeholder="Ej. Penicilina"></div>
              <div class="form-row"><label>Medicamento</label><input name="medicamento" placeholder="Ej. Paracetamol"></div>
            </div>
            <button class="btn" type="submit">Guardar en historial</button>
          </form>
        </section>` : ""}
    </section>
  `;
}

function historialTemplate(historial) {
  if (!historial) return `<div class="empty">No hay historial disponible.</div>`;
  return `
    <div class="grid three">
      ${historialList("Diagnósticos", historial.diagnosticos)}
      ${historialList("Alergias", historial.alergias)}
      ${historialList("Medicamentos", historial.medicamentos)}
    </div>
  `;
}

function historialList(title, items = []) {
  return `
    <div class="card">
      <h3 class="section-title">${escapeHtml(title)}</h3>
      ${items.length ? `<div class="inline-list">${items.map((i) => badge(i, "gray")).join("")}</div>` : `<p class="muted">Sin registros.</p>`}
    </div>
  `;
}

async function renderNotificaciones(content) {
  setLoading(content, "Cargando notificaciones...");
  const data = await api(`/usuarios/${state.user.id}/notificaciones`);
  const notifs = data.notificaciones || [];
  content.innerHTML = `
    <section class="panel">
      <div class="topbar" style="margin-bottom:16px;">
        <div>
          <h3 class="section-title">Centro de notificaciones</h3>
          <p class="muted">${data.no_leidas || 0} notificaciones no leídas.</p>
        </div>
      </div>
      ${notifs.length ? `
        <div class="timeline">
          ${notifs.map((n) => `
            <div class="timeline-item">
              <div class="quick-actions" style="justify-content:space-between;">
                <strong>${escapeHtml(n.mensaje)}</strong>
                ${badge(n.leida ? "Leída" : "Nueva", n.leida ? "gray" : "green")}
              </div>
              <span class="muted">${formatDate(n.fecha)} · Cita: ${escapeHtml(n.cita_id || "—")}</span>
              ${!n.leida ? `<button class="btn secondary small" style="width:max-content;" data-action="mark-notification" data-id="${escapeHtml(n.id)}">Marcar como leída</button>` : ""}
            </div>
          `).join("")}
        </div>` : `<div class="empty">No tienes notificaciones por ahora.</div>`}
    </section>
  `;
}

function renderTrazabilidad(content) {
  const logs = state.audit || [];
  const byAction = logs.reduce((acc, item) => {
    acc[item.accion] = (acc[item.accion] || 0) + 1;
    return acc;
  }, {});
  const topActions = Object.entries(byAction).sort((a, b) => b[1] - a[1]).slice(0, 4);

  content.innerHTML = `
    <section class="panel">
      <div class="topbar" style="margin-bottom:16px;">
        <div>
          <h3 class="section-title">Trazabilidad del frontend</h3>
          <p class="muted">Registro local de acciones realizadas desde la interfaz: timestamp, rol, acción y detalle.</p>
        </div>
        <div class="quick-actions">
          <button class="btn secondary" data-action="refresh">Actualizar</button>
          <button class="btn danger" data-action="clear-audit">Limpiar registro local</button>
        </div>
      </div>
      <div class="grid four">
        <div class="stat-card"><span>Eventos</span><strong>${logs.length}</strong></div>
        <div class="stat-card"><span>Rol actual</span><strong style="font-size:1.2rem;">${escapeHtml(ROLE_LABELS[state.user.rol] || state.user.rol)}</strong></div>
        <div class="stat-card"><span>Acción principal</span><strong style="font-size:1.2rem;">${escapeHtml(topActions[0]?.[0] || "—")}</strong></div>
        <div class="stat-card"><span>Último evento</span><strong style="font-size:1rem;">${logs[0] ? formatDate(logs[0].timestamp) : "—"}</strong></div>
      </div>
      <div style="height:18px"></div>
      ${topActions.length ? `<div class="inline-list">${topActions.map(([name, count]) => badge(`${name}: ${count}`, "teal")).join("")}</div><div style="height:18px"></div>` : ""}
      ${logs.length ? `
        <div class="table-wrap">
          <table>
            <thead><tr><th>Fecha</th><th>Usuario</th><th>Rol</th><th>Acción</th><th>Detalle</th></tr></thead>
            <tbody>
              ${logs.map((l) => `
                <tr>
                  <td>${formatDate(l.timestamp)}</td>
                  <td>${escapeHtml(l.usuario)}</td>
                  <td>${badge(ROLE_LABELS[l.rol] || l.rol, ROLE_BADGE[l.rol] || "gray")}</td>
                  <td><strong>${escapeHtml(l.accion)}</strong></td>
                  <td>${escapeHtml(l.detalle || "—")}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>` : `<div class="empty">Aún no hay eventos. Crea o modifica una cita para generar trazabilidad.</div>`}
      <p class="muted" style="margin-top:14px;">Nota: el backend entregado no expone un endpoint de trazabilidad; por eso esta pantalla registra las acciones ejecutadas desde el frontend.</p>
    </section>
  `;
}

function renderArquitectura(content) {
  const patterns = [
    ["Singleton + Roles", "Una única instancia coordina las citas y aplica restricciones de acceso según paciente, médico, recepción o administración."],
    ["Factory Method", "La creación de consulta general, telemedicina o laboratorio queda separada para poder agregar nuevos tipos sin romper el flujo."],
    ["Observer extendido", "Cuando cambia una cita, se notifican observadores y el paciente puede consultar sus avisos internos."],
    ["Adapter SMS", "El backend traduce la notificación del sistema al servicio externo de SMS sin acoplar la lógica principal."],
    ["Strategy", "La asignación de horarios puede cambiar de política sin reescribir la gestión de citas."],
    ["Design by Contract", "Las acciones del frontend respetan entradas obligatorias, estados y restricciones antes de llamar al backend."],
  ];

  content.innerHTML = `
    <section class="panel">
      <h3 class="section-title">Patrones y módulos reflejados en la interfaz</h3>
      <p class="muted">Esta pantalla ayuda a explicar cómo el frontend se alinea con el informe: citas, agenda, usuarios, notificaciones, historial y roles.</p>
      <div style="height:16px"></div>
      <div class="pattern-grid">
        ${patterns.map(([title, desc]) => `
          <div class="pattern-card">
            <h4>${escapeHtml(title)}</h4>
            <p>${escapeHtml(desc)}</p>
          </div>
        `).join("")}
      </div>
    </section>
  `;
}

function renderPerfil(content) {
  content.innerHTML = `
    <section class="panel">
      <h3 class="section-title">Perfil y conexión</h3>
      <div class="grid two">
        <div class="card">
          <h3 class="section-title">Usuario actual</h3>
          <p><strong>${escapeHtml(state.user.nombre)}</strong></p>
          <p class="muted">${escapeHtml(state.user.email)}</p>
          <p>${badge(ROLE_LABELS[state.user.rol] || state.user.rol, ROLE_BADGE[state.user.rol] || "gray")}</p>
        </div>
        <div class="card">
          <h3 class="section-title">Backend API</h3>
          <form class="form" id="api-config-form">
            <div class="form-row">
              <label>URL base</label>
              <input name="apiUrl" value="${escapeHtml(state.apiUrl)}" placeholder="http://127.0.0.1:8000">
            </div>
            <div class="quick-actions">
              <button class="btn" type="submit">Guardar URL</button>
              <button class="btn secondary" type="button" data-action="test-api">Probar conexión</button>
            </div>
          </form>
        </div>
      </div>
    </section>
  `;
}

function formToObject(form) {
  const data = Object.fromEntries(new FormData(form).entries());
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === "string") data[key] = value.trim();
  }
  return data;
}

function compactPayload(obj) {
  const out = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== "" && value !== null && value !== undefined) out[key] = value;
  }
  return out;
}

async function handleLogin(form) {
  const data = formToObject(form);
  state.apiUrl = data.apiUrl.replace(/\/$/, "");
  localStorage.setItem("medicitasApiUrl", state.apiUrl);
  const res = await api("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: data.email, password: data.password }),
  });
  saveSession(res.usuario);
  audit("LOGIN", `Inicio de sesión: ${res.usuario.email}`);
  toast(`Bienvenido/a, ${res.usuario.nombre}`, "success");
  render();
}

async function handleRegistro(form) {
  const data = formToObject(form);
  state.apiUrl = data.apiUrl.replace(/\/$/, "");
  localStorage.setItem("medicitasApiUrl", state.apiUrl);
  const payload = compactPayload({
    id: data.id,
    nombre: data.nombre,
    email: data.email,
    password: data.password,
    rol: data.rol,
    telefono: data.telefono,
    especialidad: data.especialidad,
  });
  await api("/auth/registro", { method: "POST", body: JSON.stringify(payload) });
  audit("REGISTRO", `Cuenta creada: ${payload.email} (${payload.rol})`);
  state.authTab = "login";
  toast("Cuenta creada. Ahora puedes iniciar sesión.", "success");
  renderAuth();
}

async function handleCrearCita(form) {
  const data = formToObject(form);
  const payload = compactPayload({
    paciente_id: data.paciente_id,
    doctor_id: data.doctor_id,
    slot_id: data.slot_id,
    tipo: data.tipo,
    tipo_analisis: data.tipo_analisis,
    requiere_ayuno: data.requiere_ayuno === "true",
    url_plataforma: data.url_plataforma,
    link_acceso: data.link_acceso,
    nro_consultorio: data.nro_consultorio,
  });
  await api("/citas/", { method: "POST", body: JSON.stringify(payload) });
  audit("CREAR_CITA", `Paciente ${payload.paciente_id}, médico ${payload.doctor_id}, tipo ${payload.tipo}`);
  toast("Cita agendada correctamente.", "success");
  await renderRouteContent();
}

async function handleBuscarCitas(form) {
  const data = formToObject(form);
  const params = new URLSearchParams();
  for (const key of ["fecha", "nombre", "id_cita", "doctor_id"]) {
    if (data[key]) params.set(key, data[key]);
  }
  const citas = await loadCitasForCurrentRole(params.toString() ? `?${params.toString()}` : "");
  const list = document.getElementById("citas-list");
  if (list) list.innerHTML = citas.length ? citasTable(citas, true) : `<div class="empty">No se encontraron citas con esos filtros.</div>`;
}

async function handleCrearUsuario(form) {
  const data = formToObject(form);
  const payload = compactPayload({
    id: data.id,
    nombre: data.nombre,
    email: data.email,
    password: data.password,
    rol: data.rol,
    telefono: data.telefono,
    especialidad: data.especialidad,
  });
  await api("/usuarios/", { method: "POST", body: JSON.stringify(payload) });
  audit("CREAR_USUARIO", `${payload.id} · ${payload.email} · ${payload.rol}`);
  toast("Usuario creado correctamente.", "success");
  await renderRouteContent();
}

async function handleEditarUsuario(form) {
  const data = formToObject(form);
  const id = data.id;
  const payload = compactPayload({
    nombre: data.nombre,
    email: data.email,
    password: data.password,
    telefono: data.telefono,
    especialidad: data.especialidad,
  });
  await api(`/usuarios/${id}`, { method: "PUT", body: JSON.stringify(payload) });
  audit("EDITAR_USUARIO", id);
  toast("Usuario actualizado.", "success");
  await renderRouteContent();
}

async function handleHistorial(form) {
  const data = formToObject(form);
  const payload = compactPayload({
    diagnostico: data.diagnostico,
    alergia: data.alergia,
    medicamento: data.medicamento,
  });
  if (!Object.keys(payload).length) {
    toast("Escribe al menos un dato para guardar.", "error");
    return;
  }
  await api(`/usuarios/pacientes/${data.paciente_id}/historial`, { method: "PUT", body: JSON.stringify(payload) });
  audit("ACTUALIZAR_HISTORIAL", data.paciente_id);
  toast("Historial actualizado.", "success");
  await renderRouteContent();
}

async function testApi() {
  const root = await api("/");
  toast(`${root.mensaje} · versión ${root.version}`, "success");
}

async function generateAgenda(doctorId) {
  if (!doctorId) {
    toast("Selecciona un médico primero.", "error");
    return;
  }
  await api(`/usuarios/${doctorId}/agenda/generar?dias=7`, { method: "POST" });
  audit("GENERAR_AGENDA", doctorId);
  toast("Agenda generada correctamente.", "success");
}

async function viewCita(id) {
  const data = await api(`/citas/${id}/detalle-completo`);
  const cita = data.cita;
  const details = [
    `ID: ${cita.id_cita}`,
    `Estado: ${cita.estado}`,
    `Fecha: ${formatDate(cita.fecha_hora)}`,
    `Paciente: ${cita.paciente_completo?.nombre || cita.paciente?.nombre || "—"}`,
    `Médico: ${cita.doctor_completo?.nombre || cita.doctor?.nombre || "—"}`,
    `Detalles: ${cita.detalles || "—"}`,
  ].join("\n");
  alert(details);
}

async function cancelCita(id) {
  if (!confirm(`¿Cancelar la cita ${id}?`)) return;
  await api(`/citas/${id}/cancelar`, { method: "PUT" });
  audit("CANCELAR_CITA", id);
  toast("Cita cancelada.", "success");
  await renderRouteContent();
}

async function completeCita(id) {
  if (!confirm(`¿Marcar como completada la cita ${id}?`)) return;
  await api(`/citas/${id}/completar`, { method: "PUT" });
  audit("COMPLETAR_CITA", id);
  toast("Cita completada.", "success");
  await renderRouteContent();
}

async function deleteUser(id) {
  if (!confirm(`¿Eliminar el usuario ${id}?`)) return;
  await api(`/usuarios/${id}`, { method: "DELETE" });
  audit("ELIMINAR_USUARIO", id);
  toast("Usuario eliminado.", "success");
  await renderRouteContent();
}

async function markNotification(id) {
  await api(`/usuarios/${state.user.id}/notificaciones/${id}/leer`, { method: "PUT" });
  audit("LEER_NOTIFICACION", id);
  toast("Notificación marcada como leída.", "success");
  await renderRouteContent();
}

document.addEventListener("click", async (event) => {
  const target = event.target.closest("[data-action]");
  if (!target) return;
  const action = target.dataset.action;

  try {
    if (action === "auth-tab") {
      state.authTab = target.dataset.tab;
      renderAuth();
    }
    if (action === "test-api") await testApi();
    if (action === "logout") {
      clearSession();
      toast("Sesión cerrada.", "info");
      render();
    }
    if (action === "nav") {
      state.route = target.dataset.route;
      render();
    }
    if (action === "refresh") await renderRouteContent();
    if (action === "clear-cita-search") await renderRouteContent();
    if (action === "generate-agenda") {
      await generateAgenda(target.dataset.id || state.selectedDoctorId);
      await renderRouteContent();
    }
    if (action === "generate-agenda-for-form") {
      const doctorId = document.getElementById("crear-cita-doctor")?.value;
      await generateAgenda(doctorId);
      await loadSlotsForDoctor(doctorId);
    }
    if (action === "view-cita") await viewCita(target.dataset.id);
    if (action === "cancel-cita") await cancelCita(target.dataset.id);
    if (action === "complete-cita") await completeCita(target.dataset.id);
    if (action === "delete-user") await deleteUser(target.dataset.id);
    if (action === "mark-notification") await markNotification(target.dataset.id);
    if (action === "clear-audit") {
      if (confirm("¿Limpiar el registro local de trazabilidad?")) {
        state.audit = [];
        localStorage.setItem("medicitasAudit", JSON.stringify(state.audit));
        toast("Registro local limpiado.", "info");
        renderRouteContent();
      }
    }
    if (action === "edit-user") {
      const user = state.cache.usuarios.find((u) => u.id === target.dataset.id);
      const panel = document.getElementById("edit-user-panel");
      if (user && panel) {
        panel.innerHTML = `<section class="card"><h3 class="section-title">Editar usuario ${escapeHtml(user.id)}</h3>${usuarioFormTemplate(user)}</section>`;
        panel.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  } catch (error) {
    toast(error.message, "error");
  }
});

document.addEventListener("submit", async (event) => {
  const form = event.target;
  event.preventDefault();
  try {
    if (form.id === "login-form") await handleLogin(form);
    if (form.id === "registro-form") await handleRegistro(form);
    if (form.id === "crear-cita-form") await handleCrearCita(form);
    if (form.id === "buscar-citas-form") await handleBuscarCitas(form);
    if (form.id === "crear-usuario-form") await handleCrearUsuario(form);
    if (form.id === "editar-usuario-form") await handleEditarUsuario(form);
    if (form.id === "historial-form") await handleHistorial(form);
    if (form.id === "api-config-form") {
      const data = formToObject(form);
      state.apiUrl = data.apiUrl.replace(/\/$/, "");
      localStorage.setItem("medicitasApiUrl", state.apiUrl);
      toast("URL del backend guardada.", "success");
      render();
    }
  } catch (error) {
    toast(error.message, "error");
  }
});

document.addEventListener("change", async (event) => {
  try {
    if (event.target.id === "crear-cita-doctor") {
      await loadSlotsForDoctor(event.target.value);
    }
    if (event.target.id === "crear-cita-tipo") {
      updateCitaExtraFields();
    }
    if (event.target.id === "agenda-doctor-select") {
      state.selectedDoctorId = event.target.value;
      await renderRouteContent();
    }
    if (event.target.id === "historial-paciente-select") {
      state.selectedPatientId = event.target.value;
      await renderRouteContent();
    }
  } catch (error) {
    toast(error.message, "error");
  }
});

render();
