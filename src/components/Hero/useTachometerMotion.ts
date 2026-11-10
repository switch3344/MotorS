import { useLayoutEffect } from "react";
import type { RefObject } from "react";
import { gsap } from "../../lib/scroll";
import { angleForRpm, CENTER_X, MAX_RPM } from "./Tachometer";
import type { GaugeGeometry } from "./Tachometer";

export function useTachometerMotion(
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
    const progress = root.querySelectorAll(".arc-progress");
    const state = { rpm: reduced ? 4000 : 900, gear: 1 };
    let inView = false;
    const render = () => {
      const rpm = Math.round(state.rpm);
      const p = Math.min(1, Math.max(0, state.rpm / MAX_RPM));
      needle.setAttribute(
        "transform",
        `rotate(${angleForRpm(state.rpm)} ${CENTER_X} ${geometry.current.cy})`,
      );
      progress.forEach((path) =>
        path.setAttribute("stroke-dashoffset", String(1 - p)),
      );
      root.setAttribute("aria-valuenow", String(rpm));
      root.setAttribute(
        "aria-valuetext",
        `${rpm} оборотов в минуту, передача ${state.gear}`,
      );
      root.dataset.gear = String(state.gear);
    };
    draw.current = render;
    render();
    if (reduced)
      return () => {
        draw.current = () => {};
      };

    // Acceleration takes seconds; changing gear drops the RPM in 240 ms.
    // The final release returns to idle before the next demonstration run.
    const drive = gsap
      .timeline({ paused: true, repeat: -1, onUpdate: render })
      .set(state, { gear: 1 })
      .to(state, { rpm: 6200, duration: 2.5, ease: "power1.inOut" })
      .set(state, { gear: 2 })
      .to(state, { rpm: 3800, duration: 0.24, ease: "power3.out" })
      .to(state, { rpm: 6500, duration: 2.1, ease: "power1.in" })
      .set(state, { gear: 3 })
      .to(state, { rpm: 4100, duration: 0.24, ease: "power3.out" })
      .to(state, { rpm: 6800, duration: 2.35, ease: "power1.in" })
      .set(state, { gear: 4 })
      .to(state, { rpm: 4400, duration: 0.24, ease: "power3.out" })
      .to(state, { rpm: 7000, duration: 2.6, ease: "power1.in" })
      .set(state, { gear: 5 })
      .to(state, { rpm: 4600, duration: 0.24, ease: "power3.out" })
      .to(state, { rpm: 6200, duration: 2.8, ease: "power1.inOut" })
      .to(state, { rpm: 900, duration: 2.2, ease: "power2.inOut" })
      .to(state, { rpm: 900, duration: 0.8 });
    const sync = () => {
      if (document.hidden || !inView) drive.pause();
      else drive.resume();
    };
    const observer = new IntersectionObserver(
      ([entry]) => {
        const next = entry.isIntersecting && entry.intersectionRatio > 0.1;
        if (next === inView) return;
        inView = next;
        if (inView) drive.restart();
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
