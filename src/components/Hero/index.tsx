import { useLayoutEffect, useRef, useState } from "react";
import { SplitButton } from "../SplitButton";
import FadeContent from "./FadeContent";
import "./hero.css";

export function Hero() {
  const hero = useRef<HTMLElement>(null);
  const [ready, setReady] = useState(false);
  useLayoutEffect(() => {
    // Let the engine preloader finish before playing the hero's entrance.
    const reveal = () => {
      if (
        hero.current?.closest("[inert]") ||
        document.querySelector(".site-preloader")
      )
        return;
      setReady(true);
      observer.disconnect();
    };
    const observer = new MutationObserver(reveal);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["inert"],
    });
    reveal();
    return () => observer.disconnect();
  }, []);

  const content = (
    <>
      <p className="restored-hero-location">Краснодар · MotorServiceKRD</p>
      <h1 id="hero-title" tabIndex={-1}>
        <span>Капитальный ремонт</span>{" "}
        <span><em>двигателей</em></span>
      </h1>
      <p className="restored-hero-description">
        <span>Оригинальные запчасти</span>
        <span>Гарантия — <span className="restored-hero-warranty">5 лет или 250 000 км</span></span>
      </p>
      <div className="restored-hero-action">
        <SplitButton>Записаться на диагностику</SplitButton>
      </div>
    </>
  );
  return (
    <section
      className="hero-card restored-hero"
      id="top"
      ref={hero}
      aria-labelledby="hero-title"
    >
      {ready ? (
        <FadeContent
          className="restored-hero-copy"
          trigger="mount"
          effect="fade"
          duration={0.4}
          stagger={0.05}
          ease="power3.out"
        >
          {content}
        </FadeContent>
      ) : (
        <div className="restored-hero-copy" style={{ visibility: "hidden" }}>
          {content}
        </div>
      )}
    </section>
  );
}
