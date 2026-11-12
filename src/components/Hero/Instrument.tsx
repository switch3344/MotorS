import { forwardRef } from "react";

export const SHOW_TACHOMETER = true;
export const RADIUS = 3200;
export const CENTER_X = 800;
export const MAX_RPM = 8000;
export const angleForRpm = (rpm: number) => -13 + (rpm / MAX_RPM) * 26;
const rad = (angle: number) => (angle * Math.PI) / 180;
const point = (angle: number, radius: number, cy: number) => ({
  x: CENTER_X + radius * Math.sin(rad(angle)),
  y: cy - radius * Math.cos(rad(angle)),
});
export const instrumentArc = (
  from: number,
  to: number,
  cy: number,
  radius = RADIUS,
) => {
  const a = point(from, radius, cy),
    b = point(to, radius, cy);
  return `M ${a.x} ${a.y} A ${radius} ${radius} 0 0 1 ${b.x} ${b.y}`;
};
export interface GaugeGeometry {
  cy: number;
  top: number;
  mobile: boolean;
  labelSize: number;
  bottom: number;
  scale: number;
  horizon: number;
}

export function needleShape(geometry: GaugeGeometry) {
  const { cy, scale, mobile } = geometry;
  const tip = cy - RADIUS + (mobile ? 10 : 16) / scale;
  const tail = tip + (mobile ? 38 : 62) / scale;
  return `M ${CENTER_X - 0.65 / scale} ${tip} L ${CENTER_X + 0.65 / scale} ${tip} L ${CENTER_X + 2 / scale} ${tail} L ${CENTER_X - 2 / scale} ${tail} Z`;
}

export const Instrument = forwardRef<
  HTMLDivElement,
  { geometry: GaugeGeometry }
>(function Instrument({ geometry }, ref) {
  const { cy, top, mobile, labelSize, scale } = geometry;
  return (
    <div
      className="instrument"
      ref={ref}
      role="meter"
      aria-label="Обороты двигателя"
      aria-valuemin={0}
      aria-valuemax={MAX_RPM}
      aria-valuenow={900}
      aria-valuetext="900 оборотов в минуту"
    >
      <svg
        className="instrument-svg"
        viewBox="0 0 1600 900"
        preserveAspectRatio="xMidYMid slice"
        style={{ top }}
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="instrument-accent">
            <stop stopColor="#b71434" />
            <stop offset="1" stopColor="#ff2d4e" />
          </linearGradient>
          <linearGradient
            id="instrument-needle-material"
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
            <stop stopColor="#ff2d4e" />
            <stop offset="1" stopColor="#5a0a18" />
          </linearGradient>
        </defs>
        <path d={instrumentArc(-18, 18, cy)} className="instrument-track" />
        <path
          d={instrumentArc(angleForRpm(0), angleForRpm(900), cy)}
          className="instrument-progress"
        />
        {Array.from({ length: 81 }, (_, index) => {
          const rpm = index * 100,
            isMajor = rpm % 1000 === 0,
            isMedium = !isMajor && rpm % 500 === 0;
          const length = isMajor
            ? mobile
              ? 10
              : 16
            : isMedium
              ? mobile
                ? 6
                : 10
              : mobile
                ? 4
                : 5;
          const a = point(angleForRpm(rpm), RADIUS, cy),
            b = point(angleForRpm(rpm), RADIUS - length / scale, cy);
          return (
            <line
              key={rpm}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              className={`instrument-tick${rpm >= 7000 ? " instrument-red" : ""}`}
              strokeWidth={isMajor ? 2 : isMedium ? 1.25 : 0.75}
              vectorEffect="non-scaling-stroke"
            />
          );
        })}
        {Array.from({ length: 9 }, (_, value) => {
          const angle = angleForRpm(value * 1000),
            p = point(angle, RADIUS + (mobile ? 15 : 23) / scale, cy);
          return (
            <text
              key={value}
              x={p.x}
              y={p.y}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={labelSize}
              transform={`rotate(${angle} ${p.x} ${p.y})`}
              className={`instrument-label${value >= 7 ? " instrument-red" : ""}`}
            >
              {value}
            </text>
          );
        })}
        <g
          className="instrument-needle"
          transform={`rotate(${angleForRpm(900)} ${CENTER_X} ${cy})`}
        >
          <path
            className="instrument-needle-body"
            d={needleShape(geometry)}
          />
        </g>
      </svg>
    </div>
  );
});
