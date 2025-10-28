//+------------------------------------------------------------------+
//|                                        Sentra_MT4_Connector.mq4 |
//|                                  Sentra Partners - MT4 Connector |
//|                                  Sincroniza trades automaticamente |
//+------------------------------------------------------------------+
#property copyright "Sentra Partners - 2025"
#property link      "https://sentrapartners.com"
#property version   "1.00"
#property strict

//+------------------------------------------------------------------+
//| Parâmetros de Entrada                                             |
//+------------------------------------------------------------------+

input string Section1 = "=== Configurações da Conta ==="; // ================
input string UserEmail = "";                               // Seu email cadastrado no Sentra Partners
input string AccountType = "Standard";                   // Tipo de conta: Cent ou Standard

input string Section2 = "=== Configurações Avançadas ==="; // ================
input int CheckInterval = 10;                              // Intervalo de verificação (segundos)
input bool ShowDebugLogs = true;                           // Mostrar logs detalhados

//+------------------------------------------------------------------+
//| Variáveis Globais                                                 |
//+------------------------------------------------------------------+
string API_URL = "https://sentrapartners.com/api/mt/trades";
string AUTH_URL = "https://sentrapartners.com/api/mt/auth";
string apiKey = "";
datetime lastProcessedTime = 0;
int lastProcessedTicket = 0;
bool initialSyncDone = false;
string stateFilename = "sentra_connector_state.dat";
int totalTradesExported = 0;
bool authenticated = false;

//+------------------------------------------------------------------+
//| Inicialização do EA                                               |
//+------------------------------------------------------------------+
int OnInit()
{
   Print("╔══════════════════════════════════════════════════════════════╗");
   Print("║         Sentra Partners - MT4 Connector v1.0                ║");
   Print("║         Conectando sua conta ao Sentra Partners...           ║");
   Print("╚══════════════════════════════════════════════════════════════╝");
   Print("");
   
   // Validar configurações
   if(UserEmail == "")
   {
      Alert("ERRO: Email não configurado!\n\nPor favor, configure seu email no EA.");
      Print(">>> ERRO: Email não configurado. Configure o parâmetro UserEmail.");
      return INIT_FAILED;
   }
   
   if(AccountType != "Cent" && AccountType != "Standard")
   {
      Alert("ERRO: Tipo de conta inválido!\n\nUse: Cent ou Standard");
      Print(">>> ERRO: AccountType deve ser 'Cent' ou 'Standard'");
      return INIT_FAILED;
   }
   
   Print(">>> Email: ", UserEmail);
   Print(">>> Tipo de Conta: ", AccountType);
   Print(">>> Número da Conta MT4: ", AccountNumber());
   Print("");
   
   // Autenticar com servidor
   Print(">>> Autenticando com Sentra Partners...");
   if(!Authenticate())
   {
      Alert("ERRO DE AUTENTICAÇÃO!\n\nVerifique se seu email está cadastrado no Sentra Partners.");
      Print(">>> ERRO: Falha na autenticação. Verifique seu email.");
      return INIT_FAILED;
   }
   
   Print(">>> ✅ Autenticação bem-sucedida!");
   Print("");
   
   // Carregar estado anterior
   LoadState();
   
   // Sincronização inicial
   if(!initialSyncDone)
   {
      Print(">>> PRIMEIRA EXECUÇÃO DETECTADA");
      Print(">>> Sincronizando histórico completo...");
      Print("");
      
      SyncAllHistory();
      
      initialSyncDone = true;
      SaveState();
      
      Print("");
      Print(">>> ✅ SINCRONIZAÇÃO INICIAL CONCLUÍDA");
      Print(">>> Total de trades exportados: ", totalTradesExported);
      Print("");
   }
   else
   {
      Print(">>> Sincronização inicial já realizada.");
      Print(">>> Modo: Monitoramento contínuo.");
      Print("");
   }
   
   // Iniciar monitoramento contínuo
   EventSetTimer(CheckInterval);
   Print(">>> ✅ Monitoramento em tempo real ATIVADO");
   Print(">>> Verificando novas ordens a cada ", CheckInterval, " segundos");
   Print("");
   Print(">>> 🚀 EA PRONTO E OPERACIONAL!");
   Print("");
   
   return INIT_SUCCEEDED;
}

//+------------------------------------------------------------------+
//| Desinicialização do EA                                            |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
   EventKillTimer();
   SaveState();
   
   Print("");
   Print("╔══════════════════════════════════════════════════════════════╗");
   Print("║         Sentra Partners - MT4 Connector Encerrado           ║");
   Print("║         Total de trades exportados: ", totalTradesExported, "                    ║");
   Print("╚══════════════════════════════════════════════════════════════╝");
   Print("");
}

//+------------------------------------------------------------------+
//| Timer - Monitoramento contínuo                                    |
//+------------------------------------------------------------------+
void OnTimer()
{
   CheckForNewClosedOrders();
}

//+------------------------------------------------------------------+
//| Autenticar com servidor Sentra Partners                          |
//+------------------------------------------------------------------+
bool Authenticate()
{
   string postData = "email=" + UserEmail + 
                     "&account_number=" + IntegerToString(AccountNumber()) +
                     "&account_type=" + AccountType +
                     "&broker=" + AccountCompany() +
                     "&account_name=" + AccountName();
   
   char post[];
   char result[];
   string headers = "Content-Type: application/x-www-form-urlencoded\r\n";
   
   StringToCharArray(postData, post, 0, StringLen(postData));
   
   ResetLastError();
   
   int httpCode = WebRequest(
      "POST",
      AUTH_URL,
      headers,
      5000,
      post,
      result,
      headers
   );
   
   if(httpCode == -1)
   {
      int error = GetLastError();
      Print(">>> ERRO ao conectar com servidor. Código: ", error);
      
      if(error == 4060)
      {
         Print(">>> SOLUÇÃO: Adicione 'https://sentrapartners.com' na lista de URLs permitidas:");
         Print(">>>   1. Menu: Ferramentas → Opções");
         Print(">>>   2. Aba: Expert Advisors");
         Print(">>>   3. Marque: Allow WebRequest for listed URL");
         Print(">>>   4. Adicione: https://sentrapartners.com");
         
         Alert("ATENÇÃO!\n\n" +
               "Adicione a URL do Sentra Partners nas configurações:\n" +
               "Ferramentas → Opções → Expert Advisors\n" +
               "Allow WebRequest: https://sentrapartners.com");
      }
      
      return false;
   }
   
   string response = CharArrayToString(result);
   
   if(ShowDebugLogs)
   {
      Print(">>> Código HTTP: ", httpCode);
      Print(">>> Resposta: ", response);
   }
   
   if(httpCode == 200)
   {
      // Extrair API Key da resposta (formato: {"success":true,"apiKey":"abc123"})
      int startPos = StringFind(response, "\"apiKey\":\"");
      if(startPos >= 0)
      {
         startPos += 10; // Pular "apiKey":"
         int endPos = StringFind(response, "\"", startPos);
         if(endPos > startPos)
         {
            apiKey = StringSubstr(response, startPos, endPos - startPos);
            authenticated = true;
            return true;
         }
      }
   }
   
   return false;
}

//+------------------------------------------------------------------+
//| Sincronizar todo o histórico                                      |
//+------------------------------------------------------------------+
void SyncAllHistory()
{
   int total = OrdersHistoryTotal();
   Print(">>> Total de ordens no histórico: ", total);
   
   if(total == 0)
   {
      Print(">>> AVISO: Nenhuma ordem no histórico.");
      Print(">>> Certifique-se de que 'All History' está selecionado na aba Account History.");
      return;
   }
   
   int exported = 0;
   
   for(int i = 0; i < total; i++)
   {
      if(OrderSelect(i, SELECT_BY_POS, MODE_HISTORY))
      {
         if(OrderType() <= 1) // Apenas Buy e Sell (ignora pending orders)
         {
            if(SendTradeToServer(OrderTicket()))
            {
               exported++;
               
               if(exported % 10 == 0)
               {
                  Print(">>> Progresso: ", exported, "/", total, " trades exportados...");
               }
            }
         }
      }
   }
   
   totalTradesExported += exported;
   Print(">>> ✅ Exportação concluída: ", exported, " trades enviados");
}

//+------------------------------------------------------------------+
//| Verificar novas ordens fechadas                                   |
//+------------------------------------------------------------------+
void CheckForNewClosedOrders()
{
   int total = OrdersHistoryTotal();
   
   for(int i = total - 1; i >= 0; i--)
   {
      if(OrderSelect(i, SELECT_BY_POS, MODE_HISTORY))
      {
         if(OrderType() <= 1) // Buy ou Sell
         {
            if(OrderTicket() > lastProcessedTicket || OrderCloseTime() > lastProcessedTime)
            {
               if(ShowDebugLogs)
               {
                  Print(">>> Nova ordem detectada: #", OrderTicket());
               }
               
               if(SendTradeToServer(OrderTicket()))
               {
                  lastProcessedTicket = OrderTicket();
                  lastProcessedTime = OrderCloseTime();
                  totalTradesExported++;
                  SaveState();
                  
                  Print(">>> ✅ Trade #", OrderTicket(), " enviado para Sentra Partners");
               }
            }
         }
      }
   }
}

//+------------------------------------------------------------------+
//| Enviar trade para servidor                                        |
//+------------------------------------------------------------------+
bool SendTradeToServer(int ticket)
{
   if(!OrderSelect(ticket, SELECT_BY_TICKET, MODE_HISTORY))
   {
      return false;
   }
   
   // Montar JSON do trade
   string json = "{";
   json += "\"ticket\":" + IntegerToString(OrderTicket()) + ",";
   json += "\"symbol\":\"" + OrderSymbol() + "\",";
   json += "\"type\":" + IntegerToString(OrderType()) + ",";
   json += "\"lots\":" + DoubleToString(OrderLots(), 2) + ",";
   json += "\"open_price\":" + DoubleToString(OrderOpenPrice(), 5) + ",";
   json += "\"open_time\":\"" + TimeToString(OrderOpenTime(), TIME_DATE|TIME_SECONDS) + "\",";
   json += "\"close_price\":" + DoubleToString(OrderClosePrice(), 5) + ",";
   json += "\"close_time\":\"" + TimeToString(OrderCloseTime(), TIME_DATE|TIME_SECONDS) + "\",";
   json += "\"stop_loss\":" + DoubleToString(OrderStopLoss(), 5) + ",";
   json += "\"take_profit\":" + DoubleToString(OrderTakeProfit(), 5) + ",";
   json += "\"profit\":" + DoubleToString(OrderProfit(), 2) + ",";
   json += "\"commission\":" + DoubleToString(OrderCommission(), 2) + ",";
   json += "\"swap\":" + DoubleToString(OrderSwap(), 2) + ",";
   json += "\"comment\":\"" + OrderComment() + "\",";
   json += "\"magic_number\":" + IntegerToString(OrderMagicNumber()) + ",";
   json += "\"account\":" + IntegerToString(AccountNumber());
   json += "}";
   
   char post[];
   char result[];
   string headers = "Content-Type: application/json\r\n";
   headers += "Authorization: Bearer " + apiKey + "\r\n";
   
   StringToCharArray(json, post, 0, StringLen(json));
   
   ResetLastError();
   
   int httpCode = WebRequest(
      "POST",
      API_URL,
      headers,
      5000,
      post,
      result,
      headers
   );
   
   if(httpCode == -1)
   {
      Print(">>> ERRO ao enviar trade #", ticket, ". Código: ", GetLastError());
      return false;
   }
   
   if(httpCode == 200 || httpCode == 201)
   {
      return true;
   }
   
   Print(">>> ERRO: Servidor retornou código ", httpCode, " para trade #", ticket);
   return false;
}

//+------------------------------------------------------------------+
//| Salvar estado                                                      |
//+------------------------------------------------------------------+
void SaveState()
{
   int handle = FileOpen(stateFilename, FILE_WRITE|FILE_BIN);
   if(handle != INVALID_HANDLE)
   {
      FileWriteInteger(handle, lastProcessedTicket);
      FileWriteLong(handle, (long)lastProcessedTime);
      FileWriteInteger(handle, initialSyncDone ? 1 : 0);
      FileWriteInteger(handle, totalTradesExported);
      FileClose(handle);
   }
}

//+------------------------------------------------------------------+
//| Carregar estado                                                    |
//+------------------------------------------------------------------+
void LoadState()
{
   int handle = FileOpen(stateFilename, FILE_READ|FILE_BIN);
   if(handle != INVALID_HANDLE)
   {
      lastProcessedTicket = FileReadInteger(handle);
      lastProcessedTime = (datetime)FileReadLong(handle);
      initialSyncDone = FileReadInteger(handle) == 1;
      totalTradesExported = FileReadInteger(handle);
      FileClose(handle);
      
      if(ShowDebugLogs)
      {
         Print(">>> Estado carregado:");
         Print(">>>   Último ticket: ", lastProcessedTicket);
         Print(">>>   Última data: ", TimeToString(lastProcessedTime));
         Print(">>>   Sincronização inicial: ", initialSyncDone ? "Sim" : "Não");
         Print(">>>   Total exportado: ", totalTradesExported);
      }
   }
}

