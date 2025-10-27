import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, CheckCircle } from "lucide-react";

export default function ResetPassword() {
  const [, setLocation] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [success, setSuccess] = useState(false);

  const validateTokenQuery = trpc.passwordReset.validateToken.useQuery(
    { token: token || "" },
    { enabled: !!token }
  );

  const resetPasswordMutation = trpc.passwordReset.resetPassword.useMutation({
    onSuccess: () => {
      setSuccess(true);
      setTimeout(() => setLocation("/login"), 3000);
    },
    onError: (error) => {
      alert(`Erro: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      alert("As senhas não coincidem");
      return;
    }

    if (newPassword.length < 6) {
      alert("A senha deve ter pelo menos 6 caracteres");
      return;
    }

    resetPasswordMutation.mutate({
      token: token || "",
      newPassword,
    });
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Link Inválido</CardTitle>
            <CardDescription>
              O link de redefinição de senha é inválido ou está faltando.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setLocation("/login")} className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar para Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (validateTokenQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center">Validando token...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (validateTokenQuery.data && !validateTokenQuery.data.valid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Token Expirado</CardTitle>
            <CardDescription>
              Este link de redefinição expirou ou já foi usado.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Por favor, solicite um novo link de redefinição de senha.
            </p>
            <Button onClick={() => setLocation("/forgot-password")} className="w-full">
              Solicitar Novo Link
            </Button>
            <Button onClick={() => setLocation("/login")} variant="ghost" className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar para Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-green-500" />
              <CardTitle>Senha Redefinida!</CardTitle>
            </div>
            <CardDescription>
              Sua senha foi alterada com sucesso.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Você será redirecionado para a página de login em alguns segundos...
            </p>
            <Button onClick={() => setLocation("/login")} className="w-full">
              Ir para Login
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
          <CardTitle>Redefinir Senha</CardTitle>
          <CardDescription>
            Digite sua nova senha
            {validateTokenQuery.data?.email && ` para ${validateTokenQuery.data.email}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nova Senha</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Senha</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={resetPasswordMutation.isLoading}
            >
              {resetPasswordMutation.isLoading ? "Redefinindo..." : "Redefinir Senha"}
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

