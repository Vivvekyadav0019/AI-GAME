import React from 'react';
import { Volume2, RotateCcw, Flame } from 'lucide-react';
import { formatTimeMs } from '../data/gameData';
import { InputState } from '../engine/raceEngine';
import { LiveRaceTelemetry, TrackSpec } from '../types/game';

interface RaceHudOverlayProps {
  telemetry: LiveRaceTelemetry;
  track: TrackSpec;
  autoPilot: boolean;
  onHorn: () => void;
  onTriggerNitro: () => void;
  onRestartRace: () => void;
  onInputChange: (partial: Partial<InputState>) => void;
}

function getOrdinal(n: number): string {
  if (n === 1) return 'st';
  if (n === 2) return 'nd';
  if (n === 3) return 'rd';
  return 'th';
}

export const RaceHudOverlay: React.FC<RaceHudOverlayProps> = ({
  telemetry,
  track,
  autoPilot,
  onHorn,
  onTriggerNitro,
  onRestartRace,
  onInputChange,
}) => {
  return (
    <div className="pointer-events-none fixed inset-0 z-10 flex flex-col justify-between pt-16 pb-4 px-4">
      {/* Top Row: Left Race Info & Right Minimap + Speedo */}
      <div className="flex items-start justify-between gap-4">
        {/* Top-Left: Position, Lap & Time */}
        <div className="pointer-events-auto pixel-panel-dark px-3.5 py-2.5 flex flex-col gap-1.5 min-w-[168px]">
          <div className="flex items-baseline justify-between gap-3">
            <div className="font-pixel-display text-2xl sm:text-3xl font-bold text-[#facc15] leading-none">
              {telemetry.position}
              <span className="text-sm text-[#fff4e8]">{getOrdinal(telemetry.position)}</span>
              <span className="text-xs text-[#fff4e8]/60 font-normal">/{telemetry.totalRacers}</span>
            </div>
            <div className="font-pixel-mono text-sm font-bold text-[#fff4e8]">
              LAP {telemetry.lap}/{telemetry.totalLaps}
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 text-xs font-pixel-mono border-t border-white/10 pt-1.5">
            <span className="text-[#fff4e8]">{formatTimeMs(telemetry.elapsedMs)}</span>
            <span className="text-[#fff4e8]/60">
              BEST {formatTimeMs(telemetry.bestLapMs)}
            </span>
          </div>

          <div className="text-[11px] text-[#fff4e8]/70 truncate">
            {track.name} {autoPilot ? '· Auto-Pilot' : ''}
          </div>
        </div>

        {/* Top-Right: Speedometer, N2O & Circuit Minimap */}
        <div className="pointer-events-auto flex items-start gap-2.5">
          <div className="pixel-panel-dark px-3.5 py-2.5 flex flex-col items-end gap-1.5 min-w-[136px]">
            <div className="flex items-baseline gap-1 font-pixel-mono">
              <span className="text-2xl sm:text-3xl font-bold text-[#fff4e8] leading-none">
                {telemetry.speedKmh}
              </span>
              <span className="text-xs text-[#fff4e8]/60">km/h</span>
            </div>

            {/* N2O Bar */}
            <div className="w-full flex items-center gap-2">
              <span className="text-[11px] font-pixel-mono font-bold text-[#06b6d4]">N₂O</span>
              <div className="flex-1 h-2.5 bg-[#090514] border border-white/25 overflow-hidden">
                <div
                  className={`h-full transition-all duration-75 ${
                    telemetry.isNitroActive ? 'bg-[#facc15]' : 'bg-[#06b6d4]'
                  }`}
                  style={{ width: `${telemetry.nitroCharge}%` }}
                />
              </div>
            </div>

            {telemetry.isDrifting && (
              <div className="text-xs font-pixel-mono font-bold text-[#ff8a3d]">
                DRIFT {telemetry.driftMeters}m
              </div>
            )}
          </div>

          {/* Pixel Circuit Minimap */}
          <div className="hidden sm:flex pixel-panel-dark p-2 items-center justify-center">
            <svg width="72" height="72" viewBox="-42 -42 84 84" aria-label="Track minimap">
              <circle
                cx="0"
                cy="0"
                r="32"
                fill="none"
                stroke="rgba(255,244,232,0.28)"
                strokeWidth="5"
              />
              {telemetry.racerPositions.map((r, idx) => {
                const angle = r.zRatio * Math.PI * 2 - Math.PI / 2;
                const rad = 32 + r.x * 3;
                const cx = Math.cos(angle) * rad;
                const cy = Math.sin(angle) * rad;
                return (
                  <rect
                    key={idx}
                    x={cx - (r.isPlayer ? 3.5 : 2)}
                    y={cy - (r.isPlayer ? 3.5 : 2)}
                    width={r.isPlayer ? 7 : 4}
                    height={r.isPlayer ? 7 : 4}
                    fill={r.isPlayer ? '#facc15' : '#94a3b8'}
                    stroke="#090514"
                    strokeWidth="1"
                  />
                );
              })}
            </svg>
          </div>
        </div>
      </div>

      {/* Bottom Row: Touch Controls (mobile/tablet) + Desktop Keybind Bar */}
      <div className="flex items-end justify-between gap-4">
        {/* Left Touch Steer Buttons (visible on touch/small screens) */}
        <div className="pointer-events-auto flex md:hidden items-center gap-2">
          <button
            type="button"
            onPointerDown={() => onInputChange({ left: true })}
            onPointerUp={() => onInputChange({ left: false })}
            onPointerLeave={() => onInputChange({ left: false })}
            className="pixel-btn w-14 h-14 bg-[#1b1233]/90 text-[#fff4e8] font-pixel-display text-xl flex items-center justify-center active:bg-[#ff4f8b]"
            aria-label="Steer Left"
          >
            ◀
          </button>
          <button
            type="button"
            onPointerDown={() => onInputChange({ right: true })}
            onPointerUp={() => onInputChange({ right: false })}
            onPointerLeave={() => onInputChange({ right: false })}
            className="pixel-btn w-14 h-14 bg-[#1b1233]/90 text-[#fff4e8] font-pixel-display text-xl flex items-center justify-center active:bg-[#ff4f8b]"
            aria-label="Steer Right"
          >
            ▶
          </button>
        </div>

        {/* Desktop Subtle Keybind & Quick Actions */}
        <div className="hidden md:flex pointer-events-auto items-center gap-3 pixel-panel-dark px-3.5 py-2 text-xs text-[#fff4e8]/80">
          <span>WASD / Arrows Drive</span>
          <span aria-hidden="true">·</span>
          <span>Shift Drift</span>
          <span aria-hidden="true">·</span>
          <span>Space N₂O</span>
          <span aria-hidden="true">·</span>
          <span>H Horn</span>
        </div>

        {/* Right Action Buttons (Gas on mobile, Horn, N2O, Restart) */}
        <div className="pointer-events-auto flex items-center gap-2">
          <button
            type="button"
            onPointerDown={() => onInputChange({ up: true })}
            onPointerUp={() => onInputChange({ up: false })}
            onPointerLeave={() => onInputChange({ up: false })}
            className="pixel-btn md:hidden px-4 py-3 bg-[#16a34a] text-[#fff4e8] font-pixel-display text-xs font-bold cursor-pointer active:bg-[#22c55e]"
          >
            GAS
          </button>

          <button
            type="button"
            onClick={onHorn}
            className="pixel-btn px-3 py-2.5 bg-[#1b1233]/90 text-[#facc15] text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            title="Honk Auto Horn (H)"
          >
            <Volume2 className="w-4 h-4" />
            <span>Horn</span>
          </button>

          <button
            type="button"
            onClick={onTriggerNitro}
            disabled={telemetry.nitroCharge < 25 || telemetry.isNitroActive}
            className="pixel-btn px-3.5 py-2.5 bg-[#06b6d4] text-[#090514] text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            title="Activate Nitro Boost (Space)"
          >
            <Flame className="w-4 h-4" />
            <span>N₂O</span>
          </button>

          <button
            type="button"
            onClick={onRestartRace}
            className="pixel-btn p-2.5 bg-[#1b1233]/90 text-[#fff4e8] cursor-pointer"
            title="Restart Race (R)"
            aria-label="Restart Race"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
