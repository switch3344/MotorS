import { useEffect, useLayoutEffect, useMemo } from "react";
import { useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import {
  Box3,
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
    const animated: object[] = [];
    const duration = reduced ? 0 : 1.15;
    for (const part of parts) {
      const vector = part.userData.explode as number[];
      const amount = expanded ? 1 : 0;
      gsap.killTweensOf(part.position);
      animated.push(part.position);
      gsap.to(part.position, {
        x: vector[0] * amount,
        y: vector[1] * amount,
        z: vector[2] * amount,
        duration,
        ease: "power3.inOut",
        overwrite: true,
        onUpdate: invalidate,
      });
    }
    if (camera instanceof PerspectiveCamera) {
      gsap.killTweensOf(camera);
      animated.push(camera);
      gsap.to(camera, {
        fov: expanded ? (mobile ? 46 : 39) : mobile ? 40 : 30,
        duration,
        ease: "power3.inOut",
        overwrite: true,
        onUpdate: () => {
          camera.updateProjectionMatrix();
          invalidate();
        },
      });
    }
    camera.lookAt(0, 0, 0);
    invalidate();
    return () => animated.forEach((target) => gsap.killTweensOf(target));
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
  return <primitive object={model} onPointerOver={onHover} />;
}
