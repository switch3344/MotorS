import { forwardRef } from "react";

export const RADIUS = 1880;
export const CENTER_X = 800;
export const MAX_RPM = 8000;
export const angleForRpm = (rpm: number) => -22 + (rpm / MAX_RPM) * 44;
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
}

export function needleShape(geometry: GaugeGeometry, angle: number) {
  const { cy, bottom, scale } = geometry;
  const tip = cy - RADIUS + 3 / scale;
  const tail = cy - (cy - bottom - 24 / scale) / Math.cos(rad(angle));
  return `M ${CENTER_X - 1 / scale} ${tip} L ${CENTER_X + 1 / scale} ${tip} L ${CENTER_X + 7 / scale} ${tail} L ${CENTER_X - 7 / scale} ${tail} Z`;
}

export const Instrument = forwardRef<
  HTMLDivElement,
  { geometry: GaugeGeometry }
>(function Instrument({ geometry }, ref) {
  const { cy, top, mobile, labelSize, scale } = geometry;
  const tip = cy - RADIUS + 3 / scale;
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
          <filter
            id="instrument-fill-glow"
            x="-10%"
            y="-100%"
            width="120%"
            height="300%"
          >
            <feGaussianBlur stdDeviation="4" />
          </filter>
          <filter
            id="instrument-tip-glow"
            x={CENTER_X - 60 / scale}
            y={tip - 45 / scale}
            width={120 / scale}
            height={120 / scale}
            filterUnits="userSpaceOnUse"
          >
            <feGaussianBlur stdDeviation="8" />
          </filter>
        </defs>
        <path
          d={instrumentArc(-24, 24, cy, RADIUS + 14 / scale)}
          className="instrument-outer-ring"
        />
        <path d={instrumentArc(-24, 24, cy)} className="instrument-track" />
        <path
          d={instrumentArc(-22, angleForRpm(900), cy)}
          className="instrument-progress instrument-progress-glow"
          filter="url(#instrument-fill-glow)"
        />
        <path
          d={instrumentArc(-22, angleForRpm(900), cy)}
          className="instrument-progress"
        />
        {Array.from({ length: 81 }, (_, index) => {
          const rpm = index * 100,
            isMajor = rpm % 1000 === 0,
            isMedium = !isMajor && rpm % 500 === 0;
          const length = isMajor
            ? mobile
              ? 22
              : 36
            : isMedium
              ? mobile
                ? 16
                : 24
              : mobile
                ? 10
                : 14;
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
              strokeWidth={isMajor ? 4 : isMedium ? 2 : 1.5}
              vectorEffect="non-scaling-stroke"
            />
          );
        })}
        {Array.from({ length: 9 }, (_, value) => {
          const angle = angleForRpm(value * 1000),
            p = point(angle, RADIUS + (mobile ? 24 : 38) / scale, cy);
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
          transform={`rotate(-22 ${CENTER_X} ${cy})`}
        >
          <ellipse
            cx={CENTER_X}
            cy={tip + 10 / scale}
            rx={5 / scale}
            ry={12 / scale}
            className="instrument-tip-halo"
            filter="url(#instrument-tip-glow)"
          />
          <path
            className="instrument-needle-body"
            d={needleShape(geometry, -22)}
          />
        </g>
      </svg>
    </div>
  );
});
