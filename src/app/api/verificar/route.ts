import { NextResponse } from "next/server";
import { normalizarCedula, resolverConsulta } from "@/lib/validacion";
import { ipDeRequest, permitirConsulta } from "@/lib/rate-limit";
import type { RespuestaConsulta } from "@/lib/tipos";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ESTADOS: Record<RespuestaConsulta["estado"], number> = {
  verificado: 200,
  no_verificado: 200,
  no_encontrado: 404,
  sin_creditos: 402,
  limite: 429,
};

export async function POST(request: Request) {
  if (!permitirConsulta(ipDeRequest(request))) {
    return NextResponse.json<RespuestaConsulta>(
      { estado: "limite", mensaje: "Demasiadas consultas. Intenta de nuevo en un minuto." },
      { status: ESTADOS.limite },
    );
  }

  let cuerpo: { cedula?: unknown };
  try {
    cuerpo = await request.json();
  } catch {
    return NextResponse.json(
      { estado: "invalido", mensaje: "Solicitud inválida." },
      { status: 400 },
    );
  }

  const cedula = normalizarCedula(String(cuerpo?.cedula ?? ""));

  if (cedula.length < 4 || cedula.length > 30) {
    return NextResponse.json(
      { estado: "invalido", mensaje: "Ingresa un número de documento válido." },
      { status: 400 },
    );
  }

  try {
    const resultado = await resolverConsulta(cedula);

    return NextResponse.json<RespuestaConsulta>(resultado, {
      status: ESTADOS[resultado.estado],
    });
  } catch (error) {
    console.error("Error al consultar el registro:", error);

    return NextResponse.json(
      { estado: "error", mensaje: "No pudimos completar la consulta. Intenta de nuevo." },
      { status: 500 },
    );
  }
}
