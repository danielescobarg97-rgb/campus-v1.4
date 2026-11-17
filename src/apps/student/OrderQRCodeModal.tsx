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
  MessageCircle,
  Copy,
  Check,
  Send,
  CheckCheck,
  Smartphone,
  ExternalLink,
  RotateCcw,
} from 'lucide-react';

interface OrderQRCodeModalProps {
  order: Order;
  isOpen: boolean;
  onClose: () => void;
}

export const OrderQRCodeModal: React.FC<OrderQRCodeModalProps> = ({ order, isOpen, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [copied, setCopied] = useState(false);
  
  // WhatsApp simulation states
  const [whatsappStatus, setWhatsappStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [showToast, setShowToast] = useState(false);
  const [sentTimestamp, setSentTimestamp] = useState<string>('');

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
            dark: '#032244',
            light: '#ffffff',
          },
        },
        (error) => {
          if (error) console.error('Error generating QR', error);
        }
      );
    }
  }, [isOpen, order]);

  // Reset WhatsApp simulation states when opening for a new order
  useEffect(() => {
    if (isOpen) {
      setWhatsappStatus('idle');
      setShowToast(false);
    }
  }, [isOpen, order.id]);

  if (!isOpen) return null;

  const handleCopyCode = () => {
    navigator.clipboard?.writeText(order.pickupCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSimulateWhatsAppNotification = () => {
    setWhatsappStatus('sending');
    setShowToast(false);

    setTimeout(() => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
      setSentTimestamp(timeStr);
      setWhatsappStatus('sent');
      setShowToast(true);

      // Auto-hide top toast banner after 4.5 seconds (status badge remains visible)
      setTimeout(() => {
        setShowToast(false);
      }, 4500);
    }, 600);
  };

  const isScheduled = order.pickupType === 'programado';

  const whatsAppMessage = `¡Hola ${order.studentName}! 🎉 Tu pedido de UNIGO está LISTO para recoger en la barra de ${order.locationName}.\n\nCódigo de entrega: #${order.pickupCode}\nItems: ${order.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}\n\n¡Buen provecho!`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#032244]/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[92vh] relative">
        {/* Animated Toast simulation alert at top */}
        {showToast && (
          <div className="absolute top-2 inset-x-2 z-50 animate-in slide-in-from-top-3 fade-in duration-300">
            <div className="bg-emerald-600 text-white p-3 rounded-2xl shadow-xl flex items-center justify-between gap-2.5 border border-emerald-400/40">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                  <Smartphone className="w-4 h-4 text-white" />
                </div>
                <div className="min-w-0 text-left">
                  <p className="text-xs font-black leading-tight flex items-center gap-1.5">
                    <span>¡Notificación Enviada con Éxito!</span>
                    <span className="text-[10px] bg-emerald-800/80 px-1.5 py-0.2 rounded font-mono">
                      WhatsApp API
                    </span>
                  </p>
                  <p className="text-[10.5px] text-emerald-100 truncate mt-0.5">
                    Mensaje con Código #{order.pickupCode} entregado al estudiante
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowToast(false)}
                className="p-1 hover:bg-emerald-700 rounded-lg text-emerald-200 hover:text-white shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="p-4 bg-[#032244] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#D7131A]" />
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
          <div className="bg-[#F5F6F8] p-3 rounded-2xl border border-slate-200 text-left text-xs space-y-1.5">
            <div className="flex items-center gap-2 text-[#032244] font-bold">
              <MapPin className="w-3.5 h-3.5 text-[#D7131A] shrink-0" />
              <span>{order.locationName}</span>
            </div>
            {isScheduled && (
              <div className="flex items-center gap-2 text-[#032244] font-semibold bg-[#032244]/5 px-2 py-1 rounded-xl">
                <Calendar className="w-3.5 h-3.5 text-[#032244]" />
                <span>Programado para: {order.scheduledTime} (Receso)</span>
              </div>
            )}
            <div className="flex items-center justify-between text-[#032244]/65 pt-1 border-t border-slate-200/60">
              <span>Estado actual:</span>
              <span className="font-bold uppercase text-[#D7131A] text-[11px]">
                {order.status === 'listo'
                  ? '¡LISTO PARA RECOGER!'
                  : order.status === 'preparando'
                  ? 'EN PREPARACIÓN'
                  : 'RECIBIDO EN COCINA'}
              </span>
            </div>
          </div>

          {/* QR Canvas */}
          <div className="p-3 bg-white rounded-2xl border-2 border-dashed border-[#D7131A]/40 inline-block shadow-inner mx-auto">
            <canvas ref={canvasRef} className="rounded-lg max-w-full" />
          </div>

          {/* Big Pickup Code */}
          <div className="bg-[#F5F6F8] border border-slate-200 rounded-2xl p-3">
            <span className="text-[11px] font-bold text-[#D7131A] uppercase tracking-widest block mb-0.5">
              Código de Entrega Rápida
            </span>
            <div className="flex items-center justify-center gap-2">
              <span className="text-3xl font-black text-[#032244] font-mono tracking-wider tabular-nums">
                #{order.pickupCode}
              </span>
              <button
                type="button"
                onClick={handleCopyCode}
                className="p-1.5 bg-white text-[#032244] hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors"
                title="Copiar código"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-[#032244]/70 mt-1">
              Muestra este código o QR en el mostrador para retirar
            </p>
          </div>

          {/* WhatsApp API Simulation Section */}
          <div className="space-y-2 pt-1 text-left">
            <button
              type="button"
              disabled={whatsappStatus === 'sending'}
              onClick={handleSimulateWhatsAppNotification}
              className={`w-full py-2.5 px-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-xs active:scale-[0.98] ${
                whatsappStatus === 'sent'
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
              }`}
            >
              {whatsappStatus === 'sending' ? (
                <>
                  <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                  <span>Enviando WhatsApp API v21.0...</span>
                </>
              ) : whatsappStatus === 'sent' ? (
                <>
                  <RotateCcw className="w-3.5 h-3.5 text-emerald-200" />
                  <span>Reenviar Notificación WhatsApp</span>
                </>
              ) : (
                <>
                  <MessageCircle className="w-4 h-4 text-emerald-600" />
                  <span>Simular Notificación por WhatsApp</span>
                </>
              )}
            </button>

            {/* Active Visual Status Badge & Interactive WhatsApp Chat Bubble */}
            {whatsappStatus === 'sent' && (
              <div className="space-y-2.5 animate-in fade-in slide-in-from-top-2 duration-300">
                {/* Active status pill */}
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                    </span>
                    <span className="font-bold text-emerald-900 text-[11px]">
                      Estado: Notificación Enviada
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                    {sentTimestamp || 'Entregado'} ✓✓
                  </span>
                </div>

                {/* Simulated WhatsApp Message Bubble */}
                <div className="bg-[#0b141a] text-white p-3.5 rounded-2xl text-left text-xs space-y-2 border border-emerald-900/40 shadow-inner">
                  {/* WhatsApp sender header */}
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-[10px] font-black text-white">
                        UG
                      </div>
                      <span className="text-emerald-400 font-bold text-[11px]">
                        UNIGO Notifications
                      </span>
                      <span className="text-[10px] text-emerald-300" title="Cuenta oficial verificada">
                        ✓
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400">Hoy {sentTimestamp}</span>
                  </div>

                  {/* Bubble body */}
                  <div className="bg-[#202c33] p-2.5 rounded-xl border border-slate-700/50 space-y-1.5">
                    <p className="whitespace-pre-line text-slate-100 font-sans leading-relaxed text-[11px]">
                      {whatsAppMessage}
                    </p>
                    <div className="flex items-center justify-end gap-1 text-[10px] text-slate-400 pt-1">
                      <span>{sentTimestamp}</span>
                      <CheckCheck className="w-3.5 h-3.5 text-sky-400 inline" />
                    </div>
                  </div>

                  {/* Webhook API Metadata footer */}
                  <div className="text-[10px] text-slate-400 flex items-center justify-between pt-0.5 px-0.5">
                    <span>Canal: Meta Cloud API • +57 310 ***-****</span>
                    <span className="text-emerald-400 font-medium">Entregado</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Items breakdown with modifiers and friends */}
          <div className="text-left bg-[#F5F6F8] p-3 rounded-2xl border border-slate-200 space-y-2 text-xs">
            <span className="font-bold text-[#032244] block">Detalle del Pedido:</span>
            {order.items.map((item, idx) => (
              <div key={idx} className="pb-1 border-b border-slate-200/50 last:border-none last:pb-0">
                <div className="flex justify-between font-medium text-[#032244]">
                  <span>
                    {item.quantity}x {item.name}
                  </span>
                  <span className="tabular-nums">${(item.price * item.quantity).toLocaleString('es-CO')}</span>
                </div>
                {item.assignedToFriend && (
                  <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#032244]/10 text-[#032244]">
                    {item.assignedToFriend}
                  </span>
                )}
                {item.selectedModifiers && item.selectedModifiers.length > 0 && (
                  <div className="text-[10px] text-[#032244]/60 pl-2">
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

        <div className="p-3 bg-[#F5F6F8] border-t border-slate-200 text-center shrink-0">
          <p className="text-[11px] text-[#032244]/70 font-medium">
            ¡Sin filas! Pasa directo a la zona de entrega rápida.
          </p>
        </div>
      </div>
    </div>
  );
};
