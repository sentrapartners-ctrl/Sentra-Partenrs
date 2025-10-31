-- Migration 009: Criar tabela de conteúdo da landing page
-- Criado em: 2025-10-31

CREATE TABLE IF NOT EXISTS landing_page_content (
  id INT AUTO_INCREMENT PRIMARY KEY,
  section VARCHAR(50) NOT NULL UNIQUE,
  content JSON NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_section (section)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Inserir conteúdo padrão
INSERT IGNORE INTO landing_page_content (section, content) VALUES
('hero', JSON_OBJECT(
  'title', 'Tudo que você sempre quis saber',
  'highlight', 'sobre trading',
  'subtitle', 'A Sentra Partners mostra as métricas que importam e os comportamentos que levam ao lucro com o poder do copy trading, expert advisors e análise avançada.',
  'cta_text', 'Comece Agora Grátis',
  'cta_secondary', 'Ver Demonstração'
)),
('stats', JSON_OBJECT(
  'stat1_value', '99.9%',
  'stat1_label', 'Uptime Garantido',
  'stat2_value', '< 10ms',
  'stat2_label', 'Latência Média',
  'stat3_value', '24/7',
  'stat3_label', 'Suporte Premium',
  'stat4_value', '1000+',
  'stat4_label', 'Traders Ativos'
)),
('copy_trading', JSON_OBJECT(
  'title', 'Copy Trading Poderoso e Automatizado',
  'subtitle', 'Copie as operações dos melhores traders em tempo real'
)),
('analytics', JSON_OBJECT(
  'title', 'Analise suas estatísticas de trading',
  'subtitle', 'Dashboard completo com métricas avançadas'
)),
('vps', JSON_OBJECT(
  'title', 'Servidores VPS de Alta Performance',
  'subtitle', 'Mantenha seus robôs rodando 24/7 com baixa latência'
)),
('eas', JSON_OBJECT(
  'title', 'Robôs de Trading Profissionais',
  'subtitle', 'Expert Advisors otimizados para MT4 e MT5'
)),
('cta_final', JSON_OBJECT(
  'title', 'Pronto para Transformar Seu Trading?',
  'subtitle', 'Junte-se a milhares de traders que já estão lucrando com a Sentra Partners',
  'cta_text', 'Começar Agora',
  'footer_text', '⚡️ 126 pessoas se inscreveram na Sentra Partners nas últimas 4 horas'
));
