import { useReducedMotion } from "../../hooks/useReducedMotion";
import { TechHeadingRun } from "../TechText/TechHeadingRun";
import { SpeedometerVideo } from "./SpeedometerVideo";

export function Hero() {
  const reduced = useReducedMotion();
  return (
    <section className="hero-card hero-video" id="top" aria-labelledby="hero-title">
      <div className="circular-copy">
        <h1 id="hero-title" tabIndex={-1}>
          <TechHeadingRun text="Мощность требует ухода" />
        </h1>
      </div>
      <SpeedometerVideo reduced={reduced} />
    </section>
  );
}
