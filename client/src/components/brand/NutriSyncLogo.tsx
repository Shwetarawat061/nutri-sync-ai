import React from "react";

interface NutriSyncLogoProps {
  variant?: "full" | "icon" | "compact" | "horizontal";
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  showTagline?: boolean;
}

export const NutriSyncIcon: React.FC<{ sizeClass?: string; className?: string }> = ({
  sizeClass = "w-9 h-9",
  className = "",
}) => {
  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${sizeClass} ${className} shrink-0 drop-shadow-sm select-none`}
    >
      <defs>
        {/* Main 'N' Body Gradient */}
        <linearGradient id="nsNBodyGrad" x1="20%" y1="10%" x2="80%" y2="90%">
          <stop offset="0%" stopColor="#48cf38" />
          <stop offset="40%" stopColor="#22b62e" />
          <stop offset="100%" stopColor="#0b7e28" />
        </linearGradient>

        {/* Leaf Top Gradient */}
        <linearGradient id="nsLeafGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#66e044" />
          <stop offset="100%" stopColor="#1e9e24" />
        </linearGradient>

        {/* Dynamic Ribbon Swoosh Gradient */}
        <linearGradient id="nsSwooshGrad" x1="0%" y1="50%" x2="100%" y2="50%">
          <stop offset="0%" stopColor="#76e838" />
          <stop offset="60%" stopColor="#3ebd28" />
          <stop offset="100%" stopColor="#22a820" />
        </linearGradient>

        {/* Bowl Gradient */}
        <linearGradient id="nsBowlGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#158a2d" />
          <stop offset="100%" stopColor="#0a5c1b" />
        </linearGradient>

        {/* Shadow */}
        <filter id="nsShadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#043311" floodOpacity="0.25" />
        </filter>
      </defs>

      {/* Sprouting Top Leaves */}
      <g filter="url(#nsShadow)">
        {/* Left Leaf */}
        <path
          d="M 58 46 C 45 42 34 26 38 12 C 54 14 65 27 64 42 Z"
          fill="url(#nsLeafGrad)"
        />
        {/* Right Leaf */}
        <path
          d="M 64 42 C 67 28 80 16 96 14 C 98 30 84 44 68 46 Z"
          fill="url(#nsLeafGrad)"
        />
      </g>

      {/* Main Bold 'N' Structure */}
      {/* Left Pillar + Diagonal Bridge + Right Pillar */}
      <path
        d="M 50 42 
           C 66 42 74 52 74 66
           L 74 88
           C 74 94 77 98 84 104
           L 122 136
           C 130 142 138 144 146 140
           C 152 136 156 130 156 120
           L 156 86
           C 156 68 144 54 130 54
           L 116 54
           C 116 54 122 42 142 42
           C 162 42 174 58 174 82
           L 174 148
           C 174 168 158 182 136 182
           C 120 182 108 174 96 162
           L 58 126
           C 52 120 48 122 48 130
           L 48 148
           C 48 166 38 176 26 176
           C 16 176 12 164 12 148
           L 12 68
           C 12 50 26 42 50 42 Z"
        fill="url(#nsNBodyGrad)"
        filter="url(#nsShadow)"
      />

      {/* Fork Silhouette Cutout in Left Pillar */}
      <g fill="#FFFFFF">
        {/* Fork Prongs */}
        <path d="M 23 60 L 23 76 C 23 81 25 84 28 85 L 28 116 C 28 120 31 123 35 123 C 38 123 40 120 40 116 L 40 85 C 43 84 45 81 45 76 L 45 60 L 41 60 L 41 74 C 41 75 40 76 39 76 C 38 76 37 75 37 74 L 37 60 L 34 60 L 34 74 C 34 75 33 76 32 76 C 31 76 30 75 30 74 L 30 60 Z" />
      </g>

      {/* Heart Cutout in Right Pillar */}
      <path
        d="M 148 152 C 148 148 144 145 140 145 C 137 145 135 147 134 149 C 133 147 131 145 128 145 C 124 145 120 148 120 152 C 120 157 125 162 134 168 C 143 162 148 157 148 152 Z"
        fill="#FFFFFF"
      />

      {/* Fresh Salad Bowl Component on Top Right */}
      <g>
        {/* Sunburst Rays around Bowl */}
        <path d="M 142 16 L 144 23" stroke="#48cf38" strokeWidth="3" strokeLinecap="round" />
        <path d="M 158 19 L 155 25" stroke="#48cf38" strokeWidth="3" strokeLinecap="round" />
        <path d="M 168 28 L 162 32" stroke="#48cf38" strokeWidth="3" strokeLinecap="round" />

        {/* Sun Arc */}
        <path
          d="M 126 38 A 24 24 0 0 1 166 38"
          stroke="#48cf38"
          strokeWidth="3.5"
          strokeLinecap="round"
          fill="none"
        />

        {/* Salad Ingredients inside Bowl */}
        {/* Fresh Lettuce leaves */}
        <circle cx="128" cy="46" r="10" fill="#3ebd28" />
        <circle cx="140" cy="42" r="11" fill="#2eb426" />
        <circle cx="152" cy="48" r="9" fill="#1e9e24" />

        {/* Tomato slice */}
        <circle cx="132" cy="48" r="7.5" fill="#e53935" />
        <circle cx="132" cy="48" r="5" fill="#c62828" stroke="#ff8a80" strokeWidth="0.8" />
        <circle cx="131" cy="47" r="1.2" fill="#ffebee" />

        {/* Cucumber Slice */}
        <circle cx="123" cy="52" r="6" fill="#81c784" stroke="#2e7d32" strokeWidth="1.2" />
        <circle cx="123" cy="52" r="3.5" fill="#a5d6a7" />

        {/* Boiled Egg Half */}
        <ellipse cx="148" cy="50" rx="8" ry="9" fill="#FFFFFF" />
        <ellipse cx="148" cy="52" rx="4.5" ry="5" fill="#ffb300" />
        <ellipse cx="147" cy="51" rx="2" ry="2" fill="#ffa000" />

        {/* Green Salad Bowl Base */}
        <path
          d="M 116 48 C 116 48 116 68 140 68 C 164 68 164 48 164 48 Z"
          fill="url(#nsBowlGrad)"
          stroke="#26a233"
          strokeWidth="2"
        />
        {/* Bowl Rim */}
        <ellipse cx="140" cy="48" rx="24" ry="4" fill="#1b8e2b" />
      </g>

      {/* Dynamic Ribbon Swoosh */}
      <path
        d="M 88 132 C 122 130 162 116 178 84 C 182 76 182 66 174 64 C 168 62 162 68 156 78 C 142 100 114 116 88 124 Z"
        fill="url(#nsSwooshGrad)"
        filter="url(#nsShadow)"
      />
    </svg>
  );
};

export const NutriSyncLogo: React.FC<NutriSyncLogoProps> = ({
  variant = "horizontal",
  size = "md",
  className = "",
  showTagline = true,
}) => {
  const iconSizes = {
    xs: "w-6 h-6",
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-14 h-14",
    xl: "w-20 h-20",
  };

  const textSizes = {
    xs: "text-sm",
    sm: "text-base",
    md: "text-lg sm:text-xl",
    lg: "text-2xl sm:text-3xl",
    xl: "text-4xl sm:text-5xl",
  };

  if (variant === "icon") {
    return <NutriSyncIcon sizeClass={iconSizes[size]} className={className} />;
  }

  if (variant === "full") {
    return (
      <div className={`flex flex-col items-center text-center ${className} select-none`}>
        <NutriSyncIcon sizeClass={iconSizes[size]} />
        <div className="mt-2 flex items-center justify-center">
          <span className={`font-black tracking-tight text-emerald-950 dark:text-white ${textSizes[size]}`}>
            Nutri<span className="text-[#20aa2b] dark:text-[#45d447]">Sync</span>
          </span>
        </div>
        {showTagline && (
          <div className="mt-1 flex items-center gap-2 text-[10px] sm:text-xs font-bold tracking-widest uppercase text-emerald-800 dark:text-emerald-300">
            <span className="w-4 h-[1.5px] bg-emerald-500/50" />
            <span>SCAN • TRACK • EAT BETTER</span>
            <span className="text-emerald-500">♥</span>
            <span className="w-4 h-[1.5px] bg-emerald-500/50" />
          </div>
        )}
      </div>
    );
  }

  // Default: Horizontal Header Layout matching screenshot
  return (
    <div className={`flex items-center gap-2.5 sm:gap-3 ${className} select-none group`}>
      <NutriSyncIcon sizeClass={iconSizes[size]} />
      <div className="flex flex-col">
        <div className="flex items-center gap-1">
          <span className={`font-black tracking-tight leading-none text-slate-900 dark:text-white ${textSizes[size]}`}>
            Nutri<span className="text-[#20aa2b] dark:text-[#45d447]">Sync</span>
          </span>
        </div>
        {showTagline && (
          <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
            Metabolic Intelligence
          </span>
        )}
      </div>
    </div>
  );
};
