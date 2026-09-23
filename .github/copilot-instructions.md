# Copilot Instructions — Club de lectura

## Sistema de diseño

Este proyecto tiene un sistema de diseño propio. Respetarlo siempre, sin excepciones.

### Tokens de color

```css
--linen:      #F4F0E0  /* fondo principal */
--seaweed:    #3D524C  /* texto y trazos */
--pistachio:  #C6CD85  /* color de marca, arcos */
--lavender:   #9F7CEF  /* acento */
--candyfloss: #F1CDE2  /* acento secundario */
```

Usar siempre estas variables CSS. Nunca inventar colores nuevos ni usar colores de Tailwind directamente (como `bg-green-500`). Para variantes, usar `color-mix(in srgb, var(--pistachio) 80%, black)` u `opacity`.

### Tipografía

- **Títulos y display:** fuente `Brought` — **siempre en minúscula** (`text-transform: lowercase` o directamente el texto en minúsculas). Fallback: `'Nunito', 'Poppins', sans-serif` (trazo grueso y redondeado). Clase: `.display-title`.
- **Cuerpo:** `Noto Sans KR` — regular para cuerpo, bold para destacados. Variable CSS: `--font-sans`.

### Forma recurrente: el arco

```css
border-radius: 999px 999px 0 0
```

Es la firma visual del proyecto. Usarlo para:
- Encuadrar imágenes (`<figure class="arco">`)
- Destacar bloques de contenido
- Elementos decorativos (stickers, badges)
- Clase utilitaria: `.arco`

### Estética: tinta plana

**PROHIBIDO en este proyecto:**
- Gradientes (`background: linear-gradient(...)`, `from-X to-Y` en Tailwind)
- Sombras suaves (`box-shadow`, `drop-shadow`, clases `shadow-*` de Tailwind)
- Glassmorphism (`backdrop-filter`, `bg-white/50`, fondos semitransparentes)
- Efectos 3D o de profundidad (`perspective`, `transform-style`)
- Bordes redondeados genéricos `rounded-lg` — usar `rounded-none` o el arco

**SÍ usar:**
- Colores planos sólidos sin transparencia
- Bordes de `1px` o `2px` en `--seaweed` para definir elementos
- Textura de sello de goma (clase `.stamp-texture` con ruido SVG)
- Contorno crema grueso en stickers (`outline: 3px solid var(--linen)`)
- El arco como forma principal

### Componentes shadcn

Al agregar componentes shadcn, sobreescribir los estilos para que:
- No usen `border-radius` genérico → usar `0` o el arco
- No usen `box-shadow` → eliminarlo
- Colores mapeados a las variables del proyecto

### Estructura de archivos

```
src/
  lib/
    books.functions.ts   # Server functions CRUD de libros
    books.server.ts      # loadBooks(), getAvailableBooks()
    supabase.ts          # cliente público (process.env)
    supabase.server.ts   # cliente admin service_role (process.env)
    types.ts             # tipo Book
  routes/
    index.tsx            # página principal / sorteo
    biblioteca.tsx       # /biblioteca — CRUD de libros
  styles.css             # tokens de diseño, NO modificar sin intención
```

### Reglas generales

1. Código en español donde sea semántico (nombres de variables de negocio, comentarios).
2. TypeScript estricto — sin `any`.
3. Zod para validación en server functions.
4. `process.env` para variables de entorno (no `import.meta.env`).
5. Al crear rutas nuevas, incluir siempre `head()` con `title`.
