import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, Server, Bot, TrendingUp, Shield, Zap, BarChart3, Users, Clock, Award, ArrowRight, Star } from "lucide-react";
import { toast } from "sonner";
import { useLandingPageContent } from "@/hooks/useLandingPageContent";

export default function LandingPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { content, loading: contentLoading } = useLandingPageContent();

  const createPayment = async (planName: string, price: number) => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/checkout/create-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          price_amount: price,
          price_currency: "usd",
          order_description: `Sentra Partners - ${planName}`,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.payment_url) {
          window.location.href = data.payment_url;
        }
      } else {
        throw new Error("Erro ao criar pagamento");
      }
    } catch (error) {
      console.error("Erro:", error);
      toast.error("Erro ao processar. Tente novamente.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-50px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(50px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        .animate-fadeInUp {
          animation: fadeInUp 0.8s ease-out forwards;
        }
        
        .animate-fadeIn {
          animation: fadeIn 1s ease-out forwards;
        }
        
        .animate-slideInLeft {
          animation: slideInLeft 0.8s ease-out forwards;
        }
        
        .animate-slideInRight {
          animation: slideInRight 0.8s ease-out forwards;
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        
        .animate-pulse-slow {
          animation: pulse 2s ease-in-out infinite;
        }
        
        .hover-lift {
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        
        .hover-lift:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 40px rgba(10, 31, 68, 0.2);
        }
        
        .gradient-text {
          background: linear-gradient(135deg, #0A1F44 0%, #2C5282 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .gradient-bg {
          background: linear-gradient(135deg, #0A1F44 0%, #1E3A5F 50%, #2C5282 100%);
        }
        
        .gradient-bg-light {
          background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 50%, #bae6fd 100%);
        }
      `}</style>

      {/* Announcement Bar */}
      <div className="gradient-bg text-white text-center py-3 px-4 animate-fadeIn">
        <p className="text-sm">
          🚀 Copy Trading 3.0 está disponível na Sentra Partners. <span className="underline cursor-pointer hover:text-blue-200 transition">Confira aqui</span>
        </p>
      </div>

      {/* Header */}
      <header className="border-b sticky top-0 bg-white/95 backdrop-blur-sm z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold gradient-text">
              SENTRA PARTNERS
            </div>
            
            <nav className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-gray-700 hover:text-[#0A1F44] transition-all hover:scale-105">Recursos</a>
              <a href="#vps" className="text-gray-700 hover:text-[#0A1F44] transition-all hover:scale-105">VPS</a>
              <a href="#eas" className="text-gray-700 hover:text-[#0A1F44] transition-all hover:scale-105">Expert Advisors</a>
              <a href="#pricing" className="text-gray-700 hover:text-[#0A1F44] transition-all hover:scale-105">Preços</a>
            </nav>

            <div className="flex items-center gap-4">
              <Button variant="ghost" className="text-gray-700 hover:text-[#0A1F44] transition">Entrar</Button>
              <Button className="gradient-bg hover:opacity-90 transition-all hover:scale-105 shadow-lg">
                Começar Agora <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 overflow-hidden relative">
        <div className="absolute inset-0 gradient-bg-light opacity-50"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center max-w-7xl mx-auto">
            <div className="animate-slideInLeft">
              <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
                {content.hero?.title}{" "}
                <span className="gradient-text">{content.hero?.highlight}</span>
              </h1>

              <p className="text-lg text-gray-700 mb-8">
                {content.hero?.subtitle}
              </p>

              <Button 
                size="lg" 
                className="gradient-bg hover:opacity-90 text-lg px-8 py-6 mb-8 shadow-xl hover:shadow-2xl transition-all hover:scale-105"
                onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Começar Agora
              </Button>

              <div className="flex items-center gap-2 mb-6">
                <div className="flex">
                  {[1,2,3,4,5].map((i) => (
                    <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <span className="font-semibold">4.8</span>
                <span className="text-gray-600">600+ Avaliações</span>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-2">Confiado por:</p>
                <div className="flex items-center gap-4">
                  {[1,2,3,4,5].map((i) => (
                    <div key={i} className="h-10 w-10 bg-gradient-to-br from-[#0A1F44] to-[#2C5282] rounded-full animate-pulse-slow" style={{ animationDelay: `${i * 0.2}s` }}></div>
                  ))}
                </div>
              </div>
            </div>

            <div className="relative animate-slideInRight">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl gradient-bg p-8 hover-lift animate-float">
                <div className="bg-white rounded-lg p-6">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 hover-lift">
                      <div className="text-2xl font-bold text-green-600">+$127K</div>
                      <div className="text-sm text-gray-600">Lucro Total</div>
                    </div>
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 hover-lift">
                      <div className="text-2xl font-bold text-blue-600">2,847</div>
                      <div className="text-sm text-gray-600">Trades</div>
                    </div>
                    <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4 hover-lift">
                      <div className="text-2xl font-bold text-yellow-600">73%</div>
                      <div className="text-sm text-gray-600">Win Rate</div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 hover-lift">
                      <div className="text-2xl font-bold text-purple-600">1.8</div>
                      <div className="text-sm text-gray-600">Profit Factor</div>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-2">Atividade Recente</div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>EURUSD</span>
                        <span className="text-green-600 font-semibold">+$234</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>GBPUSD</span>
                        <span className="text-green-600 font-semibold">+$156</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gradient-to-r from-gray-50 to-blue-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto text-center">
            {[
              { value: "1.2B+", label: "Trades Registrados" },
              { value: "50K+", label: "Sessões Backtestadas" },
              { value: "2.5M+", label: "Trades Compartilhados" },
              { value: "12K+", label: "Traders Ativos" },
            ].map((stat, i) => (
              <div key={i} className="animate-fadeInUp hover-lift" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="text-4xl md:text-5xl font-bold gradient-text mb-2">{stat.value}</div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature 1 - Copy Trading */}
      <section id="features" className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-4 animate-fadeInUp">
              <span className="inline-block bg-gradient-to-r from-[#0A1F44]/10 to-blue-100 px-4 py-2 rounded-full text-sm font-semibold text-[#0A1F44]">
                COPY TRADING AUTOMATIZADO
              </span>
            </div>
            
            <h2 className="text-4xl md:text-5xl font-bold text-center mb-6 animate-fadeInUp">
              Copy Trading Poderoso<br />e Automatizado
            </h2>
            
            <p className="text-xl text-center text-gray-600 mb-12 max-w-3xl mx-auto animate-fadeInUp">
              Você foca em operar enquanto nós focamos em te ajudar a melhorar. Com copy trading automatizado, fazemos o trabalho pesado por você.
            </p>

            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="gradient-bg rounded-2xl p-8 h-96 flex items-center justify-center hover-lift animate-slideInLeft shadow-2xl">
                <div className="text-white text-center">
                  <Users className="h-24 w-24 mx-auto mb-4 animate-pulse-slow" />
                  <p className="text-lg">Dashboard de Copy Trading</p>
                </div>
              </div>

              <div className="space-y-6 animate-slideInRight">
                {[
                  { icon: CheckCircle2, title: "Configuração em minutos", desc: "Configure suas contas master e slave em poucos cliques" },
                  { icon: CheckCircle2, title: "Múltiplas contas slave", desc: "Copie trades para quantas contas quiser simultaneamente" },
                  { icon: CheckCircle2, title: "MT4 e MT5 suportados", desc: "Compatível com as principais plataformas de trading" },
                ].map((feature, i) => (
                  <div key={i} className="flex items-start gap-4 hover-lift" style={{ animationDelay: `${i * 0.1}s` }}>
                    <div className="h-12 w-12 gradient-bg rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg">
                      <feature.icon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                      <p className="text-gray-600">{feature.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature 2 - Analytics */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-white">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-4 animate-fadeInUp">
              <span className="inline-block bg-gradient-to-r from-[#0A1F44]/10 to-blue-100 px-4 py-2 rounded-full text-sm font-semibold text-[#0A1F44]">
                ANÁLISE DE TRADES
              </span>
            </div>
            
            <h2 className="text-4xl md:text-5xl font-bold text-center mb-6 animate-fadeInUp">
              Analise suas estatísticas de trading
            </h2>
            
            <p className="text-xl text-center text-gray-600 mb-12 max-w-3xl mx-auto animate-fadeInUp">
              Entenda quais erros você cometeu, se arriscou mais do que planejado e muito mais estatísticas específicas de cada trade.
            </p>

            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="order-2 md:order-1 space-y-6 animate-slideInLeft">
                {[
                  { icon: BarChart3, title: "Métricas detalhadas", desc: "Acompanhe win rate, profit factor, drawdown e muito mais" },
                  { icon: TrendingUp, title: "Histórico completo", desc: "Acesse todos os seus trades com filtros avançados" },
                  { icon: Clock, title: "Tempo real", desc: "Monitore suas operações em tempo real" },
                ].map((feature, i) => (
                  <div key={i} className="flex items-start gap-4 hover-lift">
                    <div className="h-12 w-12 gradient-bg rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg">
                      <feature.icon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                      <p className="text-gray-600">{feature.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="order-1 md:order-2 gradient-bg rounded-2xl p-8 h-96 flex items-center justify-center hover-lift animate-slideInRight shadow-2xl">
                <div className="text-white text-center">
                  <BarChart3 className="h-24 w-24 mx-auto mb-4 animate-pulse-slow" />
                  <p className="text-lg">Dashboard de Análise</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* VPS Section */}
      <section id="vps" className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-4 animate-fadeInUp">
              <span className="inline-block bg-gradient-to-r from-[#0A1F44]/10 to-blue-100 px-4 py-2 rounded-full text-sm font-semibold text-[#0A1F44]">
                <Server className="inline h-4 w-4 mr-2" />
                HOSPEDAGEM VPS
              </span>
            </div>
            
            <h2 className="text-4xl md:text-5xl font-bold text-center mb-6 animate-fadeInUp">
              Servidores VPS de Alta Performance
            </h2>
            
            <p className="text-xl text-center text-gray-600 mb-12 max-w-3xl mx-auto animate-fadeInUp">
              Execute seus EAs e Copy Trading 24/7 com latência ultra-baixa e garantia de uptime de 99.9%.
            </p>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                { name: "VPS Starter", price: 15, features: ["2 GB RAM", "1 vCPU", "30 GB SSD", "Uptime 99.9%", "Windows Server"], popular: false },
                { name: "VPS Pro", price: 35, features: ["4 GB RAM", "2 vCPU", "60 GB SSD", "Uptime 99.9%", "Windows Server"], popular: true },
                { name: "VPS Enterprise", price: 75, features: ["8 GB RAM", "4 vCPU", "120 GB SSD", "Uptime 99.99%", "Windows Server"], popular: false },
              ].map((plan, i) => (
                <Card 
                  key={i} 
                  className={`relative hover-lift animate-fadeInUp ${plan.popular ? 'border-[#0A1F44] border-2 shadow-2xl scale-105' : 'shadow-xl'}`}
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <span className="gradient-bg text-white px-4 py-1 rounded-full text-sm font-semibold shadow-lg">
                        Mais Popular
                      </span>
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    <div className="mt-4">
                      <span className="text-5xl font-bold gradient-text">${plan.price}</span>
                      <span className="text-gray-600">/mês</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3 mb-6">
                      {plan.features.map((feature, j) => (
                        <li key={j} className="flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button 
                      className={`w-full ${plan.popular ? 'gradient-bg' : 'bg-[#0A1F44]'} hover:opacity-90 transition-all hover:scale-105 shadow-lg`}
                      onClick={() => createPayment(plan.name, plan.price)}
                      disabled={isLoading}
                    >
                      {isLoading ? "Processando..." : "Começar Agora"}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Expert Advisors Section */}
      <section id="eas" className="py-20 bg-gradient-to-br from-blue-50 to-white">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-4 animate-fadeInUp">
              <span className="inline-block bg-gradient-to-r from-[#0A1F44]/10 to-blue-100 px-4 py-2 rounded-full text-sm font-semibold text-[#0A1F44]">
                <Bot className="inline h-4 w-4 mr-2" />
                EXPERT ADVISORS
              </span>
            </div>
            
            <h2 className="text-4xl md:text-5xl font-bold text-center mb-6 animate-fadeInUp">
              Robôs de Trading Profissionais
            </h2>
            
            <p className="text-xl text-center text-gray-600 mb-12 max-w-3xl mx-auto animate-fadeInUp">
              EAs desenvolvidos e testados por traders experientes. Estratégias comprovadas com resultados consistentes.
            </p>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { name: "Scalper Pro", price: 199, winRate: "78%", timeframe: "M1, M5" },
                { name: "Trend Master", price: 249, winRate: "72%", timeframe: "H1, H4, D1" },
                { name: "Grid Trader", price: 179, winRate: "68%", timeframe: "H1, H4" },
                { name: "News Trader", price: 299, winRate: "75%", timeframe: "M5, M15" },
              ].map((ea, i) => (
                <Card key={i} className="hover-lift animate-fadeInUp shadow-xl" style={{ animationDelay: `${i * 0.1}s` }}>
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <div className="h-10 w-10 gradient-bg rounded-lg flex items-center justify-center shadow-lg">
                        <Bot className="h-5 w-5 text-white" />
                      </div>
                      <span className="text-2xl font-bold gradient-text">${ea.price}</span>
                    </div>
                    <CardTitle className="text-xl">{ea.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Win Rate:</span>
                        <span className="font-semibold text-green-600">{ea.winRate}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Timeframe:</span>
                        <span className="font-semibold">{ea.timeframe}</span>
                      </div>
                    </div>
                    <Button 
                      className="w-full gradient-bg hover:opacity-90 transition-all hover:scale-105 shadow-lg"
                      onClick={() => createPayment(ea.name, ea.price)}
                      disabled={isLoading}
                    >
                      {isLoading ? "Processando..." : "Começar Agora"}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-4 animate-fadeInUp">
              <span className="inline-block bg-gradient-to-r from-[#0A1F44]/10 to-blue-100 px-4 py-2 rounded-full text-sm font-semibold text-[#0A1F44]">
                PREÇOS
              </span>
            </div>
            
            <h2 className="text-4xl md:text-5xl font-bold text-center mb-6 animate-fadeInUp">
              Perfeito para todo tipo de trader
            </h2>
            
            <p className="text-xl text-center text-gray-600 mb-12 max-w-3xl mx-auto animate-fadeInUp">
              Escolha o plano que se encaixa no seu estilo de trading. Todos os planos incluem suporte 24/7 e atualizações regulares.
            </p>

            <div className="grid md:grid-cols-3 gap-8 mb-12">
              {[
                { name: "Básico", price: 47, features: ["Copy Trading (1 conta master)", "Dashboard básico", "Suporte por email", "Atualizações mensais"], popular: false },
                { name: "Profissional", price: 97, features: ["Copy Trading (ilimitado)", "Dashboard avançado", "Todos os EAs inclusos", "Suporte prioritário 24/7", "Análise de risco avançada"], popular: true },
                { name: "Enterprise", price: 197, features: ["Tudo do Profissional", "VPS Starter incluído", "Consultoria mensal 1h", "EA customizado", "API access"], popular: false },
              ].map((plan, i) => (
                <Card 
                  key={i} 
                  className={`hover-lift animate-fadeInUp ${plan.popular ? 'border-[#0A1F44] border-2 shadow-2xl scale-105' : 'shadow-xl'}`}
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <span className="gradient-bg text-white px-4 py-1 rounded-full text-sm font-semibold shadow-lg">
                        Recomendado
                      </span>
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    <div className="mt-4">
                      <span className="text-5xl font-bold gradient-text">${plan.price}</span>
                      <span className="text-gray-600">/mês</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3 mb-6">
                      {plan.features.map((feature, j) => (
                        <li key={j} className="flex items-start gap-2">
                          <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button 
                      className={`w-full ${plan.popular ? 'gradient-bg' : 'bg-[#0A1F44]'} hover:opacity-90 transition-all hover:scale-105 shadow-lg`}
                      size="lg"
                      onClick={() => createPayment(`Plano ${plan.name}`, plan.price)}
                      disabled={isLoading}
                    >
                      {isLoading ? "Processando..." : "Começar Agora"}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-20 gradient-bg text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 animate-fadeInUp">
            Pronto para Transformar Seu Trading?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto animate-fadeInUp">
            Junte-se a milhares de traders profissionais que já estão usando nossa plataforma
          </p>
          <Button 
            size="lg" 
            className="bg-white text-[#0A1F44] hover:bg-blue-50 text-lg px-8 shadow-2xl hover:scale-105 transition-all animate-fadeInUp"
            onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
          >
            Começar Agora
          </Button>
        </div>
      </section>

      {/* Signup Notification */}
      <div className="fixed bottom-4 left-4 bg-white shadow-2xl rounded-lg p-4 border border-gray-200 max-w-xs hover-lift animate-fadeIn z-50">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
          <p className="text-sm font-medium">
            ⚡️ 126 pessoas se inscreveram na Sentra Partners nas últimas 4 horas
          </p>
        </div>
      </div>
    </div>
  );
}

