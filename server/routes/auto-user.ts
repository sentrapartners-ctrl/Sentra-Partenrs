import { Router } from "express";
import bcrypt from "bcryptjs";
import { getDb } from "../db";
import { users, userPurchases } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

const router = Router();

/**
 * Gera senha aleatória segura
 */
function generateRandomPassword(length: number = 12): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

/**
 * Cria usuário automaticamente após pagamento confirmado
 */
router.post("/create-user-from-payment", async (req, res) => {
  try {
    const { email, name, phone, purchaseId } = req.body;

    console.log("[AUTO USER] Recebido pedido de criação de usuário:", { email, name, phone, purchaseId });

    // Validar dados
    if (!email || !name) {
      return res.status(400).json({ error: "Email e nome são obrigatórios" });
    }

    // Verificar se usuário já existe
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
    
    if (existingUser.length > 0) {
      console.log("[AUTO USER] Usuário já existe:", email);
      return res.json({ 
        success: true, 
        message: "Usuário já existe",
        userId: existingUser[0].id,
        alreadyExists: true
      });
    }

    // Gerar senha aleatória
    const randomPassword = generateRandomPassword();
    const hashedPassword = await bcrypt.hash(randomPassword, 10);

    // Criar usuário
    const [newUser] = await db.insert(users).values({
      email,
      password: hashedPassword,
      name,
      authMethod: "email",
      role: "client",
      isActive: true,
    });

    console.log("[AUTO USER] Usuário criado com sucesso:", {
      userId: newUser.insertId,
      email,
      name
    });

    // Atualizar purchase com userId se fornecido
    if (purchaseId) {
      await db.update(userPurchases)
        .set({ userId: newUser.insertId })
        .where(eq(userPurchases.id, parseInt(purchaseId)));
      
      console.log("[AUTO USER] Purchase atualizado com userId:", newUser.insertId);
    }

    res.json({
      success: true,
      userId: newUser.insertId,
      email,
      password: randomPassword, // Retornar senha para enviar por email
      message: "Usuário criado com sucesso"
    });

  } catch (error: any) {
    console.error("[AUTO USER] Erro ao criar usuário:", error);
    res.status(500).json({ 
      error: "Erro ao criar usuário",
      details: error.message 
    });
  }
});

export default router;

