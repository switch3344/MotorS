import { useLayoutEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { useInstrumentMotion } from "./useInstrumentMotion";
import { HeroMedia } from "./HeroMedia";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { SplitButton } from "../SplitButton";
import { RADIUS, Instrument, SHOW_TACHOMETER } from "./Instrument";
import { HorizonGlow } from "./HorizonGlow";
import type { GaugeGeometry } from "./Instrument";
import { TechHeadingRun } from "../TechText/TechHeadingRun";

export function Hero() {
  const hero = useRef<HTMLElement>(null);
  const copy = useRef<HTMLDivElement>(null);
  const gauge = useRef<HTMLDivElement>(null);
  const [geometry, setGeometry] = useState<GaugeGeometry>({
    cy: 3600,
    top: 0,
    mobile: false,
    labelSize: 38,
    bottom: 900,
    scale: 1,
    horizon: 0.735,
  });
  const geometryRef = useRef(geometry);
  const drawRef = useRef<() => void>(() => {});
  const motion = useRef({ rpm: 900 });

  const reduced = useReducedMotion();

  useLayoutEffect(() => {
    if (!hero.current || !copy.current) return;
    const section = hero.current;
    const content = copy.current;
    const measure = () => {
      const width = section.clientWidth;
      const height = section.clientHeight;
      const mobile = width < 700;
      const cy = 3600;
      const scale = width / 1600;
      const copyBottom =
        content.getBoundingClientRect().bottom -
        section.getBoundingClientRect().top;
      const labelSize = (mobile ? 13 : 24) / scale;
      const apex = Math.max(
        height * 0.735,
        copyBottom + (mobile ? 105 : 115),
      );
      const top = apex - (cy - RADIUS) * scale;
      const next = {
        cy,
        top,
        mobile,
        labelSize,
        bottom: (height - top) / scale,
        scale,
        horizon: apex / height,
      };
      geometryRef.current = next;
      setGeometry((previous) =>
        Math.abs(previous.top - next.top) < 0.5 &&
        previous.mobile === mobile &&
        previous.labelSize === labelSize &&
        Math.abs(previous.bottom - next.bottom) < 0.5 &&
        previous.scale === scale
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

  useInstrumentMotion(hero, gauge, geometryRef, drawRef, motion, reduced);

  return (
    <section
      className="hero-card"
      id="top"
      ref={hero}
      aria-labelledby="hero-title"
      style={{ "--horizon": `${geometry.horizon * 100}%` } as CSSProperties}
    >
      <HorizonGlow reduced={reduced} geometry={geometryRef} motion={motion} />
      <HeroMedia reduced={reduced} />
      {SHOW_TACHOMETER && <Instrument ref={gauge} geometry={geometry} />}
      <div className="circular-copy" ref={copy}>
        <h1 id="hero-title" tabIndex={-1}>
          <span>
            <TechHeadingRun text="Капитальный ремонт" />
          </span>
          <span>
            <TechHeadingRun text="двигателя." />
          </span>
        </h1>
        <p className="circular-description">
          Краснодар. Гарантия — 5 лет или 250 000 км на капитальный ремонт.
        </p>
        <SplitButton>Записаться на диагностику</SplitButton>
      </div>
    </section>
  );
}
