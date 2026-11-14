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
      <h1 id="hero-title" tabIndex={-1}>
        <span>Двигатель, как с завода.</span>
        <span>
          На 5 лет <em>вперёд.</em>
        </span>
      </h1>
      <p className="restored-hero-description">
        Ремонт и диагностика двигателей в Краснодаре.
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
          effect="focus"
          duration={0.9}
          stagger={0.12}
          ease="power2.out"
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
