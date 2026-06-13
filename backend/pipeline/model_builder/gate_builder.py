import trimesh

def build_gate(width_mm, height_mm, bars):
    width = width_mm / 1000
    height = height_mm / 1000
    frame_thickness = 0.05
    depth = 0.05

    scene = trimesh.Scene()

    # Top frame
    top = trimesh.creation.box(extents=(width, frame_thickness, depth))
    top.apply_translation((0, height / 2, 0))
    scene.add_geometry(top, node_name="frame_top")

    # Bottom frame
    bottom = trimesh.creation.box(extents=(width, frame_thickness, depth))
    bottom.apply_translation((0, -height / 2, 0))
    scene.add_geometry(bottom, node_name="frame_bottom")

    # Left frame
    left = trimesh.creation.box(extents=(frame_thickness, height, depth))
    left.apply_translation((-width / 2, 0, 0))
    scene.add_geometry(left, node_name="frame_left")

    # Right frame
    right = trimesh.creation.box(extents=(frame_thickness, height, depth))
    right.apply_translation((width / 2, 0, 0))
    scene.add_geometry(right, node_name="frame_right")

    # Vertical bars
    spacing = width / (bars + 1)
    for i in range(bars):
        bar = trimesh.creation.box(extents=(0.03, height, depth))
        x = -width / 2 + spacing * (i + 1)
        bar.apply_translation((x, 0, 0))
        scene.add_geometry(bar, node_name=f"bar_{i}")

    return scene
