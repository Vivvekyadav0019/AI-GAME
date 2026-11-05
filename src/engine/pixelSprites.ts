import { AutoPalette, TrackSpec } from '../types/game';

/**
 * Helper to draw a crisp pixel rectangle (rounded to integer coordinates)
 */
export function px(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string
) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

/**
 * Draws a 16-bit pixel-art Indian Auto-Rickshaw (rear-view) centered at (cx, bottomY)
 * Base dimensions at scale=1: ~36px wide, ~34px tall
 */
export function drawPixelAuto(
  ctx: CanvasRenderingContext2D,
  cx: number,
  bottomY: number,
  scale: number,
  palette: AutoPalette,
  options: {
    steerLean?: number; // -1 to 1
    wheelPhase?: number;
    isNitro?: boolean;
    isBraking?: boolean;
    isDrifting?: boolean;
    isNight?: boolean;
  } = {}
) {
  const s = Math.max(0.15, scale);
  const lean = (options.steerLean || 0) * 2.5 * s;
  const bounce = Math.sin((options.wheelPhase || 0) * 1.5) * 0.6 * s;
  const x = cx + lean;
  const y = bottomY + bounce;

  const w = (v: number) => v * s;

  // Ground shadow
  ctx.fillStyle = 'rgba(9, 5, 20, 0.55)';
  ctx.fillRect(
    Math.round(x - w(17)),
    Math.round(bottomY - w(2)),
    Math.round(w(34)),
    Math.round(w(4))
  );

  // Night headlight cone on road ahead
  if (options.isNight) {
    ctx.fillStyle = 'rgba(254, 240, 138, 0.16)';
    ctx.beginPath();
    ctx.moveTo(x - w(8), y - w(10));
    ctx.lineTo(x + w(8), y - w(10));
    ctx.lineTo(x + w(24), y - w(42));
    ctx.lineTo(x - w(24), y - w(42));
    ctx.closePath();
    ctx.fill();
  }

  // Center front wheel peek
  px(ctx, x - w(3), y - w(6), w(6), w(6), '#18181b');

  // Left & Right rear wheels
  const treadOffset = Math.floor((options.wheelPhase || 0) * 2) % 2;
  [-15, 10].forEach((wx) => {
    px(ctx, x + w(wx), y - w(11), w(5), w(11), '#090514');
    px(ctx, x + w(wx + 1), y - w(10), w(3), w(9), '#27272a');
    // Animated tyre tread
    px(
      ctx,
      x + w(wx + 1),
      y - w(9 - treadOffset * 3),
      w(3),
      w(2),
      '#71717a'
    );
  });

  // Exhaust pipe (bottom left)
  px(ctx, x - w(11), y - w(5), w(3), w(3), '#52525b');
  px(ctx, x - w(10), y - w(4), w(1.5), w(1.5), '#090514');

  // Drift smoke pixels
  if (options.isDrifting && s > 0.5) {
    const smokeOff = ((options.wheelPhase || 0) * 5) % 6;
    px(ctx, x - w(18 + smokeOff), y - w(4), w(4), w(4), '#e2e8f0');
    px(ctx, x + w(14 + smokeOff), y - w(5), w(4), w(4), '#cbd5e1');
  }

  // Main lower body (outer dark outline)
  px(ctx, x - w(14), y - w(18), w(28), w(14), '#090514');
  // Lower body fill
  px(ctx, x - w(13), y - w(17), w(26), w(12), palette.body);
  // Side & bottom shading
  px(ctx, x - w(13), y - w(8), w(26), w(3), palette.bodyDark);
  px(ctx, x + w(10), y - w(17), w(3), w(12), palette.bodyDark);
  // Decorative racing stripe & trim
  px(ctx, x - w(13), y - w(13), w(26), w(2), palette.stripe);
  px(ctx, x - w(13), y - w(17), w(26), w(1), '#ffffff44');

  // Side mirrors
  px(ctx, x - w(16), y - w(24), w(2), w(3), '#090514');
  px(ctx, x - w(15.5), y - w(23.5), w(1), w(2), '#94a3b8');
  px(ctx, x + w(14), y - w(24), w(2), w(3), '#090514');
  px(ctx, x + w(14.5), y - w(23.5), w(1), w(2), '#94a3b8');

  // Canopy / Roof (stepped pixel arch)
  px(ctx, x - w(13), y - w(31), w(26), w(14), '#090514');
  px(ctx, x - w(11), y - w(33), w(22), w(3), '#090514');
  px(ctx, x - w(12), y - w(30), w(24), w(13), palette.canopy);
  px(ctx, x - w(10), y - w(32), w(20), w(3), palette.canopy);
  // Canopy roof highlight & side shadow
  px(ctx, x - w(8), y - w(31), w(16), w(2), '#fef9c3');
  px(ctx, x + w(8), y - w(29), w(4), w(12), palette.canopyDark);

  // Rear window + driver silhouette
  px(ctx, x - w(8), y - w(27), w(16), w(8), '#0f172a');
  px(ctx, x - w(7), y - w(26), w(14), w(6), '#1e293b');
  // Window glare pixel
  px(ctx, x - w(6), y - w(25), w(2), w(2), '#38bdf8');
  // Driver head & shoulders
  px(ctx, x - w(2), y - w(25), w(4), w(3), '#d97706');
  px(ctx, x - w(4), y - w(22), w(8), w(2), '#475569');

  // Tail lights
  const tailColor = options.isBraking ? '#ff2a55' : '#dc2626';
  px(ctx, x - w(12), y - w(15), w(3), w(3), tailColor);
  px(ctx, x + w(9), y - w(15), w(3), w(3), tailColor);
  if (options.isBraking) {
    px(ctx, x - w(11), y - w(14), w(2), w(2), '#fda4af');
    px(ctx, x + w(10), y - w(14), w(2), w(2), '#fda4af');
  }

  // License plate
  px(ctx, x - w(4), y - w(11), w(8), w(3), '#fef08a');
  px(ctx, x - w(3), y - w(10), w(6), w(1), '#090514');

  // Rear bumper
  px(ctx, x - w(14), y - w(6), w(28), w(2), palette.bumper);

  // N2O Nitro flames!
  if (options.isNitro) {
    const flicker = Math.floor((options.wheelPhase || 0) * 7) % 2;
    const flameH = (6 + flicker * 3) * s;
    px(ctx, x - w(8), y - w(4), w(4), flameH, '#06b6d4');
    px(ctx, x - w(7), y - w(4), w(2), flameH * 0.65, '#fef08a');
    px(ctx, x + w(4), y - w(4), w(4), flameH, '#06b6d4');
    px(ctx, x + w(5), y - w(4), w(2), flameH * 0.65, '#fef08a');
  }
}

/**
 * Draws a spinning 16-bit Gold Rush Coin
 */
export function drawPixelCoin(
  ctx: CanvasRenderingContext2D,
  cx: number,
  bottomY: number,
  scale: number,
  phase: number
) {
  const s = Math.max(0.15, scale);
  const spin = Math.abs(Math.cos(phase * 3));
  const w = Math.max(2, Math.round(10 * spin * s));
  const h = Math.max(3, Math.round(12 * s));
  const x = Math.round(cx - w / 2);
  const y = Math.round(bottomY - h - 4 * s);

  ctx.fillStyle = '#090514';
  ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
  ctx.fillStyle = '#facc15';
  ctx.fillRect(x, y, w, h);
  if (w >= 4) {
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(x + 1, y + 1, Math.max(1, Math.floor(w / 3)), h - 2);
  }
}

/**
 * Draws a glowing cyan N2O Nitro Canister
 */
export function drawPixelNitro(
  ctx: CanvasRenderingContext2D,
  cx: number,
  bottomY: number,
  scale: number
) {
  const s = Math.max(0.15, scale);
  const w = Math.max(3, Math.round(10 * s));
  const h = Math.max(4, Math.round(14 * s));
  const x = Math.round(cx - w / 2);
  const y = Math.round(bottomY - h - 3 * s);

  px(ctx, x - 1, y - 1, w + 2, h + 2, '#090514');
  px(ctx, x, y, w, h, '#06b6d4');
  px(ctx, x + 1, y + 2, Math.max(1, w - 2), Math.max(1, Math.floor(h * 0.3)), '#cffafe');
  px(ctx, x + Math.floor(w * 0.25), y - 2, Math.max(2, Math.floor(w * 0.5)), 2, '#facc15');
}

/**
 * Draws pixel-art roadside landmarks for Gurugram & Delhi
 */
export function drawLandmark(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  type: TrackSpec['landmarkType'],
  isRightSide: boolean
) {
  if (scale < 0.08) return;
  const s = scale;

  switch (type) {
    case 'cyber': {
      // Glass office tower with lit cyan/amber windows
      const w = 38 * s;
      const h = 86 * s;
      const left = isRightSide ? x : x - w;
      px(ctx, left, y - h, w, h, '#1e293b');
      px(ctx, left + 2 * s, y - h + 2 * s, w - 4 * s, h - 2 * s, '#0f172a');
      // Lit window grid
      const rows = 7;
      const cols = 3;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const lit = (r + c) % 2 === 0;
          px(
            ctx,
            left + (5 + c * 10) * s,
            y - h + (6 + r * 11) * s,
            6 * s,
            6 * s,
            lit ? '#38bdf8' : '#334155'
          );
        }
      }
      break;
    }
    case 'metro': {
      // Yellow Line Metro concrete pillar + overhead beam
      const w = 14 * s;
      const h = 68 * s;
      const left = isRightSide ? x : x - w;
      px(ctx, left, y - h, w, h, '#475569');
      px(ctx, left + 2 * s, y - h, 4 * s, h, '#64748b');
      // Overhead viaduct beam
      const beamW = 54 * s;
      const beamLeft = isRightSide ? x - 10 * s : x - beamW + 10 * s;
      px(ctx, beamLeft, y - h - 10 * s, beamW, 12 * s, '#334155');
      px(ctx, beamLeft, y - h - 2 * s, beamW, 3 * s, '#facc15'); // Yellow Line stripe!
      break;
    }
    case 'indiagate':
    case 'parliament': {
      // Sandstone monument / arch
      const w = 48 * s;
      const h = 64 * s;
      const left = isRightSide ? x : x - w;
      px(ctx, left, y - h, w, h, '#d97706');
      px(ctx, left + 4 * s, y - h + 4 * s, w - 8 * s, h - 4 * s, '#f59e0b');
      // Central arch cutout
      px(ctx, left + 16 * s, y - 34 * s, 16 * s, 34 * s, '#1e1b4b');
      px(ctx, left, y - h, w, 6 * s, '#b45309');
      break;
    }
    case 'redfort': {
      // Red sandstone Mughal rampart & turret
      const w = 52 * s;
      const h = 58 * s;
      const left = isRightSide ? x : x - w;
      px(ctx, left, y - h, w, h, '#991b1b');
      px(ctx, left + 3 * s, y - h + 6 * s, w - 6 * s, h - 6 * s, '#b91c1c');
      // Battlements
      for (let i = 0; i < 4; i++) {
        px(ctx, left + (2 + i * 13) * s, y - h - 5 * s, 8 * s, 5 * s, '#dc2626');
      }
      break;
    }
    default: {
      // Palm tree / Roadside Chai Stall
      const trunkW = 5 * s;
      const trunkH = 44 * s;
      const left = isRightSide ? x : x - trunkW;
      px(ctx, left, y - trunkH, trunkW, trunkH, '#78350f');
      // Pixel palm fronds
      px(ctx, left - 12 * s, y - trunkH - 4 * s, 28 * s, 6 * s, '#16a34a');
      px(ctx, left - 8 * s, y - trunkH - 9 * s, 20 * s, 5 * s, '#22c55e');
      break;
    }
  }
}

/**
 * Draws varied 16-bit pixel-art city buildings & shops along the sides of the road
 */
export function drawRoadsideBuilding(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  variant: number,
  isRightSide: boolean,
  isNight: boolean
) {
  if (scale < 0.06) return;
  const s = scale;

  const palettes = [
    { wall: '#334155', shade: '#1e293b', roof: '#475569', awning: '#ef4444' },
    { wall: '#475569', shade: '#334155', roof: '#64748b', awning: '#f59e0b' },
    { wall: '#3f3f46', shade: '#27272a', roof: '#52525b', awning: '#06b6d4' },
    { wall: '#4c1d95', shade: '#2e1065', roof: '#6d28d9', awning: '#ec4899' },
  ];
  const pal = palettes[variant % palettes.length];

  const w = (34 + (variant % 3) * 8) * s;
  const h = (52 + (variant % 4) * 14) * s;
  const left = isRightSide ? x : x - w;

  // Main building facade
  px(ctx, left, y - h, w, h, pal.wall);
  // Side depth shadow
  const sideW = Math.max(2, 6 * s);
  px(ctx, isRightSide ? left + w - sideW : left, y - h, sideW, h, pal.shade);
  // Roof parapet
  px(ctx, left - 1 * s, y - h - 3 * s, w + 2 * s, 4 * s, pal.roof);

  // Ground-floor shop awning
  px(ctx, left + 2 * s, y - 16 * s, w - 4 * s, 4 * s, pal.awning);
  px(ctx, left + 4 * s, y - 12 * s, w - 8 * s, 12 * s, isNight ? '#fef08a' : '#0f172a');

  // Upper floor windows
  const floors = Math.floor((h - 22 * s) / (11 * s));
  const cols = 3;
  for (let r = 0; r < floors; r++) {
    for (let c = 0; c < cols; c++) {
      const lit = isNight ? (r + c + variant) % 2 === 0 : (r + c) % 3 === 0;
      const winColor = lit ? (isNight ? '#facc15' : '#38bdf8') : '#0f172a';
      px(
        ctx,
        left + (5 + c * 9) * s,
        y - h + (6 + r * 11) * s,
        5 * s,
        6 * s,
        winColor
      );
    }
  }
}

