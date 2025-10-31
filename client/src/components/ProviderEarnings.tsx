import { useState, useEffect } from "react";
import { DollarSign, Wallet, TrendingUp, Users, Clock, CheckCircle2 } from "lucide-react";

interface Earnings {
  total: number;
  pending: number;
  paid: number;
  subscribers: number;
}

interface Wallet {
  wallet_address: string;
  network: string;
  currency: string;
  verified: boolean;
}

interface Commission {
  id: number;
  amount: number;
  platform_fee: number;
  provider_earnings: number;
  status: string;
  subscriber_username: string;
  created_at: string;
  paid_at: string | null;
}

export default function ProviderEarnings() {
  const [earnings, setEarnings] = useState<Earnings>({ total: 0, pending: 0, paid: 0, subscribers: 0 });
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [isProvider, setIsProvider] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Form de carteira
  const [walletForm, setWalletForm] = useState({
    wallet_address: "",
    network: "TRC20",
    currency: "USDT"
  });
  const [showWalletForm, setShowWalletForm] = useState(false);

  useEffect(() => {
    fetchEarnings();
  }, []);

  const fetchEarnings = async () => {
    try {
      const res = await fetch("/api/provider-earnings");
      const data = await res.json();
      
      if (data.success) {
        setIsProvider(data.isProvider);
        setEarnings(data.earnings);
        setWallet(data.wallet);
        setCommissions(data.commissions);
        
        if (data.wallet) {
          setWalletForm({
            wallet_address: data.wallet.wallet_address,
            network: data.wallet.network,
            currency: data.wallet.currency
          });
        }
      }
    } catch (error) {
      console.error("Erro ao buscar ganhos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const res = await fetch("/api/provider-earnings/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(walletForm)
      });
      
      const data = await res.json();
      
      if (data.success) {
        alert("Carteira cadastrada com sucesso!");
        setShowWalletForm(false);
        fetchEarnings();
      } else {
        alert(data.error || "Erro ao cadastrar carteira");
      }
    } catch (error) {
      console.error("Erro ao salvar carteira:", error);
      alert("Erro ao salvar carteira");
    }
  };

  if (loading) {
    return <div className="p-6 text-center">Carregando...</div>;
  }

  if (!isProvider) {
    return (
      <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-yellow-800">
          Você precisa ser um provedor de sinais para acessar esta página.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-lg shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Total de Ganhos</p>
              <p className="text-3xl font-bold mt-2">R$ {earnings.total.toFixed(2)}</p>
            </div>
            <DollarSign className="w-12 h-12 text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white p-6 rounded-lg shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100 text-sm">Pendente</p>
              <p className="text-3xl font-bold mt-2">R$ {earnings.pending.toFixed(2)}</p>
            </div>
            <Clock className="w-12 h-12 text-yellow-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-lg shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Já Pago</p>
              <p className="text-3xl font-bold mt-2">R$ {earnings.paid.toFixed(2)}</p>
            </div>
            <CheckCircle2 className="w-12 h-12 text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-lg shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Assinantes</p>
              <p className="text-3xl font-bold mt-2">{earnings.subscribers}</p>
            </div>
            <Users className="w-12 h-12 text-purple-200" />
          </div>
        </div>
      </div>

      {/* Carteira */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Wallet className="w-6 h-6" />
            Carteira para Recebimento
          </h2>
          <button
            onClick={() => setShowWalletForm(!showWalletForm)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {wallet ? "Editar Carteira" : "Cadastrar Carteira"}
          </button>
        </div>

        {wallet && !showWalletForm ? (
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Endereço</p>
                <p className="font-mono text-sm break-all">{wallet.wallet_address}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Rede</p>
                <p className="font-semibold">{wallet.network}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Moeda</p>
                <p className="font-semibold">{wallet.currency}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <p className={wallet.verified ? "text-green-600 font-semibold" : "text-yellow-600 font-semibold"}>
                  {wallet.verified ? "✓ Verificada" : "⏳ Aguardando verificação"}
                </p>
              </div>
            </div>
          </div>
        ) : showWalletForm ? (
          <form onSubmit={handleSaveWallet} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Endereço da Carteira</label>
              <input
                type="text"
                value={walletForm.wallet_address}
                onChange={(e) => setWalletForm({ ...walletForm, wallet_address: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="Seu endereço de carteira cripto"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Rede</label>
                <select
                  value={walletForm.network}
                  onChange={(e) => setWalletForm({ ...walletForm, network: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="TRC20">TRC20 (Tron)</option>
                  <option value="ERC20">ERC20 (Ethereum)</option>
                  <option value="BEP20">BEP20 (BSC)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Moeda</label>
                <select
                  value={walletForm.currency}
                  onChange={(e) => setWalletForm({ ...walletForm, currency: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="USDT">USDT</option>
                  <option value="USDC">USDC</option>
                  <option value="BTC">BTC</option>
                  <option value="ETH">ETH</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                Salvar Carteira
              </button>
              <button
                type="button"
                onClick={() => setShowWalletForm(false)}
                className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                Cancelar
              </button>
            </div>
          </form>
        ) : (
          <p className="text-gray-500 text-center py-8">
            Cadastre sua carteira para receber os repasses mensais
          </p>
        )}
      </div>

      {/* Histórico de Comissões */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <TrendingUp className="w-6 h-6" />
          Histórico de Comissões
        </h2>

        {commissions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Data</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Assinante</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">Valor Total</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">Taxa Plataforma (10%)</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">Seus Ganhos (90%)</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {commissions.map((commission) => (
                  <tr key={commission.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">
                      {new Date(commission.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-4 py-3 text-sm">{commission.subscriber_username}</td>
                    <td className="px-4 py-3 text-sm text-right">R$ {commission.amount.toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm text-right text-red-600">
                      -R$ {commission.platform_fee.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-semibold text-green-600">
                      R$ {commission.provider_earnings.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        commission.status === 'paid' 
                          ? 'bg-green-100 text-green-800' 
                          : commission.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {commission.status === 'paid' ? 'Pago' : commission.status === 'pending' ? 'Pendente' : 'Cancelado'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">
            Nenhuma comissão registrada ainda
          </p>
        )}
      </div>

      {/* Informações */}
      <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">ℹ️ Como funciona</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Você recebe 90% do valor de cada assinatura</li>
          <li>• A plataforma retém 10% como taxa de serviço</li>
          <li>• Repasses são feitos mensalmente via cripto</li>
          <li>• Cadastre sua carteira para receber os pagamentos</li>
          <li>• Valores pendentes serão pagos no próximo ciclo</li>
        </ul>
      </div>
    </div>
  );
}
