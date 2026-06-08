import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { subDays, subMonths, addDays, addMonths } from "date-fns";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding FleetIQ Chile database...");

  // Clean existing data
  await prisma.alert.deleteMany();
  await prisma.stockMovement.deleteMany();
  await prisma.workOrderPart.deleteMany();
  await prisma.checklistItem.deleteMany();
  await prisma.workOrder.deleteMany();
  await prisma.fuelLog.deleteMany();
  await prisma.faultReport.deleteMany();
  await prisma.truckDocument.deleteMany();
  await prisma.inventoryItem.deleteMany();
  await prisma.truck.deleteMany();
  await prisma.user.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.organization.deleteMany();

  // Create organization
  const org = await prisma.organization.create({
    data: {
      name: "Transportes Andinos SpA",
      rut: "76.543.210-9",
      plan: "GROWTH",
    },
  });

  console.log("✅ Organización creada:", org.name);

  // Create users
  const adminPassword = await bcrypt.hash("admin123", 10);
  const supervisorPassword = await bcrypt.hash("super123", 10);
  const mechanicPassword = await bcrypt.hash("mec123", 10);

  const admin = await prisma.user.create({
    data: {
      name: "Carlos Mendoza",
      email: "admin@fleetiq.cl",
      password: adminPassword,
      role: "ADMIN",
      phone: "+56 9 8765 4321",
      orgId: org.id,
    },
  });

  const supervisor = await prisma.user.create({
    data: {
      name: "Ana Riquelme",
      email: "supervisor@fleetiq.cl",
      password: supervisorPassword,
      role: "SUPERVISOR",
      phone: "+56 9 7654 3210",
      orgId: org.id,
    },
  });

  const mechanic = await prisma.user.create({
    data: {
      name: "Pedro Soto",
      email: "mecanico@fleetiq.cl",
      password: mechanicPassword,
      role: "MECHANIC",
      phone: "+56 9 6543 2109",
      orgId: org.id,
    },
  });

  console.log("✅ Usuarios creados");

  // Create supplier
  const supplier = await prisma.supplier.create({
    data: {
      name: "Repuestos Andinos Ltda.",
      contact: "Luis Torres",
      email: "ventas@repuestosandinos.cl",
      phone: "+56 2 2345 6789",
      address: "Av. Industrial 1234, Santiago",
      orgId: org.id,
    },
  });

  // Create trucks
  const trucksData = [
    {
      internalId: "CAM-001",
      plate: "BDLZ-12",
      brand: "Volvo",
      model: "FH16",
      year: 2021,
      vin: "YV2RT8TC4FA123456",
      engine: "D13K520",
      tireSize: "295/80 R22.5",
      maxWeight: "45",
      color: "Blanco",
      status: "ACTIVE" as const,
      currentKm: 125000,
      lastPmKm: 120000,
      pmInterval: 10000,
      fuelEst: 32,
      driverName: "Roberto Fuentes",
      driverRut: "14.567.890-K",
      driverPhone: "+56 9 5432 1098",
      driverLicense: "A3-2019-0456",
    },
    {
      internalId: "CAM-002",
      plate: "HJKT-34",
      brand: "Mercedes-Benz",
      model: "Actros 2658",
      year: 2020,
      vin: "WDB9630351L345678",
      engine: "OM471.900",
      tireSize: "315/70 R22.5",
      maxWeight: "50",
      color: "Azul",
      status: "MAINTENANCE" as const,
      currentKm: 210000,
      lastPmKm: 200000,
      pmInterval: 15000,
      fuelEst: 28,
      driverName: "Marcelo Díaz",
      driverRut: "16.234.567-8",
      driverPhone: "+56 9 4321 0987",
      driverLicense: "A3-2018-0789",
    },
    {
      internalId: "CAM-003",
      plate: "KLMN-56",
      brand: "Scania",
      model: "R500",
      year: 2022,
      vin: "XLEP6X20003456789",
      engine: "DC13 500",
      tireSize: "295/80 R22.5",
      maxWeight: "48",
      color: "Rojo",
      status: "ACTIVE" as const,
      currentKm: 75000,
      lastPmKm: 70000,
      pmInterval: 10000,
      fuelEst: 33,
      driverName: "Jorge Herrera",
      driverRut: "12.345.678-9",
      driverPhone: "+56 9 3210 9876",
      driverLicense: "A3-2020-1234",
    },
    {
      internalId: "CAM-004",
      plate: "PQRS-78",
      brand: "Kenworth",
      model: "T800",
      year: 2019,
      vin: "1XKWDB9X1KJ456789",
      engine: "Paccar MX-13",
      tireSize: "11R22.5",
      maxWeight: "50",
      color: "Blanco",
      status: "ALERT" as const,
      currentKm: 310000,
      lastPmKm: 300000,
      pmInterval: 12000,
      fuelEst: 25,
      driverName: "Luis Campos",
      driverRut: "10.987.654-3",
      driverPhone: "+56 9 2109 8765",
      driverLicense: "A3-2016-5678",
    },
    {
      internalId: "CAM-005",
      plate: "TUVW-90",
      brand: "Freightliner",
      model: "Cascadia",
      year: 2023,
      vin: "1FUJGLDR4CLBK5678",
      engine: "Detroit DD15",
      tireSize: "295/75 R22.5",
      maxWeight: "46",
      color: "Gris",
      status: "ACTIVE" as const,
      currentKm: 25000,
      lastPmKm: 20000,
      pmInterval: 10000,
      fuelEst: 34,
      driverName: "Francisco Muñoz",
      driverRut: "17.890.123-4",
      driverPhone: "+56 9 1098 7654",
      driverLicense: "A3-2022-9012",
    },
  ];

  const trucks = [];
  for (const t of trucksData) {
    const truck = await prisma.truck.create({
      data: {
        ...t,
        nextPmKm: t.lastPmKm + t.pmInterval,
        orgId: org.id,
      },
    });
    trucks.push(truck);
  }

  console.log("✅ Camiones creados:", trucks.length);

  // Create documents for each truck
  const now = new Date();
  const docTypes = [
    { type: "SOAP" as const, offsetDays: 45 },
    { type: "RVT" as const, offsetDays: -5 },  // expired
    { type: "PERMISO_CIRCULACION" as const, offsetDays: 180 },
    { type: "SEGURO_RC" as const, offsetDays: 20 },
  ];

  for (const truck of trucks) {
    for (const doc of docTypes) {
      await prisma.truckDocument.create({
        data: {
          truckId: truck.id,
          type: doc.type,
          expiresAt: addDays(now, doc.offsetDays),
          folio: `F-${Math.floor(Math.random() * 900000) + 100000}`,
        },
      });
    }
  }

  console.log("✅ Documentos creados");

  // Create work orders
  const woData = [
    {
      truckIndex: 0,
      type: "PREVENTIVO" as const,
      status: "COMPLETED" as const,
      priority: "NORMAL" as const,
      description: "Mantención preventiva 120.000 km: cambio aceite, filtros y revisión general",
      kmAtCreate: 120000,
      scheduledAt: subDays(now, 15),
      completedAt: subDays(now, 14),
      laborHours: 4,
      totalCost: 385000,
    },
    {
      truckIndex: 1,
      type: "CORRECTIVO" as const,
      status: "IN_PROGRESS" as const,
      priority: "HIGH" as const,
      description: "Reparación sistema de frenos: cambio pastillas y discos traseros",
      kmAtCreate: 210000,
      scheduledAt: subDays(now, 2),
      laborHours: 6,
      totalCost: null,
    },
    {
      truckIndex: 2,
      type: "PREVENTIVO" as const,
      status: "PENDING" as const,
      priority: "NORMAL" as const,
      description: "Mantención preventiva 70.000 km: cambio aceite motor y caja",
      kmAtCreate: 75000,
      scheduledAt: addDays(now, 5),
      laborHours: null,
      totalCost: null,
    },
    {
      truckIndex: 3,
      type: "EMERGENCIA" as const,
      status: "PENDING" as const,
      priority: "CRITICAL" as const,
      description: "Falla en sistema eléctrico: luces intermitentes y apagado inesperado",
      kmAtCreate: 310000,
      scheduledAt: addDays(now, 1),
      laborHours: null,
      totalCost: null,
    },
    {
      truckIndex: 4,
      type: "REVISION" as const,
      status: "COMPLETED" as const,
      priority: "LOW" as const,
      description: "Revisión técnica inicial del vehículo nuevo",
      kmAtCreate: 20000,
      scheduledAt: subDays(now, 30),
      completedAt: subDays(now, 29),
      laborHours: 2,
      totalCost: 120000,
    },
    {
      truckIndex: 0,
      type: "CORRECTIVO" as const,
      status: "COMPLETED" as const,
      priority: "HIGH" as const,
      description: "Cambio de neumático trasero derecho por desgaste irregular",
      kmAtCreate: 118000,
      scheduledAt: subDays(now, 45),
      completedAt: subDays(now, 44),
      laborHours: 1,
      totalCost: 220000,
    },
  ];

  const workOrders = [];
  for (let i = 0; i < woData.length; i++) {
    const wo = woData[i];
    const workOrder = await prisma.workOrder.create({
      data: {
        number: `OT-${String(i + 1).padStart(4, "0")}`,
        truckId: trucks[wo.truckIndex].id,
        type: wo.type,
        status: wo.status,
        priority: wo.priority,
        mechanicId: mechanic.id,
        description: wo.description,
        kmAtCreate: wo.kmAtCreate,
        scheduledAt: wo.scheduledAt,
        completedAt: wo.completedAt || null,
        laborHours: wo.laborHours || null,
        totalCost: wo.totalCost || null,
        orgId: org.id,
      },
    });
    workOrders.push(workOrder);
  }

  console.log("✅ Órdenes de trabajo creadas:", workOrders.length);

  // Create fuel logs
  const fuelLogsData = [];
  for (let m = 5; m >= 0; m--) {
    for (const truck of trucks) {
      const logsPerMonth = Math.floor(Math.random() * 3) + 2;
      for (let l = 0; l < logsPerMonth; l++) {
        const date = subDays(subMonths(now, m), Math.floor(Math.random() * 25));
        const liters = Math.round((Math.random() * 100 + 250) * 10) / 10;
        const pricePerLiter = Math.round(Math.random() * 50 + 1080);
        fuelLogsData.push({
          truckId: truck.id,
          date,
          liters,
          pricePerLiter,
          kmAtLoad: truck.currentKm - m * truck.pmInterval / 3 - l * 2000,
          fuelType: "Diesel BS10",
          location: ["COPEC Ruta 5 Norte", "PETROBRAS San Bernardo", "ENEX Pudahuel", "COPEC San Antonio"][Math.floor(Math.random() * 4)],
          totalCost: liters * pricePerLiter,
          orgId: org.id,
        });
      }
    }
  }

  for (const log of fuelLogsData) {
    await prisma.fuelLog.create({ data: log as any });
  }

  console.log("✅ Cargas de combustible creadas:", fuelLogsData.length);

  // Create inventory items
  const inventoryItems = [
    { name: "Aceite Motor 15W-40 (20L)", partNumber: "OIL-1540-20", stock: 12, minStock: 4, unit: "balde", costClp: 28500, location: "Estante A1" },
    { name: "Filtro de Aceite Volvo", partNumber: "FLT-VO-OIL", stock: 8, minStock: 5, unit: "unid", costClp: 12000, location: "Estante A2" },
    { name: "Filtro de Combustible Mercedes", partNumber: "FLT-MB-FUEL", stock: 3, minStock: 5, unit: "unid", costClp: 18500, location: "Estante A2" },
    { name: "Pastillas de Freno Trasero Scania", partNumber: "BRAKE-SC-REAR", stock: 4, minStock: 2, unit: "juego", costClp: 85000, location: "Estante B1" },
    { name: "Neumático 295/80 R22.5", partNumber: "TIRE-29580-225", stock: 6, minStock: 4, unit: "unid", costClp: 185000, location: "Bodega" },
    { name: "Correa de Distribución Kenworth", partNumber: "BELT-KW-DIST", stock: 2, minStock: 2, unit: "unid", costClp: 45000, location: "Estante C1" },
    { name: "Batería 24V 140Ah", partNumber: "BAT-24V-140", stock: 1, minStock: 2, unit: "unid", costClp: 95000, location: "Estante D1" },
    { name: "Refrigerante PREMIX (20L)", partNumber: "COOL-PM-20", stock: 15, minStock: 4, unit: "balde", costClp: 22000, location: "Estante A3" },
    { name: "Grasa Multipropósito (18kg)", partNumber: "GREASE-MP-18", stock: 3, minStock: 2, unit: "cubo", costClp: 35000, location: "Estante A4" },
    { name: "Foco LED Faros H7", partNumber: "LIGHT-LED-H7", stock: 0, minStock: 4, unit: "unid", costClp: 12500, location: "Estante E1" },
  ];

  for (const item of inventoryItems) {
    await prisma.inventoryItem.create({
      data: {
        ...item,
        supplierId: supplier.id,
        orgId: org.id,
      },
    });
  }

  console.log("✅ Inventario creado:", inventoryItems.length, "ítems");

  // Create fault reports
  await prisma.faultReport.create({
    data: {
      truckId: trucks[3].id, // CAM-004 ALERT
      reportedById: mechanic.id,
      component: "Sistema Eléctrico",
      faultType: "Falla Intermitente",
      severity: "HIGH",
      description: "Las luces frontales parpadean al superar 80 km/h. Posible falla en módulo de control.",
      kmAtFault: 308000,
      status: "OPEN",
      orgId: org.id,
    },
  });

  await prisma.faultReport.create({
    data: {
      truckId: trucks[1].id, // CAM-002 MAINTENANCE
      reportedById: mechanic.id,
      component: "Sistema de Frenos",
      faultType: "Desgaste Excesivo",
      severity: "HIGH",
      description: "Pastillas de freno trasero desgastadas al 90%. Vibración al frenar.",
      kmAtFault: 209500,
      status: "IN_PROGRESS",
      orgId: org.id,
    },
  });

  console.log("✅ Reportes de fallas creados");

  // Create alerts
  const alertsData = [
    {
      type: "PM_DUE" as const,
      severity: "WARNING" as const,
      title: "PM próximo: CAM-001",
      message: "El camión BDLZ-12 alcanzará los 130.000 km en aprox. 5.000 km. Programar mantención preventiva.",
      truckId: trucks[0].id,
    },
    {
      type: "DOCUMENT_EXPIRY" as const,
      severity: "CRITICAL" as const,
      title: "Revisión Técnica VENCIDA: CAM-001",
      message: "La Revisión Técnica del camión BDLZ-12 venció hace 5 días. Renovar inmediatamente.",
      truckId: trucks[0].id,
    },
    {
      type: "DOCUMENT_EXPIRY" as const,
      severity: "WARNING" as const,
      title: "SOAP próximo a vencer: CAM-002",
      message: "El SOAP del camión HJKT-34 vence en 45 días (fecha: vencimiento próximo).",
      truckId: trucks[1].id,
    },
    {
      type: "FAULT_REPORTED" as const,
      severity: "CRITICAL" as const,
      title: "Falla eléctrica: CAM-004",
      message: "Se reportó falla en sistema eléctrico del camión PQRS-78. Requiere atención inmediata.",
      truckId: trucks[3].id,
    },
    {
      type: "LOW_STOCK" as const,
      severity: "WARNING" as const,
      title: "Stock bajo: Filtro de Combustible Mercedes",
      message: "El ítem 'Filtro de Combustible Mercedes' tiene 3 unidades (mínimo: 5). Realizar pedido.",
      truckId: null,
    },
    {
      type: "LOW_STOCK" as const,
      severity: "CRITICAL" as const,
      title: "Sin stock: Foco LED Faros H7",
      message: "El ítem 'Foco LED Faros H7' no tiene stock disponible. Realizar pedido urgente.",
      truckId: null,
    },
    {
      type: "SYSTEM" as const,
      severity: "INFO" as const,
      title: "Bienvenido a FleetIQ Chile",
      message: "El sistema ha sido configurado exitosamente. Puedes comenzar a registrar tu flota.",
      truckId: null,
      seen: true,
    },
  ];

  for (const alert of alertsData) {
    await prisma.alert.create({
      data: {
        ...alert,
        orgId: org.id,
      },
    });
  }

  console.log("✅ Alertas creadas:", alertsData.length);

  console.log("\n✅ Seed completado exitosamente!");
  console.log("\n📋 Credenciales de acceso:");
  console.log("   Admin:      admin@fleetiq.cl / admin123");
  console.log("   Supervisor: supervisor@fleetiq.cl / super123");
  console.log("   Mecánico:   mecanico@fleetiq.cl / mec123");
}

main()
  .catch((e) => {
    console.error("❌ Error en seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
