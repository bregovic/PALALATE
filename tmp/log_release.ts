import { PrismaClient } from "@prisma/client";

async function main() {
  const prisma = new PrismaClient();
  try {
    const release = await prisma.developmentRelease.create({
      data: {
        title: "Profilovky, loga a vylepšení designu",
        description: "Přidán interaktivní editor profilových fotek (ořez), možnost nahrávání log k službám v číselníku, zobrazení log na dashboardu a v seznamech. Opraveno zarovnání nástěnky a chatu.",
        version: "0.2.0"
      }
    });
    console.log("Release logged:", release.id);
  } catch (e) {
    console.error("Failed to log release:", e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
