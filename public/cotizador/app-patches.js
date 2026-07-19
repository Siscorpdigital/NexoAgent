/* ===================================================================
   app-patches.js — Reemplaza las funciones de localStorage del HTML
   original por llamadas a la base de datos (Supabase) vía window.DB.
   Se carga DESPUÉS del HTML principal y sobrescribe las globales.
   =================================================================== */

(function () {
  'use strict';

  const $ = (id) => document.getElementById(id);

  // ===================================================================
  //  HELPERS
  // ===================================================================

  // Mapea profile de Supabase al shape "legacy" que el HTML espera
  // (currentUser.rol === 'historial' para superadmin)
  function makeLegacyUser(prof) {
    return {
      id:       prof.id,
      email:    prof.email,
      nombre:   prof.nombre || (prof.email || '').split('@')[0],
      rol:      prof.rol === 'superadmin' ? 'historial' : prof.rol,
      _realRol: prof.rol,                  // mantenemos el original
      admin_id: prof.admin_id,
      agencia:  prof.agencia || 'independientes',
      active:   prof.active,
      username: prof.username || null,
      acceso_nexo: !!prof.acceso_nexo
    };
  }

  // ===================================================================
  //  AGENCIAS MASTER — catálogo y helpers
  // ===================================================================
  const AGENCIAS = [
    { value: 'master_1',       label: 'Agencia Master 1'  },
    { value: 'master_2',       label: 'Agencia Master 2'  },
    { value: 'master_3',       label: 'Agencia Master 3'  },
    { value: 'master_4',       label: 'Agencia Master 4'  },
    { value: 'master_5',       label: 'Agencia Master 5'  },
    { value: 'master_6',       label: 'Agencia Master 6'  },
    { value: 'master_7',       label: 'Agencia Master 7'  },
    { value: 'master_8',       label: 'Agencia Master 8'  },
    { value: 'master_9',       label: 'Agencia Master 9'  },
    { value: 'master_10',      label: 'Agencia Master 10' },
    { value: 'independientes', label: 'Independientes'    }
  ];
  const AGENCIA_LABEL = Object.fromEntries(AGENCIAS.map(a => [a.value, a.label]));
  function agenciaLabel(v) { return AGENCIA_LABEL[v] || 'Independientes'; }

  function populateAgenciaSelect(sel, opts) {
    if (!sel) return;
    opts = opts || {};
    const html = (opts.includeAll
      ? '<option value="">' + (opts.allLabel || 'Todas las agencias') + '</option>'
      : '<option value="">' + (opts.placeholder || '— Seleccionar —') + '</option>') +
      AGENCIAS.map(a => '<option value="' + a.value + '">' + a.label + '</option>').join('');
    sel.innerHTML = html;
  }

  function filterByAgenciaList(rows, agencia) {
    if (!agencia) return rows;
    return rows.filter(r => {
      if (!r._owner_id) return false;
      const owner = DB.users.findById(r._owner_id);
      return owner && (owner.agencia || 'independientes') === agencia;
    });
  }

  // Locks coordinator's agency dropdown to their own agency.
  function lockAgenciaForCoordinator(sel, me) {
    if (!sel || !me || me._realRol !== 'coordinador') return;
    sel.value = me.agencia || 'independientes';
    sel.disabled = true;
    sel.title = 'Tu agencia está fijada en tu perfil.';
  }

  // ───────── Loading overlay ─────────
  function ensureLoadingOverlay() {
    if ($('pfLoading')) return;
    const div = document.createElement('div');
    div.id = 'pfLoading';
    div.style.cssText =
      'position:fixed;inset:0;background:rgba(45,87,80,.55);z-index:99999;' +
      'display:flex;align-items:center;justify-content:center;backdrop-filter:blur(3px)';
    div.innerHTML =
      '<div style="background:white;border-radius:14px;padding:20px 28px;display:flex;' +
      'align-items:center;gap:14px;box-shadow:0 14px 44px rgba(0,0,0,.25);font-family:Inter,sans-serif">' +
      '<div style="width:22px;height:22px;border:3px solid #E5EDEB;border-top-color:#2BAA8A;' +
      'border-radius:50%;animation:pfSpin .8s linear infinite"></div>' +
      '<div style="font-size:14px;color:#3D6E65;font-weight:500" id="pfLoadingMsg">Conectando…</div>' +
      '</div>' +
      '<style>@keyframes pfSpin{to{transform:rotate(360deg)}}</style>';
    document.body.appendChild(div);
  }
  function showLoading(msg) {
    ensureLoadingOverlay();
    $('pfLoadingMsg').textContent = msg || 'Cargando…';
    $('pfLoading').style.display = 'flex';
  }
  function hideLoading() {
    if ($('pfLoading')) $('pfLoading').style.display = 'none';
  }

  // ───────── Toast / aviso ─────────
  function toast(msg, kind) {
    let t = $('pfToast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'pfToast';
      t.style.cssText =
        'position:fixed;bottom:24px;right:24px;background:#2D5750;color:white;' +
        'padding:12px 18px;border-radius:10px;font-family:Inter,sans-serif;' +
        'font-size:13px;font-weight:500;box-shadow:0 10px 30px rgba(0,0,0,.25);' +
        'z-index:99999;opacity:0;transition:opacity .25s;pointer-events:none;max-width:380px';
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.style.background = kind === 'err' ? '#991B1B' : (kind === 'ok' ? '#166534' : '#2D5750');
    t.style.opacity = '1';
    clearTimeout(t._tm);
    t._tm = setTimeout(() => { t.style.opacity = '0'; }, 3000);
  }
  window.pfToast = toast;

  // ───────── Pantalla "Configurar Base de Datos" ─────────
  function showConfigScreen() {
    document.body.innerHTML = '';
    document.body.style.cssText =
      'margin:0;font-family:Inter,system-ui,sans-serif;' +
      'background:linear-gradient(135deg,#2D5750 0%,#3D6E65 50%,#2BAA8A 100%);' +
      'min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px';

    document.body.innerHTML =
      '<div style="background:white;border-radius:18px;max-width:580px;width:100%;' +
      'padding:38px 36px;box-shadow:0 20px 60px rgba(0,0,0,.3)">' +
      '<div style="font-family:Cormorant Garamond,serif;font-size:30px;font-weight:600;' +
      'color:#2D5750;margin-bottom:6px">Configurar base de datos</div>' +
      '<div style="font-size:13.5px;color:#5C7872;margin-bottom:24px;line-height:1.6">' +
      'El cotizador todavía no está conectado a Supabase. Sigue la guía ' +
      '<strong>SETUP.md</strong> para crear tu cuenta y obtener tus claves.' +
      '</div>' +
      '<div style="background:#FEF3DC;border-left:4px solid #F2A020;padding:14px 16px;' +
      'border-radius:6px;margin-bottom:20px;font-size:13px;color:#92400E;line-height:1.6">' +
      'Abre el archivo <strong>supabase-config.js</strong> y pega tu <em>Project URL</em> ' +
      'y tu <em>anon key</em> (los obtienes en Supabase → Project Settings → API). ' +
      'Luego recarga esta página.' +
      '</div>' +
      '<div style="background:#F4F7F6;border-radius:8px;padding:14px;font-family:monospace;' +
      'font-size:12px;color:#1C2B28;white-space:pre-wrap;line-height:1.7">' +
      'window.SUPABASE_CONFIG = {\n' +
      '  url: "https://TU-PROYECTO.supabase.co",\n' +
      '  anonKey: "eyJhbGciOiJIUzI1NiIs..."\n' +
      '};' +
      '</div>' +
      '<div style="margin-top:22px;display:flex;gap:10px">' +
      '<button onclick="location.reload()" style="background:#2BAA8A;color:white;border:none;' +
      'padding:11px 22px;border-radius:8px;font-size:13.5px;font-weight:600;cursor:pointer">' +
      'Recargar página</button>' +
      '<a href="SETUP.md" target="_blank" style="background:#F4F7F6;color:#2D5750;' +
      'padding:11px 22px;border-radius:8px;font-size:13.5px;font-weight:600;' +
      'text-decoration:none;display:inline-flex;align-items:center">Ver guía SETUP.md →</a>' +
      '</div>' +
      '</div>';
  }

  // ===================================================================
  //  OVERRIDES — Sesión & autenticación
  // ===================================================================

  window.doLogin = async function () {
    const raw  = $('loginEmail').value.trim();
    const pass = $('loginPass').value;
    if (!raw || !pass) {
      window.showLoginErr('Ingrese su usuario y contraseña.');
      return;
    }
    showLoading('Ingresando…');
    try {
      const prof = await DB.session.login(raw, pass);
      await DB.refresh();
      const legacy = makeLegacyUser(prof);
      window.currentUser = legacy;
      hideLoading();
      if (prof.rol === 'superadmin') window.enterHistorial(legacy);
      else                            window.enterApp(legacy);
      if (typeof window.updateNexoAccess === 'function') window.updateNexoAccess();
    } catch (e) {
      hideLoading();
      window.showLoginErr(e.message || 'No se pudo iniciar sesión.');
    }
  };

  window._executeLogout = async function () {
    showLoading('Cerrando sesión…');
    try { await DB.session.logout(); } catch (_) {}
    window.currentUser = null;
    hideLoading();
    $('appMain').classList.add('hidden');
    if ($('historialScreen')) $('historialScreen').classList.add('hidden');
    $('loginScreen').style.display = 'flex';
    $('loginEmail').value = '';
    $('loginPass').value = '';
    setTimeout(() => $('loginEmail').focus(), 100);
  };

  // initAuth ya no se usa — bootstrap() lo reemplaza.
  window.initAuth = function () { /* no-op: handled by bootstrap */ };

  // ===================================================================
  //  OVERRIDES — Usuarios (admin panel)
  // ===================================================================

  window.loadUsers = () => DB.users.list();
  window.getUsers  = () => DB.users.list();
  window.saveUsers = () => {
    // El HTML original llamaba saveUsers(arr) para persistir el arreglo
    // entero. Con DB usamos APIs específicas (create/update/remove);
    // este stub queda como no-op para no romper llamadas legadas.
    console.warn('[patch] saveUsers() ignorado — usa DB.users.* en su lugar.');
  };

  // saveSession / clearSession ya no son necesarios — Supabase mantiene la sesión.
  window.loadSession  = () => null;
  window.saveSession  = () => {};
  window.clearSession = () => {};

  // Render de la tabla de admin (re-implementado para soportar admin_id + agencia)
  window.renderAdminTable = function () {
    const users = DB.users.list();
    const me    = window.currentUser;
    if (!me) return;

    // Inicialización una sola vez del filtro de agencia
    const agFilterEl = $('admFilterAgencia');
    if (agFilterEl && !agFilterEl.dataset.ready) {
      populateAgenciaSelect(agFilterEl, { includeAll: true });
      agFilterEl.dataset.ready = '1';
      if (me._realRol === 'coordinador') lockAgenciaForCoordinator(agFilterEl, me);
    }

    // Botones de creación / métricas según rol
    const adminBar = document.querySelector('#adminModal');
    if (adminBar) {
      const newBtn = adminBar.querySelector('button[onclick="openNewUser()"]');
      if (newBtn) newBtn.style.display = (me._realRol === 'coordinador') ? 'none' : '';
    }

    const q   = $('admSearch') ? $('admSearch').value.trim().toLowerCase() : '';
    const fAg = $('admFilterAgencia') ? $('admFilterAgencia').value : '';
    let filtered = users;
    if (q)  filtered = filtered.filter(u => (u.email||'').toLowerCase().includes(q) || (u.nombre||'').toLowerCase().includes(q));
    if (fAg) filtered = filtered.filter(u => (u.agencia || 'independientes') === fAg);

    if ($('adm-count')) $('adm-count').textContent = users.length;
    const tbody = $('admTbody'); if (!tbody) return;
    tbody.innerHTML = '';

    filtered.forEach(u => {
      const rolBadge = u.rol === 'superadmin'
        ? '<span style="background:#EDE9FE;color:#5B21B6;font-size:10px;font-weight:700;padding:2px 8px;border-radius:20px;letter-spacing:.06em">SUPERADMIN</span>'
        : u.rol === 'admin'
        ? '<span style="background:var(--pf-orange-pale);color:var(--pf-orange);font-size:10px;font-weight:700;padding:2px 8px;border-radius:20px;letter-spacing:.06em">ADMIN</span>'
        : u.rol === 'coordinador'
        ? '<span style="background:#DBEAFE;color:#1D4ED8;font-size:10px;font-weight:700;padding:2px 8px;border-radius:20px;letter-spacing:.06em">COORD</span>'
        : '<span style="background:var(--pf-teal-pale);color:var(--pf-teal);font-size:10px;font-weight:700;padding:2px 8px;border-radius:20px;letter-spacing:.06em">AGENTE</span>';
      const agValue = u.agencia || 'independientes';
      const agBadge = '<span style="font-size:11px;color:var(--pf-slate-dk);background:#F4F7F6;border:1px solid var(--border);padding:3px 8px;border-radius:6px;white-space:nowrap;display:inline-block">' + agenciaLabel(agValue) + '</span>';
      const statusBadge = u.active
        ? '<span style="background:#F0FDF4;color:#166534;font-size:10px;font-weight:700;padding:2px 8px;border-radius:20px">Activo</span>'
        : '<span style="background:var(--err-bg);color:var(--err);font-size:10px;font-weight:700;padding:2px 8px;border-radius:20px">Inactivo</span>';

      const isMe    = u.id === me.id;
      const isCoord = me._realRol === 'coordinador';
      // Reglas de gestión:
      //   - superadmin: todo sobre todos (salvo a sí mismo borrar)
      //   - admin: edita agentes y coordinadores; activa/desactiva agentes y coordinadores
      //   - coordinador: solo lectura (sin botones de acción)
      const canDelete = !isCoord && me._realRol === 'superadmin' && !isMe;
      const canLock   = !isCoord && !isMe && (
                          me._realRol === 'superadmin' ||
                          (me._realRol === 'admin' && (u.rol === 'agente' || u.rol === 'coordinador'))
                        );
      const canEdit   = !isCoord && (
                          me._realRol === 'superadmin' ||
                          (me._realRol === 'admin' && (u.rol === 'agente' || u.rol === 'coordinador')) ||
                          isMe
                        );

      const tr = document.createElement('tr');
      tr.innerHTML =
        '<td data-label="Correo" style="font-size:13px">' + (u.email || '') + (u.username ? '<div style="font-size:11px;color:var(--muted)">@' + u.username + '</div>' : '') + '</td>' +
        '<td data-label="Nombre" style="font-size:13px">' + (u.nombre || '—') + '</td>' +
        '<td data-label="Rol">' + rolBadge + '</td>' +
        '<td data-label="Agencia">' + agBadge + '</td>' +
        '<td data-label="Estado">' + statusBadge + '</td>' +
        '<td class="actions">' +
          '<div style="display:flex;gap:5px;justify-content:center">' +
            (canEdit  ? '<button class="bdel" style="width:24px;height:24px;font-size:13px;border-radius:4px" title="Editar" onclick="editUserById(\''+u.id+'\')">✏️</button>' : '') +
            (canLock  ? '<button class="bdel" style="width:24px;height:24px;font-size:13px;border-radius:4px" title="' + (u.active ? 'Desactivar' : 'Activar') + '" onclick="toggleUserActiveById(\''+u.id+'\')">' + (u.active ? '🔒' : '🔓') + '</button>' : '') +
            (canDelete ? '<button class="bdel" style="width:24px;height:24px;font-size:13px;border-radius:4px" title="Eliminar" onclick="deleteUserById(\''+u.id+'\')">🗑️</button>' : '') +
          '</div>' +
        '</td>';
      tbody.appendChild(tr);
    });

    if (filtered.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:20px;color:var(--muted);font-size:13px">No se encontraron usuarios</td></tr>';
    }
  };

  // Funciones nuevas que reciben UUID en vez de índice numérico
  window.editUserById = function (id) {
    const u = DB.users.findById(id);
    if (!u) return;
    const me = window.currentUser;
    if (me._realRol === 'coordinador') return; // solo lectura
    $('admEditIdx').value = id;       // ahora guarda UUID
    $('admFormTitle').textContent = 'Editar Usuario';
    $('admEmail').value  = u.email;
    $('admEmail').readOnly = true;
    $('admNombre').value = u.nombre || '';

    // En modo edición, ocultar el campo de contraseña (Supabase no permite
    // que un admin cambie la contraseña de OTRO usuario con anon key).
    const passRow = $('admPassNew') ? $('admPassNew').closest('.ff') : null;
    if (passRow) {
      if (u.id === me.id) {
        passRow.style.display = '';
        $('admPassNew').value = '';
        $('admPassNew').placeholder = 'Dejar vacío para no cambiar';
      } else {
        passRow.style.display = 'none';
      }
    }

    // Rol — superadmin lo cambia para todos; admin lo cambia sólo entre agente/coordinador
    const isMe = u.id === me.id;
    const rolEl = $('admRol');
    populateRolOptions(rolEl, me._realRol);
    rolEl.value = u.rol;
    const canChangeRol = me._realRol === 'superadmin' ||
      (me._realRol === 'admin' && !isMe && (u.rol === 'agente' || u.rol === 'coordinador'));
    rolEl.disabled = !canChangeRol;

    // Admin a cargo (solo agentes)
    ensureAdminIdField();
    setAdminIdField(u.rol, u.admin_id, me);

    // Agencia (todos los roles)
    ensureAgenciaField();
    setAgenciaField(u.agencia, me);

    // Acceso a NexoAgent (no aplica a admin/superadmin: tienen acceso por rol)
    setNexoField(u.acceso_nexo, u.rol);

    $('admFormErr').classList.add('hidden');
    $('admForm').classList.remove('hidden');
    $('admNombre').focus();
  };

  window.toggleUserActiveById = async function (id) {
    showLoading('Actualizando…');
    try {
      await DB.users.toggleActive(id);
      hideLoading();
      window.renderAdminTable();
      toast('Estado actualizado', 'ok');
    } catch (e) { hideLoading(); toast(e.message, 'err'); }
  };

  window.deleteUserById = async function (id) {
    const u = DB.users.findById(id);
    if (!u) return;
    if (!confirm('¿Eliminar al usuario "' + (u.nombre || u.email) + '"? Sus cotizaciones y emisiones también se eliminarán. Esta acción no se puede deshacer.')) return;
    showLoading('Eliminando…');
    try {
      await DB.users.remove(id);
      hideLoading();
      window.renderAdminTable();
      toast('Usuario eliminado', 'ok');
    } catch (e) { hideLoading(); toast(e.message, 'err'); }
  };

  // Compatibilidad: las versiones legadas con índice quedan deshabilitadas
  window.editUser = function (idx) {
    const u = DB.users.list()[idx];
    if (u) window.editUserById(u.id);
  };
  window.deleteUser = function (idx) {
    const u = DB.users.list()[idx];
    if (u) window.deleteUserById(u.id);
  };
  window.toggleUserActive = function (idx) {
    const u = DB.users.list()[idx];
    if (u) window.toggleUserActiveById(u.id);
  };

  function populateRolOptions(sel, myRol) {
    if (!sel) return;
    const opts = myRol === 'superadmin'
      ? [['agente','Asesor / Agente'], ['coordinador','Coordinador Comercial'], ['admin','Admin'], ['superadmin','Superadmin']]
      : myRol === 'admin'
      ? [['agente','Asesor / Agente'], ['coordinador','Coordinador Comercial']]
      : [['agente','Asesor / Agente']];
    sel.innerHTML = opts.map(o => '<option value="' + o[0] + '">' + o[1] + '</option>').join('');
  }

  // Inyecta dinámicamente un selector "Admin a cargo" al formulario
  function ensureAdminIdField() {
    if ($('admAdminId')) return;
    const rolEl = $('admRol');
    if (!rolEl) return;
    const wrap = rolEl.closest('.fg') || rolEl.parentElement.parentElement;
    const ff = document.createElement('div');
    ff.className = 'ff';
    ff.id = 'admAdminIdFf';
    ff.innerHTML =
      '<label class="fl">Admin a cargo</label>' +
      '<div class="sw"><select id="admAdminId" class="fsel"></select></div>';
    wrap.appendChild(ff);
  }

  function setAdminIdField(rol, currentAdminId, me) {
    ensureAdminIdField();
    const sel = $('admAdminId');
    const ff  = $('admAdminIdFf');
    if (!sel || !ff) return;
    // Solo aplica si rol == agente
    if (rol !== 'agente') {
      ff.style.display = 'none';
      return;
    }
    // Si yo soy admin, mi único valor es yo mismo (sin opción de elegir)
    if (me._realRol === 'admin') {
      sel.innerHTML = '<option value="' + me.id + '">' + (me.nombre || me.email) + ' (yo)</option>';
      sel.value = me.id;
      sel.disabled = true;
      ff.style.display = '';
      return;
    }
    // Superadmin: dropdown con todos los admin + opción "Sin admin"
    const admins = DB.users.list().filter(u => u.rol === 'admin' && u.active);
    sel.innerHTML =
      '<option value="">— Sin admin asignado —</option>' +
      admins.map(a => '<option value="' + a.id + '">' + (a.nombre || a.email) + '</option>').join('');
    sel.value = currentAdminId || '';
    sel.disabled = false;
    ff.style.display = '';
  }

  // Inyecta dinámicamente un selector "Agencia Master" al formulario
  function ensureAgenciaField() {
    if ($('admAgencia')) return;
    const rolEl = $('admRol');
    if (!rolEl) return;
    const wrap = rolEl.closest('.fg') || rolEl.parentElement.parentElement;
    const ff = document.createElement('div');
    ff.className = 'ff';
    ff.id = 'admAgenciaFf';
    ff.innerHTML =
      '<label class="fl">Agencia Master</label>' +
      '<div class="sw"><select id="admAgencia" class="fsel"></select></div>';
    // Insertar antes del campo "admin a cargo" si existe
    const adminIdFf = $('admAdminIdFf');
    if (adminIdFf) wrap.insertBefore(ff, adminIdFf);
    else wrap.appendChild(ff);
    populateAgenciaSelect($('admAgencia'));
  }

  function setAgenciaField(currentAgencia, me) {
    ensureAgenciaField();
    const sel = $('admAgencia');
    const ff  = $('admAgenciaFf');
    if (!sel || !ff) return;
    ff.style.display = '';
    sel.value = currentAgencia || 'independientes';
    // Coordinador no debería estar aquí (botón oculto), pero por defensa:
    sel.disabled = (me && me._realRol === 'coordinador');
  }

  // ── Permiso de acceso a NexoAgent ──
  function ensureNexoField() {
    if ($('admNexo')) return;
    const rolEl = $('admRol');
    if (!rolEl) return;
    const wrap = rolEl.closest('.fg') || rolEl.parentElement.parentElement;
    const ff = document.createElement('div');
    ff.className = 'ff';
    ff.id = 'admNexoFf';
    ff.innerHTML =
      '<label class="fl">Acceso a NexoAgent</label>' +
      '<label class="pl-chk" style="height:44px;display:flex;align-items:center;gap:8px;font-size:13.5px">' +
      '<input type="checkbox" id="admNexo" style="width:16px;height:16px;accent-color:var(--pf-teal)">' +
      '<span>Permitir acceso al módulo NexoAgent</span></label>';
    wrap.appendChild(ff);
  }

  function setNexoField(current, roleForRow) {
    ensureNexoField();
    const chk = $('admNexo');
    const ff  = $('admNexoFf');
    if (!chk || !ff) return;
    // Admin y SuperAdmin tienen acceso por rol; para ellos la casilla no aplica.
    const byRole = (roleForRow === 'admin' || roleForRow === 'superadmin');
    ff.style.display = byRole ? 'none' : '';
    chk.checked = !!current;
  }

  // Actualizar campo admin_id cuando cambia el rol
  document.addEventListener('change', (ev) => {
    if (ev.target && ev.target.id === 'admRol') {
      setAdminIdField(ev.target.value, $('admAdminId') ? $('admAdminId').value : null, window.currentUser);
      setNexoField($('admNexo') ? $('admNexo').checked : false, ev.target.value);
    }
  });

  // openNewUser y saveUser sobrescritos
  window.openNewUser = function () {
    const me = window.currentUser;
    if (me._realRol === 'coordinador') return; // solo lectura
    $('admEditIdx').value = '';
    $('admFormTitle').textContent = 'Nuevo Usuario';
    $('admEmail').value  = '';
    $('admEmail').readOnly = false;
    $('admNombre').value = '';
    const passEl = $('admPassNew');
    if (passEl) {
      const passRow = passEl.closest('.ff');
      if (passRow) passRow.style.display = '';
      passEl.value = '';
      passEl.placeholder = 'Mínimo 6 caracteres';
    }

    const rolEl = $('admRol');
    populateRolOptions(rolEl, me._realRol);
    rolEl.value = 'agente';
    rolEl.disabled = false;

    setAdminIdField('agente', me._realRol === 'admin' ? me.id : '', me);
    setAgenciaField('independientes', me);
    setNexoField(false, 'agente');

    $('admFormErr').classList.add('hidden');
    $('admForm').classList.remove('hidden');
    $('admEmail').focus();
  };

  window.saveUser = async function () {
    const me      = window.currentUser;
    if (me._realRol === 'coordinador') return; // solo lectura
    const idOrNew = $('admEditIdx').value;
    const email   = $('admEmail').value.trim().toLowerCase();
    const nombre  = $('admNombre').value.trim();
    const pass    = $('admPassNew') ? $('admPassNew').value.trim() : '';
    const rol     = $('admRol').value;
    const adminId = $('admAdminId') ? $('admAdminId').value : '';
    const agencia = $('admAgencia') ? $('admAgencia').value : 'independientes';
    // Admin/SuperAdmin tienen acceso a NexoAgent por rol; para el resto, según la casilla.
    const accesoNexo = (rol === 'admin' || rol === 'superadmin')
      ? false
      : ($('admNexo') ? $('admNexo').checked : false);

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return window.showAdmErr('Ingrese un correo electrónico válido.');
    }
    if (!nombre) return window.showAdmErr('El nombre es obligatorio.');

    showLoading('Guardando…');
    try {
      if (!idOrNew) {
        // CREAR
        if (!pass || pass.length < 6) {
          hideLoading();
          return window.showAdmErr('La contraseña debe tener al menos 6 caracteres.');
        }
        const finalAdminId = (rol === 'agente') ? (adminId || (me._realRol === 'admin' ? me.id : null)) : null;
        await DB.users.create({
          email, password: pass, nombre, rol,
          admin_id: finalAdminId || null,
          agencia:  agencia || 'independientes',
          acceso_nexo: accesoNexo
        });
      } else {
        // EDITAR
        const patch = { nombre, rol, agencia: agencia || 'independientes', acceso_nexo: accesoNexo };
        if (rol === 'agente') patch.admin_id = adminId || null;
        else                  patch.admin_id = null;
        await DB.users.update(idOrNew, patch);

        // Cambio de contraseña: solo si es a mí mismo y se ingresó valor
        if (idOrNew === me.id && pass) {
          await DB.session.changeMyPassword(pass);
        }
      }
      hideLoading();
      window.closeAdmForm();
      window.renderAdminTable();
      toast(idOrNew ? 'Usuario actualizado' : 'Usuario creado', 'ok');
    } catch (e) {
      hideLoading();
      window.showAdmErr(e.message || 'No se pudo guardar el usuario.');
    }
  };

  // ===================================================================
  //  OVERRIDES — Cotizaciones (historial)
  // ===================================================================

  window.loadHist = () => DB.cotizaciones.list();

  window.saveQuote = async function (qn, cfg, pi, prima) {
    if (!window.currentUser) return;
    const st = window.st || {};
    const rec = {
      id:          qn,
      fecha:       new Date().toISOString(),
      agente:      st.agent || window.currentUser.nombre || '—',
      plan:        cfg.nombre,
      cobertura:   st.cov,
      formaPago:   pi.label,
      prima:       prima,
      titular: {
        nombres:   st.titular ? st.titular.nombres   : '',
        apellidos: st.titular ? st.titular.apellidos : '',
        cedula:    st.titular ? st.titular.cedula    : '',
        telefono:  st.titular ? st.titular.telefono  : '',
        email:     st.titular ? st.titular.email     : '',
      },
      afiliados: (st.ppl || []).map(p => ({
        rel: p.rel, name: p.name, sex: p.sex, age: p.age
      })),
      emailEnviado: false
    };
    try { await DB.cotizaciones.upsert(rec); }
    catch (e) { toast('Error guardando cotización: ' + e.message, 'err'); }
  };

  window.markEmailSent = async function (qid) {
    try { await DB.cotizaciones.markEmailSent(qid); }
    catch (e) { console.warn('markEmailSent', e); }
  };

  // ── Cotizaciones marcadas para emitir más tarde ──
  window.loadPorEmitir   = () => DB.cotizaciones.list().filter(r => r.paraEmitir);
  window.saveForEmission = (qid) => DB.cotizaciones.setParaEmitir(qid, true);
  window.unmarkEmission  = (qid) => DB.cotizaciones.setParaEmitir(qid, false);

  window.deleteHistRecord = async function () {
    if (!window._histDetail) return;
    showLoading('Eliminando…');
    try {
      await DB.cotizaciones.remove(window._histDetail.id);
      hideLoading();
      window.closeHistDetail();
      window.renderHistorial();
      toast('Cotización eliminada', 'ok');
    } catch (e) { hideLoading(); toast(e.message, 'err'); }
  };

  // ===================================================================
  //  OVERRIDES — Pipeline (CRM)
  // ===================================================================

  window.pipeStorageKey  = () => 'pf_pipeline_v2_' + (window.currentUser ? window.currentUser.email : 'anon');
  window.loadPipeline    = () => DB.pipeline.listMine();
  window.savePipeline    = () => { /* no-op — usar DB.pipeline.upsert/remove */ };
  window.loadAllPipelines = () => {
    // Inyecta _agente / _agentEmail para compat con renderGlobalPipeline()
    return DB.pipeline.list().map(r => {
      const owner = DB.users.findById(r._owner_id);
      return {
        ...r,
        _agente:     owner ? (owner.nombre || owner.email) : '—',
        _agentEmail: owner ? owner.email : ''
      };
    });
  };

  window.addToPipeline = async function (qn, cfg, pi, prima) {
    if (!window.currentUser) return;
    // Evitar duplicados
    if (DB.pipeline.findById(qn)) return;
    const st = window.st || {};
    const rec = {
      id:    qn,
      stage: 'lead',
      fecha: new Date().toISOString(),
      plan:  cfg.nombre,
      cov:   st.cov,
      pago:  pi.label,
      prima: prima,
      titular: { ...(st.titular || {}) },
      afil:    (st.ppl || []).map(p => ({ rel: p.rel, name: p.name, age: p.age })),
      notas:   ''
    };
    try {
      await DB.pipeline.upsert(rec);
      if (typeof window.updateSidebarBadges === 'function') window.updateSidebarBadges();
    } catch (e) { toast('Error agregando al pipeline: ' + e.message, 'err'); }
  };

  window.saveRecordToPipeline = async function (agentEmail, record) {
    const owner = DB.users.findByEmail(agentEmail);
    if (!owner) { toast('No se encontró el agente ' + agentEmail, 'err'); return; }
    const clean = { ...record };
    delete clean._agente; delete clean._agentEmail; delete clean._owner_id;
    try { await DB.pipeline.upsert(clean, owner.id); }
    catch (e) { toast(e.message, 'err'); }
  };

  // saveLead / deleteLead — el HTML diferencia entre modo "global" (perofaga)
  // y modo asesor. Mantenemos esa lógica pero con DB API.
  window.saveLead = async function () {
    const mode = $('leadModal').dataset.mode;
    const notas = $('lm-notas').value.trim();
    showLoading('Guardando…');
    try {
      if (mode === 'global') {
        if (!window._gpCurrentLead) { hideLoading(); return; }
        const rec = { ...window._gpCurrentLead, notas };
        await DB.pipeline.upsert(rec, rec._owner_id);
        hideLoading();
        window.closeLeadModal();
        window.renderGlobalPipeline();
      } else {
        if (!window._currentLead) { hideLoading(); return; }
        const cached = DB.pipeline.findById(window._currentLead.id);
        if (!cached) { hideLoading(); return; }
        const updated = {
          ...cached,
          stage: window._currentLead.stage,
          notas: notas
        };
        await DB.pipeline.upsert(updated);
        hideLoading();
        window.closeLeadModal();
        window.renderPipeline();
      }
      toast('Cambios guardados', 'ok');
    } catch (e) { hideLoading(); toast(e.message, 'err'); }
  };

  window.deleteLead = async function () {
    const mode = $('leadModal').dataset.mode;
    if (!confirm('¿Eliminar este lead del pipeline?')) return;
    showLoading('Eliminando…');
    try {
      if (mode === 'global') {
        if (!window._gpCurrentLead) { hideLoading(); return; }
        await DB.pipeline.remove(window._gpCurrentLead.id);
        hideLoading();
        window.closeLeadModal();
        window.renderGlobalPipeline();
      } else {
        if (!window._currentLead) { hideLoading(); return; }
        await DB.pipeline.remove(window._currentLead.id);
        hideLoading();
        window.closeLeadModal();
        window.renderPipeline();
      }
      toast('Lead eliminado', 'ok');
    } catch (e) { hideLoading(); toast(e.message, 'err'); }
  };

  // ===================================================================
  //  OVERRIDES — Emisiones
  // ===================================================================

  window.emStorageKey  = () => 'pf_emisiones_v1_' + (window.currentUser ? window.currentUser.email : 'anon');
  window.loadEmisiones = () => DB.emisiones.listMine();
  window.saveEmisiones = () => { /* no-op — usar DB.emisiones.* */ };

  window.saveEmision = async function () {
    const contrato  = $('emContrato').value.trim();
    const fechaEm   = $('emFechaEmision').value;
    const nombres   = $('emNombres').value.trim();
    const apellidos = $('emApellidos').value.trim();
    const cedula    = $('emCedula').value.trim();

    if (!contrato || !fechaEm || !nombres || !apellidos || !cedula) {
      alert('Complete los campos obligatorios: N° Contrato, Fecha de Emisión, Nombres, Apellidos y Cédula.');
      return;
    }
    const em = {
      id:      contrato,
      fecha:   fechaEm,
      creado:  new Date().toISOString(),
      plan:    $('emPlanSel').value,
      cob:     $('emCobertura').value,
      prima:   $('emPrima').value,
      pago:    $('emFormaPago').value,
      titular: { nombres, apellidos, cedula, tel: $('emTel').value, email: $('emCorreo').value },
      notas:   $('emNotas').value.trim(),
      agente:  window.currentUser ? window.currentUser.nombre : '—'
    };
    showLoading('Guardando emisión…');
    try {
      await DB.emisiones.upsert(em);
      hideLoading();
      ['emContrato','emFechaEmision','emCobertura','emPrima','emNombres',
       'emApellidos','emCedula','emTel','emCorreo','emNotas'].forEach(id => {
        if ($(id)) $(id).value = '';
      });
      if (typeof window.updateSidebarBadges === 'function') window.updateSidebarBadges();
      toast('Emisión registrada', 'ok');
      window.navTo('emisiones');
    } catch (e) {
      hideLoading();
      if (/duplicate|unique/i.test(e.message)) {
        alert('Ya existe una emisión con ese N° de contrato.');
      } else {
        alert('Error al guardar la emisión: ' + e.message);
      }
    }
  };

  window.deleteEmision = async function (id) {
    if (!confirm('¿Eliminar esta emisión?')) return;
    showLoading('Eliminando…');
    try {
      await DB.emisiones.remove(id);
      hideLoading();
      window.renderEmisiones();
      if (typeof window.updateSidebarBadges === 'function') window.updateSidebarBadges();
      toast('Emisión eliminada', 'ok');
    } catch (e) { hideLoading(); toast(e.message, 'err'); }
  };

  // ===================================================================
  //  BOTÓN DE MIGRACIÓN (Importar localStorage → Supabase)
  // ===================================================================

  window.openImportDialog = async function () {
    if (!confirm(
      'Esto leerá las cotizaciones, pipelines y emisiones guardadas en este navegador ' +
      'y las subirá a Supabase. Los usuarios deben existir primero (con el mismo email).\n\n' +
      '¿Continuar?'
    )) return;

    showLoading('Importando datos locales… puede tardar.');
    try {
      const r = await DB.migrateFromLocalStorage();
      hideLoading();
      const msg =
        '✓ Cotizaciones: ' + r.cotizaciones.ok + '\n' +
        '✓ Pipeline: ' + r.pipeline.ok + '\n' +
        '✓ Emisiones: ' + r.emisiones.ok + '\n' +
        (r.usersMissing.length
          ? '\nUsuarios sin perfil (datos descartados): ' + r.usersMissing.join(', ')
          : '');
      alert('Importación completada:\n\n' + msg);
      if (typeof window.renderAdminTable === 'function') window.renderAdminTable();
    } catch (e) {
      hideLoading();
      alert('Error en la importación: ' + e.message);
    }
  };

  // Inyectar el botón de importación en el panel admin
  function injectImportButton() {
    // Buscar la zona de búsqueda del admin panel
    const search = $('admSearch');
    if (!search) return false;
    if ($('btnImport')) return true;
    const bar = search.parentElement;
    const btn = document.createElement('button');
    btn.id = 'btnImport';
    btn.className = 'btn btn-o';
    btn.style.cssText = 'height:40px;padding:0 14px;font-size:12.5px';
    btn.innerHTML = '📥 Importar locales';
    btn.title = 'Importar cotizaciones/pipeline/emisiones del localStorage de este navegador a Supabase';
    btn.onclick = window.openImportDialog;
    bar.appendChild(btn);
    return true;
  }

  // Wrap openAdmin para inyectar el botón la primera vez
  const _origOpenAdmin = window.openAdmin;
  window.openAdmin = function () {
    if (typeof _origOpenAdmin === 'function') _origOpenAdmin();
    setTimeout(injectImportButton, 50);
  };

  // ===================================================================
  //  BOOTSTRAP
  // ===================================================================

  async function bootstrap() {
    // 1) ¿Está configurado?
    if (!window.DB || !window.DB.isConfigured()) {
      showConfigScreen();
      return;
    }
    // 2) ¿Hay sesión activa?
    showLoading('Conectando…');
    try {
      const prof = await DB.session.restore();
      if (prof) {
        if (!prof.active) {
          await DB.session.logout();
          hideLoading();
          $('loginScreen').style.display = 'flex';
          $('appMain').classList.add('hidden');
          window.showLoginErr && window.showLoginErr('Su cuenta está desactivada.');
          return;
        }
        await DB.refresh();
        const legacy = makeLegacyUser(prof);
        window.currentUser = legacy;
        hideLoading();
        // Mostrar pantalla apropiada
        if (prof.rol === 'superadmin') {
          window.enterHistorial(legacy);
        } else {
          window.enterApp(legacy);
          // Si es admin o coordinador, exponer el botón de panel
          if ((prof.rol === 'admin' || prof.rol === 'coordinador') && $('btnAdmin')) {
            $('btnAdmin').classList.remove('hidden');
          }
        }
      } else {
        hideLoading();
        $('loginScreen').style.display = 'flex';
        $('appMain').classList.add('hidden');
        setTimeout(() => { const el = $('loginEmail'); if (el) el.focus(); }, 200);
      }
    } catch (e) {
      hideLoading();
      console.error('Bootstrap error:', e);
      // Mostrar login con error visible
      $('loginScreen').style.display = 'flex';
      $('appMain').classList.add('hidden');
      window.showLoginErr && window.showLoginErr(
        'No se pudo conectar a la base de datos. Revise su conexión a internet y supabase-config.js. (' + e.message + ')'
      );
    }
  }

  // Mostrar también admin button al superadmin (en la pantalla del historial
  // exponemos un acceso al panel via el botón ⚙)
  // Esto lo manejamos abajo en startup.

  // ───── Botón de "Panel Admin" en la pantalla del historial (para superadmin) ─────
  function injectAdminButtonInHistorial() {
    if ($('histBtnAdmin')) return;
    // Buscar la barra del historial — un lugar seguro es el header del historialScreen.
    const histScreen = $('historialScreen');
    if (!histScreen) return;
    const hdr = histScreen.querySelector('.hdr') || histScreen.querySelector('header');
    if (!hdr) return;
    const btn = document.createElement('button');
    btn.id = 'histBtnAdmin';
    btn.className = 'btn btn-p';
    btn.style.cssText = 'height:38px;padding:0 14px;font-size:12.5px;margin-right:10px';
    btn.innerHTML = '⚙ Panel Admin';
    btn.onclick = () => window.openAdmin();
    // Insertar antes del último elemento (botón logout suele estar al final)
    hdr.appendChild(btn);
  }

  // Cuando entremos al historial como superadmin, inyectar el botón
  const _origEnterHistorial = window.enterHistorial;
  window.enterHistorial = function (user) {
    if (typeof _origEnterHistorial === 'function') _origEnterHistorial(user);
    setTimeout(() => {
      injectAdminButtonInHistorial();
      populateAndConfigureFilters(user);
      if (typeof window.updateNexoAccess === 'function') window.updateNexoAccess();
    }, 100);
  };

  // ===================================================================
  //  AGENCIAS MASTER — filtros, métricas y vistas globales
  // ===================================================================

  // Poblar y configurar los dropdowns de "Agencia" en las pantallas
  // globales según el rol del usuario.
  function populateAndConfigureFilters(me) {
    if (!me) return;
    const isAgente = me._realRol === 'agente';
    const isCoord  = me._realRol === 'coordinador';

    [
      { sel: 'histFilterAgencia', wrap: 'histFilterAgenciaWrap' },
      { sel: 'gpFilterAgencia',   wrap: 'gpFilterAgenciaWrap'   },
      { sel: 'emFilterAgencia',   wrap: 'emFilterAgenciaWrap'   }
    ].forEach(({sel, wrap}) => {
      const el = $(sel);
      if (!el) return;
      if (!el.dataset.ready) {
        populateAgenciaSelect(el, { includeAll: true });
        el.dataset.ready = '1';
      }
      const wrapEl = $(wrap);
      if (wrapEl) wrapEl.style.display = isAgente ? 'none' : '';
      if (isCoord) {
        el.value = me.agencia || 'independientes';
        el.disabled = true;
      } else {
        el.disabled = false;
      }
    });
  }

  // -- Override de los loaders para aplicar el filtro de agencia -----
  window.loadHist = () => {
    const all = DB.cotizaciones.list();
    const f = $('histFilterAgencia') ? $('histFilterAgencia').value : '';
    return f ? filterByAgenciaList(all, f) : all;
  };

  const _origLoadAllPipelinesAg = window.loadAllPipelines;
  window.loadAllPipelines = () => {
    const all = _origLoadAllPipelinesAg();
    const f = $('gpFilterAgencia') ? $('gpFilterAgencia').value : '';
    return f ? filterByAgenciaList(all, f) : all;
  };

  // Emisiones: admin/super/coordinador ven el conjunto completo (filtrado por
  // RLS en el servidor + filtro de agencia en la UI). El agente sigue viendo
  // solo las suyas.
  window.loadEmisiones = () => {
    const me = window.currentUser;
    const isPower = me && (me._realRol === 'admin' || me._realRol === 'superadmin' || me._realRol === 'coordinador');
    const all = isPower ? DB.emisiones.list() : DB.emisiones.listMine();
    const f = $('emFilterAgencia') ? $('emFilterAgencia').value : '';
    return f ? filterByAgenciaList(all, f) : all;
  };

  // -- Coordinador: openAdmin redirige directo a Métricas -----------
  const _origOpenAdminCoord = window.openAdmin;
  window.openAdmin = function () {
    const me = window.currentUser;
    if (me && me._realRol === 'coordinador') {
      if (typeof window.openMetricas === 'function') window.openMetricas();
      return;
    }
    if (typeof _origOpenAdminCoord === 'function') _origOpenAdminCoord();
  };

  // -- Reconstruir buildMetricasUI con filtro de agencia -------------
  window.buildMetricasUI = function (mode) {
    const suffix  = mode === 'modal' ? '-m' : '-i';
    const me      = window.currentUser;
    const isCoord = me && me._realRol === 'coordinador';

    let users = DB.users.list().filter(u =>
      u.rol === 'agente' || u.rol === 'coordinador' || u.rol === 'admin'
    );
    if (isCoord) {
      users = users.filter(u => (u.agencia || 'independientes') === (me.agencia || 'independientes'));
    }
    const agentOpts = users.map(u =>
      '<option value="' + u.email + '">' + (u.nombre || u.email) + '</option>'
    ).join('');

    const agOpts = AGENCIAS.map(a =>
      '<option value="' + a.value + '"' +
      (isCoord && a.value === (me.agencia || 'independientes') ? ' selected' : '') + '>' +
      a.label + '</option>'
    ).join('');
    const agAllOpt = isCoord ? '' : '<option value="">Todas las agencias</option>';
    const agDisabled = isCoord ? ' disabled' : '';
    const clearAgencia = isCoord ? '' : 'document.getElementById(\'met-agencia' + suffix + '\').value=\'\';';

    return ''
      + '<div class="met-toolbar">'
      +   '<label>Agencia</label>'
      +   '<div class="sw" style="flex:1;min-width:170px">'
      +     '<select id="met-agencia' + suffix + '" class="fsel" onchange="calcAndRenderMetricas(\'' + mode + '\')"' + agDisabled + '>'
      +       agAllOpt + agOpts
      +     '</select>'
      +   '</div>'
      +   '<label>Agentes</label>'
      +   '<div class="sw" style="flex:1;min-width:180px">'
      +     '<select id="met-agent' + suffix + '" class="fsel" onchange="calcAndRenderMetricas(\'' + mode + '\')">'
      +       '<option value="">Todos los agentes</option>' + agentOpts
      +     '</select>'
      +   '</div>'
      +   '<label>Desde</label>'
      +   '<input id="met-from' + suffix + '" class="fi" type="date" onchange="calcAndRenderMetricas(\'' + mode + '\')" style="width:140px">'
      +   '<label>Hasta</label>'
      +   '<input id="met-to' + suffix + '" class="fi" type="date" onchange="calcAndRenderMetricas(\'' + mode + '\')" style="width:140px">'
      +   '<button class="btn btn-o" style="height:38px;padding:0 12px;font-size:13px" '
      +     'onclick="document.getElementById(\'met-agent' + suffix + '\').value=\'\';'
      +     'document.getElementById(\'met-from' + suffix + '\').value=\'\';'
      +     'document.getElementById(\'met-to' + suffix + '\').value=\'\';'
      +     clearAgencia
      +     'calcAndRenderMetricas(\'' + mode + '\')">✕</button>'
      + '</div>'
      + '<div id="met-output' + suffix + '"></div>';
  };

  // -- Reescribir calcAndRenderMetricas para leer de Supabase --------
  window.calcAndRenderMetricas = function (mode) {
    const suffix   = mode === 'modal' ? '-m' : '-i';
    const fAgent   = (document.getElementById('met-agent'   + suffix) || {}).value || '';
    const fFrom    = (document.getElementById('met-from'    + suffix) || {}).value || '';
    const fTo      = (document.getElementById('met-to'      + suffix) || {}).value || '';
    const fAgencia = (document.getElementById('met-agencia' + suffix) || {}).value || '';

    const outEl = document.getElementById('met-output' + suffix);
    if (!outEl) return;

    let users = DB.users.list().filter(u =>
      u.rol === 'agente' || u.rol === 'coordinador' || u.rol === 'admin'
    );
    if (fAgencia) users = users.filter(u => (u.agencia || 'independientes') === fAgencia);
    const agents = fAgent ? users.filter(u => u.email === fAgent) : users;
    const agentIds = new Set(agents.map(u => u.id));

    let allRecs = DB.pipeline.list()
      .filter(r => agentIds.has(r._owner_id))
      .map(r => {
        const owner = DB.users.findById(r._owner_id) || {};
        return Object.assign({}, r, {
          _email:  owner.email  || '',
          _nombre: owner.nombre || '',
          _agencia: owner.agencia || 'independientes'
        });
      });
    if (fFrom) allRecs = allRecs.filter(r => (r.fecha || '') >= fFrom + 'T00:00:00');
    if (fTo)   allRecs = allRecs.filter(r => (r.fecha || '') <= fTo   + 'T23:59:59');

    let histRecs = DB.cotizaciones.list().filter(r => agentIds.has(r._owner_id));
    if (fFrom) histRecs = histRecs.filter(r => (r.fecha || '') >= fFrom + 'T00:00:00');
    if (fTo)   histRecs = histRecs.filter(r => (r.fecha || '') <= fTo   + 'T23:59:59');

    if (typeof window.renderMetricasHTML === 'function') {
      outEl.innerHTML = window.renderMetricasHTML(allRecs, histRecs, agents, suffix, mode);
    }
  };

  // -- exportMetricasCSV — ahora con agencia -------------------------
  window.exportMetricasCSV = function (suffix) {
    const fAgent   = (document.getElementById('met-agent'   + suffix) || {}).value || '';
    const fFrom    = (document.getElementById('met-from'    + suffix) || {}).value || '';
    const fTo      = (document.getElementById('met-to'      + suffix) || {}).value || '';
    const fAgencia = (document.getElementById('met-agencia' + suffix) || {}).value || '';

    let users = DB.users.list().filter(u =>
      u.rol === 'agente' || u.rol === 'coordinador' || u.rol === 'admin'
    );
    if (fAgencia) users = users.filter(u => (u.agencia || 'independientes') === fAgencia);
    const agents = fAgent ? users.filter(u => u.email === fAgent) : users;
    const agentIds = new Set(agents.map(u => u.id));

    let allRecs = DB.pipeline.list()
      .filter(r => agentIds.has(r._owner_id))
      .map(r => {
        const owner = DB.users.findById(r._owner_id) || {};
        return Object.assign({}, r, {
          _nombre:  owner.nombre || '',
          _agencia: agenciaLabel(owner.agencia || 'independientes')
        });
      });
    if (fFrom) allRecs = allRecs.filter(r => (r.fecha || '') >= fFrom + 'T00:00:00');
    if (fTo)   allRecs = allRecs.filter(r => (r.fecha || '') <= fTo   + 'T23:59:59');

    if (!allRecs.length) { alert('No hay datos para exportar.'); return; }

    const headers = ['Agente','Agencia','Fecha','Etapa','Plan','Cobertura','Forma Pago','Prima','Titular','Cédula','Teléfono','Email','Notas'];
    const rows = allRecs.map(r => [
      r._nombre || '',
      r._agencia || '',
      r.fecha || '',
      r.stage || '',
      r.plan || '',
      r.cov  || '',
      r.pago || '',
      r.prima || '',
      ((r.titular && (r.titular.nombres || '')) + ' ' + (r.titular && (r.titular.apellidos || ''))).trim(),
      (r.titular && r.titular.cedula) || '',
      (r.titular && (r.titular.telefono || r.titular.tel)) || '',
      (r.titular && r.titular.email) || '',
      (r.notas || '').replace(/\n/g, ' ')
    ]);
    const csv = [headers, ...rows].map(row =>
      row.map(c => '"' + String(c).replace(/"/g, '""') + '"').join(',')
    ).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = 'metricas-' + (fAgencia ? fAgencia + '-' : '') + Date.now() + '.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // -- Wrap enterApp: botón admin para coord + filtros --------------
  const _origEnterAppAg = window.enterApp;
  window.enterApp = function (user) {
    if (typeof _origEnterAppAg === 'function') _origEnterAppAg(user);
    if (user && (user._realRol === 'coordinador' || user._realRol === 'admin') && $('btnAdmin')) {
      $('btnAdmin').classList.remove('hidden');
      if (user._realRol === 'coordinador') $('btnAdmin').title = 'Vista de mi agencia';
    }
    populateAndConfigureFilters(user);
    if (typeof window.updateNexoAccess === 'function') window.updateNexoAccess();
  };

  // -- También exponer el botón al coordinador desde bootstrap ------
  // (en la rama bootstrap original solo se mostraba para admin)

  // ===================================================================
  //  FIN AGENCIAS
  // ===================================================================

  // ───── Disparo ─────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
  } else {
    bootstrap();
  }

})();
