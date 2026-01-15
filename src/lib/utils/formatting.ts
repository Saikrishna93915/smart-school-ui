// src/utils/formatting.ts
export const formatCompactCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(amount);
  };
  
  export const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  export const formatCurrencyInLakhs = (value: number): string => {
    return `₹${value.toLocaleString('en-IN', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    })}L`;
  };