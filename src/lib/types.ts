// Tipos del dominio (espejo del schema en supabase/migrations/0001_init.sql)

export type Cliente = {
  id: string
  nombre: string
  telefono: string | null
  email: string | null
  direccion: string | null
  notas: string | null
  created_at: string
}

export type Producto = {
  id: string
  nombre: string
  gramaje: number | null
  precio: number
  activo: boolean
  created_at: string
}

export type Pedido = {
  id: string
  cliente_id: string
  fecha: string
  envio: string | null
  total: number
  notas: string | null
  created_via: string
  created_at: string
}

export type PedidoItem = {
  id: string
  pedido_id: string
  producto_id: string | null
  descripcion: string
  cantidad: number
  precio_unitario: number
  subtotal: number
}

export type Pago = {
  id: string
  cliente_id: string
  pedido_id: string | null
  fecha: string
  monto: number
  metodo: string | null
  notas: string | null
  created_via: string
  created_at: string
}

// Fila de la vista vw_resumen_clientes
export type ResumenCliente = {
  cliente_id: string
  nombre: string
  telefono: string | null
  total_pedidos: number
  total_pagado: number
  saldo: number
  ultimo_pago: string | null
  ultimo_pedido: string | null
  deuda_desde: string | null
}

// Item suelto para crear un pedido (entra al RPC crear_pedido)
export type ItemNuevo = {
  producto_id?: string | null
  descripcion: string
  cantidad: number
  precio_unitario: number
}
