import { getDb } from "./db";
import { tradingAccounts, trades } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";
import * as fs from "fs";
import * as path from "path";
import { parseStringPromise } from "xml2js";

// Caminho onde os arquivos XML serão colocados
// Pode ser uma pasta compartilhada, montagem FTP, Dropbox, etc.
const XML_IMPORT_PATH = process.env.MT4_XML_PATH || "/tmp/sentrapartners-mt4";

interface AccountData {
  Email: string[];
  Number: string[];
  Broker: string[];
  Server: string[];
  Type: string[];
  Platform: string[];
  Currency: string[];
  Leverage: string[];
  Balance: string[];
  Equity: string[];
  MarginFree: string[];
  OpenPositions: string[];
  Timestamp: string[];
}

interface TradeData {
  Ticket: string[];
  Symbol: string[];
  Type: string[];
  Volume: string[];
  OpenPrice: string[];
  ClosePrice: string[];
  StopLoss: string[];
  TakeProfit: string[];
  Profit: string[];
  Commission: string[];
  Swap: string[];
  Status: string[];
  OpenTime: string[];
  CloseTime: string[];
}

interface XMLData {
  SentraPartnersData: {
    Account: AccountData[];
    OpenTrades?: { Trade?: TradeData[] }[];
    HistoryTrades?: { Trade?: TradeData[] }[];
  };
}

/**
 * Processa um arquivo XML e importa os dados para o banco
 */
export async function processXMLFile(filePath: string): Promise<boolean> {
  try {
    console.log(`[XML Importer] Processando arquivo: ${filePath}`);
    
    // Lê o arquivo XML
    const xmlContent = fs.readFileSync(filePath, 'utf-8');
    
    // Parse do XML
    const data: XMLData = await parseStringPromise(xmlContent);
    
    if (!data.SentraPartnersData || !data.SentraPartnersData.Account) {
      console.error(`[XML Importer] Formato inválido: ${filePath}`);
      return false;
    }
    
    const accountData = data.SentraPartnersData.Account[0];
    
    // Busca usuário pelo email
    const db = await getDb();
    if (!db) {
      console.error('[XML Importer] Database não disponível');
      return false;
    }
    
    const email = accountData.Email[0];
    const accountNumber = accountData.Number[0];
    
    console.log(`[XML Importer] Email: ${email}, Conta: ${accountNumber}`);
    
    // Busca ou cria conta de trading
    const existingAccounts = await db
      .select()
      .from(tradingAccounts)
      .where(
        and(
          eq(tradingAccounts.accountNumber, accountNumber),
          eq(tradingAccounts.broker, accountData.Broker[0])
        )
      );
    
    let accountId: number;
    
    if (existingAccounts.length > 0) {
      // Atualiza conta existente
      accountId = existingAccounts[0].id;
      
      await db
        .update(tradingAccounts)
        .set({
          balance: parseFloat(accountData.Balance[0]),
          equity: parseFloat(accountData.Equity[0]),
          marginFree: parseFloat(accountData.MarginFree[0]),
          leverage: parseInt(accountData.Leverage[0]),
          server: accountData.Server[0],
          lastSync: new Date(),
        })
        .where(eq(tradingAccounts.id, accountId));
      
      console.log(`[XML Importer] Conta ${accountNumber} atualizada`);
    } else {
      // Cria nova conta (precisa buscar userId pelo email)
      console.log(`[XML Importer] Conta ${accountNumber} não encontrada - seria necessário criar`);
      return false; // Por enquanto não cria automaticamente
    }
    
    // Processa trades abertos
    if (data.SentraPartnersData.OpenTrades && data.SentraPartnersData.OpenTrades[0].Trade) {
      const openTrades = data.SentraPartnersData.OpenTrades[0].Trade;
      for (const trade of openTrades) {
        await importTrade(db, accountId, trade, 'open');
      }
      console.log(`[XML Importer] ${openTrades.length} trades abertos importados`);
    }
    
    // Processa histórico de trades
    if (data.SentraPartnersData.HistoryTrades && data.SentraPartnersData.HistoryTrades[0].Trade) {
      const historyTrades = data.SentraPartnersData.HistoryTrades[0].Trade;
      for (const trade of historyTrades) {
        await importTrade(db, accountId, trade, 'closed');
      }
      console.log(`[XML Importer] ${historyTrades.length} trades históricos importados`);
    }
    
    return true;
  } catch (error) {
    console.error(`[XML Importer] Erro ao processar ${filePath}:`, error);
    return false;
  }
}

/**
 * Importa um trade para o banco de dados
 */
async function importTrade(db: any, accountId: number, tradeData: TradeData, status: string) {
  const ticket = tradeData.Ticket[0];
  
  // Verifica se trade já existe
  const existing = await db
    .select()
    .from(trades)
    .where(
      and(
        eq(trades.accountId, accountId),
        eq(trades.ticket, ticket)
      )
    );
  
  const tradeValues = {
    accountId,
    ticket,
    symbol: tradeData.Symbol[0],
    type: tradeData.Type[0] as "BUY" | "SELL",
    volume: Math.round(parseFloat(tradeData.Volume[0]) * 100), // Armazena em centésimos de lote
    openPrice: Math.round(parseFloat(tradeData.OpenPrice[0]) * 100000), // Armazena com 5 casas decimais
    closePrice: Math.round(parseFloat(tradeData.ClosePrice[0]) * 100000),
    stopLoss: Math.round(parseFloat(tradeData.StopLoss[0]) * 100000),
    takeProfit: Math.round(parseFloat(tradeData.TakeProfit[0]) * 100000),
    profit: Math.round(parseFloat(tradeData.Profit[0]) * 100), // Armazena em centavos
    commission: Math.round(parseFloat(tradeData.Commission[0]) * 100),
    swap: Math.round(parseFloat(tradeData.Swap[0]) * 100),
    status: status as "open" | "closed",
    openTime: new Date(parseInt(tradeData.OpenTime[0]) * 1000),
    closeTime: parseInt(tradeData.CloseTime[0]) > 0 ? new Date(parseInt(tradeData.CloseTime[0]) * 1000) : null,
  };
  
  if (existing.length > 0) {
    // Atualiza trade existente
    await db
      .update(trades)
      .set(tradeValues)
      .where(eq(trades.id, existing[0].id));
  } else {
    // Insere novo trade
    await db.insert(trades).values(tradeValues);
  }
}

/**
 * Monitora pasta e processa novos arquivos XML
 */
export async function startXMLImporter() {
  console.log(`[XML Importer] Monitorando pasta: ${XML_IMPORT_PATH}`);
  
  // Cria pasta se não existir
  if (!fs.existsSync(XML_IMPORT_PATH)) {
    fs.mkdirSync(XML_IMPORT_PATH, { recursive: true });
    console.log(`[XML Importer] Pasta criada: ${XML_IMPORT_PATH}`);
  }
  
  // Processa arquivos existentes
  const files = fs.readdirSync(XML_IMPORT_PATH);
  for (const file of files) {
    if (file.endsWith('.xml')) {
      const filePath = path.join(XML_IMPORT_PATH, file);
      await processXMLFile(filePath);
    }
  }
  
  // Monitora novos arquivos a cada 30 segundos
  setInterval(async () => {
    const files = fs.readdirSync(XML_IMPORT_PATH);
    for (const file of files) {
      if (file.endsWith('.xml')) {
        const filePath = path.join(XML_IMPORT_PATH, file);
        const stats = fs.statSync(filePath);
        
        // Processa apenas arquivos modificados nos últimos 2 minutos
        const now = Date.now();
        const fileAge = now - stats.mtimeMs;
        if (fileAge < 120000) { // 2 minutos
          await processXMLFile(filePath);
        }
      }
    }
  }, 30000); // 30 segundos
}
