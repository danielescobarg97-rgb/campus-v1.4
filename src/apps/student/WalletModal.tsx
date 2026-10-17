import React, { useState } from 'react';
import { StudentWallet } from '../../types';
import { topupWallet } from '../../services/store';
import {
  X,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2,
  Sparkles,
  CreditCard,
  ShieldCheck,
  PlusCircle,
} from 'lucide-react';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallet: StudentWallet;
  studentName: string;
  studentId: string;
}

export const WalletModal: React.FC<WalletModalProps> = ({
  isOpen,
  onClose,
  wallet,
  studentName,
  studentId,
}) => {
  const [selectedTopup, setSelectedTopup] = useState<number>(20000);
  const [isProcessing, setIsProcessing] = useState(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const TOPUP_OPTIONS = [10000, 20000, 50000, 100000];

  const handleTopup = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    setTimeout(() => {
      topupWallet(selectedTopup, 'PSE / Nequi Express');
      setIsProcessing(false);
      setSuccessNotice(`¡Recarga exitosa de $${selectedTopup.toLocaleString('es-CO')}!`);
      setTimeout(() => setSuccessNotice(null), 3000);
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-xs">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold leading-none">Billetera CampusPay</h2>
              <p className="text-xs text-orange-100 mt-1">Saldo universitario para 1-click checkout</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-6 flex-1">
          {/* Virtual Campus Card */}
          <div className="relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white shadow-xl border border-slate-700/50">
            <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-orange-500/20 rounded-full blur-2xl" />
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-orange-400" />
                <span className="text-xs font-mono tracking-widest text-slate-300 uppercase">
                  CampusPass Digital
                </span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> ACTIVO
              </span>
            </div>

            <div className="my-3">
              <span className="text-xs text-slate-400 block font-medium">Saldo Disponible</span>
              <span className="text-3xl font-black tracking-tight text-white">
                ${wallet.balance.toLocaleString('es-CO')}
              </span>
            </div>

            <div className="pt-2 flex items-center justify-between text-xs text-slate-300 border-t border-slate-700/60 font-mono">
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">Titular</span>
                <span className="font-semibold text-white">{studentName}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block uppercase">ID Universitario</span>
                <span className="font-semibold text-orange-300">{studentId}</span>
              </div>
            </div>
          </div>

          {/* Success notice */}
          {successNotice && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-emerald-800 text-sm font-semibold animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{successNotice}</span>
            </div>
          )}

          {/* Recharge Section */}
          <form onSubmit={handleTopup} className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <PlusCircle className="w-4 h-4 text-orange-600" />
              Recargar Saldo Inmediato
            </label>

            <div className="grid grid-cols-2 gap-2.5">
              {TOPUP_OPTIONS.map((amount) => {
                const isSelected = selectedTopup === amount;
                return (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => setSelectedTopup(amount)}
                    className={`py-3 px-3 rounded-2xl border text-sm font-bold transition-all text-center ${
                      isSelected
                        ? 'border-orange-600 bg-orange-50 text-orange-800 ring-2 ring-orange-500/20 shadow-xs'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    +${amount.toLocaleString('es-CO')}
                  </button>
                );
              })}
            </div>

            <button
              type="submit"
              disabled={isProcessing}
              className="w-full mt-2 py-3.5 px-4 bg-orange-600 hover:bg-orange-700 active:scale-[0.98] text-white rounded-2xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:bg-slate-300"
            >
              {isProcessing ? (
                <span>Procesando recarga segura...</span>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Recargar ${selectedTopup.toLocaleString('es-CO')} con Nequi / PSE</span>
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>Saldo persistente global: sincronizado automáticamente con tu cuenta</span>
            </div>
          </form>

          {/* Recent Movements */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Historial de Movimientos
            </h3>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1 divide-y divide-slate-100">
              {wallet.transactions.length === 0 ? (
                <p className="text-xs text-slate-400 py-3 text-center">No hay transacciones aún.</p>
              ) : (
                wallet.transactions.map((tx) => (
                  <div key={tx.id} className="pt-2 pb-2 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                          tx.amount > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {tx.amount > 0 ? (
                          <ArrowDownLeft className="w-4 h-4" />
                        ) : (
                          <ArrowUpRight className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800">{tx.description}</p>
                        <p className="text-[10px] text-slate-400">
                          {new Date(tx.date).toLocaleDateString('es-CO', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`font-black ${
                        tx.amount > 0 ? 'text-emerald-600' : 'text-slate-900'
                      }`}
                    >
                      {tx.amount > 0 ? '+' : ''}${Math.abs(tx.amount).toLocaleString('es-CO')}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100 text-center shrink-0">
          <p className="text-xs text-slate-500">
            Sin comisiones por micro-compras • Valido en todas las cafeterías del campus
          </p>
        </div>
      </div>
    </div>
  );
};
