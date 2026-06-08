import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  // Return list of trucks for the public form (plate + internalId only)
  const trucks = await prisma.truck.findMany({
    select: {
      id: true,
      plate: true,
      internalId: true,
      brand: true,
      model: true,
      fleetType: true,
      currentKm: true,
      currentHours: true,
    },
    where: { status: { not: "INACTIVE" } },
    orderBy: { plate: "asc" },
  });
  return NextResponse.json({ trucks });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      truckId,
      date,
      liters,
      pricePerLiter,
      kmAtLoad,
      engineHours,
      driverName,
      location,
      notes,
    } = body;

    if (!truckId || !date || !liters || !pricePerLiter) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
    }

    const truck = await prisma.truck.findUnique({ where: { id: truckId } });
    if (!truck) return NextResponse.json({ error: "Camión no encontrado" }, { status: 404 });

    const parsedLiters = parseFloat(liters);
    const parsedPrice = parseFloat(pricePerLiter);
    const totalCost = parsedLiters * parsedPrice;

    // Get last fuel log for consumption calc
    const lastLog = await prisma.fuelLog.findFirst({
      where: { truckId },
      orderBy: { date: "desc" },
    });

    let kmSinceLastLoad: number | null = null;
    let consumptionCalc: number | null = null;

    if (kmAtLoad && lastLog?.kmAtLoad) {
      kmSinceLastLoad = parseInt(kmAtLoad) - lastLog.kmAtLoad;
      if (kmSinceLastLoad > 0) {
        consumptionCalc = kmSinceLastLoad / parsedLiters;
      }
    }

    const log = await prisma.fuelLog.create({
      data: {
        truckId,
        userId: null,
        date: new Date(date),
        liters: parsedLiters,
        pricePerLiter: parsedPrice,
        kmAtLoad: kmAtLoad ? parseInt(kmAtLoad) : 0,
        kmSinceLastLoad,
        consumptionCalc,
        engineHours: engineHours ? parseFloat(engineHours) : null,
        driverName: driverName || null,
        location: location || null,
        fuelType: "Diesel BS10",
        totalCost,
        notes: notes || null,
        orgId: truck.orgId,
      },
    });

    // Update truck currentKm if provided and higher
    if (kmAtLoad && parseInt(kmAtLoad) > truck.currentKm) {
      await prisma.truck.update({
        where: { id: truckId },
        data: { currentKm: parseInt(kmAtLoad) },
      });
    }

    // Update truck currentHours if provided and higher
    if (engineHours && parseFloat(engineHours) > truck.currentHours) {
      await prisma.truck.update({
        where: { id: truckId },
        data: { currentHours: parseFloat(engineHours) },
      });
    }

    return NextResponse.json({ log, truck: { plate: truck.plate, internalId: truck.internalId } }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Error al registrar carga" }, { status: 500 });
  }
}
