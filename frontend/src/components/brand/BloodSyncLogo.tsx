import React from 'react';

interface BloodSyncLogoProps {
  variant?: 'horizontal-dark' | 'horizontal-light' | 'icon-only' | 'compact';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'hero';
  className?: string;
}

/**
 * Scalable SVG icon representing the BloodSync brand identity:
 * A modern, precision heart symbol enclosed by circulatory embrace lobes
 * rendered with the vibrant magenta-crimson gradient sampled from the brand asset.
 */
export const BloodSyncIcon: React.FC<{
  size?: number | string;
  className?: string;
  idSuffix?: string;
}> = ({ size = 36, className = '', idSuffix = 'main' }) => {
  const gradId = `bs-heart-grad-${idSuffix}`;
  const innerGradId = `bs-inner-grad-${idSuffix}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 transition-transform duration-300 ${className}`}
      aria-label="BloodSync Brand Symbol"
    >
      <defs>
        {/* Vibrant Brand Gradient matching the reference identity */}
        <linearGradient id={gradId} x1="0%" y1="10%" x2="100%" y2="90%">
          <stop offset="0%" stopColor="#FF2E7E" />
          <stop offset="45%" stopColor="#E11D48" />
          <stop offset="100%" stopColor="#9F1239" />
        </linearGradient>
        {/* Inner Heart Radiant Gradient */}
        <linearGradient id={innerGradId} x1="20%" y1="0%" x2="80%" y2="100%">
          <stop offset="0%" stopColor="#FF438F" />
          <stop offset="50%" stopColor="#E11D48" />
          <stop offset="100%" stopColor="#BE123C" />
        </linearGradient>
        {/* Soft Ambient Glow Filter */}
        <filter id={`bs-glow-${idSuffix}`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#E11D48" floodOpacity="0.3" />
        </filter>
      </defs>

      <g filter={`url(#bs-glow-${idSuffix})`}>
        {/* Left Circulatory Embrace Wing */}
        <path
          d="M 46 88 C 22 88 4 72 4 48 C 4 28 20 16 34 22 C 44 26 48 38 48 48 C 48 68 36 78 46 88 Z"
          fill={`url(#${gradId})`}
        />

        {/* Right Circulatory Embrace Wing */}
        <path
          d="M 74 88 C 98 88 116 72 116 48 C 116 28 100 16 86 22 C 76 26 72 38 72 48 C 72 68 84 78 74 88 Z"
          fill={`url(#${gradId})`}
        />

        {/* Outer Base Unifying Curve */}
        <path
          d="M 32 82 C 44 94 76 94 88 82 C 76 90 44 90 32 82 Z"
          fill={`url(#${gradId})`}
          opacity="0.85"
        />

        {/* Center Iconic Heart Silhouette */}
        <path
          d="M 60 40 
             C 54 28, 36 29, 36 46 
             C 36 62, 53 74, 60 80 
             C 67 74, 84 62, 84 46 
             C 84 29, 66 28, 60 40 Z"
          fill={`url(#${innerGradId})`}
        />

        {/* Subtle Inner Highlight Droplet Curve */}
        <path
          d="M 44 42 C 44 36 50 34 54 38 C 50 37 46 39 46 44 Z"
          fill="#FFFFFF"
          opacity="0.4"
        />
      </g>
    </svg>
  );
};

export const BloodSyncLogo: React.FC<BloodSyncLogoProps> = ({
  variant = 'horizontal-dark',
  size = 'md',
  className = '',
}) => {
  const isLightBg = variant === 'horizontal-light';
  const isIconOnly = variant === 'icon-only';
  const isCompact = variant === 'compact';

  // Dimension scaling
  const iconSizes = {
    xs: 24,
    sm: 30,
    md: 38,
    lg: 46,
    xl: 56,
    hero: 72,
  };

  const textSizes = {
    xs: 'text-base',
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl',
    hero: 'text-4xl sm:text-5xl',
  };

  const iconDim = iconSizes[size];

  if (isIconOnly) {
    return <BloodSyncIcon size={iconDim} className={className} idSuffix={`ico-${size}`} />;
  }

  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      <BloodSyncIcon size={iconDim} idSuffix={`${variant}-${size}`} />
      
      {!isCompact && (
        <div className="flex flex-col leading-none">
          <div className={`font-sans tracking-tight font-bold flex items-center ${textSizes[size]}`}>
            <span className={isLightBg ? 'text-[#17191D]' : 'text-white'}>
              Blood
            </span>
            <span className="bg-gradient-to-r from-[#FF2E7E] via-[#E11D48] to-[#BE123C] bg-clip-text text-transparent ml-0.5">
              Sync
            </span>
          </div>
          {size !== 'xs' && size !== 'sm' && (
            <span
              className={`text-[9px] font-mono uppercase tracking-[0.25em] mt-1 ${
                isLightBg ? 'text-[#8C9098]' : 'text-slate-400'
              }`}
            >
              Clinical Intelligence
            </span>
          )}
        </div>
      )}

      {isCompact && (
        <div className="flex items-center leading-none">
          <span className={`font-sans tracking-tight font-bold text-lg ${isLightBg ? 'text-[#17191D]' : 'text-white'}`}>
            Blood
          </span>
          <span className="bg-gradient-to-r from-[#FF2E7E] to-[#E11D48] bg-clip-text text-transparent font-bold text-lg ml-0.5">
            Sync
          </span>
        </div>
      )}
    </div>
  );
};

export default BloodSyncLogo;
