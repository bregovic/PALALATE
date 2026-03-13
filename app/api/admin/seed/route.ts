import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { BillingCycle } from "@prisma/client";

export async function GET() {
  try {
    const user = await requireAuth();
    if (user.role !== "ADMIN") {
       // return new NextResponse("Unauthorized", { status: 401 });
    }

    const categories = [
      { name: "AI", icon: "🤖" },
      { name: "Streaming", icon: "🎬" },
      { name: "Music", icon: "🎵" },
      { name: "Cloud", icon: "☁️" },
      { name: "Design", icon: "🎨" },
      { name: "Productivity", icon: "🚀" },
      { name: "Education", icon: "📚" },
      { name: "Lifestyle", icon: "🏠" },
      { name: "Podcast", icon: "🎙️" },
      { name: "News", icon: "📰" },
      { name: "Finance", icon: "💳" },
      { name: "Retail", icon: "🛒" },
      { name: "Banka", icon: "🏦" },
      { name: "Work", icon: "💼" },
    ];

    const services = [
      // AI
      { name: "ChatGPT", category: "AI", websiteUrl: "openai.com", defaultPrice: 20, currency: "USD" },
      { name: "Claude", category: "AI", websiteUrl: "anthropic.com", defaultPrice: 20, currency: "USD" },
      { name: "Perplexity", category: "AI", websiteUrl: "perplexity.ai", defaultPrice: 20, currency: "USD" },
      { name: "Suno", category: "AI", websiteUrl: "suno.ai" },
      { name: "Midjourney", category: "AI", websiteUrl: "midjourney.com" },
      { name: "Canva", category: "Design", websiteUrl: "canva.com" },
      
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
      { name: "Revolut Premium", category: "Finance" },
    ];

    console.log("Seeding categories...");
    for (const cat of categories) {
      await prisma.serviceCategory.upsert({
        where: { name: cat.name },
        update: { icon: cat.icon },
        create: cat,
      });
    }

    console.log("Seeding service registry...");
    for (const s of services) {
      await prisma.serviceRegistry.upsert({
        where: { name: s.name },
        update: s,
        create: {
          ...s,
          currency: s.currency || "CZK",
          billingCycle: (s.billingCycle as BillingCycle) || BillingCycle.MONTHLY,
        },
      });
    }

    return NextResponse.json({ success: true, message: "Seeding completed" });
  } catch (error) {
    console.error("[Seed API Error]", error);
    return NextResponse.json({ error: "Seeding failed", details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
