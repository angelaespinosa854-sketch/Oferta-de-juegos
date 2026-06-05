import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, CreditCard, Landmark, Percent, Calendar, Sparkles } from 'lucide-react';
import { playClickSound } from '../utils/audio';

interface FAQItem {
  question: string;
  answer: React.ReactNode;
  icon: React.ReactNode;
  category: 'impuestos' | 'tarjetas' | 'tiendas' | 'consejos';
}

export default function GamerFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleItem = (idx: number) => {
    playClickSound();
    setOpenIndex(openIndex === idx ? null : idx);
  };

  const faqData: FAQItem[] = [
    {
      category: 'tiendas',
      icon: <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />,
      question: '¿Cuál es la tienda más económica hoy para comprar videojuegos en Argentina?',
      answer: (
        <div className="space-y-2 text-slate-300">
          <p>
            Actualmente, las tiendas de <strong className="text-emerald-400">Xbox Store</strong> y <strong className="text-rose-400">Nintendo eShop</strong> ofrecen precios regionales directamente en pesos (ARS) muy favorables, permitiendo comprar títulos destacados por una fracción de su precio dolarizado.
          </p>
          <p>
            <strong className="text-sky-400">Steam</strong> pesificó su catálogo a finales de 2023 mudando a dólares regionales (USD LATAM). Para Steam, todos los precios se expresan en dólares estadounidenses y se deben convertir usando la cotización del <strong>Dólar Tarjeta</strong>.
          </p>
        </div>
      )
    },
    {
      category: 'impuestos',
      icon: <Percent className="w-4 h-4 text-indigo-400 shrink-0" />,
      question: '¿Por qué me cobran tantos impuestos y qué porcentaje exacto pago?',
      answer: (
        <div className="space-y-2 text-slate-300">
          <p>
            Las compras de servicios digitales en el exterior y tiendas extranjeras están reguladas por leyes nacionales que suman un paquete impositivo al tipo de cambio oficial:
          </p>
          <ul className="list-disc list-inside space-y-1 text-slate-400 pl-1">
            <li><strong className="text-white">IVA (Impuesto al Valor Agregado):</strong> 21%</li>
            <li><strong className="text-white">Impuesto PAIS (Servicios Digitales):</strong> 8%</li>
            <li><strong className="text-white">Percepción de Ganancias / Bienes Personales:</strong> 30%</li>
            <li><strong className="text-white">Ingresos Brutos (IIBB):</strong> Variable por provincia (2% en CABA/PBA, hasta 5.5% en otras).</li>
          </ul>
          <p className="text-xs bg-slate-950 p-2 rounded border border-slate-800 text-amber-300 font-mono mt-2">
            Multiplicador aproximado hoy: Base ARS * 1.59 o 1.63 según tu provincia de residencia.
          </p>
        </div>
      )
    },
    {
      category: 'tarjetas',
      icon: <CreditCard className="w-4 h-4 text-emerald-400 shrink-0" />,
      question: '¿Qué tarjetas y billeteras virtuales puedo usar para pagar?',
      answer: (
        <div className="space-y-2 text-slate-300">
          <p>
            Podés usar cualquiera de las siguientes herramientas habilitadas para pagos internacionales:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2 text-xs">
            <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-850">
              <strong className="text-emerald-400 block mb-1">💳 Prepagas y Digitales</strong>
              Mercado Pago, Lemon Cash, Ualá, Belo o Astropay. Son ideales para controlar el saldo, pero algunas aplican cotizaciones cambiarias propias ligeramente mayores que el dólar oficial bancario.
            </div>
            <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-850">
              <strong className="text-cyan-400 block mb-1">🏦 Tarjetas Bancarias</strong>
              Crédito o débito de bancos tradicionales (Galicia, BBVA, Santander, Brubank). Toman el valor exacto del dólar oficial minorista del día de cobro de los impuestos.
            </div>
          </div>
        </div>
      )
    },
    {
      category: 'consejos',
      icon: <Landmark className="w-4 h-4 text-sky-450 shrink-0" />,
      question: '¿Cómo puedo pagar la tarjeta con dólares MEP o ahorros para evitar los impuestos?',
      answer: (
        <div className="space-y-2 text-slate-300 font-sans">
          <p>
            Si tu resumen de la tarjeta de crédito cierra con cargos en dólares, podés depositarlos o transferir dólares MEP/ahorro directamente a tu cuenta bancaria y realizar el pago usando esa divisa:
          </p>
          <ol className="list-decimal list-inside space-y-1.5 text-slate-400 pl-1 text-[11px]">
            <li>Esperá a que cierre la tarjeta pero realizá el pago <span className="text-white font-bold">antes del vencimiento</span>.</li>
            <li>Pagá el monto exacto en dólares de tu resumen con los dólares depositados en tu caja de ahorros en USD.</li>
            <li>Al pagar con dólares propios, el banco <span className="text-emerald-400 font-bold">debería deducir/devolver los impuestos</span> (Impuesto PAIS y Percepciones) en el siguiente mes o no cobrártelos en el momento.</li>
          </ol>
          <p className="text-[10px] text-slate-550 border-t border-slate-800/60 pt-1.5 mt-1 italic">
            * Consulta previa con tu banco ya que los flujos administrativos para la exención del Impuesto PAIS pueden variar según la entidad.
          </p>
        </div>
      )
    },
    {
      category: 'consejos',
      icon: <Calendar className="w-4 h-4 text-pink-400 shrink-0" />,
      question: '¿Cuándo y cómo pido el reembolso de la percepción de Ganancias a la AFIP?',
      answer: (
        <div className="space-y-2 text-slate-300">
          <p>
            La percepción del 30% cobrada en concepto de adelanto de Ganancias es recuperable una vez finalizado el año calendario.
          </p>
          <p className="text-[11px] text-slate-400">
            A partir del <strong>1 de enero de cada año</strong>, ingresá al portal oficial de AFIP con tu clave fiscal (mínimo nivel 2), buscá el servicio <strong className="text-white">"Devolución de Percepciones (Formulario 1735)"</strong>, seleccioná el período correspondiente al año anterior y solicitá la devolución. El dinero se depositará directamente en tu cuenta de banco declarada con número de CBU.
          </p>
        </div>
      )
    }
  ];

  return (
    <div className="bg-slate-900 border border-slate-850 rounded-2xl p-5 shadow-xl" id="gamer-faq-externo-ar">
      <div className="flex items-center gap-2 mb-4 border-b border-slate-800 pb-3">
        <HelpCircle className="w-5 h-5 text-indigo-400 shrink-0" />
        <div>
          <h4 className="text-sm font-serif font-black uppercase text-white tracking-widest leading-tight">
            Guía y FAQ para Compras en el Exterior
          </h4>
          <span className="text-[10px] text-slate-500 font-sans block">
            Todo lo que necesitás saber sobre impuestos, tarjetas y normativas vigentes en Argentina.
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {faqData.map((item, idx) => {
          const isOpen = openIndex === idx;

          const categoryBadges: Record<string, { label: string; style: string }> = {
            'impuestos': { label: 'Impuestos', style: 'bg-indigo-950/40 text-indigo-300 border-indigo-500/20' },
            'tarjetas': { label: 'Tarjetas', style: 'bg-emerald-950/40 text-emerald-300 border-emerald-500/20' },
            'tiendas': { label: 'Tiendas', style: 'bg-orange-950/40 text-orange-300 border-orange-500/20' },
            'consejos': { label: 'Consejo Pro', style: 'bg-pink-950/40 text-pink-300 border-pink-500/20' },
          };
          const badge = categoryBadges[item.category];

          return (
            <div 
              key={idx}
              className={`border rounded-xl transition-all ${
                isOpen 
                  ? 'bg-slate-950/50 border-indigo-500/30 shadow-md shadow-indigo-950/25' 
                  : 'bg-slate-950/20 border-slate-850 hover:border-slate-800 hover:bg-slate-950/40'
              }`}
            >
              <button
                onClick={() => toggleItem(idx)}
                className="w-full text-left p-3.5 flex items-start justify-between gap-3 text-xs font-bold font-sans text-white focus:outline-none"
              >
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 shrink-0">
                    {item.icon}
                  </div>
                  <div className="space-y-1">
                    <span className={`text-[8px] font-mono border px-1.5 py-0.2 rounded uppercase ${badge.style}`}>
                      {badge.label}
                    </span>
                    <h5 className="text-[12px] text-slate-100 hover:text-indigo-400 transition-colors leading-snug">
                      {item.question}
                    </h5>
                  </div>
                </div>
                
                <span className="p-1 rounded bg-slate-900 border border-slate-800 text-slate-400 shrink-0 mt-0.5">
                  {isOpen ? <ChevronUp className="w-3.5 h-3.5 text-indigo-400" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </span>
              </button>

              {isOpen && (
                <div className="px-5 pb-4 pt-1.5 border-t border-slate-900 text-xs text-slate-300 font-sans leading-relaxed animate-fade-in">
                  {item.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 p-3 bg-indigo-950/15 border border-indigo-500/10 rounded-xl text-[11px] text-indigo-300 font-sans">
        📌 <strong>Importante:</strong> Las normativas e impuestos de importación de bienes digitales pueden cambiar por decisión del Banco Central y el Ministerio de Economía. Te recomendamos chequear siempre esta calculadora antes de validar un carrito de compras.
      </div>
    </div>
  );
}
