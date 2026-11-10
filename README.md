# MotorServiceKRD — v3.3

Сайт автосервиса на React + TypeScript + Vite, Tailwind CSS, GSAP и Three.js.

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

- Hero со спидометром 0–240 км/ч: семь подписей, крупная скорость, короткая стрелка, подсветка шкалы.
- Под дугой находится тёмный poster дороги с градиентом. Видео ещё не предоставлено.
- Двигатель находится в постоянной левой колонке; услуги всегда видны, «Диагностика» открыта по умолчанию. На телефоне список следует за моделью.
- Наведение раскрывает двигатель плавно, без изменения размеров WebGL-холста. Кнопка под холстом переключает сборку. При разборке модель получает масштаб 0.88 и опускается.
- Надписи с модели и подпись V12 под ней удалены. Генератор новой модели также не создаёт надписи.
- Восстановлен футер с вырезом. Ссылки шапки ведут к услугам, этапам работ, гарантии и контактам.
- Системная настройка уменьшения движения останавливает спидометр на 120 км/ч и отключает анимацию разборки.

## Видео для hero

Добавьте `public/video/hero.webm` и/или `public/video/hero.mp4` размером до 8 МБ на файл. При необходимости добавьте `public/video/hero.jpg` как poster. `predev` и `prebuild` формируют `src/config/media.generated.json` автоматически. Пока файлов нет, используется `public/video/road-poster.svg`.

## GitHub Pages

Workflow `.github/workflows/deploy.yml` устанавливает зависимости через `npm ci`, собирает проект и публикует `dist` после push в `main`. В Settings → Pages выбран GitHub Actions.

В workflow задан `VITE_BASE_PATH=/MotorS/`. Локально используется `/`. При переименовании репозитория обновите префикс в workflow.

Настройка основана на официальных инструкциях [Vite](https://vite.dev/guide/static-deploy.html#github-pages) и [GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

## Модель

Текущий двигатель — оригинальная модель из `scripts/generate-v12.py`, экспортированная в `public/models/motorservice-v12.glb`. Исходный `.blend` и студийный снимок сохранены в `assets-source/v12` как исторические материалы. Для удаления надписей из прежнего GLB используется `node scripts/remove-model-lettering.mjs`; `--check` проверяет их отсутствие без записи.

Предоставленный ранее LS V8 и его подготовка сохранены отдельно; текущая страница его не использует.

## React Bits

`components.json` содержит конфигурацию shadcn и реестров React Bits. Для установки платных компонентов нужен `REACTBITS_LICENSE_KEY` в окружении или игнорируемом `.env.local`. Клиентский код не содержит ключа и не обращается к MCP. Hero и прибор выполнены на SVG/CSS/GSAP.

## Проверка

Фактические проверки v3.3 и снимки перечислены в `QUALITY.md`.
