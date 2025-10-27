import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Users, Database, TrendingUp, TrendingDown, Eye, Activity } from "lucide-react";
import { AccountReportDialog } from "@/components/AccountReportDialog";

export default function ManagerDashboard() {
  const { user } = useAuth();
  const { data: allUsers, isLoading: loadingUsers } = trpc.admin.listUsers.useQuery();
  const { data: allAccounts, isLoading: loadingAccounts } = trpc.admin.listAllAccounts.useQuery();
  
  const [viewingAccount, setViewingAccount] = useState<any>(null);

  // Verificar se é manager
  if (user?.role !== "manager") {
    return (
      <DashboardLayout>
        <div className="p-6">
          <Alert variant="destructive">
            <AlertDescription>
              Acesso negado. Apenas gerentes podem acessar esta página.
            </AlertDescription>
          </Alert>
        </div>
      </DashboardLayout>
    );
  }

  if (loadingUsers || loadingAccounts) {
    return (
      <DashboardLayout>
        <div className="p-6">Carregando...</div>
      </DashboardLayout>
    );
  }

  // Filtrar apenas clientes atribuídos a este gerente
  const myClients = allUsers?.filter(u => u.role === 'client' && u.managerId === user.id) || [];
  const myClientIds = myClients.map(c => c.id);
  
  // Contas dos meus clientes
  const myClientsAccounts = allAccounts?.filter(a => myClientIds.includes(a.userId)) || [];
  
  // Estatísticas
  const totalClients = myClients.length;
  const activeClients = myClients.filter(c => c.isActive).length;
  const totalAccounts = myClientsAccounts.length;
  const connectedAccounts = myClientsAccounts.filter(a => a.status === 'connected').length;
  
  const totalBalance = myClientsAccounts.reduce((sum, a) => sum + (a.balance || 0), 0);
  const totalEquity = myClientsAccounts.reduce((sum, a) => sum + (a.equity || 0), 0);
  const totalProfit = totalEquity - totalBalance;
  const profitPercent = totalBalance > 0 ? (totalProfit / totalBalance) * 100 : 0;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'USD',
    }).format(value / 100);
  };

  const getClientName = (userId: number) => {
    return allUsers?.find(u => u.id === userId)?.name || "Sem nome";
  };

  const getClientEmail = (userId: number) => {
    return allUsers?.find(u => u.id === userId)?.email || "Desconhecido";
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard do Gerente</h1>
          <p className="text-muted-foreground mt-2">
            Visão geral dos seus clientes e suas contas
          </p>
        </div>

        {/* Estatísticas Gerais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Meus Clientes</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalClients}</div>
              <p className="text-xs text-muted-foreground">{activeClients} ativos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Contas</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalAccounts}</div>
              <p className="text-xs text-muted-foreground">{connectedAccounts} conectadas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Balance Total</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalBalance)}</div>
              <p className="text-xs text-muted-foreground">Soma de todas as contas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Lucro/Prejuízo</CardTitle>
              {totalProfit >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(totalProfit)}
              </div>
              <p className={`text-xs ${profitPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {profitPercent >= 0 ? '+' : ''}{profitPercent.toFixed(2)}%
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Clientes */}
        <Card>
          <CardHeader>
            <CardTitle>Meus Clientes ({totalClients})</CardTitle>
            <CardDescription>Clientes atribuídos a você</CardDescription>
          </CardHeader>
          <CardContent>
            {myClients.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum cliente atribuído ainda
              </div>
            ) : (
              <div className="space-y-4">
                {myClients.map((client) => {
                  const clientAccounts = myClientsAccounts.filter(a => a.userId === client.id);
                  const clientBalance = clientAccounts.reduce((sum, a) => sum + (a.balance || 0), 0);
                  const clientEquity = clientAccounts.reduce((sum, a) => sum + (a.equity || 0), 0);
                  const clientProfit = clientEquity - clientBalance;

                  return (
                    <div
                      key={client.id}
                      className="p-4 border rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <div className="font-medium text-lg">{client.name || "Sem nome"}</div>
                          <div className="text-sm text-muted-foreground">{client.email}</div>
                        </div>
                        <div className="text-right">
                          <Badge variant={client.isActive ? "default" : "secondary"}>
                            {client.isActive ? "Ativo" : "Inativo"}
                          </Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 mb-3">
                        <div>
                          <div className="text-xs text-muted-foreground">Contas</div>
                          <div className="font-bold">{clientAccounts.length}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Balance</div>
                          <div className="font-bold">{formatCurrency(clientBalance)}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Lucro/Prejuízo</div>
                          <div className={`font-bold ${clientProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(clientProfit)}
                          </div>
                        </div>
                      </div>

                      {clientAccounts.length > 0 && (
                        <div className="space-y-2">
                          <div className="text-sm font-medium">Contas:</div>
                          {clientAccounts.map((account) => (
                            <div
                              key={account.id}
                              className="flex items-center justify-between p-2 bg-muted rounded"
                            >
                              <div>
                                <div className="text-sm font-medium">
                                  {account.broker} - {account.accountNumber}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {account.platform} • {formatCurrency(account.balance || 0)}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant={account.status === 'connected' ? 'default' : 'secondary'}>
                                  {account.status}
                                </Badge>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setViewingAccount(account)}
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  Ver
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top 5 Contas por Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Top 5 Contas por Balance</CardTitle>
            <CardDescription>Melhores contas dos seus clientes</CardDescription>
          </CardHeader>
          <CardContent>
            {myClientsAccounts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma conta ainda
              </div>
            ) : (
              <div className="space-y-3">
                {myClientsAccounts
                  .sort((a, b) => (b.balance || 0) - (a.balance || 0))
                  .slice(0, 5)
                  .map((account, index) => (
                    <div key={account.id} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center gap-3">
                        <div className="text-lg font-bold text-muted-foreground">#{index + 1}</div>
                        <div>
                          <div className="font-medium">{account.broker} - {account.accountNumber}</div>
                          <div className="text-sm text-muted-foreground">
                            Cliente: {getClientName(account.userId)}
                          </div>
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
            )}
          </CardContent>
        </Card>

        {/* Dialog: Ver Relatório da Conta */}
        <AccountReportDialog
          account={viewingAccount}
          open={!!viewingAccount}
          onOpenChange={(open) => !open && setViewingAccount(null)}
        />
      </div>
    </DashboardLayout>
  );
}

