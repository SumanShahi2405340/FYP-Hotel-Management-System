# from django.urls import path, include
# from rest_framework.routers import DefaultRouter
# from .views import AdminLoginView, OTPRequestView, OTPVerifyView, HotelViewSet

# router = DefaultRouter()
# router.register(r'hotels', HotelViewSet)


# urlpatterns = [
#     path('login/', AdminLoginView.as_view(), name='admin-login'),        
#     path('forgot-password/', OTPRequestView.as_view(), name='forgot-password'),
#     path('verify-otp/', OTPVerifyView.as_view(), name='verify-otp'),
#     path('', include(router.urls)),

# ]




from django.urls import path
from .views import (
    RegisterHotelView,
    ListHotelsView,
    ActivateHotelView,
    DeactivateHotelView,
    DeleteHotelView,
    HotelUpdateView,
    HotelProfileView,
    OwnerProfileView,
)

urlpatterns = [
    path("hotels/<int:pk>/", DeleteHotelView.as_view()),
    path("hotels/register", RegisterHotelView.as_view(), name="register-hotel"),
    path("hotels", ListHotelsView.as_view(), name="list-hotels"),
    path("hotels/<int:pk>/activate", ActivateHotelView.as_view(), name="activate-hotel"),
    path("hotels/<int:pk>/deactivate", DeactivateHotelView.as_view(), name="deactivate-hotel"),
    path("hotels/<int:pk>/update/", HotelUpdateView.as_view(), name="hotel-update"),
    path("hotels/<int:pk>/hprofile/", HotelProfileView.as_view(), name="hotel-profile"), 
    path("hotels/<int:pk>/oprofile/", OwnerProfileView.as_view(), name="owner-profile"),  # NEW
]





