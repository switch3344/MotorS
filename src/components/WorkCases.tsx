import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { CSSProperties, PointerEvent } from "react";
import { ArrowLeft, ArrowRight, ArrowUpRight, Expand, X } from "lucide-react";
import { workPhotos } from "../config/content.config";
import { siteConfig } from "../config/site.config";
import { TechHeadingRun } from "./TechText/TechHeadingRun";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { gsap } from "../lib/scroll";

const count = workPhotos.length;
const wrap = (index: number) => ((index % count) + count) % count;
const offsetFrom = (index: number, active: number) =>
  wrap(index - active + Math.floor(count / 2)) - Math.floor(count / 2);
const photoUrl = (file: string) =>
  `${import.meta.env.BASE_URL}images/works/${file}.jpg`;

export function WorkCases() {
  const [position, setPosition] = useState(0);
  const [opened, setOpened] = useState<number | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const gallery = useRef<HTMLDivElement>(null);
  const pointer = useRef<{ x: number; y: number } | null>(null);
  const suppressClickUntil = useRef(0);
  const progress = useRef({ value: 0 });
  const reduced = useReducedMotion();
  const active = wrap(position);
  const current = workPhotos[active];
  const enlarged = opened === null ? null : workPhotos[opened];
  const step = (direction: number) => setPosition((value) => value + direction);
  useLayoutEffect(() => {
    const cards = gallery.current?.querySelectorAll<HTMLButtonElement>(".work-gallery-photo");
    if (!cards) return;
    const paint = () => {
      cards.forEach((card, index) => {
        // Recycle a card only on the invisible back of the ribbon. A single
        // continuous cursor keeps 08 → 01 identical to every other step.
        const offset = offsetFrom(index, progress.current.value);
        const distance = Math.abs(offset);
        const fade = Math.max(0, Math.min(1, (2.85 - distance) / 0.65));
        const opacity = (1 - Math.min(distance, 2.2) * 0.045) * fade * fade * (3 - 2 * fade);
        card.style.setProperty("--slot", String(offset));
        card.style.setProperty("--distance", String(distance));
        card.style.opacity = String(opacity);
        card.style.zIndex = String(10 - Math.round(distance));
      });
    };
    paint();
    const tween = gsap.to(progress.current, {
      value: position,
      duration: reduced ? 0 : 0.5,
      ease: "power3.out",
      onUpdate: paint,
      overwrite: true,
    });
    return () => { tween.kill(); };
  }, [position, reduced]);
  const close = () => {
    dialog.current?.close();
    setOpened(null);
    gallery.current
      ?.querySelector<HTMLButtonElement>('[data-active="true"]')
      ?.focus({ preventScroll: true });
  };
  const nextPhoto = (direction: number) => {
    setOpened((value) => (value === null ? null : wrap(value + direction)));
    step(direction);
  };
  useEffect(() => {
    if (opened === null) return;
    const element = dialog.current!;
    if (!element.open) element.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [opened]);
  const finishSwipe = (event: PointerEvent<HTMLDivElement>) => {
    if (!pointer.current) return;
    const dx = event.clientX - pointer.current.x;
    const dy = event.clientY - pointer.current.y;
    pointer.current = null;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
      suppressClickUntil.current = Date.now() + 350;
      step(dx < 0 ? 1 : -1);
    }
  };
  return (
    <section
      className="content-card cases-section"
      id="works"
      aria-labelledby="works-heading"
    >
      <div className="content-heading">
        <div>
          <h2 id="works-heading">
            <TechHeadingRun text="Внутри " />
            <em>
              <TechHeadingRun text="мастерской" />
            </em>
          </h2>
        </div>
        <a href={siteConfig.telegram} target="_blank" rel="noreferrer">
          Канал сервиса <ArrowUpRight size={18} strokeWidth={1.5} />
        </a>
      </div>
      <div
        className="work-gallery"
        ref={gallery}
        role="region"
        aria-label="Фотографии работ"
        aria-roledescription="карусель"
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
            event.preventDefault();
            step(event.key === "ArrowLeft" ? -1 : 1);
          }
        }}
      >
        <div
          className="work-gallery-stage"
          onPointerDown={(event) => {
            pointer.current = { x: event.clientX, y: event.clientY };
            suppressClickUntil.current = 0;
          }}
          onPointerUp={finishSwipe}
          onPointerCancel={() => {
            pointer.current = null;
          }}
          onPointerLeave={() => {
            pointer.current = null;
          }}
          onClickCapture={(event) => {
            if (Date.now() < suppressClickUntil.current) {
              event.preventDefault();
              event.stopPropagation();
              suppressClickUntil.current = 0;
            }
          }}
        >
          {workPhotos.map((photo, index) => {
            const offset = offsetFrom(index, active);
            const hidden = Math.abs(offset) > 2;
            return (
              <button
                className="work-gallery-photo"
                type="button"
                key={photo.file}
                style={
                  {
                    "--slot": offsetFrom(index, 0),
                    "--distance": Math.abs(offsetFrom(index, 0)),
                  } as CSSProperties
                }
                data-outside={hidden}
                data-active={index === active}
                tabIndex={hidden ? -1 : 0}
                aria-hidden={hidden}
                aria-label={`Открыть фото: ${photo.title}`}
                onClick={() => {
                  setPosition(
                    (value) => value + offsetFrom(index, wrap(value)),
                  );
                  setOpened(index);
                }}
              >
                <img
                  src={photoUrl(photo.file)}
                  alt={photo.alt}
                  width="800"
                  height="800"
                  loading="lazy"
                  decoding="async"
                  draggable={false}
                />
                <span className="work-gallery-expand" aria-hidden="true">
                  <Expand size={18} strokeWidth={1.5} />
                </span>
              </button>
            );
          })}
        </div>
        <div
          className="work-gallery-caption"
          key={active}
          aria-live="polite"
          aria-atomic="true"
        >
          <h3>{current.title}</h3>
          <p>D4EB · Hyundai Santa Fe</p>
        </div>
        <div className="work-gallery-controls">
          <button
            type="button"
            onClick={() => step(-1)}
            aria-label="Предыдущее фото"
          >
            <ArrowLeft size={18} strokeWidth={1.5} />
          </button>
          <span className="work-gallery-count">
            <span>{String(active + 1).padStart(2, "0")}</span> /{" "}
            {String(count).padStart(2, "0")}
          </span>
          <button
            type="button"
            onClick={() => step(1)}
            aria-label="Следующее фото"
          >
            <ArrowRight size={18} strokeWidth={1.5} />
          </button>
        </div>
      </div>
      <dialog
        ref={dialog}
        className="work-lightbox"
        aria-labelledby="work-photo-title"
        onCancel={(event) => {
          event.preventDefault();
          close();
        }}
        onClose={() => setOpened(null)}
        onClick={(event) => {
          if (event.target === event.currentTarget) close();
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
            event.preventDefault();
            nextPhoto(event.key === "ArrowLeft" ? -1 : 1);
          }
        }}
      >
        {enlarged && (
          <>
            <div className="work-lightbox-top">
              <div>
                <h3 id="work-photo-title">{enlarged.title}</h3>
                <p>D4EB · Hyundai Santa Fe</p>
              </div>
              <button
                type="button"
                onClick={close}
                aria-label="Закрыть фото"
                autoFocus
              >
                <X size={18} strokeWidth={1.5} />
              </button>
            </div>
            <div className="work-lightbox-media">
              <img
                src={photoUrl(enlarged.file)}
                alt={enlarged.alt}
                width="800"
                height="800"
              />
              <button
                className="work-lightbox-previous"
                type="button"
                onClick={() => nextPhoto(-1)}
                aria-label="Предыдущее фото"
              >
                <ArrowLeft size={18} strokeWidth={1.5} />
              </button>
              <button
                className="work-lightbox-next"
                type="button"
                onClick={() => nextPhoto(1)}
                aria-label="Следующее фото"
              >
                <ArrowRight size={18} strokeWidth={1.5} />
              </button>
            </div>
            <div className="work-lightbox-bottom">
              <span>
                {String(opened! + 1).padStart(2, "0")} /{" "}
                {String(count).padStart(2, "0")}
              </span>
              <a href={enlarged.source} target="_blank" rel="noreferrer">
                Фото из канала сервиса <ArrowUpRight size={18} strokeWidth={1.5} />
              </a>
            </div>
          </>
        )}
      </dialog>
    </section>
  );
}
