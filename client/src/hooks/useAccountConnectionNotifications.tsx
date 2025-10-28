import { useEffect, useRef } from 'react';
import { trpc } from '@/lib/trpc';
import { useToast } from '@/hooks/use-toast';

export function useAccountConnectionNotifications() {
  const { toast } = useToast();
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
        // Mostra notificação
        toast({
          title: '🎉 Conta Conectada!',
          description: (
            <div className="space-y-1">
              <div className="font-semibold">#{account.accountNumber}</div>
              <div className="text-sm text-muted-foreground">{account.broker}</div>
              <div className="text-sm text-muted-foreground">{account.server}</div>
              <div className="text-sm font-medium mt-2">
                Balance: ${((account.balance || 0) / (account.isCentAccount ? 10000 : 100)).toFixed(2)}
              </div>
              <div className="text-sm">
                Equity: ${((account.equity || 0) / (account.isCentAccount ? 10000 : 100)).toFixed(2)}
              </div>
            </div>
          ),
          duration: 15000, // 15 segundos
        });
      }
    });

    // Atualiza a referência para a próxima verificação
    previousAccountsRef.current = currentAccounts;
  }, [dashboardData, toast]);
}

