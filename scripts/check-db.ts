import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const cedula = (process.argv[2] ?? process.env.ALLOWED_CEDULAS ?? "")
  .split(",")[0]
  .trim();

async function main() {
  if (!cedula) {
    console.error("Uso: npm run db:check -- 49774099");
    process.exit(1);
  }

  console.log(`Consultando cédula ${cedula}...`);

  const registro = await prisma.registro.findFirst({
    where: {
      cedula: {
        equals: cedula,
        mode: "insensitive",
      },
    },
    select: {
      id: true,
      nombreCompleto: true,
      cedula: true,
      verificado: true,
      estado: true,
      createdAt: true,
      _count: { select: { imagenes: true } },
    },
  });

  if (!registro) {
    console.log("Sin resultados: no existe un registro con esa cédula.");
    return;
  }

  console.log({
    ...registro,
    imagenes: registro._count.imagenes,
    _count: undefined,
  });
}

main()
  .catch((error) => {
    console.error("Error de conexión:", error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
