import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const orgId = (session.user as any).orgId;

  // Verify truck belongs to org
  const truck = await prisma.truck.findFirst({ where: { id: params.id, orgId } });
  if (!truck) return NextResponse.json({ error: "Camión no encontrado" }, { status: 404 });

  const documents = await prisma.truckDocument.findMany({
    where: { truckId: params.id },
    orderBy: { expiresAt: "asc" },
  });

  return NextResponse.json({ documents });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const orgId = (session.user as any).orgId;

  // Verify truck belongs to org
  const truck = await prisma.truck.findFirst({ where: { id: params.id, orgId } });
  if (!truck) return NextResponse.json({ error: "Camión no encontrado" }, { status: 404 });

  try {
    const body = await req.json();
    const { type, expiresAt, folio, notes } = body;

    if (!type || !expiresAt) {
      return NextResponse.json({ error: "Tipo y fecha de vencimiento son requeridos" }, { status: 400 });
    }

    const doc = await prisma.truckDocument.create({
      data: {
        truckId: params.id,
        type,
        expiresAt: new Date(expiresAt),
        folio: folio || null,
        notes: notes || null,
      },
    });

    return NextResponse.json({ document: doc }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: "Error al crear documento" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const orgId = (session.user as any).orgId;

  const { searchParams } = new URL(req.url);
  const docId = searchParams.get("docId");

  if (!docId) {
    return NextResponse.json({ error: "docId requerido" }, { status: 400 });
  }

  // Verify truck belongs to org
  const truck = await prisma.truck.findFirst({ where: { id: params.id, orgId } });
  if (!truck) return NextResponse.json({ error: "Camión no encontrado" }, { status: 404 });

  // Verify doc belongs to truck
  const doc = await prisma.truckDocument.findFirst({ where: { id: docId, truckId: params.id } });
  if (!doc) return NextResponse.json({ error: "Documento no encontrado" }, { status: 404 });

  await prisma.truckDocument.delete({ where: { id: docId } });
  return NextResponse.json({ success: true });
}
