import React, { useState, useEffect } from 'react';
import { Flame, Snowflake, TrendingUp, Eye, Users, ThumbsUp, Medal, Sparkles } from 'lucide-react';
import { playClickSound } from '../utils/audio';

// Interface for deal community scores
export interface DealVote {
  hot: number;
  cold: number;
  userVote: 'hot' | 'cold' | null;
}

interface CommunityFeaturesProps {
  // Let us accept a list of current titles to rank
  monitoredGames: { id: string; title: string; discountPercent: number; platform: string }[];
  onQuickSearch?: (query: string) => void;
}

// Simulated seed database of community ratings based on IDs or game titles
const generateSeedVotes = (id: string, discount: number): { hot: number; cold: number } => {
  // Seed votes proportional to discount, generating natural looking numbers
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

export default function CommunityFeatures({ monitoredGames, onQuickSearch }: CommunityFeaturesProps) {
  // Votes state: stores `{ [dealId: string]: DealVote }`
  const [votes, setVotes] = useState<Record<string, DealVote>>({});
  
  // Views tracker to rank trending games: stores `{ [gameTitle: string]: number }`
  const [trendViews, setTrendViews] = useState<Record<string, number>>({});

  // Initialize and load from local storage
  useEffect(() => {
    // 1. Load votes state
    const savedVotes = localStorage.getItem('tgo_votes_v1');
    const userVotes = savedVotes ? JSON.parse(savedVotes) : {}; // { dealId: 'hot' | 'cold' }

    // Seed state for current monitored games
    const initialVotes: Record<string, DealVote> = {};
    monitoredGames.forEach(game => {
      const seed = generateSeedVotes(game.id, game.discountPercent);
      const userVote = userVotes[game.id] || null;
      
      // Adjust count if user already voted
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
    const savedViews = localStorage.getItem('tgo_trend_views_v1');
    const initialViews = savedViews ? JSON.parse(savedViews) : {};
    
    // Seed views
    monitoredGames.forEach(game => {
      if (!initialViews[game.title]) {
        // Natural pseudo-random view counts for seeding
        let sum = 0;
        for (let i = 0; i < game.title.length; i++) sum += game.title.charCodeAt(i);
        initialViews[game.title] = Math.floor((sum % 150) + 75);
      }
    });
    setTrendViews(initialViews);
    localStorage.setItem('tgo_trend_views_v1', JSON.stringify(initialViews));
  }, [monitoredGames]);

  // Vote handler function
  const handleVote = (dealId: string, type: 'hot' | 'cold') => {
    playClickSound();
    
    setVotes(prev => {
      const current = prev[dealId] || { hot: 15, cold: 2, userVote: null };
      let newHot = current.hot;
      let newCold = current.cold;
      let newUserVote: 'hot' | 'cold' | null = type;

      // Click same vote -> undo vote
      if (current.userVote === type) {
        newUserVote = null;
        if (type === 'hot') newHot = Math.max(0, newHot - 1);
        if (type === 'cold') newCold = Math.max(0, newCold - 1);
      } else {
        // Remove previous vote if switching
        if (current.userVote === 'hot') newHot = Math.max(0, newHot - 1);
        if (current.userVote === 'cold') newCold = Math.max(0, newCold - 1);

        // Add new vote
        if (type === 'hot') newHot += 1;
        if (type === 'cold') newCold += 1;
      }

      const updatedVotes = {
        ...prev,
        [dealId]: { hot: newHot, cold: newCold, userVote: newUserVote }
      };

      // Save user choices to localStorage
      const savedChoices: Record<string, 'hot' | 'cold'> = {};
      Object.keys(updatedVotes).forEach(key => {
        if (updatedVotes[key].userVote) {
          savedChoices[key] = updatedVotes[key].userVote!;
        }
      });
      localStorage.setItem('tgo_votes_v1', JSON.stringify(savedChoices));

      return updatedVotes;
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
      localStorage.setItem('tgo_trend_views_v1', JSON.stringify(updated));
      return updated;
    });
  };

  // Compile Top 5 Trending games in Argentina
  const trendingList = React.useMemo(() => {
    return monitoredGames
      .map(game => ({
        ...game,
        views: trendViews[game.title] || 120,
        tempRatio: votes[game.id]?.hot - votes[game.id]?.cold || 10
      }))
      // Rank by view index primarily + temp ratio
      .sort((a, b) => b.views - a.views)
      .slice(0, 5);
  }, [monitoredGames, trendViews, votes]);

  return {
    votes,
    handleVote,
    handleRecordClick,
    trendingList,
    
    // Voting UI Sub-component
    VoteWidget: ({ dealId, layout = 'compact' }: { dealId: string; layout?: 'compact' | 'expanded' }) => {
      const score = votes[dealId] || { hot: 0, cold: 0, userVote: null };
      const totalRatings = score.hot + score.cold;
      const pctHot = totalRatings > 0 ? Math.round((score.hot / totalRatings) * 100) : 50;

      return (
        <div className={`flex items-center gap-1.5 ${layout === 'expanded' ? 'bg-slate-950/40 p-2.5 rounded-xl border border-slate-850' : ''}`} id={`vote-widget-${dealId}`}>
          {/* Hot button */}
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
            title="¡Es una ganga! (Votar Hot)"
          >
            <Flame className={`w-3.5 h-3.5 ${score.userVote === 'hot' ? 'fill-orange-300 stroke-orange-100 text-orange-200 animate-pulse' : ''}`} />
            <span>{score.hot}</span>
          </button>

          {/* Frost bar Indicator */}
          {layout === 'expanded' && totalRatings > 0 && (
            <div className="w-12 h-1.5 bg-slate-800 rounded-full overflow-hidden shrink-0 hidden sm:block">
              <div 
                className="h-full bg-gradient-to-r from-cyan-400 to-orange-500 transition-all duration-300" 
                style={{ width: `${pctHot}%` }} 
              />
            </div>
          )}

          {/* Cold button */}
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
            title="Sigue caro / Mal descuento (Votar Cold)"
          >
            <Snowflake className={`w-3.5 h-3.5 ${score.userVote === 'cold' ? 'fill-sky-300 text-sky-100 animate-spin' : ''}`} />
            <span>{score.cold}</span>
          </button>
        </div>
      );
    },

    // Trending Panel view
    TrendingPanel: () => {
      return (
        <div className="bg-slate-900 border border-slate-850 rounded-2xl p-4 shadow-xl" id="argentina-community-radar">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-3">
            <div className="flex items-center gap-1.5">
              <Medal className="w-4 h-4 text-amber-500" />
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
            Los juegos con más seguimientos y consultas cambiarias de la última semana por la comunidad nacional.
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
                    {/* Rank Number */}
                    <span className="w-5 text-right font-serif font-black italic text-xs text-slate-600 group-hover:text-amber-500 transition-colors">
                      #{idx + 1}
                    </span>
                    
                    <div className="min-w-0">
                      <h5 className="text-[12px] font-bold text-white group-hover:text-indigo-400 transition-colors truncate">
                        {game.title}
                      </h5>
                      <span className={`text-[9px] font-mono border px-1.5 py-0.2 rounded mt-0.5 inline-block ${platformColors[game.platform] || 'bg-slate-800'}`}>
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
    }
  };
}
