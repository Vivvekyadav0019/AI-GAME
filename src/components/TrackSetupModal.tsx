import React from 'react';
import { X, Play } from 'lucide-react';
import { TRACKS, formatTimeMs } from '../data/gameData';
import { CityId, Difficulty, RaceSettings, TimeOfDay, WeatherType } from '../types/game';

interface TrackSetupModalProps {
  settings: RaceSettings;
  bestLaps: Record<string, number>;
  onUpdateSettings: (partial: Partial<RaceSettings>) => void;
  onStartRace: () => void;
  onClose: () => void;
}

export const TrackSetupModal: React.FC<TrackSetupModalProps> = ({
  settings,
  bestLaps,
  onUpdateSettings,
  onStartRace,
  onClose,
}) => {
  const cityTracks = TRACKS.filter((t) => t.city === settings.city);

  const handleCityChange = (city: CityId) => {
    const firstTrack = TRACKS.find((t) => t.city === city);
    onUpdateSettings({
      city,
      trackId: firstTrack ? firstTrack.id : settings.trackId,
    });
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 pt-16 bg-[#090514]/75 backdrop-blur-xs">
      <div className="pixel-panel w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b-2 border-[#fff4e8]/20 bg-[#120b24]">
          <div>
            <h2 className="font-pixel-display text-lg sm:text-xl font-bold text-[#facc15]">
              CIRCUITS &amp; RACE SETUP
            </h2>
            <p className="text-xs text-[#fff4e8]/70">
              Select a road in Gurugram or Delhi and configure race conditions
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Track Setup"
            className="pixel-btn p-1.5 bg-[#1b1233] text-[#fff4e8] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto pixel-scroll space-y-5">
          {/* City Segmented Control */}
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm font-bold text-[#fff4e8]">City</span>
            <div className="flex gap-1 p-1 bg-[#120b24] border-2 border-[#fff4e8]/20">
              {(['gurugram', 'delhi'] as CityId[]).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => handleCityChange(c)}
                  className={`px-4 py-1.5 text-sm font-bold capitalize cursor-pointer transition-colors ${
                    settings.city === c
                      ? 'bg-[#ff4f8b] text-[#fff4e8]'
                      : 'text-[#fff4e8]/70 hover:text-[#fff4e8]'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* 4 Tracks Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {cityTracks.map((tr) => {
              const selected = settings.trackId === tr.id;
              const best = bestLaps[tr.id] ?? null;
              return (
                <button
                  key={tr.id}
                  type="button"
                  onClick={() => onUpdateSettings({ trackId: tr.id })}
                  className={`text-left p-3.5 border-2 transition-colors cursor-pointer ${
                    selected
                      ? 'bg-[#2a1c4d] border-[#facc15]'
                      : 'bg-[#120b24] border-[#fff4e8]/20 hover:border-[#fff4e8]/50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-pixel-display text-sm font-bold text-[#fff4e8]">
                      {tr.name}
                    </span>
                    <span className="font-pixel-mono text-[11px] text-[#facc15]">
                      {'★'.repeat(tr.difficultyRating)}
                    </span>
                  </div>
                  <p className="text-xs text-[#fff4e8]/70 mt-1">{tr.subtitle}</p>
                  <div className="mt-2 pt-1.5 border-t border-white/10 flex justify-between text-[11px] font-pixel-mono text-[#fff4e8]/60">
                    <span>Best Lap</span>
                    <span className="text-[#fff4e8]">{formatTimeMs(best)}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Laps, Rivals, Time, Weather */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-white/10">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-[#fff4e8]/80">Laps</span>
              <div className="flex gap-1 p-1 bg-[#120b24] border border-white/20">
                {([1, 3, 5] as const).map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => onUpdateSettings({ laps: l })}
                    className={`px-3 py-1 text-xs font-pixel-mono font-bold cursor-pointer ${
                      settings.laps === l
                        ? 'bg-[#facc15] text-[#090514]'
                        : 'text-[#fff4e8]/75 hover:text-[#fff4e8]'
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-[#fff4e8]/80">Rivals</span>
              <div className="flex gap-1 p-1 bg-[#120b24] border border-white/20">
                {(['easy', 'normal', 'hard'] as Difficulty[]).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => onUpdateSettings({ difficulty: d })}
                    className={`px-2.5 py-1 text-xs font-bold capitalize cursor-pointer ${
                      settings.difficulty === d
                        ? 'bg-[#facc15] text-[#090514]'
                        : 'text-[#fff4e8]/75 hover:text-[#fff4e8]'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-[#fff4e8]/80">Time</span>
              <div className="flex gap-1 p-1 bg-[#120b24] border border-white/20">
                {(['morning', 'sunset', 'night'] as TimeOfDay[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => onUpdateSettings({ time: t })}
                    className={`px-2.5 py-1 text-xs font-bold capitalize cursor-pointer ${
                      settings.time === t
                        ? 'bg-[#ff8a3d] text-[#090514]'
                        : 'text-[#fff4e8]/75 hover:text-[#fff4e8]'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-[#fff4e8]/80">Weather</span>
              <div className="flex gap-1 p-1 bg-[#120b24] border border-white/20">
                {(['clear', 'rain'] as WeatherType[]).map((w) => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => onUpdateSettings({ weather: w })}
                    className={`px-3 py-1 text-xs font-bold capitalize cursor-pointer ${
                      settings.weather === w
                        ? 'bg-[#06b6d4] text-[#090514]'
                        : 'text-[#fff4e8]/75 hover:text-[#fff4e8]'
                    }`}
                  >
                    {w}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={onStartRace}
              className="pixel-btn px-6 py-3 bg-[#16a34a] text-[#fff4e8] font-pixel-display text-sm font-bold flex items-center gap-2 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>START RACE · चलो!</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
