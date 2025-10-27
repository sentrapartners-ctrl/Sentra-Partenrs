import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bot, TrendingUp, Grid3x3, Newspaper, Brain, Star, Download, Infinity, X } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface LicenseOption {
  duration: string;
  months: number | null; // null = vitalícia
  discount: number;
  label: string;
  badge?: string;
}

const licenseOptions: LicenseOption[] = [
  { duration: "1month", months: 1, discount: 0, label: "1 Mês" },
  { duration: "3months", months: 3, discount: 10, label: "3 Meses", badge: "10% OFF" },
  { duration: "6months", months: 6, discount: 20, label: "6 Meses", badge: "20% OFF" },
  { duration: "1year", months: 12, discount: 30, label: "1 Ano", badge: "30% OFF" },
  { duration: "lifetime", months: null, discount: 0, label: "Vitalícia", badge: "MELHOR VALOR" },
];

interface EAProduct {
  id: string;
  name: string;
  slug: string;
  monthlyPrice: number;
  lifetimePrice: number;
  description: string;
  platform: string;
  strategy: string;
  backtest: {
    period: string;
    profit: string;
    drawdown: string;
    winRate: string;
    trades: number;
  };
  features: string[];
  icon: React.ReactNode;
  exclusive?: boolean;
  downloads: number;
  rating: number;
}

const eaProducts: EAProduct[] = [
  {
    id: "1",
    name: "Scalper Pro EA",
    slug: "scalper-pro-ea",
    monthlyPrice: 99.00,
    lifetimePrice: 299.00,
    description: "Expert Advisor de scalping para operações rápidas",
    platform: "MT4 e MT5",
    strategy: "Scalping baseado em indicadores técnicos e análise de volume",
    backtest: {
      period: "2020-2024",
      profit: "287%",
      drawdown: "12%",
      winRate: "68%",
      trades: 1247
    },
    features: [
      "Scalping automático",
      "Gerenciamento de risco integrado",
      "Múltiplos timeframes",
      "Filtros de notícias",
      "Trailing stop avançado"
    ],
    icon: <TrendingUp className="h-6 w-6" />,
    downloads: 0,
    rating: 0
  },
  {
    id: "2",
    name: "Trend Master EA",
    slug: "trend-master-ea",
    monthlyPrice: 129.00,
    lifetimePrice: 399.00,
    description: "Robô seguidor de tendências de longo prazo",
    platform: "MT4 e MT5",
    strategy: "Seguidor de tendência com confirmação por múltiplos indicadores",
    backtest: {
      period: "2019-2024",
      profit: "412%",
      drawdown: "18%",
      winRate: "72%",
      trades: 856
    },
    features: [
      "Detecção automática de tendências",
      "Múltiplos pares simultâneos",
      "Stop loss dinâmico",
      "Take profit inteligente",
      "Alertas por Telegram"
    ],
    icon: <TrendingUp className="h-6 w-6" />,
    exclusive: true,
    downloads: 0,
    rating: 0
  },
  {
    id: "3",
    name: "Grid Trading EA",
    slug: "grid-trading-ea",
    monthlyPrice: 79.00,
    lifetimePrice: 249.00,
    description: "Sistema de grade para mercados laterais",
    platform: "MT5",
    strategy: "Sistema de grade com gerenciamento de risco avançado",
    backtest: {
      period: "2020-2024",
      profit: "198%",
      drawdown: "22%",
      winRate: "64%",
      trades: 2341
    },
    features: [
      "Grade configurável",
      "Proteção contra volatilidade",
      "Múltiplos níveis de entrada",
      "Auto-ajuste de parâmetros",
      "Suporte a hedging"
    ],
    icon: <Grid3x3 className="h-6 w-6" />,
    downloads: 0,
    rating: 0
  },
  {
    id: "4",
    name: "News Trader EA",
    slug: "news-trader-ea",
    monthlyPrice: 119.00,
    lifetimePrice: 349.00,
    description: "Especialista em trading de notícias econômicas",
    platform: "MT4",
    strategy: "Trading baseado em eventos econômicos de alto impacto",
    backtest: {
      period: "2021-2024",
      profit: "324%",
      drawdown: "15%",
      winRate: "71%",
      trades: 432
    },
    features: [
      "Calendário econômico integrado",
      "Filtro de impacto de notícias",
      "Entrada automática em eventos",
      "Proteção contra slippage",
      "Gerenciamento de volatilidade"
    ],
    icon: <Newspaper className="h-6 w-6" />,
    downloads: 0,
    rating: 0
  },
  {
    id: "5",
    name: "AI Predictor EA",
    slug: "ai-predictor-ea",
    monthlyPrice: 249.00,
    lifetimePrice: 799.00,
    description: "Robô com inteligência artificial e machine learning",
    platform: "MT4 e MT5",
    strategy: "Predição de mercado usando redes neurais e deep learning",
    backtest: {
      period: "2019-2024",
      profit: "567%",
      drawdown: "16%",
      winRate: "76%",
      trades: 1893
    },
    features: [
      "Machine Learning avançado",
      "Auto-otimização contínua",
      "Análise de sentimento de mercado",
      "Predição de reversões",
      "Adaptação a condições de mercado",
      "Suporte premium incluído"
    ],
    icon: <Brain className="h-6 w-6" />,
    exclusive: true,
    downloads: 0,
    rating: 0
  }
];

function calculatePrice(ea: EAProduct, license: LicenseOption): number {
  if (license.months === null) {
    return ea.lifetimePrice;
  }
  
  const basePrice = ea.monthlyPrice * license.months;
  const discount = basePrice * (license.discount / 100);
  return basePrice - discount;
}

export default function MarketplaceEAs() {
  const [selectedEA, setSelectedEA] = useState<EAProduct | null>(null);
  const [selectedLicense, setSelectedLicense] = useState<string>("lifetime");

  const handleBuyClick = (ea: EAProduct) => {
    setSelectedEA(ea);
  };

  const handleConfirmPurchase = () => {
    const license = licenseOptions.find(l => l.duration === selectedLicense)!;
    const price = calculatePrice(selectedEA!, license);
    
    console.log("Compra confirmada:", {
      ea: selectedEA?.name,
      license: license.label,
      price: price
    });
    
    // TODO: Redirecionar para checkout
    setSelectedEA(null);
  };

  const currentLicense = selectedEA ? licenseOptions.find(l => l.duration === selectedLicense)! : null;
  const currentPrice = selectedEA && currentLicense ? calculatePrice(selectedEA, currentLicense) : 0;

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-4">Expert Advisors</h1>
          <p className="text-xl text-muted-foreground max-w-3xl">
            Robôs de trading profissionais com estratégias comprovadas. Todos os EAs incluem backtests detalhados e suporte técnico.
          </p>
        </div>



        {/* EAs Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {eaProducts.map((ea) => (
            <Card key={ea.id} className="relative overflow-hidden hover:shadow-xl transition-all">
              {ea.exclusive && (
                <div className="absolute top-0 right-0">
                  <Badge className="rounded-none rounded-bl-lg bg-purple-600">Exclusivo</Badge>
                </div>
              )}

              <CardHeader>
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white">
                    {ea.icon}
                  </div>
                  <Badge variant="outline">{ea.platform}</Badge>
                </div>
                <CardTitle className="text-xl">{ea.name}</CardTitle>
                <CardDescription className="text-sm mt-2">
                  {ea.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Backtest Results */}
                <div className="p-3 bg-muted rounded-lg space-y-2">
                  <div className="text-xs font-medium text-muted-foreground">
                    Backtest {ea.backtest.period}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <div className="text-xs text-muted-foreground">Lucro</div>
                      <div className="font-bold text-green-600">{ea.backtest.profit}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Win Rate</div>
                      <div className="font-bold">{ea.backtest.winRate}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Drawdown</div>
                      <div className="font-bold text-red-600">{ea.backtest.drawdown}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Trades</div>
                      <div className="font-bold">{ea.backtest.trades}</div>
                    </div>
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-2">
                  <div className="text-sm font-medium">Recursos:</div>
                  <ul className="text-xs space-y-1">
                    {ea.features.slice(0, 3).map((feature, idx) => (
                      <li key={idx} className="text-muted-foreground">• {feature}</li>
                    ))}
                  </ul>
                </div>

                {/* Price Preview */}
                <div className="pt-2 border-t">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <div className="text-xs text-muted-foreground">A partir de</div>
                      <div className="text-2xl font-bold">R$ {ea.monthlyPrice.toFixed(2)}</div>
                      <div className="text-xs text-muted-foreground">/mês</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">Vitalícia</div>
                      <div className="text-lg font-bold text-green-600">R$ {ea.lifetimePrice.toFixed(2)}</div>
                    </div>
                  </div>
                </div>
              </CardContent>

              <CardFooter>
                <Button 
                  className="w-full" 
                  onClick={() => handleBuyClick(ea)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Comprar Agora
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* Purchase Dialog */}
        <Dialog open={!!selectedEA} onOpenChange={() => setSelectedEA(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle className="text-2xl">
                Comprar {selectedEA?.name}
              </DialogTitle>
              <DialogDescription>
                Escolha a duração da licença para seu Expert Advisor
              </DialogDescription>
            </DialogHeader>

            {selectedEA && (
              <div className="space-y-6 py-4">
                {/* License Options */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Escolha a Duração da Licença</h3>
                  <div className="grid grid-cols-5 gap-3">
                    {licenseOptions.map((license) => (
                      <button
                        key={license.duration}
                        onClick={() => setSelectedLicense(license.duration)}
                        className={`relative p-4 rounded-lg border-2 transition-all ${
                          selectedLicense === license.duration
                            ? "border-primary bg-primary/5 shadow-lg"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        {license.badge && (
                          <Badge className="absolute -top-2 -right-2 text-xs">
                            {license.badge}
                          </Badge>
                        )}
                        <div className="text-center">
                          {license.months === null ? (
                            <Infinity className="h-6 w-6 mx-auto mb-2" />
                          ) : (
                            <div className="text-2xl font-bold mb-1">{license.months}</div>
                          )}
                          <div className="text-xs font-medium">{license.label}</div>
                          {license.discount > 0 && (
                            <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                              -{license.discount}%
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price Summary */}
                <div className="p-6 bg-muted rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Licença selecionada</div>
                      <div className="text-xl font-bold">{currentLicense?.label}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">Total</div>
                      <div className="text-3xl font-bold">R$ {currentPrice.toFixed(2)}</div>
                    </div>
                  </div>

                  {currentLicense?.months && (
                    <div className="text-sm text-muted-foreground">
                      R$ {(currentPrice / currentLicense.months).toFixed(2)}/mês
                    </div>
                  )}

                  {currentLicense?.months === null && (
                    <div className="text-sm text-green-600 dark:text-green-400 font-medium">
                      ✓ Pagamento único - Acesso vitalício ao EA
                    </div>
                  )}

                  {currentLicense && currentLicense.discount > 0 && (
                    <div className="text-sm text-green-600 dark:text-green-400 mt-2">
                      Você economiza R$ {(selectedEA.monthlyPrice * currentLicense.months! * (currentLicense.discount / 100)).toFixed(2)}
                    </div>
                  )}
                </div>

                {/* EA Details */}
                <div className="space-y-3">
                  <h4 className="font-semibold">O que está incluído:</h4>
                  <ul className="space-y-2">
                    {selectedEA.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <Star className="h-4 w-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                    <li className="flex items-start gap-2 text-sm">
                      <Star className="h-4 w-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                      <span>Suporte técnico por email</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <Star className="h-4 w-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                      <span>Atualizações gratuitas durante o período da licença</span>
                    </li>
                    {currentLicense?.months === null && (
                      <li className="flex items-start gap-2 text-sm font-medium text-green-600">
                        <Star className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                        <span>Atualizações vitalícias incluídas</span>
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedEA(null)}>
                Cancelar
              </Button>
              <Button onClick={handleConfirmPurchase} size="lg">
                Confirmar Compra - R$ {currentPrice.toFixed(2)}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

