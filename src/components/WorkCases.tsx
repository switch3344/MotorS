import { ArrowUpRight } from "lucide-react";
import { cases } from "../config/content.config";
import { siteConfig } from "../config/site.config";

export function WorkCases() {
  return (
    <section
      className="content-card cases-section"
      id="works"
      aria-labelledby="works-heading"
    >
      <div className="content-heading">
        <div>
          <p className="v12-eyebrow">Работы</p>
          <h2 id="works-heading">
            Пробег. Дефектовка. <em>Ремонт.</em>
          </h2>
        </div>
        <a href={siteConfig.telegram} target="_blank" rel="noreferrer">
          Канал сервиса <ArrowUpRight size={18} />
        </a>
      </div>
      <div className="cases-grid">
        {cases.map((item) => (
          <article className="case-card" key={item.engine}>
            <div
              className="case-photo"
              role="img"
              aria-label={`Фотография ${item.car} пока не предоставлена`}
            >
              {"{{PHOTO}}"}
            </div>
            <div className="case-heading">
              <span>{item.engine}</span>
              <p>{item.mileage}</p>
            </div>
            <h3>{item.car}</h3>
            <dl className="case-details">
              <div>
                <dt>Нашли</dt>
                <dd>{item.found}</dd>
              </div>
              {item.decision && (
                <div>
                  <dt>Вывод</dt>
                  <dd>{item.decision}</dd>
                </div>
              )}
              <div>
                <dt>Сделали</dt>
                <dd>{item.done}</dd>
              </div>
              <div>
                <dt>Гарантия</dt>
                <dd>{item.warranty}</dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
    </section>
  );
}
