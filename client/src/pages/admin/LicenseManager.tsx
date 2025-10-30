import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Key, Plus, Copy, Trash2, RefreshCw, Calendar } from "lucide-react";

interface License {
  id: number;
  userId: number;
  userEmail: string;
  licenseKey: string;
  eaName: string;
  licenseType: 'trial' | 'monthly' | 'yearly' | 'lifetime';
  status: 'active' | 'inactive' | 'expired';
  allowedAccounts: string;
  expiresAt: string | null;
  lastUsedAt: string | null;
  createdAt: string;
}

export default function LicenseManager() {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  // Toast já importado do sonner

  // Form state
  const [formData, setFormData] = useState({
    userEmail: "",
    eaName: "SentraPartners_MT4",
    licenseType: "monthly" as const,
    allowedAccounts: "",
    expiresAt: "",
  });

  useEffect(() => {
    loadLicenses();
  }, []);

  const loadLicenses = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/licenses");
      if (response.ok) {
        const data = await response.json();
        setLicenses(data.licenses || []);
      }
    } catch (error) {
      console.error("Erro ao carregar licenças:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as licenças",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateLicenseKey = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let key = 'SP-';
    for (let i = 0; i < 32; i++) {
      key += chars.charAt(Math.floor(Math.random() * chars.length));
      if ((i + 1) % 8 === 0 && i < 31) key += '-';
    }
    return key;
  };

  const handleCreateLicense = async () => {
    if (!formData.userEmail) {
      toast({
        title: "Erro",
        description: "Email do usuário é obrigatório",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const licenseKey = generateLicenseKey();
      
      const response = await fetch("/api/admin/licenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          licenseKey,
        }),
      });

      if (response.ok) {
        toast({
          title: "✅ Licença criada!",
          description: `Licença gerada para ${formData.userEmail}`,
        });
        setIsDialogOpen(false);
        setFormData({
          userEmail: "",
          eaName: "SentraPartners_MT4",
          licenseType: "monthly",
          allowedAccounts: "",
          expiresAt: "",
        });
        loadLicenses();
      } else {
        const error = await response.json();
        throw new Error(error.error || "Erro ao criar licença");
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "✅ Copiado!",
      description: "Chave copiada para a área de transferência",
    });
  };

  const updateLicenseStatus = async (id: number, status: 'active' | 'inactive') => {
    try {
      const response = await fetch(`/api/admin/licenses/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        toast({
          title: "✅ Atualizado!",
          description: `Licença ${status === 'active' ? 'ativada' : 'desativada'}`,
        });
        loadLicenses();
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a licença",
        variant: "destructive",
      });
    }
  };

  const deleteLicense = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir esta licença?")) return;

    try {
      const response = await fetch(`/api/admin/licenses/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast({
          title: "✅ Excluída!",
          description: "Licença removida com sucesso",
        });
        loadLicenses();
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível excluir a licença",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      active: "default",
      inactive: "secondary",
      expired: "destructive",
    };
    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>;
  };

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      trial: "bg-gray-500",
      monthly: "bg-blue-500",
      yearly: "bg-green-500",
      lifetime: "bg-purple-500",
    };
    return <Badge className={colors[type]}>{type}</Badge>;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Key className="h-8 w-8" />
            Gerenciador de Licenças
          </h1>
          <p className="text-muted-foreground mt-2">
            Crie e gerencie licenças para os EAs
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg">
              <Plus className="mr-2 h-5 w-5" />
              Nova Licença
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Criar Nova Licença</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label htmlFor="userEmail">Email do Usuário *</Label>
                <Input
                  id="userEmail"
                  type="email"
                  placeholder="usuario@exemplo.com"
                  value={formData.userEmail}
                  onChange={(e) => setFormData({ ...formData, userEmail: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="eaName">EA</Label>
                <Select
                  value={formData.eaName}
                  onValueChange={(value) => setFormData({ ...formData, eaName: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SentraPartners_MT4">Conector MT4</SelectItem>
                    <SelectItem value="SentraPartners_MT5">Conector MT5</SelectItem>
                    <SelectItem value="SentraPartners_Master_MT4">Master MT4</SelectItem>
                    <SelectItem value="SentraPartners_Master_MT5">Master MT5</SelectItem>
                    <SelectItem value="SentraPartners_Slave_MT4">Slave MT4</SelectItem>
                    <SelectItem value="SentraPartners_Slave_MT5">Slave MT5</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="licenseType">Tipo de Licença</Label>
                <Select
                  value={formData.licenseType}
                  onValueChange={(value: any) => setFormData({ ...formData, licenseType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="trial">Trial (Teste)</SelectItem>
                    <SelectItem value="monthly">Mensal</SelectItem>
                    <SelectItem value="yearly">Anual</SelectItem>
                    <SelectItem value="lifetime">Vitalícia</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="expiresAt">Data de Expiração</Label>
                <Input
                  id="expiresAt"
                  type="datetime-local"
                  value={formData.expiresAt}
                  onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Deixe vazio para licença vitalícia
                </p>
              </div>

              <div>
                <Label htmlFor="allowedAccounts">Contas Permitidas</Label>
                <Input
                  id="allowedAccounts"
                  placeholder="12345,67890,99999"
                  value={formData.allowedAccounts}
                  onChange={(e) => setFormData({ ...formData, allowedAccounts: e.target.value })}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Números de conta separados por vírgula (deixe vazio para permitir todas)
                </p>
              </div>

              <Button
                onClick={handleCreateLicense}
                disabled={loading}
                className="w-full"
                size="lg"
              >
                {loading ? "Criando..." : "Gerar Licença"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Licenças Ativas</span>
            <Button variant="outline" size="sm" onClick={loadLicenses}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading && licenses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando licenças...
            </div>
          ) : licenses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma licença cadastrada
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>EA</TableHead>
                    <TableHead>Chave</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Contas</TableHead>
                    <TableHead>Expira em</TableHead>
                    <TableHead>Último uso</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {licenses.map((license) => (
                    <TableRow key={license.id}>
                      <TableCell className="font-medium">{license.userEmail}</TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {license.eaName}
                        </code>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <code className="text-xs bg-muted px-2 py-1 rounded max-w-[200px] overflow-hidden text-ellipsis">
                            {license.licenseKey}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(license.licenseKey)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>{getTypeBadge(license.licenseType)}</TableCell>
                      <TableCell>{getStatusBadge(license.status)}</TableCell>
                      <TableCell>
                        {license.allowedAccounts ? (
                          <code className="text-xs">{license.allowedAccounts}</code>
                        ) : (
                          <span className="text-muted-foreground text-xs">Todas</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {license.expiresAt ? (
                          <div className="flex items-center gap-1 text-xs">
                            <Calendar className="h-3 w-3" />
                            {new Date(license.expiresAt).toLocaleDateString('pt-BR')}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs">Nunca</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {license.lastUsedAt
                          ? new Date(license.lastUsedAt).toLocaleString('pt-BR')
                          : "Nunca"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              updateLicenseStatus(
                                license.id,
                                license.status === 'active' ? 'inactive' : 'active'
                              )
                            }
                          >
                            {license.status === 'active' ? 'Desativar' : 'Ativar'}
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => deleteLicense(license.id)}
                          >
                            <Trash2 className="h-4 w-4" />
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
    </div>
  );
}
