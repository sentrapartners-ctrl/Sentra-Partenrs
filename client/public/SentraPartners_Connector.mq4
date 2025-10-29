//+------------------------------------------------------------------+
//|                                      SentraPartners_Connector.mq4 |
//|                                           Sentra Partners Platform |
//|                                        https://sentrapartners.com |
//+------------------------------------------------------------------+
#property copyright "Sentra Partners"
#property link      "https://sentrapartners.com"
#property version   "1.00"
#property strict

// Input parameters
input string API_KEY = "";  // API Key (obtenha em sentrapartners.com)
input string API_URL = "https://sentrapartners.com/api/trpc";  // API URL
input int UPDATE_INTERVAL = 30;  // Intervalo de atualização (segundos)

// Global variables
datetime lastUpdate = 0;
int lastOrdersTotal = 0;

//+------------------------------------------------------------------+
//| Expert initialization function                                     |
//+------------------------------------------------------------------+
int OnInit()
{
   if(StringLen(API_KEY) == 0)
   {
      Alert("ERRO: API Key não configurada! Obtenha sua API Key em sentrapartners.com");
      return(INIT_FAILED);
   }
   
   Print("Sentra Partners Connector iniciado");
   Print("Conta: ", AccountNumber());
   Print("Broker: ", AccountCompany());
   Print("Server: ", AccountServer());
   
   // Sincronizar imediatamente
   SyncAccount();
   SyncAllTrades();
   
   return(INIT_SUCCEEDED);
}

//+------------------------------------------------------------------+
//| Expert deinitialization function                                   |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
   Print("Sentra Partners Connector finalizado. Razão: ", reason);
}

//+------------------------------------------------------------------+
//| Expert tick function                                               |
//+------------------------------------------------------------------+
void OnTick()
{
   // Atualizar a cada X segundos
   if(TimeCurrent() - lastUpdate >= UPDATE_INTERVAL)
   {
      SyncAccount();
      
      // Verificar se houve mudança no número de ordens
      if(OrdersTotal() != lastOrdersTotal || OrdersHistoryTotal() > 0)
      {
         SyncAllTrades();
         lastOrdersTotal = OrdersTotal();
      }
      
      lastUpdate = TimeCurrent();
   }
}

//+------------------------------------------------------------------+
//| Sincronizar dados da conta                                         |
//+------------------------------------------------------------------+
void SyncAccount()
{
   string accountType = "REAL";
   if(IsDemo()) accountType = "DEMO";
   if(StringFind(AccountServer(), "Cent") >= 0 || StringFind(AccountServer(), "cent") >= 0)
      accountType = "CENT";
   
   string json = "{";
   json += "\"apiKey\":\"" + API_KEY + "\",";
   json += "\"accountNumber\":\"" + IntegerToString(AccountNumber()) + "\",";
   json += "\"broker\":\"" + AccountCompany() + "\",";
   json += "\"server\":\"" + AccountServer() + "\",";
   json += "\"platform\":\"MT4\",";
   json += "\"accountType\":\"" + accountType + "\",";
   json += "\"balance\":" + DoubleToString(AccountBalance() * 100, 0) + ",";
   json += "\"equity\":" + DoubleToString(AccountEquity() * 100, 0) + ",";
   json += "\"margin\":" + DoubleToString(AccountMargin() * 100, 0) + ",";
   json += "\"marginFree\":" + DoubleToString(AccountFreeMargin() * 100, 0) + ",";
   json += "\"marginLevel\":" + DoubleToString(AccountMargin() > 0 ? (AccountEquity() / AccountMargin() * 100) : 0, 2) + ",";
   json += "\"marginUsed\":" + DoubleToString(AccountMargin() * 100, 0) + ",";
   json += "\"leverage\":" + IntegerToString(AccountLeverage()) + ",";
   json += "\"openPositions\":" + IntegerToString(OrdersTotal()) + ",";
   json += "\"currency\":\"" + AccountCurrency() + "\"";
   json += "}";
   
   string url = API_URL + "/mt4.syncAccount";
   string response = SendHTTPRequest(url, json);
   
   if(StringFind(response, "success") >= 0)
   {
      Print("Conta sincronizada com sucesso");
   }
   else
   {
      Print("Erro ao sincronizar conta: ", response);
   }
}

//+------------------------------------------------------------------+
//| Sincronizar todos os trades                                        |
//+------------------------------------------------------------------+
void SyncAllTrades()
{
   // Sincronizar trades abertos
   for(int i = 0; i < OrdersTotal(); i++)
   {
      if(OrderSelect(i, SELECT_BY_POS, MODE_TRADES))
      {
         if(OrderType() <= OP_SELL)  // Apenas BUY e SELL
         {
            SyncTrade(OrderTicket(), false);
         }
      }
   }
   
   // Sincronizar trades fechados (últimos 100)
   int total = OrdersHistoryTotal();
   int start = MathMax(0, total - 100);
   
   for(int i = start; i < total; i++)
   {
      if(OrderSelect(i, SELECT_BY_POS, MODE_HISTORY))
      {
         if(OrderType() <= OP_SELL)  // Apenas BUY e SELL
         {
            SyncTrade(OrderTicket(), true);
         }
      }
   }
}

//+------------------------------------------------------------------+
//| Sincronizar um trade específico                                    |
//+------------------------------------------------------------------+
void SyncTrade(int ticket, bool isClosed)
{
   if(!OrderSelect(ticket, SELECT_BY_TICKET))
      return;
   
   string tradeType = "BUY";
   if(OrderType() == OP_SELL) tradeType = "SELL";
   
   string json = "{";
   json += "\"apiKey\":\"" + API_KEY + "\",";
   json += "\"accountNumber\":\"" + IntegerToString(AccountNumber()) + "\",";
   json += "\"ticket\":" + IntegerToString(OrderTicket()) + ",";
   json += "\"symbol\":\"" + OrderSymbol() + "\",";
   json += "\"type\":\"" + tradeType + "\",";
   json += "\"volume\":" + DoubleToString(OrderLots() * 100, 0) + ",";
   json += "\"openPrice\":" + DoubleToString(OrderOpenPrice() * 100000, 0) + ",";
   json += "\"openTime\":\"" + TimeToString(OrderOpenTime(), TIME_DATE|TIME_SECONDS) + "\",";
   
   if(isClosed || OrderCloseTime() > 0)
   {
      json += "\"closePrice\":" + DoubleToString(OrderClosePrice() * 100000, 0) + ",";
      json += "\"closeTime\":\"" + TimeToString(OrderCloseTime(), TIME_DATE|TIME_SECONDS) + "\",";
   }
   
   if(OrderStopLoss() > 0)
      json += "\"stopLoss\":" + DoubleToString(OrderStopLoss() * 100000, 0) + ",";
   
   if(OrderTakeProfit() > 0)
      json += "\"takeProfit\":" + DoubleToString(OrderTakeProfit() * 100000, 0) + ",";
   
   json += "\"profit\":" + DoubleToString(OrderProfit() * 100, 0) + ",";
   json += "\"commission\":" + DoubleToString(OrderCommission() * 100, 0) + ",";
   json += "\"swap\":" + DoubleToString(OrderSwap() * 100, 0) + ",";
   json += "\"comment\":\"" + OrderComment() + "\"";
   json += "}";
   
   string url = API_URL + "/mt4.syncTrade";
   string response = SendHTTPRequest(url, json);
   
   if(StringFind(response, "success") < 0)
   {
      Print("Erro ao sincronizar trade #", ticket, ": ", response);
   }
}

//+------------------------------------------------------------------+
//| Enviar requisição HTTP                                             |
//+------------------------------------------------------------------+
string SendHTTPRequest(string url, string json)
{
   string headers = "Content-Type: application/json\r\n";
   char post[], result[];
   string resultHeaders;
   
   StringToCharArray(json, post, 0, StringLen(json));
   
   int timeout = 5000;  // 5 segundos
   int res = WebRequest("POST", url, headers, timeout, post, result, resultHeaders);
   
   if(res == -1)
   {
      int error = GetLastError();
      Print("Erro WebRequest: ", error);
      Print("Adicione '", url, "' nas URLs permitidas em Tools -> Options -> Expert Advisors");
      return "ERROR";
   }
   
   return CharArrayToString(result);
}
//+------------------------------------------------------------------+
