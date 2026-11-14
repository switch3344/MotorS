import { Component, Suspense, lazy, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { ArrowDownRight } from "lucide-react";
import { services } from "../../config/services.config";
import { siteConfig } from "../../config/site.config";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { TechHeadingRun } from "../TechText/TechHeadingRun";
const CanvasScene = lazy(() => import("./CanvasScene"));

class SceneBoundary extends Component<
  { children: ReactNode; onReady?: () => void },
  { error: boolean }
> {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  render() {
    return this.state.error ? (
      <div className="v12-fallback">
        <img
          src={`${import.meta.env.BASE_URL}images/inline4-poster.png`}
          alt="Рядный четырёхцилиндровый двигатель в разрезе"
          onLoad={this.props.onReady}
          onError={this.props.onReady}
        />
        <p>Выберите услугу, чтобы узнать о ремонте.</p>
      </div>
    ) : (
      this.props.children
    );
  }
}

export function EngineScene({
  preloading = false,
  onReady,
}: {
  preloading?: boolean;
  onReady?: () => void;
}) {
  const section = useRef<HTMLElement>(null);
  const [near, setNear] = useState(preloading);
  const [visible, setVisible] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [active, setActive] = useState<number | null>(0);
  const [mobile, setMobile] = useState(() => window.innerWidth < 800);
  const reduced = useReducedMotion();
  const [playing, setPlaying] = useState(!reduced);
  useEffect(() => {
    if (reduced) setPlaying(false);
  }, [reduced]);
  useEffect(() => {
    const updateModal = () =>
      setModalOpen(!!document.querySelector("dialog[open]"));
    const modalObserver = new MutationObserver(updateModal);
    modalObserver.observe(document.body, {
      attributes: true,
      attributeFilter: ["open"],
      subtree: true,
    });
    updateModal();
    const preload = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setNear(true);
          preload.disconnect();
        }
      },
      { rootMargin: "180px" },
    );
    const observer = new IntersectionObserver(([entry]) =>
      setVisible(entry.isIntersecting),
    );
    if (section.current) {
      preload.observe(section.current);
      observer.observe(section.current);
    }
    const query = window.matchMedia("(max-width: 799px)");
    const update = () => setMobile(query.matches);
    query.addEventListener("change", update);
    return () => {
      modalObserver.disconnect();
      preload.disconnect();
      observer.disconnect();
      query.removeEventListener("change", update);
    };
  }, []);
  return (
    <section
      className="v12-section"
      data-model="inline4-working"
      id="services"
      ref={section}
      aria-labelledby="services-heading"
    >
      <div className="v12-heading">
        <div>
          <h2 id="services-heading" aria-label="Диагностика и капремонт">
            <TechHeadingRun text="Диагностика" />
            <br />и{" "}
            <em>
              <TechHeadingRun text="капремонт" />
            </em>
          </h2>
        </div>
      </div>
      <div className="v12-stage">
        <div className="v12-engine-column">
          <div
            className="v12-engine-viewport"
            id="engine-model"
            role="button"
            tabIndex={0}
            aria-pressed={playing}
            aria-label={
              playing ? "Приостановить работу двигателя" : "Запустить двигатель"
            }
            onClick={() => setPlaying((value) => !value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                setPlaying((value) => !value);
              }
            }}
          >
            <SceneBoundary onReady={onReady}>
              <Suspense
                fallback={<div className="v12-loader">Загружаем модель…</div>}
              >
                {near && (
                  <CanvasScene
                    playing={playing}
                    mobile={mobile}
                    visible={visible && !modalOpen}
                    warming={preloading}
                    onReady={onReady}
                  />
                )}
              </Suspense>
            </SceneBoundary>
          </div>
        </div>
        <div className="v12-services-reveal" id="engine-services">
          <div className="v12-services">
            <p className="v12-services-title">Услуги</p>
            <div className="v12-service-list">
              {services.map((service, index) => (
                <div
                  className={`v12-service${active === index ? " v12-service-active" : ""}`}
                  key={service.id}
                >
                  <h3>
                    <button
                      type="button"
                      id={`v12-service-${service.id}`}
                      aria-expanded={active === index}
                      aria-controls={`v12-detail-${service.id}`}
                      onClick={() => setActive(active === index ? null : index)}
                    >
                      <span>{service.name}</span>
                      <span className="v12-service-icon" aria-hidden="true" />
                    </button>
                  </h3>
                  <div
                    className="v12-service-panel"
                    id={`v12-detail-${service.id}`}
                    role="region"
                    aria-labelledby={`v12-service-${service.id}`}
                    aria-hidden={active !== index}
                    inert={active !== index}
                  >
                    <div className="v12-service-clip">
                      <div className="v12-service-detail">
                        <p>{service.description}</p>
                        <ul>
                          {service.steps.map((step) => (
                            <li key={step}>{step}</li>
                          ))}
                        </ul>
                        <a
                          href={`${siteConfig.telegram}?text=${encodeURIComponent(`Здравствуйте! Интересует ${service.name.toLowerCase()}.`)}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Обсудить ремонт <ArrowDownRight size={18} strokeWidth={1.5} />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <p className="v12-service-note">
              Стоимость и сроки определим после диагностики.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
