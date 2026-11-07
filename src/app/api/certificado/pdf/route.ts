import { NextResponse } from "next/server";
import { generarCertificadoPdf } from "@/lib/pdf";
import { ipDeRequest, permitirConsulta } from "@/lib/rate-limit";
import { normalizarCedula, registrarDescarga, resolverConsulta } from "@/lib/validacion";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!permitirConsulta(ipDeRequest(request))) {
    return NextResponse.json(
      { estado: "limite", mensaje: "Demasiadas solicitudes. Intenta de nuevo en un minuto." },
      { status: 429 },
    );
  }

  const { searchParams } = new URL(request.url);
  const cedula = normalizarCedula(searchParams.get("cedula") ?? "");

  if (cedula.length < 4 || cedula.length > 30) {
    return NextResponse.json({ estado: "invalido" }, { status: 400 });
  }

  try {
    const resultado = await resolverConsulta(cedula);

    if (resultado.estado !== "verificado" || !resultado.registro) {
      const status = resultado.estado === "sin_creditos" ? 402 : 404;
      return NextResponse.json({ estado: resultado.estado }, { status });
    }

    const pdf = await generarCertificadoPdf(resultado.registro);

    // Auditoría de descarga y generación
    await registrarDescarga(cedula);

    return new Response(Buffer.from(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="validacion-${cedula}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Error al generar el certificado:", error);

    return NextResponse.json(
      { estado: "error", mensaje: "No pudimos generar el certificado." },
      { status: 500 },
    );
  }
}
