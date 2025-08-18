from rest_framework import viewsets, permissions, status
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
import os
import mimetypes
from .models import UserFile
from rest_framework import serializers

class UploadedBySerializer(serializers.ModelSerializer):
    class Meta:
        model = UserFile._meta.get_field('uploaded_by').related_model
        fields = ['id', 'username']
    
    def to_representation(self, instance):
        return {
            'id': str(instance.id),
            'name': instance.username
        }

class UserFileSerializer(serializers.ModelSerializer):
    uploaded_by = UploadedBySerializer(read_only=True)
    
    class Meta:
        model = UserFile
        fields = ['id', 'name', 'file', 'uploaded_at', 'file_type', 'size', 'uploaded_by']
        read_only_fields = ['uploaded_by', 'file_type', 'size', 'uploaded_at']

class FileViewSet(viewsets.ModelViewSet):
    parser_classes = (MultiPartParser, FormParser)
    serializer_class = UserFileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # For viewing all files in table view, return all files ordered by upload date
        # Users can only delete their own files (handled in destroy method)
        return UserFile.objects.all().order_by('-uploaded_at')

    def perform_create(self, serializer):
        file_obj = self.request.FILES.get('file')
        if file_obj:
            # Get file type and size
            file_type = mimetypes.guess_type(file_obj.name)[0] or 'application/octet-stream'
            file_size = file_obj.size

            serializer.save(
                uploaded_by=self.request.user,
                file_type=file_type,
                size=file_size
            )
        else:
            # If no file, still save with user
            serializer.save(uploaded_by=self.request.user)
            
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        # Only allow users to delete their own files
        if instance.uploaded_by != request.user:
            return Response(
                {"error": "You can only delete your own files"}, 
                status=status.HTTP_403_FORBIDDEN
            )
        # Delete the actual file
        if instance.file:
            if os.path.isfile(instance.file.path):
                os.remove(instance.file.path)
        return super().destroy(request, *args, **kwargs)
