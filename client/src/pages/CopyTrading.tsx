import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import CopyTradingDashboard from "@/components/CopyTradingDashboard";
import CopyTradingSettings from "@/components/CopyTradingSettings";
import SignalProviderSettings from "@/components/SignalProviderSettings";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Copy, TrendingUp, Users, Activity, Settings, Share2 } from "lucide-react";
import { useEffect, useState } from "react";

export default function CopyTrading() {
  const { isAuthenticated, loading, user } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");

  const { data: copyRelations, refetch } = trpc.copyTrading.list.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  useEffect(() => {
    if (!isAuthenticated || loading) return;
    const interval = setInterval(() => refetch(), 10000);
    return () => clearInterval(interval);
  }, [isAuthenticated, loading, refetch]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!isAuthenticated) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">
            Faça login para ver copy trading
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Copy Trading</h1>
            <p className="text-muted-foreground">
              Copie operações de outras contas automaticamente em tempo real
            </p>
          </div>
          <Button>
            <Copy className="h-4 w-4 mr-2" />
            Nova Relação
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* Desktop: Tabs horizontais */}
          <TabsList className="hidden md:flex">
            <TabsTrigger value="dashboard">
              <Activity className="h-4 w-4 mr-2" />
              Dashboard em Tempo Real
            </TabsTrigger>
            <TabsTrigger value="relations">
              <Users className="h-4 w-4 mr-2" />
              Relações de Cópia
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="h-4 w-4 mr-2" />
              Configurações
            </TabsTrigger>
            <TabsTrigger value="share">
              <Share2 className="h-4 w-4 mr-2" />
              Compartilhar Sinais
            </TabsTrigger>
          </TabsList>

          {/* Mobile: Select dropdown */}
          <div className="md:hidden">
            <Select value={activeTab} onValueChange={setActiveTab}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dashboard">
                  <div className="flex items-center">
                    <Activity className="h-4 w-4 mr-2" />
                    Dashboard em Tempo Real
                  </div>
                </SelectItem>
                <SelectItem value="relations">
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-2" />
                    Relações de Cópia
                  </div>
                </SelectItem>
                <SelectItem value="settings">
                  <div className="flex items-center">
                    <Settings className="h-4 w-4 mr-2" />
                    Configurações
                  </div>
                </SelectItem>
                <SelectItem value="share">
                  <div className="flex items-center">
                    <Share2 className="h-4 w-4 mr-2" />
                    Compartilhar Sinais
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <TabsContent value="dashboard" className="space-y-6">
            {/* Dashboard em Tempo Real */}
            <CopyTradingDashboard />
          </TabsContent>

          <TabsContent value="relations" className="space-y-6">
            {/* Estatísticas das Relações */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Relações Ativas
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {copyRelations?.filter((r) => r.isActive).length || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Copiando operações
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total de Relações
                  </CardTitle>
                  <Copy className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {copyRelations?.length || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Configuradas
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Performance
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-500">
                    $0,00
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Lucro total copiado
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Lista de Relações */}
            <Card>
              <CardHeader>
                <CardTitle>Relações de Copy Trading</CardTitle>
              </CardHeader>
              <CardContent>
                {!copyRelations || copyRelations.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>Nenhuma relação de copy trading configurada</p>
                    <p className="text-sm mt-2">
                      Clique em "Nova Relação" para começar a copiar trades
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {copyRelations.map((relation) => (
                      <div
                        key={relation.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                      >
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-3">
                            <div>
                              <p className="font-semibold">
                                {relation.name}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Master: {relation.sourceAccountId} → Slave: {relation.targetAccountId}
                              </p>
                            </div>
                            <Badge
                              variant={
                                relation.isActive
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {relation.isActive ? "Ativo" : "Inativo"}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">
                                Ratio de Cópia:
                              </span>
                              <p className="font-medium">
                                {((relation.copyRatio || 100) / 100).toFixed(2)}x
                              </p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">
                                Lote Máximo:
                              </span>
                              <p className="font-medium">
                                {((relation.maxLotSize || 0) / 100).toFixed(2)}
                              </p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">
                                Status:
                              </span>
                              <p
                                className={`font-medium ${
                                  relation.isActive
                                    ? "text-green-500"
                                    : "text-red-500"
                                }`}
                              >
                                {relation.isActive ? "Ativo" : "Inativo"}
                              </p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">
                                Criado em:
                              </span>
                              <p className="font-medium">
                                {new Date(relation.createdAt).toLocaleDateString(
                                  "pt-BR"
                                )}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            Editar
                          </Button>
                          <Button variant="destructive" size="sm">
                            Pausar
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            {/* Configurações de Copy Trading */}
            <CopyTradingSettings />
          </TabsContent>

          <TabsContent value="share" className="space-y-6">
            {/* Compartilhar Sinais */}
            <SignalProviderSettings />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
