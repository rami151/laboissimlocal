from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from .models import Publication
from rest_framework import serializers

class PostedBySerializer(serializers.ModelSerializer):
    class Meta:
        model = Publication._meta.get_field('posted_by').related_model
        fields = ['id', 'username']
    
    def to_representation(self, instance):
        return {
            'id': str(instance.id),
            'name': instance.username
        }

class PublicationSerializer(serializers.ModelSerializer):
    posted_by = PostedBySerializer(read_only=True)
    
    class Meta:
        model = Publication
        fields = ['id', 'title', 'abstract', 'posted_by', 'posted_at']
        read_only_fields = ['posted_by', 'posted_at']

class PublicationViewSet(viewsets.ModelViewSet):
    serializer_class = PublicationSerializer

    def get_permissions(self):
        """
        Allow public access to list and retrieve publications,
        but require authentication for create, update, and delete operations.
        """
        if self.action in ['list', 'retrieve']:
            permission_classes = [permissions.AllowAny]
        else:
            permission_classes = [permissions.IsAuthenticated]
        return [permission() for permission in permission_classes]

    def get_queryset(self):
        # Return all publications ordered by posting date
        # Users can only delete their own publications (handled in destroy method)
        return Publication.objects.all().order_by('-posted_at')

    def perform_create(self, serializer):
        serializer.save(posted_by=self.request.user)
            
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        # Only allow users to delete their own publications
        if instance.posted_by != request.user:
            return Response(
                {"error": "You can only delete your own publications"}, 
                status=status.HTTP_403_FORBIDDEN
            )
        return super().destroy(request, *args, **kwargs)
