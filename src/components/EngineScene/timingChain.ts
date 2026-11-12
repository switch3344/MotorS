import {
  CatmullRomCurve3,
  DynamicDrawUsage,
  Group,
  InstancedMesh,
  Matrix4,
  Mesh,
  Object3D,
  Quaternion,
  Vector3,
} from "three";

/** Move the source's full-detail links on its original closed path, on the engine clock. */
export function timingChain(model: Group) {
  let root: Object3D | undefined;
  const prototypes: Object3D[] = [];
  model.traverse((o) => {
    if (o.userData.chain_path_json) root = o;
    if (o.userData.chain_prototype) prototypes.push(o);
  });
  if (!root) return { update: (_time: number) => {}, dispose: () => {} };
  const chainRoot = root;
  const points = (JSON.parse(root.userData.chain_path_json) as number[][]).map(
    (p) => new Vector3(...(p as [number, number, number])),
  );
  const count = points.length;
  const path = new CatmullRomCurve3(points, true, "centripetal");
  path.arcLengthDivisions = 6000;
  path.updateArcLengths();
  const parts: { mesh: InstancedMesh; plate: boolean }[] = [];
  model.updateMatrixWorld(true);
  for (const prototype of prototypes) {
    prototype.traverse((o) => {
      if (!(o instanceof Mesh)) return;
      const geometry = o.geometry.clone();
      geometry.applyMatrix4(
        new Matrix4()
          .copy(prototype.matrixWorld)
          .invert()
          .multiply(o.matrixWorld),
      );
      const plate = prototype.userData.chain_prototype === "plate";
      const mesh = new InstancedMesh(
        geometry,
        o.material,
        count * (plate ? 2 : 1),
      );
      mesh.name = plate
        ? "Moving timing chain plates"
        : "Moving timing chain rollers";
      mesh.instanceMatrix.setUsage(DynamicDrawUsage);
      mesh.frustumCulled = false;
      chainRoot.add(mesh);
      parts.push({ mesh, plate });
    });
    prototype.visible = false;
  }
  const a = new Vector3(),
    b = new Vector3(),
    position = new Vector3(),
    scale = new Vector3(1, 1, 1);
  const rotation = new Quaternion(),
    axis = new Vector3(1, 0, 0),
    matrix = new Matrix4();
  const update = (time: number) => {
    // 12 teeth per crank revolution; the original crank makes two turns in 8 s.
    const phase = ((time * 3) / count) % 1;
    for (let i = 0; i < count; i++) {
      path.getPointAt((i / count + phase) % 1, a);
      path.getPointAt(((i + 1) / count + phase) % 1, b);
      for (const { mesh, plate } of parts) {
        if (plate) {
          position.copy(a).add(b).multiplyScalar(0.5);
          rotation.setFromAxisAngle(axis, Math.atan2(b.z - a.z, b.y - a.y));
          scale.set(1, (a.distanceTo(b) + 2) / 6.7176638, 1);
          for (let side = 0; side < 2; side++) {
            position.x = a.x + (side ? 6 : -6);
            matrix.compose(position, rotation, scale);
            mesh.setMatrixAt(i * 2 + side, matrix);
          }
        } else {
          matrix.makeTranslation(a.x, a.y, a.z);
          mesh.setMatrixAt(i, matrix);
        }
      }
    }
    for (const { mesh } of parts) mesh.instanceMatrix.needsUpdate = true;
  };
  update(0);
  return {
    update,
    dispose: () =>
      parts.forEach(({ mesh }) => {
        mesh.geometry.dispose();
        mesh.dispose();
      }),
  };
}
