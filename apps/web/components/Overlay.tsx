"use client";
// DESIGN §3: SVG layer, viewBox = image size. SAM never moves point; outline swaps in with 200ms crossfade.
import type { RefineResponse, StepResponse } from "../lib/api/client";

type Props = { imageUrl: string; width: number; height: number; step: StepResponse; refinement: RefineResponse | null; stepNumber: number };

export default function Overlay({ imageUrl, width, height, step, refinement, stepNumber }: Props) {
  const target = step.target;
  const box = target?.box;
  const outline = refinement?.mode === "outline" && refinement.svg_path && refinement.origin;
  const small = box !== undefined && box !== null && (box.x2 - box.x1 < 32 || box.y2 - box.y1 < 32);
  const pad = 6;
  const bx = box ? Math.max(0, box.x1 - pad) : 0, by = box ? Math.max(0, box.y1 - pad) : 0;
  const bw = box ? box.x2 - box.x1 + pad * 2 : 0, bh = box ? box.y2 - box.y1 + pad * 2 : 0;
  const badgeX = box ? (box.x1 - 18 < 0 ? box.x2 + 18 : box.x1 - 18) : 0;
  const badgeY = box ? (box.y1 - 18 < 0 ? box.y2 + 18 : box.y1 - 18) : 0;
  const dashed = step.status === "unsure";
  const ring = (stroke: string, w: number, inset: number) => box ? (
    <rect x={bx - inset} y={by - inset} width={bw + inset * 2} height={bh + inset * 2} rx={8} fill="none" stroke={stroke} strokeWidth={w} strokeDasharray={dashed ? "12 8" : undefined} />
  ) : null;
  return (
    <div className="relative w-full">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={imageUrl} alt={`Your screenshot. Step ${stepNumber} target: ${target?.label ?? "none"}`} className="w-full" />
      {box && target && (
        <svg data-testid="overlay-svg" viewBox={`0 0 ${width} ${height}`} className="absolute inset-0 h-full w-full" aria-hidden="true">
          <path d={`M0 0H${width}V${height}H0Z M${bx} ${by}H${bx + bw}V${by + bh}H${bx}Z`} fill="var(--scrim)" fillRule="evenodd" />
          {!outline && <>{ring("var(--ink)", 2, 5)}{ring("var(--highlighter)", 6, 1)}{ring("var(--paper)", 2, -3)}</>}
          {outline && refinement?.origin && (
            <g style={{ transition: "opacity 200ms", opacity: 1 }} className="refine-fade">
              <path d={refinement.svg_path ?? ""} transform={`translate(${refinement.origin.x} ${refinement.origin.y})`} fill="none" stroke="var(--ink)" strokeWidth={10} />
              <path d={refinement.svg_path ?? ""} transform={`translate(${refinement.origin.x} ${refinement.origin.y})`} fill="none" stroke="var(--highlighter)" strokeWidth={6} />
              <path d={refinement.svg_path ?? ""} transform={`translate(${refinement.origin.x} ${refinement.origin.y})`} fill="none" stroke="var(--paper)" strokeWidth={2} />
            </g>
          )}
          <g data-testid="step-badge">
            <circle cx={badgeX} cy={badgeY} r={16} fill="var(--highlighter)" stroke="var(--ink)" strokeWidth={2} />
            <text x={badgeX} y={badgeY + 8} textAnchor="middle" fontSize={24} fontWeight={800} fill="var(--ink)">{dashed ? "?" : stepNumber}</text>
          </g>
          {small && box && (
            <g>
              <line x1={box.x2} y1={box.y1} x2={Math.min(width - 170, box.x2 + 40)} y2={Math.max(0, box.y1 - 40)} stroke="var(--ink)" strokeWidth={2} />
              <svg x={Math.min(width - 170, box.x2 + 40)} y={Math.max(0, box.y1 - 160)} width={160} height={160} viewBox={`${box.x1 - 32} ${box.y1 - 32} 64 64`} preserveAspectRatio="xMidYMid slice">
                <image href={imageUrl} width={width} height={height} />
              </svg>
            </g>
          )}
        </svg>
      )}
      <style>{`@media (prefers-reduced-motion: reduce){.refine-fade{transition:none!important}}`}</style>
    </div>
  );
}
