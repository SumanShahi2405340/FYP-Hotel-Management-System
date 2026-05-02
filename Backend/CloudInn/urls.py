from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

# Simple home endpoint
def home(request):
    return JsonResponse({"message": "Welcome to CloudInn API"})

urlpatterns = [
    # Root welcome endpoint
    path("", home, name="home"),  

    # Django admin panel
    path("admin/", admin.site.urls),

    # Hotel app API endpoints (includes room-images)
    path("api/", include("hotel.urls")),

    # JWT Authentication endpoints
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]

# Serve media files in development (for images)
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

    
# from django.contrib import admin
# from django.urls import path, include
# from django.http import JsonResponse
# from django.conf import settings
# from django.conf.urls.static import static
# from rest_framework_simplejwt.views import (
#     TokenObtainPairView,
#     TokenRefreshView,
    
# )

# # Simple home endpoint
# def home(request):
#     return JsonResponse({"message": "Welcome to CloudInn API"})

# urlpatterns = [
#     # Root welcome endpoint
#     # path("", home),
#     path("", home, name="home"),  

#     # Django admin panel
#     path("admin/", admin.site.urls),

#     # Hotel app API endpoints
#     path("api/", include("hotel.urls")),

#     # For Ownerlogin and sendin token and refresh token 
#     path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
#     path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
# ]


# # Serve media files in development
# if settings.DEBUG:
#     urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
#     urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)


