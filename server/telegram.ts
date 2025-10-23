/**
 * Serviço de notificações via Telegram
 * 
 * Para configurar:
 * 1. Crie um bot com @BotFather no Telegram
 * 2. Copie o token do bot
 * 3. Adicione o token nas variáveis de ambiente: TELEGRAM_BOT_TOKEN
 * 4. Inicie uma conversa com o bot e envie /start
 * 5. Obtenha seu chat_id visitando: https://api.telegram.org/bot<TOKEN>/getUpdates
 * 6. Salve o chat_id no banco de dados (tabela user_settings)
 */

interface TelegramMessage {
  chat_id: string;
  text: string;
  parse_mode?: "HTML" | "Markdown";
}

export async function sendTelegramMessage(
  chatId: string,
  message: string,
  parseMode: "HTML" | "Markdown" = "HTML"
): Promise<boolean> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;

  if (!botToken) {
    console.warn("[Telegram] Bot token not configured. Set TELEGRAM_BOT_TOKEN environment variable.");
    return false;
  }

  if (!chatId) {
    console.warn("[Telegram] Chat ID not provided");
    return false;
  }

  try {
    const payload: TelegramMessage = {
      chat_id: chatId,
      text: message,
      parse_mode: parseMode,
    };

    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    const data = await response.json();

    if (!response.ok || !data.ok) {
      console.error("[Telegram] Failed to send message:", data);
      return false;
    }

    console.log("[Telegram] Message sent successfully to chat:", chatId);
    return true;
  } catch (error) {
    console.error("[Telegram] Error sending message:", error);
    return false;
  }
}

/**
 * Envia alerta de drawdown
 */
export async function sendDrawdownAlert(
  chatId: string,
  accountNumber: string,
  currentDrawdown: number,
  threshold: number
) {
  const message = `
🚨 <b>ALERTA DE DRAWDOWN</b>

Conta: <code>${accountNumber}</code>
Drawdown Atual: <b>${currentDrawdown.toFixed(2)}%</b>
Limite Configurado: ${threshold.toFixed(2)}%

⚠️ O drawdown ultrapassou o limite configurado!
`;

  return await sendTelegramMessage(chatId, message);
}

/**
 * Envia alerta de conexão perdida
 */
export async function sendConnectionAlert(
  chatId: string,
  accountNumber: string,
  terminalId: string
) {
  const message = `
⚠️ <b>ALERTA DE CONEXÃO</b>

Conta: <code>${accountNumber}</code>
Terminal: <code>${terminalId}</code>

🔴 Conexão perdida com o terminal MT4/MT5
`;

  return await sendTelegramMessage(chatId, message);
}

/**
 * Envia notificação de trade fechado
 */
export async function sendTradeClosedNotification(
  chatId: string,
  symbol: string,
  type: string,
  profit: number,
  accountNumber: string
) {
  const isProfit = profit > 0;
  const emoji = isProfit ? "✅" : "❌";
  const profitFormatted = (profit / 100).toFixed(2);

  const message = `
${emoji} <b>TRADE FECHADO</b>

Conta: <code>${accountNumber}</code>
Par: <b>${symbol}</b>
Tipo: ${type}
Resultado: <b>$${profitFormatted}</b>
`;

  return await sendTelegramMessage(chatId, message);
}

/**
 * Envia resumo diário
 */
export async function sendDailySummary(
  chatId: string,
  accountNumber: string,
  totalTrades: number,
  winningTrades: number,
  losingTrades: number,
  totalProfit: number,
  balance: number
) {
  const winRate = totalTrades > 0 ? ((winningTrades / totalTrades) * 100).toFixed(1) : "0";
  const profitFormatted = (totalProfit / 100).toFixed(2);
  const balanceFormatted = (balance / 100).toFixed(2);

  const message = `
📊 <b>RESUMO DIÁRIO</b>

Conta: <code>${accountNumber}</code>

Trades: ${totalTrades}
✅ Ganhos: ${winningTrades}
❌ Perdas: ${losingTrades}
📈 Win Rate: ${winRate}%

💰 Lucro do Dia: <b>$${profitFormatted}</b>
💵 Balanço Atual: <b>$${balanceFormatted}</b>
`;

  return await sendTelegramMessage(chatId, message);
}

/**
 * Envia alerta personalizado
 */
export async function sendCustomAlert(
  chatId: string,
  title: string,
  message: string
) {
  const formattedMessage = `
🔔 <b>${title}</b>

${message}
`;

  return await sendTelegramMessage(chatId, formattedMessage);
}

