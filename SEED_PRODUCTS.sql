-- ========================================
-- SCRIPT DE SEED - DADOS DE EXEMPLO
-- Execute DEPOIS de CREATE_ALL_TABLES.sql
-- ========================================

-- ========== SUBSCRIPTION_PLANS ==========
INSERT INTO subscription_plans (name, slug, price, features, active) VALUES
('Básico', 'basico', 49.00, 'Dashboard completo
Até 2 contas MT4/MT5
Análises básicas
Histórico de trades
Suporte por email', true),

('Pro', 'pro', 99.00, 'Tudo do plano Básico
Até 5 contas MT4/MT5
Copy Trading ilimitado
Análises avançadas
Alertas personalizados
Suporte prioritário', true),

('Premium', 'premium', 199.00, 'Tudo do plano Pro
Contas ilimitadas
VPS GRÁTIS (2GB RAM)
Copy Trading avançado
API de integração
Suporte VIP 24/7
Consultoria mensal', true);

-- ========== VPS_PRODUCTS ==========
INSERT INTO vps_products (name, price, ram, cpu, storage, bandwidth, max_mt4_instances, max_mt5_instances, is_free, is_recommended, active) VALUES
('VPS Starter', 29.00, '1GB', '1 vCore', '20GB SSD', '1TB', 2, 2, false, false, true),
('VPS Professional', 49.00, '2GB', '2 vCores', '40GB SSD', '2TB', 5, 5, false, true, true),
('VPS Premium (Grátis)', 0.00, '2GB', '2 vCores', '60GB SSD', '3TB', 10, 10, true, false, true),
('VPS Enterprise', 99.00, '4GB', '4 vCores', '100GB SSD', '5TB', 20, 20, false, false, true);

-- ========== EXPERT_ADVISORS ==========
INSERT INTO expert_advisors (name, description, price, platform, file_url, downloads, active) VALUES
('Scalper Pro EA', 'Expert Advisor de scalping para operações rápidas com gerenciamento de risco integrado', 74.99, 'MT4/MT5', NULL, 0, true),
('Trend Master EA', 'Robô seguidor de tendências de longo prazo com confirmação por múltiplos indicadores', 99.99, 'MT4/MT5', NULL, 0, true),
('Grid Trading EA', 'EA baseado em estratégia de grid com proteção contra drawdown excessivo', 124.99, 'MT4/MT5', NULL, 0, true);

-- ========== LANDING_PAGE_CONTENT ==========
INSERT INTO landing_page_content (section, title, subtitle, content, cta_text, cta_link, active) VALUES
('hero', 'Plataforma Completa de Copy Trading', 'Copie os melhores traders automaticamente', 'Conecte suas contas MT4/MT5 e comece a copiar operações de traders profissionais em tempo real.', 'Começar Agora', '/register', true),
('features', 'Recursos Poderosos', 'Tudo que você precisa para ter sucesso no trading', NULL, NULL, NULL, true),
('pricing', 'Planos e Preços', 'Escolha o plano ideal para você', NULL, 'Ver Planos', '/subscriptions', true);

-- ========================================
-- FIM DO SEED
-- ========================================
