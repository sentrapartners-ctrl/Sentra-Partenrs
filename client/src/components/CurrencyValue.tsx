import { useCurrency } from "@/contexts/CurrencyContext";
import { convertCurrency, Currency } from "@/hooks/useCurrency";

interface CurrencyValueProps {
  value: number;
  from?: Currency;
  className?: string;
  showConverted?: boolean;
}

const currencySymbols: Record<Currency, string> = {
  USD: "$",
  BRL: "R$",
  EUR: "€",
  GBP: "£",
};

export function CurrencyValue({ 
  value, 
  from = 'USD', 
  className = "",
  showConverted = true 
}: CurrencyValueProps) {
  const { currency, rates } = useCurrency();

  // Valor original em USD
  const originalValue = value;
  
  // Valor convertido para moeda selecionada
  const convertedValue = convertCurrency(value, from, currency, rates);

  // Se a moeda selecionada é a mesma da origem, mostra apenas um valor
  if (currency === from || !showConverted) {
    return (
      <div className={className}>
        <div className="text-2xl font-bold">
          {currencySymbols[from]}{originalValue.toLocaleString('pt-BR', { 
            minimumFractionDigits: 2, 
            maximumFractionDigits: 2 
          })}
        </div>
      </div>
    );
  }

  // Mostra valor convertido acima (menor) e original abaixo
  return (
    <div className={className}>
      <div className="text-xs text-muted-foreground mb-0.5">
        {currencySymbols[currency]}{convertedValue.toLocaleString('pt-BR', { 
          minimumFractionDigits: 2, 
          maximumFractionDigits: 2 
        })}
      </div>
      <div className="text-2xl font-bold">
        {currencySymbols[from]}{originalValue.toLocaleString('pt-BR', { 
          minimumFractionDigits: 2, 
          maximumFractionDigits: 2 
        })}
      </div>
    </div>
  );
}

// Versão inline para valores menores (trades, etc)
export function InlineCurrencyValue({ 
  value, 
  from = 'USD',
  className = "",
  showConverted = true,
  colored = false
}: CurrencyValueProps & { colored?: boolean }) {
  const { currency, rates } = useCurrency();

  const originalValue = value;
  const convertedValue = convertCurrency(value, from, currency, rates);

  const colorClass = colored 
    ? (value >= 0 ? "text-green-500" : "text-red-500")
    : "";

  const sign = value >= 0 ? "+" : "";

  if (currency === from || !showConverted) {
    return (
      <span className={`${className} ${colorClass}`}>
        {sign}{currencySymbols[from]}{Math.abs(originalValue).toLocaleString('pt-BR', { 
          minimumFractionDigits: 2, 
          maximumFractionDigits: 2 
        })}
      </span>
    );
  }

  return (
    <span className={`${className} ${colorClass} flex flex-col items-end`}>
      <span className="text-[10px] opacity-70">
        {sign}{currencySymbols[currency]}{Math.abs(convertedValue).toLocaleString('pt-BR', { 
          minimumFractionDigits: 2, 
          maximumFractionDigits: 2 
        })}
      </span>
      <span>
        {sign}{currencySymbols[from]}{Math.abs(originalValue).toLocaleString('pt-BR', { 
          minimumFractionDigits: 2, 
          maximumFractionDigits: 2 
        })}
      </span>
    </span>
  );
}

