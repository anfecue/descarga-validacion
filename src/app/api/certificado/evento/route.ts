import { NextResponse } from "next/server";
import { ipDeRequest, permitirConsulta } from "@/lib/rate-limit";
import { normalizarCedula, registrarDescarga, registrarImpresion } from "@/lib/validacion";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!permitirConsulta(ipDeRequest(request))) {
    return NextResponse.json(
      { error: "Demasiadas solicitudes" },
      { status: 429 },
    );
  }

  try {
    const body = await request.json();
    const cedula = normalizarCedula(String(body?.cedula ?? ""));
    const tipo = String(body?.tipo ?? "");

    if (cedula.length < 4 || cedula.length > 30) {
      return NextResponse.json({ error: "Cédula inválida" }, { status: 400 });
    }

    if (tipo === "impresion") {
      await registrarImpresion(cedula);
    } else if (tipo === "descarga") {
      await registrarDescarga(cedula);
    } else {
      return NextResponse.json({ error: "Tipo de evento inválido" }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error al registrar evento de auditoría:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
