import { prisma } from "../src/lib/db";
import { seedExerciseCatalog } from "../src/modules/exercises/catalog-seed";

async function main() {
  await seedExerciseCatalog(prisma);
  console.log("Catálogo global de categorias e exercícios populado com sucesso.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
