import { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { PerspectiveCamera } from "three";
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
  warming?: boolean;
  onReady?: () => void;
  onHover: () => void;
}
function ReadySignal({ onReady }: { onReady?: () => void }) {
  const { invalidate } = useThree();
  const frames = useRef(0);
  const sent = useRef(false);
  const callback = useRef(onReady);
  const raf = useRef(0);
  callback.current = onReady;
  useEffect(() => () => cancelAnimationFrame(raf.current), []);
  useFrame(() => {
    if (sent.current) return;
    frames.current++;
    if (frames.current < 2) invalidate();
    else {
      sent.current = true;
      // The first complete scene frame (materials, environment and shadows)
      // has rendered. Keep its canvas mounted for instant scrolling to services.
      raf.current = requestAnimationFrame(() => callback.current?.());
    }
  });
  return null;
}
export default function CanvasScene(props: EngineViewProps) {
  const loading = useProgress();
  const camera = useMemo(() => {
    const result = new PerspectiveCamera(22.5, 1, 0.1, 60);
    result.position.set(7.6, 4.8, 8.6);
    result.lookAt(0, 0, 0);
    return result;
  }, []);
  return (
    <>
      <Canvas
        camera={camera}
        dpr={[props.mobile ? 1 : 1.25, props.mobile ? 1.5 : 2]}
        shadows={!props.mobile}
        frameloop={props.visible || props.warming ? "demand" : "never"}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
        onCreated={({ gl }) => {
          gl.toneMappingExposure = 0.95;
        }}
        aria-label="Объёмная модель двигателя. Наведите или нажмите «Разобрать двигатель», чтобы увидеть внутренние детали."
      >
        <ambientLight intensity={0.4} />
        <directionalLight
          position={[4, 7, 6]}
          intensity={3.5}
          color="#f0f4ff"
          castShadow={!props.mobile}
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-left={-7}
          shadow-camera-right={7}
          shadow-camera-top={7}
          shadow-camera-bottom={-7}
          shadow-camera-near={0.1}
          shadow-camera-far={28}
          shadow-bias={-0.0002}
          shadow-normalBias={0.015}
        />
        <directionalLight
          position={[-5, 3, 2]}
          intensity={1.3}
          color="#e0e8f5"
        />
        <directionalLight
          position={[2, 2, -5]}
          intensity={1.8}
          color="#fff1df"
        />
        <Suspense fallback={null}>
          <EngineModel {...props} />
          <Environment resolution={256} frames={1}>
            <Lightformer
              form="rect"
              intensity={5}
              position={[0, 5, 0]}
              scale={[8, 4, 1]}
              rotation={[Math.PI / 2, 0, 0]}
            />
            <Lightformer
              form="rect"
              intensity={3.5}
              position={[-5, 2, 2]}
              scale={[2, 7, 1]}
              rotation={[0, Math.PI / 2, 0]}
            />
            <Lightformer
              form="rect"
              intensity={3}
              position={[3, 1, -4]}
              scale={[3, 6, 1]}
              rotation={[0, -Math.PI / 3, 0]}
            />
          </Environment>
          <ContactShadows
            position={[0, -3.2, 0]}
            opacity={0.36}
            scale={18}
            blur={3}
            far={9}
            resolution={props.mobile ? 256 : 512}
            frames={Infinity}
            color="#000000"
          />
          <ReadySignal onReady={props.onReady} />
        </Suspense>
      </Canvas>
      {loading.active && (
        <div className="v12-loader" role="status">
          Загружаем модель… {Math.round(loading.progress)}%
        </div>
      )}
    </>
  );
}
