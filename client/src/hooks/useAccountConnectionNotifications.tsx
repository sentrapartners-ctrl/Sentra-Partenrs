import { useEffect, useRef } from 'react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

export function useAccountConnectionNotifications() {
  const previousAccountsRef = useRef<Set<string>>(new Set());
  
  const { data: dashboardData } = trpc.dashboard.summary.useQuery(
    undefined,
    { refetchInterval: 5000 } // Poll a cada 5 segundos
  );

  useEffect(() => {
    if (!dashboardData?.summary?.accounts) return;

    const currentAccounts = new Set<string>();
    const connectedAccounts = dashboardData.summary.accounts.filter(
      (acc: any) => acc.status === 'connected'
    );

    connectedAccounts.forEach((account: any) => {
      const accountKey = `${account.accountNumber}_${account.broker}`;
      currentAccounts.add(accountKey);

      // Se é uma conta nova (não estava na lista anterior)
      if (!previousAccountsRef.current.has(accountKey)) {
        const balance = ((account.balance || 0) / (account.isCentAccount ? 10000 : 100)).toFixed(2);
        const equity = ((account.equity || 0) / (account.isCentAccount ? 10000 : 100)).toFixed(2);
        
        // Mostra notificação
        toast.success('🎉 Conta Conectada!', {
          description: `#${account.accountNumber} - ${account.broker}\n${account.server}\nBalance: $${balance} | Equity: $${equity}`,
          duration: 15000, // 15 segundos
        });
      }
    });

    // Atualiza a referência para a próxima verificação
    previousAccountsRef.current = currentAccounts;
  }, [dashboardData]);
}

