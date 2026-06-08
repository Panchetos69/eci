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

  const where: any = { truck: { orgId }, isActive: true };
  if (truckId) where.truckId = truckId;

  const documents = await prisma.truckDocument.findMany({
    where,
    include: { truck: { select: { plate: true } } },
    orderBy: { expiresAt: "asc" },
  });
  return NextResponse.json({ documents });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const orgId = (session.user as any).orgId;

  try {
    const body = await req.json();
    const { truckId, type, expiresAt, folio, notes, fileUrl } = body;

    if (!truckId || !type || !expiresAt) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
    }

    // Verify truck belongs to org
    const truck = await prisma.truck.findFirst({ where: { id: truckId, orgId } });
    if (!truck) return NextResponse.json({ error: "Camión no encontrado" }, { status: 404 });

    const doc = await prisma.truckDocument.create({
      data: {
        truckId,
        type,
        expiresAt: new Date(expiresAt),
        folio: folio || null,
        notes: notes || null,
        fileUrl: fileUrl || null,
      },
    });
    return NextResponse.json({ document: doc }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: "Error al crear documento" }, { status: 500 });
  }
}
