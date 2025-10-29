import axios from 'axios';

const BARK_API_URL = 'https://api.day.app';

export interface BarkNotificationOptions {
  title: string;
  body: string;
  subtitle?: string;
  group?: string;
  icon?: string;
  sound?: string;
  url?: string;
  level?: 'active' | 'timeSensitive' | 'passive' | 'critical';
}

/**
 * Envia notificação via Bark
 */
export async function sendBarkNotification(
  barkKey: string,
  options: BarkNotificationOptions
): Promise<boolean> {
  if (!barkKey) {
    console.warn('Bark key not configured');
    return false;
  }

  try {
    const params: Record<string, string> = {};
    
    if (options.subtitle) params.subtitle = options.subtitle;
    if (options.group) params.group = options.group;
    if (options.icon) params.icon = options.icon;
    if (options.sound) params.sound = options.sound;
    if (options.url) params.url = options.url;
    if (options.level) params.level = options.level;

    // Usar POST para melhor suporte a caracteres especiais
    const response = await axios.post(`${BARK_API_URL}/${barkKey}`, {
      title: options.title,
      body: options.body,
      ...params,
    }, {
      timeout: 10000,
    });

    if (response.status === 200) {
      console.log(`Bark notification sent successfully to ${barkKey}`);
      return true;
    }

    console.error('Bark notification failed:', response.data);
    return false;
  } catch (error) {
    console.error('Error sending Bark notification:', error);
    return false;
  }
}

/**
 * Envia notificação de lucro diário
 */
export async function sendDailyProfitNotification(
  barkKey: string,
  profit: number,
  tradesCount: number,
  winRate: number
): Promise<boolean> {
  const isProfit = profit >= 0;
  const emoji = isProfit ? '📈' : '📉';
  const profitFormatted = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Math.abs(profit));

  return sendBarkNotification(barkKey, {
    title: `${emoji} Resumo do Dia`,
    body: `${isProfit ? 'Lucro' : 'Prejuízo'}: ${profitFormatted}\nTrades: ${tradesCount}\nWin Rate: ${winRate.toFixed(1)}%`,
    group: 'daily-report',
    sound: isProfit ? 'bell' : 'alarm',
    level: 'timeSensitive',
    url: 'https://sentrapartners.com/analytics',
  });
}

/**
 * Envia notificação de lucro semanal
 */
export async function sendWeeklyProfitNotification(
  barkKey: string,
  profit: number,
  tradesCount: number,
  winRate: number,
  bestDay: { date: string; profit: number },
  worstDay: { date: string; profit: number }
): Promise<boolean> {
  const isProfit = profit >= 0;
  const emoji = isProfit ? '🚀' : '⚠️';
  const profitFormatted = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Math.abs(profit));

  const bestDayFormatted = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(bestDay.profit);

  const worstDayFormatted = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(worstDay.profit);

  return sendBarkNotification(barkKey, {
    title: `${emoji} Resumo Semanal`,
    body: `${isProfit ? 'Lucro' : 'Prejuízo'}: ${profitFormatted}\nTrades: ${tradesCount}\nWin Rate: ${winRate.toFixed(1)}%\n\nMelhor dia: ${bestDay.date} (${bestDayFormatted})\nPior dia: ${worstDay.date} (${worstDayFormatted})`,
    group: 'weekly-report',
    sound: isProfit ? 'multiwayinvitation' : 'alarm',
    level: 'timeSensitive',
    url: 'https://sentrapartners.com/analytics',
  });
}

/**
 * Envia notificação de trade fechado
 */
export async function sendTradeClosedNotification(
  barkKey: string,
  trade: {
    symbol: string;
    type: 'BUY' | 'SELL';
    profit: number;
    volume: number;
  }
): Promise<boolean> {
  const isProfit = trade.profit >= 0;
  const emoji = isProfit ? '✅' : '❌';
  const profitFormatted = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Math.abs(trade.profit));

  return sendBarkNotification(barkKey, {
    title: `${emoji} Trade Fechado`,
    body: `${trade.symbol} ${trade.type}\n${isProfit ? 'Lucro' : 'Prejuízo'}: ${profitFormatted}\nVolume: ${(trade.volume / 100).toFixed(2)} lotes`,
    group: 'trades',
    sound: isProfit ? 'bell' : 'minuet',
    url: 'https://sentrapartners.com/trades',
  });
}
