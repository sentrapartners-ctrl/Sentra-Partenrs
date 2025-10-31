import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Zap, Loader2 } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { toast } from "sonner";
import { formatPrice } from "@/lib/formatPrice";

interface Plan {
  id: number;
  name: string;
  slug: string;
  price: number;
  features: string[];
  active: boolean;
}

export default function Subscriptions() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await fetch("/api/subscription-plans");
      if (response.ok) {
        const data = await response.json();
        setPlans(data.plans.filter((p: Plan) => p.active));
      }
    } catch (error) {
      console.error("Erro ao carregar planos:", error);
      toast.error("Erro ao carregar planos de assinatura");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubscribe = async (plan: Plan) => {
    setIsProcessing(true);

    try {
      const response = await fetch("/api/checkout/create-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          price_amount: plan.price,
          price_currency: "usd",
          order_description: `Sentra Partners - Assinatura ${plan.name}`,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.payment_url) {
          window.location.href = data.payment_url;
        }
      } else {
        toast.error("Erro ao processar pagamento");
      }
    } catch (error) {
      console.error("Erro ao criar pagamento:", error);
      toast.error("Erro ao processar pagamento");
    } finally {
      setIsProcessing(false);
    }
  };

  const getIcon = (index: number) => {
    const icons = [
      <Zap className="h-6 w-6" />,
      <Crown className="h-6 w-6" />,
      <Crown className="h-6 w-6" />
    ];
    return icons[index % icons.length];
  };

  const getColor = (index: number) => {
    const colors = [
      "from-blue-500 to-blue-600",
      "from-green-500 to-green-600",
      "from-purple-500 to-purple-600"
    ];
    return colors[index % colors.length];
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">Escolha seu Plano</h1>
          <p className="text-xl text-muted-foreground">
            Selecione o plano ideal para suas necessidades de trading
          </p>
        </div>

        {plans.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Nenhum plano disponível no momento.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((plan, index) => (
              <Card 
                key={plan.id} 
                className={`relative overflow-hidden ${index === 1 ? 'border-primary shadow-lg scale-105' : ''}`}
              >
                {index === 1 && (
                  <Badge className="absolute top-4 right-4 bg-primary">
                    Mais Popular
                  </Badge>
                )}

                <CardHeader>
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${getColor(index)} flex items-center justify-center text-white mb-4`}>
                    {getIcon(index)}
                  </div>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription>
                    <span className="text-3xl font-bold text-foreground">
                      R$ {formatPrice(plan.price)}
                    </span>
                    <span className="text-muted-foreground">/mês</span>
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    {plan.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>

                <CardFooter>
                  <Button 
                    className="w-full" 
                    size="lg"
                    onClick={() => handleSubscribe(plan)}
                    disabled={isProcessing}
                    variant={index === 1 ? "default" : "outline"}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processando...
                      </>
                    ) : (
                      "Assinar Agora"
                    )}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
