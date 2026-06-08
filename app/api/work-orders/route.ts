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
  const type = searchParams.get("type");
  const truckId = searchParams.get("truckId");
  const hasDate = searchParams.get("hasDate");

  const where: any = { orgId };
  if (status) where.status = status;
  if (type) where.type = type;
  if (truckId) where.truckId = truckId;
  if (hasDate) where.scheduledAt = { not: null };

  const workOrders = await prisma.workOrder.findMany({
    where,
    include: {
      truck: { select: { plate: true, brand: true, model: true } },
      mechanic: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ workOrders });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const orgId = (session.user as any).orgId;

  try {
    const body = await req.json();
    const { truckId, type, priority, status, mechanicId, description, kmAtCreate, scheduledAt, laborHours, totalCost, observations } = body;

    if (!truckId || !type) {
      return NextResponse.json({ error: "Campos requeridos: truckId, type" }, { status: 400 });
    }

    // Generate OT number
    const count = await prisma.workOrder.count({ where: { orgId } });
    const number = `OT-${String(count + 1).padStart(4, "0")}`;

    const wo = await prisma.workOrder.create({
      data: {
        number,
        truckId,
        type,
        status: status || "PENDING",
        priority: priority || "NORMAL",
        mechanicId: mechanicId || null,
        description: description || null,
        kmAtCreate: parseInt(kmAtCreate),
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        laborHours: laborHours ? parseFloat(laborHours) : null,
        totalCost: totalCost ? parseFloat(totalCost) : null,
        observations: observations || null,
        orgId,
      },
    });
    return NextResponse.json({ workOrder: wo }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: "Error al crear OT" }, { status: 500 });
  }
}
