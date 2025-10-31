-- Conceder permissões manuais ao cliente de teste
-- Permite usar todas as funcionalidades sem assinatura ativa

UPDATE users
SET manual_permissions = JSON_OBJECT(
  'copy_trading', true,
  'signal_provider', true,
  'vps', true,
  'expert_advisors', true,
  'granted_by', 'admin@sentrapartners.com',
  'granted_at', NOW(),
  'notes', 'Cliente de teste - acesso total para validação do sistema'
)
WHERE email = 'teste@teste.com';

-- Verificar se foi aplicado
SELECT 
  id,
  email,
  name,
  role,
  manual_permissions,
  isActive
FROM users
WHERE email = 'teste@teste.com';
