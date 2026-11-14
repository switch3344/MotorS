import { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { PerspectiveCamera } from "three";
import { Environment, Lightformer, useProgress } from "@react-three/drei";
import { EngineModel } from "./EngineModel";
export interface EngineViewProps {
  playing: boolean;
  mobile: boolean;
  visible: boolean;
  warming?: boolean;
  onReady?: () => void;
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
        dpr={[1.5, props.mobile ? 2 : 2.5]}
        shadows={!props.mobile}
        frameloop={props.visible || props.warming ? "demand" : "never"}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
        onCreated={({ gl }) => {
          gl.toneMappingExposure = 0.9;
        }}
        aria-label="Работа рядного четырёхцилиндрового двигателя в разрезе: поршни, коленвал, клапаны и привод ГРМ."
      >
        <ambientLight intensity={0.4} />
        <directionalLight
          position={[4, 7, 6]}
          intensity={2.1}
          color="#f0f4ff"
          castShadow={!props.mobile}
          shadow-mapSize-width={4096}
          shadow-mapSize-height={4096}
          shadow-camera-left={-4}
          shadow-camera-right={4}
          shadow-camera-top={4}
          shadow-camera-bottom={-4}
          shadow-camera-near={0.1}
          shadow-camera-far={28}
          shadow-bias={-0.0002}
          shadow-normalBias={0.008}
        />
        <directionalLight
          position={[-5, 3, 2]}
          intensity={0.75}
          color="#e0e8f5"
        />
        <directionalLight
          position={[2, 2, -5]}
          intensity={1.8}
          color="#fff1df"
        />
        <Suspense fallback={null}>
          <EngineModel {...props} />
          <Environment resolution={1024} frames={1}>
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
