import React, { useEffect, useState } from 'react';
import { Trophy, Wrench, RotateCcw } from 'lucide-react';
import { formatCoins, formatTimeMs } from '../data/gameData';
import { RaceResultSummary } from '../types/game';

interface ResultsModalProps {
  summary: RaceResultSummary;
  trackName: string;
  autoPilot: boolean;
  onRaceAgain: () => void;
  onOpenGarage: () => void;
}

export const ResultsModal: React.FC<ResultsModalProps> = ({
  summary,
  trackName,
  autoPilot,
  onRaceAgain,
  onOpenGarage,
}) => {
  const [countdown, setCountdown] = useState(4);

  useEffect(() => {
    if (!autoPilot) return;
    const timer = window.setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          window.clearInterval(timer);
          onRaceAgain();
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [autoPilot, onRaceAgain]);

  const isPodium = summary.position <= 3;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-[#090514]/80 backdrop-blur-xs">
      <div className="pixel-panel w-full max-w-md p-6 space-y-5">
        <div className="text-center space-y-1">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-[#120b24] border-2 border-[#facc15] text-[#facc15] mb-1">
            <Trophy className="w-6 h-6" />
          </div>
          <h2 className="font-pixel-display text-2xl font-bold text-[#facc15]">
            {summary.position === 1
              ? '1ST PLACE!'
              : summary.position === 2
                ? '2ND PLACE!'
                : summary.position === 3
                  ? '3RD PLACE!'
                  : `FINISHED #${summary.position}`}
          </h2>
          <p className="text-xs text-[#fff4e8]/70">
            {trackName} · {isPodium ? 'Podium Finish!' : 'Keep tuning your auto!'}
          </p>
        </div>

        {/* Time & Rewards Breakdown */}
        <div className="p-4 bg-[#120b24] border-2 border-[#fff4e8]/20 space-y-2 text-xs font-pixel-mono">
          <div className="flex justify-between">
            <span className="text-[#fff4e8]/70">Total Time</span>
            <span className="text-[#fff4e8] font-bold">{formatTimeMs(summary.totalTimeMs)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#fff4e8]/70">
              Best Lap {summary.isNewBestLap ? '(NEW!)' : ''}
            </span>
            <span className="text-[#facc15] font-bold">{formatTimeMs(summary.bestLapMs)}</span>
          </div>
          <div className="border-t border-white/10 my-2 pt-2 space-y-1.5">
            <div className="flex justify-between">
              <span className="text-[#fff4e8]/70">Road Coins</span>
              <span className="text-[#fff4e8]">+{formatCoins(summary.raceCoins)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#fff4e8]/70">Position Bonus</span>
              <span className="text-[#fff4e8]">+{formatCoins(summary.positionBonus)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#fff4e8]/70">Drift Bonus</span>
              <span className="text-[#fff4e8]">+{formatCoins(summary.driftBonus)}</span>
            </div>
          </div>
          <div className="border-t border-white/20 pt-2 flex justify-between text-sm font-bold">
            <span className="text-[#facc15]">TOTAL EARNED</span>
            <span className="text-[#16a34a]">+{formatCoins(summary.totalEarned)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onRaceAgain}
            className="pixel-btn flex-1 py-3 bg-[#16a34a] text-[#fff4e8] font-pixel-display text-sm font-bold flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{autoPilot ? `NEXT RACE (${countdown}s)` : 'RACE AGAIN'}</span>
          </button>

          <button
            type="button"
            onClick={onOpenGarage}
            className="pixel-btn px-4 py-3 bg-[#1b1233] text-[#facc15] text-sm font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <Wrench className="w-4 h-4" />
            <span>Garage</span>
          </button>
        </div>
      </div>
    </div>
  );
};
