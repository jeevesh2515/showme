"use client";
// DESIGN §3: SVG layer, viewBox = image size. SAM never moves point; outline swaps in with 200ms crossfade.
import { useEffect, useRef, useState } from "react";
import type { RefineResponse, StepResponse } from "../lib/api/client";

type Props = { imageUrl: string; width: number; height: number; step: StepResponse; refinement: RefineResponse | null; stepNumber: number };

export default function Overlay({ imageUrl, width, height, step, refinement, stepNumber }: Props) {
  // SVG units are image pixels; k converts DESIGN's CSS sizes so a 1170 px screenshot on a phone keeps a 6 px ring and a readable badge.
  const rootRef = useRef<HTMLDivElement>(null);
  const [k, setK] = useState(1);
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const measure = () => { if (el.clientWidth > 0) setK(width / el.clientWidth); };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [width]);
  const target = step.target;
  const box = target?.box;
  const outline = refinement?.mode === "outline" && refinement.svg_path && refinement.origin;
  const small = box !== undefined && box !== null && (box.x2 - box.x1 < 32 || box.y2 - box.y1 < 32);
  const pad = 6 * k;
  const bx = box ? Math.max(0, box.x1 - pad) : 0, by = box ? Math.max(0, box.y1 - pad) : 0;
  const bw = box ? box.x2 - box.x1 + pad * 2 : 0, bh = box ? box.y2 - box.y1 + pad * 2 : 0;
  // Flip to the far corner when there is no room, then clamp: a full-width target must not clip the badge at the image edge.
  const fit = (v: number, max: number) => Math.min(Math.max(18 * k, v), max - 18 * k);
  const badgeX = box ? fit(box.x1 - 18 * k < 0 ? box.x2 + 18 * k : box.x1 - 18 * k, width) : 0;
  const badgeY = box ? fit(box.y1 - 18 * k < 0 ? box.y2 + 18 * k : box.y1 - 18 * k, height) : 0;
  const dashed = step.status === "unsure";
  const dash = dashed ? `${12 * k} ${8 * k}` : undefined;
  const ring = (stroke: string, w: number, inset: number) => box ? (
    <rect x={bx - inset * k} y={by - inset * k} width={bw + inset * k * 2} height={bh + inset * k * 2} rx={8 * k} fill="none" stroke={stroke} strokeWidth={w * k} strokeDasharray={dash} />
  ) : null;
  return (
    <div ref={rootRef} className="relative w-full">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={imageUrl} alt={`Your screenshot. Step ${stepNumber} target: ${target?.label ?? "none"}`} className="w-full" />
      {box && target && (
        <svg data-testid="overlay-svg" viewBox={`0 0 ${width} ${height}`} className="absolute inset-0 h-full w-full" aria-hidden="true">
          <path d={`M0 0H${width}V${height}H0Z M${bx} ${by}H${bx + bw}V${by + bh}H${bx}Z`} fill="var(--scrim)" fillRule="evenodd" />
          {!outline && <>{ring("var(--ink)", 2, 5)}{ring("var(--highlighter)", 6, 1)}{ring("var(--paper)", 2, -3)}</>}
          {outline && refinement?.origin && (
            <g style={{ transition: "opacity 200ms", opacity: 1 }} className="refine-fade">
              <path d={refinement.svg_path ?? ""} transform={`translate(${refinement.origin.x} ${refinement.origin.y})`} fill="none" stroke="var(--ink)" strokeWidth={10 * k} strokeDasharray={dash} strokeLinejoin="round" strokeLinecap="round" />
              <path d={refinement.svg_path ?? ""} transform={`translate(${refinement.origin.x} ${refinement.origin.y})`} fill="none" stroke="var(--highlighter)" strokeWidth={6 * k} strokeDasharray={dash} strokeLinejoin="round" strokeLinecap="round" />
              <path d={refinement.svg_path ?? ""} transform={`translate(${refinement.origin.x} ${refinement.origin.y})`} fill="none" stroke="var(--paper)" strokeWidth={2 * k} strokeDasharray={dash} strokeLinejoin="round" strokeLinecap="round" />
            </g>
          )}
          <g data-testid="step-badge">
            <circle cx={badgeX} cy={badgeY} r={16 * k} fill="var(--highlighter)" stroke="var(--ink)" strokeWidth={2 * k} />
            <text x={badgeX} y={badgeY + 8 * k} textAnchor="middle" fontSize={24 * k} fontWeight={800} fill="var(--ink)">{dashed ? "?" : stepNumber}</text>
          </g>
          {small && box && (
            <g>
              <line x1={box.x2} y1={box.y1} x2={Math.min(width - 170 * k, box.x2 + 40 * k)} y2={Math.max(0, box.y1 - 40 * k)} stroke="var(--ink)" strokeWidth={2 * k} />
              <svg x={Math.min(width - 170 * k, box.x2 + 40 * k)} y={Math.max(0, box.y1 - 160 * k)} width={160 * k} height={160 * k} viewBox={`${box.x1 - 32} ${box.y1 - 32} 64 64`} preserveAspectRatio="xMidYMid slice">
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
