import fs from "node:fs";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import {
  mergeGeometries,
  mergeVertices,
} from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { Box3, Vector3, Group, Mesh, MeshStandardMaterial } from "three";

// Node's Blob is native; the exporter also needs this small FileReader adapter.
globalThis.FileReader = class {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((b) => {
      this.result = b;
      this.onloadend?.();
    });
  }
  readAsDataURL(blob) {
    blob.arrayBuffer().then((b) => {
      this.result = `data:${blob.type};base64,${Buffer.from(b).toString("base64")}`;
      this.onloadend?.();
    });
  }
};

const source = fs.readFileSync(
  "assets-source/source/Supercharged Ls Engine 1.fbx",
);
const original = new FBXLoader().parse(
  source.buffer.slice(source.byteOffset, source.byteOffset + source.byteLength),
  "",
);
original.updateMatrixWorld(true);
const box = new Box3().setFromObject(original);
const center = box.getCenter(new Vector3());
const scale = 4.4 / box.getSize(new Vector3()).x;
const buckets = new Map();
const mapping = [];
const palettes = {
  block: ["#292e34", 0.72, 0.38],
  heads: ["#701824", 0.6, 0.4],
  intake: ["#252a30", 0.8, 0.32],
  oil: ["#20262b", 0.7, 0.4],
  timing: ["#303338", 0.8, 0.3],
  steel: ["#8b969c", 0.88, 0.25],
  rubber: ["#101215", 0.05, 0.85],
  bolts: ["#a3abb0", 0.9, 0.24],
};
let index = 0;
original.traverse((object) => {
  if (!object.isMesh) return;
  const id = index++;
  const bounds = new Box3().setFromObject(object);
  const c = bounds.getCenter(new Vector3());
  const size = bounds.getSize(new Vector3());
  let zone = "block";
  let finish = "block";
  if (c.y < 180 && Math.abs(c.x) < 40 && c.z < 175) {
    zone = "oil";
    finish = "oil";
  } else if (c.z < 70) {
    zone = "timing";
    finish = "timing";
  } else if ((c.y > 267 && Math.abs(c.x) < 42) || id === 95) {
    zone = "intake";
    finish = "intake";
  } else if (c.y > 222 && Math.abs(c.x) > 24) {
    zone = "heads";
    finish = "heads";
  }
  if (Math.abs(c.x) > 65 && c.y < 238) finish = "steel";
  if (Math.max(size.x, size.y, size.z) < 10) finish = "bolts";
  if (id === 154 || id === 94) finish = "rubber";
  if ([28, 66].includes(id)) {
    zone = "crankshaft";
    finish = "steel";
  }
  const geometry = object.geometry.clone().applyMatrix4(object.matrixWorld);
  geometry
    .translate(-center.x, -center.y, -center.z)
    .scale(scale, scale, scale);
  for (const name of Object.keys(geometry.attributes))
    if (!["position", "normal"].includes(name)) geometry.deleteAttribute(name);
  if (!geometry.attributes.normal) geometry.computeVertexNormals();
  geometry.clearGroups();
  const key = `${zone}:${finish}`;
  if (!buckets.has(key)) buckets.set(key, []);
  buckets
    .get(key)
    .push(
      geometry.toNonIndexed
        ? geometry.index
          ? geometry.toNonIndexed()
          : geometry
        : geometry,
    );
  mapping.push({
    sourceMesh: id,
    sourceName: object.name,
    zone,
    finish,
    center: c.toArray(),
    vertices: geometry.attributes.position.count,
  });
});
const root = new Group();
root.name = "Supercharged_LS_V8";
for (const [key, geometries] of buckets) {
  const [zone, finish] = key.split(":");
  const [color, metalness, roughness] = palettes[finish];
  const geo = mergeVertices(mergeGeometries(geometries), 0.00001);
  const material = new MeshStandardMaterial({ color, metalness, roughness });
  material.name = finish;
  const mesh = new Mesh(geo, material);
  mesh.name = `${zone}__${finish}`;
  mesh.userData = {
    zone,
    sourceMeshes: mapping
      .filter((m) => m.zone === zone && m.finish === finish)
      .map((m) => m.sourceMesh),
  };
  root.add(mesh);
}
root.userData = {
  source: "User-provided Supercharged Ls Engine 1.fbx",
  note: "Spatial grouping is approximate. Pistons are an optional schematic overlay; crankshaft group shows the flywheel, not an internal crankshaft.",
};
const glb = await new GLTFExporter().parseAsync(root, { binary: true });
fs.mkdirSync("public/models", { recursive: true });
fs.writeFileSync("public/models/ls-v8.glb", Buffer.from(glb));
fs.writeFileSync(
  "assets-source/mesh-map.json",
  JSON.stringify(mapping, null, 2),
);
const report = {
  originalBytes: source.length,
  originalMeshes: index,
  originalVertices: mapping.reduce((s, m) => s + m.vertices, 0),
  webMeshes: root.children.length,
  glbBytes: glb.byteLength,
  textures: 0,
  groups: [...new Set(mapping.map((m) => m.zone))],
  license: "Not included in archive; needs confirmation",
  limitations: [
    "No verified internal piston/crankshaft meshes",
    "Groups assigned spatially; inspection required before production",
  ],
};
fs.writeFileSync(
  "assets-source/model-report.json",
  JSON.stringify(report, null, 2),
);
console.log(JSON.stringify(report, null, 2));
