/**
 * Calculates the depreciated value of an item based on its original cost, 
 * depreciation rate (percentage), and age in years.
 * Formula: Current Value = Cost × (1 − Rate)^Years
 */
export function calculateCurrentValue(cost: number | string, rate: number | string, purchaseDate: string | Date | null): number {
  if (!purchaseDate) return Number(cost);
  
  const c = Number(cost);
  const r = Number(rate) / 100;
  
  const pDate = new Date(purchaseDate);
  if (isNaN(pDate.getTime())) return c;

  const currentYear = new Date().getFullYear();
  const purchaseYear = pDate.getFullYear();
  const years = Math.max(0, currentYear - purchaseYear);
  
  const currentValue = c * Math.pow(1 - r, years);
  
  return currentValue;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}
