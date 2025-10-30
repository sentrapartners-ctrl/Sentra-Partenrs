//+------------------------------------------------------------------+
//|                                       SentraPartners_Slave.mq4   |
//|                        Copyright 2025, Sentra Partners           |
//|                                   https://sentrapartners.com     |
//+------------------------------------------------------------------+
#property copyright "Copyright 2025, Sentra Partners"
#property link      "https://sentrapartners.com"
#property version   "2.00"
#property strict

//====================================================
// SISTEMA DE LICENCIAMENTO
//====================================================
#define LICENSE_EXPIRY_DATE D\'2025.12.31 23:59:59\'  // Data de expiração
#define ALLOWED_ACCOUNTS ""  // Contas permitidas (separadas por vírgula) - vazio = todas


//--- Input parameters
input string ServerURL = "https://sentrapartners.com/api/mt/get-signals";
input string LicenseCheckURL = "https://sentrapartners.com/api/ea-license/validate";
input string AccountToken = "";  // Token da conta Slave
input int MasterAccountNumber = 0;  // Número da conta Master a copiar
input double LotMultiplier = 1.0;  // Multiplicador de lote (1.0 = mesmo tamanho)
input int MaxSlippage = 3;  // Slippage máximo em pontos
input int CheckInterval = 1;  // Intervalo de verificação em segundos
input bool EnableLogging = true;  // Habilitar logs detalhados
input int MagicNumber = 77777;  // Magic number para identificar trades copiados

//--- Global variables
datetime lastCheckTime = 0;
datetime lastLicenseCheck = 0;
bool licenseValid = false;
string licenseExpiryDate = "";
int licenseDaysRemaining = 0;

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
   Print("Sentra Partners - Slave EA v2.0");
   Print("Conta: ", AccountNumber());
   Print("Copiando de: ", MasterAccountNumber);
   Print("===========================================");
   
    // Validar licença
    if(!ValidateLicense()) {
        Alert("❌ LICENÇA INVÁLIDA!");
        Print("❌ EA bloqueado: Licença inválida ou expirada.");
        return(INIT_FAILED);
    }
    Print("✅ Licença válida!");
    
   // Verificar licença
   if(!CheckLicense())
   {
      Alert("ERRO: Licença inválida ou expirada!");
      return(INIT_FAILED);
   }
   
   Print("Licença válida até: ", licenseExpiryDate);
   Print("Dias restantes: ", licenseDaysRemaining);
   
   if(licenseDaysRemaining <= 7)
      Alert("AVISO: Sua licença expira em ", licenseDaysRemaining, " dias!");
   
   return(INIT_SUCCEEDED);
}

//+------------------------------------------------------------------+
//| Expert deinitialization function                                 |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
   Print("Sentra Partners - Slave EA Encerrado");
}

//+------------------------------------------------------------------+
//| Expert tick function                                             |
//+------------------------------------------------------------------+
void OnTick()
{
   // Verificar licença a cada 1 hora
   if(TimeCurrent() - lastLicenseCheck > 3600)
   {
      if(!CheckLicense())
      {
         Alert("ERRO: Licença expirada! EA será desativado.");
         ExpertRemove();
         return;
      }
   }
   
   // Verificar intervalo
   if(TimeCurrent() - lastCheckTime < CheckInterval)
      return;
   
   lastCheckTime = TimeCurrent();
   GetAndCopySignals();
}

//+------------------------------------------------------------------+
//| Verificar licença                                                |
//+------------------------------------------------------------------+
bool CheckLicense()
{
   string postData = "{\"accountNumber\":" + IntegerToString(AccountNumber()) + ",\"eaType\":\"slave\"}";
   
   string headers = "Content-Type: application/json\r\n";
   char post[];
   char result[];
   string resultHeaders;
   
   ArrayResize(post, StringToCharArray(postData, post, 0, WHOLE_ARRAY) - 1);
   
   int res = WebRequest("POST", LicenseCheckURL, headers, 10000, post, result, resultHeaders);
   
   if(res == -1 || res != 200)
      return false;
   
   string response = CharArrayToString(result);
   bool valid = StringFind(response, "\"valid\":true") >= 0;
   
   if(valid)
   {
      // Extrair dias restantes
      int daysPos = StringFind(response, "\"daysRemaining\":");
      if(daysPos >= 0)
      {
         int start = daysPos + 16;
         int end = StringFind(response, ",", start);
         if(end < 0) end = StringFind(response, "}", start);
         licenseDaysRemaining = StringToInteger(StringSubstr(response, start, end - start));
      }
      
      lastLicenseCheck = TimeCurrent();
      licenseValid = true;
   }
   
   return valid;
}

//+------------------------------------------------------------------+
//| Buscar e copiar sinais                                          |
//+------------------------------------------------------------------+
void GetAndCopySignals()
{
   if(!licenseValid)
      return;
   
   string url = ServerURL + "?accountNumber=" + IntegerToString(AccountNumber());
   url += "&accountToken=" + AccountToken;
   url += "&masterAccount=" + IntegerToString(MasterAccountNumber);
   
   char result[];
   string resultHeaders;
   
   int res = WebRequest("GET", url, "", 5000, result, resultHeaders);
   
   if(res != 200)
      return;
   
   string response = CharArrayToString(result);
   
   if(StringFind(response, "\"trades\":[]") >= 0)
   {
      CloseAllCopiedTrades();
      return;
   }
   
   if(EnableLogging)
      Print("Sinais recebidos");
   
   ProcessSignals(response);
}

//+------------------------------------------------------------------+
//| Processar sinais                                                 |
//+------------------------------------------------------------------+
void ProcessSignals(string json)
{
   int pos = 0;
   
   while(true)
   {
      pos = StringFind(json, "{\"ticket\":", pos);
      if(pos < 0) break;
      
      int endPos = StringFind(json, "}", pos);
      if(endPos < 0) break;
      
      string tradeJson = StringSubstr(json, pos, endPos - pos + 1);
      
      int ticket = ExtractInt(tradeJson, "\"ticket\":");
      string symbol = ExtractString(tradeJson, "\"symbol\":\"");
      int type = ExtractInt(tradeJson, "\"type\":");
      double lots = ExtractDouble(tradeJson, "\"lots\":");
      double sl = ExtractDouble(tradeJson, "\"stopLoss\":");
      double tp = ExtractDouble(tradeJson, "\"takeProfit\":");
      
      lots = NormalizeDouble(lots * LotMultiplier, 2);
      
      int existing = FindCopiedTrade(ticket);
      
      if(existing > 0)
         UpdateTrade(existing, sl, tp);
      else
         CopyTrade(ticket, symbol, type, lots, sl, tp);
      
      pos = endPos + 1;
   }
   
   CloseOrphanTrades(json);
}

//+------------------------------------------------------------------+
//| Copiar trade                                                     |
//+------------------------------------------------------------------+
void CopyTrade(int masterTicket, string symbol, int type, double lots, double sl, double tp)
{
   if(lots < MarketInfo(symbol, MODE_MINLOT))
      lots = MarketInfo(symbol, MODE_MINLOT);
   
   double price = (type == OP_BUY) ? MarketInfo(symbol, MODE_ASK) : MarketInfo(symbol, MODE_BID);
   
   string comment = "Copy:" + IntegerToString(masterTicket);
   
   int ticket = OrderSend(symbol, type, lots, price, MaxSlippage, sl, tp, comment, MagicNumber, 0, clrGreen);
   
   if(ticket > 0 && EnableLogging)
      Print("Trade copiado! Ticket: ", ticket);
}

//+------------------------------------------------------------------+
//| Atualizar trade                                                  |
//+------------------------------------------------------------------+
void UpdateTrade(int ticket, double newSL, double newTP)
{
   if(!OrderSelect(ticket, SELECT_BY_TICKET))
      return;
   
   if(MathAbs(OrderStopLoss() - newSL) < 0.00001 && MathAbs(OrderTakeProfit() - newTP) < 0.00001)
      return;
   
   OrderModify(ticket, OrderOpenPrice(), newSL, newTP, 0, clrBlue);
}

//+------------------------------------------------------------------+
//| Encontrar trade copiado                                         |
//+------------------------------------------------------------------+
int FindCopiedTrade(int masterTicket)
{
   string search = "Copy:" + IntegerToString(masterTicket);
   
   for(int i = 0; i < OrdersTotal(); i++)
   {
      if(!OrderSelect(i, SELECT_BY_POS, MODE_TRADES))
         continue;
      
      if(OrderMagicNumber() == MagicNumber && StringFind(OrderComment(), search) >= 0)
         return OrderTicket();
   }
   
   return -1;
}

//+------------------------------------------------------------------+
//| Fechar trades órfãos                                            |
//+------------------------------------------------------------------+
void CloseOrphanTrades(string masterJson)
{
   for(int i = OrdersTotal() - 1; i >= 0; i--)
   {
      if(!OrderSelect(i, SELECT_BY_POS, MODE_TRADES))
         continue;
      
      if(OrderMagicNumber() != MagicNumber)
         continue;
      
      string comment = OrderComment();
      int copyPos = StringFind(comment, "Copy:");
      if(copyPos < 0) continue;
      
      int masterTicket = StringToInteger(StringSubstr(comment, copyPos + 5));
      
      if(StringFind(masterJson, "\"ticket\":" + IntegerToString(masterTicket)) < 0)
         CloseTrade(OrderTicket());
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
//| Fechar trade                                                     |
//+------------------------------------------------------------------+
void CloseTrade(int ticket)
{
   if(!OrderSelect(ticket, SELECT_BY_TICKET))
      return;
   
   double price = (OrderType() == OP_BUY) ? MarketInfo(OrderSymbol(), MODE_BID) : MarketInfo(OrderSymbol(), MODE_ASK);
   
   OrderClose(ticket, OrderLots(), price, MaxSlippage, clrRed);
}

//+------------------------------------------------------------------+
//| Funções auxiliares                                               |
//+------------------------------------------------------------------+
int ExtractInt(string json, string key)
{
   int pos = StringFind(json, key);
   if(pos < 0) return 0;
   
   int start = pos + StringLen(key);
   int end = StringFind(json, ",", start);
   if(end < 0) end = StringFind(json, "}", start);
   
   return StringToInteger(StringSubstr(json, start, end - start));
}

double ExtractDouble(string json, string key)
{
   int pos = StringFind(json, key);
   if(pos < 0) return 0;
   
   int start = pos + StringLen(key);
   int end = StringFind(json, ",", start);
   if(end < 0) end = StringFind(json, "}", start);
   
   return StringToDouble(StringSubstr(json, start, end - start));
}

string ExtractString(string json, string key)
{
   int pos = StringFind(json, key);
   if(pos < 0) return "";
   
   int start = pos + StringLen(key);
   int end = StringFind(json, "\"", start);
   
   return StringSubstr(json, start, end - start);
}
//+------------------------------------------------------------------+

