import { getDb } from '../db';
import { users, userSubscriptions } from '../../drizzle/schema';
import { eq, and, gt } from 'drizzle-orm';

/**
 * Verifica se usuário tem acesso aos dados da plataforma
 * Retorna true se:
 * - É admin
 * - É manager
 * - É VIP
 * - Tem assinatura ativa
 */
export async function hasDataAccess(userId: number): Promise<boolean> {
  try {
    const db = getDb();

    // Buscar usuário
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return false;
    }

    // Admin, Manager e VIP sempre têm acesso
    if (user.role === 'admin' || user.role === 'manager' || user.role === 'vip') {
      return true;
    }

    // Verificar se tem assinatura ativa
    const [activeSubscription] = await db
      .select()
      .from(userSubscriptions)
      .where(
        and(
          eq(userSubscriptions.userId, userId),
          eq(userSubscriptions.status, 'active'),
          gt(userSubscriptions.endDate, new Date())
        )
      )
      .limit(1);

    return !!activeSubscription;
  } catch (error) {
    console.error('[hasDataAccess] Erro:', error);
    return false;
  }
}
