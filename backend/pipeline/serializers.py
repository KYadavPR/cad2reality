from rest_framework import serializers


class DXFUploadSerializer(serializers.Serializer):
    """Serializer for DXF file upload validation."""
    file = serializers.FileField()

    def validate_file(self, value):
        if not value.name.lower().endswith('.dxf'):
            raise serializers.ValidationError("Only .dxf files are accepted.")
        if value.size > 10 * 1024 * 1024:  # 10MB limit
            raise serializers.ValidationError("File size must be under 10MB.")
        return value
