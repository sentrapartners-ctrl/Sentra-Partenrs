import { useState, useEffect } from 'react';

export function useLandingPageContent() {
  const [content, setContent] = useState<any>({
    hero: {
      title: 'Tudo que você sempre quis saber',
      highlight: 'sobre trading',
      subtitle: 'A Sentra Partners mostra as métricas que importam e os comportamentos que levam ao lucro com o poder do copy trading, expert advisors e análise avançada.'
    },
    stats: {
      stat1_value: '99.9%',
      stat1_label: 'Uptime Garantido',
      stat2_value: '< 10ms',
      stat2_label: 'Latência Média',
      stat3_value: '24/7',
      stat3_label: 'Suporte Premium',
      stat4_value: '1000+',
      stat4_label: 'Traders Ativos'
    },
    copy_trading: {
      title: 'Copy Trading Poderoso e Automatizado',
      subtitle: 'Copie as operações dos melhores traders em tempo real'
    },
    analytics: {
      title: 'Analise suas estatísticas de trading',
      subtitle: 'Dashboard completo com métricas avançadas'
    },
    vps: {
      title: 'Servidores VPS de Alta Performance',
      subtitle: 'Mantenha seus robôs rodando 24/7 com baixa latência'
    },
    eas: {
      title: 'Robôs de Trading Profissionais',
      subtitle: 'Expert Advisors otimizados para MT4 e MT5'
    },
    cta_final: {
      title: 'Pronto para Transformar Seu Trading?',
      subtitle: 'Junte-se a milhares de traders que já estão lucrando com a Sentra Partners',
      footer_text: '⚡️ 126 pessoas se inscreveram na Sentra Partners nas últimas 4 horas'
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    try {
      const response = await fetch('/api/landing-page');
      const data = await response.json();
      if (data.success && data.content) {
        setContent(data.content);
      }
    } catch (error) {
      console.error('Erro ao carregar conteúdo da LP:', error);
      // Usa valores padrão em caso de erro
    } finally {
      setLoading(false);
    }
  };

  return { content, loading };
}
