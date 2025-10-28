import { Router, Request, Response } from "express";
import { getDb } from "../db";
import { users, userSubscriptions, tradingAccounts } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { nowPaymentsService } from "../services/nowpayments";

const router = Router();

/**
 * Calcula valor proporcional para upgrade
 */
function calculateProRatedUpgrade(
  currentPlanPrice: number,
  newPlanPrice: number,
  daysRemaining: number,
  daysInMonth: number = 30
): number {
  const priceDifference = newPlanPrice - currentPlanPrice;
  const proRatedAmount = (priceDifference / daysInMonth) * daysRemaining;
  return Math.max(0, proRatedAmount);
}

/**
 * POST /api/subscriptions/upgrade
 * Upgrade de plano com cálculo proporcional
 */
router.post("/upgrade", async (req: Request, res: Response) => {
  try {
    const { userId, newPlanId, newPlanPrice } = req.body;

    if (!userId || !newPlanId || !newPlanPrice) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const db = await getDb();

    // Buscar assinatura atual
    const [currentSubscription] = await db
      .select()
      .from(userSubscriptions)
      .where(
        and(
          eq(userSubscriptions.userId, userId),
          eq(userSubscriptions.status, "active")
        )
      )
      .limit(1);

    if (!currentSubscription) {
      return res.status(404).json({ error: "No active subscription found" });
    }

    // Calcular dias restantes
    const now = new Date();
    const endDate = new Date(currentSubscription.endDate);
    const daysRemaining = Math.ceil(
      (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Calcular valor proporcional
    const proRatedAmount = calculateProRatedUpgrade(
      currentSubscription.price,
      newPlanPrice,
      daysRemaining
    );

    // Criar invoice para pagamento proporcional
    const invoice = await nowPaymentsService.createInvoice({
      price_amount: proRatedAmount,
      price_currency: "usd",
      order_id: `upgrade_${userId}_${Date.now()}`,
      order_description: `Upgrade para ${newPlanId} - Valor proporcional (${daysRemaining} dias)`,
      ipn_callback_url: `${process.env.BASE_URL || "https://sentrapartners.com"}/api/subscriptions/webhook`,
      success_url: `${process.env.BASE_URL || "https://sentrapartners.com"}/subscriptions`,
      cancel_url: `${process.env.BASE_URL || "https://sentrapartners.com"}/subscriptions`,
    });

    console.log("[Upgrade Invoice Created]", {
      userId,
      currentPlan: currentSubscription.planId,
      newPlan: newPlanId,
      daysRemaining,
      proRatedAmount,
      invoiceId: invoice.id,
    });

    return res.json({
      success: true,
      proRatedAmount,
      daysRemaining,
      invoiceUrl: invoice.invoice_url,
    });
  } catch (error: any) {
    console.error("[Upgrade Error]", error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/subscriptions/downgrade
 * Downgrade de plano (efetivo na próxima renovação)
 */
router.post("/downgrade", async (req: Request, res: Response) => {
  try {
    const { userId, newPlanId, newPlanPrice } = req.body;

    if (!userId || !newPlanId || !newPlanPrice) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const db = await getDb();

    // Buscar assinatura atual
    const [currentSubscription] = await db
      .select()
      .from(userSubscriptions)
      .where(
        and(
          eq(userSubscriptions.userId, userId),
          eq(userSubscriptions.status, "active")
        )
      )
      .limit(1);

    if (!currentSubscription) {
      return res.status(404).json({ error: "No active subscription found" });
    }

    // Agendar downgrade para próxima renovação
    await db
      .update(userSubscriptions)
      .set({
        pendingPlanId: newPlanId,
        pendingPrice: newPlanPrice,
        updatedAt: new Date(),
      })
      .where(eq(userSubscriptions.id, currentSubscription.id));

    console.log("[Downgrade Scheduled]", {
      userId,
      currentPlan: currentSubscription.planId,
      newPlan: newPlanId,
      effectiveDate: currentSubscription.endDate,
    });

    return res.json({
      success: true,
      message: `Downgrade agendado para ${currentSubscription.endDate}`,
      effectiveDate: currentSubscription.endDate,
    });
  } catch (error: any) {
    console.error("[Downgrade Error]", error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/subscriptions/cancel
 * Cancelar assinatura e remover todos os serviços
 */
router.post("/cancel", async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "Missing userId" });
    }

    const db = await getDb();

    // 1. Cancelar assinatura
    await db
      .update(userSubscriptions)
      .set({
        status: "cancelled",
        cancelledAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(userSubscriptions.userId, userId),
          eq(userSubscriptions.status, "active")
        )
      );

    // 2. Desativar copy trading (marcar contas como inativas)
    await db
      .update(tradingAccounts)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(tradingAccounts.userId, userId));

    // 3. Remover licenças de EAs (será implementado quando tiver tabela de licenças)
    // TODO: Implementar quando criar tabela de EA licenses

    // 4. Desativar VPS (será implementado quando tiver integração com provedor VPS)
    // TODO: Implementar quando criar integração com VPS

    console.log("[Subscription Cancelled]", {
      userId,
      timestamp: new Date(),
    });

    return res.json({
      success: true,
      message: "Assinatura cancelada com sucesso",
      servicesRemoved: [
        "Assinatura cancelada",
        "Copy trading desativado",
        "Contas MT4/MT5 desconectadas",
      ],
    });
  } catch (error: any) {
    console.error("[Cancel Subscription Error]", error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/subscriptions/status/:userId
 * Obter status da assinatura do usuário
 */
router.get("/status/:userId", async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const db = await getDb();

    const [subscription] = await db
      .select()
      .from(userSubscriptions)
      .where(eq(userSubscriptions.userId, parseInt(userId)))
      .orderBy(userSubscriptions.createdAt)
      .limit(1);

    if (!subscription) {
      return res.json({
        hasSubscription: false,
        status: "none",
      });
    }

    // Calcular dias restantes
    const now = new Date();
    const endDate = new Date(subscription.endDate);
    const daysRemaining = Math.ceil(
      (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    return res.json({
      hasSubscription: true,
      subscription: {
        ...subscription,
        daysRemaining,
      },
    });
  } catch (error: any) {
    console.error("[Get Subscription Status Error]", error);
    return res.status(500).json({ error: error.message });
  }
});

export default router;

