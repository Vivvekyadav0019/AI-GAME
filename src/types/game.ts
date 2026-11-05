export type CityId = 'gurugram' | 'delhi';
export type TimeOfDay = 'morning' | 'sunset' | 'night';
export type WeatherType = 'clear' | 'rain';
export type Difficulty = 'easy' | 'normal' | 'hard';
export type ActiveTab = 'race' | 'garage' | 'fleet' | 'tracks';

export interface AutoPalette {
  body: string;
  bodyDark: string;
  canopy: string;
  canopyDark: string;
  stripe: string;
  bumper: string;
}

export interface AutoSpec {
  id: string;
  name: string;
  tagline: string;
  tier: string;
  unlockCost: number;
  baseSpeed: number; // km/h max
  baseAccel: number; // 1-10
  baseGrip: number; // 1-10
  passiveCps: number; // base coins per second when owned
  palette: AutoPalette;
}

export type UpgradeKey = 'engine' | 'gearbox' | 'tyres' | 'nitro';

export interface UpgradeState {
  engine: number;
  gearbox: number;
  tyres: number;
  nitro: number;
}

export interface FleetBusiness {
  id: string;
  name: string;
  description: string;
  baseCost: number;
  costGrowth: number;
  baseCps: number;
  multiplierBonus?: number; // e.g. 0.15 = +15% all income
}

export interface TrackSpec {
  id: string;
  city: CityId;
  name: string;
  subtitle: string;
  lengthSegments: number;
  landmarkType: 'cyber' | 'metro' | 'flyover' | 'village' | 'parliament' | 'cp' | 'indiagate' | 'redfort';
  difficultyRating: 1 | 2 | 3;
}

export interface DailyChallenge {
  id: string;
  label: string;
  target: number;
  progress: number;
  reward: number;
  claimed: boolean;
  type: 'laps' | 'coins' | 'drift' | 'nitro' | 'wins';
}

export interface RaceSettings {
  city: CityId;
  trackId: string;
  laps: 1 | 3 | 5;
  difficulty: Difficulty;
  time: TimeOfDay;
  weather: WeatherType;
}

export interface LiveRaceTelemetry {
  position: number;
  totalRacers: number;
  lap: number;
  totalLaps: number;
  speedKmh: number;
  nitroCharge: number; // 0 to 100
  isNitroActive: boolean;
  isDrifting: boolean;
  driftMeters: number;
  raceCoins: number;
  elapsedMs: number;
  bestLapMs: number | null;
  progressRatio: number; // 0 to 1 across current lap
  racerPositions: { x: number; zRatio: number; isPlayer: boolean; color: string }[];
}

export interface RaceResultSummary {
  position: number;
  totalRacers: number;
  totalTimeMs: number;
  bestLapMs: number | null;
  raceCoins: number;
  positionBonus: number;
  driftBonus: number;
  prestigeMultiplier: number;
  totalEarned: number;
  isNewBestLap: boolean;
}

export interface PersistentSave {
  coins: number;
  totalCoinsEarned: number;
  totalMetersDriven: number;
  racesCompleted: number;
  winStreak: number;
  prestigeBadges: number; // Golden Horn Badges
  selectedAutoId: string;
  unlockedAutos: string[];
  upgrades: Record<string, UpgradeState>;
  fleetCounts: Record<string, number>;
  bestLaps: Record<string, number>;
  raceSettings: RaceSettings;
  autoPilot: boolean;
  musicVolume: number; // 0 to 1
  sfxVolume: number; // 0 to 1
  lastSavedAt: number;
  challenges: DailyChallenge[];
  challengeDate: string;
}
