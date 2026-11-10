import { ArrowUpRight } from "lucide-react";
import type { Service } from "../../config/services.config";
export function ServicesPanel({ service }: { service: Service }) {
  return (
    <aside
      className="service-detail"
      id="service-panel"
      role="tabpanel"
      aria-labelledby={`service-${service.id}`}
    >
      <h3>{service.name}</h3>
      <p>{service.description}</p>
      <ol>
        {service.steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
      <dl>
        <div>
          <dt>Срок:</dt>
          <dd>{service.days}</dd>
        </div>
        <div>
          <dt>Цена от</dt>
          <dd>{service.price}</dd>
        </div>
      </dl>
      <a
        className="button button-primary"
        href={`https://t.me/MSERVICEKRD?text=${encodeURIComponent(`Здравствуйте! Интересует услуга «${service.name}».`)}`}
        target="_blank"
        rel="noreferrer"
      >
        Записаться <ArrowUpRight size={20} />
      </a>
    </aside>
  );
}
