import React from 'react';
import { Award, CheckCircle2, Coins, Plus, X } from 'lucide-react';
import {
  FLEET_BUSINESSES,
  formatCoins,
  getFleetCost,
  getPrestigeMultiplier,
  getPrestigeRequirement,
  getTotalPassiveCps,
} from '../data/gameData';
import { PersistentSave } from '../types/game';

interface FleetIdleModalProps {
  save: PersistentSave;
  onBuyFleet: (bizId: string) => void;
  onClaimChallenge: (challengeId: string) => void;
  onPrestige: () => void;
  onClose: () => void;
}

export const FleetIdleModal: React.FC<FleetIdleModalProps> = ({
  save,
  onBuyFleet,
  onClaimChallenge,
  onPrestige,
  onClose,
}) => {
  const passiveCps = getTotalPassiveCps(save);
  const mult = getPrestigeMultiplier(save);
  const prestigeReq = getPrestigeRequirement(save.prestigeBadges);
  const canPrestige = save.totalCoinsEarned >= prestigeReq;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 pt-16 bg-[#090514]/75 backdrop-blur-xs">
      <div className="pixel-panel w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b-2 border-[#fff4e8]/20 bg-[#120b24]">
          <div>
            <h2 className="font-pixel-display text-lg sm:text-xl font-bold text-[#facc15]">
              IDLE FLEET &amp; ROUTES
            </h2>
            <p className="text-xs text-[#fff4e8]/70 font-pixel-mono">
              Generating +{formatCoins(passiveCps)} coins/sec · Multiplier {mult.toFixed(2)}×
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Fleet"
            className="pixel-btn p-1.5 bg-[#1b1233] text-[#fff4e8] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto pixel-scroll grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Left: Passive Route Investments */}
          <div className="md:col-span-7 space-y-2.5">
            <h3 className="font-pixel-display text-xs uppercase tracking-wider text-[#fff4e8]/70 mb-1">
              NCR Route Investments
            </h3>
            {FLEET_BUSINESSES.map((biz) => {
              const count = save.fleetCounts[biz.id] || 0;
              const cost = getFleetCost(biz, count);
              const canAfford = save.coins >= cost;

              return (
                <div
                  key={biz.id}
                  className="p-3 bg-[#120b24] border-2 border-[#fff4e8]/20 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-[#fff4e8] truncate">
                        {biz.name}
                      </span>
                      <span className="font-pixel-mono text-xs text-[#facc15]">
                        ×{count}
                      </span>
                    </div>
                    <p className="text-xs text-[#fff4e8]/65 truncate">{biz.description}</p>
                    <p className="text-[11px] font-pixel-mono text-[#16a34a] mt-0.5">
                      +{formatCoins(Math.round(biz.baseCps * mult))} coins/s each
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={!canAfford}
                    onClick={() => onBuyFleet(biz.id)}
                    className="pixel-btn px-3 py-2 bg-[#ff4f8b] text-[#fff4e8] text-xs font-bold flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <Coins className="w-3.5 h-3.5 text-[#facc15]" />
                    <span className="font-pixel-mono">{formatCoins(cost)}</span>
                  </button>
                </div>
              );
            })}
          </div>

          {/* Right: Daily Challenges & Permit Prestige */}
          <div className="md:col-span-5 flex flex-col justify-between gap-4">
            {/* Daily Challenges */}
            <div className="p-4 bg-[#120b24] border-2 border-[#fff4e8]/20 space-y-3">
              <h3 className="font-pixel-display text-xs uppercase tracking-wider text-[#facc15]">
                Daily Challenges
              </h3>
              <div className="space-y-2.5">
                {save.challenges.map((ch) => {
                  const done = ch.progress >= ch.target;
                  return (
                    <div
                      key={ch.id}
                      className="p-2.5 bg-[#1b1233] border border-white/10 flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-[#fff4e8] truncate">
                          {ch.label}
                        </div>
                        <div className="text-[11px] font-pixel-mono text-[#fff4e8]/65">
                          {Math.min(ch.target, Math.floor(ch.progress))} / {ch.target}
                        </div>
                      </div>

                      {ch.claimed ? (
                        <span className="text-xs font-pixel-mono text-[#16a34a] flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" />
                          Claimed
                        </span>
                      ) : (
                        <button
                          type="button"
                          disabled={!done}
                          onClick={() => onClaimChallenge(ch.id)}
                          className="pixel-btn px-2.5 py-1.5 bg-[#facc15] text-[#090514] text-xs font-bold font-pixel-mono cursor-pointer shrink-0"
                        >
                          +{ch.reward}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Permit Renewal (Prestige) */}
            <div className="p-4 bg-[#120b24] border-2 border-[#facc15]/40 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-pixel-display text-xs text-[#facc15] flex items-center gap-1.5">
                  <Award className="w-4 h-4" />
                  PERMIT RENEWAL
                </span>
                <span className="font-pixel-mono text-xs text-[#fff4e8]">
                  Badges: {save.prestigeBadges}
                </span>
              </div>
              <p className="text-xs text-[#fff4e8]/75 leading-relaxed">
                Renew your All-India Permit to reset coins &amp; fleet for a permanent{' '}
                <strong className="text-[#facc15]">+25% earnings</strong> Golden Horn Badge.
              </p>
              <div className="text-[11px] font-pixel-mono text-[#fff4e8]/65">
                Lifetime Coins: {formatCoins(save.totalCoinsEarned)} / {formatCoins(prestigeReq)}
              </div>
              <button
                type="button"
                disabled={!canPrestige}
                onClick={onPrestige}
                className="pixel-btn w-full py-2 bg-[#facc15] text-[#090514] text-xs font-bold cursor-pointer"
              >
                {canPrestige ? 'Renew Permit (+1 Badge)' : `Need ${formatCoins(prestigeReq)} Lifetime`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
