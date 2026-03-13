import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { parseExcel } from "@/lib/excel";
import { BillingCycle, ServiceStatus, SharingStatus } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const data = parseExcel(buffer) as any[];
    
    for (const row of data) {
      const serviceName = row["Služba"] || row["Služba (Name)"];
      if (!serviceName) continue;

      // Map Billing Cycle
      let cycle: BillingCycle = BillingCycle.MONTHLY;
      const periodRaw = String(row["Perioda"] || "").toLowerCase();
      if (periodRaw.includes("rok") || periodRaw.includes("year")) cycle = BillingCycle.YEARLY;
      if (periodRaw.includes("týden") || periodRaw.includes("week")) cycle = BillingCycle.WEEKLY;

      // Handle Dates
      let renewalDate: Date | null = null;
      const dateVal = row["Datum obnovy"] || row["Expired"] || row["Výročí platby"];
      if (dateVal) {
        renewalDate = new Date(dateVal);
        if (isNaN(renewalDate.getTime())) renewalDate = null;
      }

      await prisma.service.create({
        data: {
          ownerId: user.id,
          serviceName: String(serviceName),
          providerName: String(row["Poskytovatel"] || serviceName),
          periodicPrice: parseFloat(row["Cena"] || "0"),
          currency: String(row["Měna"] || "CZK"),
          billingCycle: cycle,
          renewalDate: renewalDate,
          description: row["Popis"] || row["Description"] || "",
          category: row["Kategorie"] || "",
          status: ServiceStatus.ACTIVE,
          sharingStatus: row["Sdílení"] === "Ano" ? SharingStatus.SHARING_ENABLED : SharingStatus.SHARING_DISABLED,
          maxSharedSlots: parseInt(row["Max slotů"] || row["Počet možných slotů"] || "0"),
        },
      });
    }

    return NextResponse.json({ success: true, count: data.length });
  } catch (error) {
    console.error("[Import POST]", error);
    return NextResponse.json({ error: "Import failed" }, { status: 500 });
  }
}
