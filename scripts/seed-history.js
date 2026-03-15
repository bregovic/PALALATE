
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const releases = [
    {
      version: "v1.0.0",
      title: "Základní spuštění projektu",
      description: "Inicializace systému Palalate. Implementace základní správy předplatných, kategorií a uživatelských profilů. První verze dashboardu.",
      createdAt: new Date("2026-03-05T10:00:00Z")
    },
    {
      version: "v1.1.0",
      title: "Finanční analýza a statistiky",
      description: "Přidána sekce Analýza nákladů. Implementovány grafy vývoje výdajů, přehledy podle kategorií a možnost exportu/importu dat do CSV.",
      createdAt: new Date("2026-03-09T14:30:00Z")
    },
    {
      version: "v1.2.0",
      title: "Sociální interakce a Chat",
      description: "Spuštění sociálních funkcí. Nástěnka s příspěvky, systém přátelství a real-time chat s podporou GIFů (Giphy) a emoji.",
      createdAt: new Date("2026-03-12T09:15:00Z")
    },
    {
      version: "v1.3.0",
      title: "Centrum vývoje a hlášení chyb",
      description: "Implementována sekce Vývoj pro sledování historie verzí. Přidán systém pro hlášení bugů s podporou vkládání screenshotů (Ctrl+V).",
      createdAt: new Date("2026-03-14T16:00:00Z")
    },
    {
      version: "v1.4.0",
      title: "Predikce a inteligentní přehledy",
      description: "Vylepšení analýzy nákladů o modelaci konce roku (projekce). Přidán měsíční žebříček plateb a pokročilý editor profilových fotek a log služeb.",
      createdAt: new Date("2026-03-15T19:00:00Z")
    }
  ];

  console.log("Seeding development history...");
  
  for (const rel of releases) {
    await prisma.developmentRelease.create({
      data: rel
    });
  }

  console.log("Successfully seeded 5 major milestones.");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
