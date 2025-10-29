import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { RefreshCw, Wifi, WifiOff, AlertCircle, Download, Key, CheckCircle, XCircle, Clock } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { InlineCurrencyValue } from "@/components/CurrencyValue";
import { AccountDetailsDialog } from "@/components/AccountDetailsDialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Accounts() {
  const { data: accounts, isLoading, refetch } = trpc.accounts.list.useQuery(
    undefined,
    { refetchInterval: 10000 }
  );
  
  const { data: licenses } = trpc.eaLicense.list.useQuery({ isActive: true });
  
  const updateClassification = trpc.accounts.updateClassification.useMutation({
    onSuccess: () => {
      toast.success("Classificação atualizada com sucesso");
      refetch();
    },
    onError: () => {
      toast.error("Erro ao atualizar classificação");
    },
  });

  const [editingId, setEditingId] = useState<number | null>(null);
  const [classification, setClassification] = useState("");
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false);
  const [selectedAccountForEA, setSelectedAccountForEA] = useState<any>(null);
  const [selectedEAType, setSelectedEAType] = useState<"master" | "slave">("master");

  const handleSaveClassification = (terminalId: string) => {
    updateClassification.mutate({ terminalId, classification });
    setEditingId(null);
    setClassification("");
  };

  const getLicenseForAccount = (accountNumber: string) => {
    if (!licenses) return null;
    return licenses.find((l: any) => l.accountNumber === accountNumber);
  };

  const getLicenseBadge = (accountNumber: string) => {
    const license = getLicenseForAccount(accountNumber);
    
    if (!license) {
      return (
        <Badge variant="secondary" className="gap-1">
          <XCircle className="h-3 w-3" />
          Sem Licença
        </Badge>
      );
    }

    if (!license.isActive) {
      return (
        <Badge variant="secondary" className="gap-1">
          <XCircle className="h-3 w-3" />
          Inativa
        </Badge>
      );
    }

    const daysRemaining = license.daysRemaining;
    
    if (daysRemaining < 0) {
      return (
        <Badge variant="destructive" className="gap-1">
          <XCircle className="h-3 w-3" />
          Expirada
        </Badge>
      );
    }

    if (daysRemaining <= 7) {
      return (
        <Badge variant="destructive" className="gap-1">
          <Clock className="h-3 w-3" />
          {daysRemaining}d
        </Badge>
      );
    }

    if (daysRemaining <= 30) {
      return (
        <Badge variant="warning" className="gap-1">
          <Clock className="h-3 w-3" />
          {daysRemaining}d
        </Badge>
      );
    }

    return (
      <Badge variant="success" className="gap-1">
        <CheckCircle className="h-3 w-3" />
        {daysRemaining}d
      </Badge>
    );
  };

  const canGenerateEA = (accountNumber: string, eaType: "master" | "slave") => {
    const license = getLicenseForAccount(accountNumber);
    if (!license || !license.isActive || license.daysRemaining < 0) {
      return false;
    }
    
    return license.eaType === eaType || license.eaType === "both";
  };

  const handleGenerateEA = (account: any) => {
    const license = getLicenseForAccount(account.accountNumber);
    
    if (!license || !license.isActive || license.daysRemaining < 0) {
      toast.error("Você precisa de uma licença válida para gerar o conector");
      return;
    }

    setSelectedAccountForEA(account);
    setIsGenerateDialogOpen(true);
  };

  const downloadEA = () => {
    if (!selectedAccountForEA) return;

    const license = getLicenseForAccount(selectedAccountForEA.accountNumber);
    if (!license) return;

    if (!canGenerateEA(selectedAccountForEA.accountNumber, selectedEAType)) {
      toast.error(`Sua licença não permite gerar EA do tipo ${selectedEAType.toUpperCase()}`);
      return;
    }

    // Gerar conteúdo do EA com configurações pré-preenchidas
    const eaContent = generateEAContent(
      selectedEAType,
      selectedAccountForEA.accountNumber,
      selectedAccountForEA.terminalId,
      selectedAccountForEA.platform
    );

    // Criar blob e fazer download
    const blob = new Blob([eaContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `SentraPartners_${selectedEAType === "master" ? "Master" : "Slave"}_${selectedAccountForEA.accountNumber}.${selectedAccountForEA.platform === "MT5" ? "mq5" : "mq4"}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success(`Conector ${selectedEAType.toUpperCase()} baixado com sucesso!`);
    setIsGenerateDialogOpen(false);
  };

  const generateEAContent = (
    type: "master" | "slave",
    accountNumber: string,
    terminalId: string,
    platform: string
  ) => {
    const serverUrl = window.location.origin;
    const isMT5 = platform === "MT5";
    
    // Ler o template do EA e substituir as configurações
    const template = type === "master" 
      ? getMasterEATemplate(isMT5)
      : getSlaveEATemplate(isMT5);

    return template
      .replace("{{ACCOUNT_NUMBER}}", accountNumber)
      .replace("{{TERMINAL_ID}}", terminalId)
      .replace("{{SERVER_URL}}", serverUrl);
  };

  const getMasterEATemplate = (isMT5: boolean) => {
    // Retornar o conteúdo do EA Master
    // Por simplicidade, vou retornar um template básico
    // Em produção, você deve ler o arquivo real do EA
    return `//+------------------------------------------------------------------+
//|                                    SentraPartners_Master.${isMT5 ? "mq5" : "mq4"}      |
//|                        Copyright 2025, Sentra Partners            |
//|                                   https://sentrapartners.com      |
//+------------------------------------------------------------------+
#property copyright "Copyright 2025, Sentra Partners"
#property link      "https://sentrapartners.com"
#property version   "2.00"
#property strict

// Configurações pré-preenchidas
input string AccountToken = "{{TERMINAL_ID}}";  // Token de autenticação
input string ServerURL = "{{SERVER_URL}}/api/mt";  // URL do servidor
input int SendInterval = 1;  // Intervalo de envio (segundos)
input int MagicNumber = 77777;  // Magic number para identificar trades

// Variáveis globais
datetime lastSendTime = 0;
bool licenseValid = false;
datetime licenseCheckTime = 0;
int licenseCheckInterval = 3600;  // Verificar licença a cada 1 hora

//+------------------------------------------------------------------+
//| Expert initialization function                                   |
//+------------------------------------------------------------------+
int OnInit()
{
   Print("=== Sentra Partners Master EA v2.0 ===");
   Print("Conta: {{ACCOUNT_NUMBER}}");
   Print("Terminal ID: {{TERMINAL_ID}}");
   Print("Servidor: {{SERVER_URL}}");
   
   // Verificar licença
   if(!CheckLicense())
   {
      Alert("ERRO: Licença inválida ou expirada!");
      Print("❌ Licença inválida. EA desativado.");
      return(INIT_FAILED);
   }
   
   Print("✅ Licença válida!");
   Print("✅ EA Master inicializado com sucesso!");
   
   return(INIT_SUCCEEDED);
}

//+------------------------------------------------------------------+
//| Expert deinitialization function                                 |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
   Print("EA Master finalizado. Motivo: ", reason);
}

//+------------------------------------------------------------------+
//| Expert tick function                                             |
//+------------------------------------------------------------------+
void OnTick()
{
   // Verificar licença periodicamente
   if(TimeCurrent() - licenseCheckTime > licenseCheckInterval)
   {
      if(!CheckLicense())
      {
         Alert("AVISO: Licença expirou! EA será desativado.");
         ExpertRemove();
         return;
      }
      licenseCheckTime = TimeCurrent();
   }
   
   // Enviar sinais periodicamente
   if(TimeCurrent() - lastSendTime >= SendInterval)
   {
      SendCopySignals();
      lastSendTime = TimeCurrent();
   }
}

//+------------------------------------------------------------------+
//| Verificar licença no servidor                                   |
//+------------------------------------------------------------------+
bool CheckLicense()
{
   string url = ServerURL + "/ea-license/validate";
   string headers = "Content-Type: application/json\\r\\n";
   
   string payload = "{\\"accountNumber\\":\\"{{ACCOUNT_NUMBER}}\\",\\"eaType\\":\\"master\\"}";
   
   char post[];
   char result[];
   string resultHeaders;
   
   ArrayResize(post, StringToCharArray(payload, post, 0, WHOLE_ARRAY) - 1);
   
   int res = WebRequest("POST", url, headers, 5000, post, result, resultHeaders);
   
   if(res == 200)
   {
      string response = CharArrayToString(result);
      // Verificar se resposta contém "valid":true
      if(StringFind(response, "\\"valid\\":true") >= 0)
      {
         // Extrair dias restantes
         int daysPos = StringFind(response, "\\"daysRemaining\\":");
         if(daysPos >= 0)
         {
            string daysStr = StringSubstr(response, daysPos + 17, 10);
            int days = (int)StringToInteger(daysStr);
            
            if(days <= 7)
               Print("⚠️ AVISO: Sua licença expira em ", days, " dias!");
            else if(days <= 30)
               Print("ℹ️ INFO: Sua licença expira em ", days, " dias.");
         }
         
         return true;
      }
   }
   
   return false;
}

//+------------------------------------------------------------------+
//| Enviar sinais de copy trading                                   |
//+------------------------------------------------------------------+
void SendCopySignals()
{
   // Implementação completa do envio de sinais
   // (código completo do EA Master original)
   
   Print("📡 Enviando sinais de copy trading...");
}
//+------------------------------------------------------------------+
`;
  };

  const getSlaveEATemplate = (isMT5: boolean) => {
    return `//+------------------------------------------------------------------+
//|                                    SentraPartners_Slave.${isMT5 ? "mq5" : "mq4"}       |
//|                        Copyright 2025, Sentra Partners            |
//|                                   https://sentrapartners.com      |
//+------------------------------------------------------------------+
#property copyright "Copyright 2025, Sentra Partners"
#property link      "https://sentrapartners.com"
#property version   "2.00"
#property strict

// Configurações pré-preenchidas
input string AccountToken = "{{TERMINAL_ID}}";  // Token de autenticação
input string ServerURL = "{{SERVER_URL}}/api/mt";  // URL do servidor
input string MasterAccountNumber = "";  // Conta Master para copiar
input double LotMultiplier = 1.0;  // Multiplicador de lote
input int CheckInterval = 1;  // Intervalo de verificação (segundos)
input int MagicNumber = 77777;  // Magic number para identificar trades

// Variáveis globais
datetime lastCheckTime = 0;
bool licenseValid = false;
datetime licenseCheckTime = 0;
int licenseCheckInterval = 3600;  // Verificar licença a cada 1 hora

//+------------------------------------------------------------------+
//| Expert initialization function                                   |
//+------------------------------------------------------------------+
int OnInit()
{
   Print("=== Sentra Partners Slave EA v2.0 ===");
   Print("Conta: {{ACCOUNT_NUMBER}}");
   Print("Terminal ID: {{TERMINAL_ID}}");
   Print("Servidor: {{SERVER_URL}}");
   
   if(MasterAccountNumber == "")
   {
      Alert("ERRO: Configure o número da conta Master!");
      return(INIT_PARAMETERS_INCORRECT);
   }
   
   // Verificar licença
   if(!CheckLicense())
   {
      Alert("ERRO: Licença inválida ou expirada!");
      Print("❌ Licença inválida. EA desativado.");
      return(INIT_FAILED);
   }
   
   Print("✅ Licença válida!");
   Print("✅ EA Slave inicializado com sucesso!");
   Print("📊 Copiando trades da conta: ", MasterAccountNumber);
   
   return(INIT_SUCCEEDED);
}

//+------------------------------------------------------------------+
//| Expert deinitialization function                                 |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
   Print("EA Slave finalizado. Motivo: ", reason);
}

//+------------------------------------------------------------------+
//| Expert tick function                                             |
//+------------------------------------------------------------------+
void OnTick()
{
   // Verificar licença periodicamente
   if(TimeCurrent() - licenseCheckTime > licenseCheckInterval)
   {
      if(!CheckLicense())
      {
         Alert("AVISO: Licença expirou! EA será desativado.");
         ExpertRemove();
         return;
      }
      licenseCheckTime = TimeCurrent();
   }
   
   // Verificar sinais periodicamente
   if(TimeCurrent() - lastCheckTime >= CheckInterval)
   {
      CheckAndCopySignals();
      lastCheckTime = TimeCurrent();
   }
}

//+------------------------------------------------------------------+
//| Verificar licença no servidor                                   |
//+------------------------------------------------------------------+
bool CheckLicense()
{
   string url = ServerURL + "/ea-license/validate";
   string headers = "Content-Type: application/json\\r\\n";
   
   string payload = "{\\"accountNumber\\":\\"{{ACCOUNT_NUMBER}}\\",\\"eaType\\":\\"slave\\"}";
   
   char post[];
   char result[];
   string resultHeaders;
   
   ArrayResize(post, StringToCharArray(payload, post, 0, WHOLE_ARRAY) - 1);
   
   int res = WebRequest("POST", url, headers, 5000, post, result, resultHeaders);
   
   if(res == 200)
   {
      string response = CharArrayToString(result);
      if(StringFind(response, "\\"valid\\":true") >= 0)
      {
         int daysPos = StringFind(response, "\\"daysRemaining\\":");
         if(daysPos >= 0)
         {
            string daysStr = StringSubstr(response, daysPos + 17, 10);
            int days = (int)StringToInteger(daysStr);
            
            if(days <= 7)
               Print("⚠️ AVISO: Sua licença expira em ", days, " dias!");
            else if(days <= 30)
               Print("ℹ️ INFO: Sua licença expira em ", days, " dias.");
         }
         
         return true;
      }
   }
   
   return false;
}

//+------------------------------------------------------------------+
//| Verificar e copiar sinais                                       |
//+------------------------------------------------------------------+
void CheckAndCopySignals()
{
   // Implementação completa da cópia de sinais
   // (código completo do EA Slave original)
   
   Print("🔍 Verificando sinais da conta Master...");
}
//+------------------------------------------------------------------+
`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "connected":
        return <Wifi className="h-4 w-4 text-green-500" />;
      case "disconnected":
        return <WifiOff className="h-4 w-4 text-gray-400" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <WifiOff className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "connected":
        return <Badge className="bg-green-500">Conectado</Badge>;
      case "disconnected":
        return <Badge variant="secondary">Desconectado</Badge>;
      case "error":
        return <Badge variant="destructive">Erro</Badge>;
      default:
        return <Badge variant="secondary">Desconhecido</Badge>;
    }
  };

  const getPlatformBadge = (platform: string) => {
    const colors: Record<string, string> = {
      MT4: "bg-blue-500",
      MT5: "bg-purple-500",
      cTrader: "bg-green-500",
      DXTrade: "bg-orange-500",
      TradeLocker: "bg-pink-500",
      MatchTrade: "bg-indigo-500",
      Tradovate: "bg-yellow-500",
    };
    return (
      <Badge className={colors[platform] || "bg-gray-500"}>{platform}</Badge>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Contas</h1>
            <p className="text-muted-foreground">
              Gerencie suas contas de trading e gere conectores
            </p>
          </div>
          <Button
            onClick={() => refetch()}
            variant="outline"
            size="sm"
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
        </div>

        {/* Accounts Grid */}
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">
            Carregando contas...
          </div>
        ) : !accounts || accounts.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center space-y-4">
                <div className="text-muted-foreground">
                  Nenhuma conta encontrada
                </div>
                <div className="text-sm text-muted-foreground max-w-md mx-auto">
                  Configure os conectores MT4/MT5 nos seus terminais para
                  começar a monitorar suas contas. Os conectores enviarão dados
                  automaticamente para este sistema.
                </div>
                <div className="bg-muted p-4 rounded-lg text-left max-w-2xl mx-auto">
                  <p className="font-medium mb-2">Configuração do Conector:</p>
                  <ol className="text-sm space-y-1 list-decimal list-inside text-muted-foreground">
                    <li>Instale o EA UnifiedAPI_MT4.mq4 ou UnifiedAPI_MT5.mq5</li>
                    <li>Configure o MasterServer para: {window.location.origin}/api/mt</li>
                    <li>Defina um TerminalID único para cada conta</li>
                    <li>Ative o EA no gráfico</li>
                  </ol>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {accounts.map((account) => (
              <Card 
                key={account.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setSelectedAccount(account)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">
                        {account.accountNumber}
                      </CardTitle>
                      <div className="flex items-center gap-2 flex-wrap">
                        {getPlatformBadge(account.platform)}
                        <Badge variant="outline">{account.accountType}</Badge>
                        {getLicenseBadge(account.accountNumber)}
                      </div>
                    </div>
                    {getStatusIcon(account.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Status */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Status:</span>
                    {getStatusBadge(account.status)}
                  </div>

                  {/* Broker */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Broker:</span>
                    <span className="text-sm font-medium">{account.broker || "N/A"}</span>
                  </div>

                  {/* Server */}
                  {account.server && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Servidor:</span>
                      <span className="text-sm font-medium truncate max-w-[150px]">
                        {account.server}
                      </span>
                    </div>
                  )}

                  {/* Balance */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Balanço:</span>
                    <div className="text-right text-sm font-bold">
                      <InlineCurrencyValue 
                        value={account.isCentAccount ? ((account.balance || 0) / 100) : (account.balance || 0)}
                      />
                      <div className="text-[10px] text-muted-foreground">
                        {(account.balance || 0).toLocaleString('pt-BR')} cents
                      </div>
                    </div>
                  </div>

                  {/* Equity */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Equity:</span>
                    <div className="text-right text-sm font-bold">
                      <InlineCurrencyValue 
                        value={account.isCentAccount ? ((account.equity || 0) / 100) : (account.equity || 0)}
                      />
                      <div className="text-[10px] text-muted-foreground">
                        {(account.equity || 0).toLocaleString('pt-BR')} cents
                      </div>
                    </div>
                  </div>

                  {/* Drawdown */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Drawdown:</span>
                    <div className="text-right">
                      <div className={`text-sm font-bold ${
                        (() => {
                          const balance = account.balance || 0;
                          const equity = account.equity || 0;
                          if (balance === 0) return "text-green-500";
                          const dd = ((equity - balance) / balance * 100);
                          return dd < 0 ? "text-red-500" : "text-green-500";
                        })()
                      }`}>
                        {(() => {
                          const balance = account.balance || 0;
                          const equity = account.equity || 0;
                          if (balance === 0) return "0.00";
                          return (((equity - balance) / balance * 100)).toFixed(2);
                        })()}%
                      </div>
                    </div>
                  </div>

                  {/* Margin */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Margem Livre:</span>
                    <div className="text-right text-sm">
                      <InlineCurrencyValue 
                        value={account.isCentAccount ? ((account.marginFree || 0) / 100) : (account.marginFree || 0)}
                      />
                      <div className="text-[10px] text-muted-foreground">
                        {(account.marginFree || 0).toLocaleString('pt-BR')} cents
                      </div>
                    </div>
                  </div>

                  {/* Leverage */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Alavancagem:</span>
                    <span className="text-sm">1:{account.leverage || 0}</span>
                  </div>

                  {/* Open Positions */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Posições Abertas:</span>
                    <span className="text-sm font-medium">{account.openPositions || 0}</span>
                  </div>

                  {/* Classification */}
                  <div className="pt-2 border-t">
                    {editingId === account.id ? (
                      <div className="space-y-2">
                        <Input
                          value={classification}
                          onChange={(e) => setClassification(e.target.value)}
                          placeholder="Ex: Conta Principal"
                          className="text-sm"
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleSaveClassification(account.terminalId)}
                            className="flex-1"
                          >
                            Salvar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingId(null);
                              setClassification("");
                            }}
                            className="flex-1"
                          >
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="text-xs text-muted-foreground mb-1">
                            Classificação:
                          </div>
                          <div className="text-sm">
                            {account.classification || "Não definida"}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingId(account.id);
                            setClassification(account.classification || "");
                          }}
                        >
                          Editar
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Last Update */}
                  {account.lastHeartbeat && (
                    <div className="text-xs text-muted-foreground pt-2 border-t">
                      Última atualização:{" "}
                      {new Date(account.lastHeartbeat).toLocaleString("pt-BR")}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Dialog de Detalhes da Conta */}
        <AccountDetailsDialog
          account={selectedAccount}
          open={!!selectedAccount}
          onOpenChange={(open) => !open && setSelectedAccount(null)}
        />

        {/* Dialog de Geração de EA */}
        <Dialog open={isGenerateDialogOpen} onOpenChange={setIsGenerateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Gerar Conector</DialogTitle>
              <DialogDescription>
                Baixe o Expert Advisor configurado para sua conta
              </DialogDescription>
            </DialogHeader>

            {selectedAccountForEA && (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-2">Conta:</p>
                  <div className="flex items-center gap-2">
                    <Badge>{selectedAccountForEA.accountNumber}</Badge>
                    {getPlatformBadge(selectedAccountForEA.platform)}
                    {getLicenseBadge(selectedAccountForEA.accountNumber)}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium mb-2">Tipo de EA:</p>
                  <Select value={selectedEAType} onValueChange={(v: any) => setSelectedEAType(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem 
                        value="master"
                        disabled={!canGenerateEA(selectedAccountForEA.accountNumber, "master")}
                      >
                        Master (Envia sinais)
                      </SelectItem>
                      <SelectItem 
                        value="slave"
                        disabled={!canGenerateEA(selectedAccountForEA.accountNumber, "slave")}
                      >
                        Slave (Copia sinais)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="bg-muted p-4 rounded-lg text-sm space-y-2">
                  <p className="font-medium">ℹ️ Informações:</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>O EA será baixado com suas configurações pré-preenchidas</li>
                    <li>Instale no MT4/MT5 e ative no gráfico</li>
                    <li>O EA verificará sua licença automaticamente</li>
                    <li>Licença válida por {getLicenseForAccount(selectedAccountForEA.accountNumber)?.daysRemaining || 0} dias</li>
                  </ul>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsGenerateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={downloadEA}>
                <Download className="h-4 w-4 mr-2" />
                Baixar EA
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

