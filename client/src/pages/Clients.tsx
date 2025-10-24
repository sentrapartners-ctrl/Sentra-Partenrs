import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Users, UserCheck, UserX, Shield } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";

export default function Clients() {
  const { user } = useAuth();
  const [selectedManager, setSelectedManager] = useState<Record<number, number | null>>({});
  
  const { data: clients, refetch } = trpc.users.listClients.useQuery();
  const { data: managers } = trpc.users.listManagers.useQuery();
  const assignManager = trpc.users.assignManager.useMutation({
    onSuccess: () => {
      refetch();
    }
  });

  const handleAssignManager = (userId: number, managerId: number | null) => {
    assignManager.mutate({ userId, managerId });
  };

  if (user?.role !== "admin") {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Acesso restrito a administradores</p>
        </div>
      </div>
    );
  }

  const activeClients = clients?.filter(c => c.isActive) || [];
  const inactiveClients = clients?.filter(c => !c.isActive) || [];
  const clientsWithManager = activeClients.filter(c => c.managerId);
  const clientsWithoutManager = activeClients.filter(c => !c.managerId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gerenciamento de Clientes</h1>
        <p className="text-muted-foreground mt-2">
          Atribua gerentes responsáveis para cada cliente
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeClients.length}</div>
            <p className="text-xs text-muted-foreground">
              {inactiveClients.length} inativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Com Gerente</CardTitle>
            <UserCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clientsWithManager.length}</div>
            <p className="text-xs text-muted-foreground">
              {((clientsWithManager.length / activeClients.length) * 100 || 0).toFixed(0)}% do total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sem Gerente</CardTitle>
            <UserX className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clientsWithoutManager.length}</div>
            <p className="text-xs text-muted-foreground">
              Aguardando atribuição
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gerentes Ativos</CardTitle>
            <Shield className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{managers?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Disponíveis
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Clients Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Clientes</CardTitle>
          <CardDescription>
            Selecione o gerente responsável por cada cliente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activeClients.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Nenhum cliente cadastrado</p>
              </div>
            ) : (
              <div className="space-y-2">
                {activeClients.map((client) => {
                  const currentManager = managers?.find(m => m.id === client.managerId);
                  
                  return (
                    <div
                      key={client.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-sm font-medium text-primary">
                              {client.name?.charAt(0).toUpperCase() || "?"}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">{client.name || "Sem nome"}</p>
                            <p className="text-sm text-muted-foreground">{client.email}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        {currentManager && (
                          <Badge variant="outline" className="gap-1">
                            <UserCheck className="h-3 w-3" />
                            {currentManager.name}
                          </Badge>
                        )}
                        
                        <Select
                          value={selectedManager[client.id]?.toString() || client.managerId?.toString() || "none"}
                          onValueChange={(value) => {
                            const managerId = value === "none" ? null : parseInt(value);
                            setSelectedManager({ ...selectedManager, [client.id]: managerId });
                            handleAssignManager(client.id, managerId);
                          }}
                        >
                          <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Selecionar gerente" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Sem gerente</SelectItem>
                            {managers?.map((manager) => (
                              <SelectItem key={manager.id} value={manager.id.toString()}>
                                {manager.name || manager.email}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

