import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Server, 
  Plus, 
  Settings, 
  TrendingUp, 
  DollarSign,
  Activity,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react";
import { useState } from "react";

export default function VPS() {
  const { user, isAuthenticated, loading } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

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
            Faça login para gerenciar VPS
          </p>
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
            <h1 className="text-3xl font-bold">VPS Management</h1>
            <p className="text-muted-foreground">
              Gerencie VPS para seus clientes com white label completo
            </p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nova Solicitação VPS
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">VPS Ativos</CardTitle>
              <Server className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                0 solicitações pendentes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Custo Mensal</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$0.00</div>
              <p className="text-xs text-muted-foreground">
                Paga só o que usa
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita Mensal</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$0.00</div>
              <p className="text-xs text-muted-foreground">
                0% margem
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Lucro Mensal</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">$0.00</div>
              <p className="text-xs text-muted-foreground">
                0% ROI
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="requests">Solicitações</TabsTrigger>
            <TabsTrigger value="active">VPS Ativos</TabsTrigger>
            <TabsTrigger value="settings">Configurações</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Bem-vindo ao VPS Management</CardTitle>
                <CardDescription>
                  Ofereça VPS white label para seus clientes de trading
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <h3 className="font-semibold">✅ FxSVPS.com (Escolhido)</h3>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• 50% desconto reseller</li>
                      <li>• A partir de $2/mês (custo)</li>
                      <li>• Margens de 100%+</li>
                      <li>• WHMCS integration</li>
                      <li>• Setup automático</li>
                      <li>• Múltiplas localizações</li>
                      <li>• Desde 2012</li>
                      <li>• Suporte 24/7</li>
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-semibold">💡 Modelo de Negócio</h3>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Você paga: $2-10/mês por VPS</li>
                      <li>• Você cobra: $20-80/mês</li>
                      <li>• Margem: 300-800%</li>
                      <li>• Sem custo inicial</li>
                      <li>• Cancela quando quiser</li>
                      <li>• White label completo</li>
                    </ul>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h3 className="font-semibold mb-2">Como Funciona (FxSVPS):</h3>
                  <ol className="text-sm text-muted-foreground space-y-2">
                    <li>1. Cliente solicita VPS através do seu site</li>
                    <li>2. Sistema cria VPS automaticamente via API</li>
                    <li>3. Cliente recebe credenciais com sua marca</li>
                    <li>4. Você paga FxSVPS (ex: $5/mês)</li>
                    <li>5. Você cobra do cliente (ex: $40/mês)</li>
                    <li>6. Lucro: $35/mês por VPS</li>
                  </ol>
                </div>

                <div className="flex gap-2">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Solicitar Primeiro VPS
                  </Button>
                  <Button variant="outline">
                    <Settings className="mr-2 h-4 w-4" />
                    Configurar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Requests Tab */}
          <TabsContent value="requests" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Solicitações de VPS</CardTitle>
                <CardDescription>
                  Aprove ou rejeite solicitações de VPS dos seus clientes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Nenhuma solicitação pendente
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Quando clientes solicitarem VPS, elas aparecerão aqui
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Active VPS Tab */}
          <TabsContent value="active" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>VPS Ativos</CardTitle>
                <CardDescription>
                  Lista de todos os VPS ativos e suas informações
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Server className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Nenhum VPS ativo
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Crie sua primeira solicitação de VPS para começar
                  </p>
                  <Button className="mt-4">
                    <Plus className="mr-2 h-4 w-4" />
                    Nova Solicitação
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Configurações de VPS</CardTitle>
                <CardDescription>
                  Configure como os VPS serão oferecidos aos seus clientes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Provedor Preferido</h3>
                    <div className="grid gap-2">
                      <label className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-accent">
                        <input type="radio" name="provider" value="fxsvps" defaultChecked />
                        <div className="flex-1">
                          <div className="font-medium">FxSVPS.com</div>
                          <div className="text-sm text-muted-foreground">
                            50% desconto reseller • A partir de $2/mês • Margens de 100%+
                          </div>
                        </div>
                        <Badge>Escolhido</Badge>
                      </label>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Aprovação Automática</h3>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" />
                      <span className="text-sm">
                        Aprovar automaticamente solicitações que atendem aos requisitos
                      </span>
                    </label>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Requisitos para VPS Grátis</h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="text-sm font-medium">Volume Mínimo (lotes/mês)</label>
                        <input 
                          type="number" 
                          defaultValue={10}
                          className="w-full mt-1 px-3 py-2 border rounded-md"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Fundos Mínimos ($)</label>
                        <input 
                          type="number" 
                          defaultValue={5000}
                          className="w-full mt-1 px-3 py-2 border rounded-md"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Datacenter Padrão</h3>
                    <select className="w-full px-3 py-2 border rounded-md">
                      <option value="ny">New York</option>
                      <option value="london">London</option>
                      <option value="tokyo">Tokyo</option>
                      <option value="frankfurt">Frankfurt</option>
                      <option value="singapore">Singapore</option>
                    </select>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Preços para Clientes</h3>
                    <div className="grid gap-4 md:grid-cols-3">
                      <div>
                        <label className="text-sm font-medium">Básico</label>
                        <input 
                          type="number" 
                          defaultValue={20}
                          className="w-full mt-1 px-3 py-2 border rounded-md"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Standard</label>
                        <input 
                          type="number" 
                          defaultValue={40}
                          className="w-full mt-1 px-3 py-2 border rounded-md"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Premium</label>
                        <input 
                          type="number" 
                          defaultValue={80}
                          className="w-full mt-1 px-3 py-2 border rounded-md"
                        />
                      </div>
                    </div>
                  </div>

                  <Button className="w-full">
                    Salvar Configurações
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
