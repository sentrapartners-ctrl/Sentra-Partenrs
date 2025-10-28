import { Router } from "express";
import { ethers } from "ethers";

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
 * Login via wallet Web3 (MetaMask/Uniswap Wallet)
 * VERSÃO SIMPLIFICADA SEM BANCO DE DADOS
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

    // Criar usuário temporário na sessão (sem banco de dados)
    const tempUser = {
      id: Date.now(), // ID temporário baseado em timestamp
      name: `User ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`,
      walletAddress: walletAddress.toLowerCase(),
      role: "client" as const,
      authMethod: "wallet" as const,
    };

    // Criar sessão no Express
    if (req.session) {
      req.session.userId = tempUser.id;
      // Armazenar dados do usuário na sessão
      (req.session as any).user = tempUser;
      req.session.save();
      console.log("[Wallet Login] Sessão criada para usuário:", tempUser.id);
    }

    res.json({
      message: "Login realizado com sucesso",
      user: {
        id: tempUser.id,
        name: tempUser.name,
        walletAddress: tempUser.walletAddress,
        role: tempUser.role,
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

