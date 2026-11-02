import React from 'react';
import { cn } from '@/lib/utils';

interface FlegonLogoProps {
  className?: string;
  variant?: 'full' | 'mark' | 'wordmark';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  subtitle?: string;
  theme?: 'gold' | 'light';
}

export function FlegonLogo({
  className,
  variant = 'full',
  size = 'md',
  subtitle = 'PRIVATE MEMBERS',
  theme = 'gold'
}: FlegonLogoProps) {
  const sizeMap = {
    sm: { mark: 'w-7 h-7', text: 'text-sm', sub: 'text-[8px]', gap: 'gap-2.5' },
    md: { mark: 'w-9 h-9', text: 'text-base', sub: 'text-[9px]', gap: 'gap-3' },
    lg: { mark: 'w-12 h-12', text: 'text-xl', sub: 'text-[10px]', gap: 'gap-3.5' },
    xl: { mark: 'w-16 h-16', text: 'text-2xl', sub: 'text-[11px]', gap: 'gap-4' },
  };

  const currentSize = sizeMap[size];

  // Monograma sofisticado FD (Flegon David) com detalhes em vetor
  const MarkIcon = (
    <div
      className={cn(
        'relative shrink-0 flex items-center justify-center rounded-lg border border-[#695C49]/40 bg-gradient-to-b from-[#1D292F] to-[#172127] shadow-[0_2px_10px_rgba(0,0,0,0.3)]',
        currentSize.mark
      )}
    >
      <svg
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-[70%] h-[70%]"
      >
        {/* Losango sutil de fundo */}
        <rect
          x="20"
          y="4"
          width="22.6"
          height="22.6"
          rx="2"
          transform="rotate(45 20 4)"
          stroke="#BFA783"
          strokeWidth="0.8"
          strokeOpacity="0.4"
        />
        {/* Letra F elegante */}
        <path
          d="M13 11H25M13 11V29M13 19H22"
          stroke="#BFA783"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Letra D entrelaçada sutilmente */}
        <path
          d="M20 15H24C27.3137 15 29 17.2386 29 20C29 22.7614 27.3137 25 24 25H20"
          stroke="#E9DDC9"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeOpacity="0.9"
        />
      </svg>
    </div>
  );

  return (
    <div className={cn('inline-flex items-center select-none', currentSize.gap, className)}>
      {variant !== 'wordmark' && MarkIcon}

      {variant !== 'mark' && (
        <div className="flex flex-col text-left">
          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                'font-serif font-semibold tracking-[0.18em] text-[#F5F3EF] leading-tight uppercase',
                currentSize.text
              )}
            >
              Flegon
            </span>
            <span
              className={cn(
                'font-serif font-light tracking-[0.18em] text-[#BFA783] leading-tight uppercase',
                currentSize.text
              )}
            >
              Members
            </span>
          </div>

          {subtitle && (
            <span
              className={cn(
                'uppercase tracking-[0.32em] font-sans font-medium text-[#A6ACAF] leading-none mt-1',
                currentSize.sub
              )}
            >
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
