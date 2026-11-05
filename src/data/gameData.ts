import {
  AutoSpec,
  DailyChallenge,
  FleetBusiness,
  PersistentSave,
  TrackSpec,
  UpgradeKey,
} from '../types/game';

export const AUTOS: AutoSpec[] = [
  {
    id: 'dilli-classic',
    name: 'Dilli Classic',
    tagline: 'The green-yellow CNG legend',
    tier: 'Starter',
    unlockCost: 0,
    baseSpeed: 132,
    baseAccel: 5,
    baseGrip: 6,
    passiveCps: 2,
    palette: {
      body: '#16a34a',
      bodyDark: '#14532d',
      canopy: '#facc15',
      canopyDark: '#ca8a04',
      stripe: '#fef08a',
      bumper: '#d4d4d8',
    },
  },
  {
    id: 'kaali-peeli',
    name: 'Kaali-Peeli',
    tagline: 'Metered midnight express',
    tier: 'Street',
    unlockCost: 450,
    baseSpeed: 142,
    baseAccel: 6,
    baseGrip: 6,
    passiveCps: 6,
    palette: {
      body: '#27272a',
      bodyDark: '#09090b',
      canopy: '#facc15',
      canopyDark: '#a16207',
      stripe: '#fde047',
      bumper: '#e4e4e7',
    },
  },
  {
    id: 'cyber-express',
    name: 'Cyber City EV',
    tagline: 'Silent torque from DLF Phase 3',
    tier: 'Tech',
    unlockCost: 1400,
    baseSpeed: 154,
    baseAccel: 8,
    baseGrip: 7,
    passiveCps: 15,
    palette: {
      body: '#06b6d4',
      bodyDark: '#164e63',
      canopy: '#f8fafc',
      canopyDark: '#cbd5e1',
      stripe: '#22d3ee',
      bumper: '#38bdf8',
    },
  },
  {
    id: 'jaipur-pink',
    name: 'Pink City Tuk',
    tagline: 'Terracotta & brass royal cruiser',
    tier: 'Heritage',
    unlockCost: 3500,
    baseSpeed: 164,
    baseAccel: 7,
    baseGrip: 8,
    passiveCps: 32,
    palette: {
      body: '#ec4899',
      bodyDark: '#831843',
      canopy: '#fde68a',
      canopyDark: '#d97706',
      stripe: '#fbcfe8',
      bumper: '#fbbf24',
    },
  },
  {
    id: 'goa-breezer',
    name: 'Goa Sunset',
    tagline: 'Open-top coastal drift machine',
    tier: 'Coastal',
    unlockCost: 8500,
    baseSpeed: 175,
    baseAccel: 8,
    baseGrip: 9,
    passiveCps: 70,
    palette: {
      body: '#f97316',
      bodyDark: '#9a3412',
      canopy: '#38bdf8',
      canopyDark: '#0369a1',
      stripe: '#fef08a',
      bumper: '#fed7aa',
    },
  },
  {
    id: 'bhangra-turbo',
    name: 'Highway Dhaba',
    tagline: 'NH-48 twin-exhaust beast',
    tier: 'Pro',
    unlockCost: 20000,
    baseSpeed: 188,
    baseAccel: 9,
    baseGrip: 8,
    passiveCps: 150,
    palette: {
      body: '#ef4444',
      bodyDark: '#7f1d1d',
      canopy: '#f59e0b',
      canopyDark: '#b45309',
      stripe: '#fef08a',
      bumper: '#facc15',
    },
  },
  {
    id: 'isro-astro',
    name: 'Astro-Auto',
    tagline: 'Cryogenic N2O thrusters',
    tier: 'Experimental',
    unlockCost: 50000,
    baseSpeed: 202,
    baseAccel: 10,
    baseGrip: 9,
    passiveCps: 340,
    palette: {
      body: '#e2e8f0',
      bodyDark: '#475569',
      canopy: '#f59e0b',
      canopyDark: '#b45309',
      stripe: '#38bdf8',
      bumper: '#fbbf24',
    },
  },
  {
    id: 'maharaja-gold',
    name: 'Maharaja 24K',
    tagline: 'Solid gold flagship of the Grand Prix',
    tier: 'Legend',
    unlockCost: 125000,
    baseSpeed: 218,
    baseAccel: 10,
    baseGrip: 10,
    passiveCps: 800,
    palette: {
      body: '#fbbf24',
      bodyDark: '#92400e',
      canopy: '#be123c',
      canopyDark: '#4c0519',
      stripe: '#fef08a',
      bumper: '#fde047',
    },
  },
];

export const TRACKS: TrackSpec[] = [
  // Gurugram
  {
    id: 'ggn-cyber',
    city: 'gurugram',
    name: 'Cyber City',
    subtitle: 'Glass towers & Rapid Metro viaduct',
    lengthSegments: 520,
    landmarkType: 'cyber',
    difficultyRating: 1,
  },
  {
    id: 'ggn-mg',
    city: 'gurugram',
    name: 'MG Road',
    subtitle: 'Under the Yellow Line pillars',
    lengthSegments: 580,
    landmarkType: 'metro',
    difficultyRating: 2,
  },
  {
    id: 'ggn-iffco',
    city: 'gurugram',
    name: 'IFFCO Flyover',
    subtitle: 'High-speed NH-48 sweeping ramps',
    lengthSegments: 640,
    landmarkType: 'flyover',
    difficultyRating: 2,
  },
  {
    id: 'ggn-mahipalpur',
    city: 'gurugram',
    name: 'Mahipalpur Lanes',
    subtitle: 'Tight chicanes & airport expressway',
    lengthSegments: 700,
    landmarkType: 'village',
    difficultyRating: 3,
  },
  // Delhi
  {
    id: 'del-sansad',
    city: 'delhi',
    name: 'Sansad Marg',
    subtitle: 'Jantar Mantar to Parliament',
    lengthSegments: 560,
    landmarkType: 'parliament',
    difficultyRating: 1,
  },
  {
    id: 'del-cp',
    city: 'delhi',
    name: 'Connaught Place',
    subtitle: 'Inner & Outer Circle colonnades',
    lengthSegments: 620,
    landmarkType: 'cp',
    difficultyRating: 2,
  },
  {
    id: 'del-kartavya',
    city: 'delhi',
    name: 'Kartavya Path',
    subtitle: 'Wide ceremonial sprint to India Gate',
    lengthSegments: 660,
    landmarkType: 'indiagate',
    difficultyRating: 2,
  },
  {
    id: 'del-redfort',
    city: 'delhi',
    name: 'Red Fort Circuit',
    subtitle: 'Old Delhi sandstone ramparts',
    lengthSegments: 740,
    landmarkType: 'redfort',
    difficultyRating: 3,
  },
];

export const UPGRADE_META: {
  key: UpgradeKey;
  name: string;
  effect: string;
  baseCost: number;
  maxLevel: number;
}[] = [
  {
    key: 'engine',
    name: 'CNG Turbo Engine',
    effect: '+4 km/h Top Speed',
    baseCost: 120,
    maxLevel: 15,
  },
  {
    key: 'gearbox',
    name: 'Clutch & Gearbox',
    effect: '+8% Acceleration',
    baseCost: 100,
    maxLevel: 15,
  },
  {
    key: 'tyres',
    name: 'MRF Radial Tyres',
    effect: '+7% Cornering Grip',
    baseCost: 100,
    maxLevel: 15,
  },
  {
    key: 'nitro',
    name: 'N₂O Cylinder',
    effect: '+12% Nitro Boost & Recharge',
    baseCost: 140,
    maxLevel: 15,
  },
];

export const FLEET_BUSINESSES: FleetBusiness[] = [
  {
    id: 'chai-pitstop',
    name: 'Chai & Samosa Pitstop',
    description: 'Roadside fuel for every passing auto driver.',
    baseCost: 150,
    costGrowth: 1.18,
    baseCps: 4,
  },
  {
    id: 'metro-stand',
    name: 'Metro Feeder Stand',
    description: 'Guaranteed commuter queues at HUDA City Centre.',
    baseCost: 900,
    costGrowth: 1.2,
    baseCps: 22,
  },
  {
    id: 'night-fleet',
    name: 'Night-Shift CNG Fleet',
    description: '24/7 shared autos running airport & cyber routes.',
    baseCost: 4800,
    costGrowth: 1.22,
    baseCps: 110,
  },
  {
    id: 'surge-meter',
    name: 'Digital Surge Meter',
    description: 'Boosts all race & idle coin payouts by +15%.',
    baseCost: 18000,
    costGrowth: 1.35,
    baseCps: 250,
    multiplierBonus: 0.15,
  },
  {
    id: 'ncr-hub',
    name: 'NCR Grand Prix Hub',
    description: 'Flagship depot across Gurugram & New Delhi.',
    baseCost: 75000,
    costGrowth: 1.25,
    baseCps: 1200,
  },
];

export function getUpgradeCost(baseCost: number, currentLevel: number): number {
  return Math.floor(baseCost * Math.pow(1.42, currentLevel));
}

export function getFleetCost(biz: FleetBusiness, count: number): number {
  return Math.floor(biz.baseCost * Math.pow(biz.costGrowth, count));
}

export function getPrestigeMultiplier(save: PersistentSave): number {
  const badgeMult = 1 + save.prestigeBadges * 0.25;
  const surgeCount = save.fleetCounts['surge-meter'] || 0;
  const surgeMult = 1 + surgeCount * 0.15;
  return badgeMult * surgeMult;
}

export function getTotalPassiveCps(save: PersistentSave): number {
  let baseCps = 0;
  for (const autoId of save.unlockedAutos) {
    const spec = AUTOS.find((a) => a.id === autoId);
    if (spec) baseCps += spec.passiveCps;
  }
  for (const biz of FLEET_BUSINESSES) {
    const count = save.fleetCounts[biz.id] || 0;
    baseCps += biz.baseCps * count;
  }
  return Math.floor(baseCps * getPrestigeMultiplier(save));
}

export function getPrestigeRequirement(currentBadges: number): number {
  return Math.floor(50000 * Math.pow(3.2, currentBadges));
}

export function createDailyChallenges(): DailyChallenge[] {
  return [
    {
      id: 'ch-laps',
      label: 'Complete 3 laps',
      target: 3,
      progress: 0,
      reward: 350,
      claimed: false,
      type: 'laps',
    },
    {
      id: 'ch-coins',
      label: 'Collect 30 road coins',
      target: 30,
      progress: 0,
      reward: 450,
      claimed: false,
      type: 'coins',
    },
    {
      id: 'ch-drift',
      label: 'Drift 300m total',
      target: 300,
      progress: 0,
      reward: 500,
      claimed: false,
      type: 'drift',
    },
  ];
}

export function getTodayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export function createInitialSave(): PersistentSave {
  return {
    coins: 150,
    totalCoinsEarned: 150,
    totalMetersDriven: 0,
    racesCompleted: 0,
    winStreak: 0,
    prestigeBadges: 0,
    selectedAutoId: 'dilli-classic',
    unlockedAutos: ['dilli-classic'],
    upgrades: {
      'dilli-classic': { engine: 0, gearbox: 0, tyres: 0, nitro: 0 },
    },
    fleetCounts: {
      'chai-pitstop': 0,
      'metro-stand': 0,
      'night-fleet': 0,
      'surge-meter': 0,
      'ncr-hub': 0,
    },
    bestLaps: {},
    raceSettings: {
      city: 'gurugram',
      trackId: 'ggn-cyber',
      laps: 3,
      difficulty: 'normal',
      time: 'sunset',
      weather: 'clear',
    },
    autoPilot: false,
    musicVolume: 0.4,
    sfxVolume: 0.7,
    lastSavedAt: Date.now(),
    challenges: createDailyChallenges(),
    challengeDate: getTodayKey(),
  };
}

export function formatCoins(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 10_000) return `${(n / 1_000).toFixed(1)}K`;
  return Math.floor(n).toLocaleString('en-US');
}

export function formatTimeMs(ms: number | null): string {
  if (ms === null || !isFinite(ms)) return '--:--.--';
  const totalSeconds = Math.max(0, ms / 1000);
  const mins = Math.floor(totalSeconds / 60);
  const secs = Math.floor(totalSeconds % 60);
  const hundredths = Math.floor((ms % 1000) / 10);
  return `${mins}:${secs.toString().padStart(2, '0')}.${hundredths.toString().padStart(2, '0')}`;
}
