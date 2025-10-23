import { useState, useEffect } from 'react';

export type Currency = 'USD' | 'BRL' | 'EUR' | 'GBP';

export interface ExchangeRates {
  USD: number;
  BRL: number;
  EUR: number;
  GBP: number;
}

const CACHE_KEY = 'exchange_rates';
const CACHE_DURATION = 60000; // 1 minuto

export function useCurrencyRates() {
  const [rates, setRates] = useState<ExchangeRates>({
    USD: 1,
    BRL: 5.0,
    EUR: 0.92,
    GBP: 0.79,
  });
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchRates = async () => {
    try {
      setLoading(true);

      // Busca USD/BRL, USD/EUR, USD/GBP da AwesomeAPI
      const response = await fetch('https://economia.awesomeapi.com.br/json/last/USD-BRL,USD-EUR,USD-GBP');
      const data = await response.json();

      const newRates: ExchangeRates = {
        USD: 1,
        BRL: parseFloat(data.USDBRL?.bid || '5.0'),
        EUR: 1 / parseFloat(data.USDEUR?.bid || '1.09'), // Inverte para obter EUR/USD
        GBP: 1 / parseFloat(data.USDGBP?.bid || '1.27'), // Inverte para obter GBP/USD
      };

      setRates(newRates);
      setLastUpdate(new Date());

      // Salva no cache
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        rates: newRates,
        timestamp: Date.now(),
      }));
    } catch (error) {
      console.error('Erro ao buscar cotações:', error);
      
      // Tenta carregar do cache em caso de erro
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { rates: cachedRates } = JSON.parse(cached);
        setRates(cachedRates);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Verifica cache primeiro
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const { rates: cachedRates, timestamp } = JSON.parse(cached);
      const age = Date.now() - timestamp;
      
      if (age < CACHE_DURATION) {
        setRates(cachedRates);
        setLastUpdate(new Date(timestamp));
        return;
      }
    }

    // Busca cotações
    fetchRates();

    // Atualiza a cada 1 minuto
    const interval = setInterval(fetchRates, CACHE_DURATION);
    return () => clearInterval(interval);
  }, []);

  return { rates, loading, lastUpdate, refresh: fetchRates };
}

export function convertCurrency(amount: number, from: Currency, to: Currency, rates: ExchangeRates): number {
  if (from === to) return amount;
  
  // Converte para USD primeiro, depois para moeda de destino
  const amountInUSD = amount / rates[from];
  return amountInUSD * rates[to];
}

