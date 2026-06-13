import trimesh

def build_door(width_mm, height_mm):
    """Builds a simple solid door."""
    width = width_mm / 1000
    height = height_mm / 1000
    depth = 0.05
    
    scene = trimesh.Scene()

    # Solid panel
    door = trimesh.creation.box(extents=(width, height, depth))
    scene.add_geometry(door, node_name="door_panel")
    
    # Door knob/handle (simple cylinder)
    handle = trimesh.creation.cylinder(radius=0.03, height=0.1)
    handle.apply_translation((width / 2 - 0.1, 0, depth + 0.02))
    scene.add_geometry(handle, node_name="door_handle")
    
    return scene

def build_window(width_mm, height_mm, bars=2):
    """Builds a window frame with optional cross bars."""
    width = width_mm / 1000
    height = height_mm / 1000
    frame_thickness = 0.06
    depth = 0.06
    
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
    
    # Vertical bars (mullions)
    if bars > 0:
        spacing = width / (bars + 1)
        for i in range(bars):
            bar = trimesh.creation.box(extents=(0.02, height, depth - 0.02))
            x = -width / 2 + spacing * (i + 1)
            bar.apply_translation((x, 0, 0))
            scene.add_geometry(bar, node_name=f"bar_{i}")
            
    # One horizontal cross bar
    cross = trimesh.creation.box(extents=(width, 0.02, depth - 0.02))
    scene.add_geometry(cross, node_name="cross_bar")
    
    return scene

def build_railing(width_mm, height_mm, bars):
    """Builds a railing structure."""
    width = width_mm / 1000
    height = height_mm / 1000
    depth = 0.05
    
    scene = trimesh.Scene()
    
    # Top handrail
    handrail = trimesh.creation.box(extents=(width, 0.08, depth + 0.02))
    handrail.apply_translation((0, height / 2, 0))
    scene.add_geometry(handrail, node_name="frame_top")
    
    # Bottom rail
    bottom = trimesh.creation.box(extents=(width, 0.04, depth))
    bottom.apply_translation((0, -height / 2 + 0.1, 0))
    scene.add_geometry(bottom, node_name="frame_bottom")
    
    # Spindles / Balusters
    if bars == 0:
        bars = int(width / 0.15) # default spacing
        
    spacing = width / (bars + 1)
    for i in range(bars):
        bar = trimesh.creation.box(extents=(0.02, height - 0.1, depth))
        x = -width / 2 + spacing * (i + 1)
        bar.apply_translation((x, 0.05, 0))
        scene.add_geometry(bar, node_name=f"bar_{i}")
        
    return scene

def build_from_dxf(doc, depth_mm=50.0):
    """Fallback: builds a 3D scene directly from the lines in the DXF file."""
    import numpy as np
    
    scene = trimesh.Scene()
    msp = doc.modelspace()
    
    thickness = 0.02 # 2cm thick lines
    depth = depth_mm / 1000.0 # Convert mm to meters
    
    lines = []
    xs = []
    ys = []
    
    for entity in msp:
        if entity.dxftype() == "LINE":
            start = np.array([entity.dxf.start.x, entity.dxf.start.y, 0])
            end = np.array([entity.dxf.end.x, entity.dxf.end.y, 0])
            lines.append((start, end))
            xs.extend([start[0], end[0]])
            ys.extend([start[1], end[1]])
            
    if not lines:
        # Fallback to simple box if no lines found
        width = 1.0
        height = 1.0
        box = trimesh.creation.box(extents=(width, height, depth))
        scene.add_geometry(box, node_name="fallback_box")
        return scene
        
    min_x, max_x = min(xs), max(xs)
    min_y, max_y = min(ys), max(ys)
    
    center_x = (min_x + max_x) / 2
    center_y = (min_y + max_y) / 2
    
    for i, (start, end) in enumerate(lines):
        # Translate to center and scale to meters
        s = (start - np.array([center_x, center_y, 0])) / 1000.0
        e = (end - np.array([center_x, center_y, 0])) / 1000.0
        
        v = e - s
        length = np.linalg.norm(v)
        
        if length < 0.001:
            continue
            
        # Create a box for the line (length along Y-axis)
        box = trimesh.creation.box(extents=(thickness, length, depth))
        
        direction = v / length
        angle = np.arctan2(direction[1], direction[0])
        rot_angle = angle - np.pi/2
        
        matrix = trimesh.transformations.rotation_matrix(rot_angle, [0, 0, 1])
        
        # Translate to the midpoint
        midpoint = (s + e) / 2
        matrix[:3, 3] = midpoint
        
        box.apply_transform(matrix)
        scene.add_geometry(box, node_name=f"line_{i}")
        
    return scene
