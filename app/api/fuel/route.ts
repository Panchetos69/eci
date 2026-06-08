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
    const { truckId, date, liters, pricePerLiter, kmAtLoad, engineHours, fuelType, location, driverName, notes, hoursWorked, totalCost } = body;

    if (!truckId || !date || !liters || !pricePerLiter) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
    }

    const truck = await prisma.truck.findFirst({ where: { id: truckId, orgId } });
    if (!truck) return NextResponse.json({ error: "Camión no encontrado" }, { status: 404 });

    // Get last fuel log to calculate km since last load
    const lastLog = await prisma.fuelLog.findFirst({
      where: { truckId },
      orderBy: { date: "desc" },
    });

    let kmSinceLastLoad: number | null = null;
    let consumptionCalc: number | null = null;

    if (kmAtLoad && lastLog?.kmAtLoad) {
      kmSinceLastLoad = parseInt(kmAtLoad) - lastLog.kmAtLoad;
      if (kmSinceLastLoad > 0) {
        consumptionCalc = kmSinceLastLoad / parseFloat(liters);
      }
    }

    const log = await prisma.fuelLog.create({
      data: {
        truckId,
        userId: userId || null,
        date: new Date(date),
        liters: parseFloat(liters),
        pricePerLiter: parseFloat(pricePerLiter),
        kmAtLoad: kmAtLoad ? parseInt(kmAtLoad) : 0,
        kmSinceLastLoad,
        consumptionCalc,
        engineHours: engineHours ? parseFloat(engineHours) : null,
        hoursWorked: hoursWorked ? parseFloat(hoursWorked) : null,
        driverName: driverName || null,
        location: location || null,
        fuelType: fuelType || "Diesel BS10",
        totalCost: totalCost ? parseFloat(totalCost) : parseFloat(liters) * parseFloat(pricePerLiter),
        notes: notes || null,
        orgId,
      },
    });

    // Update truck currentKm if provided and higher
    if (kmAtLoad && parseInt(kmAtLoad) > truck.currentKm) {
      await prisma.truck.update({ where: { id: truckId }, data: { currentKm: parseInt(kmAtLoad) } });
    }

    // Update truck currentHours if provided and higher
    if (engineHours && parseFloat(engineHours) > truck.currentHours) {
      await prisma.truck.update({ where: { id: truckId }, data: { currentHours: parseFloat(engineHours) } });
    }

    return NextResponse.json({ log }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: "Error al registrar carga" }, { status: 500 });
  }
}
