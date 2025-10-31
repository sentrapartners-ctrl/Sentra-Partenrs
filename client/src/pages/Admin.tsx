import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Users, Database, Activity, Settings, Edit, Trash2, Power, PowerOff, CreditCard, Server, Bot, DollarSign, Eye, ArrowRightLeft, Globe, Shield } from "lucide-react";
import { toast } from "sonner";
import { EditPlanDialog } from "@/components/EditPlanDialog";
import { EditVPSDialog } from "@/components/EditVPSDialog";
import { EditEADialog } from "@/components/EditEADialog";
import { EditCryptoAddressDialog } from "@/components/EditCryptoAddressDialog";
import { AccountReportDialog } from "@/components/AccountReportDialog";
import { TransferClientDialog } from "@/components/TransferClientDialog";
import { formatPrice } from "@/lib/formatPrice";
import AdminProviderEarnings from "@/components/AdminProviderEarnings";
import { ManualPermissionsDialog } from "@/components/ManualPermissionsDialog";

export default function Admin() {
  const { user } = useAuth();
  const [selectedTab, setSelectedTab] = useState<"users" | "accounts" | "system" | "subscriptions" | "vps" | "eas" | "payments" | "landing" | "commissions">("users");

  // Verificar se é admin ou manager
  if (user?.role !== "admin" && user?.role !== "manager") {
    return (
      <DashboardLayout>
        <div className="p-6">
          <Alert variant="destructive">
            <AlertDescription>
              Acesso negado. Apenas administradores e gerentes podem acessar esta página.
            </AlertDescription>
          </Alert>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Painel Administrativo</h1>
          <p className="text-muted-foreground mt-2">
            Gerencie usuários, contas e configurações do sistema
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b">
          <Button
            variant={selectedTab === "users" ? "default" : "ghost"}
            onClick={() => setSelectedTab("users")}
            className="rounded-b-none"
          >
            <Users className="h-4 w-4 mr-2" />
            Usuários
          </Button>
          <Button
            variant={selectedTab === "accounts" ? "default" : "ghost"}
            onClick={() => setSelectedTab("accounts")}
            className="rounded-b-none"
          >
            <Database className="h-4 w-4 mr-2" />
            Contas
          </Button>
          <Button
            variant={selectedTab === "system" ? "default" : "ghost"}
            onClick={() => setSelectedTab("system")}
            className="rounded-b-none"
          >
            <Settings className="h-4 w-4 mr-2" />
            Sistema
          </Button>
          <Button
            variant={selectedTab === "subscriptions" ? "default" : "ghost"}
            onClick={() => setSelectedTab("subscriptions")}
            className="rounded-b-none"
          >
            <CreditCard className="h-4 w-4 mr-2" />
            Assinaturas
          </Button>
          <Button
            variant={selectedTab === "vps" ? "default" : "ghost"}
            onClick={() => setSelectedTab("vps")}
            className="rounded-b-none"
          >
            <Server className="h-4 w-4 mr-2" />
            VPS
          </Button>
          <Button
            variant={selectedTab === "eas" ? "default" : "ghost"}
            onClick={() => setSelectedTab("eas")}
            className="rounded-b-none"
          >
            <Bot className="h-4 w-4 mr-2" />
            EAs
          </Button>
          <Button
            variant={selectedTab === "payments" ? "default" : "ghost"}
            onClick={() => setSelectedTab("payments")}
            className="rounded-b-none"
          >
            <DollarSign className="h-4 w-4 mr-2" />
            Pagamentos
          </Button>
          <Button
            variant={selectedTab === "landing" ? "default" : "ghost"}
            onClick={() => setSelectedTab("landing")}
            className="rounded-b-none"
          >
            <Globe className="h-4 w-4 mr-2" />
            Landing Page
          </Button>
          <Button
            variant={selectedTab === "commissions" ? "default" : "ghost"}
            onClick={() => setSelectedTab("commissions")}
            className="rounded-b-none"
          >
            <DollarSign className="h-4 w-4 mr-2" />
            Comissões
          </Button>
        </div>

        {/* Content */}
        {selectedTab === "users" && <UsersTab />}
        {selectedTab === "accounts" && <AccountsTab />}
        {selectedTab === "system" && <SystemTab />}
        {selectedTab === "subscriptions" && <SubscriptionsTab />}
        {selectedTab === "vps" && <VPSTab />}
        {selectedTab === "eas" && <EAsTab />}
        {selectedTab === "payments" && <PaymentsTab />}
        {selectedTab === "landing" && <LandingPageTab />}
        {selectedTab === "commissions" && <ProviderEarningsTab />}
      </div>
    </DashboardLayout>
  );
}

function UsersTab() {
  const { data: allUsers, isLoading, refetch } = trpc.admin.listUsers.useQuery();
  const updateUserMutation = trpc.admin.updateUser.useMutation();
  const deleteUserMutation = trpc.admin.deleteUser.useMutation();

  const [editingUser, setEditingUser] = useState<any>(null);
  const [editForm, setEditForm] = useState({ name: "", email: "", role: "user" });
  const [deletingUser, setDeletingUser] = useState<any>(null);
  const [transferringClient, setTransferringClient] = useState<any>(null);
  const [permissionsUser, setPermissionsUser] = useState<any>(null);

  const handleEdit = (user: any) => {
    setEditingUser(user);
    setEditForm({ name: user.name || "", email: user.email, role: user.role });
  };

  const handleSave = async () => {
    try {
      await updateUserMutation.mutateAsync({
        userId: editingUser.id,
        ...editForm,
      });
      toast.success("Usuário atualizado com sucesso");
      setEditingUser(null);
      refetch();
    } catch (error) {
      toast.error("Erro ao atualizar usuário");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteUserMutation.mutateAsync({ userId: deletingUser.id });
      toast.success("Usuário excluído com sucesso");
      setDeletingUser(null);
      refetch();
    } catch (error) {
      toast.error("Erro ao excluir usuário");
    }
  };

  const handleToggleActive = async (userId: number, currentStatus: boolean) => {
    try {
      await updateUserMutation.mutateAsync({
        userId,
        isActive: !currentStatus,
      });
      toast.success(currentStatus ? "Usuário desativado" : "Usuário ativado");
      refetch();
    } catch (error) {
      toast.error("Erro ao atualizar status");
    }
  };

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  const activeUsers = allUsers?.filter((u) => u.isActive) || [];
  const inactiveUsers = allUsers?.filter((u) => !u.isActive) || [];

  return (
    <div className="space-y-6">
      {/* Usuários Ativos */}
      <Card>
        <CardHeader>
          <CardTitle>Usuários Ativos</CardTitle>
          <CardDescription>{activeUsers.length} usuários ativos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activeUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div>
                  <div className="font-medium">{user.name || "Sem nome"}</div>
                  <div className="text-sm text-muted-foreground">{user.email}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge>{user.role}</Badge>
                  {user.role === 'client' && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setTransferringClient(user)}
                      title="Transferir para outro gerente"
                    >
                      <ArrowRightLeft className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant={user.manual_permissions ? "default" : "outline"}
                    onClick={() => setPermissionsUser(user)}
                    title="Gerenciar permissões manuais"
                  >
                    <Shield className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(user)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleToggleActive(user.id, user.isActive)}
                  >
                    <PowerOff className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => setDeletingUser(user)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Usuários Inativos */}
      {inactiveUsers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Usuários Desativados</CardTitle>
            <CardDescription>{inactiveUsers.length} usuários desativados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {inactiveUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 border rounded-lg opacity-60"
                >
                  <div>
                    <div className="font-medium">{user.name || "Sem nome"}</div>
                    <div className="text-sm text-muted-foreground">{user.email}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{user.role}</Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleToggleActive(user.id, user.isActive)}
                    >
                      <Power className="h-4 w-4 mr-1" />
                      Ativar
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => setDeletingUser(user)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialog: Editar Usuário */}
      <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
            <DialogDescription>
              Atualize as informações do usuário
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome</Label>
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              />
            </div>
            <div>
              <Label>Função</Label>
              <select
                className="w-full p-2 border rounded"
                value={editForm.role}
                onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
              >
                <option value="user">Usuário</option>
                <option value="manager">Gerente</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingUser(null)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Transferir Cliente */}
      <TransferClientDialog
        client={transferringClient}
        open={!!transferringClient}
        onOpenChange={(open) => !open && setTransferringClient(null)}
        onSuccess={refetch}
      />

      {/* Dialog: Permissões Manuais */}
      <ManualPermissionsDialog
        user={permissionsUser}
        open={!!permissionsUser}
        onOpenChange={(open) => !open && setPermissionsUser(null)}
        onSuccess={refetch}
      />

      {/* AlertDialog: Confirmar Exclusão */}
      <AlertDialog open={!!deletingUser} onOpenChange={() => setDeletingUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O usuário{" "}
              <strong>{deletingUser?.email}</strong> será permanentemente excluído.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function AccountsTab() {
  const { data: allAccounts, isLoading, refetch } = trpc.admin.listAccounts.useQuery();
  const { data: allUsers } = trpc.admin.listUsers.useQuery();
  const deleteAccountMutation = trpc.admin.deleteAccount.useMutation();
  const toggleAccountMutation = trpc.admin.toggleAccountActive.useMutation();

  const [deletingAccount, setDeletingAccount] = useState<any>(null);
  const [viewingAccount, setViewingAccount] = useState<any>(null);

  const getUserEmail = (userId: number) => {
    return allUsers?.find((u) => u.id === userId)?.email || "Desconhecido";
  };

  const handleDelete = async () => {
    try {
      await deleteAccountMutation.mutateAsync({ accountId: deletingAccount.id });
      toast.success("Conta excluída com sucesso");
      setDeletingAccount(null);
      refetch();
    } catch (error) {
      toast.error("Erro ao excluir conta");
    }
  };

  const handleToggleActive = async (accountId: number, currentStatus: boolean) => {
    try {
      await toggleAccountMutation.mutateAsync({
        accountId,
        isActive: !currentStatus,
      });
      toast.success(currentStatus ? "Conta desativada" : "Conta ativada");
      refetch();
    } catch (error) {
      toast.error("Erro ao atualizar status");
    }
  };

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  const activeAccounts = allAccounts?.filter((a) => a.isActive) || [];
  const inactiveAccounts = allAccounts?.filter((a) => !a.isActive) || [];

  return (
    <div className="space-y-6">
      {/* Contas Ativas */}
      <Card>
        <CardHeader>
          <CardTitle>Contas Ativas</CardTitle>
          <CardDescription>{activeAccounts.length} contas ativas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activeAccounts.map((account) => (
              <div
                key={account.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div>
                  <div className="font-medium">
                    {account.broker} - {account.accountNumber}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Usuário: {getUserEmail(account.userId)}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge>{account.status}</Badge>
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => setViewingAccount(account)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Ver Relatório
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleToggleActive(account.id, account.isActive)}
                  >
                    <PowerOff className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => setDeletingAccount(account)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Contas Desativadas */}
      {inactiveAccounts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Contas Desativadas</CardTitle>
            <CardDescription>{inactiveAccounts.length} contas desativadas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {inactiveAccounts.map((account) => (
                <div
                  key={account.id}
                  className="flex items-center justify-between p-4 border rounded-lg opacity-60"
                >
                  <div>
                    <div className="font-medium">
                      {account.broker} - {account.accountNumber}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Usuário: {getUserEmail(account.userId)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{account.status}</Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleToggleActive(account.id, account.isActive)}
                    >
                      <Power className="h-4 w-4 mr-1" />
                      Ativar
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => setDeletingAccount(account)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialog: Ver Relatório */}
      <AccountReportDialog
        account={viewingAccount}
        open={!!viewingAccount}
        onOpenChange={(open) => !open && setViewingAccount(null)}
      />

      {/* AlertDialog: Confirmar Exclusão */}
      <AlertDialog open={!!deletingAccount} onOpenChange={() => setDeletingAccount(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A conta{" "}
              <strong>
                {deletingAccount?.broker} - {deletingAccount?.accountNumber}
              </strong>{" "}
              e todos os seus trades serão permanentemente excluídos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function SystemTab() {
  const { data: stats, isLoading } = trpc.admin.getSystemStats.useQuery();
  const { data: allUsers } = trpc.admin.listUsers.useQuery();
  const { data: allAccounts } = trpc.admin.listAccounts.useQuery();

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  const activeUsers = allUsers?.filter(u => u.isActive).length || 0;
  const connectedAccounts = allAccounts?.filter(a => a.status === 'connected').length || 0;
  const totalBalance = allAccounts?.reduce((sum, a) => sum + (a.balance || 0), 0) || 0;
  const totalEquity = allAccounts?.reduce((sum, a) => sum + (a.equity || 0), 0) || 0;
  const totalProfit = totalEquity - totalBalance;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'USD',
    }).format(value / 100);
  };

  return (
    <div className="space-y-6">
      {/* Estatísticas Gerais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
            <p className="text-xs text-muted-foreground">{activeUsers} ativos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Contas</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalAccounts || 0}</div>
            <p className="text-xs text-muted-foreground">{connectedAccounts} conectadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Trades</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalTrades || 0}</div>
            <p className="text-xs text-muted-foreground">Histórico completo</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contas Conectadas</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{connectedAccounts}</div>
            <p className="text-xs text-muted-foreground">Online agora</p>
          </CardContent>
        </Card>
      </div>

      {/* Estatísticas Financeiras */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Balance Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrency(totalBalance)}</div>
            <p className="text-sm text-muted-foreground mt-2">Soma de todas as contas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Equity Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrency(totalEquity)}</div>
            <p className="text-sm text-muted-foreground mt-2">Valor atual com posições</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lucro/Prejuízo Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(totalProfit)}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {totalProfit >= 0 ? 'Lucro' : 'Prejuízo'} acumulado
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Distribuição por Plataforma */}
      <Card>
        <CardHeader>
          <CardTitle>Distribuição por Plataforma</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {['MT4', 'MT5', 'cTrader'].map((platform) => {
              const count = allAccounts?.filter(a => a.platform === platform).length || 0;
              const percentage = stats?.totalAccounts ? (count / stats.totalAccounts) * 100 : 0;
              return (
                <div key={platform}>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">{platform}</span>
                    <span className="text-sm text-muted-foreground">{count} contas ({percentage.toFixed(1)}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Top 5 Contas por Balance */}
      <Card>
        <CardHeader>
          <CardTitle>Top 5 Contas por Balance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {allAccounts
              ?.sort((a, b) => (b.balance || 0) - (a.balance || 0))
              .slice(0, 5)
              .map((account, index) => (
                <div key={account.id} className="flex items-center justify-between p-3 border rounded">
                  <div className="flex items-center gap-3">
                    <div className="text-lg font-bold text-muted-foreground">#{index + 1}</div>
                    <div>
                      <div className="font-medium">{account.broker} - {account.accountNumber}</div>
                      <div className="text-sm text-muted-foreground">{account.platform}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{formatCurrency(account.balance || 0)}</div>
                    <Badge variant={account.status === 'connected' ? 'default' : 'secondary'}>
                      {account.status}
                    </Badge>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Tab: Gerenciar Planos de Assinatura
function SubscriptionsTab() {
  const [plans, setPlans] = useState<any[]>([]);
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const response = await fetch('/api/subscription-plans');
      const data = await response.json();
      if (data.success) {
        setPlans(data.plans);
      }
    } catch (error) {
      console.error('Erro ao carregar planos:', error);
      toast.error('Erro ao carregar planos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Planos de Assinatura</h2>
          <p className="text-muted-foreground">Gerencie os planos disponíveis</p>
        </div>
        <Button onClick={() => setEditingPlan({})}>
          <CreditCard className="h-4 w-4 mr-2" />
          Novo Plano
        </Button>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {plans.map((plan) => (
          <Card key={plan.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{plan.name}</CardTitle>
                <Badge variant={plan.active ? "default" : "secondary"}>
                  {plan.active ? "Ativo" : "Inativo"}
                </Badge>
              </div>
              <CardDescription>R$ {formatPrice(plan.price)}/mês</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-2">Recursos:</p>
                <ul className="text-sm space-y-1">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="text-muted-foreground">• {feature}</li>
                  ))}
                </ul>
              </div>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setEditingPlan(plan)}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Editar
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setEditingPlan(plan)}
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Assinaturas Ativas</CardTitle>
          <CardDescription>Usuários com assinaturas ativas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Nenhuma assinatura ativa no momento
          </div>
        </CardContent>
      </Card>

      <EditPlanDialog
        plan={editingPlan}
        open={!!editingPlan}
        onOpenChange={(open) => !open && setEditingPlan(null)}
        onSave={async (updatedPlan) => {
          try {
            const isNew = !updatedPlan.id || updatedPlan.id === 0;
            const url = isNew ? '/api/subscription-plans' : `/api/subscription-plans/${updatedPlan.id}`;
            const method = isNew ? 'POST' : 'PUT';
            
            const response = await fetch(url, {
              method,
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(updatedPlan)
            });
            
            const data = await response.json();
            if (data.success) {
              toast.success(isNew ? 'Plano criado com sucesso!' : 'Plano atualizado com sucesso!');
              loadPlans();
              setEditingPlan(null);
            } else {
              toast.error(data.error || 'Erro ao salvar plano');
            }
          } catch (error) {
            console.error('Erro ao salvar plano:', error);
            toast.error('Erro ao salvar plano');
          }
        }}
      />
    </div>
  );
}

// Tab: Gerenciar Produtos VPS
function VPSTab() {
  const [vpsProducts, setVpsProducts] = useState<any[]>([]);
  const [editingVPS, setEditingVPS] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVPSProducts();
  }, []);

  const loadVPSProducts = async () => {
    try {
      const response = await fetch('/api/vps-products');
      const data = await response.json();
      if (data.success) {
        setVpsProducts(data.products);
      }
    } catch (error) {
      console.error('Erro ao carregar produtos VPS:', error);
      toast.error('Erro ao carregar produtos VPS');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Produtos VPS</h2>
          <p className="text-muted-foreground">Gerencie os servidores VPS disponíveis</p>
        </div>
        <Button onClick={() => setEditingVPS({})}>
          <Server className="h-4 w-4 mr-2" />
          Nova VPS
        </Button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {vpsProducts.map((vps) => (
          <Card key={vps.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{vps.name}</CardTitle>
                {vps.free && <Badge className="bg-purple-500">Grátis</Badge>}
              </div>
              <CardDescription>
                {vps.free ? "Incluído no Premium" : `R$ ${formatPrice(vps.price)}/mês`}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">CPU:</span>
                  <span className="font-medium">{vps.cpu}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">RAM:</span>
                  <span className="font-medium">{vps.ram}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge variant={vps.active ? "default" : "secondary"}>
                    {vps.active ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setEditingVPS(vps)}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Editar
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setEditingVPS(vps)}
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>VPS Ativas</CardTitle>
          <CardDescription>Servidores VPS atualmente em uso</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Nenhuma VPS ativa no momento
          </div>
        </CardContent>
      </Card>

      <EditVPSDialog
        vps={editingVPS}
        open={!!editingVPS}
        onOpenChange={(open) => !open && setEditingVPS(null)}
        onSave={async (updatedVPS) => {
          try {
            const isNew = !updatedVPS.id || updatedVPS.id === 0;
            const url = isNew ? '/api/vps-products' : `/api/vps-products/${updatedVPS.id}`;
            const method = isNew ? 'POST' : 'PUT';
            
            const response = await fetch(url, {
              method,
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(updatedVPS)
            });
            
            const data = await response.json();
            if (data.success) {
              toast.success(isNew ? 'Produto VPS criado com sucesso!' : 'Produto VPS atualizado com sucesso!');
              loadVPSProducts();
              setEditingVPS(null);
            } else {
              toast.error(data.error || 'Erro ao salvar produto VPS');
            }
          } catch (error) {
            console.error('Erro ao salvar produto VPS:', error);
            toast.error('Erro ao salvar produto VPS');
          }
        }}
      />
    </div>
  );
}

// Tab: Gerenciar Expert Advisors
function EAsTab() {
  const [eas, setEas] = useState<any[]>([]);
  const [editingEA, setEditingEA] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEAs();
  }, []);

  const loadEAs = async () => {
    try {
      const response = await fetch('/api/expert-advisors');
      const data = await response.json();
      if (data.success) {
        setEas(data.eas);
      }
    } catch (error) {
      console.error('Erro ao carregar EAs:', error);
      toast.error('Erro ao carregar EAs');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Expert Advisors</h2>
          <p className="text-muted-foreground">Gerencie os EAs disponíveis para venda</p>
        </div>
        <Button onClick={() => setEditingEA({})}>
          <Bot className="h-4 w-4 mr-2" />
          Novo EA
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {eas.map((ea) => (
          <Card key={ea.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{ea.name}</CardTitle>
                  <CardDescription className="mt-1">
                    <Badge variant="outline">{ea.platform}</Badge>
                  </CardDescription>
                </div>
                <Badge variant={ea.active ? "default" : "secondary"}>
                  {ea.active ? "Ativo" : "Inativo"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Preço</p>
                  <p className="font-bold text-lg">R$ {formatPrice(ea.price)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Downloads</p>
                  <p className="font-bold text-lg">{ea.downloads}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setEditingEA(ea)}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Editar
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setEditingEA(ea)}
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Vendas Recentes</CardTitle>
          <CardDescription>Últimas vendas de Expert Advisors</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Nenhuma venda registrada
          </div>
        </CardContent>
      </Card>

      <EditEADialog
        ea={editingEA}
        open={!!editingEA}
        onOpenChange={(open) => !open && setEditingEA(null)}
        onSave={async (updatedEA) => {
          try {
            const isNew = !updatedEA.id || updatedEA.id === 0;
            const url = isNew ? '/api/expert-advisors' : `/api/expert-advisors/${updatedEA.id}`;
            const method = isNew ? 'POST' : 'PUT';
            
            const response = await fetch(url, {
              method,
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(updatedEA)
            });
            
            const data = await response.json();
            if (data.success) {
              toast.success(isNew ? 'EA criado com sucesso!' : 'EA atualizado com sucesso!');
              loadEAs();
              setEditingEA(null);
            } else {
              toast.error(data.error || 'Erro ao salvar EA');
            }
          } catch (error) {
            console.error('Erro ao salvar EA:', error);
            toast.error('Erro ao salvar EA');
          }
        }}
      />
    </div>
  );
}

// Tab: Pagamentos Cripto
function PaymentsTab() {
  const [cryptoAddresses, setCryptoAddresses] = useState([
    { id: 1, crypto: "Bitcoin", symbol: "BTC", address: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh", active: true },
    { id: 2, crypto: "USDT (Ethereum)", symbol: "USDT", address: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb", active: true },
    { id: 3, crypto: "USDT (Polygon)", symbol: "USDT", address: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb", active: true },
    { id: 4, crypto: "Polygon", symbol: "MATIC", address: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb", active: true },
    { id: 5, crypto: "Ethereum", symbol: "ETH", address: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb", active: true },
  ]);
  const [editingAddress, setEditingAddress] = useState<any>(null);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Pagamentos Cripto</h2>
        <p className="text-muted-foreground">Gerencie endereços e transações de criptomoedas</p>
      </div>

      {/* Endereços de Recebimento */}
      <Card>
        <CardHeader>
          <CardTitle>Endereços de Recebimento</CardTitle>
          <CardDescription>Carteiras configuradas para receber pagamentos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {cryptoAddresses.map((addr) => (
              <div key={addr.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <DollarSign className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium">{addr.crypto}</div>
                    <div className="text-xs text-muted-foreground font-mono">
                      {addr.address.slice(0, 20)}...{addr.address.slice(-10)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge>{addr.symbol}</Badge>
                  <Badge variant={addr.active ? "default" : "secondary"}>
                    {addr.active ? "Ativo" : "Inativo"}
                  </Badge>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setEditingAddress(addr)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Transações Recentes */}
      <Card>
        <CardHeader>
          <CardTitle>Transações Recentes</CardTitle>
          <CardDescription>Últimos pagamentos recebidos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Nenhuma transação registrada
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Recebido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ 0,00</div>
            <p className="text-xs text-muted-foreground mt-1">Todos os tempos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Este Mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ 0,00</div>
            <p className="text-xs text-muted-foreground mt-1">0 transações</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground mt-1">Aguardando confirmação</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Confirmadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground mt-1">Transações completas</p>
          </CardContent>
        </Card>
      </div>

      <EditCryptoAddressDialog
        cryptoAddress={editingAddress}
        open={!!editingAddress}
        onOpenChange={(open) => !open && setEditingAddress(null)}
        onSave={(updatedAddress) => {
          setCryptoAddresses(cryptoAddresses.map((a) => (a.id === updatedAddress.id ? updatedAddress : a)));
        }}
      />
    </div>
  );
}

// Tab: Editar Landing Page
function LandingPageTab() {
  const [content, setContent] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    try {
      const response = await fetch('/api/landing-page');
      const data = await response.json();
      if (data.success) {
        setContent(data.content);
      }
    } catch (error) {
      console.error('Erro ao carregar conteúdo da LP:', error);
      toast.error('Erro ao carregar conteúdo da LP');
    } finally {
      setLoading(false);
    }
  };

  const saveSection = async (section: string, sectionContent: any) => {
    setSaving(true);
    try {
      const response = await fetch(`/api/landing-page/${section}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: sectionContent })
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Seção atualizada com sucesso!');
        loadContent();
      } else {
        toast.error(data.error || 'Erro ao salvar');
      }
    } catch (error) {
      console.error('Erro ao salvar seção:', error);
      toast.error('Erro ao salvar seção');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-6">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Editar Landing Page</h2>
        <p className="text-muted-foreground">Personalize o conteúdo da página inicial</p>
      </div>

      {/* Hero Section */}
      <Card>
        <CardHeader>
          <CardTitle>Seção Hero (Topo)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Título</Label>
            <Input
              value={content.hero?.title || ''}
              onChange={(e) => setContent({...content, hero: {...content.hero, title: e.target.value}})}
            />
          </div>
          <div>
            <Label>Destaque (texto colorido)</Label>
            <Input
              value={content.hero?.highlight || ''}
              onChange={(e) => setContent({...content, hero: {...content.hero, highlight: e.target.value}})}
            />
          </div>
          <div>
            <Label>Subtítulo</Label>
            <textarea
              className="w-full p-2 border rounded"
              rows={3}
              value={content.hero?.subtitle || ''}
              onChange={(e) => setContent({...content, hero: {...content.hero, subtitle: e.target.value}})}
            />
          </div>
          <Button onClick={() => saveSection('hero', content.hero)} disabled={saving}>
            Salvar Hero
          </Button>
        </CardContent>
      </Card>

      {/* Stats Section */}
      <Card>
        <CardHeader>
          <CardTitle>Estatísticas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Stat 1 - Valor</Label>
              <Input
                value={content.stats?.stat1_value || ''}
                onChange={(e) => setContent({...content, stats: {...content.stats, stat1_value: e.target.value}})}
              />
            </div>
            <div>
              <Label>Stat 1 - Label</Label>
              <Input
                value={content.stats?.stat1_label || ''}
                onChange={(e) => setContent({...content, stats: {...content.stats, stat1_label: e.target.value}})}
              />
            </div>
            <div>
              <Label>Stat 2 - Valor</Label>
              <Input
                value={content.stats?.stat2_value || ''}
                onChange={(e) => setContent({...content, stats: {...content.stats, stat2_value: e.target.value}})}
              />
            </div>
            <div>
              <Label>Stat 2 - Label</Label>
              <Input
                value={content.stats?.stat2_label || ''}
                onChange={(e) => setContent({...content, stats: {...content.stats, stat2_label: e.target.value}})}
              />
            </div>
            <div>
              <Label>Stat 3 - Valor</Label>
              <Input
                value={content.stats?.stat3_value || ''}
                onChange={(e) => setContent({...content, stats: {...content.stats, stat3_value: e.target.value}})}
              />
            </div>
            <div>
              <Label>Stat 3 - Label</Label>
              <Input
                value={content.stats?.stat3_label || ''}
                onChange={(e) => setContent({...content, stats: {...content.stats, stat3_label: e.target.value}})}
              />
            </div>
            <div>
              <Label>Stat 4 - Valor</Label>
              <Input
                value={content.stats?.stat4_value || ''}
                onChange={(e) => setContent({...content, stats: {...content.stats, stat4_value: e.target.value}})}
              />
            </div>
            <div>
              <Label>Stat 4 - Label</Label>
              <Input
                value={content.stats?.stat4_label || ''}
                onChange={(e) => setContent({...content, stats: {...content.stats, stat4_label: e.target.value}})}
              />
            </div>
          </div>
          <Button onClick={() => saveSection('stats', content.stats)} disabled={saving}>
            Salvar Estatísticas
          </Button>
        </CardContent>
      </Card>

      {/* Copy Trading Section */}
      <Card>
        <CardHeader>
          <CardTitle>Copy Trading</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Título</Label>
            <Input
              value={content.copy_trading?.title || ''}
              onChange={(e) => setContent({...content, copy_trading: {...content.copy_trading, title: e.target.value}})}
            />
          </div>
          <div>
            <Label>Subtítulo</Label>
            <Input
              value={content.copy_trading?.subtitle || ''}
              onChange={(e) => setContent({...content, copy_trading: {...content.copy_trading, subtitle: e.target.value}})}
            />
          </div>
          <Button onClick={() => saveSection('copy_trading', content.copy_trading)} disabled={saving}>
            Salvar Copy Trading
          </Button>
        </CardContent>
      </Card>

      {/* Analytics Section */}
      <Card>
        <CardHeader>
          <CardTitle>Analytics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Título</Label>
            <Input
              value={content.analytics?.title || ''}
              onChange={(e) => setContent({...content, analytics: {...content.analytics, title: e.target.value}})}
            />
          </div>
          <div>
            <Label>Subtítulo</Label>
            <Input
              value={content.analytics?.subtitle || ''}
              onChange={(e) => setContent({...content, analytics: {...content.analytics, subtitle: e.target.value}})}
            />
          </div>
          <Button onClick={() => saveSection('analytics', content.analytics)} disabled={saving}>
            Salvar Analytics
          </Button>
        </CardContent>
      </Card>

      {/* VPS Section */}
      <Card>
        <CardHeader>
          <CardTitle>VPS</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Título</Label>
            <Input
              value={content.vps?.title || ''}
              onChange={(e) => setContent({...content, vps: {...content.vps, title: e.target.value}})}
            />
          </div>
          <div>
            <Label>Subtítulo</Label>
            <Input
              value={content.vps?.subtitle || ''}
              onChange={(e) => setContent({...content, vps: {...content.vps, subtitle: e.target.value}})}
            />
          </div>
          <Button onClick={() => saveSection('vps', content.vps)} disabled={saving}>
            Salvar VPS
          </Button>
        </CardContent>
      </Card>

      {/* EAs Section */}
      <Card>
        <CardHeader>
          <CardTitle>Expert Advisors</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Título</Label>
            <Input
              value={content.eas?.title || ''}
              onChange={(e) => setContent({...content, eas: {...content.eas, title: e.target.value}})}
            />
          </div>
          <div>
            <Label>Subtítulo</Label>
            <Input
              value={content.eas?.subtitle || ''}
              onChange={(e) => setContent({...content, eas: {...content.eas, subtitle: e.target.value}})}
            />
          </div>
          <Button onClick={() => saveSection('eas', content.eas)} disabled={saving}>
            Salvar EAs
          </Button>
        </CardContent>
      </Card>

      {/* CTA Final Section */}
      <Card>
        <CardHeader>
          <CardTitle>CTA Final (Rodapé)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Título</Label>
            <Input
              value={content.cta_final?.title || ''}
              onChange={(e) => setContent({...content, cta_final: {...content.cta_final, title: e.target.value}})}
            />
          </div>
          <div>
            <Label>Subtítulo</Label>
            <Input
              value={content.cta_final?.subtitle || ''}
              onChange={(e) => setContent({...content, cta_final: {...content.cta_final, subtitle: e.target.value}})}
            />
          </div>
          <div>
            <Label>Texto do Rodapé</Label>
            <Input
              value={content.cta_final?.footer_text || ''}
              onChange={(e) => setContent({...content, cta_final: {...content.cta_final, footer_text: e.target.value}})}
            />
          </div>
          <Button onClick={() => saveSection('cta_final', content.cta_final)} disabled={saving}>
            Salvar CTA Final
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// Tab: Comissões de Provedores
function ProviderEarningsTab() {
  return <AdminProviderEarnings />;
}
