import { useLayoutEffect, useRef, useState } from "react";
import { useTachometerMotion } from "./useTachometerMotion";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { SplitButton } from "../SplitButton";
import { RADIUS, Tachometer } from "./Tachometer";
import type { GaugeGeometry } from "./Tachometer";

export function Hero() {
  const hero = useRef<HTMLElement>(null);
  const copy = useRef<HTMLDivElement>(null);
  const gauge = useRef<HTMLDivElement>(null);
  const [geometry, setGeometry] = useState<GaugeGeometry>({
    cy: 2527,
    top: 0,
    mobile: false,
    labelSize: 38,
  });
  const geometryRef = useRef(geometry);
  const drawRef = useRef<() => void>(() => {});

  const reduced = useReducedMotion();

  useLayoutEffect(() => {
    if (!hero.current || !copy.current) return;
    const section = hero.current;
    const content = copy.current;
    const measure = () => {
      const width = section.clientWidth;
      const height = section.clientHeight;
      const mobile = width < 700;
      const cy = mobile ? 2427 : 2527;
      const scale = width / 1600;
      // Keep an isotropic 16:9 SVG so all labels fit even in portrait.
      // The needle may overflow the SVG viewport; the hero card clips it.
      const copyBottom =
        content.getBoundingClientRect().bottom -
        section.getBoundingClientRect().top;
      const labelSize = mobile ? 78 : Math.max(38, 24 / scale);
      const labelOffset = mobile ? 68 : 38;
      const clearance = labelOffset * scale + labelSize * scale * 0.7 + 24;
      const apex = Math.max(
        height * (mobile ? 0.65 : 0.64),
        copyBottom + clearance,
      );
      const next = { cy, top: apex - (cy - RADIUS) * scale, mobile, labelSize };
      geometryRef.current = next;
      setGeometry((previous) =>
        Math.abs(previous.top - next.top) < 0.5 &&
        previous.mobile === mobile &&
        previous.labelSize === labelSize
          ? previous
          : next,
      );
    };
    const observer = new ResizeObserver(measure);
    observer.observe(section);
    observer.observe(content);
    measure();
    document.fonts.ready.then(() => {
      if (section.isConnected) measure();
    });
    return () => observer.disconnect();
  }, []);

  useLayoutEffect(() => {
    drawRef.current();
  }, [geometry]);

  useTachometerMotion(hero, gauge, geometryRef, drawRef, reduced);

  return (
    <section
      className="hero-card"
      id="top"
      ref={hero}
      aria-labelledby="hero-title"
    >
      <Tachometer ref={gauge} geometry={geometry} />
      <div className="circular-copy" ref={copy}>
        <h1 id="hero-title" tabIndex={-1}>
          <span>Двигатель, как с завода.</span>
          <span>
            На 5 лет <em>вперёд</em>
          </span>
        </h1>
        <p className="circular-description">
          Капитальный ремонт двигателей в Краснодаре. С гарантией 5 лет.
        </p>
        <SplitButton>Записаться на диагностику</SplitButton>
      </div>
    </section>
  );
}
