import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const orgId = (session.user as any).orgId;

  const { searchParams } = new URL(req.url);
  const truckId = searchParams.get("truckId");
  const where: any = { orgId };
  if (truckId) where.truckId = truckId;

  const logs = await prisma.fuelLog.findMany({
    where,
    include: { truck: { select: { plate: true } } },
    orderBy: { date: "desc" },
  });
  return NextResponse.json({ logs });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const orgId = (session.user as any).orgId;
  const userId = (session.user as any).id;

  try {
    const body = await req.json();
    const { truckId, date, liters, pricePerLiter, kmAtLoad, fuelType, location, driverName, notes, hoursWorked, totalCost } = body;

    if (!truckId || !date || !liters || !pricePerLiter || !kmAtLoad) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
    }

    // Get last fuel log to calculate km since last load
    const lastLog = await prisma.fuelLog.findFirst({
      where: { truckId },
      orderBy: { date: "desc" },
    });
    const kmSinceLastLoad = lastLog ? kmAtLoad - lastLog.kmAtLoad : null;
    const consumptionCalc = kmSinceLastLoad && kmSinceLastLoad > 0 ? kmSinceLastLoad / liters : null;

    const log = await prisma.fuelLog.create({
      data: {
        truckId,
        userId: userId || null,
        date: new Date(date),
        liters: parseFloat(liters),
        pricePerLiter: parseFloat(pricePerLiter),
        kmAtLoad: parseInt(kmAtLoad),
        kmSinceLastLoad,
        consumptionCalc,
        hoursWorked: hoursWorked ? parseFloat(hoursWorked) : null,
        driverName: driverName || null,
        location: location || null,
        fuelType: fuelType || "Diesel BS10",
        totalCost: totalCost ? parseFloat(totalCost) : parseFloat(liters) * parseFloat(pricePerLiter),
        notes: notes || null,
        orgId,
      },
    });

    // Update truck current km if higher
    await prisma.truck.updateMany({
      where: { id: truckId, currentKm: { lt: parseInt(kmAtLoad) } },
      data: { currentKm: parseInt(kmAtLoad) },
    });

    return NextResponse.json({ log }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: "Error al registrar carga" }, { status: 500 });
  }
}
