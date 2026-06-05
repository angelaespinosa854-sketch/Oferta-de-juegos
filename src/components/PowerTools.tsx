import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  Sparkles, 
  Coins, 
  Globe, 
  Copy, 
  Check, 
  Award, 
  Upload, 
  Flame, 
  ShieldAlert, 
  Terminal, 
  Lightbulb, 
  HelpCircle 
} from 'lucide-react';
import { Platform } from '../types';
import { playClickSound, playSuccessSound } from '../utils/audio';

interface PowerToolsProps {
  maxBudget: number;
  setMaxBudget: (budget: number) => void;
  reputationXP: number;
  addXP: (amount: number) => void;
  onBulkImportAlerts: (titles: string[], platform: Platform) => void;
  taxRatesJsonStr: string;
}

export default function PowerTools({
  maxBudget,
  setMaxBudget,
  reputationXP,
  addXP,
  onBulkImportAlerts,
  taxRatesJsonStr
}: PowerToolsProps) {
  // Navigation tabs for PowerTools sub-sections: 'budget' | 'steam_sync' | 'reputation' | 'api_dev'
  const [activeSubTab, setActiveSubTab] = useState<'budget' | 'steam_sync' | 'reputation' | 'api_dev'>('budget');
  
  // Importer variables
  const [rawSteamWishlistText, setRawSteamWishlistText] = useState('');
  const [importSelectedPlatform, setImportSelectedPlatform] = useState<Platform>(Platform.STEAM);
  const [importSuccessMsg, setImportSuccessMsg] = useState<string | null>(null);

  // API Developer variables
  const [copiedCode, setCopiedCode] = useState(false);

  // Compute reputation rankings & badges
  const getHunterRank = (xp: number) => {
    if (xp >= 1500) return { title: 'Cazador Leyenda de la AFIP 🛡️', text: 'Conocedor supremo del laberinto cambiario y master de las ofertas.' };
    if (xp >= 800) return { title: 'Buscador de Oro 🪙', text: 'Encuentra diamantes en el fango de los portales de distribución.' };
    if (xp >= 300) return { title: 'Cazador Cadete de Pesificadas 🏹', text: 'Vigila con constancia los catálogos en pesos de Xbox y Nintendo.' };
    return { title: 'Recluta del Ahorro 👾', text: 'Comienza tu viaje para no regalarle tus pesos a la burocracia.' };
  };

  const currentRank = getHunterRank(reputationXP);

  // Handle importing games in batch
  const handleBulkImportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawSteamWishlistText.trim()) return;

    playClickSound();

    // Parse lines or comma separated values
    const titles = rawSteamWishlistText
      .split(/[\n,;]/)
      .map(item => item.trim())
      .filter(item => item.length > 2);

    if (titles.length === 0) {
      setImportSuccessMsg('Error: No se detectaron títulos válidos. Ingresá al menos nombres de juegos.');
      setTimeout(() => setImportSuccessMsg(null), 3000);
      return;
    }

    onBulkImportAlerts(titles, importSelectedPlatform);
    addXP(titles.length * 40); // Earn 40 XP per game imported in batch
    playSuccessSound();

    setImportSuccessMsg(`¡Éxito! Se agendaron ${titles.length} juegos en tu radar.`);
    setRawSteamWishlistText('');
    setTimeout(() => setImportSuccessMsg(null), 4000);
  };

  // Sample API Code block we present to other devs
  const apiCodeSnippet = `// API de Precios y Cotizaciones Cambiarias - TheGameOff AR
fetch('https://thegameoff.com/api/rates')
  .then(res => res.json())
  .then(data => {
    console.log("Dólar oficial ARS:", data.rates.dolarOficial);
    console.log("Impuesto PAIS:", data.rates.paisRate * 100 + "%");
  });`;

  const copyApiCode = async () => {
    playClickSound();
    try {
      await navigator.clipboard.writeText(apiCodeSnippet);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="bg-slate-900 border border-indigo-500/10 rounded-2xl p-5 shadow-xl flex flex-col gap-4" id="power-tools-hub-panel">
      
      {/* Top Banner & Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3" id="pt-header">
        <div className="flex items-center gap-2">
          <Terminal className="text-indigo-400 w-5 h-5 shrink-0" />
          <div>
            <h4 className="text-sm font-serif font-black uppercase text-white tracking-widest leading-none">
              Módulos de Power User
            </h4>
            <span className="text-[10px] text-slate-500 font-sans block mt-0.5">
              Optimización de presupuesto, importador Wishlist, API fiscal y gamificación.
            </span>
          </div>
        </div>

        {/* Floating XP Badge */}
        <div className="bg-indigo-950/60 border border-indigo-500/20 rounded px-2.5 py-1 flex items-center gap-1.5 self-start sm:self-center" title="Tu reputación reportando ofertas y usando el sitio">
          <Coins className="w-3.5 h-3.5 text-yellow-400 animate-spin" />
          <span className="text-[10px] font-mono font-bold text-indigo-300">
            {reputationXP} XP
          </span>
        </div>
      </div>

      {/* Segmented controls navigation tabs */}
      <div className="grid grid-cols-4 gap-1 bg-slate-950/80 p-1 rounded-lg border border-slate-850 text-[10px] uppercase font-bold tracking-wider text-center" id="segment-nav-power-user">
        <button
          onClick={() => { playClickSound(); setActiveSubTab('budget'); }}
          className={`py-1.5 rounded transition ${
            activeSubTab === 'budget' 
              ? 'bg-indigo-600 text-white shadow' 
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Presupuesto
        </button>
        <button
          onClick={() => { playClickSound(); setActiveSubTab('steam_sync'); }}
          className={`py-1.5 rounded transition ${
            activeSubTab === 'steam_sync' 
              ? 'bg-indigo-600 text-white shadow' 
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Importador
        </button>
        <button
          onClick={() => { playClickSound(); setActiveSubTab('reputation'); }}
          className={`py-1.5 rounded transition ${
            activeSubTab === 'reputation' 
              ? 'bg-indigo-600 text-white shadow' 
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Hunters
        </button>
        <button
          onClick={() => { playClickSound(); setActiveSubTab('api_dev'); }}
          className={`py-1.5 rounded transition ${
            activeSubTab === 'api_dev' 
              ? 'bg-indigo-600 text-white shadow' 
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          API Dev
        </button>
      </div>

      {/* Dynamic Tab Body renders */}
      <div className="min-h-[140px]" id="pt-dynamic-content">
        
        {/* TAB 1: Budget Cap Controller */}
        {activeSubTab === 'budget' && (
          <div className="space-y-3 animate-fade-in" id="pt-sub-budget">
            <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
              Establecé un <strong>tope mensual de gastos con tarjeta</strong>. La aplicación aplicará un inteligente semáforo fiscal y sugerirá de forma instantánea si el juego entra en tus fondos disponibles incluyendo alícuotas e impuestos provinciales.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-3 bg-slate-950/60 p-3 rounded-xl border border-white/5">
              <div className="w-full sm:w-1/2">
                <label className="text-[10px] text-slate-500 uppercase block mb-1 font-mono">Presupuesto Mensual Máx.</label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-slate-400 text-xs font-bold font-mono">$</span>
                  <input
                    type="number"
                    value={maxBudget || ''}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      setMaxBudget(val);
                      // Adding subtle reward for setting up tracking
                      if (maxBudget === 0 && val > 0) addXP(30);
                    }}
                    placeholder="Ninguno establecido"
                    className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 pl-6 pr-3 py-1.5 rounded-lg text-xs text-white outline-none font-semibold font-mono"
                  />
                </div>
              </div>

              <div className="w-full sm:w-1/2 text-center sm:text-left">
                {maxBudget > 0 ? (
                  <div className="space-y-1">
                    <span className="text-[9px] bg-indigo-950 text-indigo-300 uppercase font-mono font-bold px-2 py-0.5 rounded border border-indigo-500/20">
                      Capilares Activos 🟢
                    </span>
                    <p className="text-[11px] text-slate-400 leading-tight">
                      Filtro dinámico de carritos activado. Alertas inteligentes visibles en cada card del catálogo.
                    </p>
                  </div>
                ) : (
                  <p className="text-slate-500 text-[11px] leading-tight">
                    * Ingresá un monto límite (por ejemplo, 30000 pesos) para inicializar el comparador de juego eficiente.
                  </p>
                )}
              </div>
            </div>

            {maxBudget > 0 && (
              <button
                onClick={() => {
                  playClickSound();
                  setMaxBudget(0);
                }}
                className="text-[10px] uppercase font-bold text-rose-400 hover:text-rose-300 tracking-wider font-sans self-start"
              >
                Limpiar Presupuesto ❌
              </button>
            )}
          </div>
        )}

        {/* TAB 2: Steam Wishlist file/text bulk importer */}
        {activeSubTab === 'steam_sync' && (
          <form onSubmit={handleBulkImportSubmit} className="space-y-3 animate-fade-in" id="pt-sub-steam">
            <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
              ¡No compiles a mano! Pegá tu lista de deseados de Steam (títulos de juegos separados por líneas o comas) o JSON para ingresarlos en lote directamente a tu radar local.
            </p>

            <div className="space-y-2">
              <textarea
                value={rawSteamWishlistText}
                onChange={(e) => setRawSteamWishlistText(e.target.value)}
                placeholder="Ejemplo:&#10;Elden Ring&#10;Hades II&#10;Silksong"
                className="w-full bg-slate-950 border border-slate-850 p-2.5 rounded-xl text-xs text-slate-300 font-mono h-20 focus:border-indigo-500 focus:outline-none resize-none"
              />

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Tienda Destino:</span>
                  <select
                    value={importSelectedPlatform}
                    onChange={(e) => setImportSelectedPlatform(e.target.value as Platform)}
                    className="bg-slate-950 border border-slate-800 p-1 rounded font-mono text-[10px] text-indigo-400 pointer"
                  >
                    <option value={Platform.STEAM}>Steam (USD)</option>
                    <option value={Platform.XBOX}>Xbox Store (ARS)</option>
                    <option value={Platform.NINTENDO}>eShop Switch (ARS)</option>
                    <option value={Platform.PLAYSTATION}>PlayStation Store (USD)</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] uppercase py-1.5 px-3 rounded-lg tracking-wider flex items-center gap-1 shadow transition"
                >
                  <Upload className="w-3 h-3" /> Importar e Iniciar Vigilante
                </button>
              </div>
            </div>

            {importSuccessMsg && (
              <div className={`mt-2 p-2 rounded text-[10px] font-bold text-center ${importSuccessMsg.startsWith('Error') ? 'bg-rose-950/40 border border-rose-500/25 text-rose-300' : 'bg-teal-950/40 border border-teal-500/25 text-teal-300'}`}>
                {importSuccessMsg}
              </div>
            )}
          </form>
        )}

        {/* TAB 3: Reputation hunter ranking tracker */}
        {activeSubTab === 'reputation' && (
          <div className="space-y-3 animate-fade-in" id="pt-sub-reputation">
            <div className="p-3 rounded-xl bg-slate-950/80 border border-white/5 flex items-start gap-3">
              <div className="p-2 bg-indigo-950 border border-indigo-500/25 rounded-lg text-indigo-400">
                <Award className="w-5 h-5 text-yellow-400" />
              </div>
              <div className="space-y-1">
                <strong className="text-xs text-white block font-serif uppercase tracking-wider">{currentRank.title}</strong>
                <p className="text-[11px] text-slate-400 leading-relaxed font-sans">{currentRank.text}</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-[9px] text-slate-500 uppercase font-mono font-bold tracking-widest block">Insignias Adquiridas</span>
              <div className="flex gap-2 flex-wrap">
                <span className="text-[9.5px] font-bold font-sans px-2 py-0.5 rounded-full bg-indigo-950 border border-indigo-500/20 text-indigo-300 flex items-center gap-1">
                  🎗️ Votante del Ahorro
                </span>
                
                {reputationXP >= 150 ? (
                  <span className="text-[9.5px] font-bold font-sans px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-500/20 text-emerald-300 flex items-center gap-1">
                    🎯 Radar Maestro
                  </span>
                ) : (
                  <span className="text-[9.5px] font-bold font-sans px-2 py-0.5 rounded-full bg-slate-950 border border-slate-850 text-slate-500 opacity-50 flex items-center gap-1" title="Alcanzá 150 XP para desbloquear">
                    🔒 Radar Maestro (150 XP)
                  </span>
                )}

                {maxBudget > 0 && (
                  <span className="text-[9.5px] font-bold font-sans px-2 py-0.5 rounded-full bg-amber-950 border border-amber-500/20 text-amber-300 flex items-center gap-1">
                    🛡️ Controlador Fiscal
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: API developers description */}
        {activeSubTab === 'api_dev' && (
          <div className="space-y-3 animate-fade-in" id="pt-sub-apidev">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider block">Endpoints Cambiarias</span>
              <span className="text-[9px] bg-green-950 text-green-300 font-bold uppercase px-1.5 py-0.2 rounded font-sans tracking-wide">
                Online ●
              </span>
            </div>
            
            <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
              Proporcionamos tasas oficiales diarias actualizadas con impuestos calculados para toda la comunidad de desarrolladores de software en Argentina. Consulta gratis:
            </p>

            <div className="relative">
              <pre className="bg-slate-950 p-3 rounded-lg border border-slate-850 text-[10px] font-mono text-[#818cf8] overflow-x-auto h-20 leading-snug">
                {apiCodeSnippet}
              </pre>
              <button
                onClick={copyApiCode}
                className="absolute top-2 right-2 p-1.5 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition"
                title="Copiar código de desarrollo"
                id="btn-copy-dev-snippet"
              >
                {copiedCode ? <Check className="w-3 h-3 text-teal-400" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
            <p className="text-[8.5px] text-slate-500 font-mono italic">
              * El consumo es irrestricto sin Token de autorización para fines no lucrativos de software libre nacional.
            </p>
          </div>
        )}

      </div>

      <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-[10px] text-slate-500 font-mono">
        <span className="flex items-center gap-1 text-slate-550">
          📍 PWA offline activo
        </span>
        <span className="text-slate-550">
          Cotización Dólar Bancario: Sincro ✅
        </span>
      </div>

    </div>
  );
}
