import React, { useState } from 'react';
import { Percent, TrendingUp, Info, HelpCircle, ArrowRightLeft, Landmark, Copy, Check, Download, Upload } from 'lucide-react';
import { TaxConfig } from '../types';
import { PROVINCES, calculatePrice, formatCurrency, getTaxPercentage } from '../utils/taxCalculator';
import { playClickSound } from '../utils/audio';

interface TaxCalculatorProps {
  taxConfig: TaxConfig;
  setTaxConfig: (config: TaxConfig) => void;
}

export default function TaxCalculator({ taxConfig, setTaxConfig }: TaxCalculatorProps) {
  const [simulationPrice, setSimulationPrice] = useState<string>('29.99');
  const [simulationCurrency, setSimulationCurrency] = useState<'USD' | 'ARS'>('USD');
  const [simulationStore, setSimulationStore] = useState<'steam' | 'psn' | 'xbox' | 'nintendo'>('steam');
  const [showExplanation, setShowExplanation] = useState(false);
  
  // Portability state variables
  const [importText, setImportText] = useState('');
  const [exportSuccess, setExportSuccess] = useState(false);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const [showConfigPortability, setShowConfigPortability] = useState(false);

  // Handle province change
  const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    playClickSound();
    const provName = e.target.value;
    const provObj = PROVINCES.find(p => p.name === provName);
    if (provObj) {
      setTaxConfig({
        ...taxConfig,
        iibbProvince: provName,
        iibbRate: provObj.rate,
      });
    }
  };

  const handleInputChange = (field: keyof TaxConfig, value: string) => {
    const num = parseFloat(value);
    if (!isNaN(num)) {
      setTaxConfig({
        ...taxConfig,
        [field]: num,
      });
    }
  };

  const priceNum = parseFloat(simulationPrice) || 0;
  const result = calculatePrice(priceNum, simulationCurrency, taxConfig);
  const taxPercentTotal = getTaxPercentage(taxConfig);

  // Compute proportion percentages
  const basePercentOfTotal = result.finalPriceArs > 0 
    ? (result.basePriceArs / result.finalPriceArs) * 100 
    : 100;
  
  const taxPercentOfTotal = 100 - basePercentOfTotal;

  return (
    <div className="bg-slate-900 border border-slate-850 rounded-2xl p-5 shadow-xl relative" id="tax-configurator-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-serif font-bold text-sm md:text-base text-white flex items-center gap-2 tracking-widest uppercase">
          <Landmark className="w-4.5 h-4.5 text-sky-400" />
          Cálculo Cambiario e Impuestos
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => {
              playClickSound();
              setShowConfigPortability(!showConfigPortability);
            }}
            className={`text-xs flex items-center gap-1 px-2 py-1 rounded-md transition-colors ${
              showConfigPortability 
                ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30' 
                : 'text-slate-400 hover:text-indigo-400 bg-slate-850'
            }`}
            id="btn-tax-portability"
            title="Exportar o Importar código de impuestos"
          >
            <Download className="w-3.5 h-3.5" />
            Portar Config 💾
          </button>
          
          <button
            onClick={() => {
              playClickSound();
              setShowExplanation(!showExplanation);
            }}
            className="text-slate-400 hover:text-sky-400 text-xs flex items-center gap-1 bg-slate-850 px-2 py-1 rounded-md transition-colors"
            id="btn-tax-info"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            ¿Cómo se calcula?
          </button>
        </div>
      </div>

      {showExplanation && (
        <div className="mb-4 p-4 rounded-xl bg-sky-950/20 border border-sky-500/20 text-xs text-sky-200 leading-relaxed">
          <p className="font-semibold text-white mb-1.5 flex items-center gap-1">
            <Info className="w-4 h-4 text-sky-400" /> Explicación de Impuestos Digitales (Argentina)
          </p>
          Las plataformas de videojuegos extranjeras (como Steam, Playstation Store, Xbox o Nintendo) califican fiscalmente como Servicios Digitales del Exterior. Al abonarlas con tarjetas de débito/crédito argentinas, se aplican automáticamente los siguientes recargos sobre el valor base pesos:
          <ul className="list-disc list-inside mt-1 space-y-1 text-slate-300">
            <li><strong className="text-white">IVA Servicios Digitales (21%):</strong> Gravado por ley nacional.</li>
            <li><strong className="text-white">Impuesto PAIS (8%):</strong> Tasa reducida para servicios digitales.</li>
            <li><strong className="text-white">Percepciones Nacionales (30%):</strong> Retención combinada de Ganancias/Bienes Personales.</li>
            <li><strong className="text-white">Ingresos Brutos Provinciales (IIBB - 2% a 5.5%):</strong> Varía según tu provincia de residencia.</li>
          </ul>
          <p className="mt-2 text-amber-300/90 font-medium">
            *Steam y Playstation facturan directamente en Dólares (USD), por lo que primero se multiplica por el Dólar Oficial nacional y luego se adicionan estos tributos.
          </p>
        </div>
      )}

      {showConfigPortability && (
        <div className="mb-4 p-4 rounded-xl bg-slate-950 border border-indigo-500/25 text-xs text-slate-300 animate-fade-in" id="portability-panel-card">
          <p className="font-bold text-white mb-2 flex items-center gap-1.5 uppercase font-mono text-[11px] tracking-wide text-indigo-400">
            <Download className="w-4 h-4 text-indigo-400" /> Exportar / Importar Configuración Fiscal
          </p>
          <p className="text-[11px] text-slate-400 mb-3">
            Guardá una copia de seguridad o transferila a otro navegador copiando el código generado.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Export block */}
            <div className="space-y-2">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Código Actual (Exportar)</span>
              <div className="relative">
                <textarea
                  readOnly
                  value={JSON.stringify(taxConfig, null, 2)}
                  className="w-full bg-slate-900 border border-slate-800 p-2.5 rounded-lg text-[10px] text-[#818cf8] font-mono h-24 focus:outline-none resize-none select-all"
                  id="textarea-export-config"
                />
                <button
                  onClick={async () => {
                    playClickSound();
                    try {
                      await navigator.clipboard.writeText(JSON.stringify(taxConfig));
                      setExportSuccess(true);
                      setTimeout(() => setExportSuccess(false), 2500);
                    } catch (e) {
                      console.error("Failed to copy", e);
                    }
                  }}
                  className="absolute right-2 bottom-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-[10px] px-2.5 py-1.5 rounded transition-all flex items-center gap-1 shadow"
                  id="btn-copy-portable-config"
                >
                  {exportSuccess ? <Check className="w-3 h-3 text-teal-300" /> : <Copy className="w-3.5 h-3.5" />}
                  {exportSuccess ? 'Copiado' : 'Copiar Código'}
                </button>
              </div>
            </div>

            {/* Import block */}
            <div className="space-y-2">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Ingresar Código (Importar)</span>
              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder='Pegá el código JSON aquí para restaurar e importar...'
                className="w-full bg-slate-900 border border-slate-800 p-2.5 rounded-lg text-[10px] text-slate-300 font-mono h-24 focus:border-indigo-500 focus:outline-none resize-none"
                id="textarea-import-config"
              />
              <button
                onClick={() => {
                  playClickSound();
                  try {
                    const parsed = JSON.parse(importText.trim());
                    if (parsed && typeof parsed === 'object') {
                      if (typeof parsed.dolarOficial === 'number' && typeof parsed.iibbProvince === 'string') {
                        setTaxConfig(parsed);
                        setImportSuccess('¡Configuración restablecida e importada con éxito! 🎉');
                        setImportText('');
                        setTimeout(() => setImportSuccess(null), 3000);
                      } else {
                        setImportSuccess('Error: El formato no contiene los campos fiscales requeridos.');
                        setTimeout(() => setImportSuccess(null), 3500);
                      }
                    } else {
                      setImportSuccess('Error: Código inválido.');
                      setTimeout(() => setImportSuccess(null), 3500);
                    }
                  } catch (e) {
                    setImportSuccess('Error: Formato de configuración corrupto o inválido.');
                    setTimeout(() => setImportSuccess(null), 3500);
                  }
                }}
                className="w-full bg-slate-800 hover:bg-slate-750 text-[#f8fafc] font-semibold text-[10px] py-1.5 rounded-lg border border-slate-700 transition"
                id="btn-import-portable-config"
              >
                Cargar Configuración 📥
              </button>
            </div>
          </div>

          {importSuccess && (
            <div className={`mt-3 p-2 rounded text-[11px] font-bold text-center ${importSuccess.startsWith('Error') ? 'bg-rose-950/40 border border-rose-500/30 text-rose-300' : 'bg-teal-950/40 border border-teal-500/30 text-teal-300'}`}>
              {importSuccess}
            </div>
          )}
        </div>
      )}

      {/* Comparison Panel: Dolar Normal vs Dolar Tarjeta */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5 p-4 rounded-xl bg-slate-950/80 border border-slate-800/80">
        <div className="text-center sm:text-left flex flex-col justify-center">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">1. DÓLAR COMÚN / NORMAL (B. NACIÓN OFICIAL)</span>
          <div className="flex justify-center sm:justify-start items-baseline gap-1 mt-1">
            <span className="text-2xl font-mono font-extrabold text-sky-400">{formatCurrency(taxConfig.dolarOficial, 'ARS')}</span>
            <span className="text-xs text-slate-500 font-mono">por USD</span>
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">Referencia oficial general sin retenciones ni recargos de tarjeta.</span>
        </div>
        
        <div className="border-t sm:border-t-0 sm:border-l border-slate-800 pt-3 sm:pt-0 sm:pl-4 text-center sm:text-left flex flex-col justify-center">
          <span className="text-[10px] text-rose-400 font-bold uppercase tracking-wider block">2. DÓLAR TARJETA (CON IMPUESTOS DE VIDEOJUEGOS)</span>
          <div className="flex justify-center sm:justify-start items-baseline gap-1 mt-1">
            <span className="text-2xl font-mono font-extrabold text-rose-500">{formatCurrency(taxConfig.dolarOficial * (1 + taxConfig.iva + taxConfig.pais + taxConfig.ganancias + taxConfig.iibbRate), 'ARS')}</span>
            <span className="text-xs text-slate-500 font-mono">por USD</span>
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">Dólar final que pagás en tarjeta por tus juegos (incluye IVA, PAIS, Ganancias e IIBB [+{taxPercentTotal}%]).</span>
        </div>
      </div>

      {/* Grid of Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
        {/* Dollar Rate */}
        <div className="bg-slate-850 p-3 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-slate-400">Dólar Oficial (B. Nación)</span>
            <span className="text-[10px] bg-sky-950 text-sky-400 px-1.5 py-0.5 rounded-full font-semibold font-mono">ARS</span>
          </div>
          <div className="relative mt-2">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-sm">$</span>
            <input
              type="number"
              step="1"
              value={taxConfig.dolarOficial}
              onChange={(e) => handleInputChange('dolarOficial', e.target.value)}
              className="w-full bg-slate-900 border border-slate-750 p-2 pl-7 rounded-lg text-sm text-white font-mono focus:border-sky-500 outline-none"
              id="input-dolar-oficial"
            />
          </div>
          <span className="text-[10px] text-slate-500 mt-2 block">
            Dólar Tarjeta final: <strong className="text-slate-300 font-mono">{formatCurrency(taxConfig.dolarOficial * (1 + taxConfig.iva + taxConfig.pais + taxConfig.ganancias), 'ARS')}</strong>
          </span>
        </div>

        {/* Taxes Percent Configuration */}
        <div className="bg-slate-850 p-3 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-slate-400 font-sans">Impuestos Nacionales</span>
            <span className="text-[10px] bg-red-950 text-red-400 px-1.5 py-0.5 rounded-full font-mono">{(taxConfig.iva + taxConfig.pais + taxConfig.ganancias) * 100}%</span>
          </div>
          <div className="grid grid-cols-3 gap-1 mt-2 text-center text-xs">
            <div className="bg-slate-900/60 p-1.5 rounded border border-slate-800">
              <span className="text-[10px] text-slate-500 block">IVA</span>
              <span className="font-semibold text-white font-mono">21%</span>
            </div>
            <div className="bg-slate-900/60 p-1.5 rounded border border-slate-800">
              <span className="text-[10px] text-slate-500 block">PAIS</span>
              <span className="font-semibold text-white font-mono">8%</span>
            </div>
            <div className="bg-slate-900/60 p-1.5 rounded border border-slate-800">
              <span className="text-[10px] text-slate-500 block">Gan.</span>
              <span className="font-semibold text-white font-mono">30%</span>
            </div>
          </div>
          <span className="text-[10px] text-slate-500 mt-2 block">
            Retenciones fijadas por AFIP / RG.
          </span>
        </div>

        {/* Province selector */}
        <div className="bg-slate-850 p-3 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-slate-400">Jurisdicción (IIBB Provincial)</span>
            <span className="text-[10px] bg-emerald-950 text-emerald-400 px-1.5 py-0.5 rounded-full font-mono font-semibold">{(taxConfig.iibbRate * 100).toFixed(1)}%</span>
          </div>
          <select
            value={taxConfig.iibbProvince}
            onChange={handleProvinceChange}
            className="w-full bg-slate-900 border border-slate-750 p-2 mt-2 rounded-lg text-xs text-white outline-none focus:border-sky-500 cursor-pointer"
            id="select-province"
          >
            {PROVINCES.map(p => (
              <option key={p.name} value={p.name}>
                {p.name} ({Math.round(p.rate * 1000) / 10}% IIBB)
              </option>
            ))}
          </select>
          <span className="text-[10px] text-slate-500 mt-2 block">
            Se recarga sobre la tarjeta según domicilio fiscal.
          </span>
        </div>
      </div>

      {/* Live Interactive Tax Simulator */}
      <div className="bg-slate-950/55 p-5 rounded-xl border border-slate-850">
        <h4 className="text-sky-300 font-semibold text-xs uppercase tracking-wider mb-3.5 flex items-center gap-1.5">
          <ArrowRightLeft className="w-3.5 h-3.5 text-sky-400" />
          Simulador de Conversión de Precios de un Juego
        </h4>

        {/* Store selector that sets currency base and automatically converts value */}
        <div className="mb-4">
          <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-2">
            Paso 1: Seleccionar Tienda de Compra (Establece Divisa Original)
          </label>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            {[
              { id: 'steam' as const, name: 'Steam 🕹️', desc: 'Cotiza en USD', currency: 'USD' as const },
              { id: 'psn' as const, name: 'PlayStation Store 💙', desc: 'Cotiza en USD', currency: 'USD' as const },
              { id: 'xbox' as const, name: 'Xbox Store 💚', desc: 'Cotiza en ARS', currency: 'ARS' as const },
              { id: 'nintendo' as const, name: 'Nintendo eShop ❤️', desc: 'Cotiza en ARS', currency: 'ARS' as const }
            ].map((store) => (
              <button
                key={store.id}
                type="button"
                onClick={() => {
                  playClickSound();
                  setSimulationStore(store.id);
                  if (store.currency !== simulationCurrency) {
                    const currentPrice = parseFloat(simulationPrice) || 0;
                    if (store.currency === 'ARS') {
                      const converted = currentPrice * taxConfig.dolarOficial;
                      setSimulationPrice(currentPrice > 0 ? converted.toFixed(2) : '40000');
                    } else {
                      const converted = currentPrice / taxConfig.dolarOficial;
                      setSimulationPrice(currentPrice > 0 ? converted.toFixed(2) : '29.99');
                    }
                    setSimulationCurrency(store.currency);
                  }
                }}
                className={`p-2.5 rounded-lg border text-left transition-all ${
                  simulationStore === store.id
                    ? 'bg-slate-900 border-sky-500 text-sky-400 shadow-md shadow-sky-500/5'
                    : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                }`}
              >
                <div className="text-xs font-bold">{store.name}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">{store.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-2">
          Paso 2: Ingresar Precio Base e Intercambiar Moneda
        </label>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-xs">
                  {simulationCurrency === 'USD' ? 'u$s' : '$'}
                </span>
                <input
                  type="number"
                  step="0.01"
                  value={simulationPrice}
                  onChange={(e) => setSimulationPrice(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-750 p-2.5 pl-9 rounded-lg text-white font-mono text-sm focus:border-sky-500 outline-none"
                  placeholder="Precio del juego..."
                  id="input-sim-price"
                />
              </div>
              
              <div className="flex rounded-lg border border-slate-750 overflow-hidden shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    playClickSound();
                    if (simulationCurrency !== 'USD') {
                      const currentPrice = parseFloat(simulationPrice) || 0;
                      const converted = currentPrice / taxConfig.dolarOficial;
                      setSimulationPrice(currentPrice > 0 ? converted.toFixed(2) : '29.99');
                      setSimulationCurrency('USD');
                      setSimulationStore('steam'); // Default store with USD
                    }
                  }}
                  className={`px-3 py-1 text-xs font-mono font-bold transition-colors ${
                    simulationCurrency === 'USD' ? 'bg-sky-500 text-slate-900' : 'bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                  id="btn-currency-usd"
                >
                  USD
                </button>
                <button
                  type="button"
                  onClick={() => {
                    playClickSound();
                    if (simulationCurrency !== 'ARS') {
                      const currentPrice = parseFloat(simulationPrice) || 0;
                      const converted = currentPrice * taxConfig.dolarOficial;
                      setSimulationPrice(currentPrice > 0 ? converted.toFixed(2) : '40000');
                      setSimulationCurrency('ARS');
                      setSimulationStore('xbox'); // Default store with ARS
                    }
                  }}
                  className={`px-3 py-1 text-xs font-mono font-bold transition-colors ${
                    simulationCurrency === 'ARS' ? 'bg-sky-500 text-slate-900' : 'bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                  id="btn-currency-ars"
                >
                  ARS
                </button>
              </div>
            </div>
            <div className="text-[11px] text-slate-400 leading-normal bg-slate-900/40 p-2.5 rounded-lg border border-slate-850 mt-1">
              {simulationCurrency === 'USD' ? (
                <span>
                  🛒 <strong>Steam / PlayStation</strong>: Cotiza base en dólares. Conversión limpia a Pesos Oficiales: <strong className="font-mono text-sky-400">{formatCurrency(result.basePriceArs)}</strong> (calculado sobre $ {taxConfig.dolarOficial.toFixed(2)} por dólar oficial de aduana/tienda).
                </span>
              ) : (
                <span>
                  🛒 <strong>Xbox / Nintendo</strong>: Cotiza base directamente en pesos argentinos sin tipo de cambio. Los impuestos se gravan directamente sobre el importe base.
                </span>
              )}
            </div>
          </div>

          <div className="bg-slate-900 p-4 rounded-lg border border-slate-800 text-center flex flex-col justify-center shadow-inner">
            <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block">
              TOTAL ESTIMADO CON IMPUESTOS (+{taxPercentTotal}% de recargo)
            </span>
            <span className="text-2xl md:text-3xl font-mono font-extrabold text-emerald-400 tracking-tight mt-1.5 drop-shadow-sm">
              {formatCurrency(result.finalPriceArs, 'ARS')}
            </span>
            <span className="text-[10px] text-slate-500 font-mono mt-1 block">
              Juego Base: {formatCurrency(result.basePriceArs)} + {formatCurrency(result.taxesArs)} impuestos totales
            </span>
          </div>
        </div>

        {/* Dynamic Visual Tax Proportion Bar */}
        {result.finalPriceArs > 0 && (
          <div className="mt-5 pt-4 border-t border-slate-850/60">
            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2 font-mono">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-sky-500 block" /> 
                Juego Base Puro ({Math.round(basePercentOfTotal)}%)
              </span>
              <span className="flex items-center gap-1.5 text-rose-400">
                <span className="w-2.5 h-2.5 rounded bg-rose-500 block" />
                Recargo Impositivo Total ({Math.round(taxPercentOfTotal)}%)
              </span>
            </div>
            {/* Visual ratio bar widget */}
            <div className="w-full h-3.5 rounded-full overflow-hidden flex bg-slate-800 border border-slate-700/30">
              <div 
                className="bg-sky-500 h-full transition-all duration-300 shadow-[inset_-2px_0_4px_rgba(0,0,0,0.15)]" 
                style={{ width: `${basePercentOfTotal}%` }} 
                title="Costo de juego base"
              />
              <div 
                className="bg-rose-500 h-full transition-all duration-300 shadow-[inset_2px_0_4px_rgba(0,0,0,0.15)]" 
                style={{ width: `${taxPercentOfTotal}%` }} 
                title="Impuestos"
              />
            </div>
          </div>
        )}

        {/* Detailed Taxes Breakdown in ARS */}
        {result.finalPriceArs > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mt-4">
            <div className="bg-slate-900/70 p-2.5 rounded-lg border border-slate-800/80 flex flex-col justify-between">
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider font-mono">IVA Serv. Dig.</span>
              <span className="text-white text-[10px] font-mono mt-0.5">{taxConfig.iva * 100}%</span>
              <span className="font-mono text-sky-300 font-semibold text-xs mt-1.5 block">{formatCurrency(result.detailedTaxes.iva)}</span>
            </div>
            <div className="bg-slate-900/70 p-2.5 rounded-lg border border-slate-800/80 flex flex-col justify-between">
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider font-mono">Impuesto PAIS</span>
              <span className="text-white text-[10px] font-mono mt-0.5">{taxConfig.pais * 100}%</span>
              <span className="font-mono text-sky-300 font-semibold text-xs mt-1.5 block">{formatCurrency(result.detailedTaxes.pais)}</span>
            </div>
            <div className="bg-slate-900/70 p-2.5 rounded-lg border border-slate-800/80 flex flex-col justify-between">
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider font-mono">Percepciones</span>
              <span className="text-white text-[10px] font-mono mt-0.5">{taxConfig.ganancias * 100}%</span>
              <span className="font-mono text-sky-300 font-semibold text-xs mt-1.5 block">{formatCurrency(result.detailedTaxes.ganancias)}</span>
            </div>
            <div className="bg-slate-900/70 p-2.5 rounded-lg border border-slate-800/80 flex flex-col justify-between">
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider font-mono">IIBB ({taxConfig.iibbProvince.split(' ')[0]})</span>
              <span className="text-white text-[10px] font-mono mt-0.5">{(taxConfig.iibbRate * 100).toFixed(1)}%</span>
              <span className="font-mono text-sky-300 font-semibold text-xs mt-1.5 block">{formatCurrency(result.detailedTaxes.iibb)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
