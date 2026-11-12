"""Export the provided inline-four working cutaway in a separate Blender process.
blender -b --disable-autoexec assets-source/inline4/Engine_Inline4_Detailed.blend --python scripts/export-inline4.py
The source scene is never saved or overwritten.
"""
import bpy
import json
from collections import defaultdict
from pathlib import Path
from mathutils import Matrix, Vector

ROOT = Path(__file__).resolve().parents[1]
source = bpy.data.scenes['ENGINE • Inline 4 / 1998 cc']
bpy.context.window.scene = source
source.frame_set(1)
bpy.context.view_layer.update()
depsgraph = bpy.context.evaluated_depsgraph_get()
paths = {'location','rotation_euler','rotation_quaternion','scale'}
animated = {o for o in source.objects if o.animation_data and any(d.data_path in paths for d in o.animation_data.drivers)}
print('Motion groups:', len(animated), flush=True)

# Evaluate every driven transform in the original dependency graph before
# creating the simplified scene. Parent motion is included in world matrices.
poses = {}
for frame in range(1,242):
    source.frame_set(frame)
    depsgraph.update()
    poses[frame] = {o.name:o.evaluated_get(depsgraph).matrix_world.copy() for o in animated}
source.frame_set(1)
depsgraph.update()

export = bpy.data.scenes.new('MotorService Inline4 Working')
export.render.fps = 30
export.frame_start = 0
export.frame_end = 240
root = bpy.data.objects.new('Inline4_Engine',None)
export.collection.objects.link(root)
root.scale = (0.005,)*3
root['source'] = 'User supplied Engine_Inline4_Detailed.blend'
root['cycle_seconds'] = 8.0
pivots = {}
for original in sorted(animated,key=lambda o:o.name):
    pivot = bpy.data.objects.new(original.name,None)
    export.collection.objects.link(pivot)
    pivot.parent = root
    pivot.rotation_mode = 'QUATERNION'
    pivot.matrix_local = poses[1][original.name]
    pivots[original.name] = pivot

# Keep the original detailed link geometry, instanced at runtime along its source path.
rollers=sorted([o for o in source.objects if o.name.startswith('Chain roller ')],key=lambda o:o.name)
root['chain_path_json']=json.dumps([[o.matrix_world.translation.x,o.matrix_world.translation.z,-o.matrix_world.translation.y] for o in rollers])
root['chain_links']=len(rollers)
root['chain_teeth']=12
for name,kind in [('Chain roller 000','roller'),('Chain link plate 000','plate')]:
    original=source.objects[name]
    mesh=bpy.data.meshes.new_from_object(original.evaluated_get(depsgraph),preserve_all_data_layers=True,depsgraph=depsgraph)
    prototype=bpy.data.objects.new('Chain prototype '+kind,mesh)
    export.collection.objects.link(prototype);prototype.parent=root
    prototype['chain_prototype']=kind
batches = defaultdict(list)
count = 0
for obj in list(source.objects):
    if obj.name.startswith(('Chain roller ','Chain link plate ')):
        continue
    if obj.type not in {'MESH','CURVE'} or obj.hide_render or obj.hide_viewport:
        continue
    if any(c.name in {'Presentation','Cutters'} for c in obj.users_collection):
        continue
    evaluated = obj.evaluated_get(depsgraph)
    mesh = bpy.data.meshes.new_from_object(evaluated,preserve_all_data_layers=True,depsgraph=depsgraph)
    if not mesh or not len(mesh.vertices):
        continue
    ancestor = obj
    while ancestor and ancestor not in animated:
        ancestor = ancestor.parent
    key = ancestor.name if ancestor else 'Static'
    clone = bpy.data.objects.new(obj.name,mesh)
    export.collection.objects.link(clone)
    if ancestor:
        clone.parent = pivots[key]
        clone.matrix_local = poses[1][key].inverted_safe() @ evaluated.matrix_world
    else:
        clone.parent = root
        clone.matrix_local = evaluated.matrix_world
    batches[key].append(clone)
    count += 1
print('Evaluated visible objects:',count,flush=True)

# Join geometry sharing a rigid motion. This removes hundreds of draw calls
# while keeping separate material primitives and the source cutaway faces.
bpy.context.window.scene = export
for key, objects in batches.items():
    bpy.ops.object.select_all(action='DESELECT')
    for obj in objects:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = objects[0]
    if len(objects)>1:
        bpy.ops.object.join()
    merged = bpy.context.view_layer.objects.active
    merged.name = 'Geometry • '+key

for frame in range(1,242):
    for name,pivot in pivots.items():
        loc,rot,scale = poses[frame][name].decompose()
        # Quaternions q and -q encode the same pose; keep adjacent keys on
        # the same hemisphere so interpolation never takes a full turn.
        if frame>1 and rot.dot(pivot.rotation_quaternion)<0:
            rot.negate()
        pivot.location=loc; pivot.rotation_quaternion=rot; pivot.scale=scale
        pivot.keyframe_insert('location',frame=frame-1)
        pivot.keyframe_insert('rotation_quaternion',frame=frame-1)
        pivot.keyframe_insert('scale',frame=frame-1)
export.frame_set(0)
for pivot in pivots.values():
    action=pivot.animation_data.action
    if hasattr(action,'layers'):
        for layer in action.layers:
            for strip in layer.strips:
                for slot in action.slots:
                    bag=strip.channelbag(slot)
                    if bag:
                        for curve in bag.fcurves:
                            for point in curve.keyframe_points:
                                point.interpolation='LINEAR'

output=ROOT/'public/models/inline4-working-v2.glb'
bpy.ops.export_scene.gltf(filepath=str(output),export_format='GLB',use_active_scene=True,
    export_animations=True,export_animation_mode='SCENE',export_anim_scene_split_object=False,
    export_force_sampling=True,export_frame_range=True,export_frame_step=1,
    export_apply=False,export_extras=True,export_cameras=False,export_lights=False,
    export_draco_mesh_compression_enable=True,export_draco_mesh_compression_level=6,
    export_draco_position_quantization=18,export_draco_normal_quantization=12)
report={'source_visible_objects':count,'rigid_batches':len(batches),'moving_groups':len(pivots),
    'export_objects':len(export.objects),'vertices':sum(len(o.data.vertices) for o in export.objects if o.type=='MESH'),
    'bytes':output.stat().st_size,'cycle_seconds':8,
    'pose_examples':{name:{str(f):list(poses[f][name].translation) for f in [1,31,61,121,241]} for name in list(pivots)[:12]}}
(ROOT/'.qa/inline4-bake-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(report,ensure_ascii=True),flush=True)

# A transparent fallback uses the same provided camera and cutaway, with no
# presentation floor or plinth added to the website.
bpy.context.window.scene = source
source.frame_set(45)
source.camera.location.x=-abs(source.camera.location.x)
source.camera.rotation_euler=(Vector((0,0,180))-source.camera.location).to_track_quat('-Z','Y').to_euler()
for name in ['Display plinth','Studio floor']:
    if name in bpy.data.objects: bpy.data.objects[name].hide_render=True
engines={x.identifier for x in source.render.bl_rna.properties['engine'].enum_items}
source.render.engine='BLENDER_EEVEE_NEXT' if 'BLENDER_EEVEE_NEXT' in engines else 'BLENDER_EEVEE'
source.render.resolution_x=900;source.render.resolution_y=900;source.render.resolution_percentage=100
source.render.image_settings.file_format='PNG';source.render.image_settings.color_mode='RGBA'
source.render.film_transparent=True
source.render.filepath=str(ROOT/'public/images/inline4-poster.png')
bpy.ops.render.render(write_still=True)
