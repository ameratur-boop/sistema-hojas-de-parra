# Sistema Samir 🍃

Gestión de pedidos, pagos y morosos para venta de hojas de parra.
Reemplaza la planilla de papel (Fecha · Detalle · Total · Pagado) y suma un **bot de Telegram** para cargar todo desde el celular.

## Stack
- Next.js 14 (App Router) + TypeScript + Tailwind
- Supabase (Postgres + Auth)
- Bot de Telegram con interpretación por Claude (Anthropic)

## Funciones
- **Morosos** (home): deudores ordenados por la deuda más antigua primero.
- **Clientes**: ABM + cuenta corriente (pedidos, pagos y saldo).
- **Pedidos / Pagos**: carga de ventas con items (cantidad × presentación × precio) y cobros parciales.
- **Productos**: presentaciones y precios (300g, 100g, etc.).
- **Reportes**: ventas/cobranzas por mes y productos más vendidos.
- **Bot de Telegram**: "Agrimpay 24x300 y 24x100", "Agrimpay pagó 500 mil", "quién debe" → confirma y guarda.

---

## Setup

### 1. Base de datos (Supabase)
1. Creá un proyecto en https://supabase.com (región São Paulo).
2. SQL Editor → New query → pegá el contenido de [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql) → **Run**.
3. Authentication → Users → **Add user** (email + contraseña) para poder entrar a la web.
4. Settings → API → copiá `Project URL`, `anon public` y `service_role`.

### 2. Variables de entorno
Copiá `.env.local.example` a `.env.local` y completá:
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
ANTHROPIC_API_KEY=...
TELEGRAM_BOT_TOKEN=...
TELEGRAM_WEBHOOK_SECRET=<inventá-uno-largo>
TELEGRAM_ALLOWED_IDS=<tu-id-de-telegram>
```

### 3. Correr local
```
npm install
npm run dev
```
Entrá a http://localhost:3000 con el usuario creado en el paso 1.3.

---

## Bot de Telegram
1. Creá el bot con [@BotFather](https://t.me/BotFather) → guardá el token en `TELEGRAM_BOT_TOKEN`.
2. Para saber tu ID, escribile al bot una vez (te responde con tu ID si no estás autorizado) y ponelo en `TELEGRAM_ALLOWED_IDS`.
3. Una vez desplegado (con URL pública), registrá el webhook:
```bash
curl "https://api.telegram.org/bot<TOKEN>/setWebhook" \
  -d "url=https://TU-DOMINIO/api/telegram" \
  -d "secret_token=<TELEGRAM_WEBHOOK_SECRET>"
```

> El bot necesita una URL pública (no funciona en localhost). Para probar local podés usar un túnel (ngrok / cloudflared) y apuntar el webhook ahí.

---

## Deploy (Vercel)
1. Importá el repo en Vercel.
2. Cargá las mismas variables de entorno.
3. Deploy → registrá el webhook con la URL de producción.
