import React from "react";

interface ToggleSwitchProps {
  id?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  badge?: string;
  icon?: React.ReactNode;
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  activeColor?: "emerald" | "indigo" | "cyan" | "amber";
  className?: string;
}

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  id,
  checked,
  onChange,
  label,
  description,
  badge,
  icon,
  size = "md",
  disabled = false,
  activeColor = "emerald",
  className = "",
}) => {
  const switchId = id || (label ? `toggle-${label.toLowerCase().replace(/\s+/g, "-")}` : undefined);

  // Size variations
  const sizeStyles = {
    sm: {
      track: "w-9 h-5 p-0.5",
      thumb: "w-4 h-4",
      translate: "translate-x-4",
      label: "text-xs font-semibold",
      desc: "text-[10px]",
    },
    md: {
      track: "w-12 h-6.5 p-0.5",
      thumb: "w-5.5 h-5.5",
      translate: "translate-x-5.5",
      label: "text-sm font-bold",
      desc: "text-xs",
    },
    lg: {
      track: "w-14 h-8 p-1",
      thumb: "w-6 h-6",
      translate: "translate-x-6",
      label: "text-base font-extrabold",
      desc: "text-xs",
    },
  }[size];

  // Active color variations
  const activeColorStyles = {
    emerald: {
      track: "bg-emerald-500 shadow-emerald-500/30",
      thumb: "text-emerald-600",
      glow: "ring-2 ring-emerald-500/20",
    },
    indigo: {
      track: "bg-indigo-500 shadow-indigo-500/30",
      thumb: "text-indigo-600",
      glow: "ring-2 ring-indigo-500/20",
    },
    cyan: {
      track: "bg-cyan-500 shadow-cyan-500/30",
      thumb: "text-cyan-600",
      glow: "ring-2 ring-cyan-500/20",
    },
    amber: {
      track: "bg-amber-500 shadow-amber-500/30",
      thumb: "text-amber-600",
      glow: "ring-2 ring-amber-500/20",
    },
  }[activeColor];

  const handleToggle = () => {
    if (!disabled) {
      onChange(!checked);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleToggle();
    }
  };

  return (
    <div
      id={switchId ? `${switchId}-container` : undefined}
      onClick={handleToggle}
      className={`group flex items-center justify-between gap-4 p-3 rounded-2xl transition select-none cursor-pointer ${
        checked
          ? "bg-slate-50/80 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800"
          : "bg-white/60 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700"
      } ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${className}`}
    >
      <div className="flex items-start gap-3 flex-1 min-w-0">
        {icon && (
          <div
            className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center transition ${
              checked
                ? "bg-emerald-500/10 text-emerald-500 dark:text-emerald-400"
                : "bg-slate-100 dark:bg-slate-800 text-slate-400"
            }`}
          >
            {icon}
          </div>
        )}
        <div className="space-y-0.5 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {label && (
              <span
                className={`${sizeStyles.label} text-slate-800 dark:text-slate-100 group-hover:text-slate-950 dark:group-hover:text-white transition`}
              >
                {label}
              </span>
            )}
            {badge && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                {badge}
              </span>
            )}
          </div>
          {description && (
            <p className={`${sizeStyles.desc} text-slate-500 dark:text-slate-400 leading-relaxed`}>
              {description}
            </p>
          )}
        </div>
      </div>

      {/* Tactile Toggle Pill Track */}
      <button
        id={switchId}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label || "Toggle"}
        disabled={disabled}
        onKeyDown={handleKeyDown}
        className={`relative inline-flex shrink-0 cursor-pointer rounded-full transition-colors duration-250 ease-in-out focus:outline-none ${
          sizeStyles.track
        } ${
          checked
            ? `${activeColorStyles.track} ${activeColorStyles.glow} shadow-md`
            : "bg-slate-200 dark:bg-slate-800 border border-slate-300/60 dark:border-slate-700/60"
        }`}
      >
        <span className="sr-only">{label || "Toggle"}</span>
        <span
          aria-hidden="true"
          className={`pointer-events-none inline-flex items-center justify-center rounded-full bg-white shadow-lg ring-0 transition-transform duration-250 ease-in-out ${
            sizeStyles.thumb
          } ${checked ? sizeStyles.translate : "translate-x-0"}`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full transition-opacity ${
              checked ? "bg-emerald-500 opacity-100" : "bg-slate-400 opacity-40"
            }`}
          />
        </span>
      </button>
    </div>
  );
};
