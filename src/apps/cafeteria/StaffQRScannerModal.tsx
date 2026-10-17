import React, { useState } from 'react';
import { Order } from '../../types';
import { updateOrderStatus } from '../../services/store';
import { playReadyChime } from '../../utils/audio';
import {
  X,
  QrCode,
  Search,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  DollarSign,
  PackageCheck,
  Users,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface StaffQRScannerModalProps {
  orders: Order[];
  isOpen: boolean;
  onClose: () => void;
}

export const StaffQRScannerModal: React.FC<StaffQRScannerModalProps> = ({ orders, isOpen, onClose }) => {
  const [searchInput, setSearchInput] = useState('');
  const [matchedOrder, setMatchedOrder] = useState<Order | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = searchInput.trim().replace('#', '');
    if (!clean) return;

    const found = orders.find(
      (o) =>
        o.pickupCode === clean ||
        o.id.toLowerCase().includes(clean.toLowerCase()) ||
        o.studentName.toLowerCase().includes(clean.toLowerCase())
    );

    if (found) {
      setMatchedOrder(found);
    } else {
      alert(`No se encontró ningún pedido con código o nombre "${clean}"`);
    }
  };

  const handleConfirmDelivery = (order: Order) => {
    updateOrderStatus(order.id, 'entregado');
    playReadyChime();
    try {
      confetti({ particleCount: 40, spread: 50, origin: { y: 0.7 } });
    } catch (e) {
      console.debug('Confetti error', e);
    }

    setSuccessNotice(`¡Pedido #${order.pickupCode} entregado con éxito a ${order.studentName}!`);
    setMatchedOrder(null);
    setSearchInput('');
    setTimeout(() => {
      setSuccessNotice(null);
    }, 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-orange-600 rounded-xl">
              <QrCode className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold leading-none">Despacho de Pedidos</h2>
              <p className="text-xs text-slate-400 mt-1">Escáner y verificación de token QR</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {/* Success Notice */}
          {successNotice && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2.5 text-emerald-800 text-xs font-bold animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{successNotice}</span>
            </div>
          )}

          {/* Quick Code Input */}
          <form onSubmit={handleSearch} className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
              Ingresar Token de 4 Dígitos o Nombre
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Ej. 8491 o Valentina"
                  className="w-full pl-10 pr-3 py-3 bg-slate-50 rounded-2xl border border-slate-200 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 font-bold text-slate-800"
                />
              </div>
              <button
                type="submit"
                className="px-5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-2xl transition-all shadow-xs"
              >
                Buscar
              </button>
            </div>
          </form>

          {/* Matched Order Card */}
          {matchedOrder ? (
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Orden Encontrada
                  </span>
                  <span className="text-xl font-black text-slate-900 font-mono">
                    #{matchedOrder.pickupCode}
                  </span>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${
                    matchedOrder.status === 'listo'
                      ? 'bg-emerald-100 text-emerald-800'
                      : matchedOrder.status === 'entregado'
                      ? 'bg-slate-200 text-slate-600'
                      : 'bg-orange-100 text-orange-800'
                  }`}
                >
                  {matchedOrder.status}
                </span>
              </div>

              {/* Student & Payment info */}
              <div className="text-xs space-y-1">
                <p className="font-bold text-slate-800">
                  Estudiante: {matchedOrder.studentName} ({matchedOrder.studentId})
                </p>
                <div className="flex items-center gap-2 pt-1">
                  {matchedOrder.isPaid ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> PAGADO CON CAMPUSPAY
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 flex items-center gap-1">
                      <DollarSign className="w-3 h-3" /> COBRAR EN CAJA: $
                      {matchedOrder.totalPrice.toLocaleString('es-CO')}
                    </span>
                  )}
                  {matchedOrder.isGroupOrder && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 flex items-center gap-1">
                      <Users className="w-3 h-3" /> PEDIDO GRUPAL
                    </span>
                  )}
                </div>
              </div>

              {/* Items */}
              <div className="space-y-1.5 text-xs bg-white p-3 rounded-xl border border-slate-200/80">
                <span className="font-bold text-slate-700 block">Ítems a Entregar:</span>
                {matchedOrder.items.map((i, idx) => (
                  <div key={idx} className="pb-1 border-b border-slate-100 last:border-none last:pb-0">
                    <div className="flex justify-between font-semibold text-slate-800">
                      <span>
                        {i.quantity}x {i.name}
                      </span>
                      <span>${(i.price * i.quantity).toLocaleString('es-CO')}</span>
                    </div>
                    {i.assignedToFriend && (
                      <span className="text-[10px] text-purple-700 font-bold block">
                        👤 {i.assignedToFriend}
                      </span>
                    )}
                    {i.selectedModifiers && i.selectedModifiers.length > 0 && (
                      <div className="text-[10px] text-slate-500 pl-2">
                        {i.selectedModifiers.map((m, mIdx) => (
                          <span key={mIdx} className="block">
                            • {m.groupName}: {m.optionName}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {matchedOrder.status !== 'entregado' ? (
                <button
                  type="button"
                  onClick={() => handleConfirmDelivery(matchedOrder)}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <PackageCheck className="w-4 h-4" />
                  <span>Confirmar Entrega al Estudiante</span>
                </button>
              ) : (
                <div className="text-center text-xs text-slate-500 py-2 font-medium">
                  Este pedido ya fue marcado como entregado anteriormente.
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 space-y-2">
              <QrCode className="w-8 h-8 mx-auto text-slate-300" />
              <p className="text-xs">
                Ingresa el código que el estudiante muestra en su pantalla de celular para verificar y entregar.
              </p>
            </div>
          )}

          {/* Quick List of orders ready to pickup */}
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
              Listos para entregar ahora ({orders.filter((o) => o.status === 'listo').length})
            </span>
            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {orders
                .filter((o) => o.status === 'listo')
                .map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => setMatchedOrder(o)}
                    className="w-full p-2.5 bg-slate-50 hover:bg-orange-50 border border-slate-200 hover:border-orange-200 rounded-xl flex items-center justify-between text-left text-xs transition-colors"
                  >
                    <div>
                      <span className="font-bold text-slate-900 font-mono mr-2">
                        #{o.pickupCode}
                      </span>
                      <span className="text-slate-600">{o.studentName}</span>
                    </div>
                    <span className="font-bold text-orange-600 text-[11px]">Verificar →</span>
                  </button>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
