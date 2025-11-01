/**
 * Serviço de Notificações Push usando ntfy.sh
 * 
 * ntfy.sh é um serviço gratuito de notificações push que funciona em:
 * - Android (Google Play)
 * - iPhone (App Store)
 * - Web
 * - Desktop
 * 
 * Como funciona:
 * 1. Cada usuário tem um tópico único (ex: sentra-user-123)
 * 2. O backend envia notificações HTTP POST para https://ntfy.sh/{topico}
 * 3. O cliente instala o app ntfy e se inscreve no tópico dele
 * 4. Notificações chegam instantaneamente no celular
 */

interface NtfyNotification {
  title?: string;
  message: string;
  priority?: 'max' | 'urgent' | 'high' | 'default' | 'low' | 'min';
  tags?: string[];
  click?: string; // URL para abrir ao clicar
  actions?: Array<{
    action: 'view' | 'http';
    label: string;
    url: string;
    method?: 'GET' | 'POST' | 'PUT';
  }>;
  attach?: string; // URL de anexo (imagem, PDF, etc)
  icon?: string; // URL do ícone
  delay?: string; // Agendar notificação (ex: "30min", "9am")
}

class NtfyService {
  private baseUrl = 'https://ntfy.sh';
  
  /**
   * Gera um tópico único para um usuário
   */
  getUserTopic(userId: number): string {
    return `sentra-user-${userId}`;
  }

  /**
   * Envia uma notificação para um usuário específico
   */
  async sendToUser(userId: number, notification: NtfyNotification): Promise<boolean> {
    const topic = this.getUserTopic(userId);
    return this.sendToTopic(topic, notification);
  }

  /**
   * Envia uma notificação para um tópico específico
   */
  async sendToTopic(topic: string, notification: NtfyNotification): Promise<boolean> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'text/plain; charset=utf-8',
      };

      // Adiciona título se fornecido
      if (notification.title) {
        headers['Title'] = notification.title;
      }

      // Adiciona prioridade
      if (notification.priority) {
        headers['Priority'] = notification.priority;
      }

      // Adiciona tags (emojis, categorias)
      if (notification.tags && notification.tags.length > 0) {
        headers['Tags'] = notification.tags.join(',');
      }

      // Adiciona URL para clicar
      if (notification.click) {
        headers['Click'] = notification.click;
      }

      // Adiciona anexo
      if (notification.attach) {
        headers['Attach'] = notification.attach;
      }

      // Adiciona ícone
      if (notification.icon) {
        headers['Icon'] = notification.icon;
      }

      // Adiciona delay (agendamento)
      if (notification.delay) {
        headers['Delay'] = notification.delay;
      }

      // Adiciona botões de ação
      if (notification.actions && notification.actions.length > 0) {
        headers['Actions'] = notification.actions
          .map(action => {
            if (action.action === 'view') {
              return `view, ${action.label}, ${action.url}`;
            } else if (action.action === 'http') {
              return `http, ${action.label}, ${action.url}, method=${action.method || 'POST'}`;
            }
            return '';
          })
          .filter(Boolean)
          .join('; ');
      }

      const response = await fetch(`${this.baseUrl}/${topic}`, {
        method: 'POST',
        headers,
        body: notification.message,
      });

      if (!response.ok) {
        console.error('[ntfy] Erro ao enviar notificação:', response.statusText);
        return false;
      }

      console.log(`[ntfy] Notificação enviada para tópico: ${topic}`);
      return true;
    } catch (error) {
      console.error('[ntfy] Erro ao enviar notificação:', error);
      return false;
    }
  }

  /**
   * Envia notificação de trade fechado
   */
  async notifyTradeClosed(
    userId: number,
    data: {
      symbol: string;
      type: 'BUY' | 'SELL';
      profit: number;
      volume: number;
      accountNumber: string;
    }
  ): Promise<boolean> {
    const profitFormatted = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'USD',
    }).format(data.profit);

    const isProfit = data.profit > 0;
    const emoji = isProfit ? '💰' : '📉';
    const resultText = isProfit ? 'LUCRO' : 'PREJUÍZO';

    return this.sendToUser(userId, {
      title: `${emoji} Trade Fechado - ${data.symbol}`,
      message: `${resultText}: ${profitFormatted}\n${data.type} ${data.volume} lotes\nConta: ${data.accountNumber}`,
      priority: isProfit ? 'default' : 'high',
      tags: [isProfit ? 'money_with_wings' : 'chart_with_downwards_trend', 'trading'],
      click: 'https://sentrapartners.com/trades',
      actions: [
        {
          action: 'view',
          label: 'Ver Detalhes',
          url: 'https://sentrapartners.com/trades',
        },
      ],
    });
  }

  /**
   * Envia notificação de drawdown atingido
   */
  async notifyDrawdownAlert(
    userId: number,
    data: {
      currentDrawdown: number;
      limit: number;
      accountNumber: string;
    }
  ): Promise<boolean> {
    return this.sendToUser(userId, {
      title: '⚠️ ALERTA DE DRAWDOWN',
      message: `Drawdown atual: ${data.currentDrawdown.toFixed(2)}%\nLimite: ${data.limit.toFixed(2)}%\nConta: ${data.accountNumber}`,
      priority: 'urgent',
      tags: ['warning', 'rotating_light'],
      click: 'https://sentrapartners.com/accounts',
      actions: [
        {
          action: 'view',
          label: 'Ver Conta',
          url: 'https://sentrapartners.com/accounts',
        },
      ],
    });
  }

  /**
   * Envia notificação de conexão perdida
   */
  async notifyConnectionLost(
    userId: number,
    data: {
      accountNumber: string;
      broker: string;
    }
  ): Promise<boolean> {
    return this.sendToUser(userId, {
      title: '🔌 Conexão Perdida',
      message: `A conexão com sua conta foi perdida.\nConta: ${data.accountNumber}\nBroker: ${data.broker}`,
      priority: 'high',
      tags: ['warning', 'electric_plug'],
      click: 'https://sentrapartners.com/accounts',
    });
  }

  /**
   * Envia relatório diário
   */
  async sendDailyReport(
    userId: number,
    data: {
      totalTrades: number;
      winRate: number;
      profit: number;
      date: string;
    }
  ): Promise<boolean> {
    const profitFormatted = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'USD',
    }).format(data.profit);

    const isProfit = data.profit > 0;
    const emoji = isProfit ? '📈' : '📉';

    return this.sendToUser(userId, {
      title: `${emoji} Relatório Diário - ${data.date}`,
      message: `Trades: ${data.totalTrades}\nWin Rate: ${data.winRate.toFixed(1)}%\nLucro: ${profitFormatted}`,
      priority: 'default',
      tags: ['chart', 'memo'],
      click: 'https://sentrapartners.com/analytics',
      actions: [
        {
          action: 'view',
          label: 'Ver Análises',
          url: 'https://sentrapartners.com/analytics',
        },
      ],
    });
  }

  /**
   * Envia relatório semanal
   */
  async sendWeeklyReport(
    userId: number,
    data: {
      totalTrades: number;
      winRate: number;
      profit: number;
      weekStart: string;
      weekEnd: string;
    }
  ): Promise<boolean> {
    const profitFormatted = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'USD',
    }).format(data.profit);

    const isProfit = data.profit > 0;
    const emoji = isProfit ? '🎉' : '📊';

    return this.sendToUser(userId, {
      title: `${emoji} Relatório Semanal`,
      message: `${data.weekStart} - ${data.weekEnd}\n\nTrades: ${data.totalTrades}\nWin Rate: ${data.winRate.toFixed(1)}%\nLucro: ${profitFormatted}`,
      priority: 'default',
      tags: ['chart_with_upwards_trend', 'calendar'],
      click: 'https://sentrapartners.com/analytics',
      actions: [
        {
          action: 'view',
          label: 'Ver Análises',
          url: 'https://sentrapartners.com/analytics',
        },
      ],
    });
  }

  /**
   * Envia notificação de teste
   */
  async sendTestNotification(userId: number): Promise<boolean> {
    return this.sendToUser(userId, {
      title: '✅ Notificação de Teste',
      message: 'Se você recebeu esta notificação, tudo está funcionando perfeitamente! 🎉',
      priority: 'default',
      tags: ['white_check_mark', 'tada'],
      click: 'https://sentrapartners.com',
    });
  }
}

// Exporta instância única (singleton)
export const ntfyService = new NtfyService();
