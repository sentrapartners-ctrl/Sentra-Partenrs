import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Currency, ExchangeRates, useCurrencyRates } from '@/hooks/useCurrency';

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  rates: ExchangeRates;
  loading: boolean;
  lastUpdate: Date | null;
  refresh: () => void;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrency] = useState<Currency>(() => {
    const saved = localStorage.getItem('selected_currency');
    return (saved as Currency) || 'USD';
  });

  const { rates, loading, lastUpdate, refresh } = useCurrencyRates();

  const handleSetCurrency = (newCurrency: Currency) => {
    setCurrency(newCurrency);
    localStorage.setItem('selected_currency', newCurrency);
  };

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        setCurrency: handleSetCurrency,
        rates,
        loading,
        lastUpdate,
        refresh,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within CurrencyProvider');
  }
  return context;
}

