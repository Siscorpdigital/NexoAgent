/* ===================================================================
   CONFIGURACIÓN DE NEXOAGENT
   -------------------------------------------------------------------
   Dirección (URL) de la plataforma NexoAgent que se mostrará embebida
   en el panel del cotizador para Admin, SuperAdmin y usuarios autorizados.

   - Si NexoAgent se despliega en el MISMO dominio que el cotizador
     (recomendado, p. ej. bajo la ruta "/nexo"), use una ruta relativa:
         url: "/nexo"
     Así el iframe y el login funcionan sin problemas de cookies.

   - Si NexoAgent está en OTRO dominio, ponga la URL completa:
         url: "https://nexoagent-xxxx.vercel.app"
     (En ese caso NexoAgent debe permitir el embebido desde el dominio
      del cotizador — cabecera Content-Security-Policy: frame-ancestors.)

   - Déjelo vacío ("") mientras NexoAgent aún no esté disponible: el panel
     mostrará un aviso de "módulo no configurado" en lugar de un error.
   =================================================================== */

window.NEXO_CONFIG = {
  url: ""   // ← pegar aquí la URL o ruta de NexoAgent cuando esté lista
};
