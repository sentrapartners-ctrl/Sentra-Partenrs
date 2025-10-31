/**
 * Formata um valor de preço para exibição
 * Lida com valores que podem ser number ou string (DECIMAL do MySQL)
 * IMPORTANTE: Divide por 100 pois o backend armazena valores em centavos
 * 
 * @param value - Valor do preço em centavos (number ou string)
 * @param decimals - Número de casas decimais (padrão: 2)
 * @param divideByCents - Se true, divide por 100 para converter centavos em reais (padrão: true)
 * @returns String formatada com o preço
 */
export function formatPrice(
  value: number | string | null | undefined, 
  decimals: number = 2,
  divideByCents: boolean = true
): string {
  if (value === null || value === undefined) {
    return '0.00';
  }
  
  let numValue = typeof value === 'number' ? value : parseFloat(value);
  
  if (isNaN(numValue)) {
    return '0.00';
  }
  
  // Dividir por 100 para converter centavos em reais
  if (divideByCents) {
    numValue = numValue / 100;
  }
  
  return numValue.toFixed(decimals);
}

/**
 * Converte um valor para número de forma segura
 * 
 * @param value - Valor a ser convertido
 * @param defaultValue - Valor padrão se conversão falhar (padrão: 0)
 * @returns Número convertido
 */
export function toNumber(value: number | string | null | undefined, defaultValue: number = 0): number {
  if (value === null || value === undefined) {
    return defaultValue;
  }
  
  const numValue = typeof value === 'number' ? value : parseFloat(value);
  
  if (isNaN(numValue)) {
    return defaultValue;
  }
  
  return numValue;
}

/**
 * Formata lucro/profit baseado no tipo de conta
 * - Contas CENT: divide por 100 (ex: 74225 → $742.25)
 * - Contas normais: não divide (ex: 742.25 → $742.25)
 * 
 * @param value - Valor do lucro
 * @param isCentAccount - Se true, divide por 100 (conta cent)
 * @param decimals - Número de casas decimais (padrão: 2)
 * @returns String formatada com o lucro
 */
export function formatProfit(
  value: number | string | null | undefined,
  isCentAccount: boolean = false,
  decimals: number = 2
): string {
  if (value === null || value === undefined) {
    return '0.00';
  }
  
  let numValue = typeof value === 'number' ? value : parseFloat(value);
  
  if (isNaN(numValue)) {
    return '0.00';
  }
  
  // Apenas contas CENT precisam dividir por 100
  if (isCentAccount) {
    numValue = numValue / 100;
  }
  
  return numValue.toFixed(decimals);
}
