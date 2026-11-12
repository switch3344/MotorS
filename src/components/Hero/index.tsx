import { useState } from "react";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { TechHeadingRun } from "../TechText/TechHeadingRun";
import { SpeedometerVideo } from "./SpeedometerVideo";

export function Hero() {
  const reduced = useReducedMotion();
  const [completed, setCompleted] = useState(false);
  return (
    <section
      className={`hero-card hero-video${completed ? " hero-is-complete" : ""}`}
      id="top"
      aria-labelledby="hero-title"
    >
      {completed ? (
        <div className="hero-ending">
          <div className="hero-ending-brand">MotorServiceKRD</div>
          <h1 id="hero-title" tabIndex={-1}>
            Чтобы ехать уверенно
          </h1>
          <p>Диагностика двигателя</p>
          <svg
            className="hero-ending-arc"
            viewBox="0 0 1920 300"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path
              d="M0 260 C500 5 1420 5 1920 260"
              fill="none"
              stroke="#F4F3EE"
              strokeWidth="3.5"
            />
          </svg>
        </div>
      ) : (
        <div className="circular-copy">
          <h1 id="hero-title" tabIndex={-1}>
            <TechHeadingRun text="Мощность требует ухода" />
          </h1>
        </div>
      )}
      <SpeedometerVideo
        reduced={reduced}
        completed={completed}
        onComplete={() => setCompleted(true)}
      />
    </section>
  );
}
