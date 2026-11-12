import { useEffect, useRef } from "react";
import type { RefObject } from "react";
import type { GaugeGeometry } from "./Instrument";
import "./horizon.css";

export interface HorizonInputs {
  geometry: RefObject<GaugeGeometry>;
  motion: RefObject<{ rpm: number }>;
  reduced: boolean;
}

/** The CSS version stays underneath for unsupported/lost WebGL contexts. */
export function HorizonGlow(inputs: HorizonInputs) {
  const host = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const { reduced, geometry, motion } = inputs;
  useEffect(() => {
    let cancelled = false;
    let dispose: (() => void) | undefined;
    void import("./createHorizonRenderer").then(({ createHorizonRenderer }) => {
      if (cancelled || !host.current || !canvas.current) return;
      try {
        dispose = createHorizonRenderer(host.current, canvas.current, {
          reduced, geometry, motion,
        });
      } catch (error) {
        host.current.dataset.renderer = "css-fallback";
        host.current.dataset.reason = error instanceof Error ? error.message : "Renderer unavailable";
      }
    }).catch(() => {
      if (host.current) {
        host.current.dataset.renderer = "css-fallback";
        host.current.dataset.reason = "Renderer module unavailable";
      }
    });
    return () => {
      cancelled = true;
      dispose?.();
    };
  }, [reduced, geometry, motion]);
  return (
    <div className="horizon-glow" ref={host} aria-hidden="true" data-renderer="css-fallback">
      <div className="horizon-fallback" />
      <canvas ref={canvas} />
    </div>
  );
}
