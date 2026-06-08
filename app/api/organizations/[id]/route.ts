import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendTelegramAlert, sendWhatsAppAlert } from "@/lib/notifications";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const orgId = (session.user as any).orgId;
  const role = (session.user as any).role;

  if (role !== "ADMIN") {
    return NextResponse.json({ error: "Solo administradores pueden modificar la organización" }, { status: 403 });
  }

  if (params.id !== orgId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { telegramChatId, whatsappNumber } = body;

    const org = await prisma.organization.update({
      where: { id: orgId },
      data: {
        telegramChatId: telegramChatId !== undefined ? telegramChatId || null : undefined,
        whatsappNumber: whatsappNumber !== undefined ? whatsappNumber || null : undefined,
      },
    });

    return NextResponse.json({ org });
  } catch (err) {
    return NextResponse.json({ error: "Error al actualizar organización" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  // Test notification endpoint
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const orgId = (session.user as any).orgId;
  const role = (session.user as any).role;

  if (role !== "ADMIN" || params.id !== orgId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { action } = body;

    if (action !== "test-notifications") {
      return NextResponse.json({ error: "Acción no válida" }, { status: 400 });
    }

    const org = await prisma.organization.findUnique({ where: { id: orgId } });
    if (!org) return NextResponse.json({ error: "Organización no encontrada" }, { status: 404 });

    const testMsg = `✅ <b>FleetIQ Chile</b>\nPrueba de notificaciones exitosa para <b>${org.name}</b>\nFecha: ${new Date().toLocaleString("es-CL")}`;
    const results: Record<string, boolean> = {};

    if (org.telegramChatId) {
      results.telegram = await sendTelegramAlert(org.telegramChatId, testMsg);
    }
    if (org.whatsappNumber) {
      results.whatsapp = await sendWhatsAppAlert(org.whatsappNumber, testMsg.replace(/<[^>]*>/g, ""));
    }

    return NextResponse.json({ results, message: "Prueba enviada" });
  } catch (err) {
    return NextResponse.json({ error: "Error al enviar prueba" }, { status: 500 });
  }
}
