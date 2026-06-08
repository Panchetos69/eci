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

  await prisma.truck.updateMany({
    where: { id: params.id, orgId },
    data: { status: "INACTIVE" },
  });
  return NextResponse.json({ success: true });
}
