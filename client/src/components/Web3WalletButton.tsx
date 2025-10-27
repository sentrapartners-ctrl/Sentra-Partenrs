import { useAccount, useDisconnect } from 'wagmi'
import { Button } from './ui/button'
import { trpc } from '@/lib/trpc'
import { useLocation } from 'wouter'

export function Web3WalletButton() {
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  const [, setLocation] = useLocation()

  const walletLoginMutation = trpc.auth.walletLogin.useMutation({
    onSuccess: () => {
      setLocation('/')
    },
    onError: (error) => {
      console.error('Erro ao fazer login:', error)
      alert(`Erro: ${error.message}`)
    },
  })

  // Quando conectar, fazer login automaticamente
  if (isConnected && address && !walletLoginMutation.isPending) {
    // Aqui você precisa assinar uma mensagem
    // Por enquanto vou simplificar
    console.log('Conectado:', address)
  }

  if (isConnected) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          Conectado: {address?.slice(0, 6)}...{address?.slice(-4)}
        </p>
        <Button
          onClick={() => disconnect()}
          variant="outline"
          className="w-full"
        >
          Desconectar
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <w3m-button />
    </div>
  )
}

