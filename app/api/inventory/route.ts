import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const orgId = (session.user as any).orgId;

  const items = await prisma.inventoryItem.findMany({
    where: { orgId },
    include: { supplier: { select: { name: true } } },
    orderBy: { name: "asc" },
  });
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const orgId = (session.user as any).orgId;

  try {
    const body = await req.json();
    const { name, partNumber, stock, minStock, unit, costClp, location, supplierId, notes } = body;

    const item = await prisma.inventoryItem.create({
      data: {
        name,
        partNumber: partNumber || null,
        stock: parseFloat(stock) || 0,
        minStock: parseFloat(minStock) || 1,
        unit: unit || "unid",
        costClp: parseFloat(costClp) || 0,
        location: location || null,
        supplierId: supplierId || null,
        notes: notes || null,
        orgId,
      },
    });
    return NextResponse.json({ item }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: "Error al crear ítem" }, { status: 500 });
  }
}
