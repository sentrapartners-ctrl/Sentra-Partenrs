import { mysqlTable, int, varchar, boolean, timestamp } from 'drizzle-orm/mysql-core';

export const systemSettings = mysqlTable('system_settings', {
  id: int('id').primaryKey().autoincrement(),
  key: varchar('key', { length: 100 }).notNull().unique(),
  value: varchar('value', { length: 500 }).notNull(),
  description: varchar('description', { length: 255 }),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

// Configurações padrão
export const defaultSettings = {
  // Intervalo do heartbeat em segundos (padrão: 1 hora = 3600s)
  heartbeat_interval: '3600',
  
  // Horários de sincronização completa (formato: HH:MM, separados por vírgula)
  sync_schedule: '07:00,14:00,21:00',
  
  // Ativar sincronização automática
  auto_sync_enabled: 'true',
  
  // Enviar histórico completo no heartbeat (true/false)
  send_full_history: 'false',
  
  // Limitar histórico (dias, 0 = ilimitado)
  history_limit_days: '90',
};
