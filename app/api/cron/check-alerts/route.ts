import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notifyOrg } from "@/lib/notifications";

export async function GET(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret") || new URL(req.url).searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = { pmAlerts: 0, docAlerts: 0, stockAlerts: 0, notifications: 0 };

  try {
    // 1. Check trucks for PM due
    const trucks = await prisma.truck.findMany({
      where: { status: { not: "INACTIVE" } },
    });

    for (const truck of trucks) {
      let pmAlert = false;
      let pmMessage = "";

      if (truck.fleetType === "INDUSTRIAL") {
        const hoursRemaining = truck.nextPmHours - truck.currentHours;
        if (hoursRemaining <= 20 && truck.nextPmHours > 0) {
          pmAlert = true;
          pmMessage = `⚠️ <b>PM próximo</b> - ${truck.plate} (${truck.internalId})\nHoras actuales: ${truck.currentHours}h\nPróximo PM: ${truck.nextPmHours}h\nRestante: ${hoursRemaining.toFixed(1)}h`;
        }
      } else {
        // PARTICULAR - KM based
        const kmRemaining = truck.nextPmKm - truck.currentKm;
        if (kmRemaining <= 500 && truck.nextPmKm > 0) {
          pmAlert = true;
          pmMessage = `⚠️ <b>PM próximo</b> - ${truck.plate} (${truck.internalId})\nKm actuales: ${truck.currentKm.toLocaleString("es-CL")} km\nPróximo PM: ${truck.nextPmKm.toLocaleString("es-CL")} km\nRestante: ${kmRemaining.toLocaleString("es-CL")} km`;
        }
      }

      if (pmAlert) {
        // Check if alert already exists today
        const existing = await prisma.alert.findFirst({
          where: {
            truckId: truck.id,
            type: "PM_DUE",
            seen: false,
            createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
          },
        });

        if (!existing) {
          await prisma.alert.create({
            data: {
              type: "PM_DUE",
              severity: "WARNING",
              title: `PM próximo - ${truck.plate}`,
              message: pmMessage.replace(/<[^>]*>/g, ""),
              truckId: truck.id,
              orgId: truck.orgId,
            },
          });
          await notifyOrg(truck.orgId, pmMessage, prisma);
          results.pmAlerts++;
          results.notifications++;
        }
      }
    }

    // 2. Check documents expiring in next 30 days
    const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const expiringDocs = await prisma.truckDocument.findMany({
      where: {
        isActive: true,
        expiresAt: { lte: thirtyDaysFromNow, gte: new Date() },
      },
      include: { truck: true },
    });

    for (const doc of expiringDocs) {
      const daysLeft = Math.ceil((doc.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      const existing = await prisma.alert.findFirst({
        where: {
          type: "DOCUMENT_EXPIRY",
          truckId: doc.truckId,
          seen: false,
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
          message: { contains: doc.type },
        },
      });

      if (!existing) {
        const msg = `📄 <b>Documento por vencer</b> - ${doc.truck.plate}\nTipo: ${doc.type}\nVence en: ${daysLeft} días (${doc.expiresAt.toLocaleDateString("es-CL")})`;
        await prisma.alert.create({
          data: {
            type: "DOCUMENT_EXPIRY",
            severity: daysLeft <= 7 ? "CRITICAL" : "WARNING",
            title: `Documento por vencer - ${doc.truck.plate}`,
            message: `${doc.type} vence en ${daysLeft} días`,
            truckId: doc.truckId,
            orgId: doc.truck.orgId,
          },
        });
        await notifyOrg(doc.truck.orgId, msg, prisma);
        results.docAlerts++;
        results.notifications++;
      }
    }

    // 3. Check inventory below minStock
    const lowStockItems = await prisma.inventoryItem.findMany({
      where: {
        stock: { lte: prisma.inventoryItem.fields.minStock },
      },
    });

    // Fallback: raw query approach
    const allItems = await prisma.inventoryItem.findMany();
    for (const item of allItems) {
      if (item.stock <= item.minStock) {
        const existing = await prisma.alert.findFirst({
          where: {
            type: "LOW_STOCK",
            seen: false,
            createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
            message: { contains: item.name },
          },
        });

        if (!existing) {
          const msg = `📦 <b>Stock bajo</b> - ${item.name}\nStock actual: ${item.stock} ${item.unit}\nStock mínimo: ${item.minStock} ${item.unit}`;
          await prisma.alert.create({
            data: {
              type: "LOW_STOCK",
              severity: "WARNING",
              title: `Stock bajo - ${item.name}`,
              message: `Stock: ${item.stock} ${item.unit} (mínimo: ${item.minStock})`,
              orgId: item.orgId,
            },
          });
          await notifyOrg(item.orgId, msg, prisma);
          results.stockAlerts++;
          results.notifications++;
        }
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (err) {
    console.error("Cron check-alerts error:", err);
    return NextResponse.json({ error: "Error interno", details: String(err) }, { status: 500 });
  }
}
