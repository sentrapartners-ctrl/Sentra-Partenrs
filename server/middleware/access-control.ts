import { getDb } from '../db';
import { users, userSubscriptions } from '../../drizzle/schema';
import { eq, and, gt } from 'drizzle-orm';

/**
 * Verifica se usuário tem acesso aos dados da plataforma
 * Retorna true se:
 * - É admin
 * - É manager  
 * - É VIP (cliente especial sem necessidade de assinatura)
 * - Tem assinatura ativa
 */
export async function hasDataAccess(userId: number): Promise<boolean> {
  try {
    const db = await getDb();
    if (!db) {
      console.log('[hasDataAccess] Database not available');
      return false;
    }

    // Buscar usuário
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    console.log('[hasDataAccess] ========== INICIO ==========');
    console.log('[hasDataAccess] User ID:', userId);
    console.log('[hasDataAccess] User found:', !!user);
    if (user) {
      console.log('[hasDataAccess] User email:', user.email);
      console.log('[hasDataAccess] User role:', user.role);
      console.log('[hasDataAccess] User role type:', typeof user.role);
      console.log('[hasDataAccess] Is admin?', user.role === 'admin');
      console.log('[hasDataAccess] Is manager?', user.role === 'manager');
      console.log('[hasDataAccess] Is VIP?', user.role === 'vip');
    }

    if (!user) {
      console.log('[hasDataAccess] User not found');
      return false;
    }

    // Admin, Manager e VIP sempre têm acesso
    if (user.role === 'admin' || user.role === 'manager' || user.role === 'vip') {
      console.log('[hasDataAccess] Access granted by role:', user.role);
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

    const hasAccess = !!activeSubscription;
    console.log('[hasDataAccess] Active subscription:', hasAccess);
    console.log('[hasDataAccess] Final result:', hasAccess);
    return hasAccess;
  } catch (error) {
    console.error('[hasDataAccess] Erro:', error);
    return false;
  }
}
