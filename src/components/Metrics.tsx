import { metrics } from "../config/content.config";

export function Metrics() {
  return (
    <section className="metrics-strip" aria-label="MotorServiceKRD в цифрах">
      <dl>
        {metrics.map((metric, index) => (
          <div key={metric.value}>
            <dt>{metric.label}</dt>
            <dd
              className={
                index > 1 ? "metric-value metric-value-text" : "metric-value"
              }
            >
              {metric.value}
            </dd>
            <dd className="metric-detail">{metric.detail}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
