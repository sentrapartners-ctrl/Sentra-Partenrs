import { getDb } from './server/db.js';
import { users } from './drizzle/schema.js';
import { eq } from 'drizzle-orm';

async function checkElianeRole() {
  try {
    const db = getDb();
    
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, 'Elianeantonio31@hotmail.com'))
      .limit(1);
    
    if (!user) {
      console.log('❌ Usuária não encontrada!');
      return;
    }
    
    console.log('✅ Usuária encontrada:');
    console.log('ID:', user.id);
    console.log('Email:', user.email);
    console.log('Nome:', user.name);
    console.log('Role:', user.role);
    console.log('Role type:', typeof user.role);
    console.log('Is VIP?:', user.role === 'vip');
    console.log('Is active?:', user.isActive);
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    process.exit(0);
  }
}

checkElianeRole();
