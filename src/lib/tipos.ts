export type EstadoConsulta =
  | "verificado"
  | "no_verificado"
  | "no_encontrado"
  | "sin_creditos"
  | "limite";

export interface RegistroPublico {
  id: number;
  nombreCompleto: string;
  cedula: string;
  fechaNacimiento: string;
  indicativoPais: string;
  celular: string;
  usaTelegram: string;
  usuarioTelegram: string | null;
  pais: string;
  departamento: string;
  ciudad: string;
  fechaRegistro: string;
  imagenes: number;
  cantidadMembresias: number;
  valorTotal: number;
  numeroConsignacion: string | null;
  lider: string;
}

export interface RespuestaConsulta {
  estado: EstadoConsulta;
  registro?: RegistroPublico;
  mensaje?: string;
}
