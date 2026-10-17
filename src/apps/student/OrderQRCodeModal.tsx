import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Order } from '../../types';
import {
  X,
  CheckCircle2,
  Clock,
  Sparkles,
  MapPin,
  Calendar,
  WifiOff,
  MessageCircle,
  Copy,
  Check,
  CreditCard,
  AlertCircle,
} from 'lucide-react';

interface OrderQRCodeModalProps {
  order: Order;
  isOpen: boolean;
  onClose: () => void;
}

export const OrderQRCodeModal: React.FC<OrderQRCodeModalProps> = ({ order, isOpen, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [copied, setCopied] = useState(false);
  const [showWhatsAppPreview, setShowWhatsAppPreview] = useState(false);

  useEffect(() => {
    if (isOpen && canvasRef.current) {
      QRCode.toCanvas(
        canvasRef.current,
        JSON.stringify({
          orderId: order.id,
          pickupCode: order.pickupCode,
          studentName: order.studentName,
          status: order.status,
        }),
        {
          width: 210,
          margin: 1.5,
          color: {
            dark: '#0f172a',
            light: '#ffffff',
          },
        },
        (error) => {
          if (error) console.error('Error generating QR', error);
        }
      );
    }
  }, [isOpen, order]);

  if (!isOpen) return null;

  const handleCopyCode = () => {
    navigator.clipboard?.writeText(order.pickupCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isScheduled = order.pickupType === 'programado';

  const whatsAppMessage = `¡Hola ${order.studentName}! 🎉 Tu pedido de CampusBite está LISTO para recoger en la barra de ${order.locationName}.\n\nCódigo de entrega: #${order.pickupCode}\nItems: ${order.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}\n\n¡Buen provecho!`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-orange-600 to-amber-600 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-200" />
            <h3 className="font-bold text-base">Pase de Recogida Digital</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4 flex-1 text-center">
          {/* Offline Resilience Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Disponible sin conexión (Caché local seguro)</span>
          </div>

          {/* Location & Schedule header */}
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-left text-xs space-y-1.5">
            <div className="flex items-center gap-2 text-slate-800 font-bold">
              <MapPin className="w-3.5 h-3.5 text-orange-600 shrink-0" />
              <span>{order.locationName}</span>
            </div>
            {isScheduled && (
              <div className="flex items-center gap-2 text-indigo-700 font-semibold bg-indigo-50 px-2 py-1 rounded-xl">
                <Calendar className="w-3.5 h-3.5" />
                <span>Programado para: {order.scheduledTime} (Receso)</span>
              </div>
            )}
            <div className="flex items-center justify-between text-slate-500 pt-1 border-t border-slate-200/60">
              <span>Estado actual:</span>
              <span className="font-bold uppercase text-orange-600 text-[11px]">
                {order.status === 'listo'
                  ? '¡LISTO PARA RECOGER!'
                  : order.status === 'preparando'
                  ? 'EN PREPARACIÓN'
                  : 'RECIBIDO EN COCINA'}
              </span>
            </div>
          </div>

          {/* QR Canvas */}
          <div className="p-3 bg-white rounded-2xl border-2 border-dashed border-orange-300 inline-block shadow-inner mx-auto">
            <canvas ref={canvasRef} className="rounded-lg max-w-full" />
          </div>

          {/* Big Pickup Code */}
          <div className="bg-orange-50 border border-orange-200 rounded-2xl p-3">
            <span className="text-[11px] font-bold text-orange-700 uppercase tracking-widest block mb-0.5">
              Código de Entrega Rápida
            </span>
            <div className="flex items-center justify-center gap-2">
              <span className="text-3xl font-black text-orange-950 font-mono tracking-wider">
                #{order.pickupCode}
              </span>
              <button
                type="button"
                onClick={handleCopyCode}
                className="p-1.5 bg-white text-orange-700 hover:bg-orange-100 rounded-xl border border-orange-200 transition-colors"
                title="Copiar código"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-orange-800/80 mt-1">
              Muestra este código o QR en el mostrador para retirar
            </p>
          </div>

          {/* WhatsApp Simulation Button */}
          <button
            type="button"
            onClick={() => setShowWhatsAppPreview(!showWhatsAppPreview)}
            className="w-full py-2.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2"
          >
            <MessageCircle className="w-4 h-4 text-emerald-600" />
            <span>Simular Notificación por WhatsApp</span>
          </button>

          {showWhatsAppPreview && (
            <div className="bg-emerald-950 text-white p-3.5 rounded-2xl text-left text-xs space-y-2 animate-in fade-in">
              <div className="flex items-center justify-between text-emerald-300 font-bold text-[11px]">
                <span>Mensaje de WhatsApp automático</span>
                <span className="bg-emerald-800 text-[10px] px-1.5 py-0.5 rounded">Listo</span>
              </div>
              <p className="whitespace-pre-line text-emerald-100 font-sans leading-relaxed text-[11px] bg-emerald-900/50 p-2.5 rounded-xl border border-emerald-700/50">
                {whatsAppMessage}
              </p>
            </div>
          )}

          {/* Items breakdown with modifiers and friends */}
          <div className="text-left bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2 text-xs">
            <span className="font-bold text-slate-700 block">Detalle del Pedido:</span>
            {order.items.map((item, idx) => (
              <div key={idx} className="pb-1 border-b border-slate-200/50 last:border-none last:pb-0">
                <div className="flex justify-between font-medium text-slate-800">
                  <span>
                    {item.quantity}x {item.name}
                  </span>
                  <span>${(item.price * item.quantity).toLocaleString('es-CO')}</span>
                </div>
                {item.assignedToFriend && (
                  <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700">
                    👤 {item.assignedToFriend}
                  </span>
                )}
                {item.selectedModifiers && item.selectedModifiers.length > 0 && (
                  <div className="text-[10px] text-slate-500 pl-2">
                    {item.selectedModifiers.map((m, mIdx) => (
                      <span key={mIdx} className="block">
                        • {m.groupName}: {m.optionName} {m.priceDelta > 0 && `(+$${m.priceDelta})`}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="p-3 bg-slate-50 border-t border-slate-100 text-center shrink-0">
          <p className="text-[11px] text-slate-500 font-medium">
            ¡Sin filas! Pasa directo a la zona de entrega rápida.
          </p>
        </div>
      </div>
    </div>
  );
};
