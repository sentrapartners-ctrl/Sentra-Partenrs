import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Share2, 
  Eye, 
  EyeOff, 
  Users, 
  TrendingUp, 
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  Clock
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Provider {
  id: number;
  user_id: number;
  master_account_number: string;
  provider_name: string;
  description: string;
  is_public: boolean;
  is_active: boolean;
  subscription_fee: number;
  currency: string;
  total_subscribers?: number;
  active_subscribers?: number;
  win_rate?: number;
  total_profit?: number;
}

interface MasterAccount {
  accountId: string;
  accountName: string;
  status: 'online' | 'offline';
}

export default function SignalProviderSettings() {
  const { user } = useAuth();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [masterAccounts, setMasterAccounts] = useState<MasterAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    master_account_number: '',
    provider_name: '',
    description: '',
    is_public: true,
    subscription_fee: 0,
    currency: 'USD'
  });

  useEffect(() => {
    if (user) {
      fetchProviders();
      fetchMasterAccounts();
    }
  }, [user]);

  const fetchProviders = async () => {
    try {
      // Buscar provedores do usuário com filtro de user_id
      const response = await fetch(`/api/signal-providers?user_id=${user?.id}`);
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

  const fetchMasterAccounts = async () => {
    try {
      const response = await fetch(`/api/mt/copy/connected-accounts?email=${encodeURIComponent(user?.email || '')}`);
      const data = await response.json();
      console.log('[SignalProviderSettings] API Response:', data);
      if (data.success) {
        // Aceitar contas master e regular (excluir apenas slave)
        const availableAccounts = data.accounts.filter((acc: any) => acc.type !== 'slave');
        console.log('[SignalProviderSettings] Available accounts:', availableAccounts);
        setMasterAccounts(availableAccounts);
      }
    } catch (error) {
      console.error('Erro ao buscar contas disponíveis:', error);
    }
  };

  const handleCreateProvider = async () => {
    try {
      setIsCreating(true);
      setError(null);

      // Validação frontend
      if (!formData.master_account_number) {
        setError('Selecione uma conta Master');
        setIsCreating(false);
        return;
      }
      if (!formData.provider_name || formData.provider_name.trim() === '') {
        setError('Digite o nome do provedor');
        setIsCreating(false);
        return;
      }
      if (!user?.id) {
        setError('Usuário não autenticado');
        setIsCreating(false);
        return;
      }

      console.log('[SignalProvider] Criando provedor:', {
        user_id: user.id,
        master_account_number: formData.master_account_number,
        provider_name: formData.provider_name
      });
      
      const response = await fetch('/api/signal-providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          user_id: user?.id
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar provedor');
      }
      
      if (data.success) {
        await fetchProviders();
        setIsDialogOpen(false);
        setFormData({
          master_account_number: '',
          provider_name: '',
          description: '',
          is_public: true,
          subscription_fee: 0,
          currency: 'USD'
        });
      } else {
        throw new Error(data.error || 'Erro ao criar provedor');
      }
    } catch (error: any) {
      console.error('Erro ao criar provedor:', error);
      setError(error.message || 'Erro ao criar provedor. Tente novamente.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggleActive = async (providerId: number, currentStatus: boolean) => {
    try {
      await fetch(`/api/signal-providers/${providerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentStatus })
      });
      await fetchProviders();
    } catch (error) {
      console.error('Erro ao atualizar provedor:', error);
    }
  };

  const handleTogglePublic = async (providerId: number, currentStatus: boolean) => {
    try {
      console.log('[Frontend] Toggling public status:', { providerId, currentStatus, newStatus: !currentStatus });
      
      const response = await fetch(`/api/signal-providers/${providerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_public: !currentStatus })
      });
      
      const data = await response.json();
      console.log('[Frontend] Response from server:', data);
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao atualizar status público');
      }
      
      await fetchProviders();
    } catch (error) {
      console.error('[Frontend] Erro ao atualizar provedor:', error);
      alert('Erro ao atualizar status público. Verifique o console.');
    }
  };

  const handleDeleteProvider = async (providerId: number) => {
    if (!confirm('Tem certeza que deseja excluir este provedor? Esta ação não pode ser desfeita.')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/signal-providers/${providerId}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.success) {
        await fetchProviders();
      } else {
        alert(data.error || 'Erro ao excluir provedor');
      }
    } catch (error) {
      console.error('Erro ao excluir provedor:', error);
      alert('Erro ao excluir provedor. Tente novamente.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Compartilhar Sinais</h2>
          <p className="text-muted-foreground">
            Compartilhe seus sinais de trading com outros usuários
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Provedor
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Provedor de Sinais</DialogTitle>
              <DialogDescription>
                Configure sua conta Master para compartilhar sinais
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Conta Master</Label>
                <select
                  className="w-full p-2 border rounded-md"
                  value={formData.master_account_number}
                  onChange={(e) => setFormData({ ...formData, master_account_number: e.target.value })}
                >
                  <option value="">Selecione uma conta</option>
                  {masterAccounts.map((acc) => (
                    <option key={acc.accountId} value={acc.accountId}>
                      {acc.accountName} ({acc.status})
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Nome do Provedor</Label>
                <Input
                  placeholder="Ex: Estratégia Scalping EUR/USD"
                  value={formData.provider_name}
                  onChange={(e) => setFormData({ ...formData, provider_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea
                  placeholder="Descreva sua estratégia e resultados..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.is_public}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_public: checked })}
                />
                <Label>Público (visível no marketplace)</Label>
              </div>
              <div className="space-y-2">
                <Label>Taxa de Assinatura (opcional)</Label>
                <div className="flex space-x-2">
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={formData.subscription_fee}
                    onChange={(e) => setFormData({ ...formData, subscription_fee: parseFloat(e.target.value) || 0 })}
                  />
                  <select
                    className="p-2 border rounded-md"
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  >
                    <option value="USD">USD</option>
                    <option value="BRL">BRL</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>
              </div>
            </div>
            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isCreating}>
                Cancelar
              </Button>
              <Button onClick={handleCreateProvider} disabled={isCreating}>
                {isCreating ? 'Criando...' : 'Criar Provedor'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Info Alert */}
      {providers.length === 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Você ainda não está compartilhando sinais. Crie um provedor para permitir que outros usuários copiem suas operações.
          </AlertDescription>
        </Alert>
      )}

      {/* Lista de Provedores */}
      <div className="grid gap-4">
        {providers.map((provider) => (
          <Card key={provider.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <CardTitle>{provider.provider_name}</CardTitle>
                    {provider.is_active ? (
                      <Badge variant="default">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Ativo
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Inativo</Badge>
                    )}
                    {provider.is_public ? (
                      <Badge variant="outline">
                        <Eye className="h-3 w-3 mr-1" />
                        Público
                      </Badge>
                    ) : (
                      <Badge variant="outline">
                        <EyeOff className="h-3 w-3 mr-1" />
                        Privado
                      </Badge>
                    )}
                  </div>
                  <CardDescription>
                    Conta Master: {provider.master_account_number}
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={provider.is_active}
                    onCheckedChange={() => handleToggleActive(provider.id, provider.is_active)}
                  />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleTogglePublic(provider.id, provider.is_public)}>
                        {provider.is_public ? (
                          <>
                            <EyeOff className="mr-2 h-4 w-4" />
                            Tornar Privado
                          </>
                        ) : (
                          <>
                            <Eye className="mr-2 h-4 w-4" />
                            Tornar Público
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDeleteProvider(provider.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Excluir Provedor
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                {provider.description}
              </p>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Users className="h-4 w-4 mr-1" />
                    Assinantes
                  </div>
                  <p className="text-2xl font-bold">
                    {provider.active_subscribers || 0}
                  </p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    Win Rate
                  </div>
                  <p className="text-2xl font-bold">
                    {provider.win_rate ? parseFloat(provider.win_rate).toFixed(1) : 0}%
                  </p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <DollarSign className="h-4 w-4 mr-1" />
                    Lucro Total
                  </div>
                  <p className="text-2xl font-bold text-green-600">
                    ${provider.total_profit ? parseFloat(provider.total_profit).toFixed(2) : '0.00'}
                  </p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <DollarSign className="h-4 w-4 mr-1" />
                    Taxa
                  </div>
                  <p className="text-2xl font-bold">
                    {provider.subscription_fee > 0 
                      ? `${provider.subscription_fee} ${provider.currency}`
                      : 'Grátis'
                    }
                  </p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Clock className="h-4 w-4 mr-1" />
                    Último Trade
                  </div>
                  <p className="text-sm font-medium">
                    {provider.last_trade_at 
                      ? new Date(provider.last_trade_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
                      : 'Nenhum'
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
