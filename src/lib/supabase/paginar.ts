type Pagina<T> = PromiseLike<{ data: T[] | null; error: { message: string; code?: string } | null }>

// PostgREST corta en 1000 filas por request: sin paginar, los totales quedarían mal sin avisar.
export async function traerTodo<T>(pagina: (desde: number, hasta: number) => Pagina<T>, tam = 1000): Promise<T[]> {
  const out: T[] = []
  for (let desde = 0; ; desde += tam) {
    const { data, error } = await pagina(desde, desde + tam - 1)
    if (error) throw Object.assign(new Error(error.message), { code: error.code })
    out.push(...(data ?? []))
    if ((data?.length ?? 0) < tam) return out
  }
}
