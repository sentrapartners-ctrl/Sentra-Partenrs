import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Lightbulb, Plus } from "lucide-react";
import { useEffect } from "react";

export default function Strategies() {
  const { isAuthenticated, loading } = useAuth();

  const { data: strategies, refetch } = trpc.strategies.list.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  useEffect(() => {
    if (!isAuthenticated || loading) return;
    const interval = setInterval(() => refetch(), 15000);
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
            Faça login para ver suas estratégias
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
            <h1 className="text-3xl font-bold">Estratégias</h1>
            <p className="text-muted-foreground">
              Gerencie suas estratégias de trading
            </p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nova Estratégia
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              Minhas Estratégias
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!strategies || strategies.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>Nenhuma estratégia cadastrada</p>
                <p className="text-sm mt-2">
                  Clique em "Nova Estratégia" para começar
                </p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {strategies.map((strategy) => (
                  <Card key={strategy.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">
                            {strategy.name}
                          </CardTitle>
                          {strategy.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {strategy.description}
                            </p>
                          )}
                        </div>
                        <Badge
                          variant={
                            strategy.isActive ? "default" : "secondary"
                          }
                        >
                          {strategy.isActive ? "Ativo" : "Inativo"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {strategy.rules && (
                        <div>
                          <span className="text-sm text-muted-foreground">
                            Regras:
                          </span>
                          <p className="text-sm mt-1">{strategy.rules}</p>
                        </div>
                      )}
                      
                      {strategy.riskManagement && (
                        <div>
                          <span className="text-sm text-muted-foreground">
                            Gerenciamento de Risco:
                          </span>
                          <p className="text-sm mt-1">{strategy.riskManagement}</p>
                        </div>
                      )}

                      <div className="flex gap-2 pt-2">
                        <Button variant="outline" size="sm" className="flex-1">
                          Editar
                        </Button>
                        <Button
                          variant={strategy.isActive ? "destructive" : "default"}
                          size="sm"
                          className="flex-1"
                        >
                          {strategy.isActive ? "Desativar" : "Ativar"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

