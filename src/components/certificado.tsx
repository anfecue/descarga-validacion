"use client";

import { useMemo, useState } from "react";
import type { RegistroPublico } from "@/lib/tipos";
import {
  formatearCelular,
  formatearFecha,
  formatearFechaCorta,
  formatearMoneda,
  formatearTelegram,
} from "@/lib/formato";
import {
  IconoCheck,
  IconoCompartir,
  IconoDescarga,
  IconoEscudo,
  IconoGirando,
  IconoImpresora,
  IconoRecargar,
  IconoUsuario,
} from "@/components/iconos";
import { SelloValidacion } from "@/components/sello";

type Props = {
  registro: RegistroPublico;
  descargando: boolean;
  compartiendo: boolean;
  onDescargar: () => void;
  onCompartir: () => void;
  onImprimir: () => void;
  onNuevaConsulta: () => void;
};

type AccionSello = "descarga" | "impresion";

function Dato({
  etiqueta,
  valor,
  destacado = false,
  className = "",
}: {
  etiqueta: string;
  valor: string;
  destacado?: boolean;
  className?: string;
}) {
  return (
    <div className={className}>
      <dt className="text-[9px] font-semibold uppercase tracking-[0.22em] text-ink/40">
        {etiqueta}
      </dt>
      <dd
        className={
          destacado
            ? "mt-1 text-[17px] font-semibold leading-snug tracking-tight text-ink sm:text-lg"
            : "mt-1 text-[13px] font-medium text-ink"
        }
      >
        {valor}
      </dd>
    </div>
  );
}

export function Certificado({
  registro,
  descargando,
  compartiendo,
  onDescargar,
  onCompartir,
  onImprimir,
  onNuevaConsulta,
}: Props) {
  const [sello, setSello] = useState<AccionSello | null>(null);

  const emitidoEl = useMemo(
    () => formatearFecha(new Date().toISOString()),
    [],
  );

  const emitidoIso = useMemo(() => new Date().toISOString(), []);
  const ocupado = sello !== null;

  function conSello(accion: AccionSello, ejecutar: () => void) {
    if (ocupado) return;

    setSello(accion);

    window.setTimeout(() => {
      ejecutar();
      window.setTimeout(() => setSello(null), 280);
    }, 620);
  }

  return (
    <>
      <article
        id="certificado"
        className="animar-surgir mx-auto max-w-3xl overflow-hidden rounded-[22px] border border-ink/10 bg-white shadow-[0_40px_90px_-50px_rgba(42,23,64,0.45)]"
      >
        <div className="fondo-certificado relative overflow-hidden px-6 pb-8 pt-7 text-white sm:px-9">
          <div
            aria-hidden="true"
            className="absolute -right-24 -top-32 h-72 w-72 rounded-full border border-white/10"
          />
          <div
            aria-hidden="true"
            className="absolute -right-8 -top-14 h-52 w-52 rounded-full bg-brand/35 blur-3xl"
          />

          <div className="relative flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15">
                <IconoEscudo className="h-5 w-5" />
              </span>
              <div>
                <p className="text-[8px] font-semibold uppercase leading-tight tracking-[0.14em] text-white/45 sm:text-[9px] sm:tracking-[0.26em]">
                  Certificado de validación
                </p>
                <p className="mt-1 hidden text-[13px] font-medium text-white/85 sm:block">
                  Documento oficial de registro
                </p>
              </div>
            </div>

            <div className="shrink-0 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-right sm:px-3.5">
              <p className="text-[8px] font-semibold uppercase tracking-[0.2em] text-white/45 sm:text-[9px]">
                N° Membresía / Registro
              </p>
              <p className="text-lg font-bold leading-tight tabular-nums sm:text-2xl">
                #{registro.id}
              </p>
            </div>
          </div>

          <div className="relative mt-9 flex items-center gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-emerald text-white shadow-[0_0_0_7px_rgba(14,159,110,0.18)]">
              <IconoCheck className="h-7 w-7" />
            </span>
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.26em] text-white/50">
                Estado del registro
              </p>
              <h2 className="mt-1.5 text-[30px] font-bold leading-none tracking-tight sm:text-[38px]">
                Usted está verificado
              </h2>
              <p className="mt-2 text-[11px] text-white/55">
                Documento e imágenes validados correctamente
              </p>
            </div>
          </div>
        </div>

        {/* Fila 1: Documento, Imágenes subidas y Fecha de registro */}
        <div className="grid grid-cols-1 gap-px border-b border-line bg-line sm:grid-cols-3">
          <div className="bg-paper px-6 py-4 sm:px-5">
            <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-ink/40">
              Documento
            </p>
            <p className="mt-1 text-sm font-bold tabular-nums text-ink">
              {registro.cedula}
            </p>
          </div>
          <div className="bg-paper px-6 py-4 sm:px-5">
            <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-ink/40">
              Imágenes subidas
            </p>
            <p className="mt-1 text-sm font-bold tabular-nums text-ink">
              {registro.imagenes}
            </p>
          </div>
          <div className="bg-paper px-6 py-4 sm:px-5">
            <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-ink/40">
              Fecha de registro
            </p>
            <p className="mt-1 text-[13px] font-semibold leading-snug text-ink">
              {formatearFechaCorta(registro.fechaRegistro)}
            </p>
          </div>
        </div>

        {/* Fila 2: Membresías y Total cancelado */}
        <div className="grid grid-cols-1 gap-px border-b border-line bg-line sm:grid-cols-2">
          <div className="bg-paper px-6 py-4.5 sm:px-8">
            <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-ink/40">
              Membresías
            </p>
            <p className="mt-1 text-3xl font-black tabular-nums text-ink sm:text-4xl">
              {registro.cantidadMembresias}
            </p>
          </div>
          <div className="bg-paper px-6 py-4.5 sm:px-8">
            <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-ink/40">
              Total cancelado
            </p>
            <p className="mt-1 text-2xl font-black tabular-nums text-emerald-deep sm:text-3xl">
              {formatearMoneda(registro.valorTotal)}
            </p>
          </div>
        </div>

        <div className="px-6 py-7 sm:px-9 sm:py-8">
          <h3 className="text-[9px] font-semibold uppercase tracking-[0.26em] text-ink/40">
            Datos del registro
          </h3>

          <dl className="mt-5 grid gap-x-10 gap-y-5 sm:grid-cols-2">
            <Dato
              etiqueta="Nombre completo"
              valor={registro.nombreCompleto}
              destacado
              className="sm:col-span-2"
            />
            <Dato
              etiqueta="Documento de identidad"
              valor={registro.cedula}
            />
            <Dato
              etiqueta="Fecha de nacimiento"
              valor={formatearFecha(registro.fechaNacimiento)}
            />
            <Dato
              etiqueta="Teléfono"
              valor={formatearCelular(registro.indicativoPais, registro.celular)}
            />
            <Dato
              etiqueta="Telegram"
              valor={formatearTelegram(
                registro.usaTelegram,
                registro.usuarioTelegram,
              )}
            />
            <Dato
              etiqueta="Ubicación"
              valor={`${registro.ciudad}, ${registro.departamento} · ${registro.pais}`}
            />
            <Dato
              etiqueta="HASS registrado"
              valor={registro.numeroConsignacion || "No registra"}
            />
          </dl>

          <div className="mt-6 flex items-start gap-3 rounded-xl border border-amber/30 bg-amber-soft/80 p-4">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber text-white shadow-sm">
              <IconoEscudo className="h-4.5 w-4.5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber">
                Anexo de soportes
              </p>
              <p className="mt-0.5 text-[13px] font-medium leading-relaxed text-ink">
                Deben anexar los respectivos soportes a este certificado (comprobante de consignación / pago y documentos de identidad).
              </p>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-3 rounded-xl border border-brand/15 bg-brand-soft/45 px-4 py-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-brand ring-1 ring-brand/15">
              <IconoUsuario className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-[8px] font-semibold uppercase tracking-[0.24em] text-brand/75">
                Líder
              </p>
              <p className="mt-0.5 truncate text-[13px] font-semibold text-ink">
                {registro.lider}
              </p>
            </div>
            <span className="ml-auto hidden shrink-0 rounded-full bg-white px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-brand/70 ring-1 ring-brand/10 sm:inline">
              A cargo
            </span>
          </div>

          <div className="mt-6 flex items-center justify-between gap-5 border-t border-line pt-4">
            <p className="max-w-[21rem] text-[10px] leading-relaxed text-ink/40">
              Consulta realizada el {emitidoEl}. Este certificado no modifica
              tu registro.
            </p>
            <SelloValidacion
              id={registro.id}
              fecha={emitidoIso}
              className="-mb-1 h-[84px] w-[84px] shrink-0 -rotate-6 text-brand/80 sm:h-[92px] sm:w-[92px]"
            />
          </div>
        </div>

        <div className="print-hide flex flex-col-reverse gap-2.5 border-t border-line bg-paper/50 px-6 py-5 sm:flex-row sm:items-center sm:px-9">
          <button
            type="button"
            onClick={onNuevaConsulta}
            disabled={descargando || ocupado}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold text-ink/60 transition hover:bg-brand-soft/60 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30 disabled:cursor-wait disabled:opacity-50 sm:mr-auto"
          >
            <IconoRecargar className="h-[18px] w-[18px]" />
            Nueva consulta
          </button>
          <button
            type="button"
            onClick={() => conSello("impresion", onImprimir)}
            disabled={ocupado}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-line bg-white px-5 text-sm font-semibold text-ink transition hover:border-brand/40 hover:bg-brand-soft/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30 disabled:cursor-wait disabled:opacity-60"
          >
            <IconoImpresora className="h-[18px] w-[18px]" />
            Imprimir
          </button>
          <button
            type="button"
            onClick={onCompartir}
            disabled={compartiendo || ocupado}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-brand/25 bg-brand-soft/50 px-5 text-sm font-semibold text-brand transition hover:border-brand/45 hover:bg-brand-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30 disabled:cursor-wait disabled:opacity-60"
          >
            {compartiendo ? (
              <IconoGirando className="h-[18px] w-[18px]" />
            ) : (
              <IconoCompartir className="h-[18px] w-[18px]" />
            )}
            {compartiendo ? "Preparando..." : "Compartir"}
          </button>
          <button
            type="button"
            onClick={() => conSello("descarga", onDescargar)}
            disabled={descargando || ocupado}
            className="boton-marca inline-flex h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold text-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 disabled:cursor-wait disabled:opacity-60"
          >
            {descargando ? (
              <IconoGirando className="h-[18px] w-[18px]" />
            ) : (
              <IconoDescarga className="h-[18px] w-[18px]" />
            )}
            {descargando ? "Generando PDF..." : "Descargar PDF"}
          </button>
        </div>
      </article>

      {sello ? (
        <div
          role="status"
          aria-live="polite"
          className="animar-aparecer print-hide fixed inset-0 z-50 flex flex-col items-center justify-center gap-7 bg-[#120a22]/75 px-6 backdrop-blur-md"
        >
          <div className="relative flex items-center justify-center">
            <span
              aria-hidden="true"
              className="absolute h-80 w-80 rounded-full bg-white/10 blur-2xl"
            />
            <span
              aria-hidden="true"
              className="animar-onda absolute h-64 w-64 rounded-full border-2 border-white/70"
            />
            <div className="animar-sello flex h-64 w-64 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/20">
              <SelloValidacion
                id={registro.id}
                fecha={emitidoIso}
                className="h-60 w-60 text-white"
              />
            </div>
          </div>
          <div className="text-center">
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/55">
              Sello de validación
            </p>
            <p className="mt-2 text-sm font-medium text-white">
              {sello === "descarga"
                ? "Certificado verificado · generando tu PDF"
                : "Certificado verificado · preparando la impresión"}
            </p>
          </div>
        </div>
      ) : null}
    </>
  );
}
