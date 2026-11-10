"""Create an original, presentation-oriented V12 assembly in Blender.
Run: blender --background --factory-startup --python scripts/generate-v12.py
"""
import bpy, math, json, os
from mathutils import Vector
from math import sin, cos, pi

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'public', 'models')
SOURCE = os.path.join(ROOT, 'assets-source', 'v12')
os.makedirs(OUT, exist_ok=True)
os.makedirs(SOURCE, exist_ok=True)
# Only the fresh background process is modified; no interactive scene is opened.
scene = bpy.context.scene
for obj in list(scene.objects):
    bpy.data.objects.remove(obj, do_unlink=True)
scene.unit_settings.system = 'METRIC'
scene.render.engine = 'CYCLES'
scene.cycles.samples = 64
scene.cycles.use_denoising = True
scene.render.resolution_x = 1600
scene.render.resolution_y = 1200
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = 'PNG'
scene.view_settings.view_transform = 'AgX'

assembly_collection = bpy.data.collections.new('MOTORSERVICE_V12')
scene.collection.children.link(assembly_collection)
groups = {}
created = []

def material(name, color, metal, rough):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    node = mat.node_tree.nodes.get('Principled BSDF')
    rgb = tuple(int(color[i:i+2],16)/255 for i in (1,3,5))
    # Convert brand sRGB values to linear for physically based materials.
    linear = tuple(v/12.92 if v <= .04045 else ((v+.055)/1.055)**2.4 for v in rgb)
    node.inputs['Base Color'].default_value = (*linear,1)
    node.inputs['Metallic'].default_value = metal
    node.inputs['Roughness'].default_value = rough
    mat.diffuse_color = (*linear,1)
    return mat

cast = material('01 · Graphite cast aluminium','#454b52',.78,.34)
alloy = material('02 · Satin machined aluminium','#a8b0b8',.85,.28)
edge = material('03 · Polished machined edges','#d5dbe0',.92,.19)
red = material('04 · Oxblood anodised covers','#a92237',.65,.29)
black = material('05 · Carbon black fasteners','#202329',.72,.32)
rubber = material('06 · Belt and seals','#131518',.0,.7)
exhaust = material('07 · Titanium exhaust','#727d90',.88,.26)
brass = material('08 · Warm brass fittings','#bca36e',.78,.3)
white = material('09 · Inlaid lettering','#e4e6e8',.55,.28)

def assembly(name, zone, explode):
    obj = bpy.data.objects.new(name,None)
    assembly_collection.objects.link(obj)
    obj['zone'] = zone
    obj['explode'] = [explode[0],explode[2],-explode[1]]
    obj['assembly'] = True
    groups[name] = obj
    return obj

block = assembly('01_Crankcase','block',(0,0,0))
liners_l = assembly('02_CylinderBank_L','block',(-.55,0,.45))
liners_r = assembly('03_CylinderBank_R','block',(.55,0,.45))
crank = assembly('04_Crankshaft','pistons',(0,0,-.55))
pistons_l = assembly('05_Pistons_L','pistons',(-1.3,0,.9))
pistons_r = assembly('06_Pistons_R','pistons',(1.3,0,.9))
head_l = assembly('07_Head_L','heads',(-.9,0,1.05))
head_r = assembly('08_Head_R','heads',(.9,0,1.05))
cover_l = assembly('09_CamCover_L','heads',(-1.35,0,1.8))
cover_r = assembly('10_CamCover_R','heads',(1.35,0,1.8))
intake = assembly('11_Intake','all',(0,0,2.25))
exhaust_l = assembly('12_Exhaust_L','all',(-1.5,0,.05))
exhaust_r = assembly('13_Exhaust_R','all',(1.5,0,.05))
timing = assembly('14_TimingDrive','timing',(0,-1.15,.15))
sump = assembly('15_OilSump','oil',(0,0,-1.4))


def attach(obj, name, mat, parent, bevel=0):
    obj.name = name
    for coll in list(obj.users_collection): coll.objects.unlink(obj)
    assembly_collection.objects.link(obj)
    obj.parent = parent
    obj.data.materials.append(mat)
    if bevel:
        mod = obj.modifiers.new('Machined edge radii','BEVEL')
        mod.width = bevel
        mod.segments = 2
    if obj.type == 'MESH':
        for poly in obj.data.polygons: poly.use_smooth = len(poly.vertices) <= 4
        norm = obj.modifiers.new('Weighted corner normals','WEIGHTED_NORMAL')
        norm.keep_sharp = True
        norm.weight = 35
    created.append(obj)
    return obj


def box(name,loc,size,mat,parent,rot=(0,0,0),bevel=.035):
    bpy.ops.mesh.primitive_cube_add(size=1,location=loc,rotation=rot)
    obj = bpy.context.object
    obj.scale = size
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    return attach(obj,name,mat,parent,bevel)


def cylinder(name,loc,radius,depth,mat,parent,axis=(0,0,1),vertices=40,bevel=.012):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices,radius=radius,depth=depth,location=loc)
    obj = bpy.context.object
    obj.rotation_mode = 'QUATERNION'
    obj.rotation_quaternion = Vector((0,0,1)).rotation_difference(Vector(axis))
    return attach(obj,name,mat,parent,bevel)


def tube(name,points,radius,mat,parent,resolution=3):
    curve = bpy.data.curves.new(name,'CURVE')
    curve.dimensions = '3D'
    curve.resolution_u = 12
    curve.bevel_depth = radius
    curve.bevel_resolution = resolution
    spline = curve.splines.new('BEZIER')
    spline.bezier_points.add(len(points)-1)
    for pt,co in zip(spline.bezier_points,points):
        pt.co = co
        pt.handle_left_type = 'AUTO'
        pt.handle_right_type = 'AUTO'
    obj = bpy.data.objects.new(name,curve)
    assembly_collection.objects.link(obj)
    obj.parent = parent
    curve.materials.append(mat)
    created.append(obj)
    return obj


def annulus(name,loc,outer,inner,depth,mat,parent,axis=(0,0,1),segments=48):
    verts=[]; faces=[]
    for z in [-depth/2,depth/2]:
        for r in [outer,inner]:
            verts.extend([(r*cos(2*pi*i/segments),r*sin(2*pi*i/segments),z) for i in range(segments)])
    for i in range(segments):
        j=(i+1)%segments
        faces += [(i,j,2*segments+j,2*segments+i),
                  (segments+j,segments+i,3*segments+i,3*segments+j),
                  (2*segments+i,2*segments+j,3*segments+j,3*segments+i),
                  (j,i,segments+i,segments+j)]
    mesh=bpy.data.meshes.new(name)
    mesh.from_pydata(verts,[],faces); mesh.update()
    obj=bpy.data.objects.new(name,mesh)
    assembly_collection.objects.link(obj)
    obj.location=loc
    obj.rotation_mode='QUATERNION'
    obj.rotation_quaternion=Vector((0,0,1)).rotation_difference(Vector(axis))
    return attach(obj,name,mat,parent,.006)


def torus(name,loc,major,minor,mat,parent,rot=(0,0,0),segments=48):
    bpy.ops.mesh.primitive_torus_add(major_segments=segments,minor_segments=8,location=loc,
        rotation=rot,major_radius=major,minor_radius=minor)
    return attach(bpy.context.object,name,mat,parent)


def bolt(loc,parent,axis=(0,0,1),radius=.042):
    cylinder('Recessed hex fastener',loc,radius,.035,black,parent,axis,6,.004)
    cylinder('Bolt socket',Vector(loc)+Vector(axis)*.019,radius*.38,.004,rubber,parent,axis,6,0)


# Lower crankcase, flanges, reinforcing ribs and sump mating face.
box('Main deep-skirt crankcase',(0,0,.12),(1.45,4.65,.85),cast,block,bevel=.11)
box('Crankcase top deck',(0,0,.54),(1.6,4.72,.13),alloy,block,bevel=.045)
box('Oil pan mating flange',(0,0,-.34),(1.62,4.82,.12),edge,block,bevel=.04)
for x in [-.74,.74]:
    for y in [-2.1,-1.4,-.7,0,.7,1.4,2.1]:
        box('Cast reinforcing web',(x,y,.07),(.10,.15,.65),cast,block,bevel=.025)
        bolt((x,y,-.42),block,(0,0,-1))
for y in [-2.15,-1.45,-.75,-.05,.65,1.35,2.05]:
    box('Main bearing cap',(0,y,-.11),(1.24,.19,.38),alloy,block,bevel=.045)

# Real 12-cylinder layout: two rows of six, 60 degree included angle.
positions=[(i-2.5)*.70 for i in range(6)]
for side,bank,piston_group,head,cover in [(-1,liners_l,pistons_l,head_l,cover_l),(1,liners_r,pistons_r,head_r,cover_r)]:
    angle=side*pi/6
    direction=Vector((sin(angle),0,cos(angle)))
    cross=Vector((cos(angle),0,-sin(angle)))
    origin=Vector((0,0,.38))
    def at(distance,y=0,offset=0):
        return origin+direction*distance+Vector((0,y,0))+cross*offset
    box('Cylinder bank casting',at(.66),(1.00,4.62,.97),cast,bank,(0,angle,0),.065)
    box('Bank lower gasket',at(.23),(1.07,4.69,.045),black,bank,(0,angle,0),.012)
    for i,y in enumerate(positions):
        annulus(f'Cylinder bore {side}:{i+1}',at(.82,y),.344,.282,.76,alloy,bank,direction)
        annulus('Bore machined lip',at(1.21,y),.356,.283,.045,edge,bank,direction)
        # Three visible ring grooves, crown dish, wrist pin and forged conrod.
        cylinder(f'Piston {i+1}',at(.93,y),.276,.35,alloy,piston_group,direction,48,.018)
        cylinder('Piston crown dish',at(1.108,y),.19,.008,cast,piston_group,direction,40,.003)
        for d in [1.04,.998,.956]:
            annulus('Compression ring',at(d,y),.281,.269,.013,black,piston_group,direction)
        cylinder('Floating wrist pin',at(.88,y),.066,.53,edge,piston_group,cross,28,.008)
        a=at(.74,y); b=Vector((side*.12,y,.20))
        mid=(a+b)/2
        cylinder('Forged connecting rod',mid,.067,(a-b).length,alloy,piston_group,a-b,16,.01)
        annulus('Conrod big end',b,.16,.094,.13,alloy,piston_group,(0,1,0),32)
        bolt(b+Vector((.12,-.08,0)),piston_group,(0,-1,0),.034)
        bolt(b+Vector((-.12,-.08,0)),piston_group,(0,-1,0),.034)
    # Head casting, valves and twin overhead camshafts.
    box('Multi-layer head gasket',at(1.26),(1.10,4.65,.045),black,head,(0,angle,0),.01)
    box('DOHC cylinder head',at(1.47),(1.13,4.67,.37),alloy,head,(0,angle,0),.055)
    for y in positions:
        for offset in [-.22,.22]:
            for dy in [-.16,.16]:
                axis=direction
                cylinder('Valve spring',at(1.65,y+dy,offset),.065,.13,black,head,axis,20,.008)
                cylinder('Valve retainer',at(1.72,y+dy,offset),.078,.027,edge,head,axis,24,.006)
        for offset in [-.41,.41]: bolt(at(1.69,y,offset),head,direction)
    for offset in [-.26,.26]:
        cylinder('Camshaft',at(1.71,0,offset),.042,4.38,edge,head,(0,1,0),24,.008)
        for y in positions:
            cylinder('Cam lobe',at(1.71,y,offset),.085,.14,alloy,head,(0,1,0),24,.01)
    # Sculpted red cover with contrast gasket and parallel milling.
    box('Cover perimeter seal',at(1.83),(1.15,4.58,.075),rubber,cover,(0,angle,0),.075)
    box('Red anodised cam cover',at(1.98),(1.08,4.55,.26),red,cover,(0,angle,0),.09)
    box('Machined centre spine',at(2.12),(0.20,4.22,.026),black,cover,(0,angle,0),.018)
    for offset in [-.38,-.30,.30,.38]:
        box('Satin cover rib',at(2.121,0,offset),(.022,4.13,.025),alloy,cover,(0,angle,0),.009)
    for y in [-2.0,-1.2,-.4,.4,1.2,2.0]:
        for offset in [-.44,.44]: bolt(at(2.12,y,offset),cover,direction)
    cylinder('Oil fill neck',at(2.17,1.65),.12,.10,black,cover,direction,32,.02)
    for y in positions:
        cylinder('Spark plug ceramic',at(1.88,y,.09),.044,.20,white,cover,direction,20,.01)

# Forged crankshaft with six journals, paired counterweights and polished ends.
cylinder('Crank main shaft',(0,0,.18),.105,5.55,edge,crank,(0,1,0),40,.015)
for i,y in enumerate(positions):
    phase=i*2*pi/3
    eccentric=Vector((.15*cos(phase),y,.18+.15*sin(phase)))
    cylinder('Big-end journal',eccentric,.12,.36,edge,crank,(0,1,0),32,.01)
    for dy in [-.23,.23]:
        cylinder('Crank counterweight',(.06*cos(phase),y+dy,.18+.06*sin(phase)),.29,.15,cast,crank,(0,1,0),32,.025)
# Rear flywheel with drilled fasteners and starter ring.
cylinder('Flywheel',(0,2.55,.18),.66,.16,alloy,crank,(0,1,0),64,.025)
annulus('Starter ring',(0,2.55,.18),.73,.64,.13,black,crank,(0,1,0),80)
for i in range(12):
    a=2*pi*i/12
    bolt((.49*cos(a),2.645,.18+.49*sin(a)),crank,(0,1,0),.04)

# Six smoothly curved intake runners per bank feeding a central plenum.
for side in [-1,1]:
    for y in positions:
        tube('Individual intake runner',[(side*.68,y,1.63),(side*.47,y,1.99),(side*.35,y,2.39),(side*.22,y,2.48)],.105,alloy,intake,3)
        torus('Intake runner collar',(side*.68,y,1.63),.108,.018,black,intake,(0,side*pi/6,0),32)
box('Central intake plenum',(0,0,2.46),(.66,4.15,.33),cast,intake,bevel=.14)
box('Plenum top plate',(0,0,2.65),(.48,3.65,.035),edge,intake,bevel=.06)
for y in [-1.65,-1.1,-.55,0,.55,1.1,1.65]:
    for x in [-.23,.23]: bolt((x,y,2.675),intake,radius=.027)
cylinder('Throttle body',(0,-2.24,2.43),.26,.36,alloy,intake,(0,1,0),48,.035)
annulus('Throttle throat',(0,-2.44,2.43),.23,.175,.08,edge,intake,(0,1,0),48)
cylinder('Throttle butterfly',(0,-2.485,2.43),.17,.015,brass,intake,(0,1,0),40,.002)
box('Electronic throttle actuator',(.31,-2.20,2.43),(.19,.36,.30),black,intake,bevel=.04)

# Two six-into-one sculpted exhaust headers, flanges and collectors.
for side,parent in [(-1,exhaust_l),(1,exhaust_r)]:
    for i,y in enumerate(positions):
        start=(side*1.0,y,1.55)
        tube('Swept exhaust primary',[start,(side*1.38,y,1.50),(side*(1.58+.035*i),y+.15,.87),(side*1.62,1.40+.10*i,.36)],.073,exhaust,parent,3)
        cylinder('Exhaust flange',start,.12,.07,alloy,parent,(side,0,0),24,.012)
    tube('Six-into-one collector',[(side*1.62,1.65,.36),(side*1.62,2.05,.24),(side*1.61,2.65,.23)],.17,exhaust,parent,3)
    annulus('Collector outlet',(side*1.61,2.67,.23),.20,.14,.12,edge,parent,(0,1,0),40)
    for y in positions:
        tube('Ignition harness',[(side*.68,y,1.8),(side*1.15,y,1.78),(side*1.3,y+.12,1.5)],.018,black,parent,2)

# Front timing chest, concentric pulleys, belt and alternator.
box('Timing cover',(0,-2.46,.80),(1.39,.18,1.72),cast,timing,bevel=.16)
for x,z,r in [(0,.18,.41),(-.57,1.56,.29),(.57,1.56,.29),(.86,.73,.23),(-.74,.60,.22)]:
    cylinder('Accessory pulley',(x,-2.62,z),r,.16,black,timing,(0,1,0),48,.018)
    cylinder('Machined pulley face',(x,-2.715,z),r*.78,.03,alloy,timing,(0,1,0),40,.01)
    annulus('Pulley track',(x,-2.64,z),r*1.02,r*.88,.11,rubber,timing,(0,1,0),48)
    bolt((x,-2.75,z),timing,(0,-1,0),.065)
# A closed, smooth serpentine route; subtly squared profile reads as a belt.
belt=[(0,-2.63,-.24),(-.73,-2.63,.38),(-.90,-2.63,.61),(-.83,-2.63,.80),(-.85,-2.63,1.56),(-.57,-2.63,1.86),(.57,-2.63,1.86),(.86,-2.63,1.56),(1.10,-2.63,.74),(.91,-2.63,.48),(.35,-2.63,-.06),(0,-2.63,-.24)]
tube('Serpentine belt',belt,.027,rubber,timing,2)
cylinder('Alternator housing',(.96,-2.25,.72),.25,.54,alloy,timing,(0,1,0),40,.03)
for i in range(12):
    a=2*pi*i/12
    box('Alternator cooling fin',(.96+.25*cos(a),-2.25,.72+.25*sin(a)),(.035,.43,.035),edge,timing,bevel=.008)
for x in [-.59,.59]:
    for z in [.1,.65,1.2,1.56]: bolt((x,-2.57,z),timing,(0,-1,0),.037)

# Ribbed oil sump with billet flange, drain plug and spin-on filter.
box('Sump upper flange',(0,0,-.48),(1.66,4.77,.13),alloy,sump,bevel=.05)
box('Deep oil sump',(0,.30,-.78),(1.35,3.85,.59),cast,sump,bevel=.11)
for x in [-.53,-.35,-.18,0,.18,.35,.53]:
    box('Sump cooling rib',(x,.30,-1.09),(.038,3.55,.09),alloy,sump,bevel=.014)
for side in [-1,1]:
    for y in [-2.1,-1.4,-.7,0,.7,1.4,2.1]: bolt((side*.75,y,-.57),sump,(0,0,-1),.037)
cylinder('Drain plug',(.68,1.6,-.87),.07,.06,brass,sump,(1,0,0),6,.006)
cylinder('Oil filter',(-.91,-1.65,-.48),.20,.58,black,sump,(0,0,1),40,.025)
annulus('Filter collar',(-.91,-1.65,-.19),.21,.15,.045,alloy,sump,(0,0,1),40)

# Bake bevels and weighted normals, then join per assembly.
# Material slots are preserved while draw calls and scene traversal stay bounded.
for obj in list(created):
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True); bpy.context.view_layer.objects.active=obj
    if obj.type != 'MESH': bpy.ops.object.convert(target='MESH')
    for modifier in list(obj.modifiers):
        try: bpy.ops.object.modifier_apply(modifier=modifier.name)
        except RuntimeError: pass
for parent in groups.values():
    children=[obj for obj in parent.children if obj.type=='MESH']
    if not children: continue
    bpy.ops.object.select_all(action='DESELECT')
    for obj in children: obj.select_set(True)
    bpy.context.view_layer.objects.active=children[0]
    bpy.ops.object.join()
    mesh=bpy.context.object
    mesh.name=parent.name+'_Geometry'
    mesh.parent=parent
bpy.context.view_layer.update()

# Export only the authored engine. Studio lights, floor and camera remain in .blend.
bpy.ops.object.select_all(action='DESELECT')
for obj in assembly_collection.objects: obj.select_set(True)
glb=os.path.join(OUT,'motorservice-v12.glb')
bpy.ops.export_scene.gltf(filepath=glb,export_format='GLB',use_selection=True,
    export_apply=True,export_extras=True,export_animations=False,export_cameras=False,
    export_lights=False,export_texcoords=False,export_materials='EXPORT')

# Studio for source-file inspection and a photographic quality-control render.
studio=bpy.data.collections.new('STUDIO · not exported'); scene.collection.children.link(studio)
world=bpy.data.worlds.new('Dark studio')
scene.world=world; world.use_nodes=True
world.node_tree.nodes['Background'].inputs[0].default_value=(.10,.12,.16,1)
world.node_tree.nodes['Background'].inputs[1].default_value=.45

def area(name,loc,power,color,size,target=(0,0,.7),size_y=None):
    data=bpy.data.lights.new(name,'AREA'); data.energy=power; data.color=color
    data.shape='RECTANGLE'; data.size=size; data.size_y=size_y or size
    obj=bpy.data.objects.new(name,data); studio.objects.link(obj); obj.location=loc
    obj.rotation_euler=(Vector(target)-obj.location).to_track_quat('-Z','Y').to_euler()
area('Large soft key',(3,-5,7),1500,(.86,.93,1),5,size_y=6)
area('Left strip',(-5,-1,4),1800,(1,.9,.82),2,size_y=7)
area('Red rim',(2,4,4.5),2200,(1,.16,.23),3,size_y=4)
area('Top softbox',(0,2,7),1900,(.85,.92,1),4,size_y=5)
bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,-1.19))
floor=bpy.context.object; floor.name='Studio floor'
floor.data.materials.append(material('Studio graphite','#14161a',.12,.35))
for col in list(floor.users_collection): col.objects.unlink(floor)
studio.objects.link(floor)
data=bpy.data.cameras.new('Camera'); camera=bpy.data.objects.new('Camera',data); studio.objects.link(camera)
camera.location=(7.4,-9.4,6.5)
camera.rotation_euler=(Vector((0,0,.7))-camera.location).to_track_quat('-Z','Y').to_euler()
data.lens=48; scene.camera=camera
scene.render.filepath=os.path.join(SOURCE,'v12-studio.png')
# Leave only the engine selected for a useful opening state.
bpy.ops.object.select_all(action='DESELECT')
for obj in assembly_collection.objects: obj.select_set(True)
bpy.context.view_layer.objects.active=groups['01_Crankcase']
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(SOURCE,'motorservice-v12.blend'))
summary={'blender':bpy.app.version_string,'cylinders':12,'banks':2,'assemblies':len(groups),
    'objects_before_join':len(created),'mesh_objects':len([o for o in assembly_collection.objects if o.type=='MESH']),
    'vertices':sum(len(o.data.vertices) for o in assembly_collection.objects if o.type=='MESH'),
    'glb_bytes':os.path.getsize(glb),'model':'/models/motorservice-v12.glb',
    'note':'Original presentation model. 60 degree V12 layout; not a manufacturer-specific engineering drawing.'}
with open(os.path.join(SOURCE,'report.json'),'w',encoding='utf-8') as file: json.dump(summary,file,ensure_ascii=False,indent=2)
print('V12_REPORT',json.dumps(summary))
bpy.ops.render.render(write_still=True)
