import React, { useState } from 'react';
import { Order, Product } from '../../types';
import { Layers, Coffee, Flame, Sandwich, Cookie, CheckSquare, Square, ChevronDown, ChevronUp } from 'lucide-react';

interface BatchPreparationPanelProps {
  orders: Order[];
  products: Product[];
}

export const BatchPreparationPanel: React.FC<BatchPreparationPanelProps> = ({ orders, products }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [tickedBatches, setTickedBatches] = useState<Record<string, boolean>>({});

  // Filter orders that are currently in preparation or received
  const activeOrders = orders.filter((o) => o.status === 'recibido' || o.status === 'preparando');

  const productMap = new Map(products.map((p) => [p.id, p]));

  // Aggregate items across active orders
  const batchCounts: Record<string, { name: string; quantity: number; station: string; modifiersCount: number }> = {};

  activeOrders.forEach((o) => {
    o.items.forEach((item) => {
      const prod = productMap.get(item.productId);
      const station = prod?.station || 'plancha_cocina';
      const key = item.productId;

      if (!batchCounts[key]) {
        batchCounts[key] = {
          name: item.name,
          quantity: 0,
          station,
          modifiersCount: 0,
        };
      }
      batchCounts[key].quantity += item.quantity;
      if (item.selectedModifiers && item.selectedModifiers.length > 0) {
        batchCounts[key].modifiersCount += item.quantity;
      }
    });
  });

  const batches = Object.entries(batchCounts);
  const totalItemsCount = batches.reduce((sum, [, b]) => sum + b.quantity, 0);

  const toggleTick = (key: string) => {
    setTickedBatches((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const getStationIcon = (station: string) => {
    switch (station) {
      case 'bebidas':
        return <Coffee className="w-3.5 h-3.5 text-amber-500" />;
      case 'reposteria':
        return <Cookie className="w-3.5 h-3.5 text-pink-500" />;
      case 'snacks_listos':
        return <Sandwich className="w-3.5 h-3.5 text-emerald-500" />;
      default:
        return <Flame className="w-3.5 h-3.5 text-orange-500" />;
    }
  };

  if (activeOrders.length === 0) return null;

  return (
    <div className="bg-slate-900 text-white rounded-2xl border border-slate-700/80 shadow-lg overflow-hidden">
      {/* Header bar */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-3.5 px-4 flex items-center justify-between gap-3 text-left hover:bg-slate-800/60 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-orange-500/20 text-orange-400 rounded-xl">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-orange-400">
                Preparación por Lotes (Batching Cocina)
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-600 text-white font-bold">
                {totalItemsCount} platos en cola
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Total acumulado entre {activeOrders.length} pedidos activos para cocinar en bloque
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-slate-400">
          <span className="text-xs">{isOpen ? 'Ocultar' : 'Ver lotes'}</span>
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {/* Expanded Batches Grid */}
      {isOpen && (
        <div className="p-3.5 bg-slate-950/70 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
          {batches.map(([key, batch]) => {
            const isTicked = !!tickedBatches[key];
            return (
              <div
                key={key}
                onClick={() => toggleTick(key)}
                className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-start justify-between gap-2 text-xs select-none ${
                  isTicked
                    ? 'bg-slate-900/40 border-slate-800 text-slate-500 line-through'
                    : 'bg-slate-900 border-slate-700/80 text-white hover:border-orange-500/50 shadow-xs'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    {getStationIcon(batch.station)}
                    <span className="text-[10px] text-slate-400 capitalize truncate">
                      {batch.station.replace('_', ' ')}
                    </span>
                  </div>
                  <span className="font-bold leading-tight block truncate">{batch.name}</span>
                  {batch.modifiersCount > 0 && (
                    <span className="text-[10px] text-amber-400 block mt-0.5 font-normal">
                      ({batch.modifiersCount} con personalización)
                    </span>
                  )}
                </div>

                <div className="flex flex-col items-end shrink-0">
                  <span className="text-base font-black text-orange-400 leading-none">
                    x{batch.quantity}
                  </span>
                  <div className="mt-1">
                    {isTicked ? (
                      <CheckSquare className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-600" />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
