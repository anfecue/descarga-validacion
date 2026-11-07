type Bucket = {
  conteo: number;
  reinicio: number;
};

const VENTANA_MS = 60_000;
const MAXIMO_POR_VENTANA = 30;

const buckets = new Map<string, Bucket>();

export function permitirConsulta(ip: string): boolean {
  const ahora = Date.now();
  const bucket = buckets.get(ip);

  if (!bucket || ahora > bucket.reinicio) {
    buckets.set(ip, { conteo: 1, reinicio: ahora + VENTANA_MS });
    return true;
  }

  if (bucket.conteo >= MAXIMO_POR_VENTANA) {
    return false;
  }

  bucket.conteo += 1;
  return true;
}

export function ipDeRequest(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();

  return request.headers.get("x-real-ip") ?? "desconocida";
}

// Limpieza oportunista para que el Map no crezca sin control.
if (buckets.size === 0) {
  const intervalo = setInterval(() => {
    const ahora = Date.now();
    for (const [ip, bucket] of buckets) {
      if (ahora > bucket.reinicio) buckets.delete(ip);
    }
    if (buckets.size === 0) clearInterval(intervalo);
  }, VENTANA_MS);

  if (typeof intervalo.unref === "function") intervalo.unref();
}
