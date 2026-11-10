import { siteConfig } from "../config/site.config";

export function OriginalParts() {
  return (
    <section
      className="content-card original-section"
      aria-labelledby="original-heading"
    >
      <p className="v12-eyebrow">Почему мы</p>
      <h2 id="original-heading">
        Оригинал <em>или ничего.</em>
      </h2>
      <p className="original-lead">
        Проверяем запчасти до установки. Подделку можно отличить только опытом.
      </p>
      <div className="original-grid">
        <article>
          <span>01</span>
          <h3>Оригинальные узлы</h3>
          <p>
            Подделки не ставим. Ибо сказано: подделка не выдерживает компрессии.
          </p>
        </article>
        <article>
          <span>02</span>
          <h3>Проверка поставщиков</h3>
          <p>Проверяем поставщиков и детали до установки в двигатель.</p>
        </article>
        <article>
          <span>03</span>
          <h3>Детали и работа</h3>
          <p>
            Гарантия на детали и на работу: {"{{подтвердить формулировку}}"}.
          </p>
        </article>
      </div>
      <div className="warranty-band" id="warranty">
        <h2>
          <em>{siteConfig.warranty}</em>
        </h2>
        <p>
          На капитальный ремонт двигателя.
          <br />
          Условия гарантии: {"{{подтвердить}}"}.
        </p>
      </div>
    </section>
  );
}
