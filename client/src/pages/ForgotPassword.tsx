import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { ArrowLeft } from "lucide-react";

export default function ForgotPassword() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const requestResetMutation = trpc.passwordReset.requestReset.useMutation({
    onSuccess: () => {
      setSubmitted(true);
    },
    onError: (error) => {
      alert(`Erro: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    requestResetMutation.mutate({ email });
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Email Enviado!</CardTitle>
            <CardDescription>
              Se o email {email} estiver cadastrado, você receberá um link para redefinir sua senha.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Verifique sua caixa de entrada e spam. O link expira em 1 hora.
            </p>
            <Button
              onClick={() => setLocation("/login")}
              variant="outline"
              className="w-full"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar para Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Esqueci minha senha</CardTitle>
          <CardDescription>
            Digite seu email para receber um link de redefinição de senha
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={requestResetMutation.isLoading}
            >
              {requestResetMutation.isLoading ? "Enviando..." : "Enviar Link de Redefinição"}
            </Button>

            <Button
              type="button"
              onClick={() => setLocation("/login")}
              variant="ghost"
              className="w-full"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar para Login
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

