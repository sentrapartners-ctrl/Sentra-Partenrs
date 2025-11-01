import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import cookieParser from "cookie-parser";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import mtApiRouter from "../mt-api";
import newsApiRouter from "../news-api";
import eaLicenseRouter from "../routes/ea-license";
import checkoutRouter from "../routes/checkout";
import subscriptionsRouter from "../routes/subscriptions";
import mt4Router from "../routes/mt4";
import uploadRouter from "../routes/upload";
import settingsRouter from "../routes/settings";
import copyTradingRouter from "../routes/copy-trading";
import copyTradingSettingsRouter from "../routes/copy-trading-settings";
import signalProvidersRouter from "../routes/signal-providers";
import migrationsRouter from "../routes/migrations";
import websocketTestRouter from "../routes/websocket-test";
import vpsManagementRouter from "../routes/vps-management";
import adminVMsRouter from "../routes/admin-vms";
import subscriptionPlansRouter from "../routes/subscription-plans";
import vpsProductsRouter from "../routes/vps-products";
import expertAdvisorsRouter from "../routes/expert-advisors";
import landingPageRouter from "../routes/landing-page";
import ensureTablesRouter from "../routes/ensure-tables";
import executeSqlRouter from "../routes/execute-sql";
import providerEarningsRouter from "../routes/provider-earnings";
import ntfyRouter from "../routes/ntfy";
import { setupCopyTradingWebSocket } from "../websocket/copyTradingWs";

// import mt4ConnectorRouter from "../routes/mt4-connector";

import { startCryptoPaymentMonitoring } from "../services/cryptoPaymentMonitor";
import { scheduleNotificationCleanup } from "../services/notification-cleanup";
import { scheduleAutomatedReports } from "../services/automated-reports";
import { initNotificationCron } from "../notification-cron";
import { scheduleProviderCleanup } from "../services/cleanup-inactive-providers";
import { scheduleSubscriptionChecks } from "../services/subscription-manager";
import { startHeartbeatChecker } from "../heartbeat-checker";
// import { runMigrations } from "../scripts/runMigrations";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // Cookie parser middleware
  app.use(cookieParser());
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  // MT4/MT5 API endpoints (LEGACY - mantido para compatibilidade)
  // app.use("/api/mt", mtApiRouter);
  // News API endpoints (public)
  app.use("/api", newsApiRouter);
  // EA License validation endpoints
  app.use("/api/ea-license", eaLicenseRouter);
  // Checkout and payment endpoints
  app.use("/api/checkout", checkoutRouter);
  // Subscription management endpoints
  app.use("/api/subscriptions", subscriptionsRouter);
  // MT4 Connector endpoints
  app.use("/api/mt4", mt4Router);
  // Upload endpoints
  app.use("/api/upload", uploadRouter);
  // System settings endpoints
  app.use("/api/settings", settingsRouter);
  // Alias para compatibilidade com EAs antigos
  app.use("/api/settings", settingsRouter);

  app.use("/api/mt", mt4Router);
  app.use("/api/mt/copy", copyTradingRouter);
  app.use("/api/mt/copy", copyTradingSettingsRouter);
  app.use("/api/signal-providers", signalProvidersRouter);
  app.use("/api/migrations", migrationsRouter);
  app.use("/api/websocket", websocketTestRouter);
  app.use("/api/vps", vpsManagementRouter);
  app.use("/api/vps-management", vpsManagementRouter);
  app.use("/api/admin/vms", adminVMsRouter);
  app.use("/api/subscription-plans", subscriptionPlansRouter);
  app.use("/api/vps-products", vpsProductsRouter);
  app.use("/api/expert-advisors", expertAdvisorsRouter);
  app.use("/api/landing-page", landingPageRouter);
  app.use("/api/ensure-tables", ensureTablesRouter);
  app.use("/api/execute-sql", executeSqlRouter);
  app.use("/api/provider-earnings", providerEarningsRouter);
  app.use("/api/ntfy", ntfyRouter);
  // Wallet authentication endpoints

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  // Configurar WebSocket para Copy Trading
  setupCopyTradingWebSocket(server);
  console.log("🔌 WebSocket Copy Trading configurado em /ws/copy-trading");

  server.listen(port, async () => {
    console.log(`Server running on http://localhost:${port}/`);
    
    // Migrations removed - no longer needed
    
    // TEMPORARIAMENTE DESABILITADO: Aguardando correção do schema do banco
    // startCryptoPaymentMonitoring();
    // console.log("💰 Monitoramento de pagamentos cripto iniciado");

    // Iniciar serviços automáticos após 5 segundos (aguardar DB estar pronto)
    setTimeout(() => {
      scheduleNotificationCleanup();
      console.log("🧹 Limpeza automática de notificações iniciada");

      scheduleAutomatedReports();
      console.log("📊 Relatórios automáticos iniciados");

      initNotificationCron();
      
      scheduleSubscriptionChecks();
      console.log("💳 Gerenciador de assinaturas iniciado");
      console.log("🔔 Notificações Bark agendadas iniciadas");

      scheduleProviderCleanup();
      console.log("🧹 Limpeza automática de provedores inativos iniciada");

      startHeartbeatChecker();
      console.log("💓 Heartbeat Checker iniciado (sistema robusto de conexão)");

      const { scheduleDataCleanup } = require("../services/subscription-data-manager");
      scheduleDataCleanup();
      console.log("🧹 Limpeza automática de dados sem assinatura iniciada (30 dias)");
    }, 5000);
  });
}

startServer().catch(console.error);
