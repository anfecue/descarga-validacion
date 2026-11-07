import { prisma } from "@/lib/prisma";
import type { RegistroPublico, RespuestaConsulta } from "@/lib/tipos";

export function normalizarCedula(valor: string): string {
  return (valor ?? "").trim();
}

function cedulasHabilitadas(): string[] | null {
  const crudo = process.env.ALLOWED_CEDULAS?.trim();
  if (!crudo) return null;

  const lista = crudo
    .split(",")
    .map(normalizarCedula)
    .filter((cedula) => cedula.length > 0);

  return lista.length > 0 ? lista : null;
}

export function estaHabilitada(cedula: string): boolean {
  const lista = cedulasHabilitadas();
  if (lista === null) return true;
  const normalizada = cedula.toLowerCase();
  return lista.some((permitida) => permitida.toLowerCase() === normalizada);
}

export async function resolverConsulta(cedula: string): Promise<RespuestaConsulta> {
  if (!estaHabilitada(cedula)) {
    return { estado: "sin_creditos" };
  }

  let registro = await prisma.registro.findFirst({
    where: {
      cedula: {
        equals: cedula,
        mode: "insensitive",
      },
    },
    select: {
      id: true,
      nombreCompleto: true,
      cedula: true,
      fechaNacimiento: true,
      indicativoPais: true,
      celular: true,
      usaTelegram: true,
      usuarioTelegram: true,
      pais: true,
      departamento: true,
      ciudad: true,
      verificado: true,
      cantidadMembresias: true,
      numeroConsignacion: true,
      lider: true,
      createdAt: true,
      _count: {
        select: { imagenes: true },
      },
    },
  });

  // Si no se encuentra y la cédula tenía puntos o espacios (ej. formato 49.774.099), probamos sin ellos
  if (!registro && /[\s.]/.test(cedula)) {
    const sinPuntos = cedula.replace(/[\s.]/g, "");
    if (sinPuntos.length >= 4) {
      registro = await prisma.registro.findFirst({
        where: {
          cedula: {
            equals: sinPuntos,
            mode: "insensitive",
          },
        },
        select: {
          id: true,
          nombreCompleto: true,
          cedula: true,
          fechaNacimiento: true,
          indicativoPais: true,
          celular: true,
          usaTelegram: true,
          usuarioTelegram: true,
          pais: true,
          departamento: true,
          ciudad: true,
          verificado: true,
          cantidadMembresias: true,
          numeroConsignacion: true,
          lider: true,
          createdAt: true,
          _count: {
            select: { imagenes: true },
          },
        },
      });
    }
  }

  if (!registro) {
    return { estado: "no_encontrado" };
  }

  if (!registro.verificado) {
    return { estado: "no_verificado" };
  }

  return {
    estado: "verificado",
    registro: {
      id: registro.id,
      nombreCompleto: registro.nombreCompleto,
      cedula: registro.cedula,
      fechaNacimiento: registro.fechaNacimiento.toISOString(),
      indicativoPais: registro.indicativoPais,
      celular: registro.celular,
      usaTelegram: registro.usaTelegram,
      usuarioTelegram: registro.usuarioTelegram,
      pais: registro.pais,
      departamento: registro.departamento,
      ciudad: registro.ciudad,
      fechaRegistro: registro.createdAt.toISOString(),
      imagenes: registro._count.imagenes,
      cantidadMembresias: registro.cantidadMembresias,
      valorTotal: (registro as { valorTotal?: number }).valorTotal ?? (registro.cantidadMembresias * 10000),
      numeroConsignacion: registro.numeroConsignacion,
      lider: registro.lider,
    },
  };
}

export async function registrarDescarga(cedula: string): Promise<void> {
  try {
    const reg = await prisma.registro.findFirst({
      where: { cedula: { equals: cedula, mode: "insensitive" } },
      select: { id: true },
    });
    if (reg) {
      await prisma.registro.update({
        where: { id: reg.id },
        data: {
          vecesGenerado: { increment: 1 },
          descargas: { increment: 1 },
        },
      });
    }
  } catch (error) {
    console.error("Error al registrar auditoría de descarga:", error);
  }
}

export async function registrarImpresion(cedula: string): Promise<void> {
  try {
    const reg = await prisma.registro.findFirst({
      where: { cedula: { equals: cedula, mode: "insensitive" } },
      select: { id: true },
    });
    if (reg) {
      await prisma.registro.update({
        where: { id: reg.id },
        data: {
          vecesGenerado: { increment: 1 },
          impresiones: { increment: 1 },
        },
      });
    }
  } catch (error) {
    console.error("Error al registrar auditoría de impresión:", error);
  }
}

