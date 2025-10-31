import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, X } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";

interface SubscriptionWarningBannerProps {
  hasActiveSubscription: boolean;
  hasManualPermissions?: boolean;
}

export function SubscriptionWarningBanner({ 
  hasActiveSubscription, 
  hasManualPermissions 
}: SubscriptionWarningBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const [, setLocation] = useLocation();

  // Não mostrar se:
  // - Tem assinatura ativa
  // - Tem permissões manuais
  // - Foi fechado
  if (hasActiveSubscription || hasManualPermissions || dismissed) {
    return null;
  }

  return (
    <Alert variant="destructive" className="mb-6 relative">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <div className="flex-1">
          <strong>Sem assinatura ativa.</strong> Você precisa de uma assinatura para acessar todas as funcionalidades da plataforma.
        </div>
        <div className="flex items-center gap-2 ml-4">
          <Button
            size="sm"
            variant="outline"
            className="bg-white text-red-600 hover:bg-red-50"
            onClick={() => setLocation("/subscriptions")}
          >
            Ver Planos
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-white hover:bg-red-600"
            onClick={() => setDismissed(true)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
