import React, { useState } from 'react';

interface BrickOsBrandLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | number;
  className?: string;
  showText?: boolean;
  textSubtitle?: string;
  withGlow?: boolean;
  interactive?: boolean;
  onClick?: () => void;
}

export const BrickOsBrandLogo: React.FC<BrickOsBrandLogoProps> = ({
  size = 'md',
  className = '',
  showText = false,
  textSubtitle = 'Studio v5.5',
  withGlow = true,
  interactive = true,
  onClick,
}) => {
  const [imageError, setImageError] = useState(false);

  // Determine pixel dimensions
  const getDimension = (): number => {
    if (typeof size === 'number') return size;
    switch (size) {
      case 'xs': return 24;
      case 'sm': return 32;
      case 'md': return 40;
      case 'lg': return 56;
      case 'xl': return 80;
      case '2xl': return 120;
      default: return 40;
    }
  };

  const dim = getDimension();

  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center gap-3 select-none ${interactive && onClick ? 'cursor-pointer group' : ''} ${className}`}
    >
      <div
        className={`relative flex items-center justify-center shrink-0 rounded-2xl overflow-hidden transition-all duration-300 ${
          interactive && onClick ? 'group-hover:scale-105 active:scale-95' : ''
        } ${withGlow ? 'shadow-lg shadow-orange-950/60 ring-1 ring-amber-500/30' : ''}`}
        style={{ width: dim, height: dim }}
      >
        {/* Render high-fidelity site logo SVG */}
        {!imageError ? (
          <img
            src="/site-logo.svg"
            alt="brickOS Stone B Lava Cross Logo"
            className="w-full h-full object-cover rounded-2xl"
            onError={() => setImageError(true)}
            referrerPolicy="no-referrer"
          />
        ) : (
          /* High-Fidelity Vector Representation of the Chiseled Stone B with Glowing Molten Lava Cross */
          <svg
            viewBox="0 0 200 200"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full"
            style={{ filter: withGlow ? 'drop-shadow(0 0 10px rgba(249, 115, 22, 0.45))' : 'none' }}
          >
            <defs>
              {/* Fiery Lava Glow Filter */}
              <filter id="lavaGlow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="3.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              {/* Intense Cross Radiant Core Filter */}
              <filter id="coreGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="5" result="wideBlur" />
                <feGaussianBlur stdDeviation="2" result="tightBlur" />
                <feMerge>
                  <feMergeNode in="wideBlur" />
                  <feMergeNode in="tightBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              {/* Molten Lava Radial Gradient */}
              <radialGradient id="magmaCore" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                <stop offset="0%" stopColor="#fff7ed" />
                <stop offset="25%" stopColor="#fef08a" />
                <stop offset="55%" stopColor="#f97316" />
                <stop offset="85%" stopColor="#ea580c" />
                <stop offset="100%" stopColor="#7c2d12" />
              </radialGradient>

              {/* Golden Cross Linear Gradient */}
              <linearGradient id="crossGold" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fffbeb" />
                <stop offset="20%" stopColor="#fef08a" />
                <stop offset="50%" stopColor="#f59e0b" />
                <stop offset="80%" stopColor="#d97706" />
                <stop offset="100%" stopColor="#b45309" />
              </linearGradient>

              {/* Obsidian Rock Texture Gradient */}
              <linearGradient id="obsidianStone" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#2a303c" />
                <stop offset="35%" stopColor="#1e232d" />
                <stop offset="70%" stopColor="#12161f" />
                <stop offset="100%" stopColor="#090b10" />
              </linearGradient>

              {/* Rock Facet Highlight Gradient */}
              <linearGradient id="rockHighlight" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#64748b" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#1e293b" stopOpacity="0.2" />
              </linearGradient>
            </defs>

            {/* Pure Dark Obsidian Background */}
            <rect width="200" height="200" rx="28" fill="#030712" />

            {/* Ambient Magma Fissure Glow Layer */}
            <circle cx="100" cy="100" r="75" fill="#f97316" opacity="0.18" filter="blur(22px)" />

            {/* Chiseled Rugged Stone "B" Exterior Silhouette */}
            <path
              d="M32 18 C38 12, 60 14, 82 14 C120 14, 158 20, 168 54 C174 72, 164 88, 146 98 C168 108, 178 126, 172 150 C164 182, 126 186, 86 186 C60 186, 36 188, 30 182 C24 176, 26 150, 26 100 C26 50, 24 24, 32 18 Z"
              fill="url(#obsidianStone)"
              stroke="#475569"
              strokeWidth="2.5"
            />

            {/* Natural Rock Geological Facets & Texture Planes */}
            {/* Top-Right Facet */}
            <polygon points="82,14 120,14 168,54 135,58" fill="#334155" opacity="0.45" />
            {/* Mid Fissure Block */}
            <polygon points="135,58 168,54 146,98 120,95" fill="#1e293b" opacity="0.8" />
            {/* Bottom-Right Bulwark */}
            <polygon points="120,95 146,98 172,150 126,186 105,145" fill="#0f172a" opacity="0.75" />
            {/* Top-Left Ridge Highlight */}
            <polygon points="32,18 82,14 75,45 35,42" fill="url(#rockHighlight)" />
            {/* Left Edge Vertical Spine */}
            <polygon points="26,100 35,42 42,160 30,182" fill="#1e293b" opacity="0.6" />

            {/* Upper Magma Cavity (Top counter of B) */}
            <path
              d="M68 45 C80 42, 115 44, 122 62 C126 74, 115 82, 95 84 C80 85, 68 84, 68 84 Z"
              fill="#451a03"
              stroke="#ea580c"
              strokeWidth="3.5"
            />
            {/* Molten Core in Upper Cavity */}
            <path
              d="M72 49 C82 46, 110 48, 116 62 C119 71, 110 78, 95 80 C82 81, 72 80, 72 80 Z"
              fill="url(#magmaCore)"
              opacity="0.85"
              filter="url(#lavaGlow)"
            />

            {/* Lower Magma Cavity (Bottom counter of B) */}
            <path
              d="M68 114 C82 114, 120 115, 126 132 C130 148, 118 158, 92 158 C78 158, 68 156, 68 156 Z"
              fill="#451a03"
              stroke="#ea580c"
              strokeWidth="3.5"
            />
            {/* Molten Core in Lower Cavity */}
            <path
              d="M72 118 C84 118, 114 119, 119 133 C122 144, 112 153, 92 153 C80 153, 72 152, 72 152 Z"
              fill="url(#magmaCore)"
              opacity="0.85"
              filter="url(#lavaGlow)"
            />

            {/* Volcanic Magma Fissure Lines (Cracks spreading through rock) */}
            <path
              d="M26 100 L68 100 M126 132 L155 142 L172 150 M122 62 L148 50 L168 54 M82 14 L85 45 M86 186 L92 158"
              stroke="#f97316"
              strokeWidth="3"
              strokeLinecap="round"
              filter="url(#lavaGlow)"
            />
            <path
              d="M26 100 L68 100 M126 132 L155 142 L172 150 M122 62 L148 50 L168 54"
              stroke="#ffedd5"
              strokeWidth="1.2"
              strokeLinecap="round"
            />

            {/* Central Vertical & Horizontal Glowing Molten Cross Cutout */}
            {/* Cross Radiant Ember Shadow/Bloom */}
            <g filter="url(#coreGlow)">
              {/* Horizontal Beam of Cross */}
              <rect x="52" y="88" width="88" height="24" rx="4" fill="#ea580c" />
              {/* Vertical Beam of Cross */}
              <rect x="88" y="32" width="24" height="136" rx="4" fill="#ea580c" />

              {/* Inner Radiant Molten Cross */}
              <rect x="56" y="92" width="80" height="16" rx="3" fill="url(#crossGold)" />
              <rect x="92" y="36" width="16" height="128" rx="3" fill="url(#crossGold)" />

              {/* Incandescent White/Yellow Molten Spine */}
              <rect x="62" y="96" width="68" height="8" rx="2" fill="#fffbeb" opacity="0.9" />
              <rect x="96" y="42" width="8" height="116" rx="2" fill="#fffbeb" opacity="0.9" />
            </g>

            {/* Stone Surface Chisel Etch Accents */}
            <path
              d="M38 28 L45 35 M42 165 L52 158 M155 35 L145 42 M160 162 L150 152"
              stroke="#94a3b8"
              strokeWidth="1.5"
              strokeLinecap="round"
              opacity="0.4"
            />
          </svg>
        )}

        {/* Ambient Subtle Volcanic Ember Glow Corner Accents */}
        <div className="absolute inset-0 pointer-events-none rounded-2xl ring-1 ring-inset ring-amber-400/20" />
      </div>

      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="font-black text-lg tracking-tight bg-gradient-to-r from-amber-200 via-orange-400 to-amber-500 bg-clip-text text-transparent">
              brickOS
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-950/80 text-orange-400 border border-orange-700/40 font-bold uppercase tracking-wider">
              {textSubtitle}
            </span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono tracking-wide -mt-0.5">
            Sovereign Music Production
          </span>
        </div>
      )}
    </div>
  );
};
