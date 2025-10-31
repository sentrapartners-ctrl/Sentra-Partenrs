import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Server, Power, PowerOff, Loader2, Copy, ExternalLink, Terminal } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

interface VMInstance {
  id: number;
  userId: number;
  productName: string;
  hostname: string;
  ipAddress: string;
  username: string;
  password: string;
  status: 'active' | 'suspended' | 'terminated';
  cpu: string;
  ram: string;
  storage: string;
  os: string;
  createdAt: string;
  expiresAt: string;
}

export default function MyVMs() {
  const { isAuthenticated, user } = useAuth();
  const [vms, setVMs] = useState<VMInstance[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      fetchVMs();
    }
  }, [isAuthenticated]);

  const fetchVMs = async () => {
    try {
      const response = await fetch('/api/vps-management/my-vms');
      if (response.ok) {
        const data = await response.json();
        setVMs(data.vms || []);
      }
    } catch (error) {
      console.error('Erro ao carregar VMs:', error);
      toast.error('Erro ao carregar suas VMs');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado!`);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">Ativa</Badge>;
      case 'suspended':
        return <Badge className="bg-yellow-500">Suspensa</Badge>;
      case 'terminated':
        return <Badge className="bg-red-500">Terminada</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (!isAuthenticated) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Faça login para ver suas VMs</p>
        </div>
      </DashboardLayout>
    );
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Minhas VMs</h1>
            <p className="text-muted-foreground">
              Gerencie seus servidores VPS contratados
            </p>
          </div>
          <Button onClick={() => window.location.href = '/marketplace/vps'}>
            <Server className="h-4 w-4 mr-2" />
            Contratar VPS
          </Button>
        </div>

        {/* VMs Grid */}
        {vms.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Server className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">Nenhuma VM contratada</h3>
              <p className="text-muted-foreground text-center mb-4">
                Você ainda não possui servidores VPS. Contrate agora para começar a usar!
              </p>
              <Button onClick={() => window.location.href = '/marketplace/vps'}>
                Ver Planos VPS
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {vms.map((vm) => (
              <Card key={vm.id} className="overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-500/10 to-blue-600/10">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white">
                        <Server className="h-6 w-6" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{vm.productName}</CardTitle>
                        <CardDescription>{vm.hostname}</CardDescription>
                      </div>
                    </div>
                    {getStatusBadge(vm.status)}
                  </div>
                </CardHeader>

                <CardContent className="pt-6 space-y-4">
                  {/* Specs */}
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">CPU</p>
                      <p className="font-medium">{vm.cpu}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">RAM</p>
                      <p className="font-medium">{vm.ram}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Storage</p>
                      <p className="font-medium">{vm.storage}</p>
                    </div>
                  </div>

                  {/* Connection Info */}
                  <div className="space-y-3 pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">IP Address</span>
                      <div className="flex items-center gap-2">
                        <code className="text-sm bg-muted px-2 py-1 rounded">{vm.ipAddress}</code>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(vm.ipAddress, 'IP')}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Username</span>
                      <div className="flex items-center gap-2">
                        <code className="text-sm bg-muted px-2 py-1 rounded">{vm.username}</code>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(vm.username, 'Username')}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Password</span>
                      <div className="flex items-center gap-2">
                        <code className="text-sm bg-muted px-2 py-1 rounded">••••••••</code>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(vm.password, 'Senha')}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-4">
                    <Button className="flex-1" size="sm">
                      <Terminal className="h-4 w-4 mr-2" />
                      Acessar Console
                    </Button>
                    <Button variant="outline" size="sm">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Expiration */}
                  <div className="text-xs text-muted-foreground text-center pt-2 border-t">
                    Expira em: {new Date(vm.expiresAt).toLocaleDateString('pt-BR')}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
