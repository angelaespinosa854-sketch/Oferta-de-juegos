import React, { useState, useEffect } from 'react';
import { 
  Gamepad2, 
  Trash2, 
  TrendingDown, 
  Sparkles, 
  Calculator, 
  Bell, 
  Percent, 
  Plus, 
  RefreshCw, 
  Coins, 
  Flame, 
  BadgeAlert, 
  ChevronRight, 
  ExternalLink,
  Search,
  CheckCircle,
  Clock,
  HelpCircle,
  DollarSign
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { Platform, TaxConfig, GameDeal, NotificationAlert, LiveNotification } from './types';
import { DEFAULT_TAX_CONFIG, calculatePrice, formatCurrency, getTaxPercentage } from './utils/taxCalculator';
import { DEFAULT_DEALS } from './data/defaultDeals';

// Import our custom components
import TaxCalculator from './components/TaxCalculator';
import GameSearch from './components/GameSearch';
import NotificationToast, { playChime } from './components/NotificationToast';
import { playClickSound, playTabSound, playSuccessSound, playDeleteSound } from './utils/audio';
import CommunityFeatures from './components/CommunityFeatures';
import GamerFAQ from './components/GamerFAQ';
import PowerTools from './components/PowerTools';
import PriceSparkline from './components/PriceSparkline';

export default function App() {
  // Config state with lazy initial load from localStorage for persistent tax config
  const [taxConfig, setTaxConfig] = useState<TaxConfig>(() => {
    try {
      const saved = localStorage.getItem('tgo_tax_config_v1');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Could not load saved taxConfig', e);
    }
    return DEFAULT_TAX_CONFIG;
  });

  // Persistent taxConfig saver
  useEffect(() => {
    try {
      localStorage.setItem('tgo_tax_config_v1', JSON.stringify(taxConfig));
    } catch (e) {
      console.warn('Could not save taxConfig', e);
    }
  }, [taxConfig]);

  // Notification Authorization status state for the Browser Push Notifications
  const [browserNotificationGranted, setBrowserNotificationGranted] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission === 'granted';
    }
    return false;
  });

  // Handler to request browser-level push notifications
  const requestBrowserNotificationPermission = async () => {
    playClickSound();
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const permission = await Notification.requestPermission();
        setBrowserNotificationGranted(permission === 'granted');
        if (permission === 'granted') {
          new Notification("🚀 ¡Cazador de Ofertas Activado!", {
            body: "Te notificaremos en tiempo real a través del escritorio cuando tus juegos de la Wishlist tengan súper ofertas.",
            icon: "/favicon.ico"
          });
        }
      } catch (err) {
        console.error("Error pidiendo permisos de notificacion", err);
      }
    } else {
      alert("Tu navegador o entorno de visualización no soporta Notificaciones nativas.");
    }
  };
  
  // Tab navigation: 'dashboard' | 'alerts' | 'calculator'
  const [activeTab, setActiveTab] = useState<'dashboard' | 'alerts' | 'calculator'>('dashboard');

  // Power User and Gamification states
  const [maxBudget, setMaxBudget] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('tgo_max_budget_v1');
      return saved ? parseInt(saved, 10) : 0;
    } catch {
      return 0;
    }
  });

  const [reputationXP, setReputationXP] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('tgo_reputation_xp_v1');
      return saved ? parseInt(saved, 10) : 120; // Default starter reputation
    } catch {
      return 120;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('tgo_max_budget_v1', maxBudget.toString());
    } catch (e) {
      console.warn(e);
    }
  }, [maxBudget]);

  useEffect(() => {
    try {
      localStorage.setItem('tgo_reputation_xp_v1', reputationXP.toString());
    } catch (e) {
      console.warn(e);
    }
  }, [reputationXP]);

  const addXP = (amount: number) => {
    setReputationXP(prev => prev + amount);
  };

  // Bulk wishlist imports handler
  const handleBulkImportAlerts = (titles: string[], platform: Platform) => {
    const newAlerts = titles.map(title => ({
      id: `alert-bulk-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      gameTitle: title,
      platform: platform,
      isActive: true,
      createdAt: new Date().toISOString()
    }));
    setAlerts(prev => [...prev, ...newAlerts]);
    triggerLiveNotification(`Wishlist Importada 📥`, `Se crearon ${titles.length} suscripciones de radar para tus juegos.`);
  };

  const triggerLiveNotification = (title: string, msg: string) => {
    const newNotif = {
      id: `live-notif-${Date.now()}`,
      title,
      message: msg,
      type: 'custom' as const,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: false
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  // Sync / App State
  const [alerts, setAlerts] = useState<NotificationAlert[]>([]);
  const [notifications, setNotifications] = useState<LiveNotification[]>([]);
  const [highlightDeals, setHighlightDeals] = useState<GameDeal[]>(DEFAULT_DEALS);
  const [isFetchingRates, setIsFetchingRates] = useState(false);
  const [isFetchingHighlights, setIsFetchingHighlights] = useState(false);
  const [ratesLastUpdated, setRatesLastUpdated] = useState<string>('');
  const [currencyDataSource, setCurrencyDataSource] = useState<string>('Precios estimativos');

  // Community Features hooks
  const { VoteWidget, TrendingPanel, handleRecordClick } = CommunityFeatures({
    monitoredGames: highlightDeals,
    onQuickSearch: (query) => {
      const searchInput = document.getElementById('ai-search-input') as HTMLInputElement | null;
      if (searchInput) {
        searchInput.value = query;
        const event = new Event('input', { bubbles: true });
        searchInput.dispatchEvent(event);
        setTimeout(() => {
          const searchForm = searchInput.closest('form');
          if (searchForm) {
            const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
            searchForm.dispatchEvent(new Event('submit', { bubbles: true }));
          }
        }, 50);
      }
      searchInput?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      searchInput?.focus();
    }
  });

  // Quick form for custom alerts tracking
  const [showAddAlert, setShowAddAlert] = useState(false);
  const [alertGameTitle, setAlertGameTitle] = useState('');
  const [alertPlatform, setAlertPlatform] = useState<Platform>(Platform.STEAM);
  const [alertPrice, setAlertPrice] = useState('');
  const [alertDiscountThreshold, setAlertDiscountThreshold] = useState<number>(0);
  const [alertSuccessMessage, setAlertSuccessMessage] = useState<string | null>(null);

  // Progressive Web App installation support state
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isPwaInstalled, setIsPwaInstalled] = useState<boolean>(false);

  // Dynamic Google SEO Index Simulator state
  const [seoGameTitle, setSeoGameTitle] = useState<string>('Elden Ring');
  const [seoPlatform, setSeoPlatform] = useState<string>('Steam');
  const [seoIntent, setSeoIntent] = useState<string>('Precios con Impuestos Argentina');

  // Sync state functions
  const fetchRates = async () => {
    setIsFetchingRates(true);
    try {
      const res = await fetch('/api/rates');
      const data = await res.json();
      if (data.success && data.rates) {
        setTaxConfig(prev => ({
          ...prev,
          dolarOficial: data.rates.dolarOficial
        }));
        setRatesLastUpdated(new Date(data.rates.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        setCurrencyDataSource(data.message || 'Sincronizado con DolarApi');
      }
    } catch (e) {
      console.error('No se pudieron obtener cotizaciones actualizadas', e);
    } finally {
      setIsFetchingRates(false);
    }
  };

  const fetchAlerts = async () => {
    try {
      const res = await fetch('/api/alerts');
      const data = await res.json();
      setAlerts(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      const data = await res.json();
      setNotifications(data);
    } catch (e) {
      console.error(e);
    }
  };

  // Try fetching live AI-recommended deals to replace generic ones
  const fetchLiveHighlights = async () => {
    setIsFetchingHighlights(true);
    try {
      const res = await fetch('/api/deals/highlights');
      const data = await res.json();
      if (data.success && data.games && data.games.length > 0) {
        // Map data from highlights endpoint to GameDeal models
        const mappedDeals = data.games.map((g: any, index: number) => ({
          id: `highlight-${index}-${Date.now()}`,
          title: g.title,
          platform: g.platform as Platform,
          currency: g.currency,
          originalPrice: g.originalPrice,
          currentPrice: g.currentPrice,
          discountPercent: g.discountPercent,
          imageUrl: g.imageUrl || getPlaceholderImageForGame(g.title),
          storeUrl: g.storeUrl || '#'
        }));
        setHighlightDeals(mappedDeals);
      }
    } catch (e) {
      console.warn('Usando ofertas predeterminadas de respaldo.', e);
    } finally {
      setIsFetchingHighlights(false);
    }
  };

  // Helper to assign a fitting thematic background placeholder
  const getPlaceholderImageForGame = (title: string): string => {
    const normalized = (title || '').toLowerCase().trim();
    
    // Custom official Nintendo links for Nintendo exclusives
    if (normalized.includes('zelda') || normalized.includes('breath of the wild') || normalized.includes('tears of the kingdom')) {
      return 'https://assets.nintendo.com/image/upload/ar_16:9,c_lpad,w_600/b_white/f_auto/q_auto/ncom/en_US/games/switch/t/the-legend-of-zelda-breath-of-the-wild-switch/hero';
    }
    if (normalized.includes('mario') || normalized.includes('odyssey') || normalized.includes('kart') || normalized.includes('luigi')) {
      return 'https://assets.nintendo.com/image/upload/ar_16:9,c_lpad,w_600/b_white/f_auto/q_auto/ncom/en_US/games/switch/s/super-mario-odyssey-switch/hero';
    }
    
    // Steam mapping by AppID for exact official banner covers
    let appId = '';
    
    if (normalized.includes('elden ring')) appId = '1245620';
    else if (normalized.includes('cyberpunk') || normalized.includes('phantom liberty')) appId = '1091500';
    else if (normalized.includes('hades ii') || normalized.includes('hades 2')) appId = '1145350';
    else if (normalized.includes('hades')) appId = '1142710';
    else if (normalized.includes('baldur') || normalized.includes('bg3')) appId = '1086940';
    else if (normalized.includes('hollow knight')) appId = '367520';
    else if (normalized.includes('red dead') || normalized.includes('rdr2') || normalized.includes('redemption')) appId = '1174180';
    else if (normalized.includes('minecraft legends')) appId = '1928870';
    else if (normalized.includes('gta') || normalized.includes('grand theft auto')) appId = '271590';
    else if (normalized.includes('spider-man') || normalized.includes('spiderman')) appId = '1817070';
    else if (normalized.includes('resident evil 4') || normalized.includes('re4')) appId = '2050650';
    else if (normalized.includes('resident evil')) appId = '418370';
    else if (normalized.includes('god of war') || normalized.includes('ragnarok') || normalized.includes('ragnarök')) appId = '2322010';
    else if (normalized.includes('sekiro')) appId = '814380';
    else if (normalized.includes('celeste')) appId = '504230';
    else if (normalized.includes('fc 25') || normalized.includes('fc25') || normalized.includes('fifa') || normalized.includes('fc 26') || normalized.includes('fc 24')) appId = '2669320';
    else if (normalized.includes('counter-strike') || normalized.includes('cs2') || normalized.includes('cs:go')) appId = '730';
    else if (normalized.includes('witcher')) appId = '292030';
    else if (normalized.includes('hogwarts')) appId = '990080';
    else if (normalized.includes('helldivers')) appId = '553850';
    else if (normalized.includes('stardew')) appId = '413150';
    else if (normalized.includes('terraria')) appId = '105600';
    else if (normalized.includes('portal')) appId = '620';
    else if (normalized.includes('rust')) appId = '252490';
    else if (normalized.includes('fallout 4')) appId = '377160';
    else if (normalized.includes('fallout')) appId = '1151340';
    else if (normalized.includes('skyrim')) appId = '489830';
    else if (normalized.includes('forza')) appId = '1551360';
    else if (normalized.includes('wukong') || normalized.includes('black myth')) appId = '2358720';
    else if (normalized.includes('tsushima')) appId = '2215430';
    else if (normalized.includes('palworld')) appId = '1623730';
    
    if (appId) {
      return `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/header.jpg`;
    }
    
    // Dynamic choice from beautiful game design imagery if we don't recognize the title
    const fallbacks = [
      'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&auto=format&fit=crop&q=60',
      'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&auto=format&fit=crop&q=60',
      'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=600&auto=format&fit=crop&q=60',
      'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop&q=60'
    ];
    let sum = 0;
    for (let i = 0; i < normalized.length; i++) {
      sum += normalized.charCodeAt(i);
    }
    return fallbacks[sum % fallbacks.length];
  };

  // Dynamic SEO Title & Meta update based on active selected games
  useEffect(() => {
    if (seoGameTitle) {
      document.title = `Precios de ${seoGameTitle} en ${seoPlatform} con Impuestos | TheGameOff`;
      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.setAttribute('name', 'description');
        document.head.appendChild(metaDesc);
      }
      metaDesc.setAttribute('content', `Compará precios finales de ${seoGameTitle} para ${seoPlatform} en las tiendas oficiales de Argentina. Calculá IVA digital, PAIS y IIBB actualizados.`);
    }
  }, [seoGameTitle, seoPlatform]);

  // PWA installers registration & trackers
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((reg) => console.log('PWA Service Worker registrado en scope:', reg.scope))
        .catch((err) => console.log('Modo de prueba Sandbox - SW con registro diferido:', err));
    }

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Triggered on page load & refresh
  useEffect(() => {
    fetchRates();
    fetchAlerts();
    fetchNotifications();
    
    // Attempt to load current fresh deals via search grounding in background
    fetchLiveHighlights();

    // Setup live polling every 5.5 seconds to query new notification updates
    const pollInterval = setInterval(() => {
      fetchNotifications();
      fetchAlerts();
    }, 5500);

    return () => clearInterval(pollInterval);
  }, []);

  // Subscribe alert hander
  const handleAddAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!alertGameTitle.trim()) return;

    try {
      const isUSD = alertPlatform === Platform.STEAM || alertPlatform === Platform.PLAYSTATION;
      const payload: any = {
        gameTitle: alertGameTitle.trim(),
        platform: alertPlatform,
      };

      if (alertPrice) {
        if (isUSD) {
          payload.targetPriceUsd = parseFloat(alertPrice);
        } else {
          payload.targetPriceArs = parseFloat(alertPrice);
        }
      }

      if (alertDiscountThreshold > 0) {
        payload.discountPercentThreshold = alertDiscountThreshold;
      }

      const res = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setAlertGameTitle('');
        setAlertPrice('');
        setAlertDiscountThreshold(0);
        fetchAlerts();
        fetchNotifications();
        playSuccessSound();
        addXP(25); // Award hunter reputation XP
        
        setAlertSuccessMessage(`¡Preciometro configurado! Te avisaremos cuando ${payload.gameTitle} baje de precio.`);
        setTimeout(() => setAlertSuccessMessage(null), 4000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Quick subscribe handler from find result
  const handleQuickAddAlertFromSearch = async (gameTitle: string, platform: Platform, currentPrice: number, isUSD: boolean) => {
    try {
      const payload = {
        gameTitle,
        platform,
        [isUSD ? 'targetPriceUsd' : 'targetPriceArs']: Math.round(currentPrice * 0.9) // Alert if drops 10% more
      };

      const res = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        fetchAlerts();
        fetchNotifications();
        playSuccessSound();
        addXP(15); // Award hunter search tracking XP

        setAlertSuccessMessage(`¡Agregado!: Configurado aviso para ${gameTitle} si baja de ${isUSD ? 'u$s' : '$'} ${payload[isUSD ? 'targetPriceUsd' : 'targetPriceArs']}`);
        setTimeout(() => setAlertSuccessMessage(null), 4505);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Delete Alert subscription
  const handleDeleteAlert = async (id: string) => {
    try {
      const res = await fetch(`/api/alerts/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setAlerts(prev => prev.filter(a => a.id !== id));
        playDeleteSound();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Simulate new real-time alert callback
  const handleSimulateDeal = async () => {
    try {
      const res = await fetch('/api/notifications/simulate-deal', { method: 'POST' });
      if (res.ok) {
        fetchNotifications();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const res = await fetch('/api/notifications/mark-read', { method: 'POST' });
      if (res.ok) {
        fetchNotifications();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Computed live general indicators
  const totalTaxMultiplier = 1 + taxConfig.iva + taxConfig.pais + taxConfig.ganancias + taxConfig.iibbRate;
  const computedDolarTarjeta = taxConfig.dolarOficial * totalTaxMultiplier;

  // Computed matching wishlist items meeting criteria
  // 1. Price is lower than alert price limit (USD or ARS)
  // 2. OR discount is greater than or equal to 50%
  const wishlistAlertMatches = React.useMemo(() => {
    const matches: { alert: NotificationAlert; deal: GameDeal; reason: string }[] = [];
    
    alerts.forEach(alert => {
      const matchingDeal = highlightDeals.find(deal => {
        const normTitle = deal.title.toLowerCase().replace(/[^a-z0-9]/g, '');
        const normAlertTitle = alert.gameTitle.toLowerCase().replace(/[^a-z0-9]/g, '');
        const isPlatformMatch = alert.platform === 'TODOS' || deal.platform === alert.platform || alert.platform === 'Steam' && deal.platform === 'Steam' || alert.platform === 'Xbox Store' && deal.platform === 'Xbox Store' || alert.platform === 'PlayStation Store' && deal.platform === 'PlayStation Store' || alert.platform === 'Nintendo eShop' && deal.platform === 'Nintendo eShop';
        
        return isPlatformMatch && (normTitle.includes(normAlertTitle) || normAlertTitle.includes(normTitle));
      });

      if (matchingDeal) {
        let isMatch = false;
        let reason = '';

        if (matchingDeal.discountPercent >= 50) {
          isMatch = true;
          reason = `🔥 Súper Descuentazo de ${matchingDeal.discountPercent}% OFF en ${matchingDeal.platform}`;
        }

        const isUSD = matchingDeal.currency === 'USD';
        if (isUSD && alert.targetPriceUsd && matchingDeal.currentPrice <= alert.targetPriceUsd) {
          isMatch = true;
          reason = `🎯 Alcanzó precio ideal: u$s ${matchingDeal.currentPrice} (Límite: u$s ${alert.targetPriceUsd}) en ${matchingDeal.platform}`;
        } else if (!isUSD && alert.targetPriceArs && matchingDeal.currentPrice <= alert.targetPriceArs) {
          isMatch = true;
          reason = `🎯 Alcanzó precio ideal: $${matchingDeal.currentPrice} ARS (Límite: $${alert.targetPriceArs}) en ${matchingDeal.platform}`;
        }

        if (isMatch) {
          // Prevent duplicates
          if (!matches.some(m => m.deal.id === matchingDeal.id)) {
            matches.push({
              alert,
              deal: matchingDeal,
              reason
            });
          }
        }
      }
    });

    return matches;
  }, [alerts, highlightDeals]);

  // Track already notified IDs to prevent repetitiveness or spamming
  const notifiedIdsRef = React.useRef<string[]>([]);

  useEffect(() => {
    if (browserNotificationGranted && wishlistAlertMatches.length > 0) {
      wishlistAlertMatches.forEach(match => {
        const id = match.deal.id;
        if (!notifiedIdsRef.current.includes(id)) {
          notifiedIdsRef.current.push(id);
          // Dispatch HTML5 Native System Desktop Notification
          try {
            if ('Notification' in window) {
              new Notification(`🎯 ¡Oferta en Radar!: ${match.deal.title}`, {
                body: `${match.reason}. ¡Corré a buscarlo en ${match.deal.platform}!`,
                icon: match.deal.imageUrl || "/favicon.ico"
              });
            }
          } catch (e) {
            console.warn("No se pudo disparar la notificación nativa de escritorio:", e);
          }
        }
      });
    }
  }, [wishlistAlertMatches, browserNotificationGranted]);

  // Render variables for premium highlights grid
  const primaryFeatured = highlightDeals[0];
  const listFeatured = highlightDeals.slice(1, 4);
  const remainingDeals = highlightDeals.slice(4);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e0e0e0] font-sans antialiased selection:bg-indigo-500/30 selection:text-white flex flex-col">
      
      {/* Top Sophisticated Navigation Bar */}
      <nav className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-[#000000] sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-indigo-950 border border-indigo-500/20 rounded flex items-center justify-center font-bold text-indigo-400 text-xs font-mono tracking-wider">
            TGO
          </div>
          <span className="text-lg font-bold tracking-widest text-white uppercase font-serif">
            thegame<span className="text-indigo-400 font-sans font-light">off</span>
          </span>
        </div>

        {/* Navigation tabs */}
        <div className="hidden md:flex gap-6 text-xs font-semibold text-white/50 tracking-wide uppercase">
          <button
            onClick={() => {
              playTabSound();
              setActiveTab('dashboard');
            }}
            className={`transition-colors py-1 relative ${
              activeTab === 'dashboard' ? 'text-white font-bold' : 'hover:text-white/80'
            }`}
            id="tab-dashboard"
          >
            Catálogo
            {activeTab === 'dashboard' && (
              <span className="absolute bottom-[-16px] left-0 right-0 h-[2.5px] bg-indigo-500" />
            )}
          </button>
          
          <button
            onClick={() => {
              playTabSound();
              setActiveTab('alerts');
            }}
            className={`transition-colors py-1 relative ${
              activeTab === 'alerts' ? 'text-white font-bold' : 'hover:text-white/80'
            }`}
            id="tab-alerts"
          >
            Mis Alertas ({alerts.length})
            {activeTab === 'alerts' && (
              <span className="absolute bottom-[-16px] left-0 right-0 h-[2.5px] bg-indigo-500" />
            )}
          </button>
          
          <button
            onClick={() => {
              playTabSound();
              setActiveTab('calculator');
            }}
            className={`transition-colors py-1 relative ${
              activeTab === 'calculator' ? 'text-white font-bold' : 'hover:text-white/80'
            }`}
            id="tab-calculator"
          >
            Calculadora AFIP
            {activeTab === 'calculator' && (
              <span className="absolute bottom-[-16px] left-0 right-0 h-[2.5px] bg-indigo-500" />
            )}
          </button>
        </div>

        {/* Real-Time Live status & Toast alerts component */}
        <div className="flex items-center gap-4">
          <div className="hidden lg:flex items-center gap-2 bg-green-500/5 border border-green-500/20 px-3 py-1 rounded-full text-[10px] text-green-400 font-mono tracking-tight shadow-sm">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            Dólar Tarjeta: {formatCurrency(computedDolarTarjeta, 'ARS')}
          </div>

          <NotificationToast 
            notifications={notifications}
            onMarkAllRead={handleMarkAllRead}
            onSimulateDeal={handleSimulateDeal}
          />
        </div>
      </nav>

      {/* Floating success messages */}
      <AnimatePresence>
        {alertSuccessMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 p-4 bg-teal-900 border border-teal-500 rounded-xl shadow-xl flex items-center gap-3 text-xs text-white max-w-sm"
          >
            <CheckCircle className="w-5 h-5 text-teal-300 shrink-0" />
            <p className="font-medium">{alertSuccessMessage}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-grow max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-hidden">
        
        {/* Left Side: Live notification list & Subscription forms - 3 Cols on desktop */}
        <section className="lg:col-span-3 flex flex-col gap-5">
          
          {/* Main quick stats card */}
          <div className="bg-slate-900/40 border border-white/5 rounded-xl p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Impuestos Actuales</span>
              <span className="text-[10px] bg-indigo-950/80 text-indigo-400 px-2 py-0.5 rounded-full font-mono font-semibold">
                +{(getTaxPercentage(taxConfig))}%
              </span>
            </div>
            
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-300">
                <span>Dólar Tarjeta</span>
                <span className="font-bold font-mono text-white">{formatCurrency(computedDolarTarjeta, 'ARS')}</span>
              </div>
              <div className="flex justify-between items-center text-slate-400 text-[11px]">
                <span>Dólar Tienda Base</span>
                <span className="font-mono">{formatCurrency(taxConfig.dolarOficial, 'ARS')}</span>
              </div>
              <div className="flex justify-between items-center text-slate-400 text-[11px]">
                <span>Provincia ({taxConfig.iibbProvince.split(' ')[0]})</span>
                <span className="font-mono">{(taxConfig.iibbRate * 100).toFixed(1)}% IIBB</span>
              </div>
            </div>

            <button
              onClick={() => {
                playTabSound();
                setActiveTab('calculator');
              }}
              className="mt-2 text-center text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold bg-indigo-950/20 hover:bg-indigo-950/40 py-1.5 rounded-lg border border-indigo-500/10 transition-colors"
            >
              Ajustar Impuestos u Oficial
            </button>
          </div>

          {/* Quick configure alerts section */}
          <div className="bg-slate-900 border border-white/5 rounded-xl p-4 flex flex-col gap-3">
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-white/90 font-serif flex items-center gap-1.5">
              <BadgeAlert className="w-3.5 h-3.5 text-indigo-400" />
              Seguimiento de Precios
            </h3>
            
            <form onSubmit={handleAddAlert} className="space-y-3 mt-1">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Título del Juego *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Silksong, FIFA, etc."
                  value={alertGameTitle}
                  onChange={(e) => setAlertGameTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 p-2 rounded text-xs text-white outline-none"
                  id="alert-game-title-input"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-1">
                  <label className="text-[10px] text-slate-400 block mb-1">Tienda</label>
                  <select
                    value={alertPlatform}
                    onChange={(e) => setAlertPlatform(e.target.value as Platform)}
                    className="w-full bg-slate-950 border border-slate-800 p-2 rounded text-[11px] text-slate-300 pointer"
                    id="alert-store-select"
                  >
                    <option value={Platform.STEAM}>Steam (USD)</option>
                    <option value={Platform.PLAYSTATION}>Sony (USD)</option>
                    <option value={Platform.XBOX}>Xbox (ARS)</option>
                    <option value={Platform.NINTENDO}>eShop (ARS)</option>
                  </select>
                </div>
                <div className="col-span-1">
                  <label className="text-[10px] text-slate-400 block mb-1">Límite aviso</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="$< Límite"
                    value={alertPrice}
                    onChange={(e) => setAlertPrice(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 p-2 rounded text-[11px] text-white font-mono outline-none"
                    id="alert-target-price-input"
                  />
                </div>
                <div className="col-span-1">
                  <label className="text-[10px] text-slate-400 block mb-1">Dcto Mín.</label>
                  <select
                    value={alertDiscountThreshold}
                    onChange={(e) => setAlertDiscountThreshold(parseInt(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 p-2 rounded text-[11px] text-slate-300 pointer font-mono"
                    id="alert-discount-select"
                  >
                    <option value="0">Cualquiera</option>
                    <option value="30">&gt;=30%</option>
                    <option value="50">&gt;=50%</option>
                    <option value="70">&gt;=70%</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-colors flex items-center justify-center gap-1"
                id="alert-create-btn"
              >
                <Plus className="w-3.5 h-3.5" />
                Guardar en Radar
              </button>
            </form>
          </div>

          {/* Quick tips about games in Argentina */}
          <div className="p-3 bg-indigo-950/10 border border-indigo-500/20 rounded-xl">
            <p className="text-[11px] text-indigo-300 leading-relaxed font-sans">
              💡 <strong>Tip Gamer:</strong> Xbox y Nintendo suelen tributar un poco menos por pesificación oficial regional de forma nativa. Siempre compará antes de comprar.
            </p>
          </div>

          <TrendingPanel />

          {/* Interactive Google SEO Console Simulator */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-3">
            <div className="flex items-center gap-1.5 border-b border-white/5 pb-2">
              <span className="text-[11px] font-black uppercase tracking-widest text-[#a5b4fc] font-serif">
                🔍 Consola SEO Google
              </span>
            </div>
            <p className="text-[10px] text-slate-400 leading-tight">
              Probá cómo se ve la indexación de THEGAMEOFF en los resultados de Google cuando busquen precios:
            </p>

            <div className="space-y-2 mt-1">
              <div>
                <label className="text-[9px] text-slate-500 block uppercase font-mono tracking-wider">Juego simulado</label>
                <input 
                  type="text" 
                  value={seoGameTitle} 
                  onChange={(e) => setSeoGameTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 p-1.5 rounded text-[11px] text-white font-sans outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <div>
                  <label className="text-[9px] text-slate-500 block uppercase font-mono tracking-wider">Tienda</label>
                  <select 
                    value={seoPlatform} 
                    onChange={(e) => setSeoPlatform(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 p-1.5 rounded text-[10px] text-slate-300 pointer font-sans"
                  >
                    <option value="Steam">Steam</option>
                    <option value="Xbox Store">Xbox Store</option>
                    <option value="Nintendo eShop">Nintendo</option>
                    <option value="Sony PSN">PS Store</option>
                  </select>
                </div>
                <div>
                  <label className="text-[9px] text-slate-500 block uppercase font-mono tracking-wider">Intento</label>
                  <select 
                    value={seoIntent} 
                    onChange={(e) => setSeoIntent(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 p-1.5 rounded text-[10px] text-slate-300 pointer font-sans"
                  >
                    <option value="Precios con Impuestos">Impuestos</option>
                    <option value="Ofertas Baratas">Ofertas</option>
                    <option value="Dólar Tarjeta">Dólar</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Google Search Result Mock styling */}
            <div className="bg-white text-slate-900 p-3 rounded-lg text-left shadow-md mt-1 select-none text-[11px] font-sans">
              <div className="flex items-center gap-1.5 text-[9px] text-[#202124] truncate mb-1">
                <span>https://thegameoff.com</span>
                <span>›</span>
                <span>juegos</span>
                <span>›</span>
                <span className="font-mono text-[8.5px] text-slate-500 truncate">
                  {seoGameTitle.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-')}
                </span>
              </div>
              <h4 className="text-[12px] font-sans font-medium text-[#1a0dab] line-clamp-1 hover:underline cursor-pointer leading-tight">
                Precios de {seoGameTitle} en {seoPlatform} con Impuestos | TheGameOff
              </h4>
              <p className="text-[10px] text-[#4d5156] leading-snug line-clamp-2 mt-0.5 font-sans">
                ¿Cuánto sale realmente {seoGameTitle} en {seoPlatform} Argentina? Calculá {seoIntent.toLowerCase()} de IVA digital, PAIS e IIBB al {((getTaxPercentage(taxConfig)))}% hoy.
              </p>
            </div>
            
            <span className="text-[9px] text-indigo-400 text-center block font-mono bg-indigo-950/40 border border-indigo-500/10 py-1 rounded">
              🎯 ¡Metadatos Dinámicos Configurados!
            </span>
          </div>
        </section>

        {/* Right Content Panels: Tabbed section representing dashboard or lists - 9 Cols on desktop */}
        <section className="lg:col-span-9 flex flex-col gap-6 overflow-hidden">
          
          {/* Mobile responsive view tabs */}
          <div className="flex md:hidden border-b border-white/10 pb-2 gap-3 justify-center text-xs font-bold uppercase text-slate-500">
            <button 
              onClick={() => {
                playTabSound();
                setActiveTab('dashboard');
              }}
              className={activeTab === 'dashboard' ? 'text-white border-b-2 border-indigo-500 pb-1' : ''}
            >
              Destacados
            </button>
            <button 
              onClick={() => {
                playTabSound();
                setActiveTab('alerts');
              }}
              className={activeTab === 'alerts' ? 'text-white border-b-2 border-indigo-500 pb-1' : ''}
            >
              Alertas ({alerts.length})
            </button>
            <button 
              onClick={() => {
                playTabSound();
                setActiveTab('calculator');
              }}
              className={activeTab === 'calculator' ? 'text-white border-b-2 border-indigo-500 pb-1' : ''}
            >
              Impuestos
            </button>
          </div>

          {/* Tab 1: Dashboard with Prominent Deals & AI Price Searcher */}
          {activeTab === 'dashboard' && (
            <div className="flex flex-col gap-6 animate-fade-in">
              
              {/* Grand Gallery Hero Header section */}
              <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-widest text-white font-serif uppercase">Ofertas Destacadas</h1>
                <p className="text-slate-400 text-xs mt-1 flex items-center gap-1.5 flex-wrap">
                  <span>Precios finales argentinos calculados automáticamente con impuestos.</span>
                  <span className="inline-block w-1.5 h-1.5 bg-indigo-400 rounded-full" />
                  <span className="text-slate-500 font-mono text-[11px] flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    {ratesLastUpdated ? `Sincronización cambiaria: ${ratesLastUpdated} (hoy)` : 'Sincronizado vía dolaroficial'}
                  </span>
                </p>
              </div>

              {/* PWA Smart Installation Banner */}
              {!isPwaInstalled && (
                <div className="bg-gradient-to-r from-indigo-950 via-[#18113c] to-slate-950 border border-indigo-500/25 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-900/50 border border-indigo-400/20 rounded-xl flex items-center justify-center text-lg shadow-inner shrink-0">
                      📱
                    </div>
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-widest text-amber-300 font-serif">Instalá TheGameOff en tu Celular</h4>
                      <p className="text-slate-300 text-[11px] mt-0.5 leading-tight">
                        Accedé al instante, activá el motor offline de servicio y ganá <strong className="text-amber-400">+100 reputación XP</strong> de cazador.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto shrink-0 justify-end">
                    <button 
                      onClick={() => setIsPwaInstalled(true)} 
                      className="px-3 py-1 text-[10px] text-slate-500 hover:text-slate-300 font-mono transition-colors"
                    >
                      Omitir
                    </button>
                    <button
                      onClick={async () => {
                        // Native or simulated installation
                        if (deferredPrompt) {
                          try {
                            deferredPrompt.prompt();
                            const { outcome } = await deferredPrompt.userChoice;
                            if (outcome === 'accepted') {
                              setIsPwaInstalled(true);
                              addXP(100);
                              triggerLiveNotification("App Instalada 📱", "¡Ganaste +100 XP por sumar TheGameOff a tus apps!");
                            }
                          } catch (err) {
                            console.log(err);
                          }
                        } else {
                          // Simulated installation for sandboxed environments
                          setIsPwaInstalled(true);
                          addXP(100);
                          triggerLiveNotification("PWA Instalada 📱", "¡Simulación de instalación exitosa! Recibiste +100 reputación XP.");
                        }
                      }}
                      className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-[10px] uppercase tracking-wider rounded-xl transition duration-150 shadow animate-pulse"
                    >
                      Instalar App ⚡
                    </button>
                  </div>
                </div>
              )}

              {/* Oportunidades de tu Wishlist / Radar section */}
              {alerts.length > 0 && (
                <div className="bg-slate-900 border border-indigo-500/15 rounded-xl p-4 shadow-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-amber-500 shrink-0" />
                      <h3 className="text-xs font-bold uppercase tracking-widest text-white font-serif">
                        Wishlist y Radar de Precios
                      </h3>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                      {wishlistAlertMatches.length > 0 ? `${wishlistAlertMatches.length} Alertas Cumplidas 🎯` : 'Escáner Activo 🔍'}
                    </span>
                  </div>

                  {wishlistAlertMatches.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3" id="wishlist-alert-matched-grid">
                      {wishlistAlertMatches.map((match, index) => {
                        const finalPriceCalc = calculatePrice(match.deal.currentPrice, match.deal.currency, taxConfig);
                        return (
                          <div 
                            key={index}
                            className="bg-slate-950/70 border border-amber-500/25 rounded-xl p-3 flex flex-col justify-between hover:border-amber-500/50 transition-all"
                          >
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] bg-amber-950/40 border border-amber-500/25 text-amber-300 font-bold px-1.5 py-0.5 rounded uppercase font-mono tracking-wider">
                                  {match.deal.platform}
                                </span>
                                <span className="text-[10px] text-rose-400 font-bold font-mono">-{match.deal.discountPercent}% OFF</span>
                              </div>
                              <h4 className="text-sm font-bold text-white truncate">{match.deal.title}</h4>
                              <p className="text-[11px] text-indigo-300 mt-1 mb-3">{match.reason}</p>
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-slate-850/50 mt-auto">
                              <div>
                                <span className="text-[8px] text-slate-500 block font-mono">PRECIO CON IMPUESTOS</span>
                                <span className="text-sm font-extrabold text-emerald-400 font-mono">
                                  {formatCurrency(finalPriceCalc.finalPriceArs, 'ARS')}
                                </span>
                              </div>
                              <a
                                href={match.deal.storeUrl || '#'}
                                onClick={() => playClickSound()}
                                target="_blank"
                                rel="noreferrer"
                                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[10px] px-2.5 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1 uppercase tracking-wide"
                              >
                                Comprar 🛒
                              </a>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 leading-normal bg-slate-950/30 p-2.5 rounded-lg border border-slate-850/60 font-medium font-sans">
                      Actualmente tus <strong className="text-indigo-400">{alerts.length} juegos en radar</strong> no presentan ofertas mayores al 50% ni han caído por debajo de tu precio ideal. ¡Seguimos vigilando todas las tiendas oficiales en pesos y dólares!
                    </p>
                  )}

                  {/* Push/Browser notification interactive toggle inside the wishlist container */}
                  <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2" id="push-notification-wishlist-status-bar">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${browserNotificationGranted ? 'bg-indigo-400 animate-pulse' : 'bg-slate-600'}`} />
                      <span className="text-[11px] text-slate-400 font-medium font-sans">
                        {browserNotificationGranted 
                          ? 'Modo "Cazador de Ofertas" activo: Te avisaremos con notificaciones push de escritorio' 
                          : 'Notificaciones nativas del navegador desactivadas'}
                      </span>
                    </div>

                    {!browserNotificationGranted ? (
                      <button
                        onClick={requestBrowserNotificationPermission}
                        className="bg-indigo-950 hover:bg-indigo-900 text-indigo-300 hover:text-white border border-indigo-500/20 px-2.5 py-1 rounded text-[10px] font-bold uppercase transition-colors self-start sm:self-center"
                        id="btn-toggle-push-notif"
                      >
                        Activar Alertas de Escritorio 🚀
                      </button>
                    ) : (
                      <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest font-bold">
                        Vigilante de Precios ON 🛡️
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Power User and Gamification hub */}
              <div className="mt-2.5">
                <PowerTools 
                  maxBudget={maxBudget}
                  setMaxBudget={setMaxBudget}
                  reputationXP={reputationXP}
                  addXP={addXP}
                  onBulkImportAlerts={handleBulkImportAlerts}
                  taxRatesJsonStr={JSON.stringify(taxConfig)}
                />
              </div>

              {/* Duelo de Precios: El deal más competitivo del momento en Argentina */}
              {(() => {
                const duelWinner = [...highlightDeals].sort((a, b) => b.discountPercent - a.discountPercent)[0];
                if (!duelWinner) return null;
                const winnerPrice = calculatePrice(duelWinner.currentPrice, duelWinner.currency, taxConfig);
                return (
                  <div className="bg-gradient-to-r from-indigo-950/40 via-purple-950/30 to-[#120412]/40 border border-indigo-500/20 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
                    <div className="flex items-center gap-3.5">
                      <div className="w-11 h-11 bg-indigo-950 border border-indigo-500/30 rounded-xl flex items-center justify-center font-bold text-indigo-400 text-base shadow-inner shrink-0 animate-pulse">
                        🔥
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[9px] font-mono tracking-widest text-indigo-300 uppercase font-black bg-indigo-950/70 border border-indigo-500/15 px-2.5 py-0.5 rounded-full">
                            Duelo de Precios AR: Mayor % de Descuento
                          </span>
                          <span className="text-[9px] font-mono font-bold text-rose-400 bg-rose-950/45 border border-rose-500/15 px-2 py-0.5 rounded-full">
                            -{duelWinner.discountPercent}% OFF HISTÓRICO
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-white mt-1.5 flex items-center gap-2 font-serif uppercase tracking-wide">
                          {duelWinner.title}
                        </h4>
                        <p className="text-slate-400 text-xs mt-0.5">
                          En la tienda <strong className="text-indigo-400">{duelWinner.platform}</strong> a un valor oficial de {formatCurrency(duelWinner.currentPrice, duelWinner.currency)} ({formatCurrency(winnerPrice.finalPriceArs, 'ARS')} final c/ imp.)
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleQuickAddAlertFromSearch(duelWinner.title, duelWinner.platform, duelWinner.currentPrice, duelWinner.currency === 'USD')}
                      className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-[10px] uppercase tracking-wider px-4 py-2.5 rounded-xl transition shadow-lg shrink-0"
                    >
                      Vigilar Campeón 🏹
                    </button>
                  </div>
                );
              })()}

              {/* Grid 9 for Deals Layout (1 Big heroic deal, 2 smaller card blocks) */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                
                {/* Large Hero epic deal card */}
                {primaryFeatured && (() => {
                  const dealPrice = calculatePrice(primaryFeatured.currentPrice, primaryFeatured.currency, taxConfig);
                  const dealOriginal = calculatePrice(primaryFeatured.originalPrice, primaryFeatured.currency, taxConfig);

                  return (
                    <div 
                      className="relative rounded-2xl overflow-hidden group border border-white/10 flex flex-col h-[340px] xl:h-[400px] justify-end bg-slate-950 p-6 shadow-xl"
                      id="hero-deal-card"
                    >
                      {/* Photo background with dark gradients */}
                      <div 
                        className="absolute inset-0 bg-cover bg-center opacity-40 group-hover:scale-105 transition-transform duration-700"
                        style={{ backgroundImage: `url('${primaryFeatured.imageUrl}')` }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent" />

                      {/* Sale Tag badge */}
                      <div className="absolute top-5 left-5 z-20 bg-rose-600 text-white font-bold text-xs tracking-wider px-2.5 py-1 rounded font-mono uppercase shadow-md shadow-rose-950/50">
                        {primaryFeatured.discountPercent}% OFF
                      </div>

                      {/* Platform tag */}
                      <div className="absolute top-5 right-5 z-20 bg-slate-900/90 text-indigo-400 border border-indigo-500/20 font-mono text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded shadow">
                        {primaryFeatured.platform}
                      </div>

                      {/* Information content */}
                      <div className="relative z-20 mt-auto flex flex-col gap-2.5" onClick={() => handleRecordClick(primaryFeatured.title)}>
                        <div>
                          <div className="flex items-center justify-between gap-2.5 mb-1.5">
                            <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-[#a5b4fc]">
                              Tendencia en Argentina
                            </span>
                            <VoteWidget dealId={primaryFeatured.id} />
                          </div>

                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            {primaryFeatured.metacriticScore && (
                              <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold border flex items-center gap-1 ${
                                primaryFeatured.metacriticScore >= 90 
                                  ? 'bg-emerald-950/85 border-emerald-500/35 text-emerald-400' 
                                  : 'bg-amber-950/85 border-amber-500/35 text-amber-400'
                              }`} title="Puntaje Metacritic Oficial">
                                 Metacritic: {primaryFeatured.metacriticScore}/100
                              </span>
                            )}
                            {primaryFeatured.playtimeHours && (
                              <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-slate-900/85 border border-slate-800 text-slate-300 flex items-center gap-1" title="Duración estimada en HowLongToBeat">
                                ⏱️ HLTB: {primaryFeatured.playtimeHours}h
                              </span>
                            )}
                          </div>

                          <h3 className="text-2xl font-bold tracking-tight text-white group-hover:text-indigo-200 transition-colors">
                            {primaryFeatured.title}
                          </h3>
                        </div>

                        <div className="flex justify-between items-end bg-slate-950/60 p-3 rounded-lg backdrop-blur-sm border border-white/5">
                          <div>
                            <span className="text-[10px] text-slate-400 block font-sans">Precio base tienda</span>
                            <span className="text-xs text-slate-400 line-through font-mono font-medium">
                              {formatCurrency(primaryFeatured.originalPrice, primaryFeatured.currency)}
                            </span>
                            <span className="text-sm font-bold text-white font-mono ml-1.5">
                              {formatCurrency(primaryFeatured.currentPrice, primaryFeatured.currency)}
                            </span>
                          </div>

                          <div className="text-right">
                            <span className="text-[10px] text-emerald-400 font-bold block uppercase tracking-wide">Final c/ Impuestos</span>
                            <strong className="text-2xl font-extrabold text-[#34d399] font-mono tracking-tight glow-text block">
                              {formatCurrency(dealPrice.finalPriceArs, 'ARS')}
                            </strong>
                            <span className="text-[9px] text-slate-500 block font-mono">
                              (Base {formatCurrency(dealPrice.basePriceArs)} + {formatCurrency(dealPrice.taxesArs)} Impuestazo)
                            </span>
                          </div>
                        </div>

                        {/* Interactive trigger links */}
                        <div className="flex gap-2.5 mt-1 text-xs">
                          <button
                            onClick={() => handleQuickAddAlertFromSearch(primaryFeatured.title, primaryFeatured.platform, primaryFeatured.currentPrice, primaryFeatured.currency === 'USD')}
                            className="flex-1 bg-white/5 hover:bg-white/10 active:bg-white/15 border border-white/10 text-white font-semibold py-2 rounded-lg text-center transition-colors"
                          >
                            Configurar Radar / Alerta
                          </button>
                          
                          {primaryFeatured.storeUrl && (
                            <a
                              href={primaryFeatured.storeUrl}
                              onClick={() => playClickSound()}
                              target="_blank"
                              rel="noreferrer"
                              className="px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg flex items-center justify-center transition-colors border border-indigo-500/10"
                              title="Visitar Tienda Oficial"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Smaller list of secondary outstanding deals */}
                <div className="flex flex-col gap-4">
                  <span className="text-[11px] font-bold tracking-widest text-slate-500 uppercase">
                    Otras Ofertas Importantes
                  </span>

                  <div className="flex-1 flex flex-col gap-3 justify-between">
                    {listFeatured.map((deal) => {
                      const dealPriceCalculated = calculatePrice(deal.currentPrice, deal.currency, taxConfig);

                      return (
                        <div 
                          key={deal.id}
                          className="rounded-xl border border-white/5 p-3.5 bg-slate-900/50 hover:bg-slate-900/80 hover:border-indigo-500/20 transition-all flex gap-4 items-center"
                        >
                          <div 
                            className="w-16 h-16 rounded-lg bg-slate-950 overflow-hidden bg-cover bg-center shrink-0 border border-white/5"
                            style={{ backgroundImage: `url('${deal.imageUrl || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=150&auto=format&fit=crop&q=60'}')` }}
                          />

                          <div className="flex-grow min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[9px] text-indigo-400 font-bold uppercase tracking-wider">{deal.platform}</span>
                              <span className="text-[8px] font-mono text-rose-400 bg-rose-950/40 px-1 py-0.2 rounded">-{deal.discountPercent}% OFF</span>

                              {maxBudget > 0 && (
                                <span className={`text-[8px] px-1 py-0.2 rounded font-mono font-bold ${
                                  dealPriceCalculated.finalPriceArs <= maxBudget 
                                    ? 'bg-teal-950/60 text-teal-300' 
                                    : 'bg-rose-950/60 text-rose-300'
                                }`} title={dealPriceCalculated.finalPriceArs <= maxBudget ? "¡Entra en tu presupuesto!" : "Excede tu presupuesto"}>
                                  {dealPriceCalculated.finalPriceArs <= maxBudget ? '🟢 OK' : '🔴 NO'}
                                </span>
                              )}

                              {deal.metacriticScore && (
                                <span className={`text-[8px] px-1 py-0.2 rounded font-mono font-bold flex items-center gap-0.5 ${
                                  deal.metacriticScore >= 90 ? 'bg-emerald-950/60 text-emerald-300' : 'bg-amber-950/60 text-amber-300'
                                }`} title="Metacritic Rating">
                                  ⭐ {deal.metacriticScore}
                                </span>
                              )}

                              {deal.playtimeHours && (
                                <span className="text-[8px] px-1 py-0.2 rounded font-mono font-bold bg-slate-950/60 text-slate-450 flex items-center gap-0.5" title="Duración HLTB">
                                  ⏱️ {deal.playtimeHours}h
                                </span>
                              )}
                            </div>
                            <h4 className="font-bold text-sm text-white truncate mt-0.5">{deal.title}</h4>
                            <div className="mt-1 flex items-baseline gap-2">
                              <span className="text-emerald-400 font-extrabold text-sm font-mono">{formatCurrency(dealPriceCalculated.finalPriceArs, 'ARS')}</span>
                              <span className="text-[9px] text-slate-500 font-mono">Final c/ imp.</span>
                            </div>
                            <div className="mt-1.5" onClick={(e) => e.stopPropagation()}>
                              <VoteWidget dealId={deal.id} />
                            </div>
                          </div>

                          {/* Quick Tracker radar */}
                          <div className="flex flex-col gap-1.5 shrink-0 text-right">
                            <span className="text-[9px] text-slate-500 font-mono block">Base: {formatCurrency(deal.currentPrice, deal.currency)}</span>
                            <button
                              onClick={() => handleQuickAddAlertFromSearch(deal.title, deal.platform, deal.currentPrice, deal.currency === 'USD')}
                              className="text-[10px] text-indigo-400 hover:text-indigo-300 bg-indigo-950/20 border border-indigo-500/10 px-2 py-1 rounded hover:bg-indigo-950/40 transition-colors"
                            >
                              Agregar al Radar
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>

              {/* Grand Grid of all remaining monitored games (12+ games) */}
              {remainingDeals.length > 0 && (
                <div className="mt-2 flex flex-col gap-4">
                  <span className="text-[11px] font-bold tracking-widest text-[#a5b4fc] uppercase">
                    Catálogo Completo en Monitoreo ({remainingDeals.length} Juegos)
                  </span>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4" id="catalogo-completo-grid">
                    {remainingDeals.map((deal) => {
                      const dealPriceCalculated = calculatePrice(deal.currentPrice, deal.currency, taxConfig);
                      
                      return (
                        <div 
                          key={deal.id}
                          onClick={() => handleRecordClick(deal.title)}
                          className="group relative rounded-xl border border-white/5 bg-slate-900/30 overflow-hidden flex flex-col hover:border-indigo-500/20 hover:bg-slate-900/60 transition-all shadow-md duration-300"
                        >
                          {/* Card image container */}
                          <div className="relative h-44 overflow-hidden bg-slate-950 border-b border-white/5">
                            <div 
                              className="absolute inset-0 bg-cover bg-center group-hover:scale-105 transition-transform duration-500"
                              style={{ backgroundImage: `url('${deal.imageUrl || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=300&auto=format&fit=crop&q=60' }')` }}
                            />
                            
                            {/* Hover overlay */}
                            <div className="absolute inset-0 bg-slate-950/40 group-hover:bg-slate-950/20 transition-colors" />

                            {/* Discount badge */}
                            <span className="absolute top-3 left-3 bg-rose-600 text-white font-bold text-[10px] px-2 py-0.5 rounded font-mono uppercase tracking-wider shadow">
                              -{deal.discountPercent}% OFF
                            </span>

                            {/* Platform Tag */}
                            <span className="absolute top-3 right-3 bg-slate-900/90 text-indigo-400 border border-indigo-500/10 font-mono text-[9px] uppercase font-bold px-2 py-0.5 rounded">
                              {deal.platform}
                            </span>
                          </div>

                          {/* Card body content */}
                          <div className="p-3 flex flex-col flex-grow justify-between gap-2">
                            <div>
                              <h4 className="font-bold text-sm text-white truncate" title={deal.title}>
                                {deal.title}
                              </h4>

                              {/* Metacritic & HLTB metrics bar */}
                              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                {deal.metacriticScore && (
                                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold border ${
                                    deal.metacriticScore >= 90
                                      ? 'bg-emerald-950 text-emerald-300 border-emerald-500/15'
                                      : 'bg-amber-950 text-amber-300 border-amber-500/15'
                                  }`} title="Puntaje Metacritic">
                                    ⭐ MC: {deal.metacriticScore}
                                  </span>
                                )}
                                {deal.playtimeHours && (
                                  <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold bg-slate-950 text-slate-400 border border-slate-850" title="Horas HowLongToBeat">
                                    ⏱️ {deal.playtimeHours}h HLTB
                                  </span>
                                )}
                              </div>

                              {/* Budget indicator bar */}
                              {maxBudget > 0 && (
                                <div className="mt-1.5">
                                  {dealPriceCalculated.finalPriceArs <= maxBudget ? (
                                    <span className="text-[8.5px] font-extrabold text-teal-400 bg-teal-950/30 border border-teal-500/25 px-2 py-0.5 rounded-md inline-block uppercase tracking-wider font-sans">
                                      🟢 Disponible ARS (-$ {Math.round(maxBudget - dealPriceCalculated.finalPriceArs)})
                                    </span>
                                  ) : (
                                    <span className="text-[8.5px] font-extrabold text-[#f43f5e] bg-rose-950/30 border border-rose-500/25 px-2 py-0.5 rounded-md inline-block uppercase tracking-wider font-sans">
                                      🔴 Excede ARS (+$ {Math.round(dealPriceCalculated.finalPriceArs - maxBudget)})
                                    </span>
                                  )}
                                </div>
                              )}

                              {/* Price History Sparkline visual analytics chart */}
                              <PriceSparkline
                                currentPrice={deal.currentPrice}
                                originalPrice={deal.originalPrice}
                                currency={deal.currency}
                                historyPrices={deal.historyPrices}
                              />
                              
                              {/* Price summary block */}
                              <div className="flex justify-between items-baseline mt-1 bg-slate-950/30 p-2 rounded border border-white/5">
                                <div className="flex flex-col">
                                  <span className="text-[8px] text-slate-500 font-mono">EN TIENDA</span>
                                  <span className="text-[10px] text-slate-400 font-mono line-through">
                                    {formatCurrency(deal.originalPrice, deal.currency)}
                                  </span>
                                  <span className="text-xs text-white font-bold font-mono">
                                    {formatCurrency(deal.currentPrice, deal.currency)}
                                  </span>
                                </div>
                                
                                <div className="text-right flex flex-col">
                                  <span className="text-[8px] text-emerald-400 font-bold font-sans">ARS FINAL C/ IMP</span>
                                  <span className="text-sm text-emerald-400 font-extrabold font-mono leading-none">
                                    {formatCurrency(dealPriceCalculated.finalPriceArs, 'ARS')}
                                  </span>
                                  <span className="text-[8px] text-slate-500 font-mono mt-0.5">
                                    ({formatCurrency(dealPriceCalculated.taxesArs)} imp)
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Actions bar */}
                            <div className="grid grid-cols-5 gap-1.5 mt-1" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => handleQuickAddAlertFromSearch(deal.title, deal.platform, deal.currentPrice, deal.currency === 'USD')}
                                className="col-span-4 bg-indigo-950/20 hover:bg-indigo-950/40 border border-indigo-500/10 text-indigo-300 hover:text-white py-1.5 rounded text-xs font-semibold tracking-wide transition-colors"
                              >
                                Seguir Precio
                              </button>
                              
                              {deal.storeUrl && (
                                <a
                                  href={deal.storeUrl}
                                  onClick={() => playClickSound()}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="col-span-1 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded flex items-center justify-center transition-colors border border-white/5"
                                  title="Ir a la tienda oficial"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              )}
                            </div>

                            <div className="flex items-center justify-between gap-1.5 pt-2.5 border-t border-white/5 mt-2" onClick={(e) => e.stopPropagation()}>
                              <span className="text-[10px] text-slate-500 font-mono tracking-tight uppercase">Votos AR:</span>
                              <VoteWidget dealId={deal.id} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Part 2: Interactive Real Intelligent Searcher utilizing Gemini Web Grounding search */}
              <div className="mt-2">
                <GameSearch 
                  taxConfig={taxConfig} 
                  onAddCustomAlert={handleQuickAddAlertFromSearch} 
                />
              </div>

              {/* Informative FAQ on purchasing foreign digital assets for Argentine gamers */}
              <div className="mt-6">
                <GamerFAQ />
              </div>

            </div>
          )}

          {/* Tab 2: Detailed Impuestos & Custom Simulation Tools */}
          {activeTab === 'calculator' && (
            <div className="flex flex-col gap-6 animate-fade-in">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-xl md:text-2xl font-bold tracking-widest text-white font-serif flex items-center gap-2.5 uppercase">
                    <Calculator className="text-sky-400 w-6.5 h-6.5 shrink-0" />
                    Calculadora de Impuestos
                  </h1>
                  <p className="text-slate-400 text-xs mt-1">
                    Modificá los porcentajes oficiales de AFIP o las tasas de IIBB de tu provincia si hay cambios fiscales.
                  </p>
                </div>
              </div>

              <TaxCalculator taxConfig={taxConfig} setTaxConfig={setTaxConfig} />

              <div className="bg-slate-900 border border-slate-850 rounded-xl p-4 text-xs text-slate-400 leading-relaxed">
                <p className="font-bold text-white mb-2 flex items-center gap-1.5">
                  🛡️ ¿Por qué los impuestos se ven tan altos en las compras de videojuegos en Argentina?
                </p>
                A partir de las normativas de control cambiario impulsadas por el Banco Central e implementadas a través de resoluciones generales de la AFIP, toda adquisición de servicios provistos por plataformas extranjeras pagaderos con divisas extranjeras, devenga una serie de recargos regulados que funcionan como retención a cuenta de impuestos en pesos. 
                <br /><br />
                Es importante destacar que, independientemente de que la tienda cotice en dólares o pesos de antemano (como hace Xbox de manera local), las compras finales procesadas electrónicamente por procesadores de pago fuera del país siempre activan estos recargos en tu resumen de tarjeta.
              </div>
            </div>
          )}

          {/* Tab 3: Mis Alertas (Preciometro Tracking Management) */}
          {activeTab === 'alerts' && (
            <div className="flex flex-col gap-6 animate-fade-in">
              <div>
                <h1 className="text-xl md:text-2xl font-bold tracking-widest text-white font-serif flex items-center gap-2.5 uppercase">
                  <Bell className="text-indigo-400 w-6.5 h-6.5 shrink-0" />
                  Mis Alertas Activas
                </h1>
                <p className="text-slate-400 text-xs mt-1">
                  Alertas configuradas con aviso automático. El sistema escanea y te enviará alertas de sistema cuando se alcance en cualquier tienda el precio o descuento óptimo.
                </p>
              </div>

              {/* Table / Grid list of alert subscriptions */}
              {alerts.length === 0 ? (
                <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-white/5 flex flex-col items-center gap-3">
                  <BadgeAlert className="w-10 h-10 text-slate-500 animate-pulse" />
                  <p className="text-slate-400 text-sm font-semibold">No tenés alertas de precios registradas actualmente.</p>
                  <p className="text-xs text-slate-500 max-w-sm">
                    Utilizá el formulario de la barra izquierda o de los resultados del Buscador Inteligente para registrar juegos bajo tu seguimiento especial.
                  </p>
                  <button 
                    onClick={() => setActiveTab('dashboard')} 
                    className="mt-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-4 py-2 rounded-lg text-xs transition-colors"
                  >
                    Explorar tiendas / Buscar juegos
                  </button>
                </div>
              ) : (
                <div className="bg-slate-900 border border-white/5 rounded-2xl overflow-hidden shadow-xl">
                  <div className="p-4 bg-slate-850 border-b border-white/5 flex justify-between items-center">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">Historial de Seguidos ({alerts.length})</span>
                    <span className="text-[10px] text-slate-500 font-mono">Control en Tiempo Real Activo</span>
                  </div>

                  <div className="divide-y divide-white/5">
                    {alerts.map((alert) => {
                      const isUSD = alert.platform === Platform.STEAM || alert.platform === Platform.PLAYSTATION || alert.platform === 'Steam' || alert.platform === 'PlayStation Store';
                      const targetStr = isUSD ? `u$s ${alert.targetPriceUsd ?? 'Cualquier descuento'}` : `${formatCurrency(alert.targetPriceArs ?? 0)} ARS`;
                      
                      // Calculate the corresponding pesos approximate for target if usd
                      const calculatedTargetPesos = isUSD && alert.targetPriceUsd 
                        ? calculatePrice(alert.targetPriceUsd, 'USD', taxConfig).finalPriceArs 
                        : (alert.targetPriceArs ? calculatePrice(alert.targetPriceArs, 'ARS', taxConfig).finalPriceArs : null);

                      return (
                        <div 
                          key={alert.id}
                          className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-850/50 transition-colors"
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg bg-indigo-950/60 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 font-bold text-xs font-mono">
                              {alert.platform.charAt(0)}
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-white">{alert.gameTitle}</h4>
                              <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
                                <span>Tienda: <span className="text-indigo-300 font-semibold">{alert.platform}</span></span>
                                <span className="w-1 h-1 bg-slate-600 rounded-full" />
                                {alert.discountPercentThreshold ? (
                                  <span className="text-rose-400 font-black bg-rose-950/40 border border-rose-500/20 px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wide">
                                    🎯 Dcto &gt;= {alert.discountPercentThreshold}% OFF
                                  </span>
                                ) : (
                                  <span className="text-slate-500 text-[10px]">Cualquier descuento</span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-6 justify-between md:justify-end">
                            <div className="text-right">
                              <span className="text-[10px] text-slate-500 block">PRECIO TARGET DE AVISO</span>
                              <span className="text-xs text-amber-400 font-bold font-mono">
                                {targetStr}
                              </span>
                              {calculatedTargetPesos && (
                                <span className="text-[9px] text-slate-500 block font-mono">
                                  ({formatCurrency(calculatedTargetPesos)} con imp.)
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-3">
                              <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-widest bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/10">
                                Monitoreando
                              </span>
                              
                              <button
                                onClick={() => handleDeleteAlert(alert.id)}
                                className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-950/20 rounded-lg transition-colors border border-transparent hover:border-rose-500/10"
                                title="Eliminar seguimiento"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Fixed Bottom Metadata of Argentina Gamer Taxes according to the Sophisticated Dark concept style instruction */}
          <div className="mt-auto border-t border-white/10 pt-4 flex flex-wrap gap-4 items-center text-[11px] text-white/40">
            <div className="flex gap-1.5"><span className="text-indigo-400 font-semibold">IVA Digital:</span> 21%</div>
            <div className="flex gap-1.5"><span className="text-indigo-400 font-semibold">Impuesto PAIS:</span> 8%</div>
            <div className="flex gap-1.5"><span className="text-indigo-400 font-semibold">Gcias / AFIP:</span> 30%</div>
            <div className="flex gap-1.5">
              <span className="text-indigo-400 font-semibold">Ingresos Brutos ({taxConfig.iibbProvince.split(' ')[0]}):</span> 
              {(taxConfig.iibbRate * 100).toFixed(1)}%
            </div>
            
            <div className="ml-auto flex items-center gap-2 text-[10px] text-green-400 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
              Estado cambiario: {currencyDataSource}
            </div>
          </div>
        </section>

      </main>

      {/* Styled simple footer */}
      <footer className="py-4 border-t border-white/10 text-center text-[11px] text-slate-600 bg-black/40 mt-12">
        <p>thegameoff © 2026 • Precios de videojuegos e impuestos para Argentina en tiempo real.</p>
      </footer>
    </div>
  );
}
