//+------------------------------------------------------------------+
//|                                      SentraPartners_Master.mq4   |
//|                        Copyright 2025, Sentra Partners           |
//|                                   https://sentrapartners.com     |
//+------------------------------------------------------------------+
#property copyright "Copyright 2025, Sentra Partners"
#property link      "https://sentrapartners.com"
#property version   "1.00"
#property strict

//--- Input parameters
input string ServerURL = "https://sentrapartners.com/api/mt/copy-signal";
input string AccountToken = "";  // Token da conta (obtido no painel web)
input int SendInterval = 1;      // Intervalo de envio em segundos
input bool SendOnlyNewTrades = true;  // Enviar apenas trades novos
input bool EnableLogging = true;  // Habilitar logs detalhados

//--- Global variables
datetime lastSendTime = 0;
int lastTradesCount = 0;
string lastTradesList = "";

//+------------------------------------------------------------------+
//| Expert initialization function                                   |
//+------------------------------------------------------------------+
int OnInit()
{
   if(AccountToken == "")
   {
      Alert("ERRO: Token da conta não configurado! Configure o parâmetro AccountToken.");
      return(INIT_FAILED);
   }
   
   Print("===========================================");
   Print("Sentra Partners - Master EA Iniciado");
   Print("Conta: ", AccountNumber());
   Print("Servidor: ", ServerURL);
   Print("===========================================");
   
   return(INIT_SUCCEEDED);
}

//+------------------------------------------------------------------+
//| Expert deinitialization function                                 |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
   Print("Sentra Partners - Master EA Encerrado. Razão: ", reason);
}

//+------------------------------------------------------------------+
//| Expert tick function                                             |
//+------------------------------------------------------------------+
void OnTick()
{
   // Verificar intervalo de envio
   if(TimeCurrent() - lastSendTime < SendInterval)
      return;
   
   lastSendTime = TimeCurrent();
   
   // Enviar informações de trades abertos
   SendOpenTrades();
}

//+------------------------------------------------------------------+
//| Enviar trades abertos para o servidor                           |
//+------------------------------------------------------------------+
void SendOpenTrades()
{
   int totalTrades = OrdersTotal();
   
   // Se não há trades e não houve mudança, não enviar
   if(totalTrades == 0 && lastTradesCount == 0)
      return;
   
   string tradesJson = "[";
   int validTrades = 0;
   
   for(int i = 0; i < totalTrades; i++)
   {
      if(!OrderSelect(i, SELECT_BY_POS, MODE_TRADES))
         continue;
      
      // Apenas ordens do símbolo atual ou todas?
      // Vamos enviar todas as ordens abertas
      
      if(validTrades > 0)
         tradesJson += ",";
      
      tradesJson += "{";
      tradesJson += "\"ticket\":" + IntegerToString(OrderTicket()) + ",";
      tradesJson += "\"symbol\":\"" + OrderSymbol() + "\",";
      tradesJson += "\"type\":" + IntegerToString(OrderType()) + ",";
      tradesJson += "\"lots\":" + DoubleToString(OrderLots(), 2) + ",";
      tradesJson += "\"openPrice\":" + DoubleToString(OrderOpenPrice(), 5) + ",";
      tradesJson += "\"stopLoss\":" + DoubleToString(OrderStopLoss(), 5) + ",";
      tradesJson += "\"takeProfit\":" + DoubleToString(OrderTakeProfit(), 5) + ",";
      tradesJson += "\"openTime\":\"" + TimeToString(OrderOpenTime(), TIME_DATE|TIME_SECONDS) + "\",";
      tradesJson += "\"comment\":\"" + OrderComment() + "\",";
      tradesJson += "\"magic\":" + IntegerToString(OrderMagicNumber());
      tradesJson += "}";
      
      validTrades++;
   }
   
   tradesJson += "]";
   
   // Verificar se houve mudança nos trades
   if(SendOnlyNewTrades && tradesJson == lastTradesList)
      return;
   
   lastTradesList = tradesJson;
   lastTradesCount = validTrades;
   
   // Preparar dados para envio
   string postData = "{";
   postData += "\"accountNumber\":" + IntegerToString(AccountNumber()) + ",";
   postData += "\"accountToken\":\"" + AccountToken + "\",";
   postData += "\"timestamp\":\"" + TimeToString(TimeCurrent(), TIME_DATE|TIME_SECONDS) + "\",";
   postData += "\"trades\":" + tradesJson;
   postData += "}";
   
   // Enviar para o servidor
   SendToServer(postData);
   
   if(EnableLogging)
      Print("Enviados ", validTrades, " trades para o servidor");
}

//+------------------------------------------------------------------+
//| Enviar dados para o servidor via HTTP POST                      |
//+------------------------------------------------------------------+
void SendToServer(string jsonData)
{
   string headers = "Content-Type: application/json\r\n";
   string url = ServerURL;
   
   char post[];
   char result[];
   string resultHeaders;
   
   ArrayResize(post, StringToCharArray(jsonData, post, 0, WHOLE_ARRAY) - 1);
   
   int timeout = 5000; // 5 segundos
   
   int res = WebRequest(
      "POST",
      url,
      headers,
      timeout,
      post,
      result,
      resultHeaders
   );
   
   if(res == -1)
   {
      int error = GetLastError();
      if(error == 4060)
      {
         Print("ERRO: URL não está na lista de permitidas!");
         Print("Adicione '", ServerURL, "' nas configurações do MT4/MT5:");
         Print("Ferramentas > Opções > Expert Advisors > Permitir WebRequest para URL listada");
      }
      else
      {
         Print("Erro ao enviar dados: ", error);
      }
   }
   else if(res == 200)
   {
      string response = CharArrayToString(result);
      if(EnableLogging)
         Print("Resposta do servidor: ", response);
   }
   else
   {
      Print("Erro HTTP: ", res);
   }
}

//+------------------------------------------------------------------+

