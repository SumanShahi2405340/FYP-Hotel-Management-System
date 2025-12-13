from django.urls import path
from .views import AdminLoginView, OTPRequestView, OTPVerifyView

urlpatterns = [
    path('login/', AdminLoginView.as_view(), name='admin-login'),         # ✅ Add this
    path('forgot-password/', OTPRequestView.as_view(), name='forgot-password'),
    path('verify-otp/', OTPVerifyView.as_view(), name='verify-otp'),
]
