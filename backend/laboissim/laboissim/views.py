from django.contrib.auth.models import User
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from rest_framework import serializers, status, viewsets
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.decorators import api_view, permission_classes, action
from django.db import transaction
from .models import SiteContent, UserProfile, Project, ProjectDocument, ProjectDeletionRequest
from django.db import models
from rest_framework.exceptions import PermissionDenied

# Custom permission class for projects
class ProjectPermission:
    """
    Custom permission class that allows:
    - Admin users to do anything
    - Project creators to edit their own projects
    - Other users to view only
    """
    
    def has_permission(self, request, view):
        user = request.user
        
        # Ensure user has a profile
        if not hasattr(user, 'profile'):
            from .models import UserProfile
            profile, created = UserProfile.objects.get_or_create(user=user, defaults={'role': 'member'})
            print(f"Created profile for user {user.username} with role: {profile.role}")
        
        return request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        user = request.user
        
        # Ensure user has a profile
        if not hasattr(user, 'profile'):
            from .models import UserProfile
            profile, created = UserProfile.objects.get_or_create(user=user, defaults={'role': 'member'})
            print(f"Created profile for user {user.username} with role: {profile.role}")
        
        print(f"=== PERMISSION CHECK DEBUG ===")
        print(f"User: {user.username}")
        print(f"User ID: {user.id}")
        print(f"Has profile: {hasattr(user, 'profile')}")
        if hasattr(user, 'profile'):
            print(f"Profile role: {user.profile.role}")
            print(f"Is admin: {user.profile.is_admin}")
        print(f"Action: {view.action}")
        print(f"Object created by: {obj.created_by.username}")
        print(f"Object created by ID: {obj.created_by.id}")
        
        # Admin users can do anything
        if hasattr(user, 'profile') and user.profile.is_admin:
            print("Permission granted: User is admin")
            return True
        # Superusers can also do anything
        if user.is_superuser:
            print("Permission granted: User is superuser")
            return True
            
        # For update/delete operations
        if view.action in ['update', 'partial_update', 'destroy']:
            # Project creators can edit their own projects
            if obj.created_by == user:
                print("Permission granted: User is project creator")
                return True
            # Chef d'équipe can edit their own projects
            if (hasattr(user, 'profile') and 
                user.profile.is_chef_d_equipe and 
                obj.created_by == user):
                print("Permission granted: User is chef d'équipe and project creator")
                return True
            print("Permission denied: User cannot edit this project")
            return False
            
        # For other operations, allow if user is authenticated
        print("Permission granted: User is authenticated")
        return True

# Serializer for the User model
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'is_staff', 'is_superuser', 'date_joined']

# Serializer for UserProfile model
class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ['phone', 'bio', 'profile_image', 'location', 'institution', 'website', 'linkedin', 'twitter', 'github', 'role']


# Extended User Serializer with profile data
class ExtendedUserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(read_only=True)
    full_name = serializers.SerializerMethodField()
    role = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'is_staff', 'is_superuser', 'date_joined', 'profile', 'full_name', 'role']

    def get_full_name(self, obj):
        return obj.profile.full_name if hasattr(obj, 'profile') else f"{obj.first_name} {obj.last_name}".strip() or obj.username

    def get_role(self, obj):
        try:
            if obj.is_superuser:
                return "admin"
            profile = getattr(obj, 'profile', None)
            if profile and hasattr(profile, 'role'):
                return profile.role
            # If no profile exists, create one with default role 'member'
            if not profile:
                profile, created = UserProfile.objects.get_or_create(user=obj, defaults={'role': 'member'})
                return profile.role
            return "member"  # Fallback if all else fails
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error determining role for user {obj.id}: {str(e)}")
            return "member"  # Safe fallback
# Serializer for the SiteContent
class SiteContentSerializer(serializers.ModelSerializer):
    class Meta:
        model = SiteContent
        fields = '__all__'

# Project Serializer

class ProjectDocumentSerializer(serializers.ModelSerializer):
    uploaded_by = ExtendedUserSerializer(read_only=True)
    file_size_mb = serializers.ReadOnlyField()
    file_extension = serializers.ReadOnlyField()
    is_image = serializers.ReadOnlyField()
    
    class Meta:
        model = ProjectDocument
        fields = ['id', 'file', 'name', 'file_type', 'description', 'uploaded_by', 'uploaded_at', 'is_public', 'file_size_mb', 'file_extension', 'is_image']
        read_only_fields = ['uploaded_by', 'uploaded_at', 'file_size_mb', 'file_extension', 'is_image']
    
    def create(self, validated_data):
        request = self.context.get('request')
        validated_data['uploaded_by'] = request.user
        return super().create(validated_data)

class ProjectSerializer(serializers.ModelSerializer):
    created_by = ExtendedUserSerializer(read_only=True)
    documents = ProjectDocumentSerializer(many=True, read_only=True)
    can_edit = serializers.SerializerMethodField()
    can_delete = serializers.SerializerMethodField()
    can_request_deletion = serializers.SerializerMethodField()
    has_pending_deletion_request = serializers.SerializerMethodField()
    
    class Meta:
        model = Project
        fields = '__all__'
    
    def get_can_edit(self, obj):
        request = self.context.get('request')
        if request and request.user:
            return obj.can_edit(request.user)
        return False
    
    def get_can_delete(self, obj):
        request = self.context.get('request')
        if request and request.user:
            return obj.can_delete(request.user)
        return False
    
    def get_can_request_deletion(self, obj):
        request = self.context.get('request')
        if request and request.user:
            return obj.can_request_deletion(request.user)
        return False
    
    def get_has_pending_deletion_request(self, obj):
        return obj.has_pending_deletion_request()
    
    def create(self, validated_data):
        request = self.context.get('request')
        validated_data['created_by'] = request.user
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        request = self.context.get('request')
        
        # Handle file uploads
        if 'image' in request.FILES:
            instance.image = request.FILES['image']
        
        # Handle document uploads
        if 'documents' in request.FILES:
            # Clear existing documents if new ones are uploaded
            instance.documents.all().delete()
            
            # Create new document records
            for document_file in request.FILES.getlist('documents'):
                ProjectDocument.objects.create(
                    project=instance,
                    file=document_file,
                    name=document_file.name,
                    uploaded_by=request.user,
                    file_type='document'  # Default type, can be enhanced later
                )
        
        return super().update(instance, validated_data)

class ProjectDeletionRequestSerializer(serializers.ModelSerializer):
    requested_by = ExtendedUserSerializer(read_only=True)
    reviewed_by = ExtendedUserSerializer(read_only=True)
    project_title = serializers.CharField(source='project.title', read_only=True)
    can_approve = serializers.SerializerMethodField()
    
    class Meta:
        model = ProjectDeletionRequest
        fields = '__all__'
        read_only_fields = ['requested_by', 'status', 'requested_at', 'reviewed_at', 'reviewed_by']
    
    def get_can_approve(self, obj):
        request = self.context.get('request')
        if request and request.user:
            return obj.can_be_approved_by(request.user)
        return False
    
    def create(self, validated_data):
        request = self.context.get('request')
        validated_data['requested_by'] = request.user
        return super().create(validated_data)

class ProjectDeletionRequestAdminSerializer(serializers.ModelSerializer):
    """Serializer for admin operations on deletion requests"""
    requested_by = ExtendedUserSerializer(read_only=True)
    reviewed_by = ExtendedUserSerializer(read_only=True)
    project_title = serializers.CharField(source='project.title', read_only=True)
    project_id = serializers.IntegerField(source='project.id', read_only=True)
    
    class Meta:
        model = ProjectDeletionRequest
        fields = '__all__'
        read_only_fields = ['requested_by', 'requested_at', 'project_title', 'project_id']

# API view to return and update the singleton SiteContent
class SiteContentView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        content, _ = SiteContent.objects.get_or_create(id=1)
        serializer = SiteContentSerializer(content)
        return Response(serializer.data)

    def put(self, request):
        if not request.user.is_staff:
            return Response({'detail': 'Not authorized.'}, status=status.HTTP_403_FORBIDDEN)
        content, _ = SiteContent.objects.get_or_create(id=1)
        serializer = SiteContentSerializer(content, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# API view to return the current user's data
class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = ExtendedUserSerializer(request.user)
        return Response(serializer.data)

# API view to get all team members
class TeamMembersView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        """Get all team members with their profiles"""
        users = User.objects.filter(is_active=True).prefetch_related('profile')
        serializer = ExtendedUserSerializer(users, many=True)
        return Response(serializer.data)

# API view to update user profile
class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request):
        """Get current user's profile"""
        try:
            profile = request.user.profile
            serializer = UserProfileSerializer(profile)
            return Response(serializer.data)
        except UserProfile.DoesNotExist:
            # Create profile if it doesn't exist
            profile = UserProfile.objects.create(user=request.user)
            serializer = UserProfileSerializer(profile)
            return Response(serializer.data)

    def put(self, request):
        """Update current user's profile"""
        try:
            profile = request.user.profile
        except UserProfile.DoesNotExist:
            profile = UserProfile.objects.create(user=request.user)
        
        # Handle file upload for profile image
        if 'profile_image' in request.FILES:
            profile.profile_image = request.FILES['profile_image']
        
        # Handle other fields
        data = request.data.copy()
        if 'profile_image' in data:
            del data['profile_image']  # Remove from data since we handled it above
        
        serializer = UserProfileSerializer(profile, data=data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request):
        """Partial update of current user's profile"""
        return self.put(request)

# Project ViewSet
class ProjectViewSet(viewsets.ModelViewSet):
    serializer_class = ProjectSerializer
    permission_classes = [ProjectPermission]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    
    def get_queryset(self):
        return Project.objects.all()
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    def perform_update(self, serializer):
        """Update project - permission is handled by ProjectPermission class"""
        serializer.save()
    
    def perform_destroy(self, instance):
        """Delete project - only unvalidated projects can be deleted directly"""
        if instance.is_validated:
            raise PermissionDenied("Validated projects cannot be deleted directly. Please request deletion through the deletion request system.")
        instance.delete()
    
    @action(detail=True, methods=['post'])
    def request_deletion(self, request, pk=None):
        """Request deletion of a validated project"""
        project = self.get_object()
        
        if not project.can_request_deletion(request.user):
            raise PermissionDenied("You cannot request deletion of this project")
        
        if project.has_pending_deletion_request():
            return Response({
                'error': 'A deletion request is already pending for this project'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        reason = request.data.get('reason')
        if not reason:
            return Response({
                'error': 'Reason is required for deletion request'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Create deletion request
        deletion_request = ProjectDeletionRequest.objects.create(
            project=project,
            requested_by=request.user,
            reason=reason
        )
        
        serializer = ProjectDeletionRequestSerializer(deletion_request, context={'request': request})
        return Response({
            'message': 'Deletion request submitted successfully',
            'deletion_request': serializer.data
        }, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def add_member(self, request, pk=None):
        project = self.get_object()
        user_id = request.data.get('user_id')
        
        if not user_id:
            return Response({'error': 'User ID is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(id=user_id)
            project.members.add(user)
            return Response({'status': 'member added'})
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=True, methods=['post'])
    def remove_member(self, request, pk=None):
        project = self.get_object()
        user_id = request.data.get('user_id')
        
        if not user_id:
            return Response({'error': 'User ID is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(id=user_id)
            project.members.remove(user)
            return Response({'status': 'member removed'})
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=False, methods=['get'], permission_classes=[AllowAny])
    def public(self, request):
        """Get all validated projects for public display"""
        validated_projects = Project.objects.filter(is_validated=True)
        serializer = self.get_serializer(validated_projects, many=True)
        return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdminUser])
def update_user_role(request, user_id):
    try:
        user_id_int = int(user_id)
        target_user = User.objects.get(id=user_id_int)
    except (User.DoesNotExist, ValueError):
        return Response(
            {"error": "Utilisateur non trouvé."},
            status=status.HTTP_404_NOT_FOUND
        )

    new_role = request.data.get('role')
    if new_role not in ['member', 'admin', 'chef_d_equipe']:
        return Response(
            {"error": "Rôle spécifié invalide."},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Get or create the user profile
    user_profile, created = UserProfile.objects.get_or_create(user=target_user)

    # Update flags based on the role
    try:
        if new_role == 'admin':
            target_user.is_staff = True
            target_user.is_superuser = False  # Changed: Avoid granting superuser unless necessary
        elif new_role == 'chef_d_equipe':
            target_user.is_staff = False
            target_user.is_superuser = False
        else:  # 'member'
            target_user.is_staff = False
            target_user.is_superuser = False

        with transaction.atomic():
            user_profile.role = new_role
            target_user.save()
            user_profile.save()

        serializer = ExtendedUserSerializer(target_user)
        return Response({
            "message": f"Rôle de l'utilisateur mis à jour vers '{new_role}' avec succès.",
            "user": serializer.data
        }, status=status.HTTP_200_OK)

    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Error updating user {user_id} role to {new_role}: {str(e)}")
        return Response(
            {"error": f"Erreur lors de la mise à jour du rôle: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


class ProjectDocumentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing project documents (files and images)
    Supports multiple file uploads, file type detection, and permission-based access
    """
    serializer_class = ProjectDocumentSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    
    def get_queryset(self):
        """Filter documents based on user permissions and project membership"""
        user = self.request.user
        
        # Admin can see all documents
        if hasattr(user, 'profile') and user.profile.is_admin:
            return ProjectDocument.objects.all()
        
        # Get projects where user is a member or creator
        user_projects = Project.objects.filter(
            models.Q(created_by=user) | 
            models.Q(members=user)
        ).distinct()
        
        # Return documents from user's projects
        return ProjectDocument.objects.filter(project__in=user_projects)
    
    def perform_create(self, serializer):
        """Create document with proper user assignment"""
        project_id = self.request.data.get('project')
        if not project_id:
            raise serializers.ValidationError("Project ID is required")
        
        try:
            project = Project.objects.get(id=project_id)
            
            # Check if user can upload to this project
            if not project.can_user_upload_files(self.request.user):
                raise PermissionDenied("You don't have permission to upload files to this project")
            
            # Auto-detect file type if not provided
            if not serializer.validated_data.get('file_type'):
                file_obj = serializer.validated_data.get('file')
                if file_obj:
                    # Auto-detect if it's an image
                    if serializer.instance.is_image:
                        serializer.validated_data['file_type'] = 'image'
                    else:
                        serializer.validated_data['file_type'] = 'document'
            
            serializer.save(uploaded_by=self.request.user)
            
        except Project.DoesNotExist:
            raise serializers.ValidationError("Project not found")
    
    def perform_update(self, serializer):
        """Update document with permission check"""
        instance = serializer.instance
        if not instance.can_edit(self.request.user):
            raise PermissionDenied("You don't have permission to edit this file")
        serializer.save()
    
    def perform_destroy(self, instance):
        """Delete document with permission check"""
        if not instance.can_delete(self.request.user):
            raise PermissionDenied("You don't have permission to delete this file")
        instance.delete()
    
    @action(detail=False, methods=['post'])
    def bulk_upload(self, request):
        """Upload multiple files to a project at once"""
        project_id = request.data.get('project')
        files = request.FILES.getlist('files')
        
        if not project_id:
            return Response({'error': 'Project ID is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        if not files:
            return Response({'error': 'No files provided'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            project = Project.objects.get(id=project_id)
            
            # Check if user can upload to this project
            if not project.can_user_upload_files(request.user):
                raise PermissionDenied("You don't have permission to upload files to this project")
            
            uploaded_files = []
            errors = []
            
            for file_obj in files:
                try:
                    # Auto-detect file type
                    file_type = 'document'
                    if any(file_obj.name.lower().endswith(ext) for ext in ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.webp']):
                        file_type = 'image'
                    
                    # Create document
                    doc = ProjectDocument.objects.create(
                        project=project,
                        file=file_obj,
                        name=file_obj.name,
                        file_type=file_type,
                        uploaded_by=request.user
                    )
                    
                    uploaded_files.append(ProjectDocumentSerializer(doc).data)
                    
                except Exception as e:
                    errors.append(f"Error uploading {file_obj.name}: {str(e)}")
            
            return Response({
                'uploaded_files': uploaded_files,
                'errors': errors,
                'message': f'Successfully uploaded {len(uploaded_files)} files'
            }, status=status.HTTP_201_CREATED)
            
        except Project.DoesNotExist:
            return Response({'error': 'Project not found'}, status=status.HTTP_404_NOT_FOUND)
        except PermissionDenied as e:
            return Response({'error': str(e)}, status=status.HTTP_403_FORBIDDEN)
    
    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        """Download a file"""
        document = self.get_object()
        
        if not document.can_view(request.user):
            raise PermissionDenied("You don't have permission to view this file")
        
        # Return file response for download
        from django.http import FileResponse
        import os
        
        file_path = document.file.path
        if os.path.exists(file_path):
            response = FileResponse(open(file_path, 'rb'))
            response['Content-Disposition'] = f'attachment; filename="{document.name}"'
            return response
        else:
            return Response({'error': 'File not found'}, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=False, methods=['get'])
    def by_project(self, request):
        """Get all documents for a specific project"""
        project_id = request.query_params.get('project_id')
        if not project_id:
            return Response({'error': 'Project ID is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            project = Project.objects.get(id=project_id)
            
            # Check if user can view this project's files
            if not (project.created_by == request.user or 
                   request.user in project.members.all() or
                   (hasattr(request.user, 'profile') and request.user.profile.is_admin)):
                raise PermissionDenied("You don't have permission to view this project's files")
            
            documents = ProjectDocument.objects.filter(project=project)
            serializer = self.get_serializer(documents, many=True)
            return Response(serializer.data)
            
        except Project.DoesNotExist:
            return Response({'error': 'Project not found'}, status=status.HTTP_404_NOT_FOUND)
        except PermissionDenied as e:
            return Response({'error': str(e)}, status=status.HTTP_403_FORBIDDEN)

class ProjectDeletionRequestViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing project deletion requests
    - Users can create deletion requests for validated projects
    - Admins can approve/reject deletion requests
    """
    serializer_class = ProjectDeletionRequestSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        
        # Admins (by role), staff, or superusers can see all deletion requests
        if (
            (hasattr(user, 'profile') and user.profile.is_admin)
            or user.is_staff
            or user.is_superuser
        ):
            return ProjectDeletionRequest.objects.all()
        
        # Regular users can only see their own deletion requests
        return ProjectDeletionRequest.objects.filter(requested_by=user)
    
    def get_serializer_class(self):
        """Use admin serializer for admin operations"""
        if self.action in ['update', 'partial_update'] and self.request.user.is_staff:
            return ProjectDeletionRequestAdminSerializer
        return ProjectDeletionRequestSerializer
    
    def perform_create(self, serializer):
        """Create deletion request - validate project can be deleted"""
        project = serializer.validated_data['project']
        user = self.request.user
        
        if not project.can_request_deletion(user):
            raise PermissionDenied("You cannot request deletion of this project")
        
        if project.has_pending_deletion_request():
            raise serializers.ValidationError("A deletion request is already pending for this project")
        
        serializer.save(requested_by=user)
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve a deletion request (admin only)"""
        deletion_request = self.get_object()
        
        if not deletion_request.can_be_approved_by(request.user):
            raise PermissionDenied("Only admins can approve deletion requests")
        
        admin_notes = request.data.get('admin_notes', '')
        
        try:
            deletion_request.approve(request.user, admin_notes)
            return Response({
                'status': 'approved',
                'message': 'Project deletion request approved and project deleted'
            })
        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Reject a deletion request (admin only)"""
        deletion_request = self.get_object()
        
        if not deletion_request.can_be_approved_by(request.user):
            raise PermissionDenied("Only admins can reject deletion requests")
        
        admin_notes = request.data.get('admin_notes', '')
        
        try:
            deletion_request.reject(request.user, admin_notes)
            return Response({
                'status': 'rejected',
                'message': 'Project deletion request rejected'
            })
        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)