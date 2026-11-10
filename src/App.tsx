import { useCallback, useState } from "react";
import { Header } from "./components/Header";
import { Hero } from "./components/Hero";
import { EngineScene } from "./components/EngineScene";
import { Footer } from "./components/Footer";
import { Metrics } from "./components/Metrics";
import { WorkCases } from "./components/WorkCases";
import { OriginalParts } from "./components/OriginalParts";
import { Preloader } from "./components/Preloader";
export default function App() {
  const [engineReady, setEngineReady] = useState(false);
  const onEngineReady = useCallback(() => setEngineReady(true), []);
  return (
    <>
      <Preloader ready={engineReady} />
      <div
        className="site-shell"
        inert={!engineReady}
        aria-hidden={!engineReady}
      >
        <a className="skip-link" href="#hero-title">
          Перейти к содержимому
        </a>
        <Header />
        <main>
          <Hero />
          <Metrics />
          <EngineScene preloading={!engineReady} onReady={onEngineReady} />
          <WorkCases />
          <OriginalParts />
        </main>
        <Footer />
      </div>
    </>
  );
}
