# Baladi · Sistema de pedidos

Gestión de pedidos, pagos y deudores para venta de hojas de parra.
Reemplaza la planilla de papel (Fecha · Detalle · Total · Pagado) y suma un **bot de Telegram** para cargar todo desde el celular.

## Stack
- Next.js 14 (App Router) + TypeScript + Tailwind
- Supabase (Postgres)
- Bot de Telegram con interpretación por Claude (Anthropic)

## Funciones
- **Inicio**: pulso de cobranzas en vivo (hoy, semana, mes, últimos pagos), carga rápida en texto libre y deudores ordenados por la deuda más antigua.
- **Pedidos**: ventas por bolsa (300, 250, 100, 50 hojas) y canal (por mayor / por menor), con buscador.
- **Clientes**: buscador, filtros por deuda y por cantidad de bolsas compradas, y cuenta corriente con saldo acumulado.
- **Productos**: lista de precios por bolsa y canal. El nombre se arma solo para que no haya variantes duplicadas.
- **Analíticas**: ventas y bolsas por día, semana o mes, por mayor y por menor, comparadas con el período anterior.
- **Bot de Telegram**: "Sukaria 24x300 y 12x100", "Sukaria 5x300 por menor", "Sukaria pagó 500 mil", "quién debe".

Las líneas viejas cargadas como "300g", "bolsa 300 hojas" o "BOLSAS DE 300" se agrupan como la misma bolsa al mostrarse (`src/lib/productos.ts`); la base no se modifica.

Chequeo de la lógica de agrupación: `npm run check`.

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
