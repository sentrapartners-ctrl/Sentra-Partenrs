import { Router } from "express";
import { ethers } from "ethers";
import { getDb } from "../db";
import { users, walletSessions } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

const router = Router();

/**
 * Verificar assinatura de mensagem da wallet
 */
function verifySignature(message: string, signature: string, expectedAddress: string): boolean {
  try {
    const recoveredAddress = ethers.verifyMessage(message, signature);
    return recoveredAddress.toLowerCase() === expectedAddress.toLowerCase();
  } catch (error) {
    console.error("Erro ao verificar assinatura:", error);
    return false;
  }
}

/**
 * POST /api/auth/wallet-login
 * Login via wallet Web3 (MetaMask)
 */
router.post("/wallet-login", async (req, res) => {
  try {
    console.log("[Wallet Login] Requisição recebida:", req.body);
    const { walletAddress, message, signature } = req.body;

    if (!walletAddress || !message || !signature) {
      return res.status(400).json({
        message: "Endereço da carteira, mensagem e assinatura são obrigatórios",
      });
    }

    // Verificar assinatura
    console.log("[Wallet Login] Verificando assinatura...");
    const isValid = verifySignature(message, signature, walletAddress);
    console.log("[Wallet Login] Assinatura válida:", isValid);
    if (!isValid) {
      return res.status(401).json({
        message: "Assinatura inválida",
      });
    }

    console.log("[Wallet Login] Obtendo conexão com banco de dados...");
    const db = await getDb();
    console.log("[Wallet Login] Conexão obtida");
    
    if (!db) {
      throw new Error("Banco de dados não disponível");
    }

    // Buscar usuário pelo endereço da wallet
    console.log("[Wallet Login] Buscando usuário com endereço:", walletAddress.toLowerCase());
    let user = await db
      .select()
      .from(users)
      .where(eq(users.walletAddress, walletAddress.toLowerCase()))
      .limit(1);

    // Se não existir, criar novo usuário
    if (user.length === 0) {
      const newUser = {
        walletAddress: walletAddress.toLowerCase(),
        authMethod: "wallet" as const,
        role: "client" as const,
        name: `User ${walletAddress.slice(0, 6)}...`,
        isActive: true,
      };

      const result = await db.insert(users).values(newUser);
      const insertId = Number(result[0].insertId);

      user = await db.select().from(users).where(eq(users.id, insertId));

      // Atribuir gerente automaticamente (round-robin)
      const managers = await db
        .select()
        .from(users)
        .where(eq(users.role, "manager"));

      if (managers.length > 0) {
        // Contar clientes de cada gerente para distribuir igualmente
        const clientCounts = await Promise.all(
          managers.map(async (manager) => {
            const count = await db
              .select()
              .from(users)
              .where(eq(users.managerId, manager.id));
            return { managerId: manager.id, count: count.length };
          })
        );

        // Encontrar gerente com menos clientes
        const managerWithLeastClients = clientCounts.reduce((prev, current) =>
          prev.count < current.count ? prev : current
        );

        // Atribuir gerente
        await db
          .update(users)
          .set({ managerId: managerWithLeastClients.managerId })
          .where(eq(users.id, insertId));

        console.log(
          `✅ Cliente ${insertId} atribuído ao gerente ${managerWithLeastClients.managerId}`
        );
      }
    }

    // Criar sessão de wallet
    await db.insert(walletSessions).values({
      walletAddress: walletAddress.toLowerCase(),
      nonce: message, // A mensagem assinada serve como nonce
      signature,
      isVerified: true, // Já verificamos a assinatura acima
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 dias
    });

    // Criar sessão no Express
    if (req.session) {
      req.session.userId = user[0].id;
      req.session.save();
    }

    res.json({
      message: "Login realizado com sucesso",
      user: {
        id: user[0].id,
        name: user[0].name,
        walletAddress: user[0].walletAddress,
        role: user[0].role,
      },
    });
  } catch (error: any) {
    console.error("[Wallet Login] Erro completo:", error);
    console.error("[Wallet Login] Stack trace:", error.stack);
    res.status(500).json({
      message: "Erro ao fazer login via wallet",
      error: error.message,
    });
  }
});

export default router;

