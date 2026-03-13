import { PrismaClient, BillingCycle } from "@prisma/client";

const prisma = new PrismaClient();

const services = [
  { name: "ChatGPT" },
  { name: "Duolingo" },
  { name: "GeoCaching", defaultPrice: 949, billingCycle: BillingCycle.YEARLY },
  { name: "Google One", description: "2 TB" },
  { name: "Park4night" },
  { name: "Čestmír Strakatý - Forendors" },
  { name: "Kecy a politika - Forendors" },
  { name: "DVTV", defaultPrice: 199, billingCycle: BillingCycle.MONTHLY },
  { name: "Claude" },
  { name: "NordVPN" },
  { name: "Perplexity" },
  { name: "Suno" },
  { name: "Mango zpěvník" },
  { name: "EvenLab" },
  { name: "Prima +" },
  { name: "Voyo" },
  { name: "O2 Tv" },
  { name: "Spotify" },
  { name: "Youtube Premium" },
  { name: "MyHeritage" },
  { name: "Alza premium" },
  { name: "Wolt" },
];

async function main() {
  console.log("Seeding service registry...");
  for (const s of services) {
    await prisma.serviceRegistry.upsert({
      where: { name: s.name },
      update: s,
      create: s,
    });
  }
  console.log("Seeding finished.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
