import { useState } from "react";
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
import { Users, Database, Activity, Settings, Edit, Trash2, Power, PowerOff } from "lucide-react";
import { toast } from "sonner";

export default function Admin() {
  const { user } = useAuth();
  const [selectedTab, setSelectedTab] = useState<"users" | "accounts" | "system">("users");

  // Verificar se é admin
  if (user?.role !== "admin") {
    return (
      <DashboardLayout>
        <div className="p-6">
          <Alert variant="destructive">
            <AlertDescription>
              Acesso negado. Apenas administradores podem acessar esta página.
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
        </div>

        {/* Content */}
        {selectedTab === "users" && <UsersTab />}
        {selectedTab === "accounts" && <AccountsTab />}
        {selectedTab === "system" && <SystemTab />}
      </div>
    </DashboardLayout>
  );
}

function UsersTab() {
  const { data: allUsers, isLoading, refetch } = trpc.admin.listUsers.useQuery();
  const updateUserMutation = trpc.admin.updateUser.useMutation();
  const deleteUserMutation = trpc.admin.deleteUser.useMutation();

  const [editingUser, setEditingUser] = useState<any>(null);
  const [deletingUser, setDeletingUser] = useState<any>(null);
  const [newEmail, setNewEmail] = useState("");

  const handleEditEmail = async () => {
    if (!editingUser || !newEmail) return;

    try {
      await updateUserMutation.mutateAsync({
        userId: editingUser.id,
        email: newEmail,
      });
      toast.success("Email atualizado com sucesso!");
      setEditingUser(null);
      setNewEmail("");
      refetch();
    } catch (error) {
      toast.error("Erro ao atualizar email");
    }
  };

  const handleToggleActive = async (userId: number, isActive: boolean) => {
    try {
      await updateUserMutation.mutateAsync({
        userId,
        isActive: !isActive,
      });
      toast.success(isActive ? "Usuário desativado" : "Usuário ativado");
      refetch();
    } catch (error) {
      toast.error("Erro ao alterar status");
    }
  };

  const handleDelete = async () => {
    if (!deletingUser) return;

    try {
      await deleteUserMutation.mutateAsync({ userId: deletingUser.id });
      toast.success("Usuário excluído com sucesso!");
      setDeletingUser(null);
      refetch();
    } catch (error) {
      toast.error("Erro ao excluir usuário");
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
                  <div className="text-xs text-muted-foreground mt-1">
                    Cadastrado em: {new Date(user.createdAt).toLocaleDateString("pt-BR")}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                    {user.role}
                  </Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingUser(user);
                      setNewEmail(user.email);
                    }}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleToggleActive(user.id, user.isActive)}
                  >
                    <PowerOff className="h-4 w-4 mr-1" />
                    Desativar
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => setDeletingUser(user)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Excluir
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

      {/* Dialog: Editar Email */}
      <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Email do Usuário</DialogTitle>
            <DialogDescription>
              Altere o email de {editingUser?.name || "usuário"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Novo Email</Label>
              <Input
                id="email"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="novo@email.com"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingUser(null)}>
              Cancelar
            </Button>
            <Button onClick={handleEditEmail}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AlertDialog: Confirmar Exclusão */}
      <AlertDialog open={!!deletingUser} onOpenChange={() => setDeletingUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O usuário{" "}
              <strong>{deletingUser?.email}</strong> e todas as suas contas serão
              permanentemente excluídos.
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
  const { data: allAccounts, isLoading, refetch } = trpc.admin.listAllAccounts.useQuery();
  const { data: allUsers } = trpc.admin.listUsers.useQuery();
  const updateAccountMutation = trpc.admin.updateAccount.useMutation();
  const deleteAccountMutation = trpc.admin.deleteAccount.useMutation();

  const [deletingAccount, setDeletingAccount] = useState<any>(null);

  const getUserEmail = (userId: number) => {
    const user = allUsers?.find((u) => u.id === userId);
    return user?.email || "Email não encontrado";
  };

  const handleToggleActive = async (accountId: number, isActive: boolean) => {
    try {
      await updateAccountMutation.mutateAsync({
        accountId,
        isActive: !isActive,
      });
      toast.success(isActive ? "Conta desativada" : "Conta ativada");
      refetch();
    } catch (error) {
      toast.error("Erro ao alterar status da conta");
    }
  };

  const handleDelete = async () => {
    if (!deletingAccount) return;

    try {
      await deleteAccountMutation.mutateAsync({ accountId: deletingAccount.id });
      toast.success("Conta excluída com sucesso!");
      setDeletingAccount(null);
      refetch();
    } catch (error) {
      toast.error("Erro ao excluir conta");
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
          <CardDescription>{activeAccounts.length} contas conectadas</CardDescription>
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
                  <div className="text-sm text-muted-foreground">
                    Usuário ID: {account.userId} | {account.platform}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Balance: ${((account.balance || 0) / 100).toFixed(2)} | Equity: $
                    {((account.equity || 0) / 100).toFixed(2)}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={account.status === "connected" ? "default" : "secondary"}>
                    {account.status}
                  </Badge>
                  <Badge variant="outline">{account.accountType}</Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleToggleActive(account.id, account.isActive)}
                  >
                    <PowerOff className="h-4 w-4 mr-1" />
                    Desativar
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

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Contas</CardTitle>
          <Database className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.totalAccounts || 0}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Trades</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.totalTrades || 0}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Contas Conectadas</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.connectedAccounts || 0}</div>
        </CardContent>
      </Card>
    </div>
  );
}

