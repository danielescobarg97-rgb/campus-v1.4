import React, { useState } from 'react';
import { Coffee, Utensils, Sandwich, Sparkles } from 'lucide-react';

export interface ProductImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src?: string | null;
  alt: string;
  className?: string;
  imgClassName?: string;
  fallbackCategory?: string;
  showFallbackLabel?: boolean;
}

export const ProductImage: React.FC<ProductImageProps> = ({
  src,
  alt,
  className = '',
  imgClassName = '',
  fallbackCategory = '',
  showFallbackLabel = false,
  ...props
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Reset error/loading if src changes
  React.useEffect(() => {
    setHasError(!src || src.trim() === '');
    setIsLoading(Boolean(src && src.trim() !== ''));
  }, [src]);

  const catLower = (fallbackCategory || '').toLowerCase();
  const altLower = (alt || '').toLowerCase();

  const isBeverage =
    catLower.includes('café') ||
    catLower.includes('bebida') ||
    catLower.includes('jugo') ||
    altLower.includes('café') ||
    altLower.includes('latte') ||
    altLower.includes('capuchino') ||
    altLower.includes('jugo') ||
    altLower.includes('té');

  const isSandwichOrBakery =
    catLower.includes('repostería') ||
    catLower.includes('snacks') ||
    altLower.includes('croissant') ||
    altLower.includes('muffin') ||
    altLower.includes('empanada') ||
    altLower.includes('sandwich');

  if (!src || hasError) {
    return (
      <div
        className={`bg-gradient-to-br from-slate-100 via-slate-50 to-slate-200 flex flex-col items-center justify-center p-3 text-slate-400 select-none overflow-hidden relative border border-slate-200/50 ${className}`}
        role="img"
        aria-label={alt}
        title={alt}
      >
        {/* Subtle decorative watermark SVG pattern in background */}
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none flex items-center justify-center">
          <svg className="w-full h-full" viewBox="0 0 100 100" fill="currentColor">
            <circle cx="20" cy="20" r="10" />
            <circle cx="80" cy="80" r="10" />
            <path d="M50 15 L60 45 L90 50 L60 55 L50 85 L40 55 L10 50 L40 45 Z" />
          </svg>
        </div>

        {/* Minimalist SVG Icon Container */}
        <div className="relative z-10 flex flex-col items-center justify-center gap-1.5 max-w-full">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-white shadow-xs border border-slate-200/80 flex items-center justify-center text-orange-500 transition-transform group-hover:scale-105">
            {isBeverage ? (
              <Coffee className="w-5 h-5 text-orange-500/90" strokeWidth={2} />
            ) : isSandwichOrBakery ? (
              <Sandwich className="w-5 h-5 text-orange-500/90" strokeWidth={2} />
            ) : (
              <Utensils className="w-5 h-5 text-orange-500/90" strokeWidth={2} />
            )}
          </div>

          {showFallbackLabel && (
            <div className="text-center px-2 max-w-full">
              <span className="text-[11px] font-bold text-slate-600 block truncate max-w-[140px]">
                {alt || 'CampusBite'}
              </span>
              <span className="text-[9px] text-slate-400 font-medium tracking-wide uppercase">
                {fallbackCategory || 'Cafetería'}
              </span>
            </div>
          )}
        </div>

        {/* Subtle badge indicator */}
        <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded-md bg-white/70 backdrop-blur-xs text-[9px] font-medium text-slate-400 flex items-center gap-1">
          <Sparkles className="w-2.5 h-2.5 text-amber-500" />
          <span>CampusBite</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden bg-slate-100 ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-slate-200/80 animate-pulse flex items-center justify-center z-10">
          <Utensils className="w-5 h-5 text-slate-400 animate-spin" />
        </div>
      )}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setHasError(true);
          setIsLoading(false);
        }}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        } ${imgClassName}`}
        {...props}
      />
    </div>
  );
};
