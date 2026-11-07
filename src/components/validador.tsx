"use client";

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import type {
  EstadoConsulta,
  RegistroPublico,
  RespuestaConsulta,
} from "@/lib/tipos";
import { Certificado } from "@/components/certificado";
import { DURACION_PROGRESO_MS, ProgresoConsulta } from "@/components/progreso";
import {
  IconoAlerta,
  IconoBuscar,
  IconoCandado,
  IconoDestellos,
  IconoDocumento,
  IconoFlecha,
  IconoGirando,
  IconoReloj,
} from "@/components/iconos";

type Vista = "inicial" | "cargando" | EstadoConsulta | "invalido" | "error";

type RespuestaApi = Omit<RespuestaConsulta, "estado"> & {
  estado: EstadoConsulta | "invalido" | "error";
};

const TONOS = {
  amber: {
    borde: "border-amber/25",
    barra: "bg-amber",
    icono: "bg-amber-soft text-amber",
    etiqueta: "text-amber",
  },
  rust: {
    borde: "border-rust/25",
    barra: "bg-rust",
    icono: "bg-rust-soft text-rust",
    etiqueta: "text-rust",
  },
  neutral: {
    borde: "border-line",
    barra: "bg-ink/20",
    icono: "bg-paper text-ink/50",
    etiqueta: "text-ink/45",
  },
} as const;

function TarjetaEstado({
  tono,
  etiqueta,
  titulo,
  icono,
  children,
}: {
  tono: keyof typeof TONOS;
  etiqueta: string;
  titulo: string;
  icono: ReactNode;
  children: ReactNode;
}) {
  const t = TONOS[tono];

  return (
    <div
      className={`animar-surgir mx-auto max-w-xl overflow-hidden rounded-2xl border bg-white shadow-[0_24px_60px_-45px_rgba(42,23,64,0.35)] ${t.borde}`}
    >
      <div className={`h-1 w-full ${t.barra}`} />
      <div className="p-6 sm:p-7">
        <div className="flex gap-4">
          <span
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${t.icono}`}
          >
            {icono}
          </span>
          <div className="min-w-0">
            <p
              className={`text-[9px] font-semibold uppercase tracking-[0.24em] ${t.etiqueta}`}
            >
              {etiqueta}
            </p>
            <h2 className="mt-1 text-2xl font-bold leading-tight tracking-tight text-ink">
              {titulo}
            </h2>
            <div className="mt-2 text-sm leading-relaxed text-ink-soft">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Validador() {
  const [cedula, setCedula] = useState("");
  const [consultada, setConsultada] = useState("");
  const [vista, setVista] = useState<Vista>("inicial");
  const [registro, setRegistro] = useState<RegistroPublico | null>(null);
  const [mensaje, setMensaje] = useState("");
  const [descargando, setDescargando] = useState(false);
  const [compartiendo, setCompartiendo] = useState(false);
  const [avisoDescarga, setAvisoDescarga] = useState("");
  const pdfEnCache = useRef<Blob | null>(null);

  const cargando = vista === "cargando";

  // Preparamos el PDF en segundo plano para que "Compartir" pueda abrir la
  // hoja nativa dentro del gesto del usuario (Safari lo exige).
  useEffect(() => {
    pdfEnCache.current = null;
    if (!registro) return;

    const controlador = new AbortController();
    let vigente = true;

    fetch(
      `/api/certificado/pdf?cedula=${encodeURIComponent(registro.cedula)}`,
      { signal: controlador.signal },
    )
      .then((respuesta) => (respuesta.ok ? respuesta.blob() : null))
      .then((blob) => {
        if (vigente && blob) pdfEnCache.current = blob;
      })
      .catch(() => undefined);

    return () => {
      vigente = false;
      controlador.abort();
    };
  }, [registro]);

  async function consultar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    const limpia = cedula.trim();

    if (limpia.length < 4 || limpia.length > 30) {
      setVista("invalido");
      setRegistro(null);
      setMensaje("Ingresa un número de documento válido.");
      return;
    }

    setConsultada(limpia);
    setVista("cargando");
    setRegistro(null);
    setMensaje("");
    setAvisoDescarga("");

    const inicio = Date.now();
    let data: RespuestaApi;

    try {
      const respuesta = await fetch("/api/verificar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cedula: limpia }),
      });

      data = (await respuesta.json()) as RespuestaApi;
    } catch {
      data = {
        estado: "error",
        mensaje:
          "No pudimos conectar con el servicio de validación. Revisa tu conexión e intenta de nuevo.",
      };
    }

    // La barra de progreso dura unos 3 segundos; esperamos lo que falte.
    const restante = Math.max(0, DURACION_PROGRESO_MS - (Date.now() - inicio));
    if (restante > 0) {
      await new Promise((resolver) => setTimeout(resolver, restante));
    }

    if (data.estado === "verificado" && data.registro) {
      setRegistro(data.registro);
      setVista("verificado");
      return;
    }

    setVista(data.estado);
    setMensaje(data.mensaje ?? "");
  }

  function guardarPdf(blob: Blob, nombre: string) {
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement("a");
    enlace.href = url;
    enlace.download = nombre;
    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1500);
  }

  async function obtenerPdf(): Promise<Blob> {
    if (pdfEnCache.current) return pdfEnCache.current;
    if (!registro) throw new Error("sin-registro");

    const respuesta = await fetch(
      `/api/certificado/pdf?cedula=${encodeURIComponent(registro.cedula)}`,
    );

    if (!respuesta.ok) throw new Error("pdf");

    const blob = await respuesta.blob();
    pdfEnCache.current = blob;
    return blob;
  }

  async function descargar() {
    if (!registro || descargando) return;

    setDescargando(true);
    setAvisoDescarga("");

    try {
      const blob = await obtenerPdf();
      guardarPdf(blob, `validacion-${registro.cedula}.pdf`);
    } catch {
      setAvisoDescarga(
        "No pudimos generar el PDF. Intenta de nuevo en unos segundos.",
      );
    } finally {
      setDescargando(false);
    }
  }

  async function compartir() {
    if (!registro || compartiendo) return;

    setCompartiendo(true);
    setAvisoDescarga("");

    const nombre = `validacion-${registro.cedula}.pdf`;

    try {
      const blob = await obtenerPdf();
      const archivo = new File([blob], nombre, { type: "application/pdf" });

      const contenido: ShareData = {
        files: [archivo],
        title: "Certificado de validación",
        text: `Certificado de validación del documento ${registro.cedula}.`,
      };

      if (
        typeof navigator.share === "function" &&
        navigator.canShare?.(contenido)
      ) {
        await navigator.share(contenido);
        return;
      }

      guardarPdf(blob, nombre);
      setAvisoDescarga(
        "Este navegador no permite compartir archivos. Descargamos el PDF para que puedas enviarlo.",
      );
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      setAvisoDescarga(
        "No pudimos compartir el PDF. Descárgalo e intenta enviarlo manualmente.",
      );
    } finally {
      setCompartiendo(false);
    }
  }

  function reiniciar() {
    setCedula("");
    setConsultada("");
    setRegistro(null);
    setMensaje("");
    setAvisoDescarga("");
    setVista("inicial");

    window.scrollTo({ top: 0, behavior: "smooth" });
    window.setTimeout(() => {
      document.getElementById("cedula")?.focus({ preventScroll: true });
    }, 320);
  }

  function imprimir() {
    if (registro) {
      fetch("/api/certificado/evento", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cedula: registro.cedula, tipo: "impresion" }),
        keepalive: true,
      }).catch((err) => {
        console.error("Error al registrar impresión:", err);
      });
    }

    if (document.fonts?.ready) {
      document.fonts.ready.then(() => window.print());
      return;
    }

    window.print();
  }

  return (
    <div>
      <form
        onSubmit={consultar}
        noValidate
        className="print-hide mx-auto mt-8 max-w-lg"
      >
        <div className="rounded-2xl border border-line bg-white p-2 shadow-[0_26px_60px_-24px_rgba(16,32,88,0.55)] transition focus-within:border-brand/40 focus-within:shadow-[0_26px_70px_-22px_rgba(16,32,88,0.65)]">
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <IconoDocumento className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-ink/30" />
              <label htmlFor="cedula" className="sr-only">
                Número de documento
              </label>
              <input
                id="cedula"
                name="cedula"
                type="text"
                autoComplete="off"
                maxLength={30}
                placeholder="Ej. 49774099 o pasaporte / DNI"
                value={cedula}
                onChange={(evento) => {
                  setCedula(evento.target.value);
                  if (vista === "invalido") {
                    setVista("inicial");
                    setMensaje("");
                  }
                }}
                disabled={cargando}
                aria-invalid={vista === "invalido"}
                aria-describedby={vista === "invalido" ? "error-cedula" : undefined}
                className="h-12 w-full rounded-xl border-0 bg-transparent pl-11 pr-4 text-[15px] font-medium tracking-wide text-ink outline-none placeholder:font-normal placeholder:tracking-normal placeholder:text-ink/30 disabled:opacity-60"
              />
            </div>

            <button
              type="submit"
              disabled={cargando}
              className="boton-marca inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold text-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 disabled:cursor-wait disabled:opacity-70"
            >
              {cargando ? (
                <>
                  <IconoGirando className="h-4 w-4" />
                  Consultando...
                </>
              ) : (
                <>
                  Consultar validación
                  <IconoFlecha className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </div>

        {vista === "invalido" && mensaje ? (
          <p
            id="error-cedula"
            className="mx-auto mt-2 flex w-fit items-center justify-center gap-1.5 rounded-full bg-white px-3 py-1 text-[11px] font-medium text-rust shadow-sm"
          >
            <IconoAlerta className="h-3.5 w-3.5" />
            {mensaje}
          </p>
        ) : (
          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[10px] font-medium text-white/75">
            <span className="inline-flex items-center gap-1.5">
              <IconoCandado className="h-3.5 w-3.5" />
              Consulta segura
            </span>
            <span aria-hidden="true" className="hidden h-1 w-1 rounded-full bg-white/40 sm:block" />
            <span className="inline-flex items-center gap-1.5">
              <IconoDocumento className="h-3.5 w-3.5" />
              Datos del registro oficial
            </span>
            <span aria-hidden="true" className="hidden h-1 w-1 rounded-full bg-white/40 sm:block" />
            <span className="inline-flex items-center gap-1.5">
              <IconoDestellos className="h-3.5 w-3.5" />
              Resultado inmediato
            </span>
          </div>
        )}
      </form>

      <div id="resultado" aria-live="polite" className="mt-10">
        {vista === "cargando" ? <ProgresoConsulta cedula={consultada} /> : null}

        {vista === "verificado" && registro ? (
          <div className="animar-aparecer">
            <Certificado
              registro={registro}
              descargando={descargando}
              compartiendo={compartiendo}
              onDescargar={descargar}
              onCompartir={compartir}
              onImprimir={imprimir}
              onNuevaConsulta={reiniciar}
            />

            {avisoDescarga ? (
              <p className="print-hide mt-3 text-center text-[11px] font-medium text-rust">
                {avisoDescarga}
              </p>
            ) : null}
          </div>
        ) : null}

        {vista === "sin_creditos" ? (
          <TarjetaEstado
            tono="amber"
            etiqueta="Créditos de IA"
            titulo="Créditos agotados"
            icono={<IconoDestellos className="h-5 w-5" />}
          >
            <p>
              Por favor, añade más créditos a la IA para continuar con esta
              validación.
            </p>
            <div className="mt-4 flex items-center justify-between rounded-xl border border-dashed border-amber/30 bg-amber-soft/70 px-4 py-3">
              <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-amber/80">
                Saldo disponible
              </span>
              <span className="text-sm font-bold tabular-nums text-amber">
                0 consultas
              </span>
            </div>
          </TarjetaEstado>
        ) : null}

        {vista === "no_verificado" ? (
          <TarjetaEstado
            tono="amber"
            etiqueta="Validación pendiente"
            titulo="Registro en proceso"
            icono={<IconoReloj className="h-5 w-5" />}
          >
            <p>
              El documento{" "}
              <span className="font-semibold tabular-nums text-ink">
                {consultada}
              </span>{" "}
              está registrado, pero la validación todavía no ha sido aprobada.
              Vuelve a consultar más tarde.
            </p>
            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-paper px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-ink/50">
              <IconoReloj className="h-3.5 w-3.5" />
              Estado: en revisión
            </div>
          </TarjetaEstado>
        ) : null}

        {vista === "no_encontrado" ? (
          <TarjetaEstado
            tono="neutral"
            etiqueta="Sin resultados"
            titulo="No encontramos una validación"
            icono={<IconoBuscar className="h-5 w-5" />}
          >
            <p>
              No hay un registro de validación asociado al documento{" "}
              <span className="font-semibold tabular-nums text-ink">
                {consultada}
              </span>
              . Verifica el número e intenta de nuevo.
            </p>
          </TarjetaEstado>
        ) : null}

        {vista === "limite" ? (
          <TarjetaEstado
            tono="neutral"
            etiqueta="Control de consultas"
            titulo="Demasiadas consultas"
            icono={<IconoReloj className="h-5 w-5" />}
          >
            <p>
              {mensaje ||
                "Espera un minuto antes de volver a consultar este documento."}
            </p>
          </TarjetaEstado>
        ) : null}

        {vista === "error" ? (
          <TarjetaEstado
            tono="rust"
            etiqueta="Error de conexión"
            titulo="No pudimos completar la consulta"
            icono={<IconoAlerta className="h-5 w-5" />}
          >
            <p>{mensaje}</p>
          </TarjetaEstado>
        ) : null}
      </div>
    </div>
  );
}
