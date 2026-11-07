import { formatearFechaCorta } from "@/lib/formato";

type Props = {
  id: number;
  fecha: string;
  className?: string;
};

export function SelloValidacion({ id, fecha, className = "" }: Props) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      role="img"
      aria-label={`Sello de validación del registro ${id}`}
    >
      <g fill="none" stroke="currentColor">
        <circle cx="60" cy="60" r="57" strokeWidth="2.2" />
        <circle
          cx="60"
          cy="60"
          r="50.5"
          strokeWidth="0.8"
          strokeDasharray="1.8 3.2"
          opacity="0.75"
        />
      </g>

      <g fill="currentColor" textAnchor="middle">
        <text x="60" y="38" fontSize="4.9" fontWeight="500" letterSpacing="0.85">
          VALIDACIÓN DE IDENTIDAD
        </text>

        <text x="60" y="64" fontSize="13" fontWeight="700" letterSpacing="0.4">
          VERIFICADO
        </text>

        <line
          x1="33"
          y1="71"
          x2="87"
          y2="71"
          stroke="currentColor"
          strokeWidth="0.6"
          opacity="0.5"
        />

        <text x="60" y="81.5" fontSize="4.7" fontWeight="500" letterSpacing="0.55">
          REGISTRO #{id}
        </text>
        <text x="60" y="90.5" fontSize="4.2" letterSpacing="0.35" opacity="0.75">
          {formatearFechaCorta(fecha)}
        </text>
      </g>
    </svg>
  );
}
