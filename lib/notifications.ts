// Sends alerts via Telegram Bot API
// Also has stub for WhatsApp via Twilio

export async function sendTelegramAlert(chatId: string, message: string): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token || !chatId) return false;
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: "HTML" }),
    });
    return res.ok;
  } catch { return false; }
}

export async function sendWhatsAppAlert(to: string, message: string): Promise<boolean> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM;
  if (!sid || !token || !from) return false;
  try {
    const body = new URLSearchParams({ From: `whatsapp:${from}`, To: `whatsapp:${to}`, Body: message });
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: "POST",
      headers: { Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`, "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    return res.ok;
  } catch { return false; }
}

export async function notifyOrg(orgId: string, message: string, prismaClient: any) {
  const org = await prismaClient.organization.findUnique({ where: { id: orgId } });
  if (!org) return;
  const promises = [];
  if (org.telegramChatId) promises.push(sendTelegramAlert(org.telegramChatId, message));
  if (org.whatsappNumber) promises.push(sendWhatsAppAlert(org.whatsappNumber, message));
  await Promise.allSettled(promises);
}
