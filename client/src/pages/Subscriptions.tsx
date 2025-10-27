import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Zap } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

interface Plan {
  id: string;
  name: string;
  slug: string;
  price: number;
  description: string;
  features: string[];
  icon: React.ReactNode;
  popular?: boolean;
  color: string;
}

const plans: Plan[] = [
  {
    id: "1",
    name: "Básico",
    slug: "basico",
    price: 49.00,
    description: "Plano ideal para iniciantes no trading",
    features: [
      "Dashboard completo",
      "Até 2 contas MT4/MT5",
      "Análises básicas",
      "Histórico de trades",
      "Suporte por email"
    ],
    icon: <Zap className="h-6 w-6" />,
    color: "from-blue-500 to-blue-600"
  },
  {
    id: "2",
    name: "Pro",
    slug: "pro",
    price: 99.00,
    description: "Para traders profissionais que precisam de copy trading",
    features: [
      "Tudo do plano Básico",
      "Até 5 contas MT4/MT5",
      "Copy Trading ilimitado",
      "Análises avançadas",
      "Alertas personalizados",
      "Suporte prioritário"
    ],
    icon: <Crown className="h-6 w-6" />,
    popular: true,
    color: "from-green-500 to-green-600"
  },
  {
    id: "3",
    name: "Premium",
    slug: "premium",
    price: 199.00,
    description: "Plano completo com VPS grátis e todos os recursos",
    features: [
      "Tudo do plano Pro",
      "Contas ilimitadas",
      "VPS GRÁTIS (2GB RAM)",
      "Copy Trading avançado",
      "API de integração",
      "Suporte VIP 24/7",
      "Consultoria mensal"
    ],
    icon: <Crown className="h-6 w-6" />,
    color: "from-purple-500 to-purple-600"
  }
];

export default function Subscriptions() {
  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Escolha seu Plano</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Selecione o plano ideal para suas necessidades de trading. Todos os planos incluem acesso completo ao dashboard.
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <Card 
              key={plan.id} 
              className={`relative overflow-hidden ${plan.popular ? 'border-primary shadow-2xl scale-105' : ''}`}
            >
              {plan.popular && (
                <div className="absolute top-0 right-0">
                  <Badge className="rounded-none rounded-bl-lg">Mais Popular</Badge>
                </div>
              )}

              <CardHeader>
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${plan.color} flex items-center justify-center text-white mb-4`}>
                  {plan.icon}
                </div>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription className="text-sm mt-2">
                  {plan.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Price */}
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold">R$ {plan.price.toFixed(2)}</span>
                    <span className="text-muted-foreground">/ mês</span>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    R$ {plan.price.toFixed(2)}/mês
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-3">
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>

              <CardFooter>
                <Button 
                  className="w-full" 
                  variant={plan.popular ? "default" : "outline"}
                  size="lg"
                >
                  Assinar Agora
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* FAQ */}
        <div className="mt-16 max-w-3xl mx-auto space-y-8">
          <h2 className="text-3xl font-bold text-center mb-8">Perguntas Frequentes</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">O que acontece após o período de assinatura?</h3>
              <p className="text-muted-foreground">
                Sua assinatura será renovada automaticamente no final do período mensal, a menos que você cancele antes.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Posso mudar de plano depois?</h3>
              <p className="text-muted-foreground">
                Sim! Você pode fazer upgrade ou downgrade do seu plano a qualquer momento. O valor será ajustado proporcionalmente.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">A VPS grátis do plano Premium é permanente?</h3>
              <p className="text-muted-foreground">
                Sim! Enquanto você mantiver sua assinatura Premium ativa, a VPS de 2GB RAM continuará gratuita.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Quais formas de pagamento são aceitas?</h3>
              <p className="text-muted-foreground">
                Aceitamos pagamentos via criptomoedas: Bitcoin (BTC), USDT (Ethereum e Polygon), Polygon (MATIC) e Ethereum (ETH). 
                O pagamento é processado automaticamente após confirmação na blockchain.
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

