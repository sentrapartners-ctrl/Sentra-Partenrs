//+------------------------------------------------------------------+
//|                                      SentraPartners_Connector.mq4 |
//|                                           Sentra Partners Platform |
//|                                        https://sentrapartners.com |
//+------------------------------------------------------------------+
#property copyright "Sentra Partners"
#property link      "https://sentrapartners.com"
#property version   "2.00"
#property strict

// Input parameters
input string USER_EMAIL = "";  // Email cadastrado na plataforma
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
   if(StringLen(USER_EMAIL) == 0)
   {
      Alert("ERRO: Email não configurado! Insira o email cadastrado na plataforma");
      return(INIT_FAILED);
   }
   
   Print("Sentra Partners Connector iniciado");
   Print("Email: ", USER_EMAIL);
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
   // Verificar se é hora de atualizar
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
//| Sincronizar dados da conta                                        |
//+------------------------------------------------------------------+
void SyncAccount()
{
   string accountType = "REAL";
   if(IsDemo()) accountType = "DEMO";
   
   // Detectar se é conta CENT pelo nome do servidor ou símbolo
   string server = AccountServer();
   if(StringFind(server, "Cent", 0) >= 0 || StringFind(server, "CENT", 0) >= 0)
   {
      accountType = "CENT";
   }
   
   string json = "{";
   json += "\"email\":\"" + USER_EMAIL + "\",";
   json += "\"accountNumber\":\"" + IntegerToString(AccountNumber()) + "\",";
   json += "\"broker\":\"" + AccountCompany() + "\",";
   json += "\"server\":\"" + server + "\",";
   json += "\"platform\":\"MT4\",";
   json += "\"accountType\":\"" + accountType + "\",";
   json += "\"balance\":" + DoubleToString(AccountBalance(), 2) + ",";
   json += "\"equity\":" + DoubleToString(AccountEquity(), 2) + ",";
   json += "\"margin\":" + DoubleToString(AccountMargin(), 2) + ",";
   json += "\"marginFree\":" + DoubleToString(AccountFreeMargin(), 2) + ",";
   json += "\"marginLevel\":" + DoubleToString(AccountMargin() > 0 ? (AccountEquity() / AccountMargin() * 100) : 0, 2) + ",";
   json += "\"leverage\":" + IntegerToString(AccountLeverage()) + ",";
   json += "\"openPositions\":" + IntegerToString(OrdersTotal()) + ",";
   json += "\"currency\":\"" + AccountCurrency() + "\"";
   json += "}";
   
   SendRequest("mt4.syncAccount", json);
}

//+------------------------------------------------------------------+
//| Sincronizar todos os trades                                       |
//+------------------------------------------------------------------+
void SyncAllTrades()
{
   // Sincronizar ordens abertas
   for(int i = 0; i < OrdersTotal(); i++)
   {
      if(OrderSelect(i, SELECT_BY_POS, MODE_TRADES))
      {
         SyncTrade();
      }
   }
   
   // Sincronizar histórico recente (últimas 100 ordens)
   int total = OrdersHistoryTotal();
   int start = MathMax(0, total - 100);
   
   for(int i = start; i < total; i++)
   {
      if(OrderSelect(i, SELECT_BY_POS, MODE_HISTORY))
      {
         SyncTrade();
      }
   }
}

//+------------------------------------------------------------------+
//| Sincronizar trade individual                                      |
//+------------------------------------------------------------------+
void SyncTrade()
{
   string type = "BUY";
   if(OrderType() == OP_SELL || OrderType() == OP_SELLLIMIT || OrderType() == OP_SELLSTOP)
      type = "SELL";
   
   string json = "{";
   json += "\"email\":\"" + USER_EMAIL + "\",";
   json += "\"accountNumber\":\"" + IntegerToString(AccountNumber()) + "\",";
   json += "\"ticket\":" + IntegerToString(OrderTicket()) + ",";
   json += "\"symbol\":\"" + OrderSymbol() + "\",";
   json += "\"type\":\"" + type + "\",";
   json += "\"volume\":" + DoubleToString(OrderLots(), 2) + ",";
   json += "\"openPrice\":" + DoubleToString(OrderOpenPrice(), 5) + ",";
   json += "\"openTime\":\"" + TimeToString(OrderOpenTime(), TIME_DATE|TIME_SECONDS) + "\",";
   
   if(OrderCloseTime() > 0)
   {
      json += "\"closePrice\":" + DoubleToString(OrderClosePrice(), 5) + ",";
      json += "\"closeTime\":\"" + TimeToString(OrderCloseTime(), TIME_DATE|TIME_SECONDS) + "\",";
   }
   
   json += "\"stopLoss\":" + DoubleToString(OrderStopLoss(), 5) + ",";
   json += "\"takeProfit\":" + DoubleToString(OrderTakeProfit(), 5) + ",";
   json += "\"profit\":" + DoubleToString(OrderProfit(), 2) + ",";
   json += "\"commission\":" + DoubleToString(OrderCommission(), 2) + ",";
   json += "\"swap\":" + DoubleToString(OrderSwap(), 2) + ",";
   json += "\"comment\":\"" + OrderComment() + "\"";
   json += "}";
   
   SendRequest("mt4.syncTrade", json);
}

//+------------------------------------------------------------------+
//| Enviar requisição HTTP                                            |
//+------------------------------------------------------------------+
void SendRequest(string method, string json)
{
   string url = API_URL + "/" + method;
   string headers = "Content-Type: application/json\r\n";
   
   char post[];
   char result[];
   string result_headers;
   
   StringToCharArray(json, post, 0, StringLen(json));
   
   int res = WebRequest(
      "POST",
      url,
      headers,
      5000,
      post,
      result,
      result_headers
   );
   
   if(res == -1)
   {
      int error = GetLastError();
      Print("Erro ao enviar dados: ", error);
      Print("Certifique-se de adicionar '", API_URL, "' nas URLs permitidas em Ferramentas > Opções > Expert Advisors");
   }
}
