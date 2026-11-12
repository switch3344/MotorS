import {
  BoxGeometry,
  BufferGeometry,
  CatmullRomCurve3,
  CylinderGeometry,
  DataTexture,
  DoubleSide,
  ExtrudeGeometry,
  Float32BufferAttribute,
  LinearFilter,
  LinearMipmapLinearFilter,
  Matrix4,
  Mesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Object3D,
  Path,
  Quaternion,
  RepeatWrapping,
  RGBAFormat,
  Shape,
  TorusGeometry,
  TubeGeometry,
  Vector3,
} from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

const Z = new Vector3(0, 0, 1);
const Y = new Vector3(0, 1, 0);
const unit = new Vector3(1, 1, 1);
const fromAuthor = (x: number, y: number, z: number) => new Vector3(x, z, -y);

/** Fine surface structure belongs to the metal, never to the page background. */
export function surfaceTexture(brushed: boolean) {
  const size = 256;
  const pixels = new Uint8Array(size * size * 4);
  let seed = 7151;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  for (let y = 0; y < size; y++) {
    const line = brushed ? (random() - 0.5) * 13 : 0;
    for (let x = 0; x < size; x++) {
      const value = Math.round(
        197 + line + (random() - 0.5) * (brushed ? 9 : 36),
      );
      const index = (y * size + x) * 4;
      pixels[index] = pixels[index + 1] = pixels[index + 2] = value;
      pixels[index + 3] = 255;
    }
  }
  const texture = new DataTexture(pixels, size, size, RGBAFormat);
  texture.wrapS = texture.wrapT = RepeatWrapping;
  texture.repeat.set(brushed ? 2 : 5, brushed ? 2 : 5);
  texture.generateMipmaps = true;
  texture.minFilter = LinearMipmapLinearFilter;
  texture.magFilter = LinearFilter;
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  return texture;
}

function detailGeometry(root: Object3D) {
  const metal = new MeshStandardMaterial({
    name: "Detail satin aluminium",
    color: "#bbc2c9",
    metalness: 0.94,
    roughness: 0.28,
  });
  const black = new MeshStandardMaterial({
    name: "Detail recessed steel",
    color: "#171a1d",
    metalness: 0.8,
    roughness: 0.4,
  });
  const belt = new MeshStandardMaterial({
    name: "Detail belt rubber",
    color: "#101214",
    metalness: 0,
    roughness: 0.88,
    side: DoubleSide,
  });
  const weld = new MeshStandardMaterial({
    name: "Detail exhaust weld",
    color: "#a29a86",
    metalness: 0.9,
    roughness: 0.38,
  });
  const batches = new Map<
    string,
    {
      parent: Object3D;
      material: MeshStandardMaterial;
      geometries: BufferGeometry[];
    }
  >();
  const add = (
    parent: Object3D,
    geometry: BufferGeometry,
    material: MeshStandardMaterial,
    position: Vector3,
    rotation = new Quaternion(),
  ) => {
    geometry.applyMatrix4(new Matrix4().compose(position, rotation, unit));
    const prepared = geometry.index ? geometry.toNonIndexed() : geometry;
    if (prepared !== geometry) geometry.dispose();
    const key = `${parent.uuid}:${material.uuid}`;
    if (!batches.has(key))
      batches.set(key, { parent, material, geometries: [] });
    batches.get(key)!.geometries.push(prepared);
  };
  const cylinder = (
    parent: Object3D,
    position: Vector3,
    radius: number,
    length: number,
    material: MeshStandardMaterial,
    axis = Z,
    segments = 64,
  ) =>
    add(
      parent,
      new CylinderGeometry(
        radius,
        radius,
        length,
        radius < 0.12 ? Math.min(segments, 32) : segments,
      ),
      material,
      position,
      new Quaternion().setFromUnitVectors(Y, axis),
    );
  const ring = (
    parent: Object3D,
    position: Vector3,
    radius: number,
    thickness: number,
    material: MeshStandardMaterial,
    axis = Z,
  ) =>
    add(
      parent,
      new TorusGeometry(
        radius,
        thickness,
        radius < 0.1 ? 6 : 8,
        radius < 0.1 ? 24 : 64,
      ),
      material,
      position,
      new Quaternion().setFromUnitVectors(Z, axis),
    );

  const timing = root.getObjectByName("14_TimingDrive");
  if (timing) {
    // Recessed bores, turned rims, hubs and a six-bolt circle replace the
    // visual flatness of the original pulley faces without changing assembly IDs.
    for (const [x, y, radius] of [
      [0, 0.18, 0.41],
      [-0.57, 1.56, 0.29],
      [0.57, 1.56, 0.29],
      [0.86, 0.73, 0.23],
      [-0.74, 0.6, 0.22],
    ]) {
      cylinder(timing, new Vector3(x, y, 2.742), radius * 0.78, 0.018, black);
      const face = new Shape();
      face.absarc(0, 0, radius * 0.77, 0, Math.PI * 2, false);
      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI) / 3;
        const hole = new Path();
        hole.absarc(
          Math.cos(angle) * radius * 0.47,
          Math.sin(angle) * radius * 0.47,
          radius * 0.145,
          0,
          Math.PI * 2,
          true,
        );
        face.holes.push(hole);
      }
      add(
        timing,
        new ExtrudeGeometry(face, {
          depth: 0.018,
          bevelEnabled: true,
          bevelThickness: 0.004,
          bevelSize: 0.004,
          bevelSegments: 2,
          steps: 1,
          curveSegments: 12,
        }),
        metal,
        new Vector3(x, y, 2.754),
      );
      ring(timing, new Vector3(x, y, 2.764), radius * 0.85, 0.012, metal);
      cylinder(timing, new Vector3(x, y, 2.793), radius * 0.22, 0.055, metal);
      cylinder(
        timing,
        new Vector3(x, y, 2.826),
        radius * 0.11,
        0.018,
        black,
        Z,
        6,
      );
      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI) / 3 + Math.PI / 6;
        cylinder(
          timing,
          new Vector3(
            x + Math.cos(angle) * radius * 0.66,
            y + Math.sin(angle) * radius * 0.66,
            2.781,
          ),
          radius * 0.045,
          0.013,
          black,
          Z,
          6,
        );
      }
    }
    const points = [
      [0, -0.24],
      [-0.73, 0.38],
      [-0.9, 0.61],
      [-0.83, 0.8],
      [-0.85, 1.56],
      [-0.57, 1.86],
      [0.57, 1.86],
      [0.86, 1.56],
      [1.1, 0.74],
      [0.91, 0.48],
      [0.35, -0.06],
    ];
    const curve = new CatmullRomCurve3(
      points.map(([x, y]) => new Vector3(x, y, 2.63)),
      true,
      "centripetal",
    );
    const vertices: number[] = [],
      uvs: number[] = [],
      indices: number[] = [];
    const segments = 192;
    for (let i = 0; i <= segments; i++) {
      const point = curve.getPoint(i / segments);
      const tangent = curve.getTangent(i / segments);
      const normal = new Vector3(-tangent.y, tangent.x, 0).normalize();
      for (const [radial, depth] of [
        [-0.028, -0.09],
        [0.028, -0.09],
        [0.028, 0.09],
        [-0.028, 0.09],
      ]) {
        const vertex = point.clone().addScaledVector(normal, radial);
        vertices.push(vertex.x, vertex.y, vertex.z + depth);
        uvs.push((i / segments) * 8, depth * 5);
      }
      if (i < segments)
        for (let side = 0; side < 4; side++) {
          const a = i * 4 + side,
            b = i * 4 + ((side + 1) % 4);
          indices.push(a, b, a + 4, b, b + 4, a + 4);
        }
    }
    const ribbon = new BufferGeometry();
    ribbon.setAttribute("position", new Float32BufferAttribute(vertices, 3));
    ribbon.setAttribute("uv", new Float32BufferAttribute(uvs, 2));
    ribbon.setIndex(indices);
    ribbon.computeVertexNormals();
    add(timing, ribbon, belt, new Vector3());
    for (const depth of [-0.06, -0.02, 0.02, 0.06]) {
      const rail = new CatmullRomCurve3(
        points.map(([x, y]) => new Vector3(x, y, 2.63 + depth)),
        true,
        "centripetal",
      );
      add(
        timing,
        new TubeGeometry(rail, 128, 0.004, 4, true),
        black,
        new Vector3(),
      );
    }
  }
  for (const side of [-1, 1]) {
    const cover = root.getObjectByName(
      side < 0 ? "09_CamCover_L" : "10_CamCover_R",
    );
    if (!cover) continue;
    const angle = (side * Math.PI) / 6;
    const normal = new Vector3(Math.sin(angle), Math.cos(angle), 0);
    const across = new Vector3(Math.cos(angle), -Math.sin(angle), 0);
    const along = new Vector3(0, 0, -1);
    const rotation = new Quaternion().setFromRotationMatrix(
      new Matrix4().makeBasis(across, along, normal),
    );
    const at = (height: number, y: number, offset = 0) =>
      new Vector3(0, 0.38, -y)
        .addScaledVector(normal, height)
        .addScaledVector(across, offset);
    for (const y of [-2, -1.2, -0.4, 0.4, 1.2, 2]) {
      for (const offset of [-0.44, 0.44])
        ring(cover, at(2.123, y, offset), 0.047, 0.008, metal, normal);
    }
    for (let i = 0; i < 6; i++) {
      const y = (i - 2.5) * 0.7;
      add(
        cover,
        new BoxGeometry(0.16, 0.28, 0.045),
        black,
        at(2.156, y),
        rotation,
      );
      add(
        cover,
        new BoxGeometry(0.105, 0.19, 0.02),
        belt,
        at(2.184, y),
        rotation,
      );
      add(
        cover,
        new BoxGeometry(0.07, 0.08, 0.045),
        black,
        at(2.155, y, 0.105),
        rotation,
      );
    }
    const header = root.getObjectByName(
      side < 0 ? "12_Exhaust_L" : "13_Exhaust_R",
    );
    if (header)
      for (let i = 0; i < 6; i++) {
        const y = (i - 2.5) * 0.7;
        ring(
          header,
          fromAuthor(side * 1.13, y, 1.535),
          0.075,
          0.006,
          weld,
          new Vector3(side, 0, 0),
        );
      }
  }
  for (const { parent, material, geometries } of batches.values()) {
    const geometry = mergeGeometries(geometries);
    if (geometry) {
      const mesh = new Mesh(geometry, material);
      mesh.name = `${parent.name}_PrecisionDetails`;
      parent.add(mesh);
    }
    geometries.forEach((geometry) => geometry.dispose());
  }
}

/** Keep the imported hierarchy and explode vectors; only enrich its surfaces. */
export function improveEngineAppearance(root: Object3D) {
  detailGeometry(root);
  const castTexture = surfaceTexture(false);
  const machinedTexture = surfaceTexture(true);
  const materialBases = new Map<string, MeshPhysicalMaterial>();
  const finish = (source: MeshStandardMaterial) => {
    if (!materialBases.has(source.uuid)) {
      const material = new MeshPhysicalMaterial();
      // Copy the shared PBR fields while retaining PhysicalMaterial defaults.
      MeshStandardMaterial.prototype.copy.call(material, source);
      Object.assign(material, { defines: { STANDARD: "", PHYSICAL: "" } });
      material.envMapIntensity = 1.05;
      material.emissive.set("#b82038");
      material.emissiveIntensity = 0;
      const name = source.name.toLowerCase();
      if (name.includes("cast aluminium")) {
        material.color.set("#6c737b");
        material.metalness = 0.82;
        material.roughness = 0.61;
        material.roughnessMap = castTexture;
        material.bumpMap = castTexture;
        material.bumpScale = 0.009;
      } else if (name.includes("anodised")) {
        material.color.set("#a31b30");
        material.metalness = 0.32;
        material.roughness = 0.39;
        material.clearcoat = 0.3;
        material.clearcoatRoughness = 0.25;
        material.bumpMap = castTexture;
        material.bumpScale = 0.0015;
      } else if (name.includes("belt") || name.includes("seals")) {
        material.color.set("#111417");
        material.metalness = 0;
        material.roughness = 0.88;
        material.bumpMap = castTexture;
        material.bumpScale = 0.002;
      } else if (name.includes("inlaid")) {
        material.color.set("#d9dcd9");
        material.metalness = 0;
        material.roughness = 0.32;
      } else if (name.includes("exhaust")) {
        material.metalness = 0.94;
        material.roughness = 0.39;
        material.roughnessMap = machinedTexture;
        material.bumpMap = machinedTexture;
        material.bumpScale = 0.001;
      } else if (name.includes("aluminium") || name.includes("edges")) {
        material.color.set(name.includes("polished") ? "#ced5dc" : "#adb6c1");
        material.metalness = 0.96;
        material.roughness = name.includes("polished") ? 0.24 : 0.36;
        material.roughnessMap = machinedTexture;
        material.bumpMap = machinedTexture;
        material.bumpScale = 0.0013;
      } else if (name.includes("fasteners") || name.includes("recessed")) {
        material.color.set("#292e35");
        material.metalness = 0.85;
        material.roughness = 0.4;
      }
      materialBases.set(source.uuid, material);
    }
    return materialBases.get(source.uuid)!.clone();
  };
  root.traverse((object) => {
    if (!(object instanceof Mesh)) return;
    object.castShadow = object.receiveShadow = true;
    const geometry = object.geometry.clone();
    if (!geometry.getAttribute("uv")) {
      const positions = geometry.getAttribute("position"),
        normals = geometry.getAttribute("normal");
      const uv = new Float32Array(positions.count * 2);
      for (let i = 0; i < positions.count; i++) {
        const x = Math.abs(normals.getX(i)),
          y = Math.abs(normals.getY(i)),
          z = Math.abs(normals.getZ(i));
        uv[i * 2] = x > y && x > z ? positions.getZ(i) : positions.getX(i);
        uv[i * 2 + 1] = y > x && y > z ? positions.getZ(i) : positions.getY(i);
      }
      geometry.setAttribute("uv", new Float32BufferAttribute(uv, 2));
    }
    object.geometry = geometry;
    object.material = Array.isArray(object.material)
      ? object.material.map(finish)
      : finish(object.material as MeshStandardMaterial);
  });
  materialBases.forEach((material) => material.dispose());
  return () => {
    const materials = new Set<MeshStandardMaterial>();
    root.traverse((object) => {
      if (!(object instanceof Mesh)) return;
      object.geometry.dispose();
      (Array.isArray(object.material)
        ? object.material
        : [object.material]
      ).forEach((material) => materials.add(material));
    });
    materials.forEach((material) => material.dispose());
    castTexture.dispose();
    machinedTexture.dispose();
  };
}
