import { useLayoutEffect, useRef, useState } from "react";
import { useInstrumentMotion } from "./useInstrumentMotion";
import { HeroMedia } from "./HeroMedia";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { SplitButton } from "../SplitButton";
import { RADIUS, Instrument } from "./Instrument";
import type { GaugeGeometry } from "./Instrument";
import { TechHeadingRun } from "../TechText/TechHeadingRun";

export function Hero() {
  const hero = useRef<HTMLElement>(null);
  const copy = useRef<HTMLDivElement>(null);
  const gauge = useRef<HTMLDivElement>(null);
  const [geometry, setGeometry] = useState<GaugeGeometry>({
    cy: 2527,
    top: 0,
    mobile: false,
    labelSize: 38,
    bottom: 900,
    scale: 1,
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
      const labelSize =
        (mobile ? 20 : Math.min(56, Math.max(44, width * 0.036))) / scale;
      const labelOffset = (mobile ? 24 : 38) / scale;
      const clearance = labelOffset * scale + labelSize * scale * 0.7 + 24;
      const apex = Math.max(
        height * (mobile ? 0.65 : 0.64),
        copyBottom + clearance,
      );
      const top = apex - (cy - RADIUS) * scale;
      const next = {
        cy,
        top,
        mobile,
        labelSize,
        bottom: (height - top) / scale,
        scale,
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

  useInstrumentMotion(hero, gauge, geometryRef, drawRef, reduced);

  return (
    <section
      className="hero-card"
      id="top"
      ref={hero}
      aria-labelledby="hero-title"
    >
      <HeroMedia reduced={reduced} geometry={geometry} />
      <Instrument ref={gauge} geometry={geometry} />
      <div className="circular-copy" ref={copy}>
        <h1 id="hero-title" tabIndex={-1}>
          <span>
            <TechHeadingRun text="Капремонт двигателя." />
          </span>
          <span>
            <TechHeadingRun text="Без " />
            <em>
              <TechHeadingRun text="подделок." />
            </em>
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
