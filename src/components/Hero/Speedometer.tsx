import { forwardRef } from "react";

export const RADIUS = 1967;
export const CENTER_X = 800;
export const MAX_SPEED = 240;
export const angleForSpeed = (speed: number) => -22 + (speed / MAX_SPEED) * 44;
const radians = (degrees: number) => (degrees * Math.PI) / 180;
function point(angle: number, radius: number, cy: number) {
  return {
    x: CENTER_X + radius * Math.sin(radians(angle)),
    y: cy - radius * Math.cos(radians(angle)),
  };
}
function arc(from: number, to: number, cy: number, radius = RADIUS) {
  const a = point(from, radius, cy);
  const b = point(to, radius, cy);
  return `M ${a.x} ${a.y} A ${radius} ${radius} 0 0 1 ${b.x} ${b.y}`;
}
export interface GaugeGeometry {
  cy: number;
  top: number;
  mobile: boolean;
  labelSize: number;
  bottom: number;
}

export const Speedometer = forwardRef<
  HTMLDivElement,
  { geometry: GaugeGeometry }
>(function Speedometer({ geometry }, ref) {
  const { cy, top, mobile, labelSize, bottom } = geometry;
  const labels = [0, 40, 80, 120, 160, 200, 240];
  const needleTip = cy - RADIUS + 44;
  const tailRadius = Math.max(
    RADIUS - 44 - (mobile ? 520 : 300),
    (cy - bottom + 32) / Math.cos(radians(22)),
  );
  const needleTail = Math.max(needleTip + 60, cy - tailRadius);
  const needleWidth = mobile ? 10 : 4;
  return (
    <div
      className="arc-meter"
      ref={ref}
      role="meter"
      aria-label="Скорость"
      aria-valuemin={0}
      aria-valuemax={MAX_SPEED}
      aria-valuenow={0}
      aria-valuetext="0 километров в час"
    >
      <svg
        className="arc-geometry"
        viewBox="0 0 1600 900"
        preserveAspectRatio="xMidYMid slice"
        style={{ top }}
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="arc-metal" x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="#f3f5f8" stopOpacity=".38" />
            <stop offset=".45" stopColor="#737b86" stopOpacity=".12" />
            <stop offset="1" stopColor="#dce1e8" stopOpacity=".22" />
          </linearGradient>
          <linearGradient
            id="arc-accent"
            x1="0"
            y1="0"
            x2="1600"
            y2="0"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#ac2338" />
            <stop offset=".7" stopColor="#ed4058" />
            <stop offset="1" stopColor="#ff7a87" />
          </linearGradient>
          <filter id="arc-glow" x="-30%" y="-100%" width="160%" height="300%">
            <feGaussianBlur stdDeviation="4" />
          </filter>
          <filter
            id="needle-glow"
            x="-1000%"
            y="-20%"
            width="2100%"
            height="140%"
          >
            <feGaussianBlur stdDeviation="5" />
          </filter>
          <linearGradient
            id="needle-accent"
            x1="800"
            y1={cy}
            x2="800"
            y2={cy - RADIUS + 30}
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#a21930" stopOpacity="0" />
            <stop offset=".72" stopColor="#d52c45" stopOpacity=".2" />
            <stop offset=".95" stopColor="#f44a62" />
            <stop offset="1" stopColor="#ff8b96" />
          </linearGradient>
        </defs>
        <path className="arc-channel" d={arc(-24, 24, cy, RADIUS - 18)} />
        <path className="arc-bezel" d={arc(-24, 24, cy, RADIUS + 12)} />
        <path className="arc-inner-edge" d={arc(-24, 24, cy, RADIUS - 48)} />
        <path className="arc-baseline" d={arc(-24, 24, cy)} />
        <path
          className="arc-redline-band"
          d={arc(angleForSpeed(200), 22, cy, RADIUS - 30)}
        />
        <path className="arc-redline" d={arc(angleForSpeed(200), 24, cy)} />
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
        {Array.from({ length: 61 }, (_, index) => {
          const speed = index * 4;
          const major = speed % 40 === 0;
          const medium = !major && speed % 20 === 0;
          const a = point(angleForSpeed(speed), RADIUS, cy);
          const b = point(
            angleForSpeed(speed),
            RADIUS - (major ? 38 : medium ? 26 : 13),
            cy,
          );
          return (
            <line
              key={speed}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              data-speed={speed}
              className={`arc-tick${major ? " arc-tick-major" : medium ? " arc-tick-medium" : ""}${speed >= 200 ? " arc-tick-red" : ""}`}
            />
          );
        })}
        {labels.map((value) => {
          const angle = angleForSpeed(value);
          const p = point(angle, RADIUS + (mobile ? 68 : 38), cy);
          return (
            <text
              key={value}
              x={p.x}
              y={p.y}
              textAnchor={
                mobile && value === 0
                  ? "start"
                  : mobile && value === 240
                    ? "end"
                    : "middle"
              }
              dominantBaseline="central"
              transform={`rotate(${angle} ${p.x} ${p.y})`}
              fontSize={labelSize}
              data-speed={value}
              className={value >= 200 ? "arc-label arc-label-red" : "arc-label"}
            >
              {value}
            </text>
          );
        })}
        <g className="arc-needle" transform={`rotate(-22 ${CENTER_X} ${cy})`}>
          <line
            x1={CENTER_X}
            y1={needleTail}
            x2={CENTER_X}
            y2={needleTip + 3}
            className="needle-light"
            filter="url(#needle-glow)"
          />
          <path
            d={`M ${CENTER_X} ${needleTip} L ${CENTER_X + needleWidth} ${needleTip + 45} L ${CENTER_X + needleWidth * 0.6} ${needleTail} L ${CENTER_X - needleWidth * 0.6} ${needleTail} L ${CENTER_X - needleWidth} ${needleTip + 45} Z`}
            className="needle-core"
          />
          <line
            className="needle-highlight"
            x1={CENTER_X}
            y1={needleTip + 5}
            x2={CENTER_X}
            y2={needleTip + 54}
          />
        </g>
      </svg>
      <p className="arc-speed-readout" aria-hidden="true">
        <span className="arc-speed-value">0</span>
        <span className="arc-speed-unit">км/ч</span>
      </p>
    </div>
  );
});
