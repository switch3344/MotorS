import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import {
  ContactShadows,
  Environment,
  Lightformer,
  useProgress,
} from "@react-three/drei";
import type { EngineZone } from "../../config/services.config";
import { EngineModel } from "./EngineModel";
export interface EngineViewProps {
  expanded: boolean;
  zone: EngineZone | null;
  reduced: boolean;
  mobile: boolean;
  visible: boolean;
  onHover: () => void;
}
export default function CanvasScene(props: EngineViewProps) {
  const loading = useProgress();
  return (
    <>
      <Canvas
        camera={{ position: [7.6, 4.8, 8.6], fov: 30, near: 0.1, far: 60 }}
        dpr={[1, props.mobile ? 1.25 : 1.75]}
        frameloop={props.visible ? "demand" : "never"}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
        aria-label="Объёмная модель V12. Наведите или нажмите «Разобрать двигатель», чтобы открыть услуги."
      >
        <ambientLight intensity={0.6} />
        <directionalLight
          position={[4, 7, 6]}
          intensity={3.3}
          color="#eaf1ff"
        />
        <directionalLight
          position={[-5, 3, 2]}
          intensity={2.2}
          color="#fff3e7"
        />
        <directionalLight
          position={[2, 2, -5]}
          intensity={2.6}
          color="#e9485d"
        />
        <Suspense fallback={null}>
          <EngineModel {...props} />
          <Environment resolution={128} frames={1}>
            <Lightformer
              form="rect"
              intensity={4}
              position={[0, 5, 0]}
              scale={[8, 4, 1]}
              rotation={[Math.PI / 2, 0, 0]}
            />
            <Lightformer
              form="rect"
              intensity={3}
              position={[-5, 2, 2]}
              scale={[2, 7, 1]}
              rotation={[0, Math.PI / 2, 0]}
            />
            <Lightformer
              form="rect"
              intensity={2.5}
              position={[3, 1, -4]}
              scale={[3, 6, 1]}
              rotation={[0, -Math.PI / 3, 0]}
            />
          </Environment>
          <ContactShadows
            position={[0, -3.2, 0]}
            opacity={0.32}
            scale={18}
            blur={3}
            far={9}
            resolution={256}
            frames={1}
            color="#000000"
          />
        </Suspense>
      </Canvas>
      {loading.active && (
        <div className="v12-loader" role="status">
          Загружаем V12… {Math.round(loading.progress)}%
        </div>
      )}
    </>
  );
}
