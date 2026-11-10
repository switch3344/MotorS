import { useEffect, useLayoutEffect, useState } from "react";
import { useReducedMotion } from "../hooks/useReducedMotion";
import "../preloader.css";

export function Preloader({ ready }: { ready: boolean }) {
  const [shown, setShown] = useState(true);
  const reduced = useReducedMotion();
  useEffect(() => {
    if (!ready) return;
    const timeout = window.setTimeout(() => setShown(false), reduced ? 0 : 380);
    return () => window.clearTimeout(timeout);
  }, [ready, reduced]);
  useLayoutEffect(() => {
    if (!shown) return;
    const overflow = document.body.style.overflow;
    const gutter = document.documentElement.style.scrollbarGutter;
    document.documentElement.style.scrollbarGutter = "stable";
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
      document.documentElement.style.scrollbarGutter = gutter;
    };
  }, [shown]);
  if (!shown) return null;
  return (
    <div
      className="site-preloader"
      data-ready={ready}
      role="status"
      aria-live="polite"
      aria-busy={!ready}
      aria-hidden={ready}
    >
      <span className="site-preloader-wordmark">
        MotorServiceKRD<span>.</span>
      </span>
      <div className="site-preloader-track" aria-hidden="true">
        <span />
      </div>
      <p>Подготавливаем двигатель</p>
    </div>
  );
}
