"use client";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";

interface FuelChartData {
  month: string;
  liters: number;
  cost: number;
}

interface MaintenanceChartData {
  month: string;
  preventivo: number;
  correctivo: number;
  emergencia: number;
}

interface FleetStatusData {
  name: string;
  value: number;
}

interface DashboardChartsProps {
  fuelData: FuelChartData[];
  maintenanceData: MaintenanceChartData[];
  fleetStatusData: FleetStatusData[];
}

const FLEET_COLORS = ["#22c55e", "#f59e0b", "#f97316", "#ef4444", "#94a3b8"];

const customTooltipStyle = {
  contentStyle: {
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    fontSize: "12px",
    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)"
  },
  labelStyle: { color: "#475569", fontWeight: 600 }
};

export function FuelBarChart({ data }: { data: FuelChartData[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} />
        <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} />
        <Tooltip {...customTooltipStyle} formatter={(v: number) => [v.toLocaleString("es-CL") + " L", "Litros"]} />
        <Bar dataKey="liters" fill="#3b82f6" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function MaintenanceBarChart({ data }: { data: MaintenanceChartData[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} />
        <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} />
        <Tooltip {...customTooltipStyle} />
        <Legend wrapperStyle={{ fontSize: "11px" }} />
        <Bar dataKey="preventivo" name="Preventivo" fill="#22c55e" radius={[2, 2, 0, 0]} stackId="a" />
        <Bar dataKey="correctivo" name="Correctivo" fill="#f59e0b" radius={[2, 2, 0, 0]} stackId="a" />
        <Bar dataKey="emergencia" name="Emergencia" fill="#ef4444" radius={[2, 2, 0, 0]} stackId="a" />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function FleetStatusPieChart({ data }: { data: FleetStatusData[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={85}
          paddingAngle={3}
          dataKey="value"
        >
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={FLEET_COLORS[index % FLEET_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip {...customTooltipStyle} />
        <Legend wrapperStyle={{ fontSize: "11px" }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
