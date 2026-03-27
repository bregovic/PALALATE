import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request) {
  let releases = await prisma.developmentRelease.findMany({
    orderBy: { createdAt: "desc" },
  });

  if (releases.length === 0) {
    // Fallback pokud je DB prázdná (pro Railway deploy)
    releases = [
      { id: "v14", version: "v1.4.0", title: "Predikce a inteligentní přehledy", description: "Vylepšení analýzy nákladů o modelaci konce roku (projekce). Přidán měsíční žebříček plateb a pokročilý editor profilových fotek a log služeb.", createdAt: new Date("2026-03-15") },
      { id: "v13", version: "v1.3.0", title: "Centrum vývoje a hlášení chyb", description: "Implementována sekce Vývoj pro sledování historie verzí. Přidán systém pro hlášení bugů s podporou vkládání screenshotů (Ctrl+V).", createdAt: new Date("2026-03-14") },
      { id: "v12", version: "v1.2.0", title: "Sociální interakce a Chat", description: "Spuštění sociálních funkcí. Nástěnka s příspěvky, systém přátelství a real-time chat s podporou GIFů (Giphy) a emoji.", createdAt: new Date("2026-03-12") },
      { id: "v11", version: "v1.1.0", title: "Finanční analýza a statistiky", description: "Přidána sekce Analýza nákladů. Implementovány grafy vývoje výdajů, přehledy podle kategorií a možnost exportu/importu dat do CSV.", createdAt: new Date("2026-03-09") },
      { id: "v10", version: "v1.0.0", title: "Základní spuštění projektu", description: "Inicializace systému Palalate. Implementace základní správy předplatných, kategorií a uživatelských profilů. První verze dashboardu.", createdAt: new Date("2026-03-05") }
    ] as any;
  }

  return NextResponse.json(releases);
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { title, description, version } = await req.json();
  
  if (!title || !description) {
    return NextResponse.json({ error: "Title and description are required" }, { status: 400 });
  }

  const release = await prisma.developmentRelease.create({
    data: { title, description, version },
  });

  return NextResponse.json(release);
}
