import React from 'react';
import { Volume2, Music, X, RotateCcw } from 'lucide-react';

interface SettingsModalProps {
  musicVolume: number;
  sfxVolume: number;
  onChangeMusic: (v: number) => void;
  onChangeSfx: (v: number) => void;
  onResetSave: () => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  musicVolume,
  sfxVolume,
  onChangeMusic,
  onChangeSfx,
  onResetSave,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#090514]/80 backdrop-blur-xs">
      <div className="pixel-panel w-full max-w-md p-6 space-y-5">
        <div className="flex items-center justify-between border-b-2 border-[#fff4e8]/20 pb-3">
          <h2 className="font-pixel-display text-lg font-bold text-[#facc15]">
            SETTINGS &amp; CONTROLS
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Settings"
            className="pixel-btn p-1.5 bg-[#1b1233] text-[#fff4e8] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sound Controls */}
        <div className="space-y-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="flex items-center gap-2 text-[#fff4e8]">
                <Music className="w-4 h-4 text-[#facc15]" />
                16-Bit Music
              </span>
              <span className="font-pixel-mono text-[#facc15]">
                {Math.round(musicVolume * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={musicVolume}
              onChange={(e) => onChangeMusic(parseFloat(e.target.value))}
              className="w-full accent-[#ff4f8b] cursor-pointer"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="flex items-center gap-2 text-[#fff4e8]">
                <Volume2 className="w-4 h-4 text-[#06b6d4]" />
                Sound Effects &amp; Horn
              </span>
              <span className="font-pixel-mono text-[#06b6d4]">
                {Math.round(sfxVolume * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={sfxVolume}
              onChange={(e) => onChangeSfx(parseFloat(e.target.value))}
              className="w-full accent-[#06b6d4] cursor-pointer"
            />
          </div>
        </div>

        {/* Keyboard Controls Reference */}
        <div className="p-3.5 bg-[#120b24] border-2 border-[#fff4e8]/20 space-y-2 text-xs">
          <div className="font-pixel-display text-[11px] text-[#facc15]">
            KEYBOARD CONTROLS
          </div>
          <div className="grid grid-cols-2 gap-y-1.5 text-[#fff4e8]/80 font-pixel-mono">
            <span>Steer</span>
            <span className="text-right text-[#fff4e8]">← → or A / D</span>
            <span>Gas / Brake</span>
            <span className="text-right text-[#fff4e8]">↑ ↓ or W / S</span>
            <span>Drift</span>
            <span className="text-right text-[#fff4e8]">Shift</span>
            <span>N₂O Nitro</span>
            <span className="text-right text-[#fff4e8]">Space or N</span>
            <span>Auto Horn</span>
            <span className="text-right text-[#fff4e8]">H</span>
            <span>Restart Race</span>
            <span className="text-right text-[#fff4e8]">R</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={onResetSave}
            className="pixel-btn px-3 py-2 bg-[#1b1233] text-[#ef4444] text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Save</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="pixel-btn px-6 py-2.5 bg-[#16a34a] text-[#fff4e8] font-pixel-display text-sm font-bold cursor-pointer"
          >
            DONE
          </button>
        </div>
      </div>
    </div>
  );
};
