import bpy, os, math

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.resolution_x = 1080
scene.render.resolution_y = 1920
scene.render.resolution_percentage = 50
scene.render.fps = 30
scene.frame_start = 1
scene.frame_end = 90

world = bpy.data.worlds.new("YunaWorld")
scene.world = world
world.use_nodes = True
bg = world.node_tree.nodes.get("Background")
if bg:
    bg.inputs[0].default_value = (0.02, 0.04, 0.09, 1.0)

import glob as _glob
_glb_files = sorted(_glob.glob("public/approved/props/*.glb") + _glob.glob("public/approved/chars/*/*.glb"))
_glb_loaded = False
if _glb_files:
    try:
        bpy.ops.import_scene.gltf(filepath=_glb_files[0])
        _meshes = [o for o in bpy.context.selected_objects if o.type == "MESH"]
        if _meshes:
            core = _meshes[0]
            core.location = (0, 0, 0.3)
            _glb_loaded = True
    except Exception as _ge:
        print("GLB_IMPORT_FALLBACK:", _ge)
if not _glb_loaded:
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=1.35, location=(0, 0, 0.3))
if not _glb_loaded:
    core = bpy.context.active_object
    mat1 = bpy.data.materials.new("CoreMat")
if not _glb_loaded:
    mat1.use_nodes = True
    bsdf = mat1.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = (0.08, 0.65, 0.98, 1.0)
        bsdf.inputs["Metallic"].default_value = 0.85
        bsdf.inputs["Roughness"].default_value = 0.2
    core.data.materials.append(mat1)

bpy.ops.mesh.primitive_torus_add(major_radius=2.1, minor_radius=0.14, location=(0, 0, 0.3))
ring = bpy.context.active_object
mat2 = bpy.data.materials.new("RingMat")
mat2.use_nodes = True
bsdf2 = mat2.node_tree.nodes.get("Principled BSDF")
if bsdf2:
    bsdf2.inputs["Base Color"].default_value = (0.96, 0.72, 0.15, 1.0)
    bsdf2.inputs["Metallic"].default_value = 0.9
ring.data.materials.append(mat2)

for f_idx, ang in [(1, 0.0), (45, math.pi), (90, math.tau)]:
    core.rotation_euler = (0.3, ang, 0.2)
    core.keyframe_insert(data_path="rotation_euler", frame=f_idx)
    ring.rotation_euler = (0.9, -ang, 0.4)
    ring.keyframe_insert(data_path="rotation_euler", frame=f_idx)

bpy.ops.object.light_add(type="AREA", location=(3.5, -4.0, 5.0))
bpy.context.active_object.data.energy = 800
bpy.ops.object.camera_add(location=(0, -6.8, 1.2), rotation=(1.42, 0, 0))
scene.camera = bpy.context.active_object

engines = [e.identifier for e in bpy.types.RenderSettings.bl_rna.properties["render_engine"].enum_items]
scene.render.engine = "BLENDER_EEVEE_NEXT" if "BLENDER_EEVEE_NEXT" in engines else "BLENDER_EEVEE"
os.makedirs("out_pro", exist_ok=True)
scene.render.filepath = "out_pro/blender_clip.mp4"
scene.render.image_settings.file_format = "FFMPEG"
scene.render.ffmpeg.format = "MPEG4"
scene.render.ffmpeg.codec = "H264"
bpy.ops.render.render(animation=True)
