import { readFile } from "node:fs/promises";
import path from "node:path";
import fontkit from "@pdf-lib/fontkit";
import {
  LineCapStyle,
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFFont,
  type PDFPage,
  type RGB,
} from "pdf-lib";
import type { RegistroPublico } from "@/lib/tipos";
import {
  formatearCelular,
  formatearFecha,
  formatearFechaCorta,
  formatearMoneda,
  formatearTelegram,
} from "@/lib/formato";

type Fuentes = {
  regular: Uint8Array;
  bold: Uint8Array;
};

let fuentesCache: Promise<Fuentes> | null = null;

function leerFuentesRoboto(): Promise<Fuentes> {
  if (!fuentesCache) {
    const dir = path.join(process.cwd(), "public", "fonts");

    fuentesCache = Promise.all([
      readFile(path.join(dir, "Roboto-Regular.ttf")),
      readFile(path.join(dir, "Roboto-Bold.ttf")),
    ]).then(([regular, bold]) => ({ regular, bold }));
  }

  return fuentesCache;
}

const ANCHO = 595.28;
const ALTO = 841.89;
const MARGEN = 48;

const TINTA = rgb(0.165, 0.09, 0.251);
const TINTA_SUAVE = rgb(0.373, 0.318, 0.447);
const MORADO = rgb(0.463, 0.294, 0.635);
const VERDE = rgb(0.055, 0.624, 0.431);
const VERDE_CLARO = rgb(0.902, 0.965, 0.937);
const LINEA = rgb(0.91, 0.882, 0.945);
const BLANCO = rgb(1, 1, 1);

function limpiar(texto: string): string {
  return texto
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\u2026/g, "...")
    .replace(/[^\x00-\xFF]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function escribir(
  page: PDFPage,
  texto: string,
  x: number,
  y: number,
  font: PDFFont,
  size: number,
  color: RGB,
  opacity = 1,
) {
  page.drawText(limpiar(texto), { x, y, size, font, color, opacity });
}

function escribirDerecha(
  page: PDFPage,
  texto: string,
  xDerecha: number,
  y: number,
  font: PDFFont,
  size: number,
  color: RGB,
  opacity = 1,
) {
  const limpio = limpiar(texto);
  const ancho = font.widthOfTextAtSize(limpio, size);
  page.drawText(limpio, { x: xDerecha - ancho, y, size, font, color, opacity });
}

function ajustarTexto(
  texto: string,
  font: PDFFont,
  size: number,
  anchoMaximo: number,
): string {
  const limpio = limpiar(texto);
  if (font.widthOfTextAtSize(limpio, size) <= anchoMaximo) return limpio;

  let recortado = limpio;
  while (
    recortado.length > 0 &&
    font.widthOfTextAtSize(`${recortado}...`, size) > anchoMaximo
  ) {
    recortado = recortado.slice(0, -1);
  }

  return `${recortado.trimEnd()}...`;
}

type CampoPdf = {
  etiqueta: string;
  valor: string;
  destacado?: boolean;
};

function dibujarCampo(
  page: PDFPage,
  campo: CampoPdf,
  x: number,
  y: number,
  ancho: number,
  fontRegular: PDFFont,
  fontBold: PDFFont,
) {
  escribir(page, campo.etiqueta.toUpperCase(), x, y, fontBold, 7.5, TINTA_SUAVE);
  escribir(
    page,
    ajustarTexto(
      campo.valor,
      campo.destacado ? fontBold : fontRegular,
      campo.destacado ? 13 : 11,
      ancho,
    ),
    x,
    y - 16,
    campo.destacado ? fontBold : fontRegular,
    campo.destacado ? 13 : 11,
    TINTA,
  );
}

export async function generarCertificadoPdf(
  registro: RegistroPublico,
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([ANCHO, ALTO]);

  let regular: PDFFont;
  let bold: PDFFont;
  let mono: PDFFont;

  try {
    const fuentes = await leerFuentesRoboto();
    doc.registerFontkit(fontkit);
    regular = await doc.embedFont(fuentes.regular, { subset: true });
    bold = await doc.embedFont(fuentes.bold, { subset: true });
    mono = bold;
  } catch (error) {
    console.warn("No se pudieron cargar las fuentes Roboto, se usa Helvetica:", error);
    regular = await doc.embedFont(StandardFonts.Helvetica);
    bold = await doc.embedFont(StandardFonts.HelveticaBold);
    mono = await doc.embedFont(StandardFonts.CourierBold);
  }

  doc.setTitle(`Certificado de validación - Registro ${registro.id}`);
  doc.setAuthor("Sistema de validación de identidad");
  doc.setSubject("Certificado de validación");
  doc.setCreator("Sistema de validación asistida por IA");

  // Fondo
  page.drawRectangle({ x: 0, y: 0, width: ANCHO, height: ALTO, color: BLANCO });

  // Cabecera
  const cabeceraAlto = 148;
  const cabeceraY = ALTO - cabeceraAlto;

  page.drawRectangle({
    x: 0,
    y: cabeceraY,
    width: ANCHO,
    height: cabeceraAlto,
    color: TINTA,
  });

  page.drawCircle({
    x: ANCHO - 40,
    y: ALTO - 20,
    size: 110,
    color: BLANCO,
    opacity: 0.04,
  });

  // Sello superior
  const selloX = MARGEN + 20;
  const selloY = ALTO - 74;
  page.drawCircle({ x: selloX, y: selloY, size: 20, color: BLANCO });
  page.drawLine({
    start: { x: selloX - 7, y: selloY },
    end: { x: selloX - 2, y: selloY - 6 },
    thickness: 3,
    color: VERDE,
    lineCap: LineCapStyle.Round,
  });
  page.drawLine({
    start: { x: selloX - 2, y: selloY - 6 },
    end: { x: selloX + 8, y: selloY + 6 },
    thickness: 3,
    color: VERDE,
    lineCap: LineCapStyle.Round,
  });

  escribir(page, "CERTIFICADO DE VALIDACIÓN", MARGEN + 52, ALTO - 68, bold, 17, BLANCO);
  escribir(
    page,
    "Sistema de validación de identidad",
    MARGEN + 52,
    ALTO - 86,
    regular,
    9,
    BLANCO,
    0.6,
  );

  escribirDerecha(page, "N° MEMBRESÍA / REGISTRO", ANCHO - MARGEN, ALTO - 58, bold, 7.5, BLANCO, 0.65);
  escribirDerecha(
    page,
    `#${registro.id}`,
    ANCHO - MARGEN,
    ALTO - 80,
    mono,
    22,
    BLANCO,
  );

  page.drawRectangle({
    x: 0,
    y: cabeceraY - 4,
    width: ANCHO,
    height: 4,
    color: MORADO,
  });

  // Bloque de estado
  const estadoTop = cabeceraY - 28;
  const estadoAlto = 76;
  const estadoY = estadoTop - estadoAlto;

  page.drawRectangle({
    x: MARGEN,
    y: estadoY,
    width: ANCHO - MARGEN * 2,
    height: estadoAlto,
    color: VERDE_CLARO,
  });
  page.drawRectangle({
    x: MARGEN,
    y: estadoY,
    width: 4,
    height: estadoAlto,
    color: VERDE,
  });

  const checkX = MARGEN + 38;
  const checkY = estadoY + estadoAlto / 2;
  page.drawCircle({ x: checkX, y: checkY, size: 19, color: VERDE });
  page.drawLine({
    start: { x: checkX - 7, y: checkY },
    end: { x: checkX - 2, y: checkY - 6 },
    thickness: 3,
    color: BLANCO,
    lineCap: LineCapStyle.Round,
  });
  page.drawLine({
    start: { x: checkX - 2, y: checkY - 6 },
    end: { x: checkX + 8, y: checkY + 6 },
    thickness: 3,
    color: BLANCO,
    lineCap: LineCapStyle.Round,
  });

  escribir(page, "USTED ESTÁ VERIFICADO", MARGEN + 68, estadoY + 44, bold, 18, TINTA);
  escribir(
    page,
    "El documento y las imágenes del registro fueron validados correctamente.",
    MARGEN + 68,
    estadoY + 26,
    regular,
    9,
    TINTA_SUAVE,
  );

  // Resumen - Fila 1: Documento, Imágenes subidas, Fecha de registro
  const resumen1Y = estadoY - 34;
  const fila1 = [
    { x: MARGEN, etiqueta: "DOCUMENTO", valor: registro.cedula },
    { x: MARGEN + 175, etiqueta: "IMÁGENES SUBIDAS", valor: String(registro.imagenes) },
    {
      x: MARGEN + 340,
      etiqueta: "FECHA DE REGISTRO",
      valor: formatearFechaCorta(registro.fechaRegistro),
    },
  ];

  fila1.forEach((col) => {
    escribir(page, col.etiqueta, col.x, resumen1Y, bold, 7, TINTA_SUAVE);
    escribir(page, col.valor, col.x, resumen1Y - 16, bold, 11, TINTA);
  });

  [MARGEN + 160, MARGEN + 325].forEach((x) => {
    page.drawLine({
      start: { x, y: resumen1Y - 18 },
      end: { x, y: resumen1Y + 10 },
      thickness: 0.7,
      color: LINEA,
    });
  });

  // Línea divisoria entre Fila 1 y Fila 2
  page.drawLine({
    start: { x: MARGEN, y: resumen1Y - 24 },
    end: { x: ANCHO - MARGEN, y: resumen1Y - 24 },
    thickness: 0.7,
    color: LINEA,
  });

  // Resumen - Fila 2: Membresías y Total cancelado
  const resumen2Y = resumen1Y - 42;
  const fila2 = [
    {
      x: MARGEN,
      etiqueta: "MEMBRESÍAS",
      valor: String(registro.cantidadMembresias),
      tamano: 18,
    },
    {
      x: MARGEN + 250,
      etiqueta: "TOTAL CANCELADO",
      valor: formatearMoneda(registro.valorTotal),
      tamano: 15,
    },
  ];

  fila2.forEach((col) => {
    escribir(page, col.etiqueta, col.x, resumen2Y, bold, 7, TINTA_SUAVE);
    escribir(page, col.valor, col.x, resumen2Y - 18, bold, col.tamano, TINTA);
  });

  page.drawLine({
    start: { x: MARGEN + 235, y: resumen2Y - 20 },
    end: { x: MARGEN + 235, y: resumen2Y + 10 },
    thickness: 0.7,
    color: LINEA,
  });

  // Datos del registro
  const tituloSeccionY = resumen2Y - 44;
  escribir(page, "DATOS DEL REGISTRO", MARGEN, tituloSeccionY, bold, 8, TINTA_SUAVE);
  page.drawLine({
    start: { x: MARGEN, y: tituloSeccionY - 9 },
    end: { x: ANCHO - MARGEN, y: tituloSeccionY - 9 },
    thickness: 0.8,
    color: LINEA,
  });

  const anchoColumna = (ANCHO - MARGEN * 2 - 24) / 2;
  const xDerecha = MARGEN + anchoColumna + 24;
  let filaY = tituloSeccionY - 30;

  dibujarCampo(
    page,
    { etiqueta: "Nombre completo", valor: registro.nombreCompleto, destacado: true },
    MARGEN,
    filaY,
    ANCHO - MARGEN * 2,
    regular,
    bold,
  );

  filaY -= 44;

  dibujarCampo(
    page,
    { etiqueta: "Documento de identidad", valor: registro.cedula },
    MARGEN,
    filaY,
    anchoColumna,
    regular,
    bold,
  );
  dibujarCampo(
    page,
    { etiqueta: "Fecha de nacimiento", valor: formatearFecha(registro.fechaNacimiento) },
    xDerecha,
    filaY,
    anchoColumna,
    regular,
    bold,
  );

  filaY -= 44;

  dibujarCampo(
    page,
    {
      etiqueta: "Teléfono",
      valor: formatearCelular(registro.indicativoPais, registro.celular),
    },
    MARGEN,
    filaY,
    anchoColumna,
    regular,
    bold,
  );
  dibujarCampo(
    page,
    {
      etiqueta: "Usuario de Telegram",
      valor: formatearTelegram(registro.usaTelegram, registro.usuarioTelegram),
    },
    xDerecha,
    filaY,
    anchoColumna,
    regular,
    bold,
  );

  filaY -= 44;

  dibujarCampo(
    page,
    {
      etiqueta: "Ubicación",
      valor: `${registro.ciudad}, ${registro.departamento} - ${registro.pais}`,
    },
    MARGEN,
    filaY,
    anchoColumna,
    regular,
    bold,
  );
  dibujarCampo(
    page,
    {
      etiqueta: "HASS registrado",
      valor: registro.numeroConsignacion || "No registra",
    },
    xDerecha,
    filaY,
    anchoColumna,
    regular,
    bold,
  );

  filaY -= 44;

  dibujarCampo(
    page,
    { etiqueta: "Líder a cargo", valor: registro.lider },
    MARGEN,
    filaY,
    ANCHO - MARGEN * 2,
    regular,
    bold,
  );

  // Banner de soporte obligatorio
  const bannerY = filaY - 68;
  const bannerAlto = 28;
  page.drawRectangle({
    x: MARGEN,
    y: bannerY,
    width: ANCHO - MARGEN * 2,
    height: bannerAlto,
    color: rgb(0.99, 0.96, 0.89),
    borderColor: rgb(0.85, 0.65, 0.25),
    borderWidth: 0.8,
  });
  escribir(
    page,
    "ANEXO DE SOPORTES OBLIGATORIO",
    MARGEN + 12,
    bannerY + 16,
    bold,
    7.5,
    rgb(0.7, 0.35, 0.05),
  );
  escribir(
    page,
    "Deben anexar los respectivos soportes a este certificado (comprobante de pago y documentos de identidad).",
    MARGEN + 12,
    bannerY + 6,
    regular,
    7.5,
    TINTA,
  );

  // Cierre
  const cierreY = bannerY - 40;
  page.drawLine({
    start: { x: MARGEN, y: cierreY + 14 },
    end: { x: ANCHO - MARGEN, y: cierreY + 14 },
    thickness: 0.8,
    color: LINEA,
  });

  escribir(page, "VERIFICACIÓN COMPLETADA", MARGEN, cierreY - 6, bold, 7.5, MORADO);
  escribir(
    page,
    "El registro asociado a este documento fue validado",
    MARGEN,
    cierreY - 20,
    regular,
    8.5,
    TINTA,
  );
  escribir(
    page,
    "correctamente en la fecha de emisión.",
    MARGEN,
    cierreY - 32,
    regular,
    8.5,
    TINTA,
  );
  escribir(
    page,
    "Este certificado oficial no modifica su registro original.",
    MARGEN,
    cierreY - 44,
    regular,
    7.5,
    TINTA_SUAVE,
  );

  const estampaX = ANCHO - MARGEN - 52;
  const estampaY = cierreY - 24;
  page.drawCircle({
    x: estampaX,
    y: estampaY,
    size: 40,
    color: BLANCO,
    borderColor: MORADO,
    borderWidth: 1.2,
    opacity: 0.9,
  });
  page.drawCircle({
    x: estampaX,
    y: estampaY,
    size: 34,
    borderColor: MORADO,
    borderWidth: 0.5,
  });

  const textoEstampa = "VERIFICADO";
  const anchoEstampa = bold.widthOfTextAtSize(textoEstampa, 7.5);
  escribir(page, textoEstampa, estampaX - anchoEstampa / 2, estampaY + 1, bold, 7.5, MORADO);

  const subEstampa = "SISTEMA DE VALIDACIÓN";
  const anchoSub = bold.widthOfTextAtSize(subEstampa, 4.2);
  escribir(page, subEstampa, estampaX - anchoSub / 2, estampaY - 8, bold, 4.2, MORADO, 0.75);

  // Pie
  page.drawLine({
    start: { x: MARGEN, y: 78 },
    end: { x: ANCHO - MARGEN, y: 78 },
    thickness: 0.8,
    color: LINEA,
  });

  escribir(
    page,
    "Documento generado automáticamente por el sistema de validación asistida por IA.",
    MARGEN,
    64,
    regular,
    7.5,
    TINTA_SUAVE,
  );
  escribir(
    page,
    "El estado del registro puede confirmarse con el número de membresía/registro indicado en este certificado.",
    MARGEN,
    52,
    regular,
    7.5,
    TINTA_SUAVE,
  );
  escribirDerecha(
    page,
    formatearFecha(new Date().toISOString()),
    ANCHO - MARGEN,
    52,
    regular,
    7.5,
    TINTA_SUAVE,
  );

  return doc.save();
}
