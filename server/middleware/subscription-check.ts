import { Request, Response, NextFunction } from 'express';
import { getDb } from '../db';
import { userSubscriptions, subscriptionPlans } from '../../drizzle/schema';
import { eq, and, gt } from 'drizzle-orm';

export interface SubscriptionInfo {
  hasActiveSubscription: boolean;
  plan?: any;
  subscription?: any;
  limits: {
    maxAccounts: number;
    copyTradingEnabled: boolean;
    advancedAnalyticsEnabled: boolean;
    freeVpsEnabled: boolean;
    prioritySupport: boolean;
  };
}

/**
 * Middleware para verificar se usuário tem assinatura ativa
 * Adiciona informações da assinatura em req.subscription
 */
export async function checkSubscription(
  req: Request & { subscription?: SubscriptionInfo },
  res: Response,
  next: NextFunction
) {
  try {
    const userId = (req as any).userId || (req as any).user?.id;

    if (!userId) {
      req.subscription = {
        hasActiveSubscription: false,
        limits: {
          maxAccounts: 0,
          copyTradingEnabled: false,
          advancedAnalyticsEnabled: false,
          freeVpsEnabled: false,
          prioritySupport: false,
        },
      };
      return next();
    }

    const db = getDb();

    // Buscar assinatura ativa do usuário
    const [activeSubscription] = await db
      .select({
        subscription: userSubscriptions,
        plan: subscriptionPlans,
      })
      .from(userSubscriptions)
      .innerJoin(
        subscriptionPlans,
        eq(userSubscriptions.planId, subscriptionPlans.id)
      )
      .where(
        and(
          eq(userSubscriptions.userId, userId),
          eq(userSubscriptions.status, 'active'),
          gt(userSubscriptions.endDate, new Date()) // Não expirada
        )
      )
      .limit(1);

    if (!activeSubscription) {
      req.subscription = {
        hasActiveSubscription: false,
        limits: {
          maxAccounts: 0,
          copyTradingEnabled: false,
          advancedAnalyticsEnabled: false,
          freeVpsEnabled: false,
          prioritySupport: false,
        },
      };
    } else {
      req.subscription = {
        hasActiveSubscription: true,
        plan: activeSubscription.plan,
        subscription: activeSubscription.subscription,
        limits: {
          maxAccounts: activeSubscription.plan.maxAccounts || 0,
          copyTradingEnabled: activeSubscription.plan.copyTradingEnabled || false,
          advancedAnalyticsEnabled: activeSubscription.plan.advancedAnalyticsEnabled || false,
          freeVpsEnabled: activeSubscription.plan.freeVpsEnabled || false,
          prioritySupport: activeSubscription.plan.prioritySupport || false,
        },
      };
    }

    next();
  } catch (error) {
    console.error('[Subscription Check] Erro:', error);
    // Em caso de erro, permitir acesso mas sem assinatura
    req.subscription = {
      hasActiveSubscription: false,
      limits: {
        maxAccounts: 0,
        copyTradingEnabled: false,
        advancedAnalyticsEnabled: false,
        freeVpsEnabled: false,
        prioritySupport: false,
      },
    };
    next();
  }
}

/**
 * Middleware para EXIGIR assinatura ativa
 * Bloqueia acesso se não tiver assinatura
 */
export function requireActiveSubscription(
  req: Request & { subscription?: SubscriptionInfo },
  res: Response,
  next: NextFunction
) {
  if (!req.subscription?.hasActiveSubscription) {
    return res.status(403).json({
      success: false,
      error: 'Assinatura ativa necessária',
      message: 'Você precisa de uma assinatura ativa para acessar este recurso. Por favor, renove sua assinatura.',
      code: 'SUBSCRIPTION_REQUIRED',
    });
  }
  next();
}

/**
 * Middleware para exigir copy trading habilitado no plano
 */
export function requireCopyTrading(
  req: Request & { subscription?: SubscriptionInfo },
  res: Response,
  next: NextFunction
) {
  if (!req.subscription?.limits.copyTradingEnabled) {
    return res.status(403).json({
      success: false,
      error: 'Copy Trading não disponível no seu plano',
      message: 'Faça upgrade para um plano que inclui Copy Trading.',
      code: 'COPY_TRADING_NOT_ENABLED',
    });
  }
  next();
}

/**
 * Verificar se usuário atingiu limite de contas
 */
export async function checkAccountLimit(userId: number): Promise<{
  canAddAccount: boolean;
  currentCount: number;
  maxAccounts: number;
  message?: string;
}> {
  try {
    const db = getDb();

    // Buscar assinatura ativa
    const [activeSubscription] = await db
      .select({
        plan: subscriptionPlans,
      })
      .from(userSubscriptions)
      .innerJoin(
        subscriptionPlans,
        eq(userSubscriptions.planId, subscriptionPlans.id)
      )
      .where(
        and(
          eq(userSubscriptions.userId, userId),
          eq(userSubscriptions.status, 'active'),
          gt(userSubscriptions.endDate, new Date())
        )
      )
      .limit(1);

    if (!activeSubscription) {
      return {
        canAddAccount: false,
        currentCount: 0,
        maxAccounts: 0,
        message: 'Você precisa de uma assinatura ativa para adicionar contas.',
      };
    }

    const maxAccounts = activeSubscription.plan.maxAccounts || 0;

    // Contar contas atuais do usuário
    const { tradingAccounts } = await import('../../drizzle/schema');
    const accounts = await db
      .select()
      .from(tradingAccounts)
      .where(eq(tradingAccounts.userId, userId));

    const currentCount = accounts.length;

    // -1 significa ilimitado
    if (maxAccounts === -1) {
      return {
        canAddAccount: true,
        currentCount,
        maxAccounts: -1,
      };
    }

    if (currentCount >= maxAccounts) {
      return {
        canAddAccount: false,
        currentCount,
        maxAccounts,
        message: `Você atingiu o limite de ${maxAccounts} conta(s) do seu plano. Faça upgrade para adicionar mais contas.`,
      };
    }

    return {
      canAddAccount: true,
      currentCount,
      maxAccounts,
    };
  } catch (error) {
    console.error('[Check Account Limit] Erro:', error);
    return {
      canAddAccount: false,
      currentCount: 0,
      maxAccounts: 0,
      message: 'Erro ao verificar limite de contas.',
    };
  }
}
