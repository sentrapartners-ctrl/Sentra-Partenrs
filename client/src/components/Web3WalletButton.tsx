import { useAccount, useDisconnect, useSignMessage } from 'wagmi'
import { Button } from './ui/button'
import { useLocation } from 'wouter'
import { useEffect, useState } from 'react'

export function Web3WalletButton() {
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  const { signMessageAsync } = useSignMessage()
  const [, setLocation] = useLocation()
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [hasAttemptedLogin, setHasAttemptedLogin] = useState(false)

  useEffect(() => {
    async function handleWalletLogin() {
      if (!isConnected || !address || hasAttemptedLogin || isLoggingIn) {
        return
      }

      setIsLoggingIn(true)
      setHasAttemptedLogin(true)

      try {
        console.log('🔐 Iniciando login via wallet...')
        console.log('📍 Endereço:', address)

        // 1. Criar mensagem para assinar
        const message = `Sentra Partners - Login\nWallet: ${address}\nTimestamp: ${Date.now()}`
        console.log('📝 Mensagem:', message)

        // 2. Solicitar assinatura
        const signature = await signMessageAsync({ message })
        console.log('✍️ Assinatura obtida:', signature.slice(0, 20) + '...')

        // 3. Enviar para backend
        const response = await fetch('/api/auth/wallet-login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            walletAddress: address,
            signature,
            message,
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.message || 'Erro ao fazer login')
        }

        console.log('✅ Login bem-sucedido!')
        
        // 4. Aguardar cookie ser setado e redirecionar
        await new Promise(resolve => setTimeout(resolve, 500))
        window.location.href = '/'
      } catch (error: any) {
        console.error('❌ Erro no login:', error)
        alert(`Erro ao fazer login: ${error.message}`)
        setHasAttemptedLogin(false) // Permitir tentar novamente
      } finally {
        setIsLoggingIn(false)
      }
    }

    handleWalletLogin()
  }, [isConnected, address, signMessageAsync, hasAttemptedLogin, isLoggingIn])

  if (isLoggingIn) {
    return (
      <div className="space-y-2 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="text-sm text-muted-foreground">
          Fazendo login...
        </p>
      </div>
    )
  }

  if (isConnected && address) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground text-center">
          Conectado: {address.slice(0, 6)}...{address.slice(-4)}
        </p>
        <Button
          onClick={() => {
            disconnect()
            setHasAttemptedLogin(false)
          }}
          variant="outline"
          className="w-full"
        >
          Desconectar
        </Button>
      </div>
    )
  }

  return (
    <div className="flex justify-center">
      <w3m-button />
    </div>
  )
}

