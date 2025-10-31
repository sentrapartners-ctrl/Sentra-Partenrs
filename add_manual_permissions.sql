-- Adicionar coluna de permissões manuais na tabela users
-- Permite admin autorizar clientes a usar funcionalidades mesmo sem assinatura

ALTER TABLE users
  ADD COLUMN manual_permissions JSON NULL COMMENT 'Permissões manuais concedidas pelo admin (JSON)';

-- Exemplo de estrutura JSON:
-- {
--   "copy_trading": true,
--   "signal_provider": true,
--   "vps": true,
--   "expert_advisors": true,
--   "granted_by": "admin@example.com",
--   "granted_at": "2025-10-31T16:00:00Z",
--   "notes": "Cliente VIP - acesso total"
-- }

-- Índice para melhorar performance
CREATE INDEX idx_users_manual_permissions ON users((CAST(manual_permissions AS CHAR(255)) COLLATE utf8mb4_bin));
