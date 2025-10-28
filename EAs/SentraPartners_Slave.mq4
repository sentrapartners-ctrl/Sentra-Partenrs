//+------------------------------------------------------------------+
//|                                       SentraPartners_Slave.mq4   |
//|                        Copyright 2025, Sentra Partners           |
//|                                   https://sentrapartners.com     |
//+------------------------------------------------------------------+
#property copyright "Copyright 2025, Sentra Partners"
#property link      "https://sentrapartners.com"
#property version   "1.00"
#property strict

//--- Input parameters
input string ServerURL = "https://sentrapartners.com/api/mt/get-signals";
input string AccountToken = "";  // Token da conta (obtido no painel web)
input int MasterAccountNumber = 0;  // Número da conta Master a copiar
input double LotMultiplier = 1.0;   // Multiplicador de lote (1.0 = mesmo tamanho)
input int MaxSlippage = 3;          // Slippage máximo em pontos
input int CheckInterval = 1;        // Intervalo de verificação em segundos
input bool EnableLogging = true;    // Habilitar logs detalhados
input int MagicNumber = 77777;      // Magic number para identificar trades copiados

//--- Global variables
datetime lastCheckTime = 0;
string lastSignalsHash = "";

//+------------------------------------------------------------------+
//| Expert initialization function                                   |
//+------------------------------------------------------------------+
int OnInit()
{
   if(AccountToken == "")
   {
      Alert("ERRO: Token da conta não configurado!");
      return(INIT_FAILED);
   }
   
   if(MasterAccountNumber == 0)
   {
      Alert("ERRO: Número da conta Master não configurado!");
      return(INIT_FAILED);
   }
   
   Print("===========================================");
   Print("Sentra Partners - Slave EA Iniciado");
   Print("Conta: ", AccountNumber());
   Print("Copiando de: ", MasterAccountNumber);
   Print("Multiplicador de lote: ", LotMultiplier);
   Print("===========================================");
   
   return(INIT_SUCCEEDED);
}

//+------------------------------------------------------------------+
//| Expert deinitialization function                                 |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
   Print("Sentra Partners - Slave EA Encerrado. Razão: ", reason);
}

//+------------------------------------------------------------------+
//| Expert tick function                                             |
//+------------------------------------------------------------------+
void OnTick()
{
   // Verificar intervalo
   if(TimeCurrent() - lastCheckTime < CheckInterval)
      return;
   
   lastCheckTime = TimeCurrent();
   
   // Buscar sinais do servidor
   CheckAndCopySignals();
}

//+------------------------------------------------------------------+
//| Verificar e copiar sinais do Master                             |
//+------------------------------------------------------------------+
void CheckAndCopySignals()
{
   string url = ServerURL + "?accountNumber=" + IntegerToString(AccountNumber()) + 
                "&accountToken=" + AccountToken +
                "&masterAccount=" + IntegerToString(MasterAccountNumber);
   
   char result[];
   string headers = "";
   string resultHeaders;
   int timeout = 5000;
   
   int res = WebRequest(
      "GET",
      url,
      headers,
      timeout,
      NULL,
      result,
      resultHeaders
   );
   
   if(res == -1)
   {
      int error = GetLastError();
      if(error == 4060)
      {
         Print("ERRO: URL não está na lista de permitidas!");
         Print("Adicione '", ServerURL, "' nas configurações do MT4/MT5");
      }
      else
      {
         Print("Erro ao buscar sinais: ", error);
      }
      return;
   }
   
   if(res != 200)
   {
      Print("Erro HTTP: ", res);
      return;
   }
   
   string response = CharArrayToString(result);
   
   // Verificar se houve mudança nos sinais
   string signalsHash = GetStringHash(response);
   if(signalsHash == lastSignalsHash)
      return;
   
   lastSignalsHash = signalsHash;
   
   if(EnableLogging)
      Print("Novos sinais recebidos: ", response);
   
   // Processar sinais
   ProcessSignals(response);
}

//+------------------------------------------------------------------+
//| Processar sinais recebidos                                      |
//+------------------------------------------------------------------+
void ProcessSignals(string jsonResponse)
{
   // Parse simples do JSON
   // Formato esperado: {"trades":[{...},{...}]}
   
   int tradesStart = StringFind(jsonResponse, "[");
   int tradesEnd = StringFind(jsonResponse, "]", tradesStart);
   
   if(tradesStart == -1 || tradesEnd == -1)
   {
      Print("Formato de resposta inválido");
      return;
   }
   
   string tradesArray = StringSubstr(jsonResponse, tradesStart + 1, tradesEnd - tradesStart - 1);
   
   // Se não há trades, fechar todos os trades copiados
   if(StringLen(tradesArray) < 10)
   {
      CloseAllCopiedTrades();
      return;
   }
   
   // Dividir trades individuais
   string trades[];
   int count = SplitString(tradesArray, "},", trades);
   
   // Processar cada trade
   for(int i = 0; i < count; i++)
   {
      ProcessSingleTrade(trades[i]);
   }
   
   // Fechar trades que não existem mais no Master
   CloseOrphanTrades(tradesArray);
}

//+------------------------------------------------------------------+
//| Processar um trade individual                                   |
//+------------------------------------------------------------------+
void ProcessSingleTrade(string tradeJson)
{
   // Parse dos campos do trade
   int masterTicket = GetJsonInt(tradeJson, "ticket");
   string symbol = GetJsonString(tradeJson, "symbol");
   int type = GetJsonInt(tradeJson, "type");
   double lots = GetJsonDouble(tradeJson, "lots") * LotMultiplier;
   double openPrice = GetJsonDouble(tradeJson, "openPrice");
   double stopLoss = GetJsonDouble(tradeJson, "stopLoss");
   double takeProfit = GetJsonDouble(tradeJson, "takeProfit");
   
   if(EnableLogging)
      Print("Processando trade: ", symbol, " ", lots, " lotes");
   
   // Verificar se já existe um trade copiado
   int existingTicket = FindCopiedTrade(masterTicket);
   
   if(existingTicket > 0)
   {
      // Atualizar SL/TP se necessário
      UpdateTrade(existingTicket, stopLoss, takeProfit);
   }
   else
   {
      // Abrir novo trade
      OpenCopiedTrade(masterTicket, symbol, type, lots, stopLoss, takeProfit);
   }
}

//+------------------------------------------------------------------+
//| Abrir trade copiado                                             |
//+------------------------------------------------------------------+
void OpenCopiedTrade(int masterTicket, string symbol, int type, double lots, double sl, double tp)
{
   double price;
   color arrowColor;
   
   // Normalizar lotes
   double minLot = MarketInfo(symbol, MODE_MINLOT);
   double maxLot = MarketInfo(symbol, MODE_MAXLOT);
   double lotStep = MarketInfo(symbol, MODE_LOTSTEP);
   
   lots = MathMax(minLot, MathMin(maxLot, lots));
   lots = NormalizeDouble(lots / lotStep, 0) * lotStep;
   
   if(type == OP_BUY || type == OP_BUYLIMIT || type == OP_BUYSTOP)
   {
      price = MarketInfo(symbol, MODE_ASK);
      arrowColor = clrBlue;
   }
   else
   {
      price = MarketInfo(symbol, MODE_BID);
      arrowColor = clrRed;
   }
   
   string comment = "Copy:" + IntegerToString(masterTicket);
   
   int ticket = OrderSend(
      symbol,
      type,
      lots,
      price,
      MaxSlippage,
      sl,
      tp,
      comment,
      MagicNumber,
      0,
      arrowColor
   );
   
   if(ticket > 0)
   {
      Print("Trade copiado com sucesso! Ticket: ", ticket, " (Master: ", masterTicket, ")");
   }
   else
   {
      Print("Erro ao copiar trade: ", GetLastError());
   }
}

//+------------------------------------------------------------------+
//| Atualizar SL/TP de trade existente                              |
//+------------------------------------------------------------------+
void UpdateTrade(int ticket, double newSL, double newTP)
{
   if(!OrderSelect(ticket, SELECT_BY_TICKET))
      return;
   
   double currentSL = OrderStopLoss();
   double currentTP = OrderTakeProfit();
   
   // Verificar se precisa atualizar
   if(MathAbs(currentSL - newSL) < 0.00001 && MathAbs(currentTP - newTP) < 0.00001)
      return;
   
   bool result = OrderModify(
      ticket,
      OrderOpenPrice(),
      newSL,
      newTP,
      0,
      clrNONE
   );
   
   if(result)
   {
      if(EnableLogging)
         Print("Trade ", ticket, " atualizado: SL=", newSL, " TP=", newTP);
   }
   else
   {
      Print("Erro ao atualizar trade ", ticket, ": ", GetLastError());
   }
}

//+------------------------------------------------------------------+
//| Encontrar trade copiado pelo ticket do Master                   |
//+------------------------------------------------------------------+
int FindCopiedTrade(int masterTicket)
{
   string searchComment = "Copy:" + IntegerToString(masterTicket);
   
   for(int i = 0; i < OrdersTotal(); i++)
   {
      if(!OrderSelect(i, SELECT_BY_POS, MODE_TRADES))
         continue;
      
      if(OrderMagicNumber() == MagicNumber && StringFind(OrderComment(), searchComment) >= 0)
         return OrderTicket();
   }
   
   return -1;
}

//+------------------------------------------------------------------+
//| Fechar trades órfãos (que não existem mais no Master)           |
//+------------------------------------------------------------------+
void CloseOrphanTrades(string activeTradesJson)
{
   for(int i = OrdersTotal() - 1; i >= 0; i--)
   {
      if(!OrderSelect(i, SELECT_BY_POS, MODE_TRADES))
         continue;
      
      if(OrderMagicNumber() != MagicNumber)
         continue;
      
      // Extrair ticket do Master do comentário
      string comment = OrderComment();
      int pos = StringFind(comment, "Copy:");
      if(pos < 0)
         continue;
      
      string masterTicketStr = StringSubstr(comment, pos + 5);
      int masterTicket = StringToInteger(masterTicketStr);
      
      // Verificar se este ticket ainda existe nos sinais
      string searchStr = "\"ticket\":" + IntegerToString(masterTicket);
      if(StringFind(activeTradesJson, searchStr) < 0)
      {
         // Trade não existe mais no Master, fechar
         CloseTrade(OrderTicket());
      }
   }
}

//+------------------------------------------------------------------+
//| Fechar todos os trades copiados                                 |
//+------------------------------------------------------------------+
void CloseAllCopiedTrades()
{
   for(int i = OrdersTotal() - 1; i >= 0; i--)
   {
      if(!OrderSelect(i, SELECT_BY_POS, MODE_TRADES))
         continue;
      
      if(OrderMagicNumber() == MagicNumber)
         CloseTrade(OrderTicket());
   }
}

//+------------------------------------------------------------------+
//| Fechar um trade                                                  |
//+------------------------------------------------------------------+
void CloseTrade(int ticket)
{
   if(!OrderSelect(ticket, SELECT_BY_TICKET))
      return;
   
   double closePrice;
   color arrowColor;
   
   if(OrderType() == OP_BUY)
   {
      closePrice = MarketInfo(OrderSymbol(), MODE_BID);
      arrowColor = clrRed;
   }
   else
   {
      closePrice = MarketInfo(OrderSymbol(), MODE_ASK);
      arrowColor = clrBlue;
   }
   
   bool result = OrderClose(ticket, OrderLots(), closePrice, MaxSlippage, arrowColor);
   
   if(result)
   {
      Print("Trade ", ticket, " fechado (não existe mais no Master)");
   }
   else
   {
      Print("Erro ao fechar trade ", ticket, ": ", GetLastError());
   }
}

//+------------------------------------------------------------------+
//| Funções auxiliares para parse de JSON                           |
//+------------------------------------------------------------------+
int GetJsonInt(string json, string key)
{
   string searchKey = "\"" + key + "\":";
   int pos = StringFind(json, searchKey);
   if(pos < 0) return 0;
   
   int start = pos + StringLen(searchKey);
   int end = StringFind(json, ",", start);
   if(end < 0) end = StringFind(json, "}", start);
   
   string value = StringSubstr(json, start, end - start);
   return StringToInteger(value);
}

double GetJsonDouble(string json, string key)
{
   string searchKey = "\"" + key + "\":";
   int pos = StringFind(json, searchKey);
   if(pos < 0) return 0.0;
   
   int start = pos + StringLen(searchKey);
   int end = StringFind(json, ",", start);
   if(end < 0) end = StringFind(json, "}", start);
   
   string value = StringSubstr(json, start, end - start);
   return StringToDouble(value);
}

string GetJsonString(string json, string key)
{
   string searchKey = "\"" + key + "\":\"";
   int pos = StringFind(json, searchKey);
   if(pos < 0) return "";
   
   int start = pos + StringLen(searchKey);
   int end = StringFind(json, "\"", start);
   
   return StringSubstr(json, start, end - start);
}

int SplitString(string str, string separator, string &result[])
{
   int count = 0;
   int pos = 0;
   int sepLen = StringLen(separator);
   
   while(pos < StringLen(str))
   {
      int nextPos = StringFind(str, separator, pos);
      if(nextPos < 0)
      {
         ArrayResize(result, count + 1);
         result[count] = StringSubstr(str, pos);
         count++;
         break;
      }
      
      ArrayResize(result, count + 1);
      result[count] = StringSubstr(str, pos, nextPos - pos);
      count++;
      pos = nextPos + sepLen;
   }
   
   return count;
}

string GetStringHash(string str)
{
   // Hash simples baseado no comprimento e alguns caracteres
   int len = StringLen(str);
   int hash = len;
   
   if(len > 10)
   {
      hash += StringGetChar(str, 0) * 1000;
      hash += StringGetChar(str, len / 2) * 100;
      hash += StringGetChar(str, len - 1) * 10;
   }
   
   return IntegerToString(hash);
}
//+------------------------------------------------------------------+

