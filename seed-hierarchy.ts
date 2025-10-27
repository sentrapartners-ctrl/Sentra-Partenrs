import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";
import { users, managerAssignments, subscriptionPlans } from "./drizzle/schema";
import { eq } from "drizzle-orm";

async function seedHierarchy() {
  const connection = await mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "password",
    database: "sentra_partners",
  });

  const db = drizzle(connection);

  console.log("🌱 Populando hierarquia de usuários...\n");

  // Criar 3 admins
  const admins = [
    {
      email: "admin@sentrapartners.com",
      password: await bcrypt.hash("admin123", 10),
      name: "Admin Principal",
      role: "admin" as const,
      isActive: true,
    },
    {
      email: "admin2@sentrapartners.com",
      password: await bcrypt.hash("admin123", 10),
      name: "Admin Secundário",
      role: "admin" as const,
      isActive: true,
    },
    {
      email: "admin3@sentrapartners.com",
      password: await bcrypt.hash("admin123", 10),
      name: "Admin Terciário",
      role: "admin" as const,
      isActive: true,
    },
  ];

  console.log("👑 Criando admins...");
  for (const admin of admins) {
    // Verificar se já existe
    const existing = await db.select().from(users).where(eq(users.email, admin.email));
    if (existing.length === 0) {
      await db.insert(users).values(admin);
      console.log(`✅ Admin criado: ${admin.name} (${admin.email})`);
    } else {
      console.log(`⏭️  Admin já existe: ${admin.email}`);
    }
  }

  // Criar 3 gerentes
  const managers = [
    {
      email: "gerente1@sentrapartners.com",
      password: await bcrypt.hash("gerente123", 10),
      name: "João Silva",
      role: "manager" as const,
      isActive: true,
    },
    {
      email: "gerente2@sentrapartners.com",
      password: await bcrypt.hash("gerente123", 10),
      name: "Maria Santos",
      role: "manager" as const,
      isActive: true,
    },
    {
      email: "gerente3@sentrapartners.com",
      password: await bcrypt.hash("gerente123", 10),
      name: "Pedro Oliveira",
      role: "manager" as const,
      isActive: true,
    },
  ];

  console.log("\n👥 Criando gerentes...");
  for (const manager of managers) {
    const existing = await db.select().from(users).where(eq(users.email, manager.email));
    if (existing.length === 0) {
      await db.insert(users).values(manager);
      console.log(`✅ Gerente criado: ${manager.name} (${manager.email})`);
    } else {
      console.log(`⏭️  Gerente já existe: ${manager.email}`);
    }
  }

  // Buscar IDs dos gerentes criados
  const createdManagers = await db.select().from(users).where(eq(users.role, "manager"));
  console.log(`\n📊 ${createdManagers.length} gerentes disponíveis`);

  // Criar 10 clientes de exemplo
  const clientsData = [
    { name: "Ana Costa", email: "cliente1@example.com" },
    { name: "Carlos Mendes", email: "cliente2@example.com" },
    { name: "Beatriz Lima", email: "cliente3@example.com" },
    { name: "Daniel Souza", email: "cliente4@example.com" },
    { name: "Eduarda Rocha", email: "cliente5@example.com" },
    { name: "Fernando Alves", email: "cliente6@example.com" },
    { name: "Gabriela Martins", email: "cliente7@example.com" },
    { name: "Henrique Pereira", email: "cliente8@example.com" },
    { name: "Isabela Fernandes", email: "cliente9@example.com" },
    { name: "Jorge Carvalho", email: "cliente10@example.com" },
  ];

  console.log("\n👤 Criando clientes...");
  let clientIndex = 0;
  for (const clientData of clientsData) {
    // Distribuir clientes entre gerentes de forma round-robin
    const managerIndex = clientIndex % createdManagers.length;
    const assignedManager = createdManagers[managerIndex];

    const client = {
      email: clientData.email,
      password: await bcrypt.hash("cliente123", 10),
      name: clientData.name,
      role: "client" as const,
      managerId: assignedManager.id,
      isActive: true,
    };

    const existing = await db.select().from(users).where(eq(users.email, client.email));
    if (existing.length === 0) {
      await db.insert(users).values(client);
      console.log(`✅ Cliente criado: ${client.name} (${client.email}) - Gerente: ${assignedManager.name}`);
      
      // Criar registro de atribuição
      await db.insert(managerAssignments).values({
        managerId: assignedManager.id,
        clientId: (await db.select().from(users).where(eq(users.email, client.email)))[0].id,
        assignedBy: 1, // Admin ID
        isActive: true,
        notes: "Atribuição automática inicial",
      });
    } else {
      console.log(`⏭️  Cliente já existe: ${client.email}`);
    }

    clientIndex++;
  }

  // Atualizar planos com preços individuais
  console.log("\n💰 Atualizando planos de assinatura com preços individuais...");
  
  const plansToUpdate = [
    {
      slug: "basico",
      priceMonthly: 4900, // R$ 49,00
      priceQuarterly: 13230, // R$ 132,30 (10% OFF)
      priceSemestral: 23520, // R$ 235,20 (20% OFF)
      priceYearly: 41160, // R$ 411,60 (30% OFF)
      priceLifetime: 49900, // R$ 499,00
    },
    {
      slug: "pro",
      priceMonthly: 9900, // R$ 99,00
      priceQuarterly: 26730, // R$ 267,30 (10% OFF)
      priceSemestral: 47520, // R$ 475,20 (20% OFF)
      priceYearly: 83160, // R$ 831,60 (30% OFF)
      priceLifetime: 99900, // R$ 999,00
    },
    {
      slug: "premium",
      priceMonthly: 19900, // R$ 199,00
      priceQuarterly: 53730, // R$ 537,30 (10% OFF)
      priceSemestral: 95520, // R$ 955,20 (20% OFF)
      priceYearly: 167160, // R$ 1.671,60 (30% OFF)
      priceLifetime: 199900, // R$ 1.999,00
    },
  ];

  for (const planData of plansToUpdate) {
    const plan = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.slug, planData.slug));
    if (plan.length > 0) {
      await db.update(subscriptionPlans)
        .set({
          priceMonthly: planData.priceMonthly,
          priceQuarterly: planData.priceQuarterly,
          priceSemestral: planData.priceSemestral,
          priceYearly: planData.priceYearly,
          priceLifetime: planData.priceLifetime,
        })
        .where(eq(subscriptionPlans.slug, planData.slug));
      console.log(`✅ Plano atualizado: ${planData.slug}`);
    }
  }

  const createdClients = await db.select().from(users).where(eq(users.role, "client"));
  const totalAdmins = await db.select().from(users).where(eq(users.role, "admin"));

  console.log("\n✅ Hierarquia populada com sucesso!");
  console.log(`\n📊 Resumo:`);
  console.log(`- ${totalAdmins.length} Admins`);
  console.log(`- ${createdManagers.length} Gerentes`);
  console.log(`- ${createdClients.length} Clientes`);
  console.log(`\n🔑 Credenciais:`);
  console.log(`Admins: admin@sentrapartners.com / admin123 (admin2, admin3)`);
  console.log(`Gerentes: gerente1@sentrapartners.com / gerente123 (gerente2, gerente3)`);
  console.log(`Clientes: cliente1@example.com / cliente123 (cliente2-10)`);

  await connection.end();
}

seedHierarchy().catch(console.error);

