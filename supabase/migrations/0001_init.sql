-- Sistema Samir — esquema inicial
-- Negocio de hojas de parra: clientes con cuenta corriente (pedidos y pagos parciales).
-- Basado en la planilla real: Fecha | Detalle y envío | Total | Pagado.

-- ============================================================
-- Tablas
-- ============================================================

create table if not exists clientes (
  id          uuid primary key default gen_random_uuid(),
  nombre      text not null,
  telefono    text,
  email       text,
  direccion   text,
  notas       text,
  created_at  timestamptz not null default now()
);

-- Presentaciones de producto. Ej: "300g" a $25.000, "100g" a $10.000.
create table if not exists productos (
  id          uuid primary key default gen_random_uuid(),
  nombre      text not null,
  gramaje     integer,                 -- 300, 100 (informativo)
  precio      numeric(12,2) not null default 0,
  activo      boolean not null default true,
  created_at  timestamptz not null default now()
);

-- Cada pedido es una fila de la planilla (puede tener varias líneas/items).
create table if not exists pedidos (
  id          uuid primary key default gen_random_uuid(),
  cliente_id  uuid not null references clientes(id) on delete cascade,
  fecha       date not null default current_date,
  envio       text,                    -- detalle de envío / observación de la columna "Detalle y envío"
  total       numeric(12,2) not null default 0,
  notas       text,
  created_via text not null default 'web',   -- 'web' | 'telegram'
  created_at  timestamptz not null default now()
);

create table if not exists pedido_items (
  id              uuid primary key default gen_random_uuid(),
  pedido_id       uuid not null references pedidos(id) on delete cascade,
  producto_id     uuid references productos(id) on delete set null,
  descripcion     text not null,        -- snapshot, ej "300g"
  cantidad        numeric(12,2) not null default 1,
  precio_unitario numeric(12,2) not null default 0,
  subtotal        numeric(12,2) not null default 0
);

-- Pagos a cuenta del cliente (parciales, con fecha). Opcionalmente atados a un pedido.
create table if not exists pagos (
  id          uuid primary key default gen_random_uuid(),
  cliente_id  uuid not null references clientes(id) on delete cascade,
  pedido_id   uuid references pedidos(id) on delete set null,
  fecha       date not null default current_date,
  monto       numeric(12,2) not null,
  metodo      text,                     -- efectivo, transferencia, etc.
  notas       text,
  created_via text not null default 'web',
  created_at  timestamptz not null default now()
);

create index if not exists idx_pedidos_cliente on pedidos(cliente_id);
create index if not exists idx_pedidos_fecha   on pedidos(fecha);
create index if not exists idx_pagos_cliente    on pagos(cliente_id);
create index if not exists idx_items_pedido     on pedido_items(pedido_id);

-- ============================================================
-- Vista: resumen de cuenta corriente por cliente
-- saldo = total pedidos - total pagado
-- deuda_desde = fecha del pedido impago más antiguo aplicando pagos FIFO
--               (sirve para ordenar "morosos más antiguos primero")
-- ============================================================

create or replace view vw_resumen_clientes as
with totales as (
  select c.id as cliente_id, c.nombre, c.telefono,
         coalesce((select sum(p.total) from pedidos p where p.cliente_id = c.id), 0) as total_pedidos,
         coalesce((select sum(pg.monto) from pagos   pg where pg.cliente_id = c.id), 0) as total_pagado,
         (select max(pg.fecha) from pagos pg where pg.cliente_id = c.id) as ultimo_pago,
         (select max(pe.fecha) from pedidos pe where pe.cliente_id = c.id) as ultimo_pedido
  from clientes c
),
acum as (
  -- suma acumulada de pedidos por cliente ordenados por fecha (FIFO)
  select p.cliente_id, p.fecha,
         sum(p.total) over (
           partition by p.cliente_id
           order by p.fecha, p.id
           rows between unbounded preceding and current row
         ) as acumulado
  from pedidos p
),
deuda_desde as (
  select a.cliente_id,
         min(a.fecha) filter (where a.acumulado > t.total_pagado) as deuda_desde
  from acum a
  join totales t on t.cliente_id = a.cliente_id
  group by a.cliente_id
)
select t.cliente_id,
       t.nombre,
       t.telefono,
       t.total_pedidos,
       t.total_pagado,
       (t.total_pedidos - t.total_pagado) as saldo,
       t.ultimo_pago,
       t.ultimo_pedido,
       d.deuda_desde
from totales t
left join deuda_desde d on d.cliente_id = t.cliente_id;

-- ============================================================
-- RPC: crear pedido con items (transaccional). Calcula total.
-- p_items: jsonb array de { producto_id?, descripcion, cantidad, precio_unitario }
-- ============================================================

create or replace function crear_pedido(
  p_cliente_id  uuid,
  p_fecha       date,
  p_envio       text,
  p_notas       text,
  p_items       jsonb,
  p_created_via text default 'web'
) returns uuid
language plpgsql
as $$
declare
  v_pedido_id uuid;
  v_total     numeric(12,2) := 0;
  v_item      jsonb;
  v_cant      numeric(12,2);
  v_precio    numeric(12,2);
  v_sub       numeric(12,2);
begin
  insert into pedidos (cliente_id, fecha, envio, notas, total, created_via)
  values (p_cliente_id, coalesce(p_fecha, current_date), p_envio, p_notas, 0, coalesce(p_created_via, 'web'))
  returning id into v_pedido_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_cant   := coalesce((v_item->>'cantidad')::numeric, 1);
    v_precio := coalesce((v_item->>'precio_unitario')::numeric, 0);
    v_sub    := v_cant * v_precio;
    v_total  := v_total + v_sub;

    insert into pedido_items (pedido_id, producto_id, descripcion, cantidad, precio_unitario, subtotal)
    values (
      v_pedido_id,
      nullif(v_item->>'producto_id','')::uuid,
      coalesce(v_item->>'descripcion', ''),
      v_cant, v_precio, v_sub
    );
  end loop;

  update pedidos set total = v_total where id = v_pedido_id;
  return v_pedido_id;
end;
$$;

-- RPC: registrar pago a cuenta
create or replace function registrar_pago(
  p_cliente_id  uuid,
  p_fecha       date,
  p_monto       numeric,
  p_metodo      text default null,
  p_notas       text default null,
  p_pedido_id   uuid default null,
  p_created_via text default 'web'
) returns uuid
language plpgsql
as $$
declare
  v_id uuid;
begin
  insert into pagos (cliente_id, pedido_id, fecha, monto, metodo, notas, created_via)
  values (p_cliente_id, p_pedido_id, coalesce(p_fecha, current_date), p_monto, p_metodo, p_notas, coalesce(p_created_via,'web'))
  returning id into v_id;
  return v_id;
end;
$$;

-- ============================================================
-- Bot de Telegram: operaciones pendientes de confirmar
-- (el bot interpreta el mensaje, guarda acá y pide confirmación)
-- ============================================================
create table if not exists telegram_pending (
  id          uuid primary key default gen_random_uuid(),
  chat_id     bigint not null,
  payload     jsonb not null,
  created_at  timestamptz not null default now()
);
-- RLS habilitado sin policy: solo accesible con service_role (el bot).
alter table telegram_pending enable row level security;

-- ============================================================
-- RLS: uso interno, cualquier usuario autenticado puede todo
-- ============================================================

alter table clientes      enable row level security;
alter table productos     enable row level security;
alter table pedidos       enable row level security;
alter table pedido_items  enable row level security;
alter table pagos         enable row level security;

do $$
declare t text;
begin
  foreach t in array array['clientes','productos','pedidos','pedido_items','pagos']
  loop
    execute format('drop policy if exists auth_all on %I', t);
    execute format(
      'create policy auth_all on %I for all to authenticated using (true) with check (true)', t
    );
  end loop;
end$$;

-- ============================================================
-- Seed de presentaciones según la planilla
-- ============================================================
insert into productos (nombre, gramaje, precio)
select * from (values
  ('Hojas de parra 300g', 300, 25000),
  ('Hojas de parra 100g', 100, 10000)
) as v(nombre, gramaje, precio)
where not exists (select 1 from productos);
