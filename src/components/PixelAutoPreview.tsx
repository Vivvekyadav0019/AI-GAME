import React, { useEffect, useRef } from 'react';
import { drawPixelAuto } from '../engine/pixelSprites';
import { AutoPalette } from '../types/game';

interface PixelAutoPreviewProps {
  palette: AutoPalette;
  isNitro?: boolean;
  size?: number;
}

export const PixelAutoPreview: React.FC<PixelAutoPreviewProps> = ({
  palette,
  isNitro = false,
  size = 112,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId = 0;
    let phase = 0;

    const render = () => {
      phase += 0.08;
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawPixelAuto(ctx, canvas.width / 2, canvas.height - 14, 2.2, palette, {
        wheelPhase: phase,
        isNitro,
      });
      rafId = requestAnimationFrame(render);
    };

    rafId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafId);
  }, [palette, isNitro]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className="pixelated mx-auto block"
      aria-label="Pixel art auto-rickshaw preview"
    />
  );
};
