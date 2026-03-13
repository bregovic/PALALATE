import { PrismaClient, BillingCycle } from "@prisma/client";

const prisma = new PrismaClient();

const services = [
  // AI
  { name: "ChatGPT", category: "AI", websiteUrl: "openai.com" },
  { name: "Claude", category: "AI", websiteUrl: "anthropic.com" },
  { name: "Perplexity", category: "AI", websiteUrl: "perplexity.ai" },
  { name: "Suno", category: "AI", websiteUrl: "suno.ai" },
  { name: "Midjourney", category: "AI", websiteUrl: "midjourney.com" },
  { name: "Canva", category: "AI", websiteUrl: "canva.com" },
  
  // Streaming & Entertainment
  { name: "Netflix", category: "Streaming", defaultPrice: 239 },
  { name: "Disney+", category: "Streaming", defaultPrice: 239 },
  { name: "HBO Max", category: "Streaming" },
  { name: "SkyShowtime", category: "Streaming" },
  { name: "YouTube Premium", category: "Streaming", defaultPrice: 179 },
  { name: "Spotify", category: "Music", defaultPrice: 169 },
  { name: "Tidal", category: "Music" },
  { name: "Apple Music", category: "Music" },
  { name: "Voyo", category: "Streaming" },
  { name: "Prima +", category: "Streaming" },
  { name: "O2 TV", category: "Streaming" },
  
  // Productivity & Cloud
  { name: "Google One", category: "Cloud", description: "Storage, Photos & Drive" },
  { name: "iCloud+", category: "Cloud" },
  { name: "Microsoft 365", category: "Productivity" },
  { name: "Notion", category: "Productivity" },
  { name: "Dropbox", category: "Cloud" },
  
  // Lifestyle & Education
  { name: "Duolingo", category: "Education" },
  { name: "GeoCaching", category: "Lifestyle", defaultPrice: 949, billingCycle: BillingCycle.YEARLY },
  { name: "Park4night", category: "Lifestyle" },
  { name: "Wolt+", category: "Lifestyle" },
  { name: "Alza Premium", category: "Lifestyle" },
  
  // Specialized / Local
  { name: "Čestmír Strakatý - Forendors", category: "Podcast" },
  { name: "Kecy a politika - Forendors", category: "Podcast" },
  { name: "DVTV", category: "News", defaultPrice: 199 },
  { name: "Mango zpěvník", category: "Lifestyle" },
  { name: "MyHeritage", category: "Lifestyle" },
];

async function main() {
  console.log("Seeding expanded service registry...");
  for (const s of services) {
    await prisma.serviceRegistry.upsert({
      where: { name: s.name },
      update: s,
      create: {
        ...s,
        currency: "CZK",
        billingCycle: s.billingCycle || BillingCycle.MONTHLY,
      },
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
