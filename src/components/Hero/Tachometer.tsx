import { forwardRef } from "react";

export const RADIUS = 1967;
export const CENTER_X = 800;
export const MAX_RPM = 8000;
export const angleForRpm = (rpm: number) => -22 + (rpm / MAX_RPM) * 44;
const radians = (degrees: number) => (degrees * Math.PI) / 180;
function point(angle: number, radius: number, cy: number) {
  return {
    x: CENTER_X + radius * Math.sin(radians(angle)),
    y: cy - radius * Math.cos(radians(angle)),
  };
}
function arc(from: number, to: number, cy: number) {
  const a = point(from, RADIUS, cy);
  const b = point(to, RADIUS, cy);
  return `M ${a.x} ${a.y} A ${RADIUS} ${RADIUS} 0 0 1 ${b.x} ${b.y}`;
}
export interface GaugeGeometry {
  cy: number;
  top: number;
  mobile: boolean;
  labelSize: number;
}

export const Tachometer = forwardRef<
  HTMLDivElement,
  { geometry: GaugeGeometry }
>(function Tachometer({ geometry }, ref) {
  const { cy, top, mobile, labelSize } = geometry;
  const labels = mobile ? [0, 2, 4, 6, 8] : [0, 1, 2, 3, 4, 5, 6, 7, 8];
  return (
    <div
      className="arc-meter"
      ref={ref}
      role="meter"
      aria-label="Обороты двигателя"
      aria-valuemin={0}
      aria-valuemax={MAX_RPM}
      aria-valuenow={900}
      aria-valuetext="900 оборотов в минуту"
    >
      <svg
        className="arc-geometry"
        viewBox="0 0 1600 900"
        preserveAspectRatio="xMidYMid slice"
        style={{ top }}
        aria-hidden="true"
      >
        <defs>
          <linearGradient
            id="arc-accent"
            x1="0"
            y1="0"
            x2="1600"
            y2="0"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#b7192d" />
            <stop offset="1" stopColor="#ef4253" />
          </linearGradient>
          <filter id="arc-glow" x="-30%" y="-100%" width="160%" height="300%">
            <feGaussianBlur stdDeviation="5" />
          </filter>
          <filter
            id="needle-glow"
            x="-1000%"
            y="-20%"
            width="2100%"
            height="140%"
          >
            <feGaussianBlur stdDeviation="6" />
          </filter>
          <linearGradient
            id="needle-accent"
            x1="800"
            y1={cy}
            x2="800"
            y2={cy - RADIUS + 30}
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#e52e45" stopOpacity=".06" />
            <stop offset="1" stopColor="#f04a5b" />
          </linearGradient>
        </defs>
        <path className="arc-baseline" d={arc(-24, 24, cy)} />
        <path className="arc-redline" d={arc(angleForRpm(6500), 24, cy)} />
        <path
          className="arc-progress arc-progress-glow"
          d={arc(-22, 22, cy)}
          pathLength="1"
          strokeDasharray="1"
          strokeDashoffset="1"
          filter="url(#arc-glow)"
        />
        <path
          className="arc-progress"
          d={arc(-22, 22, cy)}
          pathLength="1"
          strokeDasharray="1"
          strokeDashoffset="1"
        />
        {Array.from({ length: 81 }, (_, index) => {
          const rpm = index * 100;
          const a = point(angleForRpm(rpm), RADIUS, cy);
          const b = point(
            angleForRpm(rpm),
            RADIUS - (rpm % 500 === 0 ? 22 : 10),
            cy,
          );
          return (
            <line
              key={rpm}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              className={rpm >= 6500 ? "arc-tick arc-tick-red" : "arc-tick"}
            />
          );
        })}
        {labels.map((value) => {
          const angle = angleForRpm(value * 1000);
          const p = point(angle, RADIUS + (mobile ? 68 : 38), cy);
          return (
            <text
              key={value}
              x={p.x}
              y={p.y}
              textAnchor={
                mobile && value === 0
                  ? "start"
                  : mobile && value === 8
                    ? "end"
                    : "middle"
              }
              dominantBaseline="central"
              transform={`rotate(${angle} ${p.x} ${p.y})`}
              fontSize={labelSize}
              className={value >= 7 ? "arc-label arc-label-red" : "arc-label"}
            >
              {value}
            </text>
          );
        })}
        <g className="arc-needle" transform={`rotate(-22 ${CENTER_X} ${cy})`}>
          <line
            x1={CENTER_X}
            y1={cy}
            x2={CENTER_X}
            y2={cy - RADIUS + 30}
            className="needle-light"
            filter="url(#needle-glow)"
          />
          <line
            x1={CENTER_X}
            y1={cy}
            x2={CENTER_X}
            y2={cy - RADIUS + 30}
            className="needle-core"
          />
        </g>
      </svg>
      <p className="arc-rpm-unit" aria-hidden="true">
        ×1000 об/мин
      </p>
    </div>
  );
});
