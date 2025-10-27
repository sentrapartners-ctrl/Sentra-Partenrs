import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, Loader2 } from "lucide-react";

declare global {
  interface Window {
    ethereum?: any;
  }
}

interface WalletLoginProps {
  onSuccess?: () => void;
}

export default function WalletLogin({ onSuccess }: WalletLoginProps) {
  const [isConnecting, setIsConnecting] = useState(false);

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("MetaMask não encontrado. Por favor, instale a extensão MetaMask para continuar.");
      return;
    }

    setIsConnecting(true);

    try {
      // Solicitar acesso à carteira
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      const walletAddress = accounts[0];

      // Solicitar assinatura para verificar propriedade
      const message = `Sentra Partners - Login\nEndereço: ${walletAddress}\nTimestamp: ${Date.now()}`;
      const signature = await window.ethereum.request({
        method: "personal_sign",
        params: [message, walletAddress],
      });

      // Enviar para o backend
      const response = await fetch("/api/auth/wallet-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          walletAddress,
          message,
          signature,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erro ao fazer login");
      }

      const data = await response.json();

      if (onSuccess) {
        onSuccess();
      }

      // Recarregar página para atualizar estado de autenticação
      window.location.href = "/";
    } catch (error: any) {
      console.error("Erro ao conectar wallet:", error);
      
      if (error.code === 4001) {
        alert("Conexão cancelada. Você cancelou a conexão com a carteira.");
      } else {
        alert(`Erro ao conectar: ${error.message || "Não foi possível conectar à carteira."}`);
      }
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Login com Carteira Web3
        </CardTitle>
        <CardDescription>
          Conecte sua carteira MetaMask para fazer login de forma segura
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          onClick={connectWallet}
          disabled={isConnecting}
          className="w-full"
          size="lg"
        >
          {isConnecting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Conectando...
            </>
          ) : (
            <>
              <Wallet className="mr-2 h-4 w-4" />
              Conectar MetaMask
            </>
          )}
        </Button>
        <p className="text-xs text-muted-foreground mt-4 text-center">
          Não tem MetaMask?{" "}
          <a
            href="https://metamask.io/download/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Instale aqui
          </a>
        </p>
      </CardContent>
    </Card>
  );
}

