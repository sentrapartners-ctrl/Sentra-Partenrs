//+------------------------------------------------------------------+
//|                                      SentraPartners_Master.mq4   |
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

//--- Input parameters
input string ServerURL = "https://sentrapartners.com/api/mt/copy-signal";
input string LicenseCheckURL = "https://sentrapartners.com/api/ea-license/validate";
input string AccountToken = "";  // Token da conta (obtido no painel web)
input int SendInterval = 1;      // Intervalo de envio em segundos
input bool SendOnlyNewTrades = true;  // Enviar apenas trades novos
input bool EnableLogging = true;  // Habilitar logs detalhados

//--- Global variables
datetime lastSendTime = 0;
datetime lastLicenseCheck = 0;
int lastTradesCount = 0;
string lastTradesList = "";
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
      Alert("ERRO: Token da conta não configurado! Configure o parâmetro AccountToken.");
      return(INIT_FAILED);
   }
   
   Print("===========================================");
   Print("Sentra Partners - Master EA v2.0");
   Print("Conta: ", AccountNumber());
   Print("Servidor: ", ServerURL);
   Print("===========================================");
   
   // Verificar licença imediatamente
   if(!CheckLicense())
   {
      Alert("ERRO: Licença inválida ou expirada! Entre em contato com o suporte.");
      return(INIT_FAILED);
   }
   
   Print("Licença válida até: ", licenseExpiryDate);
   Print("Dias restantes: ", licenseDaysRemaining);
   
   if(licenseDaysRemaining <= 7)
   {
      Alert("AVISO: Sua licença expira em ", licenseDaysRemaining, " dias! Renove em breve.");
   }
   
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
   // Verificar licença a cada 1 hora
   if(TimeCurrent() - lastLicenseCheck > 3600)
   {
      if(!CheckLicense())
      {
         Alert("ERRO: Licença inválida ou expirada! EA será desativado.");
         ExpertRemove();
         return;
      }
      
      if(licenseDaysRemaining <= 3)
      {
         Alert("URGENTE: Sua licença expira em ", licenseDaysRemaining, " dias!");
      }
   }
   
   // Verificar intervalo de envio
   if(TimeCurrent() - lastSendTime < SendInterval)
      return;
   
   lastSendTime = TimeCurrent();
   
   // Enviar informações de trades abertos
   SendOpenTrades();
}

//+------------------------------------------------------------------+
//| Verificar licença no servidor                                   |
//+------------------------------------------------------------------+
bool CheckLicense()
{
   string postData = "{";
   postData += "\"accountNumber\":" + IntegerToString(AccountNumber()) + ",";
   postData += "\"eaType\":\"master\",";
   postData += "\"terminalInfo\":{";
   postData += "\"platform\":\"MT4\",";
   postData += "\"build\":" + IntegerToString(TerminalInfoInteger(TERMINAL_BUILD)) + ",";
   postData += "\"company\":\"" + TerminalInfoString(TERMINAL_COMPANY) + "\"";
   postData += "}";
   postData += "}";
   
   string headers = "Content-Type: application/json\r\n";
   char post[];
   char result[];
   string resultHeaders;
   
   ArrayResize(post, StringToCharArray(postData, post, 0, WHOLE_ARRAY) - 1);
   
   int timeout = 10000; // 10 segundos
   
   int res = WebRequest(
      "POST",
      LicenseCheckURL,
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
         Print("Adicione '", LicenseCheckURL, "' nas configurações do MT4");
      }
      else
      {
         Print("Erro ao verificar licença: ", error);
      }
      return false;
   }
   
   if(res != 200)
   {
      Print("Erro HTTP ao verificar licença: ", res);
      return false;
   }
   
   string response = CharArrayToString(result);
   
   // Parse simples do JSON
   bool valid = StringFind(response, "\"valid\":true") >= 0;
   
   if(!valid)
   {
      // Extrair mensagem de erro
      int errorPos = StringFind(response, "\"error\":\"");
      if(errorPos >= 0)
      {
         int errorStart = errorPos + 9;
         int errorEnd = StringFind(response, "\"", errorStart);
         string errorMsg = StringSubstr(response, errorStart, errorEnd - errorStart);
         Print("Erro de licença: ", errorMsg);
      }
      
      // Extrair mensagem
      int msgPos = StringFind(response, "\"message\":\"");
      if(msgPos >= 0)
      {
         int msgStart = msgPos + 11;
         int msgEnd = StringFind(response, "\"", msgStart);
         string msg = StringSubstr(response, msgStart, msgEnd - msgStart);
         Print("Mensagem: ", msg);
      }
      
      return false;
   }
   
   // Extrair data de expiração
   int expiryPos = StringFind(response, "\"expiryDate\":\"");
   if(expiryPos >= 0)
   {
      int expiryStart = expiryPos + 14;
      int expiryEnd = StringFind(response, "\"", expiryStart);
      licenseExpiryDate = StringSubstr(response, expiryStart, expiryEnd - expiryStart);
   }
   
   // Extrair dias restantes
   int daysPos = StringFind(response, "\"daysRemaining\":");
   if(daysPos >= 0)
   {
      int daysStart = daysPos + 16;
      int daysEnd = StringFind(response, ",", daysStart);
      if(daysEnd < 0) daysEnd = StringFind(response, "}", daysStart);
      string daysStr = StringSubstr(response, daysStart, daysEnd - daysStart);
      licenseDaysRemaining = StringToInteger(daysStr);
   }
   
   lastLicenseCheck = TimeCurrent();
   licenseValid = true;
   
   if(EnableLogging)
      Print("Licença verificada com sucesso. Expira em ", licenseDaysRemaining, " dias");
   
   return true;
}

//+------------------------------------------------------------------+
//| Enviar trades abertos para o servidor                           |
//+------------------------------------------------------------------+
void SendOpenTrades()
{
   if(!licenseValid)
      return;
   
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

