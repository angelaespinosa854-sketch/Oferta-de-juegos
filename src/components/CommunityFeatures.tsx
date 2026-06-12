import React, { useState, useEffect } from 'react';
import { 
  Flame, 
  Snowflake, 
  TrendingUp, 
  Eye, 
  Users, 
  ThumbsUp, 
  Medal, 
  Sparkles,
  Plus,
  Send,
  MessageSquare,
  Award,
  Clock,
  DollarSign,
  User,
  Tag,
  ShoppingCart,
  HelpCircle,
  AlertTriangle,
  ChevronUp,
  Sparkle
} from 'lucide-react';
import { playClickSound, playSuccessSound } from '../utils/audio';

// Interface for deal community scores
export interface DealVote {
  hot: number;
  cold: number;
  userVote: 'hot' | 'cold' | null;
}

export interface CommunityGanga {
  id: string;
  author: string;
  gameTitle: string;
  platform: string;
  originalPrice: number;
  currentPrice: number;
  currency: 'USD' | 'ARS';
  description: string;
  tags: string[];
  votes: {
    hot: number;
    cold: number;
  };
  userVote?: 'hot' | 'cold' | null;
  createdAt: string;
  comments: {
    id: string;
    author: string;
    comment: string;
    avatar: string;
    timestamp: string;
  }[];
}

interface CommunityFeaturesProps {
  monitoredGames: { id: string; title: string; discountPercent: number; platform: string; currentPrice?: number; currency?: 'USD' | 'ARS' }[];
  onQuickSearch?: (query: string) => void;
  reputationXP?: number;
  addXP?: (amount: number) => void;
  triggerLiveNotification?: (title: string, message: string) => void;
  taxConfig?: {
    dolarOficial: number;
    iva: number;
    pais: number;
    ganancias: number;
    iibb?: number;
  };
}

// Simulated initial seed database for community discounts (Gangas)
const SEED_GANGS: CommunityGanga[] = [
  {
    id: "gang-1",
    author: "Nacho_Gamer99",
    gameTitle: "Hollow Knight",
    platform: "Xbox Store",
    originalPrice: 1500,
    currentPrice: 199,
    currency: "ARS",
    description: "¡Atentos cazadores! En la tienda de Xbox tiene un precio residual rezagado sin actualizar. Se compra directo en pesos y con impuestos no llega a los $350 final. Es un regalo absoluto por lo que dura.",
    tags: ["Error de Precio", "Xbox ARS", "Ahorro Mayor"],
    votes: { hot: 54, cold: 1 },
    createdAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(), // 3 hours ago
    comments: [
      {
        id: "c-1-1",
        author: "Zarate_Hunter",
        comment: "¡Confirmadísimo! Lo gatillé recién con Mercado Pago y me cobró $320 final con impuestos incluidos. Aprovechen antes que corrijan.",
        avatar: "🎮",
        timestamp: new Date(Date.now() - 2.5 * 3600 * 1000).toISOString()
      },
      {
        id: "c-1-2",
        author: "ScalonetaX",
        comment: "¿Sigue funcionando? Lo acabo de sumar al carrito para probar en Xbox Series S.",
        avatar: "🚀",
        timestamp: new Date(Date.now() - 1 * 3600 * 1000).toISOString()
      }
    ]
  },
  {
    id: "gang-2",
    author: "Clara_eShop",
    gameTitle: "Stardew Valley",
    platform: "Nintendo eShop",
    originalPrice: 2000,
    currentPrice: 380,
    currency: "ARS",
    description: "Descuento sorpresa del 81% en la eShop argentina. En Switch corre de maravillas y te asegura más de 200 horas de campaña cozy. Es de las mejores relaciones costo/hora de toda la tienda.",
    tags: ["Switch ARS", "Súper Rentable", "Relax"],
    votes: { hot: 39, cold: 2 },
    createdAt: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
    comments: [
      {
        id: "c-2-1",
        author: "GamerBonsai",
        comment: "Comprando sin dudar. El juego ideal para jugar acostado antes de dormir de manera relajada.",
        avatar: "🍃",
        timestamp: new Date(Date.now() - 7 * 3600 * 1000).toISOString()
      }
    ]
  },
  {
    id: "gang-3",
    author: "Seba_PS5",
    gameTitle: "NieR: Automata Game of the YoRHa Edition",
    platform: "PlayStation Store",
    originalPrice: 39.99,
    currentPrice: 15.99,
    currency: "USD",
    description: "Descuento del 60% oficial en Playstation Network. Se liquida en dólares tarjeta, pero si usan tarjetas Fintech (Lemon/Belo) hay reintegro de cripto que amortigua un toque la aduana impositiva.",
    tags: ["PS5 / PS4", "Dólar Tarjeta", "Acció́n"],
    votes: { hot: 22, cold: 5 },
    createdAt: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(), // 1 day ago
    comments: [
      {
        id: "c-3-1",
        author: "LemonKing",
        comment: "Ojo que Sony factura en dólares puros de tarjeta, pero igual rinde si no jugaron a esta obra maestra existencialista.",
        avatar: "🍋",
        timestamp: new Date(Date.now() - 20 * 3600 * 1000).toISOString()
      }
    ]
  }
];

const generateSeedVotes = (id: string, discount: number): { hot: number; cold: number } => {
  let sum = 0;
  for (let i = 0; i < id.length; i++) {
    sum += id.charCodeAt(i);
  }
  const hotBase = Math.floor((discount * 1.8) + (sum % 25) + 8);
  const coldBase = Math.floor((sum % 12) + 2);
  return {
    hot: Math.max(12, hotBase),
    cold: Math.max(1, coldBase),
  };
};

export default function CommunityFeatures({ 
  monitoredGames, 
  onQuickSearch, 
  reputationXP = 1500, 
  addXP, 
  triggerLiveNotification,
  taxConfig = { dolarOficial: 1460, iva: 0.21, pais: 0.08, ganancias: 0.30, iibb: 0.02 }
}: CommunityFeaturesProps) {
  // Deal votes state for system monitored list
  const [votes, setVotes] = useState<Record<string, DealVote>>({});
  
  // Views counter for monitored games
  const [trendViews, setTrendViews] = useState<Record<string, number>>({});

  // Community Published Gangas List
  const [communityGangs, setCommunityGangs] = useState<CommunityGanga[]>([]);
  
  // Active states for Community Feed Filters
  const [filterType, setFilterType] = useState<'hot' | 'new' | 'discussed'>('hot');
  const [communitySearch, setCommunitySearch] = useState('');
  
  // Community Ganga Publishing Form state
  const [showPublishForm, setShowPublishForm] = useState(false);
  const [formGameTitle, setFormGameTitle] = useState('');
  const [formPlatform, setFormPlatform] = useState('Xbox Store');
  const [formOriginalPrice, setFormOriginalPrice] = useState('');
  const [formCurrentPrice, setFormCurrentPrice] = useState('');
  const [formCurrency, setFormCurrency] = useState<'ARS' | 'USD'>('ARS');
  const [formDescription, setFormDescription] = useState('');
  const [formTags, setFormTags] = useState('');
  
  // Comments input text state (keyed by Ganga ID)
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});

  // Initialize and load everything from local storage
  useEffect(() => {
    // 1. Load votes for monitored deals
    const savedVotes = localStorage.getItem('tgo_votes_v2');
    const userVotes = savedVotes ? JSON.parse(savedVotes) : {};

    const initialVotes: Record<string, DealVote> = {};
    monitoredGames.forEach(game => {
      const seed = generateSeedVotes(game.id, game.discountPercent);
      const userVote = userVotes[game.id] || null;
      if (userVote === 'hot') seed.hot += 1;
      if (userVote === 'cold') seed.cold += 1;

      initialVotes[game.id] = {
        hot: seed.hot,
        cold: seed.cold,
        userVote
      };
    });
    setVotes(initialVotes);

    // 2. Load trend views
    const savedViews = localStorage.getItem('tgo_trend_views_v2');
    const initialViews = savedViews ? JSON.parse(savedViews) : {};
    
    monitoredGames.forEach(game => {
      if (!initialViews[game.title]) {
        let sum = 0;
        for (let i = 0; i < game.title.length; i++) sum += game.title.charCodeAt(i);
        initialViews[game.title] = Math.floor((sum % 150) + 75);
      }
    });
    setTrendViews(initialViews);
    localStorage.setItem('tgo_trend_views_v2', JSON.stringify(initialViews));

    // 3. Load community Published Gangas
    const savedGangs = localStorage.getItem('tgo_community_gangas_v2');
    if (savedGangs) {
      setCommunityGangs(JSON.parse(savedGangs));
    } else {
      setCommunityGangs(SEED_GANGS);
      localStorage.setItem('tgo_community_gangas_v2', JSON.stringify(SEED_GANGS));
    }
  }, [monitoredGames]);

  // Vote handler function for monitored games
  const handleVote = (dealId: string, type: 'hot' | 'cold') => {
    playClickSound();
    
    setVotes(prev => {
      const current = prev[dealId] || { hot: 15, cold: 2, userVote: null };
      let newHot = current.hot;
      let newCold = current.cold;
      let newUserVote: 'hot' | 'cold' | null = type;

      if (current.userVote === type) {
        newUserVote = null;
        if (type === 'hot') newHot = Math.max(0, newHot - 1);
        if (type === 'cold') newCold = Math.max(0, newCold - 1);
      } else {
        if (current.userVote === 'hot') newHot = Math.max(0, newHot - 1);
        if (current.userVote === 'cold') newCold = Math.max(0, newCold - 1);

        if (type === 'hot') newHot += 1;
        if (type === 'cold') newCold += 1;
      }

      const updatedVotes = {
        ...prev,
        [dealId]: { hot: newHot, cold: newCold, userVote: newUserVote }
      };

      const savedChoices: Record<string, 'hot' | 'cold'> = {};
      Object.keys(updatedVotes).forEach(key => {
        if (updatedVotes[key].userVote) {
          savedChoices[key] = updatedVotes[key].userVote!;
        }
      });
      localStorage.setItem('tgo_votes_v2', JSON.stringify(savedChoices));

      // Trigger XP
      if (addXP && newUserVote !== null && current.userVote !== type) {
        addXP(10);
        if (triggerLiveNotification) {
          triggerLiveNotification("¡Reputación Cazadora!", "Registraste tu voto comunitario sobre la oferta. +10 XP");
        }
      }

      return updatedVotes;
    });
  };

  // Vote handler for Custom Community Published Gangas
  const handleCommunityVote = (gangId: string, type: 'hot' | 'cold') => {
    playClickSound();

    setCommunityGangs(prev => {
      const updated = prev.map(gang => {
        if (gang.id !== gangId) return gang;

        let newHot = gang.votes.hot;
        let newCold = gang.votes.cold;
        let newUserVote: 'hot' | 'cold' | null = type;

        if (gang.userVote === type) {
          newUserVote = null;
          if (type === 'hot') newHot = Math.max(0, newHot - 1);
          if (type === 'cold') newCold = Math.max(0, newCold - 1);
        } else {
          if (gang.userVote === 'hot') newHot = Math.max(0, newHot - 1);
          if (gang.userVote === 'cold') newCold = Math.max(0, newCold - 1);

          if (type === 'hot') newHot += 1;
          if (type === 'cold') newCold += 1;
        }

        // Apply reward XP points
        if (addXP && newUserVote !== null && gang.userVote !== type) {
          setTimeout(() => {
            addXP(10);
            if (triggerLiveNotification) {
              triggerLiveNotification("¡Voto Registrado! 📢", `Votaste la ganga de ${gang.author} para Ganar +10 XP.`);
            }
          }, 30);
        }

        return {
          ...gang,
          votes: { hot: newHot, cold: newCold },
          userVote: newUserVote
        };
      });

      localStorage.setItem('tgo_community_gangas_v2', JSON.stringify(updated));
      return updated;
    });
  };

  // Click handler to register view increase on trending
  const handleRecordClick = (gameTitle: string) => {
    setTrendViews(prev => {
      const currentVal = prev[gameTitle] || 100;
      const updated = {
        ...prev,
        [gameTitle]: currentVal + 1
      };
      localStorage.setItem('tgo_trend_views_v2', JSON.stringify(updated));
      return updated;
    });
  };

  // Submitting comments on community manual items
  const handleAddComment = (gangId: string) => {
    const text = commentInputs[gangId]?.trim() || '';
    if (!text) return;

    playSuccessSound();

    const authorRandoms = ['ArgieGamer_Proxy', 'CyberCebador', 'PixelPatria', 'MateGaming', 'AsadoRaytraced', 'CazadorAustral'];
    const selectedAuthor = authorRandoms[Math.floor(Math.random() * authorRandoms.length)];
    const randomAvatars = ['🧙', '👾', '🔥', '🍖', '🧉', '🤠', '🦊', '🚀'];
    const selectedAvatar = randomAvatars[Math.floor(Math.random() * randomAvatars.length)];

    const newComment = {
      id: `comm-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      author: selectedAuthor,
      comment: text,
      avatar: selectedAvatar,
      timestamp: new Date().toISOString()
    };

    setCommunityGangs(prev => {
      const updated = prev.map(gang => {
        if (gang.id === gangId) {
          return {
            ...gang,
            comments: [...gang.comments, newComment]
          };
        }
        return gang;
      });
      localStorage.setItem('tgo_community_gangas_v2', JSON.stringify(updated));
      return updated;
    });

    // Clear comment input
    setCommentInputs(prev => ({ ...prev, [gangId]: '' }));

    // Earn hunter XP
    if (addXP) {
      addXP(15);
      if (triggerLiveNotification) {
        triggerLiveNotification("💬 Comentario Publicado", "¡Aportaste a la discusión con la comunidad! Ganaste +15 XP de cazador.");
      }
    }
  };

  // Publish a new gang manual finding to the social stream
  const handlePublishGanga = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formGameTitle.trim() || !formCurrentPrice) {
      alert("Por favor completá los campos mínimos (Título del videojuego y Precio de oferta).");
      return;
    }

    playSuccessSound();

    const origPriceNumber = parseFloat(formOriginalPrice) || 0;
    const currPriceNumber = parseFloat(formCurrentPrice);

    // Build tags array
    const customTags = formTags
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);
    
    if (customTags.length === 0) {
      customTags.push(formPlatform);
      customTags.push(formCurrency === 'ARS' ? "Pesos" : "Tarjeta USD");
    }

    const newGanga: CommunityGanga = {
      id: `gang-manual-${Date.now()}`,
      author: `GamerComunidad_${Math.floor(Math.random() * 899 + 100)}`,
      gameTitle: formGameTitle.trim(),
      platform: formPlatform,
      originalPrice: origPriceNumber || Math.round(currPriceNumber * 1.5),
      currentPrice: currPriceNumber,
      currency: formCurrency,
      description: formDescription.trim() || `Encontré la oferta de ${formGameTitle} navegando por las tiendas oficiales. Está a una tasa excelente comparativamente hoy en pesos argentinos. ¡Ideal para canjeanar!`,
      tags: customTags,
      votes: { hot: 1, cold: 0 },
      userVote: 'hot', // Auto hot-voted by creator
      createdAt: new Date().toISOString(),
      comments: []
    };

    setCommunityGangs(prev => {
      const updated = [newGanga, ...prev];
      localStorage.setItem('tgo_community_gangas_v2', JSON.stringify(updated));
      return updated;
    });

    // Clear form states & collapse
    setFormGameTitle('');
    setFormOriginalPrice('');
    setFormCurrentPrice('');
    setFormDescription('');
    setFormTags('');
    setShowPublishForm(false);

    // Reward XP points
    if (addXP) {
      addXP(50);
      if (triggerLiveNotification) {
        triggerLiveNotification("🔥 ¡Ganga Compartida!", `Aportaste con ${newGanga.gameTitle} a las listas. Ganaste +50 XP de reputación.`);
      }
    }
  };

  // Calculate full prices with taxes for manual items
  const formatArgentineCost = (price: number, currency: 'USD' | 'ARS') => {
    const sumTaxesRate = taxConfig.iva + taxConfig.pais + taxConfig.ganancias + (taxConfig.iibb || 0);
    if (currency === 'ARS') {
      const taxes = price * sumTaxesRate;
      const total = price + taxes;
      return {
        base: Math.round(price),
        taxes: Math.round(taxes),
        final: Math.round(total)
      };
    } else {
      // For USD
      const usdInPesos = price * taxConfig.dolarOficial;
      const taxes = usdInPesos * sumTaxesRate;
      const total = usdInPesos + taxes;
      return {
        base: Math.round(usdInPesos),
        taxes: Math.round(taxes),
        final: Math.round(total)
      };
    }
  };

  // Ranking Top 5 items for the Argentinian trend list
  const trendingList = React.useMemo(() => {
    return monitoredGames
      .map(game => ({
        ...game,
        views: trendViews[game.title] || 120,
        tempRatio: (votes[game.id]?.hot || 10) - (votes[game.id]?.cold || 1)
      }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 5);
  }, [monitoredGames, trendViews, votes]);

  // Compiled List for Community Feed incorporating filters & search
  const filteredCommunityFeed = React.useMemo(() => {
    let result = [...communityGangs];

    // Search term matching
    if (communitySearch.trim()) {
      const term = communitySearch.toLowerCase();
      result = result.filter(gang => 
        gang.gameTitle.toLowerCase().includes(term) || 
        gang.description.toLowerCase().includes(term) ||
        gang.tags.some(tag => tag.toLowerCase().includes(term))
      );
    }

    // Sort according to active filter
    if (filterType === 'hot') {
      // Hot sorts by net hot count (or total flames)
      result.sort((a, b) => (b.votes.hot - b.votes.cold) - (a.votes.hot - a.votes.cold));
    } else if (filterType === 'new') {
      // Sort by creation date
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (filterType === 'discussed') {
      // Sort by comment length
      result.sort((a, b) => b.comments.length - a.comments.length);
    }

    return result;
  }, [communityGangs, communitySearch, filterType]);

  return {
    votes,
    handleVote,
    handleRecordClick,
    trendingList,
    
    // Sub-component 1: Custom Vote widget for standard deals cards
    VoteWidget: ({ dealId, layout = 'compact' }: { dealId: string; layout?: 'compact' | 'expanded' }) => {
      const score = votes[dealId] || { hot: 0, cold: 0, userVote: null };
      const totalRatings = score.hot + score.cold;
      const pctHot = totalRatings > 0 ? Math.round((score.hot / totalRatings) * 100) : 50;

      return (
        <div className={`flex items-center gap-1.5 ${layout === 'expanded' ? 'bg-slate-950/40 p-2.5 rounded-xl border border-slate-850' : ''}`} id={`vote-widget-${dealId}`}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleVote(dealId, 'hot');
            }}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-mono font-bold transition-all ${
              score.userVote === 'hot' 
                ? 'bg-orange-600 text-white border-orange-500 scale-105 shadow-md shadow-orange-900/30' 
                : 'bg-slate-950/70 text-slate-400 hover:text-orange-400 border border-slate-800'
            }`}
            title="¡Es tremenda ganga! (Votar Flama/Hot)"
          >
            <Flame className={`w-3.5 h-3.5 ${score.userVote === 'hot' ? 'fill-orange-300 stroke-orange-100 text-orange-200 animate-pulse' : ''}`} />
            <span>{score.hot}</span>
          </button>

          {layout === 'expanded' && totalRatings > 0 && (
            <div className="w-12 h-1.5 bg-slate-800 rounded-full overflow-hidden shrink-0 hidden sm:block">
              <div 
                className="h-full bg-gradient-to-r from-sky-400 to-orange-500 transition-all duration-300" 
                style={{ width: `${pctHot}%` }} 
              />
            </div>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleVote(dealId, 'cold');
            }}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-mono font-bold transition-all ${
              score.userVote === 'cold' 
                ? 'bg-sky-600 text-white border-sky-500 scale-105 shadow-md shadow-sky-900/30' 
                : 'bg-slate-950/70 text-slate-400 hover:text-sky-400 border border-slate-800'
            }`}
            title="Sigue caro o mal descuento (Votar Cold)"
          >
            <Snowflake className={`w-3.5 h-3.5 ${score.userVote === 'cold' ? 'fill-sky-300 text-sky-100' : ''}`} />
            <span>{score.cold}</span>
          </button>
        </div>
      );
    },

    // Sub-component 2: Classic Trending Panel
    TrendingPanel: () => {
      return (
        <div className="bg-slate-900 border border-slate-850 rounded-2xl p-4 shadow-xl text-left" id="argentina-community-radar">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-3">
            <div className="flex items-center gap-1.5">
              <Medal className="w-4 h-4 text-amber-500 animate-bounce" />
              <h4 className="text-xs font-serif font-black uppercase text-white tracking-widest">
                Tendencia en Argentina
              </h4>
            </div>
            
            <span className="flex items-center gap-1 text-[9px] font-mono text-emerald-400 uppercase bg-emerald-950/45 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
              Vivo
            </span>
          </div>

          <p className="text-[11px] text-slate-500 leading-normal mb-3">
            Los juegos con más seguimientos y clics de cálculos impositivos registrados por la comunidad nacional.
          </p>

          <div className="space-y-2.5">
            {trendingList.map((game, idx) => {
              const platformColors: Record<string, string> = {
                'Steam': 'bg-sky-950 text-sky-300 border-sky-500/20',
                'Xbox Store': 'bg-emerald-950 text-emerald-300 border-emerald-500/20',
                'PlayStation Store': 'bg-indigo-950 text-indigo-300 border-indigo-500/20',
                'Nintendo eShop': 'bg-rose-950 text-rose-300 border-rose-500/20',
              };

              return (
                <div 
                  key={game.id}
                  onClick={() => {
                    playClickSound();
                    handleRecordClick(game.title);
                    if (onQuickSearch) {
                      onQuickSearch(game.title);
                    }
                  }}
                  className="flex items-center justify-between bg-slate-950/40 hover:bg-slate-950/90 border border-slate-850 hover:border-slate-800 p-2.5 rounded-xl transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-5 text-right font-serif font-black italic text-xs text-slate-600 group-hover:text-amber-500 transition-colors">
                      #{idx + 1}
                    </span>
                    
                    <div className="min-w-0">
                      <h5 className="text-[12px] font-bold text-white group-hover:text-indigo-400 transition-colors truncate">
                        {game.title}
                      </h5>
                      <span className={`text-[9px] font-mono border px-1.5 py-0.2 rounded mt-0.5 inline-block ${platformColors[game.platform] || 'bg-slate-800 text-slate-300'}`}>
                        {game.platform}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-right">
                    <div className="font-mono text-[10px] text-slate-500 flex items-center gap-1">
                      <Eye className="w-3 h-3 text-[#a5b4fc]" />
                      <span>{game.views}</span>
                    </div>

                    <div className="bg-amber-950/40 border border-amber-500/10 text-amber-300 px-1.5 py-0.5 rounded font-mono text-[9px] font-bold uppercase shrink-0">
                      -{game.discountPercent}% OFF
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-3.5 pt-2 border-t border-slate-850/60 flex items-center justify-between text-[10px] text-slate-500">
            <span>¿Buscando lo último?</span>
            <span className="text-indigo-400 font-bold hover:underline cursor-pointer flex items-center gap-0.5">
              Refrescar Radar
            </span>
          </div>
        </div>
      );
    },

    // Sub-component 3: Dynamic Community / Social Network interaction Hub
    CommunityFeed: () => {
      return (
        <div className="flex flex-col gap-6 animate-fade-in text-left">
          
          {/* Header & Stats bar banner */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold text-indigo-400 bg-indigo-950/60 uppercase border border-indigo-500/15 px-2.5 py-0.5 rounded-full">
                  Foro de Cazadores
                </span>
                <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-950/60 border border-amber-500/15 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Award className="w-3 h-3 shrink-0 text-amber-500" />
                  XP de Caza: {reputationXP} PTS
                </span>
              </div>
              
              <h1 className="text-xl md:text-2xl font-bold tracking-widest text-white font-serif uppercase mt-1.5 flex items-center gap-2">
                📢 Comunidad Gamer TGO
              </h1>
              <p className="text-slate-400 text-xs mt-1 leading-normal max-w-xl">
                ¿Encontraste un error de precio, una oferta oculta en pesos o querés debatir un método de pago nacional? ¡Aportá gangas, comentá y acumulá reputación en el ranking nacional!
              </p>
            </div>

            {/* Quick Community Stats Widget */}
            <div className="flex gap-4 border-t md:border-t-0 md:border-l border-slate-800 pt-3 md:pt-0 md:pl-6 shrink-0 text-center">
              <div>
                <span className="text-indigo-400 font-black text-lg block leading-none">{communityGangs.length}</span>
                <span className="text-[9px] uppercase tracking-wider font-mono text-slate-500 block mt-1">Aportes hoy</span>
              </div>
              <div>
                <span className="text-amber-400 font-black text-lg block leading-none">
                  {communityGangs.reduce((acc, current) => acc + current.comments.length, 0)}
                </span>
                <span className="text-[9px] uppercase tracking-wider font-mono text-slate-500 block mt-1">Opiniones</span>
              </div>
              <div className="hidden sm:block">
                <span className="text-teal-400 font-black text-lg block leading-none">
                  +{(reputationXP / 100).toFixed(0)} XP
                </span>
                <span className="text-[9px] uppercase tracking-wider font-mono text-slate-500 block mt-1">Rango cazador</span>
              </div>
            </div>
          </div>

          {/* Quick Filter controls + Manual Publication trigger button */}
          <div className="flex flex-col sm:flex-row items-center gap-4 justify-between bg-slate-900/60 border border-slate-850 p-3 rounded-xl">
            {/* Left aligned tab/filters */}
            <div className="flex items-center gap-2 self-start sm:self-center">
              <button 
                onClick={() => setFilterType('hot')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold font-sans transition-colors flex items-center gap-1 ${
                  filterType === 'hot' 
                    ? 'bg-orange-600 text-white' 
                    : 'bg-slate-950 hover:bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <Flame className="w-3.5 h-3.5" />
                Más Destacados
              </button>
              
              <button 
                onClick={() => setFilterType('new')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold font-sans transition-colors flex items-center gap-1 ${
                  filterType === 'new' 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-slate-950 hover:bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                Novedades
              </button>

              <button 
                onClick={() => setFilterType('discussed')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold font-sans transition-colors flex items-center gap-1 ${
                  filterType === 'discussed' 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-slate-950 hover:bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Discusiones
              </button>
            </div>

            {/* Right aligned action buttons */}
            <div className="flex items-center gap-2.5 w-full sm:w-auto mt-2 sm:mt-0">
              <div className="relative flex-grow">
                <input 
                  type="text" 
                  value={communitySearch} 
                  onChange={(e) => setCommunitySearch(e.target.value)}
                  placeholder="Filtrar ofertas de comunidad..."
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg p-1.5 pl-3 text-xs text-white placeholder-slate-500 font-sans outline-none flex-grow"
                />
              </div>

              <button 
                onClick={() => {
                  playClickSound();
                  setShowPublishForm(!showPublishForm);
                }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase transition duration-150 tracking-wider flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                  showPublishForm 
                    ? 'bg-slate-850 text-slate-300' 
                    : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black shadow-lg shadow-emerald-950/20'
                }`}
              >
                {showPublishForm ? "Cerrar Panel" : "📢 Publicar Ganga"}
              </button>
            </div>
          </div>

          {/* Interactive Ganga publishing form panel */}
          {showPublishForm && (
            <form 
              onSubmit={handlePublishGanga}
              className="bg-gradient-to-b from-[#0e0c1f] to-slate-950 border border-indigo-500/20 rounded-2xl p-5 shadow-2xl flex flex-col gap-4 animate-slide-up"
            >
              <div className="flex items-center gap-2 border-b border-indigo-500/10 pb-3 mb-1">
                <div className="w-7 h-7 rounded-lg bg-emerald-950 border border-emerald-500/40 text-emerald-300 flex items-center justify-center font-bold text-sm">
                  +
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-emerald-400 font-serif">Aportar una Ganga Hallada</h3>
                  <p className="text-[10px] text-slate-400">
                    Compartí una oferta manual de tiendas pesificadas o importadas. Recibís <strong className="text-amber-400">+50 Hunter XP</strong>.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-1 flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-mono font-bold text-slate-400">Nombre del Videojuego *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Ej: Celeste, Dave the Diver, etc."
                    value={formGameTitle}
                    onChange={(e) => setFormGameTitle(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 p-2 rounded-lg text-xs text-white font-sans outline-none"
                  />
                </div>

                <div className="md:col-span-1 flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-mono font-bold text-slate-400">Tienda / Store Oficial *</label>
                  <select 
                    value={formPlatform}
                    onChange={(e) => setFormPlatform(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 p-2 rounded-lg text-xs text-slate-300 pointer font-sans"
                  >
                    <option value="Xbox Store">Xbox Store (ARS)</option>
                    <option value="Steam">Steam (USD)</option>
                    <option value="Nintendo eShop">Nintendo eShop (ARS)</option>
                    <option value="PlayStation Store">PlayStation Store (USD)</option>
                    <option value="Epic Games Store">Epic Games Store (USD)</option>
                    <option value="Otra Tienda">Otra Tienda / Web</option>
                  </select>
                </div>

                <div className="md:col-span-1 flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-mono font-bold text-slate-400">Moneda de Pago</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      type="button" 
                      onClick={() => setFormCurrency('ARS')}
                      className={`py-1.5 rounded-lg text-xs font-mono font-bold border transition-all ${
                        formCurrency === 'ARS' 
                          ? 'bg-slate-850 text-emerald-400 border-emerald-500/40 font-black' 
                          : 'bg-slate-900 text-slate-500 border-slate-800'
                      }`}
                    >
                      ARS (Pesos)
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setFormCurrency('USD')}
                      className={`py-1.5 rounded-lg text-xs font-mono font-bold border transition-all ${
                        formCurrency === 'USD' 
                          ? 'bg-slate-850 text-indigo-400 border-indigo-500/40 font-black' 
                          : 'bg-slate-900 text-slate-500 border-slate-800'
                      }`}
                    >
                      USD (Dólares)
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-1 flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-mono font-bold text-slate-400">Precio Normal (Opc.)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    placeholder="Ej: 1500"
                    value={formOriginalPrice}
                    onChange={(e) => setFormOriginalPrice(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 p-2 rounded-lg text-xs text-white font-mono outline-none"
                  />
                </div>

                <div className="md:col-span-1 flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-mono font-bold text-slate-400">Precio de Oferta *</label>
                  <input 
                    type="number" 
                    step="0.01"
                    required
                    placeholder="Ej: 199"
                    value={formCurrentPrice}
                    onChange={(e) => setFormCurrentPrice(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 p-2 rounded-lg text-xs text-white font-mono outline-none"
                  />
                </div>

                <div className="md:col-span-1 flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-mono font-bold text-slate-400">Etiquetas (Separadas por Comas)</label>
                  <input 
                    type="text" 
                    placeholder="Ej: Error de precio, Oferta, Switch"
                    value={formTags}
                    onChange={(e) => setFormTags(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 p-2 rounded-lg text-xs text-white font-sans outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-mono font-bold text-slate-400">Instrucciones o Detalles del Ahorro</label>
                <textarea 
                  rows={2}
                  placeholder="Detallar por qué conviene, si es un error de precio impositivo, qué tarjeta usar..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 p-2 rounded-lg text-xs text-white font-sans outline-none resize-none"
                />
              </div>

              <button 
                type="submit"
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-2 rounded-lg text-xs uppercase tracking-wider transition-all shadow-md shadow-emerald-950/20"
              >
                🚀 Compartir en la Comunidad (+50 XP)
              </button>
            </form>
          )}

          {/* Social Stream Grid */}
          {filteredCommunityFeed.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-850 flex flex-col items-center gap-3">
              <AlertTriangle className="w-10 h-10 text-slate-500 animate-pulse" />
              <p className="text-slate-400 text-sm font-semibold">No se encontraron gangas con ese filtro o búsqueda.</p>
              <button 
                onClick={() => {
                  setCommunitySearch('');
                  setFilterType('hot');
                }}
                className="mt-1 px-3 py-1 bg-slate-850 border border-slate-800 text-indigo-400 text-xs font-bold rounded-lg transition-colors hover:text-white"
              >
                Esterilizar Filtro
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {filteredCommunityFeed.map((gang) => {
                const discount = gang.originalPrice > 0 
                  ? Math.round(((gang.originalPrice - gang.currentPrice) / gang.originalPrice) * 100)
                  : 50;

                // Full price calculations
                const priceStats = formatArgentineCost(gang.currentPrice, gang.currency);
                const isExpanded = !!expandedComments[gang.id];

                // Badge colors for platform
                const pColors: Record<string, string> = {
                  'Steam': 'bg-sky-950 text-sky-400 border-sky-400/20',
                  'Xbox Store': 'bg-emerald-950 text-emerald-400 border-emerald-400/20',
                  'Nintendo eShop': 'bg-rose-950 text-rose-400 border-rose-400/20',
                  'PlayStation Store': 'bg-indigo-950 text-indigo-400 border-indigo-400/20'
                };

                return (
                  <div 
                    key={gang.id}
                    className="bg-slate-900 border border-slate-850 rounded-2xl p-4 md:p-5 flex flex-col gap-4 hover:border-slate-800 transition-all shadow-lg"
                  >
                    {/* Title, Platform, Authors line */}
                    <div className="flex items-start justify-between gap-3 border-b border-slate-850 pb-3">
                      <div className="flex items-start gap-3">
                        {/* Heat Thermometer Icon based on net votes value */}
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-lg shadow-inner shrink-0 ${
                          gang.votes.hot - gang.votes.cold >= 20 
                            ? 'bg-rose-950 border border-rose-500/30 text-rose-300' 
                            : 'bg-slate-950 border border-slate-850 text-indigo-400'
                        }`}>
                          {gang.votes.hot - gang.votes.cold >= 20 ? "🔥" : "💬"}
                        </div>

                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                              <User className="w-3 h-3 text-[#a5b4fc]" />
                              Posteado por <strong className="text-slate-300">{gang.author}</strong>
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">•</span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              {new Date(gang.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                          
                          <h3 
                            onClick={() => {
                              if (onQuickSearch) onQuickSearch(gang.gameTitle);
                            }}
                            className="text-sm md:text-base font-bold text-white mt-1 hover:text-indigo-400 cursor-pointer transition-colors"
                          >
                            {gang.gameTitle}
                          </h3>
                        </div>
                      </div>

                      {/* Store platform and percentage saving badges */}
                      <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                        <span className={`text-[9px] font-mono border px-2 py-0.5 rounded-lg shrink-0 font-bold ${pColors[gang.platform] || 'bg-slate-950 text-slate-400 border-slate-800'}`}>
                          {gang.platform}
                        </span>

                        <span className="text-[9px] font-mono font-bold bg-rose-950/40 border border-rose-500/10 text-rose-400 px-2 py-0.5 rounded-lg">
                          -{discount}% OFF
                        </span>
                      </div>
                    </div>

                    {/* Main Description */}
                    <p className="text-xs text-slate-300 leading-relaxed font-sans font-medium">
                      {gang.description}
                    </p>

                    {/* Full Argentine Price Breakdown Card */}
                    <div className="bg-slate-950/60 border border-slate-850 p-3 rounded-xl grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
                      <div className="border-r border-slate-850/60 pb-2 sm:pb-0">
                        <span className="text-[8.5px] uppercase font-mono tracking-wider text-slate-500">Precio de Lista</span>
                        <div className="text-xs text-slate-400 mt-0.5 line-through decoration-rose-500 font-mono">
                          {gang.currency === 'USD' ? `u$s ${gang.originalPrice}` : `$ ${gang.originalPrice}`}
                        </div>
                      </div>
                      
                      <div className="border-r border-slate-850/60 pb-2 sm:pb-0">
                        <span className="text-[8.5px] uppercase font-mono tracking-wider text-slate-500">Precio Base de Venta</span>
                        <div className="text-xs text-white font-bold font-mono mt-0.5">
                          {gang.currency === 'USD' ? `u$s ${gang.currentPrice}` : `$ ${gang.currentPrice}`}
                        </div>
                      </div>

                      <div>
                        <span className="text-[8px] uppercase font-mono tracking-widest text-[#a5b4fc] block font-black">
                          Pesos Final Impuestos
                        </span>
                        <div className="text-sm text-cyan-400 font-black font-mono mt-0.5 animate-pulse">
                          $ {priceStats.final.toLocaleString('es-AR')}
                        </div>
                        <span className="text-[8.5px] text-slate-500 block leading-none font-mono mt-0.5">
                          (+ {priceStats.taxes.toLocaleString('es-AR')} AFIP)
                        </span>
                      </div>
                    </div>

                    {/* Social Tags Row */}
                    {gang.tags.length > 0 && (
                      <div className="flex gap-1.5 flex-wrap">
                        {gang.tags.map((tag, i) => (
                          <span key={i} className="text-[9px] font-mono text-slate-400 bg-slate-950 border border-slate-850 px-2 py-0.5 rounded">
                            # {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Voting & Actions Toolbar */}
                    <div className="flex items-center justify-between border-t border-slate-850/40 pt-3 flex-wrap gap-2">
                      {/* Left: Community Votes (hot/cold) */}
                      <div className="flex items-center gap-1.5" id={`gang-voting-${gang.id}`}>
                        <button
                          onClick={() => handleCommunityVote(gang.id, 'hot')}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-bold transition-all ${
                            gang.userVote === 'hot' 
                              ? 'bg-orange-600 text-white border-orange-500 scale-105 shadow-md shadow-orange-900/10' 
                              : 'bg-slate-950/70 text-slate-400 hover:text-orange-400 border border-slate-850'
                          }`}
                          title="Es una ganga súper caliente"
                        >
                          <Flame className="w-3.5 h-3.5" />
                          <span>{gang.votes.hot}</span>
                        </button>

                        <button
                          onClick={() => handleCommunityVote(gang.id, 'cold')}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-bold transition-all ${
                            gang.userVote === 'cold' 
                              ? 'bg-sky-600 text-white border-sky-500 scale-105 shadow-md shadow-sky-900/10' 
                              : 'bg-slate-950/70 text-slate-400 hover:text-sky-400 border border-slate-850'
                          }`}
                          title="No es buena oferta / Sigue muy fría"
                        >
                          <Snowflake className="w-3.5 h-3.5" />
                          <span>{gang.votes.cold}</span>
                        </button>
                      </div>

                      {/* Right: Comments indicator & redirect */}
                      <div className="flex items-center gap-2">
                        {gang.currency === 'USD' && (
                          <div className="hidden md:flex items-center gap-1 text-[9.5px] font-mono text-slate-500 bg-slate-950 border border-slate-850/60 px-2 py-0.5 rounded-md">
                            <span>Imp Tarjeta: 61% Desglose</span>
                          </div>
                        )}

                        <button
                          onClick={() => {
                            playClickSound();
                            setExpandedComments(prev => ({ ...prev, [gang.id]: !isExpanded }));
                          }}
                          className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                            isExpanded 
                              ? 'bg-indigo-950 border border-indigo-500/25 text-white' 
                              : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-850 hover:bg-slate-900'
                          }`}
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                          <span>Opiniones ({gang.comments.length})</span>
                        </button>
                      </div>
                    </div>

                    {/* Integrated Collapsible Comments section */}
                    {isExpanded && (
                      <div className="bg-slate-950/40 border border-slate-850/60 p-4 rounded-xl flex flex-col gap-3 mt-1 animate-fade-in text-left">
                        <div className="border-b border-white/5 pb-2">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">
                            Espacio de Opiniones Gamer ({gang.comments.length})
                          </span>
                        </div>

                        {/* List of comments */}
                        {gang.comments.length === 0 ? (
                          <p className="text-[11px] text-slate-500 italic py-2">
                            No hay comentarios aún. ¡Sé el primero e ingresá un aporte para ganar +15 XP!
                          </p>
                        ) : (
                          <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                            {gang.comments.map((comment) => (
                              <div key={comment.id} className="flex gap-2.5 items-start">
                                <div className="w-6.5 h-6.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-xs shrink-0 select-none shadow">
                                  {comment.avatar}
                                </div>
                                <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-850 flex-grow">
                                  <div className="flex items-center justify-between mb-0.5 flex-wrap">
                                    <span className="text-[10px] font-bold text-indigo-300 font-sans">{comment.author}</span>
                                    <span className="text-[8.5px] text-slate-500 font-mono">
                                      {new Date(comment.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-slate-300 leading-normal font-sans">
                                    {comment.comment}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Add Comment Input Bar */}
                        <div className="flex gap-2 items-center mt-2 border-t border-white/5 pt-3">
                          <input 
                            type="text" 
                            placeholder="Dejá tu opinión de compra o consejo..."
                            value={commentInputs[gang.id] || ''}
                            onChange={(e) => setCommentInputs(prev => ({ ...prev, [gang.id]: e.target.value }))}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleAddComment(gang.id);
                            }}
                            className="bg-slate-900 border border-slate-800 focus:border-indigo-500 text-xs text-white rounded-lg p-2 flex-grow outline-none placeholder-slate-500 font-sans"
                          />
                          <button 
                            onClick={() => handleAddComment(gang.id)}
                            className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors flex items-center justify-center h-8 w-8 text-xs font-bold"
                            title="Publicar comentario"
                          >
                            <Send className="w-3.5 h-3.5 shrink-0" />
                          </button>
                        </div>
                      </div>
                    )}

                  </div>
                );
              })}
            </div>
          )}

          {/* Guidelines info card for the community */}
          <div className="bg-indigo-950/10 border border-indigo-500/20 p-4 rounded-2xl flex items-start gap-3">
            <HelpCircle className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h5 className="text-xs font-bold text-white uppercase tracking-wider font-sans">Reglamento del Cazador Gamer</h5>
              <p className="text-[11px] text-indigo-300 leading-relaxed font-sans">
                Para mantener el feed útil, aportá únicamente valores finales que se puedan verificar. Si un precio cambia o la tienda actualiza la cotización, usá el voto comunitarios frío ("Cold") para avisar al resto. Toda actividad saludable regenera tu indicador XP y reputación nacional.
              </p>
            </div>
          </div>

        </div>
      );
    }
  };
}
