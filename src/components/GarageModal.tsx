import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Lock, Check, ArrowUp, Coins, X } from 'lucide-react';
import { AUTOS, UPGRADE_META, formatCoins, getUpgradeCost } from '../data/gameData';
import { PersistentSave, UpgradeKey } from '../types/game';
import { PixelAutoPreview } from './PixelAutoPreview';

interface GarageModalProps {
  save: PersistentSave;
  onSelectAuto: (autoId: string) => void;
  onUnlockAuto: (autoId: string) => void;
  onBuyUpgrade: (autoId: string, key: UpgradeKey) => void;
  onClose: () => void;
}

export const GarageModal: React.FC<GarageModalProps> = ({
  save,
  onSelectAuto,
  onUnlockAuto,
  onBuyUpgrade,
  onClose,
}) => {
  const initialIdx = Math.max(
    0,
    AUTOS.findIndex((a) => a.id === save.selectedAutoId)
  );
  const [viewIdx, setViewIdx] = useState(initialIdx);

  const auto = AUTOS[viewIdx];
  const isUnlocked = save.unlockedAutos.includes(auto.id);
  const isSelected = save.selectedAutoId === auto.id;
  const upgrades = save.upgrades[auto.id] || {
    engine: 0,
    gearbox: 0,
    tyres: 0,
    nitro: 0,
  };

  const effectiveTopSpeed = auto.baseSpeed + upgrades.engine * 4;
  const effectiveAccel = Math.min(25, auto.baseAccel + upgrades.gearbox);
  const effectiveGrip = Math.min(25, auto.baseGrip + upgrades.tyres);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 pt-16 bg-[#090514]/75 backdrop-blur-xs">
      <div className="pixel-panel w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b-2 border-[#fff4e8]/20 bg-[#120b24]">
          <div>
            <h2 className="font-pixel-display text-lg sm:text-xl font-bold text-[#facc15]">
              AUTO GARAGE
            </h2>
            <p className="text-xs text-[#fff4e8]/70">
              Unlock new rickshaws &amp; tune parts — every owned auto adds passive fleet income
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Garage"
            className="pixel-btn p-1.5 bg-[#1b1233] text-[#fff4e8] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto pixel-scroll grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Left Column: Auto Showroom Carousel */}
          <div className="md:col-span-5 flex flex-col justify-between bg-[#120b24] border-2 border-[#fff4e8]/20 p-4">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setViewIdx((i) => (i - 1 + AUTOS.length) % AUTOS.length)}
                aria-label="Previous auto"
                className="pixel-btn p-2 bg-[#1b1233] text-[#fff4e8] cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="font-pixel-mono text-xs text-[#fff4e8]/70">
                {viewIdx + 1} / {AUTOS.length} · {auto.tier}
              </span>
              <button
                type="button"
                onClick={() => setViewIdx((i) => (i + 1) % AUTOS.length)}
                aria-label="Next auto"
                className="pixel-btn p-2 bg-[#1b1233] text-[#fff4e8] cursor-pointer"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <div className="my-3 py-2 bg-[#1b1233] border border-white/10">
              <PixelAutoPreview palette={auto.palette} isNitro={isSelected} size={116} />
            </div>

            <div className="text-center mb-3">
              <h3 className="font-pixel-display text-lg font-bold text-[#fff4e8]">
                {auto.name}
              </h3>
              <p className="text-xs text-[#fff4e8]/70 mt-0.5">{auto.tagline}</p>
            </div>

            {/* Stats */}
            <div className="space-y-2 text-xs font-pixel-mono mb-4">
              <div className="flex justify-between">
                <span className="text-[#fff4e8]/70">Top Speed</span>
                <span className="text-[#facc15] font-bold">{effectiveTopSpeed} km/h</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#fff4e8]/70">Acceleration</span>
                <span className="text-[#fff4e8]">{effectiveAccel} / 25</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#fff4e8]/70">Grip &amp; Drift</span>
                <span className="text-[#fff4e8]">{effectiveGrip} / 25</span>
              </div>
              <div className="flex justify-between border-t border-white/10 pt-1.5">
                <span className="text-[#fff4e8]/70">Fleet Income</span>
                <span className="text-[#16a34a] font-bold">+{auto.passiveCps} coins/s</span>
              </div>
            </div>

            {/* Select or Unlock CTA */}
            {isUnlocked ? (
              <button
                type="button"
                disabled={isSelected}
                onClick={() => onSelectAuto(auto.id)}
                className={`pixel-btn w-full py-2.5 text-sm font-bold flex items-center justify-center gap-2 cursor-pointer ${
                  isSelected
                    ? 'bg-[#16a34a] text-[#fff4e8]'
                    : 'bg-[#ff4f8b] text-[#fff4e8]'
                }`}
              >
                {isSelected ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Selected</span>
                  </>
                ) : (
                  <span>Drive This Auto</span>
                )}
              </button>
            ) : (
              <button
                type="button"
                disabled={save.coins < auto.unlockCost}
                onClick={() => onUnlockAuto(auto.id)}
                className="pixel-btn w-full py-2.5 bg-[#facc15] text-[#090514] text-sm font-bold flex items-center justify-center gap-2 cursor-pointer"
              >
                <Lock className="w-4 h-4" />
                <span>Unlock · {formatCoins(auto.unlockCost)}</span>
              </button>
            )}
          </div>

          {/* Right Column: 4-Part Mechanical Upgrades */}
          <div className="md:col-span-7 flex flex-col justify-between gap-3">
            <div className="space-y-3">
              {UPGRADE_META.map((u) => {
                const lvl = upgrades[u.key];
                const isMax = lvl >= u.maxLevel;
                const cost = getUpgradeCost(u.baseCost, lvl);
                const canAfford = isUnlocked && !isMax && save.coins >= cost;

                return (
                  <div
                    key={u.key}
                    className="p-3.5 bg-[#120b24] border-2 border-[#fff4e8]/20 flex items-center justify-between gap-4"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-sm text-[#fff4e8] truncate">
                          {u.name}
                        </span>
                        <span className="font-pixel-mono text-xs text-[#facc15] shrink-0">
                          Lv {lvl}/{u.maxLevel}
                        </span>
                      </div>
                      <p className="text-xs text-[#fff4e8]/65 mt-0.5">{u.effect}</p>

                      {/* Pixel Level Bar */}
                      <div className="mt-2 flex gap-1">
                        {Array.from({ length: u.maxLevel }).map((_, idx) => (
                          <span
                            key={idx}
                            className={`h-2 flex-1 ${
                              idx < lvl ? 'bg-[#ff8a3d]' : 'bg-[#1b1233] border border-white/10'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={!canAfford}
                      onClick={() => onBuyUpgrade(auto.id, u.key)}
                      className="pixel-btn px-3.5 py-2 bg-[#ff4f8b] text-[#fff4e8] text-xs font-bold flex items-center gap-1.5 shrink-0 cursor-pointer"
                    >
                      {isMax ? (
                        <span>MAX</span>
                      ) : (
                        <>
                          <ArrowUp className="w-3.5 h-3.5" />
                          <Coins className="w-3.5 h-3.5 text-[#facc15]" />
                          <span className="font-pixel-mono">{formatCoins(cost)}</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={onClose}
                className="pixel-btn px-6 py-2.5 bg-[#16a34a] text-[#fff4e8] font-pixel-display text-sm font-bold cursor-pointer"
              >
                BACK TO RACE
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
