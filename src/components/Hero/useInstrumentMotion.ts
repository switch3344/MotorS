import { useLayoutEffect } from "react";
import type { RefObject } from "react";
import { gsap } from "../../lib/scroll";
import {
  angleForRpm,
  CENTER_X,
  instrumentArc,
  needleShape,
} from "./Instrument";
import type { GaugeGeometry } from "./Instrument";

export function useInstrumentMotion(
  hero: RefObject<HTMLElement | null>,
  gauge: RefObject<HTMLDivElement | null>,
  geometry: RefObject<GaugeGeometry>,
  draw: RefObject<() => void>,
  reduced: boolean,
) {
  useLayoutEffect(() => {
    if (!hero.current || !gauge.current) return;
    const findTargets = () => {
      const root = gauge.current;
      const needle = root?.querySelector<SVGGElement>(".instrument-needle");
      const body = root?.querySelector<SVGPathElement>(
        ".instrument-needle-body",
      );
      const progress = root?.querySelectorAll<SVGPathElement>(
        ".instrument-progress",
      );
      return root && needle && body && progress?.length
        ? { root, needle, body, progress }
        : null;
    };
    let targets = findTargets();
    const state = { rpm: reduced ? 4800 : 900 };
    let visible = false,
      previous = -1;
    const render = () => {
      // React can replace the SVG during refresh or a layout update.
      // Never animate a detached needle or a stale copy of the filled arc.
      if (
        !targets ||
        targets.root !== gauge.current ||
        !targets.needle.isConnected ||
        !targets.progress[0].isConnected
      ) {
        targets = findTargets();
        previous = -1;
      }
      if (!targets) return;
      const { root, needle, body, progress } = targets;
      const rpm = Math.round(state.rpm),
        angle = angleForRpm(state.rpm);
      needle.setAttribute(
        "transform",
        `rotate(${angle} ${CENTER_X} ${geometry.current.cy})`,
      );
      body.setAttribute("d", needleShape(geometry.current, angle));
      progress.forEach((path) =>
        path.setAttribute("d", instrumentArc(-22, angle, geometry.current.cy)),
      );
      if (rpm === previous) return;
      previous = rpm;
      root.setAttribute("aria-valuenow", String(rpm));
      root.setAttribute("aria-valuetext", `${rpm} оборотов в минуту`);
    };
    draw.current = render;
    render();
    if (reduced)
      return () => {
        draw.current = () => {};
      };
    const drive = gsap
      .timeline({ paused: true, repeat: -1, onUpdate: render })
      .to(state, { rpm: 6200, duration: 2.8, ease: "power1.inOut" })
      .to(state, { rpm: 3800, duration: 0.3, ease: "power3.out" })
      .to(state, { rpm: 6600, duration: 2.6, ease: "power1.in" })
      .to(state, { rpm: 4200, duration: 0.3, ease: "power3.out" })
      .to(state, { rpm: 7100, duration: 3.2, ease: "power1.inOut" })
      .to(state, { rpm: 4800, duration: 0.3, ease: "power3.out" })
      .to(state, { rpm: 6500, duration: 2.8, ease: "power1.inOut" })
      .to(state, { rpm: 900, duration: 3, ease: "power2.inOut" })
      .to(state, { rpm: 900, duration: 1 });
    const sync = () => {
      if (document.hidden || !visible) drive.pause();
      else drive.resume();
    };
    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting && entry.intersectionRatio > 0.1;
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
