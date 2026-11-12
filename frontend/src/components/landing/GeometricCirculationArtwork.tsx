import React from 'react';

/**
 * Bespoke geometric artwork for BloodSync:
 * Visualizing blood circulation pathways, hospital inventory node grids,
 * cold-chain conduits, and data telemetry lines with fine hairlines
 * and subtle logo-gradient accents.
 */
export const HeroGeometricNetwork: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <svg
      viewBox="0 0 1200 600"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`w-full h-full pointer-events-none ${className}`}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="geo-accent-line" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF2E7E" stopOpacity="0.8" />
          <stop offset="50%" stopColor="#E11D48" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#9F1239" stopOpacity="0.1" />
        </linearGradient>

        <linearGradient id="geo-ambient-line" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.03" />
          <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.03" />
        </linearGradient>

        <radialGradient id="node-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FF2E7E" stopOpacity="0.9" />
          <stop offset="60%" stopColor="#E11D48" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#E11D48" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Primary Circulation Conduits (Left to Right flowing telemetry) */}
      <path
        d="M 50 180 H 280 L 360 260 H 540 L 620 190 H 880 L 960 270 H 1150"
        stroke="url(#geo-accent-line)"
        strokeWidth="1.2"
        strokeDasharray="4 4"
        opacity="0.75"
      />

      <path
        d="M 120 420 H 320 L 410 330 H 680 L 760 410 H 1080"
        stroke="url(#geo-ambient-line)"
        strokeWidth="1"
      />

      {/* Cross-Network Data Bridges */}
      <path
        d="M 280 180 L 320 420"
        stroke="#FFFFFF"
        strokeWidth="0.8"
        strokeOpacity="0.08"
      />
      <path
        d="M 540 260 L 680 330"
        stroke="url(#geo-accent-line)"
        strokeWidth="0.8"
        opacity="0.5"
      />
      <path
        d="M 880 190 L 760 410"
        stroke="#FFFFFF"
        strokeWidth="0.8"
        strokeOpacity="0.08"
      />

      {/* Geometric Hexagonal Hubs & Unit Modules */}
      {/* Node 1: Regional Blood Hub */}
      <g transform="translate(280, 180)">
        <circle r="18" fill="#09090B" stroke="#E11D48" strokeWidth="1" strokeOpacity="0.5" />
        <circle r="6" fill="#FF2E7E" />
        <circle r="14" fill="url(#node-glow)" />
        <rect x="-10" y="-10" width="20" height="20" stroke="#FFFFFF" strokeWidth="0.6" strokeOpacity="0.2" transform="rotate(45)" />
        <text x="24" y="-8" fill="#8C9098" fontSize="10" fontFamily="'JetBrains Mono', monospace" letterSpacing="0.1em">HUB::CENTRAL</text>
        <text x="24" y="6" fill="#FFFFFF" fontSize="9" fontFamily="'JetBrains Mono', monospace" opacity="0.6">3.8°C / NORMAL</text>
      </g>

      {/* Node 2: Algorithmic Matching Vector */}
      <g transform="translate(620, 190)">
        <circle r="16" fill="#09090B" stroke="#FFFFFF" strokeWidth="1" strokeOpacity="0.2" />
        <circle r="5" fill="#E11D48" />
        <path d="M -12 0 H 12 M 0 -12 V 12" stroke="#FFFFFF" strokeWidth="0.5" strokeOpacity="0.3" />
        <text x="22" y="-6" fill="#8C9098" fontSize="10" fontFamily="'JetBrains Mono', monospace" letterSpacing="0.1em">VECTOR::CROSSMATCH</text>
        <text x="22" y="8" fill="#10B981" fontSize="9" fontFamily="'JetBrains Mono', monospace">99.8% BIO-COMPAT</text>
      </g>

      {/* Node 3: Transfusion Node */}
      <g transform="translate(960, 270)">
        <circle r="18" fill="#09090B" stroke="#E11D48" strokeWidth="1" strokeOpacity="0.4" />
        <circle r="5" fill="#FF2E7E" />
        <circle r="12" fill="url(#node-glow)" />
        <text x="24" y="-6" fill="#8C9098" fontSize="10" fontFamily="'JetBrains Mono', monospace" letterSpacing="0.1em">ICU::ISSUANCE</text>
        <text x="24" y="8" fill="#38BDF8" fontSize="9" fontFamily="'JetBrains Mono', monospace">CHAIN SECURE</text>
      </g>

      {/* Background Micro Isometric Grid Cubelet Cluster */}
      <g transform="translate(100, 280)" opacity="0.35">
        <path d="M 0 -20 L 18 -10 L 0 0 L -18 -10 Z" fill="none" stroke="#FFFFFF" strokeWidth="0.8" />
        <path d="M -18 -10 L 0 0 V 20 L -18 10 Z" fill="none" stroke="#FFFFFF" strokeWidth="0.8" />
        <path d="M 18 -10 L 0 0 V 20 L 18 10 Z" fill="none" stroke="#FFFFFF" strokeWidth="0.8" />
      </g>

      <g transform="translate(1080, 150)" opacity="0.3">
        <path d="M 0 -24 L 22 -12 L 0 0 L -22 -12 Z" fill="none" stroke="#E11D48" strokeWidth="0.8" />
        <path d="M -22 -12 L 0 0 V 24 L -22 12 Z" fill="none" stroke="#E11D48" strokeWidth="0.8" />
        <path d="M 22 -12 L 0 0 V 24 L 22 12 Z" fill="none" stroke="#E11D48" strokeWidth="0.8" />
      </g>

      {/* Fine Coordinate Markers */}
      <text x="50" y="80" fill="#FFFFFF" fillOpacity="0.25" fontSize="10" fontFamily="'JetBrains Mono', monospace">
        SYS.TELEMETRY // LAT: 0.1294 LON: 94.0211
      </text>
      <text x="980" y="520" fill="#FFFFFF" fillOpacity="0.25" fontSize="10" fontFamily="'JetBrains Mono', monospace">
        CRYOPRESERVE // 21 CFR PART 11 ENFORCED
      </text>
    </svg>
  );
};

export const IsometricInventoryMatrix: React.FC<{ className?: string; isIvory?: boolean }> = ({
  className = '',
  isIvory = false,
}) => {
  const strokeColor = isIvory ? '#17191D' : '#FFFFFF';
  const strokeOpacity = isIvory ? 0.18 : 0.12;

  return (
    <svg
      viewBox="0 0 500 400"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`w-full max-w-lg ${className}`}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="cube-grad-accent" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF2E7E" />
          <stop offset="100%" stopColor="#9F1239" />
        </linearGradient>
      </defs>

      {/* Isometric Grid Floor */}
      <g stroke={strokeColor} strokeOpacity={strokeOpacity} strokeWidth="1">
        {/* Layer 1 Cubes */}
        {[
          { x: 150, y: 150 },
          { x: 220, y: 110 },
          { x: 290, y: 150 },
          { x: 220, y: 190 },
          { x: 150, y: 230 },
          { x: 290, y: 230 },
          { x: 360, y: 190 },
          { x: 220, y: 270 },
        ].map((pt, i) => (
          <g key={i} transform={`translate(${pt.x}, ${pt.y})`}>
            {/* Top face */}
            <path d="M 0 -20 L 35 0 L 0 20 L -35 0 Z" />
            {/* Left face */}
            <path d="M -35 0 L 0 20 V 55 L -35 35 Z" />
            {/* Right face */}
            <path d="M 35 0 L 0 20 V 55 L 35 35 Z" />
            {/* Grid Dots */}
            <circle cx="0" cy="0" r="1.5" fill={strokeColor} fillOpacity="0.4" />
          </g>
        ))}
      </g>

      {/* Elevated Feature Cube (The Blood Bank Core Unit) */}
      <g transform="translate(220, 150)">
        {/* Glowing highlight */}
        <path
          d="M 0 -26 L 42 0 L 0 26 L -42 0 Z"
          fill="url(#cube-grad-accent)"
        />
        <path
          d="M -42 0 L 0 26 V 70 L -42 44 Z"
          fill="#BE123C"
        />
        <path
          d="M 42 0 L 0 26 V 70 L 42 44 Z"
          fill="#9F1239"
        />
        {/* Digital Grid Marks on Core */}
        <line x1="-15" y1="-8" x2="15" y2="10" stroke="#FFFFFF" strokeWidth="1.5" strokeOpacity="0.7" />
        <line x1="-25" y1="2" x2="5" y2="20" stroke="#FFFFFF" strokeWidth="1.5" strokeOpacity="0.7" />
        <line x1="-5" y1="-18" x2="25" y2="0" stroke="#FFFFFF" strokeWidth="1.5" strokeOpacity="0.7" />

        {/* Pulse beacon */}
        <circle cx="0" cy="0" r="4" fill="#FFFFFF" />
        <circle cx="0" cy="0" r="16" stroke="#FF2E7E" strokeWidth="1.5" strokeOpacity="0.6">
          <animate attributeName="r" values="8;24;8" dur="3s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.8;0;0.8" dur="3s" repeatCount="indefinite" />
        </circle>
      </g>
    </svg>
  );
};
