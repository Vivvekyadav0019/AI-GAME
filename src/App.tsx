import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { soundEngine } from './audio/soundEngine';
import { FleetIdleModal } from './components/FleetIdleModal';
import { GarageModal } from './components/GarageModal';
import { OfflineEarningsModal } from './components/OfflineEarningsModal';
import { RaceHudOverlay } from './components/RaceHudOverlay';
import { ResultsModal } from './components/ResultsModal';
import { SettingsModal } from './components/SettingsModal';
import { TopHudBar } from './components/TopHudBar';
import { TrackSetupModal } from './components/TrackSetupModal';
import {
  AUTOS,
  FLEET_BUSINESSES,
  TRACKS,
  UPGRADE_META,
  createDailyChallenges,
  createInitialSave,
  getFleetCost,
  getPrestigeMultiplier,
  getPrestigeRequirement,
  getTodayKey,
  getTotalPassiveCps,
  getUpgradeCost,
} from './data/gameData';
import { InputState, RaceEngine } from './engine/raceEngine';
import {
  ActiveTab,
  LiveRaceTelemetry,
  PersistentSave,
  RaceResultSummary,
  RaceSettings,
  UpgradeKey,
} from './types/game';

const STORAGE_KEY = 'autorush_pixel_save_v1';

function loadInitialSave(): {
  save: PersistentSave;
  offline: { awaySeconds: number; earnedCoins: number } | null;
} {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { save: createInitialSave(), offline: null };
    const parsed = JSON.parse(raw) as PersistentSave;
    const base = createInitialSave();
    const merged: PersistentSave = {
      ...base,
      ...parsed,
      raceSettings: { ...base.raceSettings, ...(parsed.raceSettings || {}) },
      upgrades: { ...base.upgrades, ...(parsed.upgrades || {}) },
      fleetCounts: { ...base.fleetCounts, ...(parsed.fleetCounts || {}) },
      bestLaps: { ...(parsed.bestLaps || {}) },
    };

    // Reset daily challenges if new day
    const today = getTodayKey();
    if (merged.challengeDate !== today) {
      merged.challengeDate = today;
      merged.challenges = createDailyChallenges();
    }

    // Calculate offline earnings (up to 8 hours)
    const now = Date.now();
    const awaySeconds = Math.min(8 * 3600, Math.max(0, Math.floor((now - merged.lastSavedAt) / 1000)));
    const cps = getTotalPassiveCps(merged);
    const earnedCoins = Math.floor(awaySeconds * cps * 0.75);

    if (awaySeconds >= 30 && earnedCoins > 0) {
      return { save: merged, offline: { awaySeconds, earnedCoins } };
    }
    return { save: merged, offline: null };
  } catch {
    return { save: createInitialSave(), offline: null };
  }
}

export default function App() {
  const initial = useMemo(() => loadInitialSave(), []);
  const [save, setSave] = useState<PersistentSave>(initial.save);
  const [offlineReport, setOfflineReport] = useState(initial.offline);
  const [activeTab, setActiveTab] = useState<ActiveTab>('race');
  const [showSettings, setShowSettings] = useState(false);
  const [raceResult, setRaceResult] = useState<RaceResultSummary | null>(null);
  const [toastText, setToastText] = useState<string | null>(null);

  const [telemetry, setTelemetry] = useState<LiveRaceTelemetry>({
    position: 8,
    totalRacers: 8,
    lap: 1,
    totalLaps: initial.save.raceSettings.laps,
    speedKmh: 0,
    nitroCharge: 65,
    isNitroActive: false,
    isDrifting: false,
    driftMeters: 0,
    raceCoins: 0,
    elapsedMs: 0,
    bestLapMs: null,
    progressRatio: 0,
    racerPositions: [],
  });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<RaceEngine | null>(null);

  const selectedAuto = useMemo(
    () => AUTOS.find((a) => a.id === save.selectedAutoId) || AUTOS[0],
    [save.selectedAutoId]
  );

  const currentTrack = useMemo(
    () => TRACKS.find((t) => t.id === save.raceSettings.trackId) || TRACKS[0],
    [save.raceSettings.trackId]
  );

  const passiveCps = useMemo(() => getTotalPassiveCps(save), [save]);
  const prestigeMult = useMemo(() => getPrestigeMultiplier(save), [save]);

  const hasAffordableUpgrade = useMemo(() => {
    const upg = save.upgrades[selectedAuto.id] || {
      engine: 0,
      gearbox: 0,
      tyres: 0,
      nitro: 0,
    };
    return UPGRADE_META.some(
      (u) => upg[u.key] < u.maxLevel && save.coins >= getUpgradeCost(u.baseCost, upg[u.key])
    );
  }, [save.coins, save.upgrades, selectedAuto.id]);

  // Sync audio volumes
  useEffect(() => {
    soundEngine.setVolumes(save.musicVolume, save.sfxVolume);
  }, [save.musicVolume, save.sfxVolume]);

  // Persist save to localStorage
  useEffect(() => {
    const toStore: PersistentSave = {
      ...save,
      lastSavedAt: Date.now(),
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
    } catch {
      // Ignore storage quota errors
    }
  }, [save]);

  // Passive Idle Income tick (1s)
  useEffect(() => {
    const timer = window.setInterval(() => {
      setSave((prev) => {
        const cps = getTotalPassiveCps(prev);
        if (cps <= 0) return prev;
        return {
          ...prev,
          coins: prev.coins + cps,
          totalCoinsEarned: prev.totalCoinsEarned + cps,
        };
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const showToast = useCallback((msg: string) => {
    setToastText(msg);
    window.setTimeout(() => {
      setToastText((curr) => (curr === msg ? null : curr));
    }, 2400);
  }, []);

  // Initialize RaceEngine on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    const engine = new RaceEngine(canvas, save.raceSettings, {
      onTelemetry: (t) => setTelemetry(t),
      onCoinPickup: (amount) => {
        setSave((prev) => ({
          ...prev,
          coins: prev.coins + amount,
          totalCoinsEarned: prev.totalCoinsEarned + amount,
          challenges: prev.challenges.map((ch) =>
            ch.type === 'coins' ? { ...ch, progress: ch.progress + 1 } : ch
          ),
        }));
      },
      onLapOrFinish: (info) => {
        setSave((prev) => {
          const trackId = prev.raceSettings.trackId;
          const prevBest = prev.bestLaps[trackId];
          const nextBest =
            prevBest === undefined || info.lapTimeMs < prevBest ? info.lapTimeMs : prevBest;

          const updatedChallenges = prev.challenges.map((ch) => {
            if (ch.type === 'laps') return { ...ch, progress: ch.progress + 1 };
            if (ch.type === 'drift' && info.finished) {
              return { ...ch, progress: ch.progress + info.driftMeters };
            }
            return ch;
          });

          if (info.finished && info.summary) {
            const bonusCoins = info.summary.positionBonus + info.summary.driftBonus;
            return {
              ...prev,
              coins: prev.coins + bonusCoins,
              totalCoinsEarned: prev.totalCoinsEarned + bonusCoins,
              racesCompleted: prev.racesCompleted + 1,
              winStreak: info.summary.position === 1 ? prev.winStreak + 1 : 0,
              bestLaps: { ...prev.bestLaps, [trackId]: nextBest },
              challenges: updatedChallenges,
            };
          }

          return {
            ...prev,
            bestLaps: { ...prev.bestLaps, [trackId]: nextBest },
            challenges: updatedChallenges,
          };
        });

        if (info.finished && info.summary) {
          setRaceResult(info.summary);
        } else {
          showToast(`LAP ${info.lapCompleted} COMPLETE!`);
        }
      },
    });

    engineRef.current = engine;
    engine.start();

    return () => {
      window.removeEventListener('resize', handleResize);
      engine.stop();
      engineRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync engine config when auto, upgrades, autopilot, or prestige changes
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;
    const upg = save.upgrades[selectedAuto.id] || {
      engine: 0,
      gearbox: 0,
      tyres: 0,
      nitro: 0,
    };
    engine.updateConfig(
      save.raceSettings,
      selectedAuto,
      upg,
      save.autoPilot,
      prestigeMult,
      false
    );
  }, [save.raceSettings, selectedAuto, save.upgrades, save.autoPilot, prestigeMult]);

  // Keyboard controls & Web Audio unlock
  useEffect(() => {
    const unlockAudio = () => soundEngine.unlock();
    window.addEventListener('pointerdown', unlockAudio, { once: true });
    window.addEventListener('keydown', unlockAudio, { once: true });

    const onKeyDown = (e: KeyboardEvent) => {
      const engine = engineRef.current;
      if (!engine) return;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
      }
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') engine.setInput({ left: true });
      if (e.code === 'ArrowRight' || e.code === 'KeyD') engine.setInput({ right: true });
      if (e.code === 'ArrowUp' || e.code === 'KeyW') engine.setInput({ up: true });
      if (e.code === 'ArrowDown' || e.code === 'KeyS') engine.setInput({ down: true });
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') engine.setInput({ drift: true });
      if (e.code === 'Space' || e.code === 'KeyN') engine.triggerNitro();
      if (e.code === 'KeyH') soundEngine.playHorn();
      if (e.code === 'KeyR') {
        setRaceResult(null);
        const upg = save.upgrades[selectedAuto.id] || {
          engine: 0,
          gearbox: 0,
          tyres: 0,
          nitro: 0,
        };
        engine.setupRace(
          save.raceSettings,
          selectedAuto,
          upg,
          save.autoPilot,
          prestigeMult
        );
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      const engine = engineRef.current;
      if (!engine) return;
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') engine.setInput({ left: false });
      if (e.code === 'ArrowRight' || e.code === 'KeyD') engine.setInput({ right: false });
      if (e.code === 'ArrowUp' || e.code === 'KeyW') engine.setInput({ up: false });
      if (e.code === 'ArrowDown' || e.code === 'KeyS') engine.setInput({ down: false });
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') engine.setInput({ drift: false });
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [save.raceSettings, selectedAuto, save.upgrades, save.autoPilot, prestigeMult]);

  const handleRestartRace = useCallback(() => {
    setRaceResult(null);
    setActiveTab('race');
    const engine = engineRef.current;
    if (!engine) return;
    const upg = save.upgrades[selectedAuto.id] || {
      engine: 0,
      gearbox: 0,
      tyres: 0,
      nitro: 0,
    };
    engine.setupRace(save.raceSettings, selectedAuto, upg, save.autoPilot, prestigeMult);
  }, [save.raceSettings, selectedAuto, save.upgrades, save.autoPilot, prestigeMult]);

  const handleSelectAuto = (autoId: string) => {
    soundEngine.playClick();
    setSave((prev) => ({
      ...prev,
      selectedAutoId: autoId,
      upgrades: {
        ...prev.upgrades,
        [autoId]: prev.upgrades[autoId] || { engine: 0, gearbox: 0, tyres: 0, nitro: 0 },
      },
    }));
  };

  const handleUnlockAuto = (autoId: string) => {
    const spec = AUTOS.find((a) => a.id === autoId);
    if (!spec) return;
    soundEngine.playUpgrade();
    setSave((prev) => {
      if (prev.coins < spec.unlockCost || prev.unlockedAutos.includes(autoId)) return prev;
      return {
        ...prev,
        coins: prev.coins - spec.unlockCost,
        unlockedAutos: [...prev.unlockedAutos, autoId],
        selectedAutoId: autoId,
        upgrades: {
          ...prev.upgrades,
          [autoId]: { engine: 0, gearbox: 0, tyres: 0, nitro: 0 },
        },
      };
    });
  };

  const handleBuyUpgrade = (autoId: string, key: UpgradeKey) => {
    const meta = UPGRADE_META.find((u) => u.key === key);
    if (!meta) return;
    soundEngine.playUpgrade();
    setSave((prev) => {
      const currUpg = prev.upgrades[autoId] || { engine: 0, gearbox: 0, tyres: 0, nitro: 0 };
      const lvl = currUpg[key];
      if (lvl >= meta.maxLevel) return prev;
      const cost = getUpgradeCost(meta.baseCost, lvl);
      if (prev.coins < cost) return prev;
      return {
        ...prev,
        coins: prev.coins - cost,
        upgrades: {
          ...prev.upgrades,
          [autoId]: { ...currUpg, [key]: lvl + 1 },
        },
      };
    });
  };

  const handleBuyFleet = (bizId: string) => {
    const biz = FLEET_BUSINESSES.find((b) => b.id === bizId);
    if (!biz) return;
    soundEngine.playUpgrade();
    setSave((prev) => {
      const count = prev.fleetCounts[bizId] || 0;
      const cost = getFleetCost(biz, count);
      if (prev.coins < cost) return prev;
      return {
        ...prev,
        coins: prev.coins - cost,
        fleetCounts: {
          ...prev.fleetCounts,
          [bizId]: count + 1,
        },
      };
    });
  };

  const handleClaimChallenge = (challengeId: string) => {
    soundEngine.playFanfare();
    setSave((prev) => {
      let reward = 0;
      const nextChallenges = prev.challenges.map((ch) => {
        if (ch.id === challengeId && !ch.claimed && ch.progress >= ch.target) {
          reward = ch.reward;
          return { ...ch, claimed: true };
        }
        return ch;
      });
      if (reward === 0) return prev;
      return {
        ...prev,
        coins: prev.coins + reward,
        totalCoinsEarned: prev.totalCoinsEarned + reward,
        challenges: nextChallenges,
      };
    });
  };

  const handlePrestige = () => {
    const req = getPrestigeRequirement(save.prestigeBadges);
    if (save.totalCoinsEarned < req) return;
    soundEngine.playFanfare();
    setSave((prev) => ({
      ...prev,
      coins: 250,
      prestigeBadges: prev.prestigeBadges + 1,
      fleetCounts: {
        'chai-pitstop': 0,
        'metro-stand': 0,
        'night-fleet': 0,
        'surge-meter': 0,
        'ncr-hub': 0,
      },
    }));
    showToast('PERMIT RENEWED! +25% PERMANENT EARNINGS');
  };

  const handleUpdateRaceSettings = (partial: Partial<RaceSettings>) => {
    soundEngine.playClick();
    setSave((prev) => ({
      ...prev,
      raceSettings: { ...prev.raceSettings, ...partial },
    }));
  };

  const handleInputChange = (partial: Partial<InputState>) => {
    engineRef.current?.setInput(partial);
  };

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[#120b24]">
      {/* Full-Viewport 16-Bit Pixel Art Race Canvas */}
      <canvas
        ref={canvasRef}
        className="pixelated block w-full h-full"
        aria-label="Auto Rush Pixel Grand Prix race track"
      />

      {/* Persistent 3-Zone Top Navigation & Wallet Bar */}
      <TopHudBar
        activeTab={activeTab}
        onSelectTab={(tab) => {
          soundEngine.playClick();
          setActiveTab(tab);
        }}
        coins={save.coins}
        passiveCps={passiveCps}
        autoPilot={save.autoPilot}
        onToggleAutoPilot={() => {
          soundEngine.playClick();
          setSave((prev) => ({ ...prev, autoPilot: !prev.autoPilot }));
        }}
        onOpenSettings={() => {
          soundEngine.playClick();
          setShowSettings(true);
        }}
        hasAffordableUpgrade={hasAffordableUpgrade}
      />

      {/* Active Race Corner HUD */}
      {activeTab === 'race' && !raceResult && (
        <RaceHudOverlay
          telemetry={telemetry}
          track={currentTrack}
          autoPilot={save.autoPilot}
          onHorn={() => soundEngine.playHorn()}
          onTriggerNitro={() => engineRef.current?.triggerNitro()}
          onRestartRace={handleRestartRace}
          onInputChange={handleInputChange}
        />
      )}

      {/* Subtle Lap / Prestige Toast */}
      {toastText && (
        <div className="pointer-events-none fixed top-20 left-1/2 -translate-x-1/2 z-30 pixel-panel px-4 py-2 font-pixel-display text-sm font-bold text-[#facc15]">
          {toastText}
        </div>
      )}

      {/* Garage & Upgrades Modal */}
      {activeTab === 'garage' && (
        <GarageModal
          save={save}
          onSelectAuto={handleSelectAuto}
          onUnlockAuto={handleUnlockAuto}
          onBuyUpgrade={handleBuyUpgrade}
          onClose={() => setActiveTab('race')}
        />
      )}

      {/* Idle Fleet & Prestige Modal */}
      {activeTab === 'fleet' && (
        <FleetIdleModal
          save={save}
          onBuyFleet={handleBuyFleet}
          onClaimChallenge={handleClaimChallenge}
          onPrestige={handlePrestige}
          onClose={() => setActiveTab('race')}
        />
      )}

      {/* Circuits & Race Setup Modal */}
      {activeTab === 'tracks' && (
        <TrackSetupModal
          settings={save.raceSettings}
          bestLaps={save.bestLaps}
          onUpdateSettings={handleUpdateRaceSettings}
          onStartRace={handleRestartRace}
          onClose={() => setActiveTab('race')}
        />
      )}

      {/* Post-Race Results Modal */}
      {raceResult && (
        <ResultsModal
          summary={raceResult}
          trackName={currentTrack.name}
          autoPilot={save.autoPilot}
          onRaceAgain={handleRestartRace}
          onOpenGarage={() => {
            setRaceResult(null);
            setActiveTab('garage');
          }}
        />
      )}

      {/* Offline Earnings Welcome-Back Modal */}
      {offlineReport && (
        <OfflineEarningsModal
          awaySeconds={offlineReport.awaySeconds}
          earnedCoins={offlineReport.earnedCoins}
          onClaim={() => {
            soundEngine.playFanfare();
            setSave((prev) => ({
              ...prev,
              coins: prev.coins + offlineReport.earnedCoins,
              totalCoinsEarned: prev.totalCoinsEarned + offlineReport.earnedCoins,
            }));
            setOfflineReport(null);
          }}
        />
      )}

      {/* Settings & Controls Modal */}
      {showSettings && (
        <SettingsModal
          musicVolume={save.musicVolume}
          sfxVolume={save.sfxVolume}
          onChangeMusic={(v) => setSave((prev) => ({ ...prev, musicVolume: v }))}
          onChangeSfx={(v) => setSave((prev) => ({ ...prev, sfxVolume: v }))}
          onResetSave={() => {
            const fresh = createInitialSave();
            setSave(fresh);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
            setShowSettings(false);
            handleRestartRace();
          }}
          onClose={() => setShowSettings(false)}
        />
      )}
    </main>
  );
}
