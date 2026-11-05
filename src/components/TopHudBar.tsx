import React from 'react';
import { Coins, Gauge, Settings, Wrench, MapPin, Zap } from 'lucide-react';
import { formatCoins } from '../data/gameData';
import { ActiveTab } from '../types/game';

interface TopHudBarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  coins: number;
  passiveCps: number;
  autoPilot: boolean;
  onToggleAutoPilot: () => void;
  onOpenSettings: () => void;
  hasAffordableUpgrade: boolean;
}

export const TopHudBar: React.FC<TopHudBarProps> = ({
  activeTab,
  onSelectTab,
  coins,
  passiveCps,
  autoPilot,
  onToggleAutoPilot,
  onOpenSettings,
  hasAffordableUpgrade,
}) => {
  const tabs: { id: ActiveTab; label: string; icon: React.ReactNode; alert?: boolean }[] = [
    { id: 'race', label: 'Race', icon: <Gauge className="w-4 h-4 shrink-0" /> },
    {
      id: 'garage',
      label: 'Garage',
      icon: <Wrench className="w-4 h-4 shrink-0" />,
      alert: hasAffordableUpgrade,
    },
    { id: 'fleet', label: 'Fleet', icon: <Zap className="w-4 h-4 shrink-0" /> },
    { id: 'tracks', label: 'Tracks', icon: <MapPin className="w-4 h-4 shrink-0" /> },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-30 flex items-center justify-between gap-4 px-4 py-2.5 bg-[#120b24]/90 border-b-2 border-[#fff4e8]/20 backdrop-blur-xs">
      {/* Zone 1: Single-element Brand Wordmark */}
      <button
        type="button"
        onClick={() => onSelectTab('race')}
        className="font-pixel-display text-lg sm:text-xl font-bold tracking-tight text-[#facc15] whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#facc15]"
      >
        AUTO RUSH
      </button>

      {/* Zone 2: Concise single-line navigation tabs */}
      <nav
        aria-label="Game sections"
        className="flex items-center gap-1 p-1 bg-[#1b1233] border-2 border-[#fff4e8]/20"
      >
        {tabs.map((t) => {
          const active = activeTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onSelectTab(t.id)}
              className={`relative flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                active
                  ? 'bg-[#ff4f8b] text-[#fff4e8]'
                  : 'text-[#fff4e8]/75 hover:text-[#fff4e8] hover:bg-white/5'
              }`}
            >
              {t.icon}
              <span>{t.label}</span>
              {t.alert && !active && (
                <span
                  className="w-2 h-2 bg-[#facc15] inline-block"
                  aria-label="Upgrade available"
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* Zone 3: Wallet, Auto-Pilot toggle, and Settings */}
      <div className="flex items-center gap-2.5 shrink-0">
        <div
          className="flex items-center gap-2 px-3 py-1.5 bg-[#1b1233] border-2 border-[#facc15]/50 font-pixel-mono text-sm"
          title={`Passive income: +${formatCoins(passiveCps)}/sec`}
        >
          <Coins className="w-4 h-4 text-[#facc15] shrink-0" />
          <span className="font-bold text-[#fff4e8]">{formatCoins(coins)}</span>
          <span className="hidden md:inline text-xs text-[#facc15]">
            +{formatCoins(passiveCps)}/s
          </span>
        </div>

        <button
          type="button"
          onClick={onToggleAutoPilot}
          className={`pixel-btn px-3 py-1.5 text-xs sm:text-sm font-bold whitespace-nowrap shrink-0 cursor-pointer ${
            autoPilot
              ? 'bg-[#16a34a] text-[#fff4e8]'
              : 'bg-[#1b1233] text-[#fff4e8]/85 hover:text-[#fff4e8]'
          }`}
          title="Toggle Idle Auto-Pilot driving"
        >
          {autoPilot ? 'Auto: On' : 'Auto: Off'}
        </button>

        <button
          type="button"
          onClick={onOpenSettings}
          aria-label="Settings"
          className="pixel-btn p-2 bg-[#1b1233] text-[#fff4e8] hover:bg-[#2a1c4d] cursor-pointer shrink-0"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
