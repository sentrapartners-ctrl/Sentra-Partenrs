/**
 * Formata um valor de preço para exibição
 * Lida com valores que podem ser number ou string (DECIMAL do MySQL)
 * 
 * @param value - Valor do preço (number ou string)
 * @param decimals - Número de casas decimais (padrão: 2)
 * @returns String formatada com o preço
 */
export function formatPrice(value: number | string | null | undefined, decimals: number = 2): string {
  if (value === null || value === undefined) {
    return '0.00';
  }
  
  const numValue = typeof value === 'number' ? value : parseFloat(value);
  
  if (isNaN(numValue)) {
    return '0.00';
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
