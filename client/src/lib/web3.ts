import { defaultWagmiConfig } from '@web3modal/wagmi/react/config'
import { createWeb3Modal } from '@web3modal/wagmi/react'
import { mainnet, polygon, arbitrum, optimism } from 'wagmi/chains'

// 1. Get projectId from https://cloud.walletconnect.com
const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID_HERE'

// 2. Create wagmiConfig
const metadata = {
  name: 'Sentra Partners',
  description: 'Advanced Trading Analytics Platform',
  url: 'https://sentrapartners.com',
  icons: ['https://sentrapartners.com/icon.png']
}

const chains = [mainnet, polygon, arbitrum, optimism] as const

export const config = defaultWagmiConfig({
  chains,
  projectId,
  metadata,
})

// 3. Create modal
createWeb3Modal({
  wagmiConfig: config,
  projectId,
  enableAnalytics: true,
  themeMode: 'dark',
  themeVariables: {
    '--w3m-accent': '#3b82f6',
    '--w3m-border-radius-master': '4px',
  }
})

