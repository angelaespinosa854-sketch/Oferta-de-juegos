import { TaxConfig, CalculatedPrice, GameDeal } from '../types';

export const PROVINCES = [
  { name: 'Ninguna', rate: 0.00 },
  { name: 'CABA (Buenos Aires Ciudad)', rate: 0.02 },
  { name: 'Buenos Aires Provincia', rate: 0.03 },
  { name: 'Córdoba', rate: 0.03 },
  { name: 'Santa Fe', rate: 0.03 },
  { name: 'Mendoza', rate: 0.03 },
  { name: 'Tucumán', rate: 0.05 },
  { name: 'Chaco', rate: 0.055 },
  { name: 'Río Negro', rate: 0.05 },
];

export const DEFAULT_TAX_CONFIG: TaxConfig = {
  dolarOficial: 935.00, // Current mid-2026 approximate official rate
  iva: 0.21,           // 21% Digital Services IVA
  pais: 0.08,          // 8% PAIS tax for Digital Services
  ganancias: 0.30,     // 30% digital services withholding
  iibbProvince: 'CABA (Buenos Aires Ciudad)',
  iibbRate: 0.02,      // 2%
};

/**
 * Calculates final ARS pricing with detailed taxes based on config
 */
export function calculatePrice(
  amount: number,
  currency: 'USD' | 'ARS',
  config: TaxConfig = DEFAULT_TAX_CONFIG
): CalculatedPrice {
  const basePriceArs = currency === 'USD' 
    ? amount * config.dolarOficial 
    : amount;

  const ivaAmount = basePriceArs * config.iva;
  const paisAmount = basePriceArs * config.pais;
  const gananciasAmount = basePriceArs * config.ganancias;
  const iibbAmount = basePriceArs * config.iibbRate;

  const totalTaxes = ivaAmount + paisAmount + gananciasAmount + iibbAmount;
  const finalPriceArs = basePriceArs + totalTaxes;

  return {
    basePrice: amount,
    basePriceArs,
    taxesArs: totalTaxes,
    finalPriceArs,
    detailedTaxes: {
      iva: ivaAmount,
      pais: paisAmount,
      ganancias: gananciasAmount,
      iibb: iibbAmount,
    }
  };
}

/**
 * Helper to get short explanation text of the tax formula
 */
export function getTaxPercentage(config: TaxConfig): number {
  return Math.round((config.iva + config.pais + config.ganancias + config.iibbRate) * 100);
}

/**
 * Formats key currencies neatly
 */
export function formatCurrency(amount: number, currency: string = 'ARS'): string {
  if (currency === 'USD') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  }
  
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
