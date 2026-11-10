import { useEffect, useState } from "react";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { Brand } from "./Brand";
import { SplitButton } from "./SplitButton";
import { siteConfig } from "../config/site.config";
const links = [
  { label: "Услуги", href: "#services" },
  { label: "Работы", href: "#works" },
  { label: "Гарантия", href: "#warranty" },
  { label: "Контакты", href: "#contacts" },
];
export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const update = () => {
      const bottom =
        document.getElementById("top")?.getBoundingClientRect().bottom ?? 0;
      setScrolled(bottom <= 80);
      if (window.innerWidth >= 1000) setOpen(false);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    const escape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", escape);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      window.removeEventListener("keydown", escape);
    };
  }, []);
  return (
    <header className={`header-notch${scrolled ? " header-detached" : ""}`}>
      <div className="notch-inner">
        <Brand />
        <nav className="notch-links" aria-label="Разделы сайта">
          {links.map(({ label, href }) => (
            <a key={href} href={href}>
              {label}
            </a>
          ))}
        </nav>
        <div className="notch-actions">
          <a
            className="notch-telegram"
            href={siteConfig.telegram}
            target="_blank"
            rel="noreferrer"
          >
            Telegram
          </a>
          <SplitButton compact>Записаться</SplitButton>
          <button
            className="notch-menu-toggle"
            type="button"
            aria-label={open ? "Закрыть меню" : "Открыть меню"}
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen(!open)}
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>
      {open && (
        <nav
          className="notch-mobile-nav"
          id="mobile-menu"
          aria-label="Мобильная навигация"
        >
          {links.map(({ label, href }) => (
            <a key={href} href={href} onClick={() => setOpen(false)}>
              {label}
            </a>
          ))}
          <a
            href={siteConfig.telegram}
            target="_blank"
            rel="noreferrer"
            onClick={() => setOpen(false)}
          >
            Записаться в Telegram <ArrowUpRight size={20} />
          </a>
        </nav>
      )}
    </header>
  );
}
