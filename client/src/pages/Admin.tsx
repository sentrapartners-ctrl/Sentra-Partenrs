import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Users, Database, Activity, Settings } from "lucide-react";

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
  const { data: allUsers, isLoading } = trpc.admin.listUsers.useQuery();

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Todos os Usuários</CardTitle>
          <CardDescription>
            {allUsers?.length || 0} usuários cadastrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {allUsers?.map((user) => (
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
                  <Badge variant={user.isActive ? "default" : "destructive"}>
                    {user.isActive ? "Ativo" : "Inativo"}
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

function AccountsTab() {
  const { data: allAccounts, isLoading } = trpc.admin.listAllAccounts.useQuery();

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Todas as Contas de Trading</CardTitle>
          <CardDescription>
            {allAccounts?.length || 0} contas cadastradas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {allAccounts?.map((account) => (
              <div
                key={account.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div>
                  <div className="font-medium">
                    {account.broker} - {account.accountNumber}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Usuário ID: {account.userId} | {account.platform}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Balance: ${(account.balance / 100).toFixed(2)} | 
                    Equity: ${(account.equity / 100).toFixed(2)}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      account.status === "connected"
                        ? "default"
                        : account.status === "disconnected"
                        ? "secondary"
                        : "destructive"
                    }
                  >
                    {account.status}
                  </Badge>
                  <Badge variant="outline">{account.accountType}</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SystemTab() {
  const { data: stats } = trpc.admin.getSystemStats.useQuery();

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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

