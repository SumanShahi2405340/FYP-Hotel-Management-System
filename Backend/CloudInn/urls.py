from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    
)

# Simple home endpoint
def home(request):
    return JsonResponse({"message": "Welcome to CloudInn API"})

urlpatterns = [
    # Root welcome endpoint
    # path("", home),
    path("", home, name="home"),  

    # Django admin panel
    path("admin/", admin.site.urls),

    # Hotel app API endpoints
    path("api/", include("hotel.urls")),

    # For Ownerlogin and sendin token and refresh token 
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
]




