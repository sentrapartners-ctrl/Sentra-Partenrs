import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, Loader2 } from "lucide-react";

declare global {
  interface Window {
    ethereum?: any;
  }
}

interface MultiWalletLoginProps {
  onSuccess?: () => void;
}

type WalletType = 'metamask' | 'walletconnect' | 'uniswap';

export default function MultiWalletLogin({ onSuccess }: MultiWalletLoginProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectingWallet, setConnectingWallet] = useState<WalletType | null>(null);

  const connectWallet = async (walletType: WalletType) => {
    setIsConnecting(true);
    setConnectingWallet(walletType);

    try {
      let provider;
      let walletAddress;

      if (walletType === 'metamask') {
        // MetaMask
        if (!window.ethereum) {
          alert("MetaMask não encontrado. Por favor, instale a extensão MetaMask.");
          return;
        }
        provider = window.ethereum;
        
      } else if (walletType === 'uniswap') {
        // Uniswap Wallet - detectar corretamente mesmo com múltiplas extensões
        const getUniswapProvider = () => {
          // 1. Verificar window.uniswapWallet (Uniswap Extension)
          if ((window as any).uniswapWallet) {
            console.log('✅ Uniswap Wallet encontrada em window.uniswapWallet');
            return (window as any).uniswapWallet;
          }
          
          // 2. Verificar em window.ethereum.providers (múltiplas wallets)
          if (window.ethereum?.providers) {
            console.log('🔍 Procurando Uniswap em window.ethereum.providers...');
            const uniswap = window.ethereum.providers.find((p: any) => p.isUniswapWallet);
            if (uniswap) {
              console.log('✅ Uniswap Wallet encontrada em providers');
              return uniswap;
            }
          }
          
          // 3. Verificar se window.ethereum é a Uniswap
          if ((window.ethereum as any)?.isUniswapWallet) {
            console.log('✅ Uniswap Wallet encontrada em window.ethereum');
            return window.ethereum;
          }
          
          console.log('❌ Uniswap Wallet não encontrada');
          return null;
        };
        
        provider = getUniswapProvider();
        
        if (!provider) {
          alert("Uniswap Wallet não encontrado. Por favor, instale a extensão Uniswap Wallet.");
          return;
        }
        
        console.log('Uniswap Wallet detectado:', provider.isUniswapWallet);
        console.log('Provider:', provider);
        
      } else if (walletType === 'walletconnect') {
        // WalletConnect - redirecionar para mobile
        alert("WalletConnect: Escaneie o QR code com sua wallet mobile (Trust Wallet, Rainbow, etc.)");
        // Aqui você pode implementar WalletConnect v2 se necessário
        // Por enquanto, vamos usar o mesmo fluxo do MetaMask
        if (!window.ethereum) {
          alert("Nenhuma wallet detectada. Use MetaMask ou Uniswap Wallet no desktop.");
          return;
        }
        provider = window.ethereum;
      }

      // Solicitar acesso à carteira
      console.log(`Solicitando acesso à ${walletType}...`);
      const accounts = await provider.request({
        method: "eth_requestAccounts",
      });

      walletAddress = accounts[0];
      console.log('Endereço da carteira:', walletAddress);

      // Solicitar assinatura para verificar propriedade
      const message = `Sentra Partners - Login\nWallet: ${walletType}\nEndereço: ${walletAddress}\nTimestamp: ${Date.now()}`;
      console.log('Mensagem para assinar:', message);
      
      const signature = await provider.request({
        method: "personal_sign",
        params: [message, walletAddress],
      });
      
      console.log('Assinatura obtida:', signature.substring(0, 20) + '...');

      // Enviar para o backend
      console.log('Enviando para backend...');
      const response = await fetch("/api/auth/wallet-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          walletAddress,
          message,
          signature,
          walletType,
        }),
      });

      console.log('Resposta do backend:', response.status, response.statusText);
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Erro desconhecido' }));
        console.error('Erro do backend:', error);
        throw new Error(error.message || `Erro ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Login bem-sucedido:', data);

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
      setConnectingWallet(null);
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
          Conecte sua carteira para fazer login de forma segura
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* MetaMask */}
        <Button
          onClick={() => connectWallet('metamask')}
          disabled={isConnecting}
          variant="outline"
          className="w-full border-2 border-orange-500 text-orange-500 hover:bg-orange-50 bg-white"
          size="lg"
        >
          {isConnecting && connectingWallet === 'metamask' ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Conectando...
            </>
          ) : (
            <>
              <img 
                src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg" 
                alt="MetaMask" 
                className="mr-2 h-5 w-5"
              />
              MetaMask
            </>
          )}
        </Button>

        {/* WalletConnect */}
        <Button
          onClick={() => connectWallet('walletconnect')}
          disabled={isConnecting}
          variant="outline"
          className="w-full border-2 border-blue-500 text-blue-500 hover:bg-blue-50 bg-white"
          size="lg"
        >
          {isConnecting && connectingWallet === 'walletconnect' ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Conectando...
            </>
          ) : (
            <>
              <Wallet className="mr-2 h-4 w-4" />
              WalletConnect
            </>
          )}
        </Button>

        {/* Uniswap Wallet */}
        <Button
          onClick={() => connectWallet('uniswap')}
          disabled={isConnecting}
          variant="outline"
          className="w-full border-2 border-pink-500 text-pink-500 hover:bg-pink-50 bg-white"
          size="lg"
        >
          {isConnecting && connectingWallet === 'uniswap' ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Conectando...
            </>
          ) : (
            <>
              <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 16.246c-.346.654-1.019 1.06-1.752 1.06-.346 0-.692-.087-1.019-.26l-2.308-1.231-2.308 1.231c-.327.173-.673.26-1.019.26-.733 0-1.406-.406-1.752-1.06-.346-.654-.346-1.444 0-2.098l2.308-4.365c.346-.654 1.019-1.06 1.752-1.06s1.406.406 1.752 1.06l2.308 4.365c.346.654.346 1.444 0 2.098z"/>
              </svg>
              Uniswap Wallet
            </>
          )}
        </Button>

        <p className="text-xs text-muted-foreground mt-4 text-center">
          Não tem uma wallet?{" "}
          <a
            href="https://metamask.io/download/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Instale MetaMask
          </a>
          {" ou "}
          <a
            href="https://wallet.uniswap.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Uniswap Wallet
          </a>
        </p>
      </CardContent>
    </Card>
  );
}

