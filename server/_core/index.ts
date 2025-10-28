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
import mt4ConnectorRouter from "../routes/mt4-connector";

import { startCryptoPaymentMonitoring } from "../services/cryptoPaymentMonitor";
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
  // MT4/MT5 API endpoints
  app.use("/api/mt", mtApiRouter);
  // News API endpoints (public)
  app.use("/api", newsApiRouter);
  // EA License validation endpoints
  app.use("/api/ea-license", eaLicenseRouter);
  // Checkout and payment endpoints
  app.use("/api/checkout", checkoutRouter);
  // Subscription management endpoints
  app.use("/api/subscriptions", subscriptionsRouter);
  // MT4 Connector endpoints
  app.use("/api/mt", mt4ConnectorRouter);
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

  server.listen(port, async () => {
    console.log(`Server running on http://localhost:${port}/`);
    
    // Migrations removed - no longer needed
    
    // TEMPORARIAMENTE DESABILITADO: Aguardando correção do schema do banco
    // startCryptoPaymentMonitoring();
    // console.log("💰 Monitoramento de pagamentos cripto iniciado");
  });
}

startServer().catch(console.error);
