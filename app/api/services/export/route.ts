import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { exportToExcel } from "@/lib/excel";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const services = await prisma.service.findMany({
      where: { ownerId: user.id },
      orderBy: { createdAt: "desc" },
    });

    // Format for Excel
    const excelData = services.map(s => ({
      "Služba": s.serviceName,
      "Poskytovatel": s.providerName,
      "Cena": s.periodicPrice.toString(),
      "Měna": s.currency,
      "Perioda": s.billingCycle,
      "Datum obnovy": s.renewalDate ? s.renewalDate.toLocaleDateString('cs-CZ') : "",
      "Kategorie": s.category || "",
      "Popis": s.description || "",
      "Status": s.status,
      "Sdílení": s.sharingStatus === "SHARING_ENABLED" ? "Ano" : "Ne",
      "Max slotů": s.maxSharedSlots
    }));

    const buffer = exportToExcel(excelData, "Moje Služby");

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="palalate_export.xlsx"',
      },
    });
  } catch (error) {
    console.error("[Export GET]", error);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
