import { Header } from "./components/Header";
import { Hero } from "./components/Hero";
import { EngineScene } from "./components/EngineScene";
import { Footer } from "./components/Footer";
export default function App() {
  return (
    <>
      <a className="skip-link" href="#hero-title">
        Перейти к содержимому
      </a>
      <Header />
      <main>
        <Hero />
        <EngineScene />
      </main>
      <Footer />
    </>
  );
}
