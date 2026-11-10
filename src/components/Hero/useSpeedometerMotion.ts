import { useLayoutEffect } from "react";
import type { RefObject } from "react";
import { gsap } from "../../lib/scroll";
import { angleForSpeed, CENTER_X, MAX_SPEED } from "./Speedometer";
import type { GaugeGeometry } from "./Speedometer";

export function useSpeedometerMotion(
  hero: RefObject<HTMLElement | null>,
  gauge: RefObject<HTMLDivElement | null>,
  geometry: RefObject<GaugeGeometry>,
  draw: RefObject<() => void>,
  reduced: boolean,
) {
  useLayoutEffect(() => {
    if (!hero.current || !gauge.current) return;
    const root = gauge.current;
    const needle = root.querySelector(".arc-needle")!;
    const readout = root.querySelector(".arc-speed-value")!;
    const progress = root.querySelectorAll(".arc-progress");
    const marks = Array.from(
      root.querySelectorAll<SVGElement>("[data-speed]"),
    ).map((element) => ({ element, speed: Number(element.dataset.speed) }));
    const state = { speed: reduced ? 120 : 0 };
    let inView = false;
    let previousSpeed = -1;
    const render = () => {
      const speed = Math.round(state.speed);
      needle.setAttribute(
        "transform",
        `rotate(${angleForSpeed(state.speed)} ${CENTER_X} ${geometry.current.cy})`,
      );
      progress.forEach((path) =>
        path.setAttribute(
          "stroke-dashoffset",
          String(1 - state.speed / MAX_SPEED),
        ),
      );
      if (speed === previousSpeed) return;
      previousSpeed = speed;
      readout.textContent = String(speed);
      marks.forEach(({ element, speed: markSpeed }) =>
        element.classList.toggle("arc-mark-lit", markSpeed <= speed),
      );
      root.setAttribute("aria-valuenow", String(speed));
      root.setAttribute("aria-valuetext", `${speed} километров в час`);
    };
    draw.current = render;
    render();
    if (reduced)
      return () => {
        draw.current = () => {};
      };
    const drive = gsap
      .timeline({ paused: true, repeat: -1, onUpdate: render })
      .to(state, { speed: 80, duration: 3.5, ease: "power1.inOut" })
      .to(state, { speed: 160, duration: 4, ease: "power1.inOut" })
      .to(state, { speed: 224, duration: 4.5, ease: "power1.inOut" })
      .to(state, { speed: 120, duration: 4, ease: "power1.inOut" })
      .to(state, { speed: 0, duration: 4, ease: "power2.inOut" })
      .to(state, { speed: 0, duration: 1 });
    const sync = () => {
      if (document.hidden || !inView) drive.pause();
      else drive.resume();
    };
    const observer = new IntersectionObserver(
      ([entry]) => {
        const next = entry.isIntersecting && entry.intersectionRatio > 0.1;
        if (next === inView) return;
        inView = next;
        sync();
      },
      { threshold: [0, 0.1] },
    );
    observer.observe(hero.current);
    document.addEventListener("visibilitychange", sync);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", sync);
      drive.kill();
      draw.current = () => {};
    };
  }, [hero, gauge, geometry, draw, reduced]);
}
