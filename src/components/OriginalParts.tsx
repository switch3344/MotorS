import { siteConfig } from "../config/site.config";
import { TechHeadingRun } from "./TechText/TechHeadingRun";

export function OriginalParts() {
  const [years, distance] = siteConfig.warranty.split(" или ");
  return (
    <section
      className="content-card original-section"
      aria-labelledby="original-heading"
    >
      <h2 id="original-heading">
        <TechHeadingRun text="Оригинал " />
        <em>
          <TechHeadingRun text="или ничего" />
        </em>
      </h2>
      <p className="original-lead">
        Проверяем запчасти до установки. Подделку можно отличить только опытом.
      </p>
      <div className="original-grid">
        <article>
          <h3>Оригинальные узлы</h3>
          <p>
            Подделки не ставим. Ибо сказано: подделка не выдерживает компрессии.
          </p>
        </article>
        <article>
          <h3>Проверка поставщиков</h3>
          <p>Проверяем поставщиков и детали до установки в двигатель.</p>
        </article>
        <article>
          <h3>Детали и работа</h3>
          <p>На капитальный ремонт — {siteConfig.warranty}.</p>
        </article>
      </div>
      <div className="warranty-band" id="warranty">
        <h2>
          <em>
            <TechHeadingRun text={years} /> или{" "}
            <TechHeadingRun text={distance} />
          </em>
        </h2>
        <p>На капитальный ремонт двигателя.</p>
      </div>
    </section>
  );
}
