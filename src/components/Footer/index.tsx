import { ArrowUpRight, MapPin, Send } from "lucide-react";
import { siteConfig } from "../../config/site.config";
export function Footer() {
  return (
    <footer className="footer" id="contacts">
      <svg width="0" height="0" className="clip-definition" aria-hidden="true">
        <defs>
          <clipPath id="footer-cutout" clipPathUnits="objectBoundingBox">
            <path d="M0 .055 Q0 0 .035 0 H.29 Q.315 0 .335 .035 L.355 .065 Q.365 .08 .385 .08 H.615 Q.635 .08 .645 .065 L.665 .035 Q.685 0 .71 0 H.965 Q1 0 1 .055 V1 H0Z" />
          </clipPath>
        </defs>
      </svg>
      <div className="footer-surface">
        <div className="section-shell">
          <a
            className="footer-wordmark"
            href="#top"
            aria-label="motorservicekrd — наверх"
          >
            <img
              src={`${import.meta.env.BASE_URL}brand/logo.png`}
              alt=""
              width="866"
              height="866"
              loading="lazy"
            />
            <span>
              motorservice<small>krd</small>
            </span>
          </a>
          <div className="footer-center-links">
            <a href={siteConfig.telegram} target="_blank" rel="noreferrer">
              Записаться <ArrowUpRight size={18} />
            </a>
            <span>—</span>
            <a href="#services">Услуги</a>
          </div>
          <div className="footer-socials">
            <a
              className="circle-button"
              href={siteConfig.telegram}
              target="_blank"
              rel="noreferrer"
              aria-label="MotorServiceKRD в Telegram"
            >
              <Send size={22} />
            </a>
            <a
              className="circle-button"
              href={siteConfig.mapUrl}
              target="_blank"
              rel="noreferrer"
              aria-label="Адрес на карте"
            >
              <MapPin size={22} />
            </a>
          </div>
          <a
            className="footer-address"
            href={siteConfig.mapUrl}
            target="_blank"
            rel="noreferrer"
          >
            {siteConfig.address}
            <ArrowUpRight size={16} />
          </a>
          <p className="footer-phone">{siteConfig.phone}</p>
          <div className="footer-legal">
            <p>© 2026 MotorServiceKRD. Все права защищены.</p>
            <p>Краснодар · Ремонт двигателей</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
