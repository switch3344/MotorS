"""Run with Blender --background --disable-autoexec SOURCE.blend --python this-file."""
import bpy
import json
import sys
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT/'scripts'))
from inline4_timing import apply_timing

scene = bpy.data.scenes['ENGINE • Inline 4 / 1998 cc']
bpy.context.window.scene = scene
timing = apply_timing(scene)
valves = [scene.objects[name] for name in timing['phases']]
result = {'max_piston_pair_error_mm': 0.0, 'max_rod_endpoint_error_mm': 0.0,
          'min_cam_contact_gap_mm': 999.0, 'max_cam_contact_gap_mm': -999.0,
          'min_piston_valve_clearance_mm': 999.0, 'max_cam_ratio_error_radians': 0.0,
          'min_valve_lift_mm': 999.0, 'max_valve_lift_mm': -999.0, 'poses': 0}

def bounds_z(objects, upper, depsgraph):
    values = []
    for original in objects:
        if original.type != 'MESH' or original.hide_render:
            continue
        obj = original.evaluated_get(depsgraph)
        values.extend((obj.matrix_world @ Vector(p)).z for p in obj.bound_box)
    return (max if upper else min)(values)

for angle in range(0, 721, 6):
    source_frame = 1 + angle/3
    scene.frame_set(int(source_frame), subframe=source_frame % 1)
    bpy.context.view_layer.update()
    graph = bpy.context.evaluated_depsgraph_get()
    result['poses'] += 1
    pistons = [scene.objects[f'Piston carrier C{i}'].evaluated_get(graph) for i in range(1, 5)]
    result['max_piston_pair_error_mm'] = max(result['max_piston_pair_error_mm'],
        abs(pistons[0].matrix_world.translation.z-pistons[3].matrix_world.translation.z),
        abs(pistons[1].matrix_world.translation.z-pistons[2].matrix_world.translation.z))
    for index, piston in enumerate(pistons, 1):
        rod = scene.objects[f'Connecting rod assembly C{index}'].evaluated_get(graph)
        error = ((rod.matrix_world @ Vector((0, 0, 143)))-piston.matrix_world.translation).length
        result['max_rod_endpoint_error_mm'] = max(result['max_rod_endpoint_error_mm'], error)
        crown = bounds_z(scene.objects[f'Piston carrier C{index}'].children_recursive, True, graph)
        for valve in [v for v in valves if f'C{index}-' in v.name]:
            low = bounds_z(valve.children_recursive, False, graph)
            result['min_piston_valve_clearance_mm'] = min(result['min_piston_valve_clearance_mm'], low-crown)
    crank = scene.objects['Crankshaft rotating assembly'].rotation_euler.x
    for cam_name in ['Exhaust camshaft', 'Intake camshaft']:
        result['max_cam_ratio_error_radians'] = max(result['max_cam_ratio_error_radians'],
            abs(2*scene.objects[cam_name].rotation_euler.x-crank))
    for valve in valves:
        lift = -valve.location.z
        result['min_valve_lift_mm'] = min(result['min_valve_lift_mm'], lift)
        result['max_valve_lift_mm'] = max(result['max_valve_lift_mm'], lift)
        cam = scene.objects['Cam lobe '+valve.name].evaluated_get(graph)
        mesh = cam.to_mesh()
        low = min((cam.matrix_world @ v.co).z for v in mesh.vertices)
        cam.to_mesh_clear()
        bucket = scene.objects['Bucket follower '+valve.name].evaluated_get(graph)
        top = max((bucket.matrix_world @ Vector(p)).z for p in bucket.bound_box)
        result['min_cam_contact_gap_mm'] = min(result['min_cam_contact_gap_mm'], low-top)
        result['max_cam_contact_gap_mm'] = max(result['max_cam_contact_gap_mm'], low-top)

assert result['max_piston_pair_error_mm'] < .0001, result
assert result['max_rod_endpoint_error_mm'] < .0001, result
assert result['max_cam_ratio_error_radians'] < .00001, result
assert result['min_cam_contact_gap_mm'] > -.03 and result['max_cam_contact_gap_mm'] < .03, result
assert result['min_piston_valve_clearance_mm'] > 0, result
assert result['min_valve_lift_mm'] >= -.0001 and 4.99 < result['max_valve_lift_mm'] < 5.01, result
result['passed'] = True
(ROOT/'.qa/inline4-timing-validation.json').write_text(json.dumps(result, indent=2), encoding='utf-8')
print(json.dumps(result), flush=True)
