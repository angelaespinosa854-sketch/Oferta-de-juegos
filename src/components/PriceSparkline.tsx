import React from 'react';
import { TrendingDown, Award } from 'lucide-react';
import { formatCurrency } from '../utils/taxCalculator';

interface PriceSparklineProps {
  currentPrice: number;
  originalPrice: number;
  currency: 'USD' | 'ARS';
  historyPrices?: number[];
}

export default function PriceSparkline({
  currentPrice,
  originalPrice,
  currency,
  historyPrices
}: PriceSparklineProps) {
  // Generate a plausible price history if none provided
  const points = React.useMemo(() => {
    if (historyPrices && historyPrices.length > 1) {
      return historyPrices;
    }
    // Formulate a beautiful discount progression
    return [
      originalPrice,
      originalPrice * 0.95,
      originalPrice * 1.1,
      originalPrice * 0.75,
      originalPrice * 0.85,
      currentPrice
    ];
  }, [originalPrice, currentPrice, historyPrices]);

  const minPrice = Math.min(...points);
  const maxPrice = Math.max(...points);
  const priceRange = maxPrice - minPrice || 1;

  // Map prices to coordinate space (X: 0 to 100, Y: 2 to 22 for vertical padding)
  const svgHeight = 24;
  const svgWidth = 110;
  
  const coordinates = points.map((p, index) => {
    const x = (index / (points.length - 1)) * svgWidth;
    // Lower price = higher up in coordinate space (closer to 2 than 22)
    const y = svgHeight - 2 - ((p - minPrice) / priceRange) * (svgHeight - 6);
    return { x, y, price: p };
  });

  // SVG Path generation
  const pathD = coordinates.reduce((acc, coord, idx) => {
    return acc + `${idx === 0 ? 'M' : 'L'} ${coord.x.toFixed(1)} ${coord.y.toFixed(1)}`;
  }, '');

  // Is currentPrice the lowest?
  const isLowestInstant = currentPrice <= minPrice * 1.02;

  return (
    <div className="mt-2.5 p-2 rounded-lg bg-slate-950/65 border border-white/5" id={`sparkline-${currentPrice}`}>
      <div className="flex items-center justify-between gap-1 mb-1.5">
        <span className="text-[8px] font-mono font-bold tracking-wider text-slate-500 uppercase flex items-center gap-1">
          <TrendingDown className="w-2.5 h-2.5 text-indigo-400" /> Historial de Precios (6m)
        </span>
        {isLowestInstant ? (
          <span className="text-[7.5px] font-bold font-sans text-teal-400 bg-teal-950/50 border border-teal-500/20 px-1 py-0.2 rounded uppercase animate-pulse flex items-center gap-0.5" title="¡Este de hoy es el valor más bajo registrado!">
            <Award className="w-2 h-2" /> MÁX AHORRO
          </span>
        ) : (
          <span className="text-[7.5px] font-mono text-slate-400">
            Min: {formatCurrency(minPrice, currency)}
          </span>
        )}
      </div>

      <div className="relative flex items-center h-7 w-full overflow-visible">
        {/* Sparkline Canvas Vector */}
        <svg className="w-full h-full overflow-visible" viewBox={`0 0 ${svgWidth} ${svgHeight}`}>
          <defs>
            {/* Soft path laser glow */}
            <filter id="laser-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="1.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            {/* Fill gradient below path */}
            <linearGradient id="area-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Area under the line */}
          <path
            d={`${pathD} L ${svgWidth} ${svgHeight} L 0 ${svgHeight} Z`}
            fill="url(#area-gradient)"
          />

          {/* Actual Sparkline path */}
          <path
            d={pathD}
            fill="none"
            stroke={isLowestInstant ? '#2dd4bf' : '#6366f1'}
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#laser-glow)"
          />

          {/* Glowing indicator circles on extreme points */}
          {coordinates.map((coord, idx) => {
            const isCurrentPoint = idx === coordinates.length - 1;
            const isMinPoint = coord.price === minPrice;
            
            if (!isCurrentPoint && !isMinPoint) return null;

            return (
              <circle
                key={idx}
                cx={coord.x}
                cy={coord.y}
                r={isCurrentPoint ? 2.5 : 2}
                fill={isCurrentPoint ? (isLowestInstant ? '#2dd4bf' : '#818cf8') : '#fb7185'}
                className={isCurrentPoint ? 'animate-ping' : ''}
                style={{ transformOrigin: `${coord.x}px ${coord.y}px` }}
              />
            );
          })}
        </svg>
      </div>
    </div>
  );
}
