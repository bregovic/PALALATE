import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

// Simple Levenshtein distance for fuzzy matching
function levenshtein(a: string, b: string): number {
  const matrix = Array.from({ length: a.length + 1 }, () => 
    Array.from({ length: b.length + 1 }, () => 0)
  );
  for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  return matrix[a.length][b.length];
}

function getSimilarity(s1: string, s2: string): number {
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  const longerLength = longer.length;
  if (longerLength === 0) return 1.0;
  return (longerLength - levenshtein(longer, shorter)) / longerLength;
}

export async function POST(req: Request) {
  try {
    const user = await requireAuth();
    const { text } = await req.json();

    if (!text) {
      return NextResponse.json({ matches: [] });
    }

    const normalizedText = text.toLowerCase().trim();
    const words = normalizedText.split(/\s+/);
    const registry = await prisma.serviceRegistry.findMany();
    
    // Get currently owned service names
    const existing = await prisma.service.findMany({
      where: { ownerId: user.id },
      select: { serviceName: true }
    });
    const existingNames = new Set(existing.map(s => s.serviceName.toLowerCase()));

    const matchesMap = new Map();

    for (const item of registry as any[]) {
      const itemName = item.name.toLowerCase();
      
      // 1. Check exact prefix (minimum 3 chars)
      const isPrefixMatch = itemName.length >= 3 && words.some((w: string) => itemName.startsWith(w) || w.startsWith(itemName));
      
      // 2. Check overlap tokens
      const isTokenMatch = words.some((w: string) => w.length >= 3 && itemName.includes(w));

      // 3. Fuzzy match (75% threshold)
      let maxSim = 0;
      // Compare item name against each word OR sliding windows of words
      words.forEach((w: string) => {
        if (w.length < 3) return;
        const sim = getSimilarity(itemName, w);
        if (sim > maxSim) maxSim = sim;
      });

      // Also check against full text (for multi-word service names)
      const fullSim = getSimilarity(itemName, normalizedText);
      if (fullSim > maxSim) maxSim = fullSim;

      if (isPrefixMatch || isTokenMatch || maxSim >= 0.75) {
        if (!existingNames.has(itemName)) {
          matchesMap.set(item.id, {
            id: item.id,
            name: item.name,
            confidence: Math.max(maxSim, isPrefixMatch ? 0.9 : 0, isTokenMatch ? 0.8 : 0),
            category: item.category,
            iconUrl: item.iconUrl
          });
        }
      }
    }

    const matches = Array.from(matchesMap.values()).sort((a, b) => b.confidence - a.confidence);

    return NextResponse.json({ matches });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[Voice Match POST]", error);
    return NextResponse.json({ error: "Chyba při hledání služeb." }, { status: 500 });
  }
}
