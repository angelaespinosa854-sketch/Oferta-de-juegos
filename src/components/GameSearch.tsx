import React, { useState } from 'react';
import { Search, Loader2, Sparkles, TrendingUp, DollarSign, ArrowRight, HelpCircle } from 'lucide-react';
import { GameDeal, Platform, TaxConfig } from '../types';
import { calculatePrice, formatCurrency } from '../utils/taxCalculator';
import { playClickSound } from '../utils/audio';
import PriceHistoryAndCompare from './PriceHistoryAndCompare';
import { DEFAULT_DEALS } from '../data/defaultDeals';

interface GameSearchProps {
  taxConfig: TaxConfig;
  onAddCustomAlert: (gameTitle: string, platform: Platform, currentPrice: number, isUSD: boolean) => void;
}

interface SearchResult {
  gameTitle: string;
  playtimeHours?: number;
  deals: {
    platform: Platform;
    currency: 'USD' | 'ARS';
    originalPrice: number;
    currentPrice: number;
    discountPercent: number;
    storeUrl?: string;
  }[];
  aiSummary: string;
}

const SHUFFLED_GAMER_LOADING_MESSAGES = [
  'Buscando precios con agentes de Inteligencia Artificial...',
  'Consultando cotizaciones de Steam en Dólares...',
  'Buscando ofertas ocultas en tiendas de Xbox...',
  'Verificando ofertas en PlayStation Store...',
  'Calculando impuestos digitales de AFIP, IVA y PAIS...',
  'Cotejando eShop de Nintendo Argentina...',
  'Organizando precios finales de menor a mayor...'
];

export default function GameSearch({ taxConfig, onAddCustomAlert }: GameSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadMessageIndex, setLoadMessageIndex] = useState(0);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Autocomplete states
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Real-time matched items from our catalog to show in the dropdown with photos and live prices
  const matchedDeals = React.useMemo(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) return [];
    const query = searchQuery.toLowerCase();
    
    // De-duplicate deals by title to keep the dropdown clean and premium
    const uniqueDealsMap = new Map<string, GameDeal>();
    DEFAULT_DEALS.forEach((deal) => {
      if (deal.title.toLowerCase().includes(query)) {
        const existing = uniqueDealsMap.get(deal.title);
        // Prefer lower price or steam
        if (!existing || deal.currentPrice < existing.currentPrice) {
          uniqueDealsMap.set(deal.title, deal);
        }
      }
    });
    return Array.from(uniqueDealsMap.values()).slice(0, 4);
  }, [searchQuery]);

  // Fetch autocompletion results based on searchQuery state
  React.useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/deals/autocomplete?q=${encodeURIComponent(searchQuery)}`);
        const data = await res.json();
        setSuggestions(data);
      } catch (err) {
        console.warn('Could not fetch autocomplete data', err);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Rotate loading messages
  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      interval = setInterval(() => {
        setLoadMessageIndex((prev) => (prev + 1) % SHUFFLED_GAMER_LOADING_MESSAGES.length);
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handleSearch = async (e: React.FormEvent | null, overrideQuery?: string) => {
    if (e) e.preventDefault();
    const queryToUse = (overrideQuery || searchQuery).trim();
    if (!queryToUse) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setLoadMessageIndex(0);

    try {
      const response = await fetch('/api/deals/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: queryToUse }),
      });

      const data = await response.json();
      if (data.success && data.data) {
        setResult(data.data);
      } else {
        setError(data.error || 'No pudimos encontrar ofertas de juegos con ese nombre. Por favor intenta de nuevo.');
      }
    } catch (err: any) {
      setError('Hubo un error de conexión con el buscador IA. Verificá que el servidor esté activo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-850 rounded-2xl p-5 shadow-xl" id="ai-deal-searcher-card">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
        <h3 className="font-serif font-bold text-sm md:text-base text-white tracking-widest uppercase">
          Buscador de Precios Inteligente
        </h3>
      </div>
      <p className="text-xs text-slate-400 mb-4 leading-normal">
        Escribí el nombre de cualquier juego para PC o Consola. Nuestra IA buscará los precios oficiales actuales y los convertirá al instante aplicando tus impuestos seleccionados.
      </p>

      {/* Search Input Bar form */}
      <form 
        onSubmit={(e) => {
          playClickSound();
          handleSearch(e);
        }} 
        className="flex gap-2 mb-2"
      >
        <div className="relative flex-1">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
            <Search className="w-4.5 h-4.5" />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 250)}
            placeholder="Ej: Hades II, GTA V, Hogwarts Legacy, Zelda..."
            className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl p-3 pl-10 text-white text-sm outline-none transition-colors"
            disabled={loading}
            id="ai-search-input"
            autoComplete="off"
          />

          {showSuggestions && (searchQuery.trim().length >= 2) && (matchedDeals.length > 0 || suggestions.length > 0) && (
            <div className="absolute left-0 right-0 top-full z-50 mt-1.5 bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-2xl divide-y divide-white/5 max-h-[380px] overflow-y-auto">
              {/* Section 1: Real-time matches with photos & prices */}
              {matchedDeals.length > 0 && (
                <div className="p-2">
                  <div className="text-[10px] text-slate-500 uppercase tracking-widest font-mono font-bold px-2 py-1 mb-1">
                    🎮 Resultados en catálogo (Precios c/Imp)
                  </div>
                  <div className="flex flex-col gap-1">
                    {matchedDeals.map((deal) => {
                      const calculated = calculatePrice(deal.currentPrice, deal.currency, taxConfig);
                      return (
                        <button
                          key={deal.id}
                          type="button"
                          onClick={() => {
                            playClickSound();
                            setSearchQuery(deal.title);
                            setSuggestions([]);
                            setShowSuggestions(false);
                            handleSearch(null, deal.title);
                          }}
                          className="w-full text-left p-2 rounded-lg hover:bg-slate-900 transition-all flex items-center gap-3 cursor-pointer group"
                        >
                          <img
                            src={deal.imageUrl || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=80&auto=format&fit=crop&q=60'}
                            alt={deal.title}
                            className="w-10 h-10 rounded object-cover border border-slate-800 group-hover:border-slate-700"
                            referrerPolicy="no-referrer"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-bold text-slate-200 group-hover:text-white truncate">
                              {deal.title}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                                deal.platform === Platform.STEAM ? 'bg-blue-900/40 text-blue-300 border border-blue-500/20' :
                                deal.platform === Platform.XBOX ? 'bg-green-900/40 text-green-300 border border-green-500/20' :
                                deal.platform === Platform.PLAYSTATION ? 'bg-indigo-900/40 text-indigo-300 border border-indigo-500/20' :
                                'bg-red-900/40 text-red-300 border border-red-500/20'
                              }`}>
                                {deal.platform}
                              </span>
                              {deal.discountPercent > 0 && (
                                <span className="text-[10px] text-rose-450 font-bold font-mono">
                                  -{deal.discountPercent}%
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-[9px] text-slate-500 block font-mono">Total Final</span>
                            <span className="text-xs font-bold text-emerald-400 font-mono">
                              {formatCurrency(calculated.finalPriceArs, 'ARS')}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Section 2: Autocomplete suggestions list */}
              {suggestions.length > 0 && (
                <div className="p-2">
                  <div className="text-[10px] text-slate-500 uppercase tracking-widest font-mono font-bold px-2 py-1 mb-1 font-sans">
                    🔍 Sugerencias Inteligentes
                  </div>
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => {
                        playClickSound();
                        setSearchQuery(suggestion);
                        setSuggestions([]);
                        setShowSuggestions(false);
                        handleSearch(null, suggestion);
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-900 rounded-lg transition-colors cursor-pointer flex items-center gap-2"
                    >
                      <span className="text-slate-500 text-[10px]">🔎</span>
                      <span>{suggestion}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        <button
          type="submit"
          className="bg-amber-500 hover:bg-amber-400 disabled:bg-slate-850 text-slate-950 font-semibold px-5 rounded-xl text-sm transition-colors flex items-center gap-1.5"
          disabled={loading || !searchQuery.trim()}
          id="ai-search-submit-btn"
        >
          {loading ? (
            <Loader2 className="w-4.5 h-4.5 animate-spin" />
          ) : (
            <>
              Buscar Precios
            </>
          )}
        </button>
      </form>

      {/* Suggested Search Chips */}
      <div className="flex flex-wrap gap-1.5 mb-5 items-center">
        <span className="text-[10px] text-slate-500 mr-1 font-mono uppercase">Populares:</span>
        {['Elden Ring', 'Hades II', 'Cyberpunk', 'FC 26', 'Zelda'].map((game) => (
          <button
            key={game}
            type="button"
            onClick={() => {
              playClickSound();
              setSearchQuery(game);
              handleSearch(null, game);
            }}
            disabled={loading}
            className="text-[10px] bg-slate-950 border border-slate-800 hover:border-amber-500/50 hover:bg-slate-900 text-slate-400 hover:text-amber-300 px-2.5 py-1 rounded-full transition-all focus:outline-none cursor-pointer"
          >
            {game}
          </button>
        ))}
      </div>

      {/* Loading state indicator */}
      {loading && (
        <div className="p-8 text-center bg-slate-950/40 rounded-xl border border-slate-850 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
          <p className="text-sm font-medium text-amber-200/90 animate-pulse transition-all duration-300">
            {SHUFFLED_GAMER_LOADING_MESSAGES[loadMessageIndex]}
          </p>
          <span className="text-[10px] text-slate-500">Esto involucra búsquedas en Google e inteligencia generativa de tiempo real</span>
        </div>
      )}

      {/* Error state display */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/30 text-rose-300 text-xs text-center flex flex-col gap-1">
          <p className="font-semibold text-white">Ocurrió un inconveniente</p>
          <p>{error}</p>
        </div>
      )}

      {/* Real comparison results rendered beautifully */}
      {result && (
        <div className="flex flex-col gap-4 animate-fade-in" id="search-result-container">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
            <div>
              <span className="text-[10px] uppercase font-mono font-bold text-amber-400 tracking-widest bg-amber-950/40 px-2 py-0.5 rounded">Búsqueda Exitosa</span>
              <h4 className="text-lg font-bold text-white mt-1">{result.gameTitle}</h4>
            </div>
            {result.playtimeHours && (
              <div className="bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-left md:text-right">
                <span className="text-[9px] text-slate-500 block uppercase font-mono">Duración Promedio</span>
                <span className="text-xs font-bold text-amber-300 font-mono">⏱️ {result.playtimeHours}h de Campaña</span>
              </div>
            )}
          </div>

          {/* Side by side platform offers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {result.deals.map((deal, idx) => {
              const priceCalc = calculatePrice(deal.currentPrice, deal.currency, taxConfig);
              const originalCalc = calculatePrice(deal.originalPrice, deal.currency, taxConfig);

              return (
                <div 
                  key={idx} 
                  className="bg-slate-950/25 border border-slate-850 rounded-xl p-4 flex flex-col justify-between hover:border-slate-800 transition-colors"
                >
                  <div>
                    {/* Platform header */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold text-slate-300 uppercase">{deal.platform}</span>
                      {deal.discountPercent > 0 && (
                        <span className="bg-rose-500 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded font-mono">
                          -{deal.discountPercent}% OFF
                        </span>
                      )}
                    </div>

                    {/* Breakdown prices */}
                    <div className="space-y-1.5 mb-4 font-mono text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Precio de Tienda (Folleto):</span>
                        <span className="text-slate-300 text-right">
                          {formatCurrency(deal.currentPrice, deal.currency)}
                        </span>
                      </div>

                      {deal.currency === 'USD' && (
                        <div className="flex justify-between">
                          <span className="text-slate-500">Base Pesificado:</span>
                          <span className="text-slate-300 text-right">
                            {formatCurrency(priceCalc.basePriceArs, 'ARS')}
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between font-mono text-xs text-rose-400">
                        <span>Impuestos AFIP + Provincias:</span>
                        <span className="text-right">
                          +{formatCurrency(priceCalc.taxesArs, 'ARS')}
                        </span>
                      </div>

                      {result.playtimeHours && (
                        <div className="flex justify-between font-mono text-[10px] text-indigo-400 border-t border-slate-850/40 pt-2 mt-2">
                          <span>Costo/Hora c/Impuesto:</span>
                          <span className="text-right font-black text-indigo-300">
                            $ {Math.round(priceCalc.finalPriceArs / result.playtimeHours)}/h ({(priceCalc.finalPriceArs / result.playtimeHours) < 300 ? '🔥 Excelente' : 'Estándar'})
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions & total price indicator */}
                  <div className="pt-3 border-t border-slate-850/60 flex items-center justify-between mt-auto">
                    <div>
                      <span className="text-[10px] text-slate-500 block">TOTAL ARGENTINA</span>
                      <span className="text-base font-extrabold text-emerald-400 font-mono">
                        {formatCurrency(priceCalc.finalPriceArs, 'ARS')}
                      </span>
                    </div>

                    {/* Quick subscribe discount alert */}
                    <button
                      onClick={() => {
                        playClickSound();
                        onAddCustomAlert(result.gameTitle, deal.platform, deal.currentPrice, deal.currency === 'USD');
                      }}
                      className="text-[11px] font-semibold text-sky-400 hover:text-sky-300 bg-sky-950/40 border border-sky-500/20 px-2 py-1.5 rounded-lg hover:bg-sky-950/50 transition-colors"
                      title="Suscribirse a alertas de baja de precio para este juego"
                    >
                      Seguir Precio
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Comparador de tiendas y Gráfico de evolución de precios */}
          <PriceHistoryAndCompare 
            gameTitle={result.gameTitle}
            deals={result.deals}
            taxConfig={taxConfig}
          />

          {/* AI summaries buy guide */}
          <div className="bg-amber-950/15 border border-amber-500/25 rounded-xl p-4 text-xs text-amber-200 flex gap-2">
            <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-white mb-0.5">Asesor de Compras Gamer IA</p>
              <p className="leading-relaxed">{result.aiSummary}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
