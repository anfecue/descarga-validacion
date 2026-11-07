export function formatearCelular(indicativo: string, celular: string): string {
  const digitos = celular.replace(/\D/g, "");
  const cuerpo =
    digitos.length === 10
      ? `${digitos.slice(0, 3)} ${digitos.slice(3, 6)} ${digitos.slice(6)}`
      : digitos;

  return [indicativo, cuerpo].filter(Boolean).join(" ");
}

export function formatearTelegram(
  usaTelegram: string,
  usuarioTelegram: string | null,
): string {
  // El usuario registrado es la evidencia real: hay filas con usa_telegram = "no"
  // que sí tienen un usuario de Telegram cargado.
  const usuario = usuarioTelegram?.trim();
  if (usuario) {
    return usuario.startsWith("@") ? usuario : `@${usuario}`;
  }

  if (usaTelegram.trim().toLowerCase() === "si") return "Sí, sin usuario";
  return "No registra";
}

const formatoFecha = new Intl.DateTimeFormat("es-CO", {
  day: "2-digit",
  month: "long",
  year: "numeric",
  timeZone: "America/Bogota",
});

const formatoFechaUtc = new Intl.DateTimeFormat("es-CO", {
  day: "2-digit",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

const formatoFechaHora = new Intl.DateTimeFormat("es-CO", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Bogota",
});

export function formatearFecha(iso: string): string {
  // Las fechas de nacimiento (tipo DATE en SQL) se almacenan o leen a medianoche UTC (T00:00:00).
  // Si se formatean con la zona horaria America/Bogota (UTC-5), se restan 5 horas y caen al día anterior.
  // Al formatear en UTC las fechas de solo calendario, evitamos el desfase de 1 día.
  if (iso.includes("T00:00:00") || /^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    return formatoFechaUtc.format(new Date(iso));
  }
  return formatoFecha.format(new Date(iso));
}

const formatoFechaCorta = new Intl.DateTimeFormat("es-CO", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "America/Bogota",
});

export function formatearFechaCorta(iso: string): string {
  return formatoFechaCorta.format(new Date(iso)).replace(/\./g, "").toUpperCase();
}

export function formatearFechaHora(iso: string): string {
  return formatoFechaHora.format(new Date(iso));
}

const formatoMoneda = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

export function formatearMoneda(valor: number | null | undefined): string {
  if (valor == null || isNaN(valor)) return "$ 0";
  return formatoMoneda.format(valor).replace(/\u00A0/g, " ");
}
