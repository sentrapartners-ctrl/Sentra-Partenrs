import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Download, Mail, Loader2 } from "lucide-react";
import axios from "axios";

export default function CheckoutSuccess() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("order");
  
  const [loading, setLoading] = useState(true);
  const [orderStatus, setOrderStatus] = useState<any>(null);

  useEffect(() => {
    if (orderId) {
      checkOrderStatus();
      // Poll every 5 seconds
      const interval = setInterval(checkOrderStatus, 5000);
      return () => clearInterval(interval);
    }
  }, [orderId]);

  const checkOrderStatus = async () => {
    try {
      const response = await axios.get(`/api/checkout/status/${orderId}`);
      setOrderStatus(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error checking order status:", error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-16 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const isFinished = orderStatus?.status === "finished";
  const isDelivered = orderStatus?.delivered;

  return (
    <div className="container mx-auto py-16 max-w-2xl">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
            <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle className="text-2xl">
            {isFinished ? "Pagamento Confirmado!" : "Aguardando Confirmação"}
          </CardTitle>
          <CardDescription>
            {isFinished
              ? "Seu pagamento foi processado com sucesso"
              : "Aguardando confirmação da blockchain..."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-muted p-4 rounded-lg space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Pedido:</span>
              <span className="font-mono">{orderId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status:</span>
              <span className="font-semibold capitalize">{orderStatus?.status}</span>
            </div>
            {isDelivered && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Entregue:</span>
                <span className="text-green-600 font-semibold">✓ Sim</span>
              </div>
            )}
          </div>

          {isFinished && isDelivered && orderStatus?.deliveryData && (
            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg space-y-3">
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-blue-600" />
                <p className="font-semibold text-blue-900 dark:text-blue-100">
                  EA Enviado por Email
                </p>
              </div>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Seu Expert Advisor foi compilado e enviado para o email cadastrado.
                Verifique sua caixa de entrada (e spam).
              </p>
              {orderStatus.deliveryData.downloadUrl && (
                <Button className="w-full" asChild>
                  <a href={orderStatus.deliveryData.downloadUrl} download>
                    <Download className="mr-2 h-4 w-4" />
                    Baixar EA
                  </a>
                </Button>
              )}
            </div>
          )}

          {!isFinished && (
            <div className="bg-yellow-50 dark:bg-yellow-950 p-4 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                ⏳ Aguardando confirmações da blockchain. Isso pode levar alguns minutos.
                Esta página será atualizada automaticamente.
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" asChild>
              <Link to="/dashboard">Voltar ao Dashboard</Link>
            </Button>
            <Button className="flex-1" asChild>
              <Link to="/contas">Ver Minhas Contas</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

