/**
 * Calculates the depreciated value of an item based on its original cost, 
 * depreciation rate (percentage), and age in years.
 * Formula: Current Value = Cost × (1 − Rate)^Years
 */
export function calculateCurrentValue(cost: number | string, rate: number | string, purchaseDate: string | Date | null): number {
  if (!purchaseDate) return Number(cost);
  
  const c = Number(cost);
  const r = Number(rate) / 100; // Convert percentage to decimal
  
  const pDate = new Date(purchaseDate);
  if (isNaN(pDate.getTime())) return c;

  // Calculate difference in exact years
  const msPerYear = 1000 * 60 * 60 * 24 * 365.25;
  const years = Math.max(0, (Date.now() - pDate.getTime()) / msPerYear);
  
  const currentValue = c * Math.pow(1 - r, years);
  
  // Ensure value doesn't drop below 5% salvage value
  const salvageValue = c * 0.05;
  
  return Math.max(currentValue, salvageValue);
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}
