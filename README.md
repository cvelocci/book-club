# Club de lectura 📚

App para el sorteo mensual de libros. Incluye una biblioteca propia donde cargar los libros del club.

## Stack

- [TanStack Start](https://tanstack.com/start) (React, TypeScript, Vite)
- [Supabase](https://supabase.com) — base de datos PostgreSQL + RLS
- [shadcn/ui](https://ui.shadcn.com) + Tailwind CSS
- Deploy en [Vercel](https://vercel.com) (free tier)

---

## Primeros pasos

### 1. Clonar y instalar

```bash
git clone <url-del-repo>
cd book-club
npm install
```

### 2. Crear el proyecto Supabase

1. Ir a [supabase.com](https://supabase.com) → New project
2. En **SQL Editor**, correr el contenido de `supabase/migrations.sql`
3. Ir a **Settings → API** y copiar:
   - Project URL → `SUPABASE_URL`
   - `anon` key → `SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`

### 3. Variables de entorno

Renombrá `.env.local` y reemplazá los valores:

```bash
cp .env.local .env.local   # ya existe como template
```

```env
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

> ⚠️ Nunca commitees la `service_role` key.

### 4. Levantar en local

```bash
npm run dev
# → http://localhost:3000
```

---

## Deploy en Vercel

```bash
npx vercel deploy
```

Agregar las mismas tres variables de entorno en **Vercel Dashboard → Settings → Environment Variables**.

---

## Estructura

```
src/
  lib/
    types.ts              # Tipos compartidos (Book, BookInsert…)
    supabase.ts           # Cliente público Supabase
    supabase.server.ts    # Cliente admin (service role) — SOLO servidor
    books.server.ts       # loadBooks(), getAvailableBooks() para loaders
    books.functions.ts    # Server functions: CRUD + seed + import
  routes/
    __root.tsx            # Layout raíz + QueryClientProvider
    index.tsx             # Página principal / sorteo del mes
    biblioteca.tsx        # Página /biblioteca — tabla + formularios
  components/ui/          # shadcn/ui components
  styles.css              # Paleta papel + terracota, Fraunces/Karla
supabase/
  migrations.sql          # SQL para crear la tabla books + RLS
```

---

## Importar libros desde planilla

En `/biblioteca` → **Importar desde planilla**: copiás las filas de Google Sheets y las pegás. El orden de columnas esperado es:

```
Título | Autor | Género | Propuesto por | Nacionalidad | ¿Película? (sí/no) | Páginas | Notas
```
