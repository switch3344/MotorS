import { Header } from "./components/Header";
import { Hero } from "./components/Hero";
import { EngineScene } from "./components/EngineScene";
import { Footer } from "./components/Footer";
import { Metrics } from "./components/Metrics";
import { WorkCases } from "./components/WorkCases";
import { OriginalParts } from "./components/OriginalParts";
export default function App() {
  return (
    <>
      <a className="skip-link" href="#hero-title">
        Перейти к содержимому
      </a>
      <Header />
      <main>
        <Hero />
        <Metrics />
        <EngineScene />
        <WorkCases />
        <OriginalParts />
      </main>
      <Footer />
    </>
  );
}
