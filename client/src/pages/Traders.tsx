import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Star,
  Search,
  Filter,
  CheckCircle2
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { formatPrice, toNumber, formatProfit } from "@/lib/formatPrice";

interface Provider {
  id: number;
  provider_name: string;
  description: string;
  master_account_number: string;
  subscription_fee: number;
  currency: string;
  total_trades: number;
  win_rate: number;
  total_profit: number;
  max_drawdown: number;
  active_subscribers: number;
  avg_rating: number;
  review_count: number;
  isCentAccount?: boolean;
}

interface SlaveAccount {
  accountId: string;
  accountName: string;
  status: 'online' | 'offline';
}

export default function Traders() {
  const { isAuthenticated, user } = useAuth();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [filteredProviders, setFilteredProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('subscribers');
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [isSubscribeDialogOpen, setIsSubscribeDialogOpen] = useState(false);
  const [slaveAccounts, setSlaveAccounts] = useState<SlaveAccount[]>([]);
  const [selectedSlaveAccount, setSelectedSlaveAccount] = useState('');
  const [subscribeSuccess, setSubscribeSuccess] = useState(false);

  useEffect(() => {
    fetchProviders();
    if (user) {
      fetchSlaveAccounts();
    }
  }, [user]);

  useEffect(() => {
    filterAndSortProviders();
  }, [providers, searchTerm, sortBy]);

  const fetchProviders = async () => {
    try {
      const response = await fetch(`/api/signal-providers?sort=${sortBy}`);
      const data = await response.json();
      if (data.success) {
        setProviders(data.providers);
      }
    } catch (error) {
      console.error('Erro ao buscar provedores:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSlaveAccounts = async () => {
    try {
      const response = await fetch(`/api/mt/copy/connected-accounts?email=${encodeURIComponent(user?.email || '')}`);
      const data = await response.json();
      if (data.success) {
        // Aceitar contas slave e regular (excluir apenas master)
        const availableAccounts = data.accounts.filter((acc: any) => acc.type !== 'master');
        setSlaveAccounts(availableAccounts);
      }
    } catch (error) {
      console.error('Erro ao buscar contas disponíveis:', error);
    }
  };

  const filterAndSortProviders = () => {
    let filtered = [...providers];

    // Filtrar por busca
    if (searchTerm) {
      filtered = filtered.filter(p =>
        p.provider_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Ordenar
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'subscribers':
          return (b.active_subscribers || 0) - (a.active_subscribers || 0);
        case 'winrate':
          return (b.win_rate || 0) - (a.win_rate || 0);
        case 'profit':
          return (b.total_profit || 0) - (a.total_profit || 0);
        case 'rating':
          return (b.avg_rating || 0) - (a.avg_rating || 0);
        default:
          return 0;
      }
    });

    setFilteredProviders(filtered);
  };

  const handleSubscribe = (provider: Provider) => {
    setSelectedProvider(provider);
    setIsSubscribeDialogOpen(true);
    setSubscribeSuccess(false);
  };

  const confirmSubscribe = async () => {
    if (!selectedProvider || !selectedSlaveAccount) return;

    try {
      const response = await fetch(`/api/signal-providers/${selectedProvider.id}/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriber_user_id: user?.id,
          slave_account_number: selectedSlaveAccount
        })
      });

      const data = await response.json();
      if (data.success) {
        setSubscribeSuccess(true);
        setTimeout(() => {
          setIsSubscribeDialogOpen(false);
          setSelectedSlaveAccount('');
        }, 2000);
      }
    } catch (error) {
      console.error('Erro ao assinar provedor:', error);
    }
  };

  if (!isAuthenticated) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">
            Faça login para ver traders disponíveis
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Marketplace de Traders</h1>
          <p className="text-muted-foreground">
            Descubra e siga traders profissionais para copiar suas operações
          </p>
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar traders..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <select
                  className="p-2 border rounded-md"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="subscribers">Mais Seguidos</option>
                  <option value="winrate">Melhor Win Rate</option>
                  <option value="profit">Maior Lucro</option>
                  <option value="rating">Melhor Avaliação</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Traders */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Carregando traders...</p>
          </div>
        ) : filteredProviders.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center h-64">
              <p className="text-muted-foreground">Nenhum trader encontrado</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredProviders.map((provider) => (
              <Card key={provider.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="text-lg">{provider.provider_name}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {provider.description}
                      </CardDescription>
                    </div>
                    {provider.avg_rating > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        <Star className="h-3 w-3 mr-1 fill-yellow-400 text-yellow-400" />
                        {toNumber(provider.avg_rating).toFixed(1)}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Estatísticas */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Users className="h-3 w-3 mr-1" />
                        Seguidores
                      </div>
                      <p className="text-lg font-bold">{provider.active_subscribers || 0}</p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center text-xs text-muted-foreground">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        Win Rate
                      </div>
                      <p className="text-lg font-bold text-green-600">
                        {toNumber(provider.win_rate).toFixed(1)}%
                      </p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center text-xs text-muted-foreground">
                        <DollarSign className="h-3 w-3 mr-1" />
                        Lucro Total
                      </div>
                      <p className="text-lg font-bold text-green-600">
                        ${formatProfit(provider.total_profit, provider.isCentAccount || false)}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center text-xs text-muted-foreground">
                        <DollarSign className="h-3 w-3 mr-1" />
                        Drawdown
                      </div>
                      <p className="text-lg font-bold text-red-600">
                        {toNumber(provider.max_drawdown).toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  {/* Taxa */}
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div>
                      <p className="text-sm text-muted-foreground">Taxa</p>
                      <p className="font-bold">
                        {provider.subscription_fee > 0
                          ? `${provider.subscription_fee} ${provider.currency}/mês`
                          : 'Grátis'
                        }
                      </p>
                    </div>
                    <Button onClick={() => handleSubscribe(provider)}>
                      Seguir
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Dialog de Assinatura */}
        <Dialog open={isSubscribeDialogOpen} onOpenChange={setIsSubscribeDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Seguir {selectedProvider?.provider_name}</DialogTitle>
              <DialogDescription>
                Selecione a conta Slave que irá copiar os sinais deste trader
              </DialogDescription>
            </DialogHeader>

            {subscribeSuccess ? (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Assinatura realizada com sucesso! Sua conta Slave começará a copiar os sinais automaticamente.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Conta Slave</Label>
                  <select
                    className="w-full p-2 border rounded-md"
                    value={selectedSlaveAccount}
                    onChange={(e) => setSelectedSlaveAccount(e.target.value)}
                  >
                    <option value="">Selecione uma conta</option>
                    {slaveAccounts.map((acc) => (
                      <option key={acc.accountId} value={acc.accountId}>
                        {acc.accountName} ({acc.status})
                      </option>
                    ))}
                  </select>
                </div>

                {selectedProvider && selectedProvider.subscription_fee > 0 && (
                  <Alert>
                    <DollarSign className="h-4 w-4" />
                    <AlertDescription>
                      Este trader cobra uma taxa de <strong>{selectedProvider.subscription_fee} {selectedProvider.currency}/mês</strong>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            {!subscribeSuccess && (
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsSubscribeDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={confirmSubscribe}
                  disabled={!selectedSlaveAccount}
                >
                  Confirmar Assinatura
                </Button>
              </DialogFooter>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
