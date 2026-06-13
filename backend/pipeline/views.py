import os
import uuid
import tempfile
import traceback

from django.conf import settings
from django.http import FileResponse, Http404
from django.shortcuts import render

from rest_framework.decorators import api_view, parser_classes
from rest_framework.parsers import MultiPartParser
from rest_framework.response import Response
from rest_framework import status

from .serializers import DXFUploadSerializer
from .cad_parser.parser import load_dxf
from .cad_parser.extractor import extract_dimensions, count_vertical_bars
from .ai_engine.gemma_classifier import classify_object
# Removed hardcoded builder imports

# Ensure output directory exists
GENERATED_DIR = os.path.join(settings.MEDIA_ROOT, 'generated_glb')
UPLOAD_DIR = os.path.join(settings.MEDIA_ROOT, 'uploads')
os.makedirs(GENERATED_DIR, exist_ok=True)
os.makedirs(UPLOAD_DIR, exist_ok=True)


@api_view(['POST'])
@parser_classes([MultiPartParser])
def upload_and_process(request):
    """
    Full CAD2Reality pipeline:
    Upload DXF → Parse → Extract Features → AI Classify → Build 3D → Export GLB
    """
    serializer = DXFUploadSerializer(data=request.data)

    if not serializer.is_valid():
        return Response(
            {'error': serializer.errors},
            status=status.HTTP_400_BAD_REQUEST
        )

    uploaded_file = serializer.validated_data['file']

    import urllib.parse
    
    # Generate unique filename
    file_id = str(uuid.uuid4())[:8]

    # Clean the filename: decode URL encoding (like %20) and replace spaces with underscores
    decoded_name = urllib.parse.unquote(uploaded_file.name)
    original_name = os.path.splitext(decoded_name)[0].replace(" ", "_")
    safe_name = f"{original_name}_{file_id}"

    # Save uploaded file temporarily
    upload_path = os.path.join(UPLOAD_DIR, f"{safe_name}.dxf")
    with open(upload_path, 'wb+') as dest:
        for chunk in uploaded_file.chunks():
            dest.write(chunk)

    try:
        # =============================
        # STEP 1: Load CAD File
        # =============================
        doc = load_dxf(upload_path)
        if doc is None:
            return Response(
                {'error': 'Failed to parse DXF file. Please check the file format.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # =============================
        # STEP 2: Extract Features
        # =============================
        dimensions = extract_dimensions(doc)
        bars = count_vertical_bars(doc)

        features = {
            'width': dimensions['width'],
            'height': dimensions['height'],
            'bars': bars
        }

        # =============================
        # STEP 3: Gemini Classification
        # =============================
        try:
            classification_result = classify_object(features)
            object_type = classification_result.get("object_type", "Unknown")
            depth_mm = classification_result.get("depth_mm", 50.0)
        except Exception as e:
            error_msg = f"Gemini AI classification failed: {str(e)}. Make sure google-generativeai is installed."
            print(error_msg)
            return Response(
                {'error': error_msg},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        # =============================
        # STEP 4: Generate 3D Model
        # =============================
        glb_filename = f"{safe_name}.glb"
        glb_path = os.path.join(GENERATED_DIR, glb_filename)
        from .model_builder.generic_builder import build_from_dxf
        
        # Build the 3D model dynamically directly from the DXF lines, using the Gemini-estimated depth
        model = build_from_dxf(doc, depth_mm)
        model.export(glb_path)
        model_generated = True

        # Pass features as query params so AR viewer can render labels
        base_url = request.build_absolute_uri('/').rstrip('/')
        ar_url = f'{base_url}/api/pipeline/ar/{glb_filename}?w={features["width"]}&h={features["height"]}' if model_generated else None
        
        # Build response
        response_data = {
            'success': True,
            'pipeline': {
                'step1_parse': {
                    'status': 'success',
                    'message': f'DXF file parsed: {uploaded_file.name}',
                },
                'step2_features': {
                    'status': 'success',
                    'features': features,
                },
                'step3_classification': {
                    'status': 'success',
                    'object_type': object_type,
                },
                'step4_model': {
                    'status': 'success' if model_generated else 'unsupported',
                    'message': f'3D {object_type} model generated' if model_generated else f'Unsupported object type: {object_type}',
                },
            },
            'result': {
                'object_type': object_type,
                'features': features,
                'model_generated': model_generated,
                'glb_url': f'{base_url}/api/pipeline/model/{glb_filename}' if model_generated else None,
                'ar_url': ar_url,
            }
        }

        return Response(response_data, status=status.HTTP_200_OK)

    except Exception as e:
        traceback.print_exc()
        return Response(
            {'error': f'Pipeline failed: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
def serve_model(request, filename):
    """Serve a generated GLB file."""
    file_path = os.path.join(GENERATED_DIR, filename)

    if not os.path.exists(file_path):
        raise Http404("Model not found")

    response = FileResponse(
        open(file_path, 'rb'),
        content_type='model/gltf-binary'
    )
    response['Content-Disposition'] = f'inline; filename="{filename}"'
    response['Access-Control-Allow-Origin'] = '*'
    return response


@api_view(['GET'])
def ar_viewer(request, filename):
    """Serve the AR viewer HTML page with model-viewer for the given GLB."""
    file_path = os.path.join(GENERATED_DIR, filename)

    if not os.path.exists(file_path):
        raise Http404("Model not found")

    base_url = request.build_absolute_uri('/').rstrip('/')
    model_url = f'{base_url}/api/pipeline/model/{filename}'

    # Read dimensions from query params for CSS labels
    width = request.GET.get('w', '0')
    height = request.GET.get('h', '0')

    return render(request, 'pipeline/ar_viewer.html', {
        'model_url': model_url,
        'filename': filename,
        'model_width': width,
        'model_height': height,
    })


@api_view(['GET'])
def health_check(request):
    """Simple health check endpoint."""
    return Response({'status': 'ok', 'service': 'CAD2Reality Pipeline API'})
