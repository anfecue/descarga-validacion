import { Validador } from "@/components/validador";
import { IconoDestellos, IconoEscudo } from "@/components/iconos";

export default function Home() {
  return (
    <div className="relative flex min-h-dvh flex-col">
      <div
        aria-hidden="true"
        className="fondo-formulario print-hide pointer-events-none fixed inset-0 -z-10"
      />

      <header className="print-hide relative mx-auto flex w-full max-w-5xl items-center justify-between px-5 py-6 sm:px-8">
        <div className="flex items-start gap-3 sm:items-center">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/25 bg-white/15 text-white shadow-sm backdrop-blur">
            <IconoEscudo className="h-5 w-5" />
          </span>
          <div>
            <p className="text-[13px] font-medium leading-tight tracking-tight text-white">
              Validación de identidad
            </p>
            <p className="mt-0.5 max-w-[13rem] text-[8px] font-medium uppercase leading-relaxed tracking-[0.14em] text-white/60 sm:max-w-none sm:text-[9px] sm:tracking-[0.22em]">
              Registro oficial · Tu comunidad empresarial
            </p>
          </div>
        </div>

        <span className="hidden items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.16em] text-white/85 backdrop-blur sm:inline-flex">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald" />
          Sistema en línea
        </span>
      </header>

      <main className="relative mx-auto w-full max-w-3xl flex-1 px-5 pb-16 sm:px-8">
        <section className="print-hide pt-8 text-center sm:pt-14">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.2em] text-white backdrop-blur">
            <IconoDestellos className="h-3.5 w-3.5" />
            Validación de identidad automática
          </span>

          <h1 className="mx-auto mt-5 max-w-2xl text-[38px] font-bold leading-[1.05] tracking-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.18)] sm:text-[54px]">
            Descargar archivo de validación
          </h1>

          <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-white/80">
            Ingresa tu número de documento para consultar el estado de tu
            registro y descargar tu certificado.
          </p>
        </section>

        <Validador />

        <p className="print-hide mx-auto mt-10 max-w-md text-center text-[11px] leading-relaxed text-white/60">
          La consulta es de solo lectura y no modifica tu registro. El
          certificado se genera automáticamente con sus datos registrados.
        </p>
      </main>

      <footer className="print-hide relative mx-auto flex w-full max-w-5xl flex-col items-center justify-between gap-2 border-t border-white/20 px-5 py-6 text-center sm:flex-row sm:px-8 sm:text-left">
        <p className="text-[11px] text-white/65">
          Documento generado automáticamente · Verificación asistida por IA
        </p>
        <p className="text-[10px] uppercase tracking-[0.18em] text-white/45">
          © 2026
        </p>
      </footer>
    </div>
  );
}
