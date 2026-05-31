# 🎨 Guía de Marca NexoAgent

## Logo

El logo de NexoAgent combina un icono de chat con persona y el nombre de la marca, utilizando un gradiente moderno de azul a verde.

**Ubicación del archivo:** `/public/logo.png`

### Especificaciones del Logo
- **Formato:** PNG con fondo transparente
- **Dimensiones:** 818 KB (optimizar para producción recomendado)
- **Uso recomendado:**
  - Login: 320x100px
  - Sidebar: 180x50px  
  - Favicon/Icon: Versión simplificada del icono

## Paleta de Colores

### Colores Principales

#### Gradiente de Marca
```css
background: linear-gradient(135deg, #0EA5E9 0%, #06B6D4 50%, #10B981 100%);
```

- **Azul Principal** (#0EA5E9 / RGB: 14, 165, 233)
  - Uso: Botones primarios, enlaces, highlights
  
- **Cyan/Turquesa** (#06B6D4 / RGB: 6, 182, 212)
  - Uso: Gradientes, elementos interactivos
  
- **Verde Esmeralda** (#10B981 / RGB: 16, 185, 129)
  - Uso: Estados de éxito, confirmaciones, crecimiento

### Colores de Interfaz

#### Tonos Oscuros (UI)
- **Ink** (#0E2436) - Fondo del sidebar, texto principal oscuro
- **Ink-2** (#41566B) - Texto secundario
- **Muted** (#73869A) - Texto deshabilitado, placeholders

#### Tonos Claros (Backgrounds)
- **Blanco** (#FFFFFF) - Cards, modales
- **Soft** (#F4F7FA) - Background principal
- **Line** (#E2E9F0) - Bordes, divisores

### Colores de Estado

- **Éxito** (#22B26B - Verde)
- **Advertencia** (#F0A93B - Ámbar)
- **Error** (#EF4444 - Rojo)
- **Info** (#2B82F0 - Azul)

## Tipografía

### Fuentes

#### Sora (Headers y Títulos)
- **Pesos:** 400, 500, 600, 700, 800
- **Uso:** Títulos, nombres de marca, elementos destacados
- **Clase CSS:** `.font-sora`

#### Plus Jakarta Sans (Body)
- **Pesos:** 400, 500, 600, 700
- **Uso:** Texto del cuerpo, descripciones, párrafos
- **Clase CSS:** `.font-jakarta`

### Jerarquía de Texto

```css
/* Títulos principales */
h1: 3xl (1.875rem), font-sora, font-bold

/* Subtítulos */
h2: 2xl (1.5rem), font-sora, font-semibold

/* Secciones */
h3: xl (1.25rem), font-sora, font-semibold

/* Body text */
p: base (1rem), font-jakarta, font-normal
```

## Componentes de Marca

### Gradiente de Texto
```css
.grad-text {
  background: linear-gradient(100deg, #2B82F0 0%, #15B8C9 52%, #22B26B 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
```

### Gradiente de Fondo
```css
.grad-bg {
  background: linear-gradient(100deg, #2B82F0 0%, #15B8C9 52%, #22B26B 100%);
}
```

## Elementos Visuales

### Iconografía
- **Estilo:** Line icons, stroke-width: 1.8-2
- **Biblioteca:** Heroicons (outline)
- **Tamaño:** w-4 h-4 (16px) para sidebar, w-5 h-5 (20px) para contenido

### Sombras

```css
/* Card principal */
shadow-2xl: 0 25px 50px -12px rgba(0, 0, 0, 0.25)

/* Botones con gradiente */
shadow-lg shadow-blue-500/30
```

### Bordes

```css
/* Radius estándar */
rounded-lg: 0.5rem (8px)

/* Radius para cards */
rounded-2xl: 1rem (16px)

/* Radius para avatares/iconos */
rounded-xl: 0.75rem (12px)
```

## Animaciones

### Login Page
- **Fade In Up:** Entrada suave del formulario
- **Float:** Elementos decorativos flotantes

```css
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}
```

## Tagline y Messaging

### Tagline Principal
**"TU EMPLEADO VIRTUAL PARA WHATSAPP"**

### Propuesta de Valor (5 Pilares)
1. 💬 **Atiende** - Conversaciones inteligentes 24/7
2. 📅 **Agenda** - Gestión automática de citas
3. 👥 **Vende** - CRM integrado para ventas
4. 🔔 **Recuerda** - Automatizaciones y seguimientos
5. 📊 **Crece** - Analíticas y métricas de negocio

## Aplicaciones

### Login
- Logo centrado (320x100px)
- Fondo con gradiente sutil (blue-50 → cyan-50 → emerald-50)
- Card blanco con sombra pronunciada
- Botón con gradiente de marca
- Elementos decorativos flotantes con blur

### Sidebar (Panel Interno)
- Logo en header (180x50px)
- Fondo oscuro (#0E2436)
- Navegación con iconos y texto
- Avatar de empresa con gradiente
- Estado "Activo" con indicador verde

### Favicon
- Usar versión simplificada del icono (solo el chat bubble)
- Mantener gradiente de marca
- Tamaños: 16x16, 32x32, 180x180 (Apple)

## Tono de Voz

### Características
- **Profesional** pero cercano
- **Innovador** y tecnológico
- **Confiable** y seguro
- **Amigable** y accesible

### Evitar
- Lenguaje demasiado técnico
- Tono corporativo rígido
- Promesas exageradas
- Jerga innecesaria

## Mejoras Recomendadas

1. **Optimizar logo.png**
   - Reducir tamaño de archivo (actualmente 818 KB)
   - Crear versión WebP para web
   - Generar favicons en múltiples tamaños

2. **Crear versión SVG del logo**
   - Escalable sin pérdida de calidad
   - Tamaño de archivo menor
   - Mejor para web

3. **Iconos de marca personalizados**
   - Crear set de iconos con el estilo de NexoAgent
   - Mantener consistencia visual

---

**Última actualización:** Mayo 2026
**Versión:** 1.0
