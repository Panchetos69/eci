import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const orgId = (session.user as any).orgId;

  const truck = await prisma.truck.findFirst({
    where: { id: params.id, orgId },
    include: {
      documents: true,
      workOrders: { orderBy: { createdAt: "desc" }, take: 20 },
      fuelLogs: { orderBy: { date: "desc" }, take: 20 },
    },
  });

  if (!truck) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ truck });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const orgId = (session.user as any).orgId;

  try {
    const body = await req.json();
    const truck = await prisma.truck.updateMany({
      where: { id: params.id, orgId },
      data: body,
    });
    if (truck.count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Error al actualizar" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const orgId = (session.user as any).orgId;
  const role = (session.user as any).role;

  if (role !== "ADMIN") {
    return NextResponse.json({ error: "Solo administradores pueden eliminar camiones" }, { status: 403 });
  }

  // Check for active work orders
  const activeWOs = await prisma.workOrder.count({
    where: { truckId: params.id, orgId, status: { in: ["PENDING", "IN_PROGRESS"] } },
  });

  if (activeWOs > 0) {
    return NextResponse.json({
      error: `No se puede eliminar: el camión tiene ${activeWOs} orden(es) de trabajo activa(s). Cierra o cancela las OTs primero.`,
    }, { status: 409 });
  }

  try {
    // Cascade delete: delete related records first
    const truck = await prisma.truck.findFirst({ where: { id: params.id, orgId } });
    if (!truck) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Delete in order of dependencies
    await prisma.alert.deleteMany({ where: { truckId: params.id } });
    await prisma.faultReport.deleteMany({ where: { truckId: params.id } });
    await prisma.fuelLog.deleteMany({ where: { truckId: params.id } });
    await prisma.truckDocument.deleteMany({ where: { truckId: params.id } });
    await prisma.workOrder.deleteMany({ where: { truckId: params.id } });
    await prisma.truck.delete({ where: { id: params.id } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Delete truck error:", err);
    return NextResponse.json({ error: "Error al eliminar camión" }, { status: 500 });
  }
}
