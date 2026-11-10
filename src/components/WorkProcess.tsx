export function WorkProcess() {
  return (
    <section
      className="work-process"
      id="works"
      aria-labelledby="works-heading"
    >
      <p className="v12-eyebrow">Работы</p>
      <h2 id="works-heading">От диагностики до сборки.</h2>
      <ol>
        <li>
          <span>01</span>
          <h3>Проверка двигателя</h3>
          <p>
            Находим причину неисправности и разбираем результаты диагностики.
          </p>
        </li>
        <li>
          <span>02</span>
          <h3>Согласование ремонта</h3>
          <p>Определяем объём работ, стоимость и сроки после проверки.</p>
        </li>
        <li>
          <span>03</span>
          <h3>Сборка и контроль</h3>
          <p>
            Восстанавливаем детали, собираем двигатель и проверяем результат.
          </p>
        </li>
      </ol>
      <div className="warranty-band" id="warranty">
        <h2>
          Гарантия <em>5 лет.</em>
        </h2>
        <p>
          На капитальный ремонт двигателя. Условия гарантии и объём работ
          согласуем при обращении.
        </p>
      </div>
    </section>
  );
}
