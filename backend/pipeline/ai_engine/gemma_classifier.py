import os
try:
    import google.generativeai as genai
    HAS_GENAI = True
except ImportError:
    HAS_GENAI = False

def classify_object(features):
    if not HAS_GENAI:
        return {"object_type": "Unknown (pip install google-generativeai)", "depth_mm": 50.0}
        
    api_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        return {"object_type": "Unknown (Missing API Key)", "depth_mm": 50.0}
        
    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        prompt = f"""
        You are a CAD expert AI.

        Analyze these CAD features extracted from a DXF file:
        Width: {features['width']} mm
        Height: {features['height']} mm
        Vertical Lines / Bars: {features['bars']}

        Based on these dimensions, identify the real-world object and estimate a realistic depth (thickness) for it in millimeters.
        
        Return ONLY a raw JSON object in the exact format below, with no markdown, no code blocks, and no other text:
        {{
            "object_type": "Name of object (e.g., Gate, Window, Table)",
            "depth_mm": 50
        }}
        """

        response = model.generate_content(prompt)
        result_text = response.text.strip()
        
        # Clean up any potential markdown code blocks
        if result_text.startswith("```json"):
            result_text = result_text[7:]
        if result_text.endswith("```"):
            result_text = result_text[:-3]
            
        import json
        result = json.loads(result_text.strip())
        
        return {
            "object_type": result.get("object_type", "Unknown"),
            "depth_mm": float(result.get("depth_mm", 50.0))
        }
        
    except Exception as e:
        print(f"Gemini API Error: {e}")
        return {"object_type": "Unknown", "depth_mm": 50.0}
