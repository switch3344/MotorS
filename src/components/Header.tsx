import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import { Brand } from "./Brand";
import { SplitButton } from "./SplitButton";
const links = [
  { label: "Услуги", href: "#services" },
  { label: "Работы", href: "#works" },
  { label: "Гарантия", href: "#warranty" },
  { label: "Контакты", href: "#contacts" },
];
export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("");
  const header = useRef<HTMLElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const navigating = useRef("");
  const navigationTimer = useRef(0);
  const [surface, setSurface] = useState({ width: 1280, height: 96, wing: 32 });
  useLayoutEffect(() => {
    const element = header.current;
    if (!element) return;
    const measure = () => {
      const { width, height } = element.getBoundingClientRect();
      const wing = window.innerWidth < 700 ? 16 : 32;
      setSurface((previous) =>
        Math.abs(previous.width - width) < 0.5 &&
        Math.abs(previous.height - height) < 0.5 &&
        previous.wing === wing
          ? previous
          : { width, height, wing },
      );
    };
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    measure();
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      // Release the attached notch as soon as the page moves, so its corner
      // cutouts never sit over scrolling footage.
      setScrolled(window.scrollY > 0.5);
      if (window.innerWidth >= 1000) setOpen(false);
      if (navigating.current) return;
      const line = (header.current?.getBoundingClientRect().bottom ?? 80) + 32;
      let current = "";
      for (const { href } of links) {
        const target = document.getElementById(href.slice(1));
        if (target && target.getBoundingClientRect().top <= line)
          current = href;
      }
      if (
        window.scrollY + window.innerHeight >=
        document.documentElement.scrollHeight - 4
      )
        current = "#contacts";
      setActive(current);
    };
    const schedule = () => {
      // Geometry must update even when scrollend arrives before the next frame.
      setScrolled(window.scrollY > 0.5);
      if (!frame) frame = requestAnimationFrame(update);
    };
    const finishNavigation = () => {
      window.clearTimeout(navigationTimer.current);
      navigating.current = "";
      // Short sections near the page bottom can share the same final scroll
      // position. Keep the clicked destination until the next actual scroll.
      cancelAnimationFrame(frame);
      frame = 0;
    };
    const hashChanged = () => {
      const href = window.location.hash;
      if (links.some((link) => link.href === href)) {
        setActive(href);
        navigating.current = href;
        window.clearTimeout(navigationTimer.current);
        navigationTimer.current = window.setTimeout(() => {
          navigating.current = "";
        }, 1500);
      } else {
        navigating.current = "";
        setActive("");
      }
    };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    window.addEventListener("scrollend", finishNavigation);
    window.addEventListener("hashchange", hashChanged);
    const escape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        if (header.current?.contains(document.activeElement))
          toggle.current?.focus();
      }
    };
    const outside = (event: globalThis.PointerEvent) => {
      if (!header.current?.contains(event.target as Node)) setOpen(false);
    };
    window.addEventListener("keydown", escape);
    document.addEventListener("pointerdown", outside);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(navigationTimer.current);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("scrollend", finishNavigation);
      window.removeEventListener("hashchange", hashChanged);
      window.removeEventListener("keydown", escape);
      document.removeEventListener("pointerdown", outside);
    };
  }, []);
  const select = (href: string) => {
    setOpen(false);
    setActive(href);
    navigating.current = href;
    window.clearTimeout(navigationTimer.current);
    navigationTimer.current = window.setTimeout(() => {
      navigating.current = "";
    }, 1500);
    // Native anchor navigation owns smooth scrolling, history and Back/Forward.
    // The constant scroll-padding keeps the destination below the fixed header.
  };
  const { width: w, height: h, wing: r } = surface;
  const b = scrolled ? h / 2 : Math.min(28, h / 3);
  const outline = scrolled
    ? `M${r + b} 0 H${r + w - b} Q${r + w} 0 ${r + w} ${b} V${h - b} Q${r + w} ${h} ${r + w - b} ${h} H${r + b} Q${r} ${h} ${r} ${h - b} V${b} Q${r} 0 ${r + b} 0 Z`
    : `M0 0 H${w + 2 * r} Q${w + r} 0 ${w + r} ${r} V${h - b} Q${w + r} ${h} ${w + r - b} ${h} H${r + b} Q${r} ${h} ${r} ${h - b} V${r} Q${r} 0 0 0 Z`;
  return (
    <header
      ref={header}
      className={`header-notch${scrolled ? " header-detached" : ""}`}
    >
      <svg
        className="notch-surface"
        aria-hidden="true"
        viewBox={`0 0 ${w + 2 * r} ${h}`}
        preserveAspectRatio="none"
        style={{ left: -r, width: `calc(100% + ${2 * r}px)` }}
      >
        <path d={outline} fill="#000" />
      </svg>
      <div className="notch-inner">
        <Brand />
        <nav className="notch-links" aria-label="Разделы сайта">
          {links.map(({ label, href }) => (
            <a
              key={href}
              href={href}
              aria-current={active === href ? "location" : undefined}
              onClick={() => select(href)}
            >
              {label}
            </a>
          ))}
        </nav>
        <div className="notch-actions">
          <SplitButton compact>Записаться</SplitButton>
          <button
            className="notch-menu-toggle"
            ref={toggle}
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
            <a
              key={href}
              href={href}
              aria-current={active === href ? "location" : undefined}
              onClick={() => select(href)}
            >
              {label}
            </a>
          ))}
        </nav>
      )}
    </header>
  );
}
