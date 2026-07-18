/* ===================================================================
   db.js — Capa de acceso a datos (Supabase) del Cotizador PF
   Diseñado para reemplazar las llamadas a localStorage del HTML original.
   API expuesta: window.DB
   =================================================================== */

(function () {
  'use strict';

  // ---- Config / cliente ----------------------------------------------
  const cfg = window.SUPABASE_CONFIG || {};
  const isConfigured = !!(cfg.url && cfg.anonKey && cfg.url.startsWith('http'));

  // Lazy-create clients (necesita supabase-js cargado por el HTML)
  let supa = null;       // cliente principal (con sesión persistente)
  let supaAux = null;    // cliente auxiliar para crear usuarios sin perder sesión
  function _ensureClient() {
    if (!isConfigured) throw new Error('Supabase no está configurado.');
    if (!window.supabase) throw new Error('Librería supabase-js no cargada.');
    if (!supa) {
      supa = window.supabase.createClient(cfg.url, cfg.anonKey, {
        auth: { persistSession: true, autoRefreshToken: true, storageKey: 'pf_supa_session' }
      });
    }
    if (!supaAux) {
      supaAux = window.supabase.createClient(cfg.url, cfg.anonKey, {
        auth: { persistSession: false, autoRefreshToken: false }
      });
    }
  }

  // ---- Estado en memoria ---------------------------------------------
  // El HTML original consulta sincrónicamente arrays con loadXxx().
  // Cacheamos todo lo visible al usuario en memoria y refrescamos
  // bajo demanda. Toda escritura es asíncrona (write-through).
  const state = {
    profile: null,        // perfil del usuario actual
    users:   [],          // lista de perfiles visibles
    cot:     [],          // cotizaciones visibles (historial)
    pipe:    [],          // pipeline visible
    em:      [],          // emisiones visibles
    ready:   false,       // cache cargado al menos una vez
  };

  // ---- Helpers --------------------------------------------------------
  function toEmail(input) {
    // "Perofaga" -> intentaremos lookup por username; pero si no hay @,
    // probamos también con el sufijo .local que usamos para usernames.
    if (!input) return '';
    return input.trim();
  }

  function _log(...a) { try { console.log('[DB]', ...a); } catch (_) {} }

  async function _audit(action, entity, entity_id, payload) {
    if (!state.profile) return;
    try {
      await supa.from('audit_log').insert({
        actor_id:    state.profile.id,
        actor_email: state.profile.email,
        action, entity, entity_id,
        payload:     payload || null
      });
    } catch (_) { /* no-op */ }
  }

  // ===================================================================
  //  SESIÓN / LOGIN
  // ===================================================================
  const session = {
    current() { return state.profile; },

    async restore() {
      if (!isConfigured) return null;
      _ensureClient();
      const { data } = await supa.auth.getSession();
      if (!data || !data.session) return null;
      return await _loadProfile();
    },

    async login(emailOrUsername, password) {
      _ensureClient();
      let email = toEmail(emailOrUsername);
      // Si no contiene @, lo tratamos como username y resolvemos a email
      if (email && !email.includes('@')) {
        const { data, error } = await supa.rpc('lookup_email_by_username', { uname: email });
        if (error) throw new Error('No se pudo resolver el usuario.');
        if (!data) throw new Error('El usuario no está registrado en el sistema.');
        email = data;
      }
      const { error } = await supa.auth.signInWithPassword({ email, password });
      if (error) {
        const msg = (error.message || '').toLowerCase();
        if (msg.includes('invalid')) throw new Error('Credenciales incorrectas.');
        if (msg.includes('confirm')) throw new Error('Su cuenta no está confirmada. Avise al administrador.');
        throw new Error(error.message || 'No se pudo iniciar sesión.');
      }
      const prof = await _loadProfile();
      if (!prof) throw new Error('Su cuenta no tiene perfil asociado. Contacte al administrador.');
      if (!prof.active) {
        await supa.auth.signOut();
        state.profile = null;
        throw new Error('Su cuenta está desactivada. Contacte al administrador.');
      }
      _audit('login', 'session', null, null);
      return prof;
    },

    async logout() {
      if (!supa) return;
      await _audit('logout', 'session', null, null);
      await supa.auth.signOut();
      state.profile = null;
      state.users = []; state.cot = []; state.pipe = []; state.em = [];
      state.ready = false;
    },

    async changeMyPassword(newPass, currentPass) {
      _ensureClient();
      if (!state.profile) throw new Error('No autenticado.');
      // Si se provee la contraseña actual, la verificamos con el cliente
      // auxiliar (persistSession:false) para no afectar la sesión vigente.
      if (currentPass) {
        const { error: vErr } = await supaAux.auth.signInWithPassword({
          email:    state.profile.email,
          password: currentPass
        });
        if (vErr) throw new Error('La contraseña actual es incorrecta.');
        try { await supaAux.auth.signOut(); } catch (_) { /* no-op */ }
      }
      const { error } = await supa.auth.updateUser({ password: newPass });
      if (error) throw new Error(error.message);
      await _audit('change_password', 'session', null, null);
      return true;
    }
  };

  async function _loadProfile() {
    const { data: u } = await supa.auth.getUser();
    if (!u || !u.user) return null;
    const { data, error } = await supa
      .from('profiles')
      .select('*')
      .eq('id', u.user.id)
      .single();
    if (error || !data) return null;
    state.profile = data;
    return data;
  }

  // ===================================================================
  //  CACHE / REFRESH
  // ===================================================================
  async function refresh() {
    if (!state.profile) return;
    const rol = state.profile.rol;

    // Perfiles — todos los autenticados pueden verlos (RLS lo permite,
    // y son necesarios para mostrar nombres de agentes)
    const { data: users, error: uErr } = await supa
      .from('profiles')
      .select('*')
      .order('rol')
      .order('nombre');
    if (uErr) _log('refresh users err', uErr);
    state.users = users || [];

    // Cotizaciones — el RLS filtra automáticamente
    const { data: cot, error: cErr } = await supa
      .from('cotizaciones')
      .select('*')
      .order('fecha', { ascending: false });
    if (cErr) _log('refresh cot err', cErr);
    state.cot = (cot || []).map(_normalizeCotRow);

    // Pipeline
    const { data: pipe, error: pErr } = await supa
      .from('pipeline')
      .select('*')
      .order('fecha', { ascending: false });
    if (pErr) _log('refresh pipe err', pErr);
    state.pipe = (pipe || []).map(_normalizePipeRow);

    // Emisiones
    const { data: em, error: eErr } = await supa
      .from('emisiones')
      .select('*')
      .order('creado', { ascending: false });
    if (eErr) _log('refresh em err', eErr);
    state.em = (em || []).map(_normalizeEmRow);

    state.ready = true;
    _log('cache loaded:', { users: state.users.length, cot: state.cot.length, pipe: state.pipe.length, em: state.em.length });
  }

  // Las filas en supabase usan snake_case; el HTML legado espera camelCase.
  // Convertimos al formato que ya consume el HTML.
  function _normalizeCotRow(r) {
    return {
      id:           r.id,
      fecha:        r.fecha,
      agente:       r.agente_nombre,
      plan:         r.plan,
      cobertura:    Number(r.cobertura) || 0,
      formaPago:    r.forma_pago,
      prima:        Number(r.prima) || 0,
      titular:      r.titular || {},
      afiliados:    r.afiliados || [],
      emailEnviado: !!r.email_enviado,
      fechaEmail:   r.fecha_email,
      paraEmitir:   !!r.para_emitir,
      _owner_id:    r.owner_id,
    };
  }
  function _denormalizeCotRow(r, ownerId) {
    return {
      id:            r.id,
      owner_id:      ownerId || r._owner_id || state.profile.id,
      agente_nombre: r.agente,
      fecha:         r.fecha || new Date().toISOString(),
      plan:          r.plan,
      cobertura:     r.cobertura,
      forma_pago:    r.formaPago,
      prima:         r.prima,
      titular:       r.titular || {},
      afiliados:     r.afiliados || [],
      email_enviado: !!r.emailEnviado,
      fecha_email:   r.fechaEmail || null
    };
  }

  function _normalizePipeRow(r) {
    return {
      id:        r.id,
      stage:     r.stage,
      fecha:     r.fecha,
      plan:      r.plan,
      cov:       Number(r.cov) || 0,
      pago:      r.pago,
      prima:     Number(r.prima) || 0,
      titular:   r.titular || {},
      afil:      r.afil || [],
      notas:     r.notas || '',
      _owner_id: r.owner_id,
    };
  }
  function _denormalizePipeRow(r, ownerId) {
    return {
      id:       r.id,
      owner_id: ownerId || r._owner_id || state.profile.id,
      stage:    r.stage || 'lead',
      fecha:    r.fecha || new Date().toISOString(),
      plan:     r.plan,
      cov:      r.cov,
      pago:     r.pago,
      prima:    r.prima,
      titular:  r.titular || {},
      afil:     r.afil || [],
      notas:    r.notas || ''
    };
  }

  function _normalizeEmRow(r) {
    return {
      id:       r.id,
      fecha:    r.fecha,
      creado:   r.creado,
      plan:     r.plan,
      cob:      r.cob != null ? String(r.cob) : '',
      prima:    r.prima != null ? String(r.prima) : '',
      pago:     r.pago,
      titular:  r.titular || {},
      notas:    r.notas || '',
      agente:   r.agente,
      _owner_id:r.owner_id
    };
  }
  function _denormalizeEmRow(r, ownerId) {
    return {
      id:       r.id,
      owner_id: ownerId || r._owner_id || state.profile.id,
      fecha:    r.fecha || null,
      creado:   r.creado || new Date().toISOString(),
      plan:     r.plan,
      cob:      r.cob ? Number(r.cob) : null,
      prima:    r.prima ? Number(r.prima) : null,
      pago:     r.pago,
      titular:  r.titular || {},
      notas:    r.notas || '',
      agente:   r.agente
    };
  }

  // ===================================================================
  //  USUARIOS
  // ===================================================================
  const users = {
    list() { return state.users.slice(); },

    listAgentsOfMyTeam() {
      // Para admin: los asesores cuyo admin_id soy yo
      if (!state.profile) return [];
      return state.users.filter(u => u.admin_id === state.profile.id);
    },

    findByEmail(email) {
      if (!email) return null;
      const e = email.toLowerCase();
      return state.users.find(u => (u.email || '').toLowerCase() === e
        || (u.username || '').toLowerCase() === e) || null;
    },

    findById(id) {
      return state.users.find(u => u.id === id) || null;
    },

    async create({ email, password, nombre, rol, admin_id, username, agencia, acceso_nexo }) {
      _ensureClient();
      if (!state.profile || (state.profile.rol !== 'admin' && state.profile.rol !== 'superadmin')) {
        throw new Error('No tienes permisos para crear usuarios.');
      }
      // Crear con cliente auxiliar para no perder la sesión del admin actual
      const { data, error } = await supaAux.auth.signUp({
        email,
        password,
        options: {
          data: { nombre, rol: rol || 'agente' }
        }
      });
      if (error) {
        const msg = error.message || '';
        if (/already.*registered|exists/i.test(msg)) {
          throw new Error(
            'Ya existe un usuario con ese correo. ' +
            'Si fue eliminado antes, también debes borrarlo en ' +
            'Supabase → Authentication → Users (la eliminación desde el cotizador ' +
            'solo borra el perfil, no la cuenta de autenticación).'
          );
        }
        throw new Error(msg);
      }
      // El trigger crea el profile básico; nosotros lo completamos.
      const newId = data.user && data.user.id;
      if (newId) {
        const patch = { nombre: nombre || '', rol: rol || 'agente' };
        if (admin_id !== undefined) patch.admin_id = admin_id || null;
        if (username)               patch.username = username;
        if (agencia)                patch.agencia  = agencia;
        if (acceso_nexo !== undefined) patch.acceso_nexo = !!acceso_nexo;
        const { error: upErr } = await supa.from('profiles').update(patch).eq('id', newId);
        if (upErr) throw new Error(upErr.message);
      }
      await _audit('create_user', 'user', newId, { email, rol });
      await refresh();
      return newId;
    },

    async update(id, patch) {
      _ensureClient();
      if (!state.profile) throw new Error('No autenticado.');
      const allowed = ['nombre','rol','admin_id','active','username','agencia','acceso_nexo'];
      const clean = {};
      for (const k of allowed) if (k in patch) clean[k] = patch[k];
      const { error } = await supa.from('profiles').update(clean).eq('id', id);
      if (error) throw new Error(error.message);
      await _audit('update_user', 'user', id, clean);
      await refresh();
    },

    async toggleActive(id) {
      const u = users.findById(id);
      if (!u) throw new Error('Usuario no encontrado.');
      await users.update(id, { active: !u.active });
    },

    async remove(id) {
      _ensureClient();
      if (!state.profile || state.profile.rol !== 'superadmin') {
        throw new Error('Solo el superadmin puede eliminar usuarios.');
      }
      // OJO: esto elimina solo el profile. auth.users persiste a menos que
      // se use la admin API (no disponible desde anon). Mejor: desactivar.
      const { error } = await supa.from('profiles').delete().eq('id', id);
      if (error) throw new Error(error.message);
      await _audit('delete_user', 'user', id, null);
      await refresh();
    }
  };

  // ===================================================================
  //  COTIZACIONES (historial)
  // ===================================================================
  const cotizaciones = {
    list() { return state.cot.slice(); },

    findById(id) { return state.cot.find(r => r.id === id) || null; },

    async upsert(rec) {
      _ensureClient();
      if (!state.profile) throw new Error('No autenticado.');
      const row = _denormalizeCotRow(rec);
      const { error } = await supa.from('cotizaciones').upsert(row, { onConflict: 'id' });
      if (error) throw new Error(error.message);
      await _audit('save_cot', 'cotizacion', row.id, null);
      // actualizar caché localmente para que el HTML lo vea de inmediato
      const idx = state.cot.findIndex(r => r.id === rec.id);
      const normalized = _normalizeCotRow({ ...row });
      if (idx >= 0) state.cot[idx] = normalized;
      else state.cot.unshift(normalized);
    },

    async markEmailSent(id) {
      _ensureClient();
      const now = new Date().toISOString();
      const { error } = await supa.from('cotizaciones')
        .update({ email_enviado: true, fecha_email: now })
        .eq('id', id);
      if (error) throw new Error(error.message);
      const r = state.cot.find(r => r.id === id);
      if (r) { r.emailEnviado = true; r.fechaEmail = now; }
    },

    // Marca/desmarca una cotización como "pendiente de emisión".
    async setParaEmitir(id, value) {
      _ensureClient();
      const { error } = await supa.from('cotizaciones')
        .update({ para_emitir: !!value })
        .eq('id', id);
      if (error) throw new Error(error.message);
      const r = state.cot.find(r => r.id === id);
      if (r) r.paraEmitir = !!value;
      await _audit('mark_para_emitir', 'cotizacion', id, { value: !!value });
    },

    async remove(id) {
      _ensureClient();
      const { error } = await supa.from('cotizaciones').delete().eq('id', id);
      if (error) throw new Error(error.message);
      state.cot = state.cot.filter(r => r.id !== id);
      await _audit('delete_cot', 'cotizacion', id, null);
    }
  };

  // ===================================================================
  //  PIPELINE
  // ===================================================================
  const pipeline = {
    // Lista todo lo visible (RLS aplica). Equivalente a `loadPipeline()`
    // cuando es asesor; equivalente a `loadAllPipelines()` cuando es admin/super.
    list() { return state.pipe.slice(); },

    // Lista solo lo mío (para el asesor que necesita su propio pipeline)
    listMine() {
      if (!state.profile) return [];
      return state.pipe.filter(r => r._owner_id === state.profile.id);
    },

    findById(id) { return state.pipe.find(r => r.id === id) || null; },

    async upsert(rec, ownerIdOverride) {
      _ensureClient();
      if (!state.profile) throw new Error('No autenticado.');
      const row = _denormalizePipeRow(rec, ownerIdOverride);
      const { error } = await supa.from('pipeline').upsert(row, { onConflict: 'id' });
      if (error) throw new Error(error.message);
      await _audit('save_pipe', 'pipeline', row.id, { stage: row.stage });
      const idx = state.pipe.findIndex(r => r.id === rec.id);
      const normalized = _normalizePipeRow({ ...row });
      if (idx >= 0) state.pipe[idx] = normalized;
      else state.pipe.unshift(normalized);
    },

    async remove(id) {
      _ensureClient();
      const { error } = await supa.from('pipeline').delete().eq('id', id);
      if (error) throw new Error(error.message);
      state.pipe = state.pipe.filter(r => r.id !== id);
      await _audit('delete_pipe', 'pipeline', id, null);
    }
  };

  // ===================================================================
  //  EMISIONES
  // ===================================================================
  const emisiones = {
    list() { return state.em.slice(); },

    listMine() {
      if (!state.profile) return [];
      return state.em.filter(r => r._owner_id === state.profile.id);
    },

    findById(id) { return state.em.find(r => r.id === id) || null; },

    async upsert(rec, ownerIdOverride) {
      _ensureClient();
      if (!state.profile) throw new Error('No autenticado.');
      const row = _denormalizeEmRow(rec, ownerIdOverride);
      const { error } = await supa.from('emisiones').upsert(row, { onConflict: 'id' });
      if (error) throw new Error(error.message);
      await _audit('save_em', 'emision', row.id, null);
      const idx = state.em.findIndex(r => r.id === rec.id);
      const normalized = _normalizeEmRow({ ...row });
      if (idx >= 0) state.em[idx] = normalized;
      else state.em.unshift(normalized);
    },

    async remove(id) {
      _ensureClient();
      const { error } = await supa.from('emisiones').delete().eq('id', id);
      if (error) throw new Error(error.message);
      state.em = state.em.filter(r => r.id !== id);
      await _audit('delete_em', 'emision', id, null);
    }
  };

  // ===================================================================
  //  MIGRACIÓN DESDE LOCALSTORAGE
  // ===================================================================
  // Lee los datos antiguos del localStorage y los sube a Supabase.
  // Solo permitido a admin / superadmin.
  async function migrateFromLocalStorage(opts) {
    opts = opts || {};
    if (!state.profile || (state.profile.rol !== 'admin' && state.profile.rol !== 'superadmin')) {
      throw new Error('Solo admin/superadmin puede importar datos.');
    }

    const report = {
      cotizaciones: { ok: 0, skip: 0, errors: [] },
      pipeline:     { ok: 0, skip: 0, errors: [] },
      emisiones:    { ok: 0, skip: 0, errors: [] },
      usersChecked: 0,
      usersMissing: []
    };

    // Email -> profile id (resolver por email, ya que en localStorage
    // los datos están scoped por email).
    const emailIdx = {};
    state.users.forEach(u => { emailIdx[(u.email || '').toLowerCase()] = u; });

    // 1) Historial — guardado bajo "pf_historial_v1" (clave global)
    try {
      const raw = localStorage.getItem('pf_historial_v1');
      if (raw) {
        const hist = JSON.parse(raw);
        // No tenemos el email del owner por cada registro; usamos el
        // nombre del agente para intentar resolver, o lo asignamos al
        // perfil del usuario actual como fallback.
        const rows = [];
        for (const r of hist) {
          // Resolver owner por nombre de agente
          let owner = state.users.find(u =>
            (u.nombre || '').toLowerCase() === (r.agente || '').toLowerCase()
          );
          if (!owner) owner = state.profile;
          rows.push(_denormalizeCotRow({
            id:          r.id,
            fecha:       r.fecha,
            agente:      r.agente,
            plan:        r.plan,
            cobertura:   r.cobertura,
            formaPago:   r.formaPago,
            prima:       r.prima,
            titular:     r.titular,
            afiliados:   r.afiliados,
            emailEnviado:r.emailEnviado,
            fechaEmail:  r.fechaEmail
          }, owner.id));
        }
        if (rows.length) {
          const { error } = await supa.from('cotizaciones').upsert(rows, { onConflict: 'id' });
          if (error) report.cotizaciones.errors.push(error.message);
          else report.cotizaciones.ok += rows.length;
        }
      }
    } catch (e) { report.cotizaciones.errors.push(String(e)); }

    // 2) Pipeline — claves "pf_pipeline_v2_<email>"
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!k || !k.startsWith('pf_pipeline_v2_')) continue;
        const email = k.replace('pf_pipeline_v2_', '').toLowerCase();
        const owner = emailIdx[email];
        report.usersChecked++;
        if (!owner) { report.usersMissing.push(email); continue; }
        const recs = JSON.parse(localStorage.getItem(k) || '[]');
        const rows = recs.map(r => _denormalizePipeRow(r, owner.id));
        if (rows.length) {
          const { error } = await supa.from('pipeline').upsert(rows, { onConflict: 'id' });
          if (error) report.pipeline.errors.push(email + ': ' + error.message);
          else report.pipeline.ok += rows.length;
        }
      }
    } catch (e) { report.pipeline.errors.push(String(e)); }

    // 3) Emisiones — claves "pf_emisiones_v1_<email>"
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!k || !k.startsWith('pf_emisiones_v1_')) continue;
        const email = k.replace('pf_emisiones_v1_', '').toLowerCase();
        const owner = emailIdx[email];
        if (!owner) { report.usersMissing.push(email); continue; }
        const recs = JSON.parse(localStorage.getItem(k) || '[]');
        const rows = recs.map(r => _denormalizeEmRow(r, owner.id));
        if (rows.length) {
          const { error } = await supa.from('emisiones').upsert(rows, { onConflict: 'id' });
          if (error) report.emisiones.errors.push(email + ': ' + error.message);
          else report.emisiones.ok += rows.length;
        }
      }
    } catch (e) { report.emisiones.errors.push(String(e)); }

    await refresh();
    await _audit('migrate_local', 'system', null, report);
    return report;
  }

  // ===================================================================
  //  EXPORT
  // ===================================================================
  window.DB = {
    isConfigured: () => isConfigured,
    config: cfg,
    session, users, cotizaciones, pipeline, emisiones,
    refresh, migrateFromLocalStorage,
    _state: state, // útil para depurar — no usar en código de producción
  };

  _log('db.js cargado. Configurado:', isConfigured);
})();
