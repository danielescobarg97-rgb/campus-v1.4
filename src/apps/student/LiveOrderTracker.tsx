import React, { useEffect } from 'react';
import { Order, OrderStatus } from '../../types';
import { playReadyChime, playOrderChime } from '../../utils/audio';
import {
  Clock,
  ChefHat,
  CheckCircle2,
  QrCode,
  Sparkles,
  MapPin,
  Calendar,
  AlertCircle,
  Bell,
  ArrowRight,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface LiveOrderTrackerProps {
  order: Order;
  onOpenQR: () => void;
  onDismiss?: () => void;
}

const STEPS: { status: OrderStatus; label: string; icon: React.FC<{ className?: string }> }[] = [
  { status: 'recibido', label: 'Recibido', icon: Clock },
  { status: 'preparando', label: 'En Preparación', icon: ChefHat },
  { status: 'listo', label: '¡Listo!', icon: Sparkles },
  { status: 'entregado', label: 'Entregado', icon: CheckCircle2 },
];

export const LiveOrderTracker: React.FC<LiveOrderTrackerProps> = ({ order, onOpenQR, onDismiss }) => {
  const currentStepIndex = STEPS.findIndex((s) => s.status === order.status);

  useEffect(() => {
    if (order.status === 'listo') {
      playReadyChime();
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.8 },
        });
      } catch (e) {
        console.debug('Confetti error', e);
      }
    } else if (order.status === 'preparando') {
      playOrderChime();
    }
  }, [order.status]);

  const isReady = order.status === 'listo';
  const isScheduled = order.pickupType === 'programado';

  return (
    <div
      className={`rounded-3xl p-4 sm:p-5 shadow-xl border transition-all ${
        isReady
          ? 'bg-gradient-to-br from-emerald-600 via-teal-700 to-emerald-800 text-white border-emerald-400/50 shadow-emerald-500/20'
          : 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white border-slate-700/60 shadow-slate-950/30'
      }`}
    >
      {/* Header bar */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div
            className={`p-2 rounded-xl ${
              isReady ? 'bg-white/20 text-white' : 'bg-orange-500/20 text-orange-400'
            }`}
          >
            {isReady ? <Sparkles className="w-5 h-5 animate-spin" /> : <ChefHat className="w-5 h-5 animate-pulse" />}
          </div>
          <div>
            <span className="text-[11px] font-bold tracking-wider uppercase opacity-80 block">
              {isReady ? '¡TU PEDIDO ESTÁ LISTO!' : 'Seguimiento en Vivo'}
            </span>
            <span className="text-sm font-black flex items-center gap-1.5">
              Pedido #{order.pickupCode}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenQR}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-bold transition-all shadow-md active:scale-95 ${
            isReady
              ? 'bg-white text-emerald-900 hover:bg-emerald-50'
              : 'bg-orange-600 text-white hover:bg-orange-500'
          }`}
        >
          <QrCode className="w-4 h-4" />
          <span>Ver Pase QR</span>
        </button>
      </div>

      {/* Location and Scheduled Info */}
      <div className="flex flex-wrap items-center gap-2 text-xs py-1.5 opacity-90 mb-3 border-b border-white/10">
        <span className="flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5 text-orange-400" />
          {order.locationName}
        </span>
        {isScheduled && (
          <span className="flex items-center gap-1 font-semibold px-2 py-0.5 rounded-full bg-indigo-500/30 border border-indigo-400/40 text-indigo-200">
            <Calendar className="w-3 h-3" />
            Recojo: {order.scheduledTime} (Receso)
          </span>
        )}
      </div>

      {/* Progress Stepper */}
      <div className="relative pt-2 pb-1">
        <div className="flex items-center justify-between relative z-10">
          {STEPS.map((step, idx) => {
            const isCompleted = idx <= currentStepIndex;
            const isCurrent = idx === currentStepIndex;
            const Icon = step.icon;

            return (
              <div key={step.status} className="flex flex-col items-center flex-1 text-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                    isCurrent
                      ? isReady
                        ? 'bg-white text-emerald-800 ring-4 ring-white/30 scale-110 shadow-lg'
                        : 'bg-orange-500 text-white ring-4 ring-orange-500/30 scale-110 shadow-lg'
                      : isCompleted
                      ? isReady
                        ? 'bg-emerald-400 text-emerald-950'
                        : 'bg-orange-600/70 text-white'
                      : 'bg-white/10 text-white/40'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <span
                  className={`text-[10px] mt-1.5 font-bold leading-tight ${
                    isCurrent
                      ? 'text-white'
                      : isCompleted
                      ? 'text-white/80'
                      : 'text-white/40'
                  }`}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Items list preview */}
      <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between text-xs text-white/80">
        <span className="truncate max-w-[200px]">
          {order.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
        </span>
        <span className="font-bold text-white shrink-0">
          ${order.totalPrice.toLocaleString('es-CO')}
        </span>
      </div>
    </div>
  );
};
