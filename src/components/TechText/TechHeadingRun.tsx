import { useCallback, useLayoutEffect, useRef, useState } from "react";
import TechText from "./TechText";
import { useReducedMotion } from "../../hooks/useReducedMotion";

/** Native text keeps heading semantics, line metrics and a no-canvas fallback. */
export function TechHeadingRun({ text }: { text: string }) {
  const run = useRef<HTMLSpanElement>(null);
  const [font, setFont] = useState({
    size: 48,
    weight: 400,
    family: "",
    style: "normal",
    spacing: -0.05,
  });
  const [ready, setReady] = useState(false);
  const reduced = useReducedMotion();
  const onReady = useCallback(() => setReady(true), []);
  useLayoutEffect(() => {
    const element = run.current;
    if (!element) return;
    const measure = () => {
      const css = getComputedStyle(element);
      const size = parseFloat(css.fontSize);
      const next = {
        size,
        weight: parseInt(css.fontWeight) || 400,
        family: css.fontFamily,
        style: css.fontStyle,
        spacing: (parseFloat(css.letterSpacing) || 0) / size,
      };
      setFont((previous) =>
        JSON.stringify(previous) === JSON.stringify(next) ? previous : next,
      );
    };
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    measure();
    return () => observer.disconnect();
  }, []);
  return (
    <span
      ref={run}
      className={`tech-heading-run${ready && !reduced ? " tech-heading-ready" : ""}`}
    >
      <span className="tech-heading-fallback">{text}</span>
      {!reduced && (
        <span className="tech-heading-overlay" aria-hidden="true">
          <TechText
            text={text}
            fontSize={font.size}
            fontWeight={font.weight}
            fontFamily={font.family}
            fontStyle={font.style}
            letterSpacing={font.spacing}
            fitPadding={0}
            inlineLayout
            onReady={onReady}
            reveal="letter"
            align="center"
            accentColor="#ec5467"
            strokeWidth={1}
            dashLength={4}
            dashGap={2}
            specks={0}
            labels={false}
            guides={false}
            selection
            draggable={false}
            clickKick
            bounce={0.2}
            sweep={false}
            intro="none"
          />
        </span>
      )}
    </span>
  );
}
