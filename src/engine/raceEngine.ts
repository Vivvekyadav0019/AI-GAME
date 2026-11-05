import { soundEngine } from '../audio/soundEngine';
import { AUTOS, TRACKS } from '../data/gameData';
import {
  AutoPalette,
  AutoSpec,
  LiveRaceTelemetry,
  RaceResultSummary,
  RaceSettings,
  TrackSpec,
  UpgradeState,
} from '../types/game';
import {
  drawLandmark,
  drawPixelAuto,
  drawPixelCoin,
  drawPixelNitro,
  drawRoadsideBuilding,
  px,
} from './pixelSprites';

const PIXEL_W = 640;
const PIXEL_H = 360;
const SEGMENT_LENGTH = 10;
const DRAW_DISTANCE = 110;
const CAMERA_HEIGHT = 18;
const CAMERA_DEPTH = 0.84;

interface RoadSegment {
  index: number;
  curve: number;
  y: number;
  landmarkLeft: boolean;
  landmarkRight: boolean;
}

interface RoadPickup {
  id: number;
  segIndex: number;
  x: number; // -0.75 to 0.75
  type: 'coin' | 'nitro';
  collected: boolean;
}

interface RivalRacer {
  id: number;
  name: string;
  palette: AutoPalette;
  z: number; // total distance along track
  x: number; // -0.75 to 0.75
  targetX: number;
  speed: number;
  maxSpeed: number;
}

export interface InputState {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  drift: boolean;
  nitro: boolean;
}

export class RaceEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private offscreen: HTMLCanvasElement;
  private offCtx: CanvasRenderingContext2D;

  private rafId: number | null = null;
  private lastTime = 0;

  private track: TrackSpec = TRACKS[0];
  private settings: RaceSettings;
  private playerAuto: AutoSpec = AUTOS[0];
  private playerUpgrades: UpgradeState = { engine: 0, gearbox: 0, tyres: 0, nitro: 0 };
  private autoPilot = false;
  private prestigeMultiplier = 1;

  private segments: RoadSegment[] = [];
  private pickups: RoadPickup[] = [];
  private rivals: RivalRacer[] = [];

  // Player state
  private playerZ = 0;
  private playerX = 0; // -1 to 1 (road is -1 to 1)
  private playerSpeed = 0; // world units/sec
  private steerLean = 0;
  private wheelPhase = 0;
  private nitroCharge = 60; // 0 to 100
  private isNitroActive = false;
  private isDrifting = false;
  private driftMeters = 0;
  private raceCoins = 0;
  private nitroUsedCount = 0;

  private currentLap = 1;
  private lapStartTime = 0;
  private raceStartTime = 0;
  private bestLapMs: number | null = null;
  private raceFinished = false;
  private paused = false;

  private input: InputState = {
    left: false,
    right: false,
    up: false,
    down: false,
    drift: false,
    nitro: false,
  };

  private lastTelemetryTime = 0;
  private onTelemetry: (t: LiveRaceTelemetry) => void;
  private onCoinPickup: (coins: number) => void;
  private onLapOrFinish: (info: {
    lapCompleted: number;
    lapTimeMs: number;
    finished: boolean;
    summary?: RaceResultSummary;
    driftMeters: number;
    nitroUsed: number;
  }) => void;

  constructor(
    canvas: HTMLCanvasElement,
    initialSettings: RaceSettings,
    callbacks: {
      onTelemetry: (t: LiveRaceTelemetry) => void;
      onCoinPickup: (coins: number) => void;
      onLapOrFinish: (info: {
        lapCompleted: number;
        lapTimeMs: number;
        finished: boolean;
        summary?: RaceResultSummary;
        driftMeters: number;
        nitroUsed: number;
      }) => void;
    }
  ) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Could not initialize 2D context');
    this.ctx = context;

    this.offscreen = document.createElement('canvas');
    this.offscreen.width = PIXEL_W;
    this.offscreen.height = PIXEL_H;
    const offContext = this.offscreen.getContext('2d');
    if (!offContext) throw new Error('Could not initialize offscreen 2D context');
    this.offCtx = offContext;

    this.settings = initialSettings;
    this.onTelemetry = callbacks.onTelemetry;
    this.onCoinPickup = callbacks.onCoinPickup;
    this.onLapOrFinish = callbacks.onLapOrFinish;

    this.setupRace(initialSettings, AUTOS[0], { engine: 0, gearbox: 0, tyres: 0, nitro: 0 }, false, 1);
  }

  public updateConfig(
    settings: RaceSettings,
    auto: AutoSpec,
    upgrades: UpgradeState,
    autoPilot: boolean,
    prestigeMultiplier: number,
    resetTrack = false
  ) {
    const trackChanged = this.settings.trackId !== settings.trackId;
    this.settings = { ...settings };
    this.playerAuto = auto;
    this.playerUpgrades = { ...upgrades };
    this.autoPilot = autoPilot;
    this.prestigeMultiplier = prestigeMultiplier;

    if (resetTrack || trackChanged) {
      this.setupRace(settings, auto, upgrades, autoPilot, prestigeMultiplier);
    }
  }

  public setAutoPilot(enabled: boolean) {
    this.autoPilot = enabled;
  }

  public setPaused(paused: boolean) {
    this.paused = paused;
  }

  public setInput(partial: Partial<InputState>) {
    Object.assign(this.input, partial);
  }

  public triggerNitro() {
    if (this.nitroCharge >= 25 && !this.isNitroActive) {
      this.isNitroActive = true;
      this.nitroUsedCount++;
      soundEngine.playNitro();
    }
  }

  public setupRace(
    settings: RaceSettings,
    auto: AutoSpec,
    upgrades: UpgradeState,
    autoPilot: boolean,
    prestigeMultiplier: number
  ) {
    this.settings = { ...settings };
    this.playerAuto = auto;
    this.playerUpgrades = { ...upgrades };
    this.autoPilot = autoPilot;
    this.prestigeMultiplier = prestigeMultiplier;

    this.track = TRACKS.find((t) => t.id === settings.trackId) || TRACKS[0];
    const totalSegs = this.track.lengthSegments;

    // Build deterministic road segments with curves & gentle hills
    this.segments = [];
    const seed = this.track.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    for (let i = 0; i < totalSegs; i++) {
      const t = i / totalSegs;
      const curve =
        Math.sin(t * Math.PI * 4 + seed * 0.1) * 1.4 +
        Math.cos(t * Math.PI * 8 + seed * 0.2) * 0.7;
      const y =
        Math.sin(t * Math.PI * 6 + seed * 0.15) * 18 +
        Math.cos(t * Math.PI * 2) * 10;

      this.segments.push({
        index: i,
        curve: i < 25 || i > totalSegs - 25 ? 0 : curve, // straight start/finish
        y,
        landmarkLeft: i % 18 === 0,
        landmarkRight: i % 18 === 9,
      });
    }

    // Build pickups (coins & N2O canisters)
    this.pickups = [];
    let pid = 1;
    for (let i = 30; i < totalSegs - 20; i += 14) {
      const isNitro = i % 56 === 0;
      const lane = ((i * 7 + seed) % 5 - 2) * 0.28;
      this.pickups.push({
        id: pid++,
        segIndex: i,
        x: lane,
        type: isNitro ? 'nitro' : 'coin',
        collected: false,
      });
    }

    // Build 7 rival auto-rickshaws
    const diffMult =
      settings.difficulty === 'easy' ? 0.84 : settings.difficulty === 'hard' ? 1.03 : 0.94;
    const playerMaxWorldSpeed = this.getPlayerMaxWorldSpeed();

    this.rivals = [];
    const otherAutos = AUTOS.filter((a) => a.id !== auto.id);
    for (let i = 0; i < 7; i++) {
      const rivalSpec = otherAutos[i % otherAutos.length];
      const laneX = (i % 2 === 0 ? -0.42 : 0.42) + ((i - 3) * 0.06);
      const maxSpd = playerMaxWorldSpeed * (diffMult - i * 0.018);
      this.rivals.push({
        id: i + 1,
        name: rivalSpec.name,
        palette: rivalSpec.palette,
        z: (i + 1) * 28 * SEGMENT_LENGTH,
        x: Math.max(-0.7, Math.min(0.7, laneX)),
        targetX: laneX,
        speed: maxSpd * 0.75,
        maxSpeed: maxSpd,
      });
    }

    // Reset player state
    this.playerZ = 0;
    this.playerX = 0;
    this.playerSpeed = 0;
    this.steerLean = 0;
    this.nitroCharge = 65;
    this.isNitroActive = false;
    this.isDrifting = false;
    this.driftMeters = 0;
    this.raceCoins = 0;
    this.nitroUsedCount = 0;
    this.currentLap = 1;
    const now = performance.now();
    this.lapStartTime = now;
    this.raceStartTime = now;
    this.bestLapMs = null;
    this.raceFinished = false;
  }

  private getPlayerMaxWorldSpeed(): number {
    const topKmh = this.playerAuto.baseSpeed + this.playerUpgrades.engine * 4;
    return topKmh * 2.2; // world units/sec
  }

  public start() {
    if (this.rafId !== null) return;
    this.lastTime = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.05, Math.max(0.001, (now - this.lastTime) / 1000));
      this.lastTime = now;
      if (!this.paused) {
        this.update(dt, now);
      }
      this.render(now);
      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }

  public stop() {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  private update(dt: number, now: number) {
    const trackLen = this.segments.length * SEGMENT_LENGTH;
    const baseMaxSpeed = this.getPlayerMaxWorldSpeed();
    const accelFactor = 1 + this.playerUpgrades.gearbox * 0.08;
    const gripFactor = 1 + this.playerUpgrades.tyres * 0.07;
    const nitroBonus = 1 + this.playerUpgrades.nitro * 0.05;

    // Determine effective controls (Manual vs Idle Auto-Pilot)
    let steerInput = 0;
    let throttle = false;
    let braking = false;
    let wantDrift = false;

    if (this.autoPilot || this.raceFinished) {
      throttle = true;
      const currentSegIdx = Math.floor(this.playerZ / SEGMENT_LENGTH) % this.segments.length;
      const lookAheadSeg = this.segments[(currentSegIdx + 12) % this.segments.length];

      // Aim for upcoming pickup or center-ish lane while avoiding rivals
      let desiredX = -lookAheadSeg.curve * 0.25;
      const nearPickup = this.pickups.find(
        (p) =>
          !p.collected &&
          Math.abs(p.segIndex - currentSegIdx) < 22 &&
          p.segIndex > currentSegIdx
      );
      if (nearPickup) {
        desiredX = nearPickup.x;
      }

      // Avoid close rival directly ahead
      for (const r of this.rivals) {
        const dz = (r.z % trackLen) - (this.playerZ % trackLen);
        if (dz > 0 && dz < 90 && Math.abs(r.x - this.playerX) < 0.36) {
          desiredX = this.playerX > 0 ? -0.45 : 0.45;
        }
      }

      const diffX = desiredX - this.playerX;
      steerInput = Math.max(-1, Math.min(1, diffX * 3.2));

      // Auto-trigger nitro on straightaways
      if (this.nitroCharge >= 95 && Math.abs(lookAheadSeg.curve) < 0.5 && !this.isNitroActive) {
        this.isNitroActive = true;
        this.nitroUsedCount++;
      }
    } else {
      if (this.input.left) steerInput -= 1;
      if (this.input.right) steerInput += 1;
      throttle = this.input.up;
      braking = this.input.down;
      wantDrift = this.input.drift && Math.abs(steerInput) > 0.1 && this.playerSpeed > baseMaxSpeed * 0.45;
      if (this.input.nitro && this.nitroCharge >= 25 && !this.isNitroActive) {
        this.isNitroActive = true;
        this.nitroUsedCount++;
        soundEngine.playNitro();
      }
    }

    // Nitro consumption & recharge
    if (this.isNitroActive) {
      const drainRate = 28 / (1 + this.playerUpgrades.nitro * 0.08);
      this.nitroCharge = Math.max(0, this.nitroCharge - drainRate * dt);
      if (this.nitroCharge <= 0) {
        this.isNitroActive = false;
      }
    } else {
      const rechargeRate = (this.isDrifting ? 14 : 4.5) * (1 + this.playerUpgrades.nitro * 0.08);
      this.nitroCharge = Math.min(100, this.nitroCharge + rechargeRate * dt);
    }

    // Speed & acceleration
    const effectiveMax = this.isNitroActive ? baseMaxSpeed * 1.32 * nitroBonus : baseMaxSpeed;
    const accelRate = (140 + this.playerAuto.baseAccel * 18) * accelFactor;

    if (throttle) {
      this.playerSpeed += accelRate * dt;
    } else if (braking) {
      this.playerSpeed -= accelRate * 1.9 * dt;
    } else {
      this.playerSpeed -= accelRate * 0.45 * dt;
    }

    // Off-road grass slowdown
    if (Math.abs(this.playerX) > 1.02) {
      this.playerSpeed -= accelRate * 1.15 * dt;
    }

    this.playerSpeed = Math.max(0, Math.min(effectiveMax, this.playerSpeed));

    // Steering & centrifugal force (clamped strictly inside road boundaries)
    const currentSegIdx = Math.floor(this.playerZ / SEGMENT_LENGTH) % this.segments.length;
    const currentSeg = this.segments[currentSegIdx];
    const speedRatio = this.playerSpeed / baseMaxSpeed;

    this.isDrifting = wantDrift && this.playerSpeed > 15;
    const steerPower = (1.45 + this.playerAuto.baseGrip * 0.09) * gripFactor * (this.isDrifting ? 1.35 : 1);
    this.playerX += steerInput * steerPower * speedRatio * dt;
    // Centrifugal pull on curves
    this.playerX -= currentSeg.curve * 0.42 * speedRatio * speedRatio * dt;
    this.playerX = Math.max(-0.86, Math.min(0.86, this.playerX));

    this.steerLean += (steerInput - this.steerLean) * Math.min(1, dt * 12);

    if (this.isDrifting) {
      this.driftMeters += (this.playerSpeed * dt) / 3.5;
    }

    // Advance player Z
    const prevZ = this.playerZ;
    this.playerZ += this.playerSpeed * dt;
    this.wheelPhase += (this.playerSpeed * dt) * 0.08;

    // Check pickups
    const newSegIdx = Math.floor(this.playerZ / SEGMENT_LENGTH) % this.segments.length;
    for (const p of this.pickups) {
      if (!p.collected && Math.abs(p.segIndex - newSegIdx) <= 2 && Math.abs(p.x - this.playerX) < 0.28) {
        p.collected = true;
        if (p.type === 'coin') {
          const coinVal = Math.max(1, Math.round(5 * this.prestigeMultiplier));
          this.raceCoins += coinVal;
          soundEngine.playCoin();
          this.onCoinPickup(coinVal);
        } else {
          this.nitroCharge = Math.min(100, this.nitroCharge + 45);
          soundEngine.playNitro();
        }
      }
    }

    // Respawn pickups on new lap
    if (Math.floor(this.playerZ / trackLen) > Math.floor(prevZ / trackLen)) {
      for (const p of this.pickups) {
        p.collected = false;
      }

      if (!this.raceFinished) {
        const lapTime = now - this.lapStartTime;
        this.lapStartTime = now;
        const isNewBest = this.bestLapMs === null || lapTime < this.bestLapMs;
        if (isNewBest) {
          this.bestLapMs = lapTime;
        }

        const completedLap = this.currentLap;
        if (completedLap >= this.settings.laps) {
          this.raceFinished = true;
          soundEngine.playFanfare();
          const pos = this.computePlayerPosition();
          const posBonus = Math.round(
            Math.max(50, (9 - pos) * 85) * this.prestigeMultiplier
          );
          const driftBonus = Math.round(this.driftMeters * 0.4 * this.prestigeMultiplier);
          const totalEarned = this.raceCoins + posBonus + driftBonus;

          this.onLapOrFinish({
            lapCompleted: completedLap,
            lapTimeMs: lapTime,
            finished: true,
            driftMeters: Math.round(this.driftMeters),
            nitroUsed: this.nitroUsedCount,
            summary: {
              position: pos,
              totalRacers: 8,
              totalTimeMs: now - this.raceStartTime,
              bestLapMs: this.bestLapMs,
              raceCoins: this.raceCoins,
              positionBonus: posBonus,
              driftBonus,
              prestigeMultiplier: this.prestigeMultiplier,
              totalEarned,
              isNewBestLap: isNewBest,
            },
          });
        } else {
          this.currentLap++;
          soundEngine.playUpgrade();
          this.onLapOrFinish({
            lapCompleted: completedLap,
            lapTimeMs: lapTime,
            finished: false,
            driftMeters: Math.round(this.driftMeters),
            nitroUsed: this.nitroUsedCount,
          });
        }
      }
    }

    // Update rivals
    for (const r of this.rivals) {
      // Gentle rubber-banding so races stay exciting
      const distDiff = this.playerZ - r.z;
      let targetSpd = r.maxSpeed;
      if (distDiff > 450) targetSpd *= 1.12;
      else if (distDiff < -450) targetSpd *= 0.9;

      r.speed += (targetSpd - r.speed) * Math.min(1, dt * 2.5);
      r.z += r.speed * dt;

      // Occasional lane weave (kept strictly on road)
      if (Math.random() < dt * 0.4) {
        r.targetX = (Math.random() - 0.5) * 1.4;
      }
      r.x += (r.targetX - r.x) * Math.min(1, dt * 1.8);
      r.x = Math.max(-0.82, Math.min(0.82, r.x));

      // Simple collision bump with player
      const relZ = ((r.z - this.playerZ) % trackLen + trackLen) % trackLen;
      if (relZ < 14 && Math.abs(r.x - this.playerX) < 0.24) {
        this.playerSpeed *= 0.88;
        this.playerX = Math.max(-0.86, Math.min(0.86, this.playerX + (this.playerX < r.x ? -0.12 : 0.12)));
      }
    }

    // Emit HUD telemetry at ~15fps
    if (now - this.lastTelemetryTime > 65) {
      this.lastTelemetryTime = now;
      const pos = this.computePlayerPosition();
      const speedKmh = Math.round(this.playerSpeed / 2.2);
      const progressRatio = (this.playerZ % trackLen) / trackLen;

      const racerPositions = [
        ...this.rivals.map((r) => ({
          x: r.x,
          zRatio: (r.z % trackLen) / trackLen,
          isPlayer: false,
          color: r.palette.canopy,
        })),
        {
          x: this.playerX,
          zRatio: progressRatio,
          isPlayer: true,
          color: '#ff4f8b',
        },
      ];

      this.onTelemetry({
        position: pos,
        totalRacers: 8,
        lap: Math.min(this.currentLap, this.settings.laps),
        totalLaps: this.settings.laps,
        speedKmh,
        nitroCharge: Math.round(this.nitroCharge),
        isNitroActive: this.isNitroActive,
        isDrifting: this.isDrifting,
        driftMeters: Math.round(this.driftMeters),
        raceCoins: this.raceCoins,
        elapsedMs: now - this.raceStartTime,
        bestLapMs: this.bestLapMs,
        progressRatio,
        racerPositions,
      });
    }
  }

  private computePlayerPosition(): number {
    let ahead = 0;
    for (const r of this.rivals) {
      if (r.z > this.playerZ) ahead++;
    }
    return ahead + 1;
  }

  private render(now: number) {
    const ctx = this.offCtx;
    const horizonY = Math.floor(PIXEL_H * 0.44);

    // 1. Sky & Backdrop
    this.renderSky(ctx, horizonY, now);

    // 2. Pseudo-3D Road Projection
    const baseSegIndex = Math.floor(this.playerZ / SEGMENT_LENGTH);
    const basePercent = (this.playerZ % SEGMENT_LENGTH) / SEGMENT_LENGTH;
    const totalSegs = this.segments.length;
    const trackLen = totalSegs * SEGMENT_LENGTH;

    const baseSeg = this.segments[baseSegIndex % totalSegs];
    const nextSeg = this.segments[(baseSegIndex + 1) % totalSegs];
    const playerY = baseSeg.y + (nextSeg.y - baseSeg.y) * basePercent;

    let x = 0;
    let dx = -(baseSeg.curve * basePercent);
    let maxY = PIXEL_H;

    // Previous (closer) segment screen coordinates for smooth perspective trapezoids
    let prevScreenX = Math.round(PIXEL_W / 2 - this.playerX * 220);
    let prevScreenY = PIXEL_H;
    let prevScreenW = Math.round(CAMERA_DEPTH * 12 * 245);

    const drawTrap = (
      x1: number,
      y1: number,
      w1: number,
      x2: number,
      y2: number,
      w2: number,
      color: string
    ) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(x1 - w1, y1);
      ctx.lineTo(x1 + w1, y1);
      ctx.lineTo(x2 + w2, y2);
      ctx.lineTo(x2 - w2, y2);
      ctx.closePath();
      ctx.fill();
    };

    const projectedSegs: {
      seg: RoadSegment;
      screenX: number;
      screenY: number;
      screenW: number;
      scale: number;
    }[] = [];

    for (let n = 0; n < DRAW_DISTANCE; n++) {
      const seg = this.segments[(baseSegIndex + n) % totalSegs];
      const camZ = (n - basePercent) * SEGMENT_LENGTH;
      if (camZ <= 0.5) continue;

      const scale = CAMERA_DEPTH / (camZ / 12);
      const screenX = Math.round(PIXEL_W / 2 + scale * (x - this.playerX * 220));
      const screenY = Math.round(horizonY + scale * (CAMERA_HEIGHT + playerY - seg.y));
      const screenW = Math.round(scale * 245);

      x += dx;
      dx += seg.curve * 0.38;

      if (screenY >= maxY) {
        prevScreenX = screenX;
        prevScreenY = screenY;
        prevScreenW = screenW;
        continue;
      }

      // Draw grass & road band from screenY down to prevScreenY using perspective trapezoids
      const isAlt = Math.floor(seg.index / 3) % 2 === 0;
      const isNight = this.settings.time === 'night';
      const grassColor = isNight
        ? isAlt
          ? '#0f172a'
          : '#1e1b4b'
        : isAlt
          ? '#15803d'
          : '#166534';
      const roadColor = isNight
        ? isAlt
          ? '#1e293b'
          : '#0f172a'
        : isAlt
          ? '#334155'
          : '#1e293b';
      const kerbColor = isAlt ? '#f97316' : '#f8fafc';

      // Grass & Sidewalk shoulder
      ctx.fillStyle = grassColor;
      ctx.fillRect(0, screenY, PIXEL_W, prevScreenY - screenY + 1);

      // Kerbs (trapezoid)
      const kerbW1 = Math.max(3, Math.round(prevScreenW * 0.08));
      const kerbW2 = Math.max(2, Math.round(screenW * 0.08));
      drawTrap(
        prevScreenX,
        prevScreenY,
        prevScreenW + kerbW1,
        screenX,
        screenY,
        screenW + kerbW2,
        kerbColor
      );

      // Road asphalt (trapezoid)
      drawTrap(prevScreenX, prevScreenY, prevScreenW, screenX, screenY, screenW, roadColor);

      // Center dashed lane line (trapezoid)
      if (isAlt && screenW > 12) {
        const laneW1 = Math.max(2, Math.round(prevScreenW * 0.025));
        const laneW2 = Math.max(1, Math.round(screenW * 0.025));
        drawTrap(prevScreenX, prevScreenY, laneW1, screenX, screenY, laneW2, '#facc15');
      }

      // Start/Finish checkered line
      if (seg.index < 3) {
        drawTrap(
          prevScreenX,
          prevScreenY,
          prevScreenW,
          screenX,
          screenY,
          screenW,
          seg.index % 2 === 0 ? '#ffffff' : '#090514'
        );
      }

      prevScreenX = screenX;
      prevScreenY = screenY;
      prevScreenW = screenW;
      maxY = screenY;
      projectedSegs.push({ seg, screenX, screenY, screenW, scale });
    }

    // 3. Draw Roadside Buildings, Landmarks, Pickups, and Rivals back-to-front
    const isNight = this.settings.time === 'night';
    for (let i = projectedSegs.length - 1; i >= 0; i--) {
      const p = projectedSegs[i];
      const spriteScale = p.scale * 0.65;

      // Continuous city buildings along both sides of the road
      if (p.seg.index % 6 === 0) {
        drawRoadsideBuilding(
          ctx,
          p.screenX - p.screenW - 22 * spriteScale,
          p.screenY,
          spriteScale * 1.15,
          p.seg.index,
          false,
          isNight
        );
      }
      if (p.seg.index % 6 === 3) {
        drawRoadsideBuilding(
          ctx,
          p.screenX + p.screenW + 22 * spriteScale,
          p.screenY,
          spriteScale * 1.15,
          p.seg.index + 1,
          true,
          isNight
        );
      }

      if (p.seg.landmarkLeft) {
        drawLandmark(
          ctx,
          p.screenX - p.screenW - 14 * spriteScale,
          p.screenY,
          spriteScale,
          this.track.landmarkType,
          false
        );
      }
      if (p.seg.landmarkRight) {
        drawLandmark(
          ctx,
          p.screenX + p.screenW + 14 * spriteScale,
          p.screenY,
          spriteScale,
          this.track.landmarkType,
          true
        );
      }

      // Pickups on this segment
      for (const item of this.pickups) {
        if (!item.collected && item.segIndex === p.seg.index) {
          const itemX = p.screenX + item.x * p.screenW;
          if (item.type === 'coin') {
            drawPixelCoin(ctx, itemX, p.screenY, spriteScale * 1.15, now * 0.005);
          } else {
            drawPixelNitro(ctx, itemX, p.screenY, spriteScale * 1.2);
          }
        }
      }

      // Rivals on this segment
      for (const r of this.rivals) {
        const rSegIdx = Math.floor((r.z % trackLen) / SEGMENT_LENGTH);
        if (rSegIdx === p.seg.index) {
          const rx = p.screenX + r.x * p.screenW;
          drawPixelAuto(ctx, rx, p.screenY, spriteScale * 1.05, r.palette, {
            wheelPhase: this.wheelPhase,
            isNight: this.settings.time === 'night',
          });
        }
      }
    }

    // 4. Draw Player Auto-Rickshaw in foreground
    drawPixelAuto(
      ctx,
      PIXEL_W / 2,
      PIXEL_H - 14,
      2.05,
      this.playerAuto.palette,
      {
        steerLean: this.steerLean,
        wheelPhase: this.wheelPhase,
        isNitro: this.isNitroActive,
        isBraking: this.input.down,
        isDrifting: this.isDrifting,
        isNight: this.settings.time === 'night',
      }
    );

    // 5. Weather overlay (Rain streaks)
    if (this.settings.weather === 'rain') {
      ctx.fillStyle = 'rgba(148, 163, 184, 0.45)';
      const t = Math.floor(now * 0.25);
      for (let i = 0; i < 42; i++) {
        const rx = (i * 53 + t * 2) % PIXEL_W;
        const ry = (i * 37 + t * 5) % PIXEL_H;
        ctx.fillRect(rx, ry, 1, 6);
      }
    }

    // 6. Blit crisp pixel buffer to full-screen canvas
    const cw = this.canvas.width;
    const ch = this.canvas.height;
    this.ctx.imageSmoothingEnabled = false;
    this.ctx.clearRect(0, 0, cw, ch);

    // Cover-fit 16:9 pixel buffer into viewport without distortion
    const targetRatio = PIXEL_W / PIXEL_H;
    const canvasRatio = cw / ch;
    let drawW = cw;
    let drawH = ch;
    let offsetX = 0;
    let offsetY = 0;

    if (canvasRatio > targetRatio) {
      drawW = cw;
      drawH = Math.ceil(cw / targetRatio);
      offsetY = Math.floor((ch - drawH) / 2);
    } else {
      drawH = ch;
      drawW = Math.ceil(ch * targetRatio);
      offsetX = Math.floor((cw - drawW) / 2);
    }

    this.ctx.drawImage(this.offscreen, offsetX, offsetY, drawW, drawH);
  }

  private renderSky(ctx: CanvasRenderingContext2D, horizonY: number, now: number) {
    const time = this.settings.time;
    const bands = 6;
    const bandH = Math.ceil(horizonY / bands);

    const palettes: Record<RaceSettings['time'], string[]> = {
      morning: ['#0284c7', '#0ea5e9', '#38bdf8', '#7dd3fc', '#fde047', '#fef08a'],
      sunset: ['#1e1b4b', '#4c1d95', '#831843', '#be185d', '#ea580c', '#facc15'],
      night: ['#05030a', '#090514', '#120b24', '#1b1233', '#27174a', '#311b5e'],
    };

    const cols = palettes[time];
    for (let i = 0; i < bands; i++) {
      ctx.fillStyle = cols[i];
      ctx.fillRect(0, i * bandH, PIXEL_W, bandH + 1);
    }

    // Stars at night
    if (time === 'night') {
      for (let i = 0; i < 24; i++) {
        const sx = (i * 47 + 13) % PIXEL_W;
        const sy = (i * 23 + 7) % (horizonY - 14);
        const blink = (Math.floor(now / 400) + i) % 3 !== 0;
        if (blink) {
          px(ctx, sx, sy, 1, 1, '#fef08a');
        }
      }
    }

    // Pixel Sun / Moon
    if (time === 'sunset') {
      px(ctx, PIXEL_W / 2 - 16, horizonY - 26, 32, 26, '#f97316');
      px(ctx, PIXEL_W / 2 - 12, horizonY - 22, 24, 22, '#facc15');
    } else if (time === 'morning') {
      px(ctx, PIXEL_W - 64, 18, 18, 18, '#fef08a');
    } else {
      px(ctx, PIXEL_W - 60, 16, 14, 14, '#e2e8f0');
    }

    // Distant City Skyline Silhouette
    const skylineColor = time === 'night' ? '#090514' : time === 'sunset' ? '#2e1065' : '#0369a1';
    for (let bx = 0; bx < PIXEL_W; bx += 18) {
      const bh = 10 + ((bx * 13) % 24);
      px(ctx, bx, horizonY - bh, 16, bh, skylineColor);
      if (time === 'night' && bx % 36 === 0) {
        px(ctx, bx + 4, horizonY - bh + 4, 2, 2, '#facc15');
        px(ctx, bx + 10, horizonY - bh + 9, 2, 2, '#38bdf8');
      }
    }
  }
}
