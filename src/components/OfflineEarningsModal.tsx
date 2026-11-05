import React from 'react';
import { Coins, Clock } from 'lucide-react';
import { formatCoins } from '../data/gameData';

interface OfflineEarningsModalProps {
  awaySeconds: number;
  earnedCoins: number;
  onClaim: () => void;
}

export const OfflineEarningsModal: React.FC<OfflineEarningsModalProps> = ({
  awaySeconds,
  earnedCoins,
  onClaim,
}) => {
  const mins = Math.floor(awaySeconds / 60);
  const hrs = Math.floor(mins / 60);
  const remMins = mins % 60;
  const timeLabel = hrs > 0 ? `${hrs}h ${remMins}m` : `${Math.max(1, mins)}m`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#090514]/80 backdrop-blur-xs">
      <div className="pixel-panel w-full max-w-sm p-6 text-center space-y-4">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-[#120b24] border-2 border-[#facc15] text-[#facc15]">
          <Clock className="w-6 h-6" />
        </div>

        <div>
          <h2 className="font-pixel-display text-xl font-bold text-[#facc15]">
            FLEET REPORT
          </h2>
          <p className="text-xs text-[#fff4e8]/75 mt-1">
            Your NCR auto-rickshaw fleet kept cruising while you were away ({timeLabel}).
          </p>
        </div>

        <div className="p-4 bg-[#120b24] border-2 border-[#fff4e8]/20 flex items-center justify-center gap-2.5 font-pixel-mono text-2xl font-bold text-[#16a34a]">
          <Coins className="w-6 h-6 text-[#facc15]" />
          <span>+{formatCoins(earnedCoins)}</span>
        </div>

        <button
          type="button"
          onClick={onClaim}
          className="pixel-btn w-full py-3 bg-[#16a34a] text-[#fff4e8] font-pixel-display text-sm font-bold cursor-pointer"
        >
          COLLECT COINS
        </button>
      </div>
    </div>
  );
};
