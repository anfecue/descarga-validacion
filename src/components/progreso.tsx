"use client";

import { useEffect, useState } from "react";
import {
  IconoCheck,
  IconoGirando,
  IconoReloj,
} from "@/components/iconos";

const PASOS = [
  "Revisando datos",
  "Verificando en el sistema",
  "Generando documento",
] as const;

export const DURACION_PROGRESO_MS = 3000;

export function ProgresoConsulta({ cedula }: { cedula: string }) {
  const [progreso, setProgreso] = useState(0);

  useEffect(() => {
    let frame = 0;
    const inicio = performance.now();

    const avanzar = (ahora: number) => {
      const avance = Math.min(1, (ahora - inicio) / DURACION_PROGRESO_MS);
      setProgreso(Math.round(avance * 100));

      if (avance < 1) frame = requestAnimationFrame(avanzar);
    };

    frame = requestAnimationFrame(avanzar);

    return () => cancelAnimationFrame(frame);
  }, []);

  const activo = progreso >= 100 ? 3 : progreso < 34 ? 0 : progreso < 68 ? 1 : 2;

  return (
    <div
      aria-busy="true"
      className="animar-surgir mx-auto max-w-lg overflow-hidden rounded-2xl border border-line bg-white shadow-[0_26px_60px_-28px_rgba(16,32,88,0.5)]"
    >
      <div className="p-6 sm:p-7">
        <div className="flex items-start gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
            <IconoGirando className="h-5 w-5" />
          </span>

          <div className="min-w-0 flex-1">
            <p className="text-[9px] font-semibold uppercase tracking-[0.24em] text-brand">
              Consulta en curso
            </p>
            <h2 className="mt-1 text-lg font-bold leading-tight tracking-tight text-ink">
              {progreso >= 100 ? "Preparando el resultado" : "Revisando tu registro"}
            </h2>
            <p className="mt-1 text-[12px] text-ink-soft">
              Documento{" "}
              <span className="font-semibold tabular-nums text-ink">
                {cedula}
              </span>
            </p>
          </div>

          <span className="shrink-0 text-sm font-bold tabular-nums text-brand">
            {progreso}%
          </span>
        </div>

        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progreso}
          aria-label="Progreso de la consulta"
          className="mt-5 h-2 w-full overflow-hidden rounded-full bg-paper"
        >
          <div
            className="boton-marca h-full rounded-full"
            style={{ width: `${progreso}%` }}
          />
        </div>

        <ul className="mt-5 space-y-2.5">
          {PASOS.map((paso, indice) => {
            const hecho = indice < activo;
            const enCurso = indice === activo;

            return (
              <li key={paso} className="flex items-center gap-2.5 text-[12px]">
                <span
                  className={
                    hecho
                      ? "flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-soft text-emerald-deep"
                      : enCurso
                        ? "flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand"
                        : "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-line text-ink/20"
                  }
                >
                  {hecho ? (
                    <IconoCheck className="h-3 w-3" strokeWidth={3} />
                  ) : enCurso ? (
                    <IconoGirando className="h-3 w-3" />
                  ) : (
                    <span className="h-1 w-1 rounded-full bg-ink/25" />
                  )}
                </span>

                <span
                  className={
                    hecho
                      ? "text-ink/45"
                      : enCurso
                        ? "font-semibold text-ink"
                        : "text-ink/35"
                  }
                >
                  {paso}
                </span>

                {hecho ? (
                  <span className="ml-auto text-[9px] font-semibold uppercase tracking-[0.16em] text-emerald-deep">
                    Listo
                  </span>
                ) : enCurso ? (
                  <span className="ml-auto text-[9px] font-semibold uppercase tracking-[0.16em] text-brand">
                    En proceso
                  </span>
                ) : null}
              </li>
            );
          })}
        </ul>

        <p className="mt-5 flex items-center gap-1.5 border-t border-line pt-4 text-[10px] text-ink/40">
          <IconoReloj className="h-3.5 w-3.5" />
          Esto toma unos segundos. No cierres esta ventana.
        </p>
      </div>
    </div>
  );
}
