import bpy

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.mesh.primitive_cube_add(size=2, location=(0, 0, 0))
cube = bpy.context.active_object
cube.rotation_euler = (0.4, 0.6, 0.2)
bpy.ops.object.light_add(type='SUN', location=(4, -4, 6))
bpy.ops.object.camera_add(location=(0, -6, 2), rotation=(1.25, 0, 0))
bpy.context.scene.camera = bpy.context.active_object
bpy.context.scene.render.engine = 'BLENDER_EEVEE_NEXT' if 'BLENDER_EEVEE_NEXT' in [e.identifier for e in bpy.types.RenderSettings.bl_rna.properties['render_engine'].enum_items] else 'BLENDER_EEVEE'
bpy.context.scene.frame_start = 1
bpy.context.scene.frame_end = 30
bpy.context.scene.render.filepath = "out_pro/blender_"
bpy.context.scene.render.image_settings.file_format = 'FFMPEG'
bpy.ops.render.render(animation=True)
