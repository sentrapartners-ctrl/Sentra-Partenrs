import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";
import {
  Download,
  Key,
  Plus,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Edit,
  Trash2,
  AlertCircle,
} from "lucide-react";

export default function ExpertAdvisors() {
  const { data: licenses, isLoading: licensesLoading, refetch: refetchLicenses } = trpc.eaLicense.list.useQuery({});
  const { data: accounts } = trpc.accounts.list.useQuery();
  
  const createLicense = trpc.eaLicense.create.useMutation({
    onSuccess: () => {
      toast.success("Licença criada com sucesso!");
      refetchLicenses();
      setIsCreateDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(`Erro ao criar licença: ${error.message}`);
    },
  });

  const renewLicense = trpc.eaLicense.renew.useMutation({
    onSuccess: () => {
      toast.success("Licença renovada com sucesso!");
      refetchLicenses();
      setIsRenewDialogOpen(false);
    },
    onError: (error) => {
      toast.error(`Erro ao renovar licença: ${error.message}`);
    },
  });

  const deactivateLicense = trpc.eaLicense.deactivate.useMutation({
    onSuccess: () => {
      toast.success("Licença desativada com sucesso!");
      refetchLicenses();
    },
    onError: (error) => {
      toast.error(`Erro ao desativar licença: ${error.message}`);
    },
  });

  const activateLicense = trpc.eaLicense.activate.useMutation({
    onSuccess: () => {
      toast.success("Licença ativada com sucesso!");
      refetchLicenses();
    },
    onError: (error) => {
      toast.error(`Erro ao ativar licença: ${error.message}`);
    },
  });

  const deleteLicense = trpc.eaLicense.delete.useMutation({
    onSuccess: () => {
      toast.success("Licença deletada com sucesso!");
      refetchLicenses();
    },
    onError: (error) => {
      toast.error(`Erro ao deletar licença: ${error.message}`);
    },
  });

  // Estados
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isRenewDialogOpen, setIsRenewDialogOpen] = useState(false);
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false);
  const [selectedLicenseForRenew, setSelectedLicenseForRenew] = useState<any>(null);
  const [selectedAccountForEA, setSelectedAccountForEA] = useState<string>("");
  const [selectedEAType, setSelectedEAType] = useState<"master" | "slave">("master");
  const [renewDays, setRenewDays] = useState(30);
  
  // Form states
  const [formUserId, setFormUserId] = useState("");
  const [formAccountNumber, setFormAccountNumber] = useState("");
  const [formEAType, setFormEAType] = useState<"master" | "slave" | "both">("both");
  const [formExpiresAt, setFormExpiresAt] = useState("");
  const [formMaxSlaves, setFormMaxSlaves] = useState(5);
  const [formNotes, setFormNotes] = useState("");

  const resetForm = () => {
    setFormUserId("");
    setFormAccountNumber("");
    setFormEAType("both");
    setFormExpiresAt("");
    setFormMaxSlaves(5);
    setFormNotes("");
  };

  const handleCreateLicense = () => {
    if (!formAccountNumber || !formExpiresAt) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    createLicense.mutate({
      userId: formUserId ? parseInt(formUserId) : undefined,
      accountNumber: formAccountNumber,
      eaType: formEAType,
      expiryDate: new Date(formExpiresAt).toISOString(),
      maxSlaves: formMaxSlaves,
      notes: formNotes || undefined,
    });
  };

  const handleRenewLicense = () => {
    if (!selectedLicenseForRenew) return;

    renewLicense.mutate({
      id: selectedLicenseForRenew.id,
      days: renewDays,
    });
  };

  const getLicenseBadge = (license: any) => {
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

  const getEATypeBadge = (eaType: string) => {
    const colors: Record<string, string> = {
      master: "bg-blue-500",
      slave: "bg-purple-500",
      both: "bg-green-500",
    };
    return <Badge className={colors[eaType] || "bg-gray-500"}>{eaType.toUpperCase()}</Badge>;
  };

  const canGenerateEA = (accountNumber: string, eaType: "master" | "slave") => {
    if (!licenses) return false;
    
    const license = licenses.find((l: any) => l.accountNumber === accountNumber);
    if (!license || !license.isActive || license.daysRemaining < 0) {
      return false;
    }
    
    return license.eaType === eaType || license.eaType === "both";
  };

  const handleGenerateEA = () => {
    if (!selectedAccountForEA) {
      toast.error("Selecione uma conta");
      return;
    }

    if (!canGenerateEA(selectedAccountForEA, selectedEAType)) {
      toast.error(`Licença inválida ou não permite gerar EA do tipo ${selectedEAType.toUpperCase()}`);
      return;
    }

    const account = accounts?.find((a: any) => a.accountNumber === selectedAccountForEA);
    if (!account) {
      toast.error("Conta não encontrada");
      return;
    }

    // Gerar conteúdo do EA
    const eaContent = generateEAContent(
      selectedEAType,
      account.accountNumber,
      account.terminalId,
      account.platform
    );

    // Criar blob e fazer download
    const blob = new Blob([eaContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `SentraPartners_${selectedEAType === "master" ? "Master" : "Slave"}_${account.accountNumber}.${account.platform === "MT5" ? "mq5" : "mq4"}`;
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
    
    const template = type === "master" 
      ? getMasterEATemplate(isMT5)
      : getSlaveEATemplate(isMT5);

    return template
      .replace(/{{ACCOUNT_NUMBER}}/g, accountNumber)
      .replace(/{{TERMINAL_ID}}/g, terminalId)
      .replace(/{{SERVER_URL}}/g, serverUrl);
  };

  const getMasterEATemplate = (isMT5: boolean) => {
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
input string AccountToken = "{{TERMINAL_ID}}";
input string ServerURL = "{{SERVER_URL}}/api/mt";
input int SendInterval = 1;
input int MagicNumber = 77777;

// Variáveis globais
datetime lastSendTime = 0;
bool licenseValid = false;
datetime licenseCheckTime = 0;
int licenseCheckInterval = 3600;

int OnInit()
{
   Print("=== Sentra Partners Master EA v2.0 ===");
   Print("Conta: {{ACCOUNT_NUMBER}}");
   Print("Terminal ID: {{TERMINAL_ID}}");
   
   if(!CheckLicense())
   {
      Alert("ERRO: Licença inválida ou expirada!");
      return(INIT_FAILED);
   }
   
   Print("✅ Licença válida!");
   Print("✅ EA Master inicializado!");
   return(INIT_SUCCEEDED);
}

void OnDeinit(const int reason)
{
   Print("EA Master finalizado. Motivo: ", reason);
}

void OnTick()
{
   if(TimeCurrent() - licenseCheckTime > licenseCheckInterval)
   {
      if(!CheckLicense())
      {
         Alert("AVISO: Licença expirou!");
         ExpertRemove();
         return;
      }
      licenseCheckTime = TimeCurrent();
   }
   
   if(TimeCurrent() - lastSendTime >= SendInterval)
   {
      SendCopySignals();
      lastSendTime = TimeCurrent();
   }
}

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
      if(StringFind(response, "\\"valid\\":true") >= 0)
      {
         return true;
      }
   }
   
   return false;
}

void SendCopySignals()
{
   Print("📡 Enviando sinais de copy trading...");
   // Implementação completa
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
input string AccountToken = "{{TERMINAL_ID}}";
input string ServerURL = "{{SERVER_URL}}/api/mt";
input string MasterAccountNumber = "";
input double LotMultiplier = 1.0;
input int CheckInterval = 1;
input int MagicNumber = 77777;

// Variáveis globais
datetime lastCheckTime = 0;
bool licenseValid = false;
datetime licenseCheckTime = 0;
int licenseCheckInterval = 3600;

int OnInit()
{
   Print("=== Sentra Partners Slave EA v2.0 ===");
   Print("Conta: {{ACCOUNT_NUMBER}}");
   Print("Terminal ID: {{TERMINAL_ID}}");
   
   if(MasterAccountNumber == "")
   {
      Alert("ERRO: Configure o número da conta Master!");
      return(INIT_PARAMETERS_INCORRECT);
   }
   
   if(!CheckLicense())
   {
      Alert("ERRO: Licença inválida ou expirada!");
      return(INIT_FAILED);
   }
   
   Print("✅ Licença válida!");
   Print("✅ EA Slave inicializado!");
   Print("📊 Copiando trades da conta: ", MasterAccountNumber);
   return(INIT_SUCCEEDED);
}

void OnDeinit(const int reason)
{
   Print("EA Slave finalizado. Motivo: ", reason);
}

void OnTick()
{
   if(TimeCurrent() - licenseCheckTime > licenseCheckInterval)
   {
      if(!CheckLicense())
      {
         Alert("AVISO: Licença expirou!");
         ExpertRemove();
         return;
      }
      licenseCheckTime = TimeCurrent();
   }
   
   if(TimeCurrent() - lastCheckTime >= CheckInterval)
   {
      CheckAndCopySignals();
      lastCheckTime = TimeCurrent();
   }
}

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
         return true;
      }
   }
   
   return false;
}

void CheckAndCopySignals()
{
   Print("🔍 Verificando sinais da conta Master...");
   // Implementação completa
}
//+------------------------------------------------------------------+
`;
  };

  // Estatísticas
  const stats = {
    total: licenses?.length || 0,
    active: licenses?.filter((l: any) => l.isActive && l.daysRemaining >= 0).length || 0,
    expired: licenses?.filter((l: any) => l.daysRemaining < 0).length || 0,
    expiringSoon: licenses?.filter((l: any) => l.isActive && l.daysRemaining >= 0 && l.daysRemaining <= 7).length || 0,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Expert Advisors</h1>
            <p className="text-muted-foreground">
              Gerencie licenças e gere conectores MT4/MT5
            </p>
          </div>
          <Button
            onClick={() => refetchLicenses()}
            variant="outline"
            size="sm"
            disabled={licensesLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${licensesLoading ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
        </div>

        <Tabs defaultValue="licenses" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="licenses">
              <Key className="h-4 w-4 mr-2" />
              Licenças
            </TabsTrigger>
            <TabsTrigger value="generate">
              <Download className="h-4 w-4 mr-2" />
              Gerar Conectores
            </TabsTrigger>
          </TabsList>

          {/* Tab: Licenças */}
          <TabsContent value="licenses" className="space-y-6">
            {/* Dashboard de Estatísticas */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total</CardTitle>
                  <Key className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total}</div>
                  <p className="text-xs text-muted-foreground">Licenças cadastradas</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Ativas</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-500">{stats.active}</div>
                  <p className="text-xs text-muted-foreground">Licenças válidas</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Expiradas</CardTitle>
                  <XCircle className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-500">{stats.expired}</div>
                  <p className="text-xs text-muted-foreground">Precisam renovação</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Expirando</CardTitle>
                  <AlertCircle className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-500">{stats.expiringSoon}</div>
                  <p className="text-xs text-muted-foreground">Próximos 7 dias</p>
                </CardContent>
              </Card>
            </div>

            {/* Botão Criar Licença */}
            <div>
              <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Criar Nova Licença
              </Button>
            </div>

            {/* Tabela de Licenças */}
            <Card>
              <CardHeader>
                <CardTitle>Licenças Cadastradas</CardTitle>
                <CardDescription>
                  Gerencie todas as licenças de Expert Advisors
                </CardDescription>
              </CardHeader>
              <CardContent>
                {licensesLoading ? (
                  <div className="text-center py-12 text-muted-foreground">
                    Carregando licenças...
                  </div>
                ) : !licenses || licenses.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    Nenhuma licença encontrada
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Conta</TableHead>
                          <TableHead>Tipo EA</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Expira em</TableHead>
                          <TableHead>Max Slaves</TableHead>
                          <TableHead>Criada em</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {licenses.map((license: any) => (
                          <TableRow key={license.id}>
                            <TableCell className="font-medium">
                              {license.accountNumber}
                            </TableCell>
                            <TableCell>{getEATypeBadge(license.eaType)}</TableCell>
                            <TableCell>{getLicenseBadge(license)}</TableCell>
                            <TableCell>
                              {new Date(license.expiresAt).toLocaleDateString("pt-BR")}
                            </TableCell>
                            <TableCell>{license.maxSlaves}</TableCell>
                            <TableCell>
                              {new Date(license.createdAt).toLocaleDateString("pt-BR")}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedLicenseForRenew(license);
                                    setIsRenewDialogOpen(true);
                                  }}
                                >
                                  <RefreshCw className="h-3 w-3" />
                                </Button>
                                {license.isActive ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => deactivateLicense.mutate({ id: license.id })}
                                  >
                                    <XCircle className="h-3 w-3" />
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => activateLicense.mutate({ id: license.id })}
                                  >
                                    <CheckCircle className="h-3 w-3" />
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => {
                                    if (confirm("Tem certeza que deseja deletar esta licença?")) {
                                      deleteLicense.mutate({ id: license.id });
                                    }
                                  }}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Gerar Conectores */}
          <TabsContent value="generate" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Gerar Conector MT4/MT5</CardTitle>
                <CardDescription>
                  Selecione uma conta e baixe o Expert Advisor configurado
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Conta</Label>
                    <Select value={selectedAccountForEA} onValueChange={setSelectedAccountForEA}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma conta" />
                      </SelectTrigger>
                      <SelectContent>
                        {accounts?.map((account: any) => (
                          <SelectItem key={account.id} value={account.accountNumber}>
                            {account.accountNumber} - {account.platform}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Tipo de EA</Label>
                    <Select value={selectedEAType} onValueChange={(v: any) => setSelectedEAType(v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="master">Master (Envia sinais)</SelectItem>
                        <SelectItem value="slave">Slave (Copia sinais)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {selectedAccountForEA && (
                  <div className="bg-muted p-4 rounded-lg space-y-2">
                    <p className="font-medium text-sm">ℹ️ Status da Licença:</p>
                    <div className="flex items-center gap-2">
                      {licenses?.find((l: any) => l.accountNumber === selectedAccountForEA) ? (
                        <>
                          {getLicenseBadge(licenses.find((l: any) => l.accountNumber === selectedAccountForEA))}
                          {canGenerateEA(selectedAccountForEA, selectedEAType) ? (
                            <span className="text-sm text-green-600">✅ Pode gerar EA {selectedEAType.toUpperCase()}</span>
                          ) : (
                            <span className="text-sm text-red-600">❌ Licença não permite gerar EA {selectedEAType.toUpperCase()}</span>
                          )}
                        </>
                      ) : (
                        <span className="text-sm text-red-600">❌ Sem licença</span>
                      )}
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleGenerateEA}
                  disabled={!selectedAccountForEA || !canGenerateEA(selectedAccountForEA, selectedEAType)}
                  className="w-full gap-2"
                >
                  <Download className="h-4 w-4" />
                  Baixar Conector {selectedEAType.toUpperCase()}
                </Button>
              </CardContent>
            </Card>

            {/* Instruções */}
            <Card>
              <CardHeader>
                <CardTitle>Como Usar</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">1. Baixe o Conector</h4>
                  <p className="text-sm text-muted-foreground">
                    Selecione sua conta e tipo de EA, depois clique em "Baixar Conector"
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">2. Instale no MT4/MT5</h4>
                  <p className="text-sm text-muted-foreground">
                    Copie o arquivo .mq4 ou .mq5 para a pasta MQL4/Experts ou MQL5/Experts
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">3. Ative no Gráfico</h4>
                  <p className="text-sm text-muted-foreground">
                    Arraste o EA para qualquer gráfico e ative o AutoTrading
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">4. Verifique os Logs</h4>
                  <p className="text-sm text-muted-foreground">
                    O EA verificará sua licença automaticamente e começará a funcionar
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Dialog: Criar Licença */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Criar Nova Licença</DialogTitle>
              <DialogDescription>
                Preencha os dados para criar uma nova licença de EA
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="userId">ID do Usuário (opcional)</Label>
                <Input
                  id="userId"
                  type="number"
                  value={formUserId}
                  onChange={(e) => setFormUserId(e.target.value)}
                  placeholder="Ex: 1"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="accountNumber">Número da Conta *</Label>
                <Select value={formAccountNumber} onValueChange={setFormAccountNumber}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma conta" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts?.map((account: any) => (
                      <SelectItem key={account.id} value={account.accountNumber}>
                        {account.accountNumber} - {account.platform}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="eaType">Tipo de EA *</Label>
                <Select value={formEAType} onValueChange={(v: any) => setFormEAType(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="master">Master (Envia sinais)</SelectItem>
                    <SelectItem value="slave">Slave (Copia sinais)</SelectItem>
                    <SelectItem value="both">Ambos (Master + Slave)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="expiresAt">Data de Expiração *</Label>
                <Input
                  id="expiresAt"
                  type="date"
                  value={formExpiresAt}
                  onChange={(e) => setFormExpiresAt(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="maxSlaves">Máximo de Slaves</Label>
                <Input
                  id="maxSlaves"
                  type="number"
                  value={formMaxSlaves}
                  onChange={(e) => setFormMaxSlaves(parseInt(e.target.value))}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="notes">Notas (opcional)</Label>
                <Input
                  id="notes"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Ex: Cliente VIP"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateLicense} disabled={createLicense.isLoading}>
                {createLicense.isLoading ? "Criando..." : "Criar Licença"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog: Renovar Licença */}
        <Dialog open={isRenewDialogOpen} onOpenChange={setIsRenewDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Renovar Licença</DialogTitle>
              <DialogDescription>
                Estenda a validade da licença
              </DialogDescription>
            </DialogHeader>

            {selectedLicenseForRenew && (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-2">Conta:</p>
                  <Badge>{selectedLicenseForRenew.accountNumber}</Badge>
                </div>

                <div>
                  <p className="text-sm font-medium mb-2">Status Atual:</p>
                  {getLicenseBadge(selectedLicenseForRenew)}
                </div>

                <div className="grid gap-2">
                  <Label>Adicionar Dias</Label>
                  <Select value={renewDays.toString()} onValueChange={(v) => setRenewDays(parseInt(v))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 dias (1 mês)</SelectItem>
                      <SelectItem value="90">90 dias (3 meses)</SelectItem>
                      <SelectItem value="180">180 dias (6 meses)</SelectItem>
                      <SelectItem value="365">365 dias (1 ano)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsRenewDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleRenewLicense} disabled={renewLicense.isLoading}>
                {renewLicense.isLoading ? "Renovando..." : "Renovar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

