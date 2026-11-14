import { useEffect, useLayoutEffect, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import {
  AnimationMixer,
  Box3,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  Vector3,
} from "three";
import type { EngineViewProps } from "./CanvasScene";
import { surfaceTexture } from "./engineAppearance";
import { timingChain } from "./timingChain";

const MODEL = `${import.meta.env.BASE_URL}models/inline4-working-v3.glb`;
const DECODER = `${import.meta.env.BASE_URL}draco/`;

export function EngineModel({ playing, visible, mobile }: EngineViewProps) {
  const { scene, animations } = useGLTF(MODEL, DECODER, false);
  const { camera, invalidate, size, gl } = useThree();
  const { model, mixer, bounds, castTexture, castMaterials, chain } =
    useMemo(() => {
      const model = scene.clone(true);
      const castTexture = surfaceTexture(false);
      const castMaterials = new Map<
        MeshStandardMaterial,
        MeshStandardMaterial
      >();
      model.traverse((object) => {
        if (object instanceof Mesh) {
          object.castShadow = !mobile;
          object.receiveShadow = !mobile;
          const detail = (material: MeshStandardMaterial) => {
            const name = material.name.toLowerCase();
            const casting = name.includes("casting");
            const machined = name.includes("machined");
            const ground = name === "ground steel";
            if (!casting && !machined && !ground) return material;
            if (!castMaterials.has(material)) {
              const copy = material.clone();
              if (casting && object.geometry.getAttribute("uv")) {
                copy.bumpMap = castTexture;
                copy.bumpScale = 0.0015;
              }
              // Broader, quieter highlights keep piston rings and stems legible.
              if (machined) {
                copy.roughness = 0.4;
                copy.color.multiplyScalar(0.88);
              }
              if (ground) copy.roughness = 0.34;
              castMaterials.set(material, copy);
            }
            return castMaterials.get(material)!;
          };
          object.material = Array.isArray(object.material)
            ? object.material.map((material) =>
                detail(material as MeshStandardMaterial),
              )
            : detail(object.material as MeshStandardMaterial);
        }
      });
      const chain = timingChain(model);
      const initial = new Box3().setFromObject(model);
      model.position.sub(initial.getCenter(new Vector3()));
      model.updateMatrixWorld(true);
      return {
        model,
        mixer: new AnimationMixer(model),
        bounds: new Box3().setFromObject(model).expandByScalar(0.1),
        castTexture,
        castMaterials,
        chain,
      };
    }, [scene]);

  useEffect(() => {
    castTexture.needsUpdate = true;
    castMaterials.forEach((material) => {
      material.needsUpdate = true;
    });
    return () => {
      castTexture.dispose();
      chain.dispose();
      castMaterials.forEach((material) => material.dispose());
    };
  }, [castTexture, castMaterials, chain]);

  useEffect(() => {
    const actions = animations.map((clip) => mixer.clipAction(clip).play());
    invalidate();
    return () => {
      actions.forEach((action) => action.stop());
      mixer.uncacheRoot(model);
    };
  }, [animations, mixer, model, invalidate]);

  useLayoutEffect(() => {
    if (!(camera instanceof PerspectiveCamera)) return;
    camera.position.set(-5, 3.2, 11.8);
    camera.lookAt(0, 0, 0);
    camera.updateMatrixWorld(true);
    const aspect = size.width / Math.max(1, size.height);
    let tangent = 0;
    const view = new Vector3();
    model.updateMatrixWorld(true);
    const matrix = new Matrix4();
    model.traverse((object) => {
      if (!(object instanceof Mesh)) return;
      matrix.multiplyMatrices(camera.matrixWorldInverse, object.matrixWorld);
      const points = object.geometry.getAttribute("position");
      if (!points) return;
      // Sample the actual surface instead of fitting empty corners around a
      // diagonal global box. This permits a larger view without cropping.
      for (let i = 0; i < points.count; i += 4) {
        view.fromBufferAttribute(points, i).applyMatrix4(matrix);
        const depth = Math.max(0.1, -view.z);
        tangent = Math.max(
          tangent,
          Math.abs(view.y) / depth,
          Math.abs(view.x) / depth / aspect,
        );
      }
    });
    camera.fov = Math.max(
      8,
      (2 * Math.atan(tangent / (mobile ? 0.92 : 0.96)) * 180) / Math.PI,
    );
    camera.aspect = aspect;
    camera.updateProjectionMatrix();
    invalidate();
  }, [camera, bounds, model, mobile, size.width, size.height, invalidate]);

  useEffect(() => {
    model.traverse((object) => {
      if (object instanceof Mesh) {
        object.castShadow = !mobile;
        object.receiveShadow = !mobile;
      }
    });
    gl.domElement.dataset.animation = playing && visible ? "running" : "paused";
    const wake = () => {
      if (!document.hidden) invalidate();
    };
    document.addEventListener("visibilitychange", wake);
    invalidate();
    return () => document.removeEventListener("visibilitychange", wake);
  }, [playing, visible, mobile, model, gl, invalidate]);

  useFrame((_, delta) => {
    if (!playing || !visible || document.hidden) return;
    mixer.update(Math.min(delta, 0.05));
    chain.update(mixer.time);
    gl.domElement.dataset.chainPhase = (mixer.time * 3).toFixed(3);
    gl.domElement.dataset.motionTime = mixer.time.toFixed(2);
    invalidate();
  });

  return <primitive object={model} />;
}
