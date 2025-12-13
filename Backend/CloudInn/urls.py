from django.urls import path, include
from django.http import JsonResponse

def home(request):
    return JsonResponse({"message": "Welcome to CloudInn API"})

urlpatterns = [
    path('', home),  # handles GET /
    path('admin/', include('hotel.urls')),  # all custom admin login routes
]
