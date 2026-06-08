import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const orgId = (session.user as any).orgId;

  const { searchParams } = new URL(req.url);
  const seen = searchParams.get("seen");
  const where: any = { orgId };
  if (seen !== null) where.seen = seen === "true";

  const alerts = await prisma.alert.findMany({
    where,
    include: { truck: { select: { plate: true } } },
    orderBy: [{ seen: "asc" }, { createdAt: "desc" }],
  });
  return NextResponse.json({ alerts });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const orgId = (session.user as any).orgId;

  try {
    const body = await req.json();
    const { type, severity, title, message, truckId } = body;
    const alert = await prisma.alert.create({
      data: { type, severity, title, message, truckId: truckId || null, orgId },
    });
    return NextResponse.json({ alert }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: "Error al crear alerta" }, { status: 500 });
  }
}
