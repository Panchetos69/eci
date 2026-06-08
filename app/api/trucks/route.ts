import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const orgId = (session.user as any).orgId;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const where: any = { orgId };
  if (status) where.status = status;

  const trucks = await prisma.truck.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ trucks });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const orgId = (session.user as any).orgId;

  try {
    const body = await req.json();
    const { internalId, plate, brand, model, year, ...rest } = body;

    if (!internalId || !plate || !brand || !model || !year) {
      return NextResponse.json({ error: "Campos requeridos: internalId, plate, brand, model, year" }, { status: 400 });
    }

    const currentKm = parseInt(rest.currentKm) || 0;
    const pmInterval = parseInt(rest.pmInterval) || 10000;

    const truck = await prisma.truck.create({
      data: {
        internalId,
        plate: plate.toUpperCase(),
        brand,
        model,
        year: parseInt(year),
        vin: rest.vin || null,
        engine: rest.engine || null,
        tireSize: rest.tireSize || null,
        maxWeight: rest.maxWeight || null,
        color: rest.color || null,
        status: rest.status || "ACTIVE",
        notes: rest.notes || null,
        currentKm,
        pmInterval,
        nextPmKm: currentKm + pmInterval,
        fuelEst: parseFloat(rest.fuelEst) || 30,
        driverName: rest.driverName || null,
        driverRut: rest.driverRut || null,
        driverLicense: rest.driverLicense || null,
        driverPhone: rest.driverPhone || null,
        orgId,
      },
    });
    return NextResponse.json({ truck }, { status: 201 });
  } catch (err: any) {
    if (err.code === "P2002") {
      return NextResponse.json({ error: "Ya existe un camión con esa patente" }, { status: 400 });
    }
    return NextResponse.json({ error: "Error al crear camión" }, { status: 500 });
  }
}
