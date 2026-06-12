export enum Platform {
  STEAM = 'Steam',
  XBOX = 'Xbox Store',
  PLAYSTATION = 'PlayStation Store',
  NINTENDO = 'Nintendo eShop',
}

export interface TaxConfig {
  dolarOficial: number;
  iva: number; // e.g., 21% -> 0.21
  pais: number; // e.g., 8% -> 0.08
  ganancias: number; // e.g., 30% -> 0.30
  iibbProvince: string; // e.g., "CABA", "PBA", "SFT", "Ninguna"
  iibbRate: number; // e.g., 2% -> 0.02
}

export interface GameDeal {
  id: string | number;
  title: string;
  platform: Platform;
  currency: 'USD' | 'ARS';
  originalPrice: number; // Listed price on store
  currentPrice: number; // Price on sale
  discountPercent: number;
  imageUrl?: string;
  storeUrl?: string;
  isCustomSearch?: boolean;
  metacriticScore?: number;
  playtimeHours?: number;
  historyPrices?: number[]; // list of past price points in the game's original currency

  // Academic high-fidelity presentation requirements
  discount?: number;
  store?: 'Steam' | 'Xbox' | 'PlayStation' | 'Nintendo';
  shopUrl?: string;
}

export interface CalculatedPrice {
  basePrice: number; // currentPrice in original currency
  basePriceArs: number; // currentPrice converted to ARS (if USD)
  taxesArs: number; // total amount of taxes in ARS
  finalPriceArs: number; // final price in ARS with all taxes included
  detailedTaxes: {
    iva: number;
    pais: number;
    ganancias: number;
    iibb: number;
  };
}

export interface NotificationAlert {
  id: string;
  gameTitle: string;
  platform: Platform | 'TODOS';
  targetPriceUsd?: number;
  targetPriceArs?: number;
  discountPercentThreshold?: number;
  isActive: boolean;
  createdAt: string;
}

export interface LiveNotification {
  id: string;
  title: string;
  message: string;
  type: 'sale_alert' | 'system' | 'custom';
  timestamp: string;
  gameId?: string;
  read: boolean;
}
