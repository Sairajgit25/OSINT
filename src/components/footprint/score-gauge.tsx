// FootprintX — animated exposure score gauge (custom SVG, §25/§30)

"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const R = 92;
const CX = 110;
const CY = 112;
const STROKE = 13;

function polar(angleDeg: number, radius = R): { x: number; y: number } {
  const a = ((180 - angleDeg) * Math.PI) / 180;
  return { x: CX + radius * Math.cos(a), y: CY - radius * Math.sin(a) };
}

function arcPath(fromDeg: number, toDeg: number): string {
  const p1 = polar(fromDeg);
  const p2 = polar(toDeg);
  const large = Math.abs(toDeg - fromDeg) > 180 ? 1 : 0;
  return `M ${p1.x} ${p1.y} A ${R} ${R} 0 ${large} 1 ${p2.x} ${p2.y}`;
}

const FULL_ARC = arcPath(0, 180);
const ARC_LENGTH = Math.PI * R;

const BAND_COLORS: Record<string, string> = {
  LOW: "#34e28a",
  MODERATE: "#2dd4bf",
  ELEVATED: "#fbbf24",
  HIGH: "#fb923c",
  CRITICAL: "#f87171",
};

export function ScoreGauge({
  score,
  band,
  size = "lg",
}: {
  score: number;
  band: string;
  size?: "lg" | "sm";
}) {
  const [display, setDisplay] = useState(0);
  const raf = useRef<number>(0);

  useEffect(() => {
    const start = performance.now();
    const duration = 1400;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(score * eased));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf.current);
    };
  }, [score]);

  const color = BAND_COLORS[band] ?? "#34e28a";
  const filled = (display / 100) * ARC_LENGTH;
  const scale = size === "lg" ? 1 : 0.62;
  const width = CX + R + 18;

  return (
    <div
      className="relative"
      style={{ width: width * scale, height: (CY + 26) * scale }}
      role="img"
      aria-label={`Exposure score ${score} out of 100, band ${band}`}
    >
      <svg
        width={width * scale}
        height={(CY + 26) * scale}
        viewBox={`0 0 ${width} ${CY + 26}`}
        style={{ overflow: "visible" }}
      >
        <defs>
          <linearGradient id="fxGaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#34e28a" />
            <stop offset="55%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#f87171" />
          </linearGradient>
          <filter id="fxGaugeGlow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* track */}
        <path d={FULL_ARC} fill="none" stroke="rgba(228,239,232,0.08)" strokeWidth={STROKE} strokeLinecap="round" />

        {/* ticks */}
        {[0, 25, 50, 75, 100].map((t) => {
          const angle = (t / 100) * 180;
          const outer = polar(angle, R + STROKE / 2 + 3);
          const inner = polar(angle, R + STROKE / 2 + 8);
          return (
            <line
              key={t}
              x1={inner.x}
              y1={inner.y}
              x2={outer.x}
              y2={outer.y}
              stroke="rgba(228,239,232,0.25)"
              strokeWidth={1.4}
            />
          );
        })}

        {/* filled arc */}
        <path
          d={FULL_ARC}
          fill="none"
          stroke="url(#fxGaugeGrad)"
          strokeWidth={STROKE}
          strokeLinecap="round"
          filter="url(#fxGaugeGlow)"
          strokeDasharray={`${filled} ${ARC_LENGTH}`}
          style={{ transition: "stroke-dasharray 0.18s linear" }}
        />

        {/* needle */}
        <g
          style={{
            transform: `rotate(${(display / 100) * 180 - 180}deg)`,
            transformOrigin: `${CX}px ${CY}px`,
            transition: "transform 0.18s linear",
          }}
        >
          <line x1={CX} y1={CY} x2={CX} y2={CY - R + 16} stroke={color} strokeWidth={2.2} strokeLinecap="round" />
          <circle cx={CX} cy={CY} r={4.5} fill={color} />
        </g>
      </svg>

      <div
        className="absolute inset-x-0 flex flex-col items-center"
        style={{ top: (CY - 34) * scale, bottom: 0 }}
      >
        <div
          className={cn(
            "font-mono font-bold tabular-nums leading-none",
            size === "lg" ? "text-5xl" : "text-3xl",
          )}
          style={{ color }}
        >
          {display}
          <span className="ml-1 align-top text-base font-medium text-muted-foreground">/100</span>
        </div>
        <div
          className={cn(
            "mt-2 font-mono font-semibold tracking-[0.3em] fx-glow",
            size === "lg" ? "text-sm" : "text-[10px]",
          )}
          style={{ color }}
        >
          {band}
        </div>
      </div>
    </div>
  );
}
