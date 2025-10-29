//+------------------------------------------------------------------+
//|                                  EA_MT4_SentraPartners_XML.mq4   |
//|                         Sentra Partners - MT4 XML Exporter       |
//|                              https://sentrapartners.com          |
//+------------------------------------------------------------------+
#property copyright "Sentra Partners"
#property link      "https://sentrapartners.com"
#property version   "3.0"
#property strict

//--- Input Parameters
input string UserEmail = "seu@email.com";           // Email cadastrado no Sentra Partners
input string AccountType = "CENT";                   // Tipo de conta: CENT ou STANDARD
input int UpdateInterval = 60;                       // Intervalo de atualização em segundos
input bool ExportTrades = true;                      // Exportar trades
input bool DebugMode = false;                        // Modo debug (mais logs)

//--- Global Variables
datetime lastUpdate = 0;
string exportPath = "";

//+------------------------------------------------------------------+
//| Expert initialization function                                   |
//+------------------------------------------------------------------+
int OnInit()
{
    Print("========================================");
    Print("Sentra Partners EA - XML Exporter v3.0");
    Print("========================================");
    Print("Email: ", UserEmail);
    Print("Conta: ", AccountNumber());
    Print("Tipo: ", AccountType);
    Print("Broker: ", AccountCompany());
    Print("Servidor: ", AccountServer());
    Print("========================================");
    
    // Valida configurações
    if(UserEmail == "seu@email.com" || UserEmail == "") {
        Alert("ERRO: Configure o parâmetro UserEmail com seu email cadastrado!");
        return(INIT_FAILED);
    }
    
    if(AccountType != "CENT" && AccountType != "STANDARD") {
        Alert("ERRO: AccountType deve ser CENT ou STANDARD");
        return(INIT_FAILED);
    }
    
    // Define caminho de exportação (pasta Files do MT4)
    exportPath = "SentraPartners\\";
    
    // Exporta dados iniciais
    ExportData();
    
    return(INIT_SUCCEEDED);
}

//+------------------------------------------------------------------+
//| Expert deinitialization function                                 |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
    Print("EA Sentra Partners desconectado. Motivo: ", reason);
}

//+------------------------------------------------------------------+
//| Expert tick function                                             |
//+------------------------------------------------------------------+
void OnTick()
{
    // Exporta dados a cada X segundos
    if(TimeCurrent() - lastUpdate >= UpdateInterval) {
        ExportData();
        lastUpdate = TimeCurrent();
    }
}

//+------------------------------------------------------------------+
//| Exporta todos os dados para XML                                  |
//+------------------------------------------------------------------+
void ExportData()
{
    string filename = exportPath + "account_" + IntegerToString(AccountNumber()) + ".xml";
    int handle = FileOpen(filename, FILE_WRITE|FILE_TXT);
    
    if(handle == INVALID_HANDLE) {
        Print("❌ Erro ao criar arquivo XML: ", GetLastError());
        return;
    }
    
    // Cabeçalho XML
    FileWrite(handle, "<?xml version=\"1.0\" encoding=\"UTF-8\"?>");
    FileWrite(handle, "<SentraPartnersData>");
    
    // Informações da conta
    FileWrite(handle, "  <Account>");
    FileWrite(handle, "    <Email>" + UserEmail + "</Email>");
    FileWrite(handle, "    <Number>" + IntegerToString(AccountNumber()) + "</Number>");
    FileWrite(handle, "    <Broker>" + AccountCompany() + "</Broker>");
    FileWrite(handle, "    <Server>" + AccountServer() + "</Server>");
    FileWrite(handle, "    <Type>" + AccountType + "</Type>");
    FileWrite(handle, "    <Platform>MT4</Platform>");
    FileWrite(handle, "    <Currency>" + AccountCurrency() + "</Currency>");
    FileWrite(handle, "    <Leverage>" + IntegerToString(AccountLeverage()) + "</Leverage>");
    FileWrite(handle, "    <Balance>" + DoubleToString(AccountBalance(), 2) + "</Balance>");
    FileWrite(handle, "    <Equity>" + DoubleToString(AccountEquity(), 2) + "</Equity>");
    FileWrite(handle, "    <MarginFree>" + DoubleToString(AccountFreeMargin(), 2) + "</MarginFree>");
    FileWrite(handle, "    <OpenPositions>" + IntegerToString(OrdersTotal()) + "</OpenPositions>");
    FileWrite(handle, "    <Timestamp>" + IntegerToString(TimeCurrent()) + "</Timestamp>");
    FileWrite(handle, "  </Account>");
    
    // Trades abertos
    if(ExportTrades) {
        FileWrite(handle, "  <OpenTrades>");
        int totalOpen = OrdersTotal();
        for(int i = 0; i < totalOpen; i++) {
            if(OrderSelect(i, SELECT_BY_POS, MODE_TRADES)) {
                WriteTradeXML(handle);
            }
        }
        FileWrite(handle, "  </OpenTrades>");
        
        // Histórico de trades (últimos 100)
        FileWrite(handle, "  <HistoryTrades>");
        int totalHistory = OrdersHistoryTotal();
        int start = MathMax(0, totalHistory - 100);
        for(int i = start; i < totalHistory; i++) {
            if(OrderSelect(i, SELECT_BY_POS, MODE_HISTORY)) {
                WriteTradeXML(handle);
            }
        }
        FileWrite(handle, "  </HistoryTrades>");
    }
    
    // Fecha XML
    FileWrite(handle, "</SentraPartnersData>");
    FileClose(handle);
    
    if(DebugMode) {
        Print("✅ Dados exportados para: ", filename);
        Print("   Balance: ", AccountBalance(), " | Equity: ", AccountEquity());
        Print("   Trades abertos: ", OrdersTotal());
    }
}

//+------------------------------------------------------------------+
//| Escreve um trade em formato XML                                  |
//+------------------------------------------------------------------+
void WriteTradeXML(int handle)
{
    string type = "";
    switch(OrderType()) {
        case OP_BUY:      type = "BUY"; break;
        case OP_SELL:     type = "SELL"; break;
        case OP_BUYLIMIT: type = "BUY"; break;
        case OP_SELLLIMIT: type = "SELL"; break;
        case OP_BUYSTOP:  type = "BUY"; break;
        case OP_SELLSTOP: type = "SELL"; break;
    }
    
    string status = (OrderCloseTime() == 0) ? "open" : "closed";
    
    FileWrite(handle, "    <Trade>");
    FileWrite(handle, "      <Ticket>" + IntegerToString(OrderTicket()) + "</Ticket>");
    FileWrite(handle, "      <Symbol>" + OrderSymbol() + "</Symbol>");
    FileWrite(handle, "      <Type>" + type + "</Type>");
    FileWrite(handle, "      <Volume>" + DoubleToString(OrderLots(), 2) + "</Volume>");
    FileWrite(handle, "      <OpenPrice>" + DoubleToString(OrderOpenPrice(), 5) + "</OpenPrice>");
    FileWrite(handle, "      <ClosePrice>" + DoubleToString(OrderClosePrice(), 5) + "</ClosePrice>");
    FileWrite(handle, "      <StopLoss>" + DoubleToString(OrderStopLoss(), 5) + "</StopLoss>");
    FileWrite(handle, "      <TakeProfit>" + DoubleToString(OrderTakeProfit(), 5) + "</TakeProfit>");
    FileWrite(handle, "      <Profit>" + DoubleToString(OrderProfit(), 2) + "</Profit>");
    FileWrite(handle, "      <Commission>" + DoubleToString(OrderCommission(), 2) + "</Commission>");
    FileWrite(handle, "      <Swap>" + DoubleToString(OrderSwap(), 2) + "</Swap>");
    FileWrite(handle, "      <Status>" + status + "</Status>");
    FileWrite(handle, "      <OpenTime>" + IntegerToString(OrderOpenTime()) + "</OpenTime>");
    FileWrite(handle, "      <CloseTime>" + IntegerToString(OrderCloseTime()) + "</CloseTime>");
    FileWrite(handle, "    </Trade>");
}

//+------------------------------------------------------------------+
