//+------------------------------------------------------------------+
//|                                      SentraPartners_Slave_MT4.mq4 |
//|                        Copyright 2025, Sentra Partners            |
//|                                   https://sentrapartners.com      |
//+------------------------------------------------------------------+
#property copyright "Copyright 2025, Sentra Partners"
#property link      "https://sentrapartners.com"
#property version   "4.01"
#property strict

//====================================================
// SISTEMA DE LICENCIAMENTO
//====================================================
#define LICENSE_EXPIRY_DATE D'2025.12.31'
#define ALLOWED_ACCOUNTS ""

//====================================================
// PARÂMETROS
//====================================================
input string UserEmail = "";                    // Email da conta Slave
input string MasterAccountNumber = "";          // Número da conta Master
input string SlaveServer = "https://sentrapartners.com/api/mt/copy";
input int CheckInterval = 1;                    // Intervalo de verificação (segundos)
input double LotMultiplier = 1.0;               // Multiplicador de lote
input bool MasterIsCent = false;                // Master é conta Cent?
input bool SlaveIsCent = false;                 // Slave é conta Cent?
input int Slippage = 3;                         // Slippage
input int MagicNumber = 888888;                 // Magic Number
input bool EnableLogs = true;                   // Logs

//====================================================
// VARIÁVEIS GLOBAIS
//====================================================
datetime lastCheckTime = 0;

//====================================================
// INICIALIZAÇÃO
//====================================================
int OnInit() {
    Print("===========================================");
    Print("Sentra Partners - Slave MT4 v4.01 - ENDPOINT CORRIGIDO");
    Print("===========================================");
    Print("Slave Email: ", UserEmail);
    Print("Master Account: ", MasterAccountNumber);
    Print("Servidor: ", SlaveServer);
    Print("Check Interval: ", CheckInterval, "s");
    Print("Lot Multiplier: ", LotMultiplier);
    Print("Master Tipo: ", MasterIsCent ? "CENT" : "STANDARD");
    Print("Slave Tipo: ", SlaveIsCent ? "CENT" : "STANDARD");
    Print("===========================================");
    
    if(!ValidateLicense()) {
        Alert("❌ LICENÇA INVÁLIDA!");
        return(INIT_FAILED);
    }
    
    if(UserEmail == "" || MasterAccountNumber == "") {
        Alert("❌ Configure UserEmail e MasterAccountNumber!");
        return(INIT_FAILED);
    }
    
    Print("✅ Slave EA inicializado!");
    Print("Aguardando sinais do Master...");
    return(INIT_SUCCEEDED);
}

//====================================================
// TICK
//====================================================
void OnTick() {
    if(TimeCurrent() - lastCheckTime >= CheckInterval) {
        CheckMasterSignals();
        lastCheckTime = TimeCurrent();
    }
}

//====================================================
// VERIFICAR SINAIS DO MASTER
//====================================================
void CheckMasterSignals() {
    string url = SlaveServer + "/slave-signals?master_account_id=" + MasterAccountNumber;
    if(UserEmail != "") {
        url += "&slave_email=" + UserEmail;
    }
    
    if(EnableLogs) Print("[V4.01] 🔗 URL: ", url);
    
    char post[];
    char result[];
    string headers = "";
    
    int res = WebRequest(
        "GET",
        url,
        headers,
        5000,
        post,
        result,
        headers
    );
    
    if(res == -1) {
        int error = GetLastError();
        if(EnableLogs) Print("❌ Erro WebRequest: ", error);
        if(error == 4060) {
            Print("⚠️ Adicione a URL em Ferramentas → Opções → Expert Advisors:");
            Print("   https://sentrapartners.com");
        }
        return;
    }
    
    if(res != 200) {
        if(EnableLogs) Print("❌ Erro HTTP: ", res);
        return;
    }
    
    string response = CharArrayToString(result);
    
    if(StringFind(response, "\"action\":\"heartbeat\"") >= 0) {
        ProcessHeartbeat(response);
    }
}

//====================================================
// PROCESSAR HEARTBEAT
//====================================================
void ProcessHeartbeat(string json) {
    // Extrair array de posições
    int posStart = StringFind(json, "\"positions\":[");
    if(posStart < 0) return;
    
    int posEnd = StringFind(json, "]", posStart);
    if(posEnd < 0) return;
    
    string positionsJson = StringSubstr(json, posStart + 13, posEnd - posStart - 13);
    
    if(EnableLogs) {
        int count = 0;
        int search = 0;
        while((search = StringFind(positionsJson, "\"ticket\"", search)) >= 0) {
            count++;
            search++;
        }
        Print("💓 Heartbeat recebido do Master");
        Print("📊 Master tem ", count, " posições");
    }
    
    // Sincronizar posições
    SyncPositions(positionsJson);
}

//====================================================
// SINCRONIZAR POSIÇÕES
//====================================================
void SyncPositions(string positionsJson) {
    // 1. Fechar posições órfãs (que não existem mais no Master)
    for(int i = OrdersTotal() - 1; i >= 0; i--) {
        if(OrderSelect(i, SELECT_BY_POS, MODE_TRADES)) {
            if(OrderMagicNumber() == MagicNumber) {
                int masterTicket = OrderComment();  // Ticket do Master está no comentário
                
                // Verificar se ainda existe no Master
                if(StringFind(positionsJson, "\"ticket\":" + masterTicket) < 0) {
                    if(EnableLogs) Print("🔄 Fechando posição órfã: ", OrderTicket(), " (Master: ", masterTicket, ")");
                    CloseOrder(OrderTicket());
                }
            }
        }
    }
    
    // 2. Abrir posições novas (que existem no Master mas não no Slave)
    int search = 0;
    while(true) {
        int ticketPos = StringFind(positionsJson, "\"ticket\":", search);
        if(ticketPos < 0) break;
        
        // Extrair ticket do Master
        int ticketStart = ticketPos + 9;
        int ticketEnd = StringFind(positionsJson, ",", ticketStart);
        string masterTicketStr = StringSubstr(positionsJson, ticketStart, ticketEnd - ticketStart);
        int masterTicket = StringToInteger(masterTicketStr);
        
        // Verificar se já existe no Slave
        bool exists = false;
        for(int i = 0; i < OrdersTotal(); i++) {
            if(OrderSelect(i, SELECT_BY_POS, MODE_TRADES)) {
                if(OrderMagicNumber() == MagicNumber && OrderComment() == IntegerToString(masterTicket)) {
                    exists = true;
                    break;
                }
            }
        }
        
        if(!exists) {
            // Extrair dados da posição
            int blockStart = StringFind(positionsJson, "{", ticketPos - 10);
            int blockEnd = StringFind(positionsJson, "}", blockStart);
            string posBlock = StringSubstr(positionsJson, blockStart, blockEnd - blockStart + 1);
            
            string symbol = ExtractValue(posBlock, "symbol");
            int type = StringToInteger(ExtractValue(posBlock, "type"));
            double lots = StringToDouble(ExtractValue(posBlock, "lots"));
            double openPrice = StringToDouble(ExtractValue(posBlock, "open_price"));
            double sl = StringToDouble(ExtractValue(posBlock, "stop_loss"));
            double tp = StringToDouble(ExtractValue(posBlock, "take_profit"));
            
            // Normalizar símbolo
            string slaveSymbol = NormalizeSymbol(symbol);
            if(slaveSymbol == "") {
                if(EnableLogs) Print("❌ Símbolo não encontrado: ", symbol);
                search = ticketEnd;
                continue;
            }
            
            // Ajustar lote
            double adjustedLots = AdjustLotForAccountType(lots);
            adjustedLots = NormalizeLot(slaveSymbol, adjustedLots * LotMultiplier);
            
            // Abrir posição
            if(EnableLogs) Print("🔄 Sincronização: Abrindo posição nova do Master: ", masterTicket);
            OpenOrder(slaveSymbol, type, adjustedLots, sl, tp, IntegerToString(masterTicket));
        }
        
        search = ticketEnd;
    }
}

//====================================================
// NORMALIZAR SÍMBOLO
//====================================================
string NormalizeSymbol(string masterSymbol) {
    // Tentar símbolo exato
    SymbolSelect(masterSymbol, true);
    if(MarketInfo(masterSymbol, MODE_BID) > 0) {
        return masterSymbol;
    }
    
    // Remover sufixos comuns
    string baseSymbol = masterSymbol;
    string suffixes[] = {"c", "m", ".a", ".b", "_i", "pro", "ecn", ".raw", ".lp"};
    
    for(int i = 0; i < ArraySize(suffixes); i++) {
        baseSymbol = RemoveSuffix(masterSymbol, suffixes[i]);
        SymbolSelect(baseSymbol, true);
        if(MarketInfo(baseSymbol, MODE_BID) > 0) {
            if(EnableLogs) Print("✅ Símbolo encontrado (sem sufixo): ", baseSymbol, " ← ", masterSymbol);
            return baseSymbol;
        }
    }
    
    // Tentar adicionar sufixos
    for(int i = 0; i < ArraySize(suffixes); i++) {
        string testSymbol = masterSymbol + suffixes[i];
        SymbolSelect(testSymbol, true);
        if(MarketInfo(testSymbol, MODE_BID) > 0) {
            if(EnableLogs) Print("✅ Símbolo encontrado (com sufixo): ", testSymbol, " ← ", masterSymbol);
            return testSymbol;
        }
    }
    
    return "";  // Não encontrado
}

//====================================================
// REMOVER SUFIXO
//====================================================
string RemoveSuffix(string symbol, string suffix) {
    int len = StringLen(symbol);
    int suffixLen = StringLen(suffix);
    
    if(len > suffixLen) {
        string end = StringSubstr(symbol, len - suffixLen);
        if(end == suffix) {
            return StringSubstr(symbol, 0, len - suffixLen);
        }
    }
    
    return symbol;
}

//====================================================
// AJUSTAR LOTE PARA TIPO DE CONTA
//====================================================
double AdjustLotForAccountType(double lots) {
    if(MasterIsCent && !SlaveIsCent) {
        lots = lots / 100.0;
        if(EnableLogs) Print("🔄 Ajuste Cent→Standard: ", lots);
    } else if(!MasterIsCent && SlaveIsCent) {
        lots = lots * 100.0;
        if(EnableLogs) Print("🔄 Ajuste Standard→Cent: ", lots);
    }
    
    return lots;
}

//====================================================
// NORMALIZAR LOTE
//====================================================
double NormalizeLot(string symbol, double lots) {
    double minLot = MarketInfo(symbol, MODE_MINLOT);
    double maxLot = MarketInfo(symbol, MODE_MAXLOT);
    double stepLot = MarketInfo(symbol, MODE_LOTSTEP);
    
    if(lots < minLot) lots = minLot;
    if(lots > maxLot) lots = maxLot;
    
    lots = MathFloor(lots / stepLot) * stepLot;
    
    return lots;
}

//====================================================
// ABRIR ORDEM
//====================================================
void OpenOrder(string symbol, int type, double lots, double sl, double tp, string comment) {
    double price = (type == OP_BUY) ? MarketInfo(symbol, MODE_ASK) : MarketInfo(symbol, MODE_BID);
    
    int ticket = OrderSend(
        symbol,
        type,
        lots,
        price,
        Slippage,
        sl,
        tp,
        comment,  // Ticket do Master no comentário
        MagicNumber,
        0,
        (type == OP_BUY) ? clrBlue : clrRed
    );
    
    if(ticket > 0) {
        if(EnableLogs) Print("✅ Posição aberta via sincronização: ", symbol, " ", (type == OP_BUY ? "BUY" : "SELL"), " ", lots, " lotes (Master: ", comment, " → Slave: ", ticket, ")");
    } else {
        int error = GetLastError();
        Print("❌ Erro ao abrir posição: ", error, " - ", ErrorDescription(error));
    }
}

//====================================================
// FECHAR ORDEM
//====================================================
void CloseOrder(int ticket) {
    if(!OrderSelect(ticket, SELECT_BY_TICKET)) return;
    
    double closePrice = (OrderType() == OP_BUY) ? MarketInfo(OrderSymbol(), MODE_BID) : MarketInfo(OrderSymbol(), MODE_ASK);
    
    bool result = OrderClose(ticket, OrderLots(), closePrice, Slippage, clrRed);
    
    if(result) {
        if(EnableLogs) Print("✅ Posição fechada: ", ticket);
    } else {
        int error = GetLastError();
        Print("❌ Erro ao fechar posição: ", error, " - ", ErrorDescription(error));
    }
}

//====================================================
// EXTRAIR VALOR DO JSON
//====================================================
string ExtractValue(string json, string key) {
    string search = "\"" + key + "\":";
    int start = StringFind(json, search);
    if(start < 0) return "";
    
    start += StringLen(search);
    
    // Verificar se o valor está entre aspas
    bool isString = (StringGetChar(json, start) == '\"');
    if(isString) start++;  // Pular aspas de abertura
    
    int end = start;
    if(isString) {
        // Procurar aspas de fechamento
        while(end < StringLen(json) && StringGetChar(json, end) != '\"') {
            end++;
        }
    } else {
        // Procurar vírgula ou fecha chave
        while(end < StringLen(json)) {
            ushort ch = StringGetChar(json, end);
            if(ch == ',' || ch == '}' || ch == ' ') break;
            end++;
        }
    }
    
    return StringSubstr(json, start, end - start);
}

//====================================================
// VALIDAR LICENÇA
//====================================================
bool ValidateLicense() {
    if(TimeCurrent() > LICENSE_EXPIRY_DATE) {
        Print("❌ Licença expirada em ", TimeToStr(LICENSE_EXPIRY_DATE));
        return false;
    }
    
    if(ALLOWED_ACCOUNTS != "") {
        string accounts[];
        int count = StringSplit(ALLOWED_ACCOUNTS, ',', accounts);
        bool found = false;
        
        for(int i = 0; i < count; i++) {
            if(IntegerToString(AccountNumber()) == accounts[i]) {
                found = true;
                break;
            }
        }
        
        if(!found) {
            Print("❌ Conta não autorizada: ", AccountNumber());
            return false;
        }
    }
    
    return true;
}

//====================================================
// DESCRIÇÃO DE ERRO
//====================================================
string ErrorDescription(int error) {
    switch(error) {
        case 0: return "Sem erro";
        case 1: return "Sem erro, mas resultado desconhecido";
        case 2: return "Erro comum";
        case 3: return "Parâmetros incorretos";
        case 4: return "Servidor ocupado";
        case 5: return "Versão antiga do terminal";
        case 6: return "Sem conexão com o servidor";
        case 7: return "Sem direitos";
        case 8: return "Muitas requisições";
        case 9: return "Operação mal formada";
        case 64: return "Conta bloqueada";
        case 65: return "Número de conta inválido";
        case 128: return "Timeout de negociação";
        case 129: return "Preço inválido";
        case 130: return "Stops inválidos";
        case 131: return "Volume inválido";
        case 132: return "Mercado fechado";
        case 133: return "Negociação desabilitada";
        case 134: return "Dinheiro insuficiente";
        case 135: return "Preço mudou";
        case 136: return "Sem preços";
        case 137: return "Broker ocupado";
        case 138: return "Nova cotação";
        case 139: return "Ordem bloqueada";
        case 140: return "Apenas long permitido";
        case 141: return "Muitas requisições";
        case 145: return "Modificação negada";
        case 146: return "Subsistema de negociação ocupado";
        case 147: return "Uso de data de expiração negado";
        case 148: return "Muitas ordens abertas e pendentes";
        default: return "Erro desconhecido: " + IntegerToString(error);
    }
}

//====================================================
// FINALIZAÇÃO
//====================================================
void OnDeinit(const int reason) {
    Print("Slave EA finalizado. Motivo: ", reason);
}
//+------------------------------------------------------------------+
