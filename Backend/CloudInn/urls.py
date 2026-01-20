# from django.urls import path, include
# from django.http import JsonResponse

# def home(request):
#     return JsonResponse({"message": "Welcome to CloudInn API"})

# urlpatterns = [
#     path('', home),  # handles GET /
#     path('admin/', include('hotel.urls')),  # all custom admin login routes
   

# ]



from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    # Django admin panel
    path("admin/", admin.site.urls),

    # Hotel app API endpoints
    path("api/", include("hotel.urls")),
]