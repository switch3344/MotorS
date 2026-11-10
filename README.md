# MotorServiceKRD — v4.7

Сайт автосервиса на React + TypeScript + Vite, Tailwind CSS, GSAP и Three.js. Текущая версия включает контент v4.1, однотонный футер v4.3 и очистку hero v4.6–v4.7.

- Сайт: https://switch3344.github.io/MotorS/
- Репозиторий: https://github.com/switch3344/MotorS

## Запуск и сборка

```powershell
npm ci
npm run dev
npm run check
npm run build
npm run preview
```

## Текущая версия

- Hero со шкалой 0–8 и анимированной стрелкой. Цифровое табло и единицы измерения удалены; безель и шум удалены целиком.
- Фон hero и тёмных секций однотонный #101113 / #0A0A0A, без зерна и тональных градиентов. Свечение осталось только на заполненной дуге и кончике стрелки, blur не больше 8.
- Полоса показателей и карточки D4EB / Santa Fe, D4HE / Carnival, 1VD-FTV / Land Cruiser 200.
- Контент ограничен фактами пользовательского ТЗ v4.1, атрибутированного @MSERVICEKRD. Неизвестные данные обозначены `{{...}}`.
- Список услуг всегда виден, «Диагностика» открыта по умолчанию. Разборка модели плавная, размер холста постоянный; кнопка находится ниже. Камера учитывает ширину и высоту холста и границы всех деталей, оставляя запас от краёв при сборке, разборке и изменении окна.
- Футер — #0A0A0A без декоративной подложки, с сохранённым фигурным вырезом.
- При reduced-motion прибор остаётся на 4800 об/мин, разборка меняется без анимации.

## Видео для hero

Открытый Telegram-плеер ролика https://t.me/MSERVICEKRD/1363 не предоставил файл видео. До получения исходника действует однотонный фон согласно v4.7.

Для готового ролика: 10–15 секунд, без звука, до 8 МБ; файлы `public/video/hero.webm` и/или `public/video/hero.mp4`, poster `public/video/hero.jpg`. `predev` и `prebuild` формируют `src/config/media.generated.json`. Плеер учитывает reduced-motion, видимость hero и вкладки.

## GitHub Pages

Workflow `.github/workflows/deploy.yml` собирает и публикует `dist` после push в `main`; доступен ручной workflow_dispatch. Источник Pages — GitHub Actions. В workflow задан `VITE_BASE_PATH=/MotorS/`; локально используется `/`.

## Контент и модели

- `src/config/content.config.ts` — показатели и кейсы.
- `src/config/site.config.ts` — контакты и общая гарантия; телефон пока не подтверждён.
- `src/components/Hero/Instrument.tsx` и `useInstrumentMotion.ts` — прибор и его движение.
- `public/models/motorservice-v12.glb` — оригинальная презентационная 3D-модель, созданная `scripts/generate-v12.py`; надписи удалены. Исторические `.blend` и студийный снимок находятся в `assets-source/v12`.
- Предоставленный ранее LS V8 сохранён отдельно и не используется текущей страницей.

## React Bits

`components.json` сохраняет конфигурацию shadcn и реестров React Bits. Для установки платных компонентов нужен `REACTBITS_LICENSE_KEY` в окружении или игнорируемом `.env.local`. Клиент не содержит ключа и не обращается к MCP. Hero и прибор выполнены на SVG/CSS/GSAP.

## Проверка и история

`QUALITY.md` содержит проверку v4.7; предыдущий отчёт сохранён в `docs/QUALITY-v4.4.md`. Предыдущая v3.3 опубликована до перехода к v4.1; её коммит `bcbe3ee`, отчёт `docs/QUALITY-v3.3.md` и снимки сохранены.
