"""
URL configuration for laboissim project.
The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from rest_framework.routers import DefaultRouter
from .email_token_view import EmailTokenObtainPairView, GoogleLoginJWTView
from .views import CurrentUserView, SiteContentView, UserProfileView, TeamMembersView, update_user_role, ProjectViewSet, ProjectDocumentViewSet, ProjectDeletionRequestViewSet
from .file_views import FileViewSet
from .publication_views import PublicationViewSet


router = DefaultRouter(trailing_slash=False)
router.register(r'files', FileViewSet, basename='file')
router.register(r'publications', PublicationViewSet, basename='publication')
router.register(r'projects', ProjectViewSet, basename='project')
router.register(r'project-documents', ProjectDocumentViewSet, basename='project-document')
router.register(r'project-deletion-requests', ProjectDeletionRequestViewSet, basename='project-deletion-request')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/token/email/', EmailTokenObtainPairView.as_view(), name='token_obtain_pair_email'),

    #  NEW PATH 
    path('api/admin/update-user-role/<int:user_id>/', update_user_role, name='update_user_role'),

    # This router handles all requests starting with 'api/'
    path('api/', include(router.urls)),
    path('auth/', include('social_django.urls', namespace='social')),
    path('auth/google/jwt/', GoogleLoginJWTView.as_view(), name='google_login_jwt'),
    path('api/user/', CurrentUserView.as_view(), name='current-user'),
    path('api/user/profile/', UserProfileView.as_view(), name='user-profile'),
    path('api/site-content/', SiteContentView.as_view(), name='site-content'),
    path('api/team-members/', TeamMembersView.as_view(), name='team-members'),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)