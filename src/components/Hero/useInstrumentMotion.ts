import { useLayoutEffect } from "react";
import type { RefObject } from "react";
import { gsap } from "../../lib/scroll";
import {
  angleForRpm,
  CENTER_X,
  MAX_RPM,
  RADIUS,
  instrumentArc,
  needleShape,
} from "./Instrument";
import type { GaugeGeometry } from "./Instrument";

export function useInstrumentMotion(
  hero: RefObject<HTMLElement | null>,
  gauge: RefObject<HTMLDivElement | null>,
  geometry: RefObject<GaugeGeometry>,
  draw: RefObject<() => void>,
  motion: RefObject<{ rpm: number }>,
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
      motion.current.rpm = state.rpm;
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
      body.setAttribute("d", needleShape(geometry.current));
      progress.forEach((path) =>
        path.setAttribute("d", instrumentArc(angleForRpm(0), angle, geometry.current.cy)),
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
    let pointerActive = false;
    let parkedRpm = state.rpm;
    let returning: gsap.core.Tween | null = null;
    const follow = gsap.quickTo(state, "rpm", {
      duration: 0.32,
      ease: "power3.out",
      onUpdate: render,
    });
    const sync = () => {
      if (document.hidden || !visible) {
        drive.pause();
        follow.tween.pause();
        returning?.pause();
      } else if (pointerActive) {
        drive.pause();
        follow.tween.resume();
      } else if (returning) {
        drive.pause();
        returning.resume();
      } else drive.resume();
    };
    const steer = (event: PointerEvent) => {
      if (event.pointerType === "touch" || document.hidden || !visible) return;
      const rect = hero.current!.getBoundingClientRect();
      if (!rect.width) return;
      const first = !pointerActive;
      if (first && !returning) parkedRpm = state.rpm;
      pointerActive = true;
      returning?.kill();
      returning = null;
      drive.pause();
      // Invert the same circular geometry used by the needle. Its tip follows
      // the cursor's horizontal position, clamped to the scale's end marks.
      const start = angleForRpm(0),
        end = angleForRpm(MAX_RPM);
      const radius = RADIUS * geometry.current.scale - (geometry.current.mobile ? 10 : 16);
      const offset =
        event.clientX - rect.left - CENTER_X * geometry.current.scale;
      const sine = Math.min(
        Math.sin((end * Math.PI) / 180),
        Math.max(Math.sin((start * Math.PI) / 180), offset / radius),
      );
      const angle = (Math.asin(sine) * 180) / Math.PI;
      const rpm = Math.min(
        MAX_RPM,
        Math.max(0, ((angle - start) / (end - start)) * MAX_RPM),
      );
      follow(rpm, first ? state.rpm : undefined);
    };
    const release = () => {
      if (!pointerActive) return;
      pointerActive = false;
      follow.tween.pause();
      returning?.kill();
      returning = gsap.to(state, {
        rpm: parkedRpm,
        duration: 0.55,
        ease: "power2.inOut",
        onUpdate: render,
        onComplete: () => {
          returning = null;
          sync();
        },
      });
      sync();
    };
    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting && entry.intersectionRatio > 0.1;
        sync();
      },
      { threshold: [0, 0.1] },
    );
    observer.observe(hero.current);
    const section = hero.current;
    section.addEventListener("pointerenter", steer, { passive: true });
    section.addEventListener("pointermove", steer, { passive: true });
    section.addEventListener("pointerleave", release);
    document.addEventListener("visibilitychange", sync);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", sync);
      section.removeEventListener("pointerenter", steer);
      section.removeEventListener("pointermove", steer);
      section.removeEventListener("pointerleave", release);
      drive.kill();
      follow.tween.kill();
      returning?.kill();
      draw.current = () => {};
    };
  }, [hero, gauge, geometry, draw, motion, reduced]);
}
