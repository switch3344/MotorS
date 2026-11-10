import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import {
  Box3,
  Group,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  PerspectiveCamera,
  Vector3,
} from "three";
import gsap from "gsap";
import type { EngineViewProps } from "./CanvasScene";
const MODEL = `${import.meta.env.BASE_URL}models/motorservice-v12.glb`;
export function EngineModel({
  expanded,
  zone,
  reduced,
  mobile,
  onHover,
}: EngineViewProps) {
  const assembly = useRef<Group>(null);
  const transition = useRef({ amount: 0 });
  const { scene } = useGLTF(MODEL);
  const { camera, invalidate } = useThree();
  const model = useMemo(() => {
    const copy = scene.clone(true);
    copy.traverse((object) => {
      if (!(object instanceof Mesh)) return;
      const clone = (material: MeshStandardMaterial) => {
        const result = material.clone();
        result.emissive.set("#b82038");
        result.emissiveIntensity = 0;
        return result;
      };
      object.material = Array.isArray(object.material)
        ? object.material.map(clone)
        : clone(object.material as MeshStandardMaterial);
    });
    const bounds = new Box3().setFromObject(copy);
    copy.position.sub(bounds.getCenter(new Vector3()));
    return copy;
  }, [scene]);
  const parts = useMemo(() => {
    const result: Object3D[] = [];
    model.traverse((object) => {
      if (object.userData.assembly) result.push(object);
    });
    return result;
  }, [model]);
  useLayoutEffect(() => {
    const state = transition.current;
    const target = expanded ? 1 : 0;
    // One clock updates every transform and the camera before requesting a
    // frame, so interrupted hover/toggle animations remain continuous.
    const render = () => {
      const amount = state.amount;
      if (assembly.current) {
        assembly.current.scale.setScalar(1 - 0.12 * amount);
        assembly.current.position.y = -0.45 * amount;
      }
      for (const part of parts) {
        const vector = part.userData.explode as number[];
        part.position.set(
          vector[0] * amount,
          vector[1] * amount,
          vector[2] * amount,
        );
      }
      if (camera instanceof PerspectiveCamera) {
        const assembledFov = mobile ? 40 : 22.5;
        const expandedFov = mobile ? 52 : 34;
        camera.fov = assembledFov + (expandedFov - assembledFov) * amount;
        camera.updateProjectionMatrix();
      }
      camera.lookAt(0, 0, 0);
      assembly.current?.updateMatrixWorld(true);
      invalidate();
    };
    if (reduced) {
      state.amount = target;
      render();
      return;
    }
    render();
    const tween = gsap.to(state, {
      amount: target,
      duration: 1.15,
      ease: "power3.inOut",
      onUpdate: render,
      onComplete: render,
    });
    return () => {
      tween.kill();
    };
  }, [expanded, reduced, mobile, parts, camera, invalidate]);
  useLayoutEffect(() => {
    const animated: MeshStandardMaterial[] = [];
    for (const part of parts) {
      const selected =
        expanded && zone && (zone === "all" || part.userData.zone === zone);
      part.traverse((object) => {
        if (!(object instanceof Mesh)) return;
        const materials = Array.isArray(object.material)
          ? object.material
          : [object.material];
        materials.forEach((material) => {
          const standard = material as MeshStandardMaterial;
          gsap.killTweensOf(standard);
          animated.push(standard);
          gsap.to(standard, {
            emissiveIntensity: selected ? (zone === "all" ? 0.025 : 0.15) : 0,
            duration: reduced ? 0 : 0.55,
            overwrite: true,
            onUpdate: invalidate,
          });
        });
      });
    }
    invalidate();
    return () => animated.forEach((material) => gsap.killTweensOf(material));
  }, [expanded, zone, reduced, parts, invalidate]);
  useEffect(
    () => () =>
      model.traverse((object) => {
        if (object instanceof Mesh)
          (Array.isArray(object.material)
            ? object.material
            : [object.material]
          ).forEach((material) => material.dispose());
      }),
    [model],
  );
  return (
    <group ref={assembly}>
      <primitive object={model} onPointerOver={onHover} />
    </group>
  );
}
