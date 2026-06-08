import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { MobileNav } from "@/components/layout/mobile-nav";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const orgId = (session.user as any).orgId;
  const alertCount = await prisma.alert.count({ where: { orgId, seen: false } });
  const role = (session.user as any).role;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar role={role} alertCount={alertCount} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar user={session.user as any} alertCount={alertCount} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 pb-20 lg:pb-6">
          {children}
        </main>
      </div>
      <MobileNav role={role} alertCount={alertCount} />
    </div>
  );
}
