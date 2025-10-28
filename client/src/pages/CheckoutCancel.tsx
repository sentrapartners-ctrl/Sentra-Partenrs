import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XCircle } from "lucide-react";

export default function CheckoutCancel() {
  return (
    <div className="container mx-auto py-16 max-w-2xl">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
            <XCircle className="h-10 w-10 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle className="text-2xl">Pagamento Cancelado</CardTitle>
          <CardDescription>
            Seu pagamento foi cancelado. Nenhuma cobrança foi realizada.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm text-center text-muted-foreground">
              Se você teve algum problema durante o checkout, entre em contato com nosso suporte.
            </p>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" asChild>
              <Link to="/marketplace/eas">Voltar ao Marketplace</Link>
            </Button>
            <Button className="flex-1" asChild>
              <Link to="/dashboard">Ir para Dashboard</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

