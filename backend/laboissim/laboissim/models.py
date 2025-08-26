from django.db import models
from django.conf import settings
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.core.exceptions import PermissionDenied
from django.utils import timezone

class SiteContent(models.Model):
    contact_address = models.CharField(max_length=255, blank=True, default='')
    contact_phone = models.CharField(max_length=50, blank=True, default='')
    contact_email = models.EmailField(max_length=254, blank=True, default='')
    contact_hours = models.CharField(max_length=100, blank=True, default='')
    footer_research_domains = models.JSONField(blank=True, default=list)
    footer_team_introduction = models.TextField(blank=True, default='')
    footer_team_name = models.CharField(max_length=255, blank=True, default='')
    footer_copyright = models.CharField(max_length=255, blank=True, default='')

    def __str__(self):
        return "Site Content Settings"

class UserProfile(models.Model):
    ROLE_CHOICES = (
        ('member', 'Member'),
        ('admin', 'Admin'),
        ('chef_d_equipe', 'Chef d\'équipe'),
    )
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    phone = models.CharField(max_length=20, blank=True, null=True)
    bio = models.TextField(blank=True, null=True)
    profile_image = models.ImageField(upload_to='profile_images/', blank=True, null=True)
    location = models.CharField(max_length=100, blank=True, null=True)
    institution = models.CharField(max_length=200, blank=True, null=True)
    website = models.URLField(blank=True, null=True)
    linkedin = models.URLField(blank=True, null=True)
    twitter = models.URLField(blank=True, null=True)
    github = models.URLField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_team_lead = models.BooleanField(default=False)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='member')

    def __str__(self):
        return f"{self.user.username}'s profile"

    @property
    def full_name(self):
        return f"{self.user.first_name} {self.user.last_name}".strip() or self.user.username

    @property
    def is_admin(self):
        return self.role == 'admin'
    
    @property
    def is_chef_d_equipe(self):
        return self.role == 'chef_d_equipe'

# Signal to create UserProfile when User is created
@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.create(user=instance)

@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    if hasattr(instance, 'profile'):
        instance.profile.save()

class UserFile(models.Model):
    file = models.FileField(upload_to='user_files/')
    name = models.CharField(max_length=255)
    uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    file_type = models.CharField(max_length=50)
    size = models.BigIntegerField()

    def __str__(self):
        return self.name

class Publication(models.Model):
    title = models.CharField(max_length=500)
    abstract = models.TextField()
    posted_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    posted_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-posted_at']
    
    def __str__(self):
        return self.title
# ADDED:  new Project model
class Project(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField()
    objectives = models.TextField(blank=True, null=True)
    methodology = models.TextField(blank=True, null=True)
    results = models.TextField(blank=True, null=True)
    start_date = models.DateField(blank=True, null=True)
    end_date = models.DateField(blank=True, null=True)
    team = models.CharField(max_length=500, blank=True, null=True)
    funding = models.CharField(max_length=200, blank=True, null=True)
    funding_company = models.CharField(max_length=255, blank=True, null=True)
    funding_amount = models.DecimalField(max_digits=12, decimal_places=2, blank=True, null=True)
    image = models.ImageField(upload_to='project_images/', blank=True, null=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='created_projects')
    members = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='projects', blank=True)
    is_validated = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title
    
    @property
    def all_files(self):
        """Get all files associated with this project"""
        return self.documents.all()
    
    @property
    def images(self):
        """Get only image files from this project"""
        return [doc for doc in self.documents.all() if doc.is_image]
    
    @property
    def documents_only(self):
        """Get only non-image files from this project"""
        return [doc for doc in self.documents.all() if not doc.is_image]
    
    @property
    def public_files(self):
        """Get only public files from this project"""
        return self.documents.filter(is_public=True)
    
    def can_user_upload_files(self, user):
        """Check if user can upload files to this project"""
        # Admin can upload to any project
        if hasattr(user, 'profile') and user.profile.is_admin:
            return True
        # Project creator can upload files
        if self.created_by == user:
            return True
        # Project members can upload files
        if user in self.members.all():
            return True
        # Chef d'équipe can upload to their own projects
        if (hasattr(user, 'profile') and 
            user.profile.is_chef_d_equipe and 
            self.created_by == user):
            return True
        return False
    
    def get_file_count_by_type(self):
        """Get count of files grouped by type"""
        from django.db.models import Count
        return self.documents.values('file_type').annotate(count=Count('file_type'))
    
    def can_edit(self, user):
        """Check if user can edit this project"""
        # Admin can edit any project
        if hasattr(user, 'profile') and user.profile.is_admin:
            return True
        # Project creator can edit their own projects
        if self.created_by == user:
            return True
        # Chef d'équipe can edit their own projects
        if (hasattr(user, 'profile') and 
            user.profile.is_chef_d_equipe and 
            self.created_by == user):
            return True
        return False
    
    def can_delete(self, user):
        """Check if user can delete this project"""
        # Admin can delete any project
        if hasattr(user, 'profile') and user.profile.is_admin:
            return True
        # Project creator can delete their own unvalidated projects
        if self.created_by == user and not self.is_validated:
            return True
        # Chef d'équipe can delete their own unvalidated projects
        if (hasattr(user, 'profile') and 
            user.profile.is_chef_d_equipe and 
            self.created_by == user and 
            not self.is_validated):
            return True
        return False
    
    def can_request_deletion(self, user):
        """Check if user can request deletion of this project"""
        # Admin can request deletion of any project
        if hasattr(user, 'profile') and user.profile.is_admin:
            return True
        # Project creator can request deletion of their own validated projects
        if self.created_by == user and self.is_validated:
            return True
        # Chef d'équipe can request deletion of their own validated projects
        if (hasattr(user, 'profile') and 
            user.profile.is_chef_d_equipe and 
            self.created_by == user and 
            self.is_validated):
            return True
        return False
    
    def has_pending_deletion_request(self):
        """Check if there's a pending deletion request for this project"""
        return self.deletion_requests.filter(status='pending').exists()
# ADDED:  new ProjectDocument model for file management
class ProjectDocument(models.Model):
    FILE_TYPE_CHOICES = (
        ('document', 'Document'),
        ('image', 'Image'),
        ('presentation', 'Presentation'),
        ('spreadsheet', 'Spreadsheet'),
        ('other', 'Other'),
    )
    
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='documents')
    file = models.FileField(upload_to='project_files/')
    name = models.CharField(max_length=255)
    file_type = models.CharField(max_length=20, choices=FILE_TYPE_CHOICES, default='document')
    description = models.TextField(blank=True, null=True)
    uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='uploaded_project_files')
    uploaded_at = models.DateTimeField(auto_now_add=True)
    is_public = models.BooleanField(default=True)  # Whether the file is visible to all project members
    
    class Meta:
        ordering = ['-uploaded_at']
    
    def __str__(self):
        return f"{self.name} - {self.project.title}"
    
    @property
    def is_image(self):
        """Check if the file is an image based on file extension"""
        image_extensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.webp']
        return any(self.file.name.lower().endswith(ext) for ext in image_extensions)
    
    @property
    def file_size_mb(self):
        """Get file size in MB"""
        try:
            return round(self.file.size / (1024 * 1024), 2)
        except:
            return 0
    
    @property
    def file_extension(self):
        """Get file extension"""
        import os
        return os.path.splitext(self.file.name)[1].lower()
    
    def can_edit(self, user):
        """Check if user can edit this file"""
        # Admin can edit any file
        if hasattr(user, 'profile') and user.profile.is_admin:
            return True
        # Project creator can edit files
        if self.project.created_by == user:
            return True
        # File uploader can edit their own files
        if self.uploaded_by == user:
            return True
        # Chef d'équipe can edit files in their projects
        if (hasattr(user, 'profile') and 
            user.profile.is_chef_d_equipe and 
            self.project.created_by == user):
            return True
        return False
    
    def can_delete(self, user):
        """Check if user can delete this file"""
        # Admin can delete any file
        if hasattr(user, 'profile') and user.profile.is_admin:
            return True
        # Project creator can delete files
        if self.project.created_by == user:
            return True
        # File uploader can delete their own files
        if self.uploaded_by == user:
            return True
        # Chef d'équipe can delete files in their projects
        if (hasattr(user, 'profile') and 
            user.profile.is_chef_d_equipe and 
            self.project.created_by == user):
            return True
        return False
    
    def can_view(self, user):
        """Check if user can view this file"""
        # Admin can view any file
        if hasattr(user, 'profile') and user.profile.is_admin:
            return True
        # Project members can view public files
        if self.is_public and user in self.project.members.all():
            return True
        # Project creator can view all files
        if self.project.created_by == user:
            return True
        # File uploader can view their own files
        if self.uploaded_by == user:
            return True
        return False

class ProjectDeletionRequest(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    )
    
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='deletion_requests')
    requested_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='deletion_requests')
    reason = models.TextField(help_text='Reason for requesting project deletion')
    admin_notes = models.TextField(blank=True, null=True, help_text='Admin notes on approval/rejection')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    requested_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(blank=True, null=True)
    reviewed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='reviewed_deletions')
    
    class Meta:
        ordering = ['-requested_at']
        constraints = [
            models.CheckConstraint(
                check=models.Q(status__in=['pending', 'approved', 'rejected']),
                name='valid_deletion_status'
            )
        ]
    
    def __str__(self):
        return f"Deletion request for {self.project.title} - {self.status}"
    
    def can_be_approved_by(self, user):
        """Check if user can approve this deletion request"""
        return (hasattr(user, 'profile') and user.profile.is_admin) or user.is_superuser
    
    def approve(self, admin_user, notes=''):
        """Approve the deletion request"""
        if not self.can_be_approved_by(admin_user):
            raise PermissionDenied("Only admins can approve deletion requests")
        
        self.status = 'approved'
        self.admin_notes = notes
        self.reviewed_at = timezone.now()
        self.reviewed_by = admin_user
        self.save()
        
        # Delete the project
        self.project.delete()
    
    def reject(self, admin_user, notes=''):
        """Reject the deletion request"""
        if not self.can_be_approved_by(admin_user):
            raise PermissionDenied("Only admins can reject deletion requests")
        
        self.status = 'rejected'
        self.admin_notes = notes
        self.reviewed_at = timezone.now()
        self.reviewed_by = admin_user
        self.save()