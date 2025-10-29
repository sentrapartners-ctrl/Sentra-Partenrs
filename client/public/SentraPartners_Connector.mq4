//+------------------------------------------------------------------+
//|                                    SentraPartners_Connector.mq4  |
//|                                              Sentra Partners      |
//|                                      https://sentrapartners.com   |
//+------------------------------------------------------------------+
#property copyright "Sentra Partners"
#property link      "https://sentrapartners.com"
#property version   "3.0"
#property strict
#property description "Conector MT4 para Sentra Partners - Versão Simplificada"

//--- Parâmetros de Entrada
input string UserEmail = "seu@email.com";        // Email cadastrado na plataforma
input string AccountType = "CENT";                // Tipo de conta: CENT ou STANDARD
input int SyncInterval = 60;                      // Intervalo de sincronização (segundos)
input bool DebugMode = false;                     // Modo debug (mostra mais logs)

//--- Variáveis Globais
string API_BASE_URL = "https://sentrapartners.com/api/mt4";
datetime lastSync = 0;
int lastTradeCount = 0;

//+------------------------------------------------------------------+
//| Inicialização do Expert Advisor                                  |
//+------------------------------------------------------------------+
int OnInit()
{
   Print("╔════════════════════════════════════════╗");
   Print("║  SENTRA PARTNERS CONNECTOR v3.0       ║");
   Print("╚════════════════════════════════════════╝");
   Print("Email: ", UserEmail);
   Print("Conta: ", AccountNumber());
   Print("Tipo: ", AccountType);
   Print("Broker: ", AccountCompany());
   Print("Servidor: ", AccountServer());
   Print("Moeda: ", AccountCurrency());
   Print("Alavancagem: ", AccountLeverage());
   Print("════════════════════════════════════════");
   
   // Validações
   if(UserEmail == "seu@email.com" || UserEmail == "")
   {
      Alert("❌ ERRO: Configure o parâmetro UserEmail!");
      return(INIT_FAILED);
   }
   
   if(AccountType != "CENT" && AccountType != "STANDARD")
   {
      Alert("❌ ERRO: AccountType deve ser CENT ou STANDARD");
      return(INIT_FAILED);
   }
   
   // Sincronização inicial
   SyncAccount();
   SyncTrades();
   
   Print("✅ Conector iniciado com sucesso!");
   return(INIT_SUCCEEDED);
}

//+------------------------------------------------------------------+
//| Desligamento do Expert Advisor                                   |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
   Print("🔌 Conector desconectado. Motivo: ", reason);
}

//+------------------------------------------------------------------+
//| Função executada a cada tick                                     |
//+------------------------------------------------------------------+
void OnTick()
{
   // Sincroniza a cada X segundos
   if(TimeCurrent() - lastSync >= SyncInterval)
   {
      SyncAccount();
      SyncTrades();
      lastSync = TimeCurrent();
   }
}

//+------------------------------------------------------------------+
//| Sincroniza dados da conta                                        |
//+------------------------------------------------------------------+
void SyncAccount()
{
   string url = API_BASE_URL + "/heartbeat";
   
   // Monta parâmetros (form-urlencoded)
   string params = 
      "email=" + UserEmail +
      "&account_number=" + IntegerToString(AccountNumber()) +
      "&broker=" + UrlEncode(AccountCompany()) +
      "&server=" + UrlEncode(AccountServer()) +
      "&platform=MT4" +
      "&account_type=" + AccountType +
      "&balance=" + DoubleToString(AccountBalance(), 2) +
      "&equity=" + DoubleToString(AccountEquity(), 2) +
      "&margin_free=" + DoubleToString(AccountFreeMargin(), 2) +
      "&open_positions=" + IntegerToString(OrdersTotal()) +
      "&currency=" + AccountCurrency() +
      "&leverage=" + IntegerToString(AccountLeverage());
   
   // Envia POST
   int result = SendPost(url, params);
   
   if(result == 200)
   {
      if(DebugMode) Print("✅ Conta sincronizada | Balance: $", AccountBalance(), " | Equity: $", AccountEquity());
   }
   else
   {
      Print("⚠️ Erro ao sincronizar conta. HTTP: ", result);
   }
}

//+------------------------------------------------------------------+
//| Sincroniza todos os trades                                       |
//+------------------------------------------------------------------+
void SyncTrades()
{
   int totalOpen = OrdersTotal();
   int totalHistory = OrdersHistoryTotal();
   int synced = 0;
   
   // Sincroniza trades abertos
   for(int i = 0; i < totalOpen; i++)
   {
      if(OrderSelect(i, SELECT_BY_POS, MODE_TRADES))
      {
         if(SyncSingleTrade("open")) synced++;
      }
   }
   
   // Sincroniza histórico (últimos 50 trades para não sobrecarregar)
   int historyStart = MathMax(0, totalHistory - 50);
   for(int i = historyStart; i < totalHistory; i++)
   {
      if(OrderSelect(i, SELECT_BY_POS, MODE_HISTORY))
      {
         if(SyncSingleTrade("closed")) synced++;
      }
   }
   
   if(DebugMode && synced > 0)
   {
      Print("📊 ", synced, " trades sincronizados (", totalOpen, " abertos + ", (totalHistory - historyStart), " histórico)");
   }
}

//+------------------------------------------------------------------+
//| Sincroniza um trade individual                                   |
//+------------------------------------------------------------------+
bool SyncSingleTrade(string status)
{
   string url = API_BASE_URL + "/trade";
   
   // Determina tipo (BUY ou SELL)
   string tradeType = "BUY";
   int orderType = OrderType();
   if(orderType == OP_SELL || orderType == OP_SELLLIMIT || orderType == OP_SELLSTOP)
   {
      tradeType = "SELL";
   }
   
   // Monta parâmetros
   string params = 
      "email=" + UserEmail +
      "&account_number=" + IntegerToString(AccountNumber()) +
      "&ticket=" + IntegerToString(OrderTicket()) +
      "&symbol=" + OrderSymbol() +
      "&type=" + tradeType +
      "&volume=" + DoubleToString(OrderLots(), 2) +
      "&open_price=" + DoubleToString(OrderOpenPrice(), 5) +
      "&close_price=" + DoubleToString(OrderClosePrice(), 5) +
      "&stop_loss=" + DoubleToString(OrderStopLoss(), 5) +
      "&take_profit=" + DoubleToString(OrderTakeProfit(), 5) +
      "&profit=" + DoubleToString(OrderProfit(), 2) +
      "&commission=" + DoubleToString(OrderCommission(), 2) +
      "&swap=" + DoubleToString(OrderSwap(), 2) +
      "&status=" + status +
      "&open_time=" + IntegerToString(OrderOpenTime()) +
      "&close_time=" + IntegerToString(OrderCloseTime());
   
   // Envia POST
   int result = SendPost(url, params);
   
   if(result == 200)
   {
      return true;
   }
   else
   {
      if(DebugMode) Print("⚠️ Erro ao sincronizar trade #", OrderTicket(), ". HTTP: ", result);
      return false;
   }
}

//+------------------------------------------------------------------+
//| Envia requisição POST                                            |
//+------------------------------------------------------------------+
int SendPost(string url, string params)
{
   char post[];
   char result[];
   string headers = "Content-Type: application/x-www-form-urlencoded\r\n";
   
   // Converte parâmetros para array de bytes
   StringToCharArray(params, post, 0, StringLen(params));
   
   // Envia requisição
   int httpCode = WebRequest(
      "POST",
      url,
      headers,
      5000,  // timeout 5 segundos
      post,
      result,
      headers
   );
   
   // Verifica erros
   if(httpCode == -1)
   {
      int error = GetLastError();
      if(error == 4060)
      {
         Print("❌ ERRO: Adicione a URL nas permitidas!");
         Print("   Vá em: Ferramentas > Opções > Expert Advisors");
         Print("   Adicione: https://sentrapartners.com");
      }
      else
      {
         Print("❌ Erro WebRequest: ", error);
      }
   }
   
   return httpCode;
}

//+------------------------------------------------------------------+
//| Codifica string para URL (básico)                                |
//+------------------------------------------------------------------+
string UrlEncode(string str)
{
   string result = str;
   
   // Substitui caracteres especiais mais comuns
   StringReplace(result, " ", "%20");
   StringReplace(result, "&", "%26");
   StringReplace(result, "=", "%3D");
   StringReplace(result, "+", "%2B");
   StringReplace(result, "#", "%23");
   StringReplace(result, "/", "%2F");
   
   return result;
}

//+------------------------------------------------------------------+
