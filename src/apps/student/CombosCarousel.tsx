import React, { useState, useEffect } from 'react';
import { Product } from '../../types';
import { ProductImage } from '../../components/ProductImage';
import {
  Flame,
  Clock,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  TrendingDown,
  Coffee,
} from 'lucide-react';

interface CombosCarouselProps {
  combos: Product[];
  onSelectCombo: (product: Product) => void;
}

export const CombosCarousel: React.FC<CombosCarouselProps> = ({ combos, onSelectCombo }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (combos.length <= 1 || isPaused) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % combos.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [combos.length, isPaused]);

  if (!combos || combos.length === 0) return null;

  const currentCombo = combos[currentIndex];

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? combos.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % combos.length);
  };

  // Calculate discount percentage
  const discountPercent =
    currentCombo.comboDiscountPrice && currentCombo.comboDiscountPrice > currentCombo.price
      ? Math.round(
          ((currentCombo.comboDiscountPrice - currentCombo.price) /
            currentCombo.comboDiscountPrice) *
            100
        )
      : null;

  return (
    <div
      className="relative overflow-hidden rounded-3xl bg-slate-950 text-white shadow-xl border border-slate-800"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background image with gradient */}
      <div className="absolute inset-0">
        <ProductImage
          src={currentCombo.imageUrl}
          alt={currentCombo.name}
          fallbackCategory={currentCombo.category}
          className="w-full h-full"
          imgClassName="opacity-30 transform scale-105 transition-all duration-700 ease-out"
        />
        <div className="absolute inset-0 bg-gradient-to-t sm:bg-gradient-to-r from-slate-950 via-slate-950/90 to-transparent" />
      </div>

      {/* Content wrapper */}
      <div className="relative z-10 p-6 sm:p-8 flex flex-col justify-between min-h-[300px]">
        {/* Top bar with Tag and Nav buttons */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-md">
              <Flame className="w-3.5 h-3.5 text-amber-200" />
              Menú y Especiales del Día ({currentIndex + 1}/{combos.length})
            </span>
            {discountPercent && (
              <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <TrendingDown className="w-3 h-3" /> Ahorras {discountPercent}%
              </span>
            )}
          </div>

          {/* Navigation Arrows */}
          <div className="flex items-center gap-1.5 bg-slate-900/80 p-1 rounded-2xl border border-slate-700/60 backdrop-blur-xs">
            <button
              type="button"
              onClick={handlePrev}
              className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl transition-colors"
              title="Combo anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl transition-colors"
              title="Siguiente combo"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Center Details */}
        <div className="my-4 space-y-2 max-w-2xl">
          <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight drop-shadow-sm">
            {currentCombo.name}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed line-clamp-2">
            {currentCombo.description}
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <span className="text-2xl sm:text-3xl font-black text-white">
              ${currentCombo.price.toLocaleString('es-CO')}
            </span>

            {currentCombo.comboDiscountPrice && (
              <span className="text-sm sm:text-base line-through text-slate-400 font-semibold">
                ${currentCombo.comboDiscountPrice.toLocaleString('es-CO')}
              </span>
            )}

            <span className="flex items-center gap-1 text-xs text-orange-300 bg-orange-950/60 px-2.5 py-1 rounded-xl border border-orange-800/60">
              <Clock className="w-3.5 h-3.5 text-orange-400" />
              ~{currentCombo.prepTimeMinutes} min de preparación
            </span>
          </div>
        </div>

        {/* Bottom bar: Dots & Order Button */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-800/80">
          {/* Carousel Dots */}
          <div className="flex items-center gap-1.5">
            {combos.map((combo, idx) => (
              <button
                key={combo.id}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  currentIndex === idx
                    ? 'w-7 bg-orange-500 shadow-xs'
                    : 'w-2 bg-slate-700 hover:bg-slate-500'
                }`}
                title={combo.name}
              />
            ))}
          </div>

          {/* Action button */}
          <button
            type="button"
            onClick={() => onSelectCombo(currentCombo)}
            className="px-6 py-3 bg-orange-600 hover:bg-orange-500 active:scale-95 text-white font-black text-xs sm:text-sm rounded-2xl shadow-lg hover:shadow-orange-600/30 transition-all flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-amber-200" />
            <span>Pedir este Combo del Día</span>
          </button>
        </div>
      </div>
    </div>
  );
};
