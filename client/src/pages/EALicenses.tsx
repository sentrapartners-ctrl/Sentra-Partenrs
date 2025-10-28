import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { trpc } from "../lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Textarea } from "../components/ui/textarea";
import { toast } from "sonner";
import { Plus, RefreshCw, Power, PowerOff, Trash2, Calendar } from "lucide-react";

export default function EALicenses() {
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isRenewDialogOpen, setIsRenewDialogOpen] = useState(false);
  const [selectedLicense, setSelectedLicense] = useState<any>(null);
  const [filter, setFilter] = useState<"all" | "active" | "expired" | "expiring">("all");

  // Queries
  const { data: licenses, isLoading } = useQuery({
    queryKey: ["eaLicenses", filter],
    queryFn: async () => {
      const filterOptions: any = {};
      
      if (filter === "active") {
        filterOptions.isActive = true;
      } else if (filter === "expired") {
        filterOptions.isActive = true;
        filterOptions.expiringIn = -1; // Já expiradas
      } else if (filter === "expiring") {
        filterOptions.isActive = true;
        filterOptions.expiringIn = 30; // Expirando em 30 dias
      }
      
      return trpc.eaLicense.list.query(filterOptions);
    },
  });

  const { data: stats } = useQuery({
    queryKey: ["eaLicenseStats"],
    queryFn: () => trpc.eaLicense.getStats.query(),
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: any) => trpc.eaLicense.create.mutate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["eaLicenses"] });
      queryClient.invalidateQueries({ queryKey: ["eaLicenseStats"] });
      setIsCreateDialogOpen(false);
      toast({
        title: "Sucesso!",
        description: "Licença criada com sucesso",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar licença",
        variant: "destructive",
      });
    },
  });

  const renewMutation = useMutation({
    mutationFn: (data: { id: number; days: number }) =>
      trpc.eaLicense.renew.mutate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["eaLicenses"] });
      queryClient.invalidateQueries({ queryKey: ["eaLicenseStats"] });
      setIsRenewDialogOpen(false);
      toast({
        title: "Sucesso!",
        description: "Licença renovada com sucesso",
      });
    },
  });

  const activateMutation = useMutation({
    mutationFn: (id: number) => trpc.eaLicense.activate.mutate({ id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["eaLicenses"] });
      toast({ title: "Licença ativada" });
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: number) => trpc.eaLicense.deactivate.mutate({ id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["eaLicenses"] });
      toast({ title: "Licença desativada" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => trpc.eaLicense.delete.mutate({ id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["eaLicenses"] });
      queryClient.invalidateQueries({ queryKey: ["eaLicenseStats"] });
      toast({ title: "Licença deletada" });
    },
  });

  const handleCreateSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    createMutation.mutate({
      userId: parseInt(formData.get("userId") as string),
      accountNumber: formData.get("accountNumber") as string,
      eaType: formData.get("eaType") as "master" | "slave" | "both",
      expiryDate: formData.get("expiryDate") as string,
      maxSlaves: parseInt(formData.get("maxSlaves") as string) || 0,
      notes: formData.get("notes") as string || undefined,
    });
  };

  const handleRenewSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    renewMutation.mutate({
      id: selectedLicense.id,
      days: parseInt(formData.get("days") as string),
    });
  };

  const getBadgeVariant = (daysRemaining: number, isActive: boolean) => {
    if (!isActive) return "secondary";
    if (daysRemaining < 0) return "destructive";
    if (daysRemaining <= 7) return "destructive";
    if (daysRemaining <= 30) return "warning";
    return "success";
  };

  const getBadgeText = (daysRemaining: number, isActive: boolean) => {
    if (!isActive) return "Inativa";
    if (daysRemaining < 0) return "Expirada";
    if (daysRemaining === 0) return "Expira hoje";
    if (daysRemaining === 1) return "Expira amanhã";
    return `${daysRemaining} dias`;
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Estatísticas */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Ativas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Expiradas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{stats.expired}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Expirando em 7 dias
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">{stats.expiringIn7Days}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Expirando em 30 dias
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.expiringIn30Days}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabela de Licenças */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Licenças de EA</CardTitle>
            <div className="flex gap-2">
              <Select value={filter} onValueChange={(v: any) => setFilter(v)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="active">Ativas</SelectItem>
                  <SelectItem value="expired">Expiradas</SelectItem>
                  <SelectItem value="expiring">Expirando (30d)</SelectItem>
                </SelectContent>
              </Select>
              
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Nova Licença
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Carregando...</div>
          ) : licenses && licenses.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Conta</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Expira em</TableHead>
                  <TableHead>Data de Expiração</TableHead>
                  <TableHead>Último Uso</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {licenses.map((license: any) => (
                  <TableRow key={license.id}>
                    <TableCell className="font-mono">{license.accountNumber}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{license.eaType.toUpperCase()}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getBadgeVariant(license.daysRemaining, license.isActive)}>
                        {getBadgeText(license.daysRemaining, license.isActive)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {license.daysRemaining >= 0
                        ? `${license.daysRemaining} dias`
                        : `Expirou há ${Math.abs(license.daysRemaining)} dias`}
                    </TableCell>
                    <TableCell>
                      {new Date(license.expiryDate).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell>
                      {license.lastUsedAt
                        ? new Date(license.lastUsedAt).toLocaleDateString("pt-BR")
                        : "Nunca"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedLicense(license);
                            setIsRenewDialogOpen(true);
                          }}
                        >
                          <Calendar className="h-4 w-4" />
                        </Button>
                        
                        {license.isActive ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deactivateMutation.mutate(license.id)}
                          >
                            <PowerOff className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => activateMutation.mutate(license.id)}
                          >
                            <Power className="h-4 w-4" />
                          </Button>
                        )}
                        
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            if (confirm("Tem certeza que deseja deletar esta licença?")) {
                              deleteMutation.mutate(license.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma licença encontrada
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog: Criar Licença */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Nova Licença</DialogTitle>
            <DialogDescription>
              Crie uma nova licença para um EA Master ou Slave
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <div>
              <Label htmlFor="userId">ID do Usuário</Label>
              <Input
                id="userId"
                name="userId"
                type="number"
                required
                placeholder="1"
              />
            </div>

            <div>
              <Label htmlFor="accountNumber">Número da Conta MT4/MT5</Label>
              <Input
                id="accountNumber"
                name="accountNumber"
                required
                placeholder="12345678"
              />
            </div>

            <div>
              <Label htmlFor="eaType">Tipo de EA</Label>
              <Select name="eaType" required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="master">Master</SelectItem>
                  <SelectItem value="slave">Slave</SelectItem>
                  <SelectItem value="both">Ambos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="expiryDate">Data de Expiração</Label>
              <Input
                id="expiryDate"
                name="expiryDate"
                type="date"
                required
              />
            </div>

            <div>
              <Label htmlFor="maxSlaves">Máximo de Slaves (0 = ilimitado)</Label>
              <Input
                id="maxSlaves"
                name="maxSlaves"
                type="number"
                defaultValue="0"
                min="0"
              />
            </div>

            <div>
              <Label htmlFor="notes">Notas (opcional)</Label>
              <Textarea
                id="notes"
                name="notes"
                placeholder="Informações adicionais sobre a licença..."
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Criando..." : "Criar Licença"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog: Renovar Licença */}
      <Dialog open={isRenewDialogOpen} onOpenChange={setIsRenewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Renovar Licença</DialogTitle>
            <DialogDescription>
              Estender a validade da licença por X dias
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleRenewSubmit} className="space-y-4">
            <div>
              <Label>Conta</Label>
              <Input value={selectedLicense?.accountNumber} disabled />
            </div>

            <div>
              <Label>Expira em</Label>
              <Input
                value={
                  selectedLicense
                    ? new Date(selectedLicense.expiryDate).toLocaleDateString("pt-BR")
                    : ""
                }
                disabled
              />
            </div>

            <div>
              <Label htmlFor="days">Estender por (dias)</Label>
              <Select name="days" required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 dias (1 mês)</SelectItem>
                  <SelectItem value="90">90 dias (3 meses)</SelectItem>
                  <SelectItem value="180">180 dias (6 meses)</SelectItem>
                  <SelectItem value="365">365 dias (1 ano)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsRenewDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={renewMutation.isPending}>
                {renewMutation.isPending ? "Renovando..." : "Renovar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

