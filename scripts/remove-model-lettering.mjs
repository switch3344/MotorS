// Remove only engraved lettering, preserving the ceramic spark plugs that
// share its material. Coordinates follow the authored model in generate-v12.py.
import fs from "node:fs";
import { Matrix4, Quaternion, Vector3 } from "three";

const filename = "public/models/motorservice-v12.glb";
const file = fs.readFileSync(filename);
const jsonLength = file.readUInt32LE(12);
const document = JSON.parse(file.subarray(20, 20 + jsonLength).toString());
const binaryOffset = 28 + jsonLength;
const binary = file.subarray(
  binaryOffset,
  binaryOffset + file.readUInt32LE(20 + jsonLength),
);
const additions = [];
let byteLength = binary.length;
let removed = 0;

function read(accessorIndex) {
  const accessor = document.accessors[accessorIndex];
  const view = document.bufferViews[accessor.bufferView];
  const sizes = { 5121: 1, 5123: 2, 5125: 4, 5126: 4 };
  const components = accessor.type === "VEC3" ? 3 : 1;
  const bytes = sizes[accessor.componentType];
  const result = [];
  for (let i = 0; i < accessor.count; i++) {
    for (let component = 0; component < components; component++) {
      const offset =
        (view.byteOffset || 0) +
        (accessor.byteOffset || 0) +
        i * (view.byteStride || bytes * components) +
        component * bytes;
      result.push(
        accessor.componentType === 5126
          ? binary.readFloatLE(offset)
          : binary.readUIntLE(offset, bytes),
      );
    }
  }
  return result;
}

for (const node of document.nodes) {
  if (node.mesh === undefined) continue;
  const isCover = /CamCover/.test(node.name);
  const isIntake = /Intake/.test(node.name);
  if (!isCover && !isIntake) continue;
  const matrix = node.matrix
    ? new Matrix4().fromArray(node.matrix)
    : new Matrix4().compose(
        new Vector3(...(node.translation || [0, 0, 0])),
        new Quaternion(...(node.rotation || [0, 0, 0, 1])),
        new Vector3(...(node.scale || [1, 1, 1])),
      );
  const side = /_L/.test(node.name) ? -1 : 1;
  const mesh = document.meshes[node.mesh];
  mesh.primitives = mesh.primitives.filter((primitive) => {
    if (
      !document.materials[primitive.material]?.name.includes("Inlaid lettering")
    )
      return true;
    const indices = read(primitive.indices);
    const positions = read(primitive.attributes.POSITION);
    const keep = [];
    const isLetter = (index) => {
      const p = new Vector3(
        ...positions.slice(index * 3, index * 3 + 3),
      ).applyMatrix4(matrix);
      return (
        isIntake ||
        p.x * side * 0.5 + (p.y - 0.38) * Math.cos(Math.PI / 6) > 2.05
      );
    };
    for (let i = 0; i < indices.length; i += 3) {
      if (indices.slice(i, i + 3).every(isLetter)) removed++;
      else keep.push(...indices.slice(i, i + 3));
    }
    if (!keep.length) return false;
    if (keep.length === indices.length) return true;
    const data = Buffer.from(new Uint32Array(keep).buffer);
    const view =
      document.bufferViews.push({
        buffer: 0,
        byteOffset: byteLength,
        byteLength: data.length,
        target: 34963,
      }) - 1;
    additions.push(data);
    byteLength += data.length;
    primitive.indices =
      document.accessors.push({
        bufferView: view,
        componentType: 5125,
        count: keep.length,
        type: "SCALAR",
        min: [Math.min(...keep)],
        max: [Math.max(...keep)],
      }) - 1;
    return true;
  });
}

if (removed && !process.argv.includes("--check")) {
  document.buffers[0].byteLength = byteLength;
  const json = Buffer.from(JSON.stringify(document));
  const jsonPadding = Buffer.alloc((4 - (json.length % 4)) % 4, 0x20);
  const body = Buffer.concat([binary, ...additions]);
  const header = Buffer.alloc(20);
  header.writeUInt32LE(0x46546c67, 0);
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(28 + json.length + jsonPadding.length + body.length, 8);
  header.writeUInt32LE(json.length + jsonPadding.length, 12);
  header.writeUInt32LE(0x4e4f534a, 16);
  const chunk = Buffer.alloc(8);
  chunk.writeUInt32LE(body.length, 0);
  chunk.writeUInt32LE(0x004e4942, 4);
  fs.writeFileSync(
    filename,
    Buffer.concat([header, json, jsonPadding, chunk, body]),
  );
}
console.log(
  `${process.argv.includes("--check") ? "Lettering triangles remaining" : "Removed lettering triangles"}: ${removed}`,
);
if (process.argv.includes("--check") && removed) process.exitCode = 1;
