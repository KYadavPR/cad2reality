# cad_parser/parser.py

import ezdxf


def load_dxf(file_path):
    try:
        doc = ezdxf.readfile(file_path)
        return doc
    except Exception as e:
        print(f"Error: {e}")
        return None


def load_dxf_from_stream(stream):
    """Load DXF from an in-memory file stream (for upload handling)."""
    try:
        doc = ezdxf.read(stream)
        return doc
    except Exception as e:
        print(f"Error reading DXF stream: {e}")
        return None
