-- Gastos del negocio (compra de hojas, envases, fletes, sueldos, etc.)
-- categoria guarda la clave de la lista fija definida en src/lib/gastos.ts

create table if not exists gastos (
  id          uuid primary key default gen_random_uuid(),
  fecha       date not null default current_date,
  categoria   text not null,
  descripcion text,
  monto       numeric(12,2) not null check (monto > 0),
  metodo      text,
  created_via text not null default 'web',
  created_at  timestamptz not null default now()
);

create index if not exists idx_gastos_fecha on gastos(fecha);

alter table gastos enable row level security;
drop policy if exists auth_all on gastos;
create policy auth_all on gastos for all to authenticated using (true) with check (true);
