'use client';

import React from 'react';

export interface BannerTitleProps {
  title: string;
  titleColor?: string;
  highlightWord?: string;
  highlightColor?: string;
  className?: string;
}

export function BannerTitle({
  title,
  titleColor = '#F5F3EF',
  highlightWord = '',
  highlightColor = 'gold-gradient',
  className = '',
}: BannerTitleProps) {
  if (!title) return null;

  const words = title.trim().split(/\s+/);
  const cleanHighlight = highlightWord?.trim().toLowerCase();

  return (
    <span className={className}>
      {words.map((word, index) => {
        // Remove pontuações para conferir se é a palavra destacada
        const normalized = word.replace(/[^\wÀ-ÿ]/g, '').toLowerCase();
        const isHighlighted = Boolean(cleanHighlight && cleanHighlight !== 'none' && normalized === cleanHighlight);

        if (isHighlighted) {
          if (highlightColor === 'gold-gradient' || !highlightColor) {
            return (
              <span
                key={index}
                className="inline-block mr-2 sm:mr-3 md:mr-4 font-normal text-transparent bg-clip-text bg-gradient-to-b from-[#BFA783] via-[#D8C7A9] to-[#E9DDC9]"
              >
                {word}
              </span>
            );
          }
          return (
            <span
              key={index}
              style={{ color: highlightColor }}
              className="inline-block mr-2 sm:mr-3 md:mr-4 font-normal"
            >
              {word}
            </span>
          );
        }

        return (
          <span
            key={index}
            style={{ color: titleColor || '#F5F3EF' }}
            className="inline-block mr-2 sm:mr-3 md:mr-4 font-light"
          >
            {word}
          </span>
        );
      })}
    </span>
  );
}

export default BannerTitle;
