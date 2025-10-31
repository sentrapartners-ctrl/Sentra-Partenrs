import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Users, TrendingUp, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { formatPrice } from "@/lib/formatPrice";

interface ProviderEarning {
  provider_id: number;
  provider_name: string;
  master_account_number: string;
  total_earnings: number;
  pending_earnings: number;
  paid_earnings: number;
  active_subscribers: number;
  wallet_address: string | null;
  wallet_network: string | null;
}

interface Commission {
  id: number;
  provider_id: number;
  provider_name: string;
  amount: number;
  platform_fee: number;
  provider_earnings: number;
  status: string;
  subscriber_username: string;
  created_at: string;
  paid_at: string | null;
}

export default function AdminProviderEarnings() {
  const [providers, setProviders] = useState<ProviderEarning[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPending: 0,
    totalPaid: 0,
    totalProviders: 0,
    totalSubscribers: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Buscar todos os earnings dos provedores
      const earningsRes = await fetch("/api/admin/provider-earnings");
      const earningsData = await earningsRes.json();
      
      if (earningsData.success) {
        setProviders(earningsData.providers || []);
        setStats(earningsData.stats || stats);
      }

      // Buscar todas as comissões
      const commissionsRes = await fetch("/api/admin/provider-commissions");
      const commissionsData = await commissionsRes.json();
      
      if (commissionsData.success) {
        setCommissions(commissionsData.commissions || []);
      }
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsPaid = async (commissionId: number) => {
    try {
      const res = await fetch(`/api/admin/provider-commissions/${commissionId}/mark-paid`, {
        method: "POST"
      });
      
      const data = await res.json();
      
      if (data.success) {
        fetchData(); // Recarregar dados
      } else {
        alert("Erro ao marcar como pago: " + data.error);
      }
    } catch (error) {
      console.error("Erro ao marcar como pago:", error);
      alert("Erro ao marcar como pago");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cards de Estatísticas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pendente</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {formatPrice(stats.totalPending)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Aguardando pagamento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pago</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatPrice(stats.totalPaid)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Pagamentos realizados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Provedores Ativos</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProviders}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Com earnings pendentes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assinantes Totais</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSubscribers}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Gerando comissões
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Provedores */}
      <Card>
        <CardHeader>
          <CardTitle>Earnings por Provedor</CardTitle>
          <CardDescription>
            Resumo de comissões de cada provedor de sinais
          </CardDescription>
        </CardHeader>
        <CardContent>
          {providers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum provedor com earnings no momento
            </div>
          ) : (
            <div className="space-y-4">
              {providers.map((provider) => (
                <div
                  key={provider.provider_id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{provider.provider_name}</h3>
                      <Badge variant="outline" className="text-xs">
                        {provider.master_account_number}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {provider.active_subscribers} assinantes
                      </span>
                      {provider.wallet_address && (
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3 text-green-500" />
                          Carteira configurada ({provider.wallet_network})
                        </span>
                      )}
                      {!provider.wallet_address && (
                        <span className="flex items-center gap-1">
                          <AlertCircle className="h-3 w-3 text-yellow-500" />
                          Sem carteira configurada
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <div className="text-sm text-muted-foreground">Total</div>
                    <div className="text-lg font-bold">
                      {formatPrice(provider.total_earnings)}
                    </div>
                    <div className="flex gap-2 text-xs">
                      <span className="text-yellow-600">
                        Pendente: {formatPrice(provider.pending_earnings)}
                      </span>
                      <span className="text-green-600">
                        Pago: {formatPrice(provider.paid_earnings)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lista de Comissões Pendentes */}
      <Card>
        <CardHeader>
          <CardTitle>Comissões Pendentes</CardTitle>
          <CardDescription>
            Comissões aguardando pagamento aos provedores
          </CardDescription>
        </CardHeader>
        <CardContent>
          {commissions.filter(c => c.status === 'pending').length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma comissão pendente
            </div>
          ) : (
            <div className="space-y-2">
              {commissions
                .filter(c => c.status === 'pending')
                .map((commission) => (
                  <div
                    key={commission.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="font-medium">{commission.provider_name}</div>
                      <div className="text-sm text-muted-foreground">
                        Assinante: {commission.subscriber_username} • {new Date(commission.created_at).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="font-semibold text-green-600">
                          {formatPrice(commission.provider_earnings)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Taxa: {formatPrice(commission.platform_fee)}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleMarkAsPaid(commission.id)}
                      >
                        Marcar como Pago
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Histórico de Pagamentos */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Pagamentos</CardTitle>
          <CardDescription>
            Últimas comissões pagas aos provedores
          </CardDescription>
        </CardHeader>
        <CardContent>
          {commissions.filter(c => c.status === 'paid').length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum pagamento realizado ainda
            </div>
          ) : (
            <div className="space-y-2">
              {commissions
                .filter(c => c.status === 'paid')
                .slice(0, 10)
                .map((commission) => (
                  <div
                    key={commission.id}
                    className="flex items-center justify-between p-3 border rounded-lg bg-green-50 dark:bg-green-950/20"
                  >
                    <div className="flex-1">
                      <div className="font-medium">{commission.provider_name}</div>
                      <div className="text-sm text-muted-foreground">
                        Assinante: {commission.subscriber_username} • Pago em {commission.paid_at ? new Date(commission.paid_at).toLocaleDateString('pt-BR') : '-'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-green-600">
                        {formatPrice(commission.provider_earnings)}
                      </div>
                      <Badge variant="outline" className="text-xs mt-1">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Pago
                      </Badge>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
