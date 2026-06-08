"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

export default function MarkAllSeenButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    await fetch("/api/alerts/mark-all-seen", { method: "POST" });
    setLoading(false);
    router.refresh();
  }

  return (
    <Button onClick={handleClick} disabled={loading} variant="outline" size="sm">
      <CheckCircle2 className="h-4 w-4 mr-2" />
      {loading ? "Marcando..." : "Marcar todas como leídas"}
    </Button>
  );
}
