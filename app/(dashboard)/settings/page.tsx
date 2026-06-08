import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { fmtDate } from "@/lib/utils";
import { Settings, Users, Building, Shield, Bell } from "lucide-react";
import NotificationSettings from "./NotificationSettings";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  const orgId = (session?.user as any)?.orgId;
  const role = (session?.user as any)?.role;

  const [org, users] = await Promise.all([
    prisma.organization.findUnique({ where: { id: orgId } }),
    prisma.user.findMany({
      where: { orgId },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const roleLabel: Record<string, string> = {
    ADMIN: "Administrador",
    SUPERVISOR: "Supervisor",
    MECHANIC: "Mecánico",
  };

  const planLabel: Record<string, string> = {
    STARTER: "Starter",
    GROWTH: "Growth",
    PROFESSIONAL: "Professional",
    ENTERPRISE: "Enterprise",
  };

  if (role !== "ADMIN") {
    return (
      <div className="text-center py-20">
        <Shield className="h-12 w-12 mx-auto text-slate-300 mb-4" />
        <h2 className="text-xl font-semibold text-slate-600">Acceso Restringido</h2>
        <p className="text-slate-400 text-sm mt-2">Solo los administradores pueden acceder a esta sección.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Configuración</h1>
        <p className="text-sm text-slate-500">Administra tu organización y usuarios</p>
      </div>

      {/* Organization */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building className="h-5 w-5 text-slate-400" />
            <CardTitle>Información de la Organización</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-slate-500 mb-0.5">Nombre</p>
              <p className="font-semibold text-slate-800">{org?.name}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-0.5">RUT</p>
              <p className="font-semibold text-slate-800">{org?.rut}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-0.5">Plan</p>
              <Badge variant="default">{planLabel[org?.plan || "STARTER"] || org?.plan}</Badge>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-0.5">Miembro desde</p>
              <p className="text-slate-700">{org?.createdAt ? fmtDate(org.createdAt) : "—"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-slate-400" />
            <CardTitle>Notificaciones</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <NotificationSettings
            orgId={orgId}
            initialTelegramChatId={org?.telegramChatId || ""}
            initialWhatsappNumber={org?.whatsappNumber || ""}
          />
        </CardContent>
      </Card>

      {/* Users */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-slate-400" />
              <CardTitle>Usuarios ({users.length})</CardTitle>
            </div>
          </div>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Usuario</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Rol</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Teléfono</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Estado</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Creado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-sm flex-shrink-0">
                        {user.name.charAt(0)}
                      </div>
                      <span className="font-medium text-slate-800">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{user.email}</td>
                  <td className="px-4 py-3">
                    <Badge variant={user.role === "ADMIN" ? "default" : user.role === "SUPERVISOR" ? "info" : "gray"}>
                      {roleLabel[user.role] || user.role}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{user.phone || "—"}</td>
                  <td className="px-4 py-3">
                    <Badge variant={user.active ? "success" : "danger"}>
                      {user.active ? "Activo" : "Inactivo"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{fmtDate(user.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* System info */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-slate-400" />
            <CardTitle>Información del Sistema</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-slate-500 mb-0.5">Versión</p>
              <p className="font-medium text-slate-700">FleetIQ Chile v1.0.0</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-0.5">Stack</p>
              <p className="font-medium text-slate-700">Next.js 14 + Prisma + PostgreSQL</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-0.5">Ambiente</p>
              <p className="font-medium text-slate-700">{process.env.NODE_ENV}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
