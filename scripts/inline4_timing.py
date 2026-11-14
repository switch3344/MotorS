"""Refine this illustration's valve timing without editing the source .blend."""
import math
import re
import bpy

VALVE_LIFT = 5.0
VALVE_DURATION = 240.0
BASE_RADIUS = 18.0
PROFILE_SEGMENTS = 256


def lift_and_derivative(cam_angle, center):
    distance = ((math.degrees(cam_angle) * 2 - center + 360) % 720) - 360
    if abs(distance) >= VALVE_DURATION / 2:
        return 0.0, 0.0
    delta = math.radians(distance) / 2
    factor = 360 / VALVE_DURATION
    return (VALVE_LIFT * math.cos(factor * delta) ** 2,
            -VALVE_LIFT * factor * math.sin(2 * factor * delta))


def apply_timing(scene):
    """Use a convex flat-tappet cam envelope and the identical lift for valves/springs."""
    phases = {}
    for valve in scene.objects:
        if not re.fullmatch(r'(Exhaust|Intake) valve C[1-4]-[12]', valve.name):
            continue
        driver = next(d for d in valve.animation_data.drivers if d.data_path == 'location')
        center = float(re.search(r'\(a-([\d.]+)\)', driver.driver.expression).group(1))
        phases[valve.name] = center
        distance = f'(((a-{center}+360)%720)-360)'
        lift = f'({VALVE_LIFT}*cos({distance}*pi/{VALVE_DURATION})**2 if {distance}**2<{(VALVE_DURATION/2)**2} else 0)'
        driver.driver.expression = f'-{lift}'
        spring = scene.objects['Valve spring ' + valve.name]
        next(d for d in spring.animation_data.drivers if d.data_path == 'scale').driver.expression = f'(42-{lift})/42'
        valve.update_tag()
        spring.update_tag()

        lobe = scene.objects['Cam lobe ' + valve.name]
        old_mesh = lobe.data
        x_min = min(v.co.x for v in old_mesh.vertices)
        x_max = max(v.co.x for v in old_mesh.vertices)
        profile = []
        for i in range(PROFILE_SEGMENTS):
            angle = i * math.tau / PROFILE_SEGMENTS
            height, derivative = lift_and_derivative(angle, center)
            support = BASE_RADIUS + height
            # Envelope of the moving flat follower: p = h*n + h'*n'.
            profile.append((support * math.sin(angle) + derivative * math.cos(angle),
                            -support * math.cos(angle) + derivative * math.sin(angle)))
        vertices = [(x, y, z) for x in [x_min, x_max] for y, z in profile]
        n = PROFILE_SEGMENTS
        faces = [tuple(reversed(range(n))), tuple(range(n, 2*n))]
        faces += [(i, (i+1) % n, (i+1) % n+n, i+n) for i in range(n)]
        mesh = bpy.data.meshes.new(lobe.name + ' refined profile')
        mesh.from_pydata(vertices, [], faces)
        for material in old_mesh.materials:
            mesh.materials.append(material)
        for polygon in mesh.polygons:
            polygon.use_smooth = polygon.index >= 2
        mesh.update()
        lobe.data = mesh
        # Existing bevels and weighted normals remain at full source quality.
    scene.frame_set(2)
    scene.frame_set(1)
    bpy.context.view_layer.update()
    return {'lift_mm': VALVE_LIFT, 'duration_crank_degrees': VALVE_DURATION,
            'profile_segments': PROFILE_SEGMENTS, 'phases': phases,
            'firing_order': [1, 3, 4, 2]}
