# This file contains all Django REST API views for CloudInn including fixed hotel-filter announcements.
#There are three types of views like classbased ApiView, generics.ListCreateAPIView and Function based view
import random, secrets, string
from django.core.mail import send_mail
from django.conf import settings
from django.contrib.auth import authenticate, login
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from django.contrib.auth.models import User
from rest_framework.views import APIView
from rest_framework import viewsets
from django.utils import timezone
from rest_framework.response import Response
from rest_framework import status, generics, permissions
from rest_framework.exceptions import PermissionDenied
from rest_framework.generics import ListAPIView, UpdateAPIView
from rest_framework.viewsets import ModelViewSet 
from rest_framework.decorators import action
from datetime import date
from django.core.cache import cache
from .models import Hotel, CommissionRule, CommissionPayment
from .models import SendAdminAnnouncement, SendOwnerAnnouncement, SendReceptionistAnnouncement
from .models import OwnerStarredNotification, CommissionReport
from .models import RoomInventory, RoomPrice, ManageMaintenanceRequest, Receptionist, Promotion, GuestStarredPromotion, ManageBookings, Staff, Attendance
from .models import ManagePayments
from .models import RoomImage
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth.hashers import make_password
from django.contrib.auth import get_user_model
from rest_framework.decorators import api_view, permission_classes
from django.shortcuts import get_object_or_404
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
import os
import uuid
from PIL import Image as PILImage
from io import BytesIO
from .models import Guest, AdminProfile, GuestReview
import logging
from django.core.cache import cache

import random
import logging
from rest_framework.permissions import AllowAny, IsAuthenticated
 

from .serializers import (
    AdminLoginSerializer,
    OTPRequestSerializer,
    OTPVerifySerializer,
    HotelSerializer,
    HotelRegisterSerializer,
    CommissionRuleSerializer,
    CommissionPaymentSerializer,
    CommissionRevenueSerializer,
    SendOwnerAnnouncementSerializer,
    SendReceptionistAnnouncementSerializer,
    OwnerStarredNotificationSerializer,
    RoomInventorySerializer,
    RoomPriceSerializer,
    ManageMaintenanceRequestSerializer,
    ReceptionistSerializer,
    PromotionSerializer,
    CommissionReportSerializer,
    ReceptionistRegisterSerializer,   
    ManageBookingsSerializer,
    StaffSerializer,AttendanceSerializer,
    ManagePaymentsSerializer,
    RoomImageSerializer,
    RoomImagesUploadSerializer,
    GuestSerializer, GuestRegisterSerializer, GuestLoginSerializer, GuestStarredPromotionSerializer,
    AdminProfileSerializer,
    GuestReviewSerializer
   
)

User = get_user_model()


# ==================== ADMIN PROFILE VIEW ====================
class AdminProfileView(APIView):
    """
    GET: Return admin profile.
    PATCH/PUT: Update admin profile details and profile photo.

    This view is intentionally tolerant for local development:
    - If a valid JWT is sent, it uses that logged-in user.
    - If no valid JWT is sent, it falls back to the first staff/superuser account.

    URL: /api/admin/profile/
    """
    permission_classes = [AllowAny]

    def _get_admin_user(self, request):
        user = getattr(request, "user", None)
        if user and user.is_authenticated:
            return user

        admin_user = (
            User.objects.filter(is_superuser=True).first()
            or User.objects.filter(is_staff=True).first()
            or User.objects.first()
        )
        return admin_user

    def _get_profile(self, request):
        user = self._get_admin_user(request)
        if not user:
            raise PermissionDenied("No user found. Please create an admin user first.")

        full_name = user.get_full_name().strip() if hasattr(user, "get_full_name") else ""
        default_name = full_name or user.username or "Suman Shahi"

        profile, created = AdminProfile.objects.get_or_create(
            user=user,
            defaults={
                "name": default_name,
                "contact": "+977 9800000000",
                "address": "Kathmandu, Nepal",
                "role": "System Admin" if user.is_superuser else "Admin",
                "status": "Active" if user.is_active else "Inactive",
            },
        )

        # Keep email/status synced with the linked Django user when reading.
        if profile.status != ("Active" if user.is_active else "Inactive"):
            profile.status = "Active" if user.is_active else "Inactive"
            profile.save(update_fields=["status"])

        return profile

    def get(self, request):
        profile = self._get_profile(request)
        serializer = AdminProfileSerializer(profile, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request):
        profile = self._get_profile(request)
        serializer = AdminProfileSerializer(
            profile,
            data=request.data,
            partial=True,
            context={"request": request},
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request):
        return self.patch(request)


# ==================== UTILITY FUNCTIONS ====================

def generate_password(length=8):
    alphabet = string.ascii_letters + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(length))

def compress_image(image_file, quality=85, max_size=(1920, 1080)):
    """
    Compress and optimize uploaded images
    """
    try:
        img = PILImage.open(image_file)
        
        # Convert RGBA to RGB if necessary
        if img.mode in ('RGBA', 'LA', 'P'):
            rgb_img = PILImage.new('RGB', img.size, (255, 255, 255))
            if img.mode == 'P':
                img = img.convert('RGBA')
            rgb_img.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
            img = rgb_img
        
        # Resize if image is too large
        img.thumbnail(max_size, PILImage.Resampling.LANCZOS)
        
        # Save to BytesIO
        output = BytesIO()
        img.save(output, format='JPEG', quality=quality, optimize=True)
        output.seek(0)
        
        return output
    except Exception as e:
        print(f"Error compressing image: {e}")
        return image_file

# ==================== RECEPTIONIST VIEWS ====================

@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def register_receptionist(request):
    data = request.data.copy()
    data["role"] = "Receptionist"

    serializer = ReceptionistRegisterSerializer(data=data)
    if serializer.is_valid():
        email = serializer.validated_data["email"]
        username = f"{email}_{uuid.uuid4().hex[:3]}"
        password = generate_password()

        user = User.objects.create(
            username=username,
            email=email,
            password=make_password(password)
        )

        hotel = getattr(request.user, "hotel", None)
        if not hotel:
            return Response({"error": "No hotel linked to this account"}, status=status.HTTP_400_BAD_REQUEST)

        receptionist = serializer.save(user=user, hotel=hotel, role="Receptionist")

        send_mail(
            subject=f"Receptionist Account Created for {hotel.name}",
            message=f"Dear {receptionist.name},\n\nYour account for {hotel.name} has been created.\nUsername: {username}\nPassword: {password}",
            from_email="admin@cloudinn.com",
            recipient_list=[email],
        )

        return Response({
            "message": f"Receptionist registered for {hotel.name} and credentials sent.",
            "hotel_id": hotel.id
        }, status=status.HTTP_201_CREATED)

    print(serializer.errors)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# FIXED: This is the corrected function for receptionist dashboard
@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def get_hotel_receptionist(request):
    """
    Get receptionist details for the logged-in receptionist user.
    Returns hotel info and all receptionists for that hotel.
    """
    try:
        # Try to get hotel from receptionist profile first
        hotel = None
        if hasattr(request.user, 'receptionist') and request.user.receptionist:
            hotel = request.user.receptionist.hotel
        else:
            # Fallback to direct hotel attribute (for owner users)
            hotel = getattr(request.user, "hotel", None)
        
        if not hotel:
            return Response({
                "error": "No hotel linked to this receptionist account",
                "user_id": request.user.id,
                "username": request.user.username,
                "has_receptionist": hasattr(request.user, 'receptionist')
            }, status=400)
        
        # Get all receptionists for this hotel
        receptionists = Receptionist.objects.filter(hotel=hotel)
        serializer = ReceptionistSerializer(receptionists, many=True)
        
        return Response({
            "hotel_id": hotel.id,
            "hotel_name": hotel.name,
            "receptionists": serializer.data
        })
        
    except Exception as e:
        return Response({
            "error": f"Server error: {str(e)}"
        }, status=500)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_hotel_receptionist_info(request):
    try:
        hotel = request.user.hotel
    except Exception:
        return Response({"error": "No hotel linked to this account"}, status=400)

    receptionists = hotel.receptionists.all()
    serializer = ReceptionistSerializer(receptionists, many=True)

    return Response({
        "hotel_id": hotel.id,
        "hotel_name": hotel.name,
        "receptionists": serializer.data
    })

@api_view(["GET"])
@permission_classes([AllowAny])
def get_receptionists_by_hotel_id(request, pk):
    """
    Admin/hotel profile endpoint.
    Fetch all receptionists linked to a specific hotel id.
    URL: /api/hotels/<hotel_id>/receptionists/
    """
    try:
        hotel = Hotel.objects.get(pk=pk)
    except Hotel.DoesNotExist:
        return Response(
            {"error": "Hotel not found"},
            status=status.HTTP_404_NOT_FOUND
        )

    receptionists = Receptionist.objects.filter(hotel=hotel).order_by("id")
    serializer = ReceptionistSerializer(receptionists, many=True)

    return Response(
        {
            "hotel_id": hotel.id,
            "hotel_name": hotel.name,
            "receptionists": serializer.data,
        },
        status=status.HTTP_200_OK
    )

# ==================== STAFF VIEWS ====================

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_hotel_staff_info(request):
    hotel = getattr(request.user, "hotel", None)
    if not hotel:
        return Response({"error": "No hotel linked to user"}, status=status.HTTP_400_BAD_REQUEST)

    staff = Staff.objects.filter(hotel=hotel)
    serializer = StaffSerializer(staff, many=True)
    return Response({
        "hotel_id": hotel.id,
        "hotel_name": hotel.name,
        "staff": serializer.data
    })

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def add_staff(request):
    hotel = getattr(request.user, "hotel", None)
    if not hotel:
        return Response({"error": "No hotel linked to user"}, status=status.HTTP_400_BAD_REQUEST)

    data = request.data.copy()
    data["hotel"] = hotel.id
    serializer = StaffSerializer(data=data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def delete_staff(request, pk):
    try:
        staff = Staff.objects.get(pk=pk)
        staff.delete()
        return Response({"message": "Staff record deleted successfully"}, status=status.HTTP_204_NO_CONTENT)
    except Staff.DoesNotExist:
        return Response({"error": "Staff not found"}, status=status.HTTP_404_NOT_FOUND)

# ==================== ATTENDANCE VIEWSET ====================

class AttendanceViewSet(viewsets.ModelViewSet):
    queryset = Attendance.objects.all()
    serializer_class = AttendanceSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=["get"])
    def staff_history(self, request):
        staff_id = request.query_params.get("staff_id")
        if not staff_id:
            return Response({"error": "staff_id is required"}, status=400)

        records = Attendance.objects.filter(staff_id=staff_id).order_by("-date")
        serializer = AttendanceSerializer(records, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def receptionist_history(self, request):
        receptionist_id = request.query_params.get("receptionist_id")
        if not receptionist_id:
            return Response({"error": "receptionist_id is required"}, status=400)

        records = Attendance.objects.filter(receptionist_id=receptionist_id).order_by("-date")
        serializer = AttendanceSerializer(records, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["post"])
    def mark(self, request):
        staff_id = request.data.get("staff_id")
        receptionist_id = request.data.get("receptionist_id")
        status_val = request.data.get("status")

        if not status_val or (not staff_id and not receptionist_id):
            return Response({"error": "Provide staff_id or receptionist_id and status"}, status=400)

        today = date.today()

        if staff_id:
            updated = Attendance.objects.filter(staff_id=staff_id, date=today).update(status=status_val)
            if updated == 0:
                record = Attendance.objects.create(staff_id=staff_id, status=status_val, date=today)
            else:
                record = Attendance.objects.filter(staff_id=staff_id, date=today).latest("id")
        elif receptionist_id:
            updated = Attendance.objects.filter(receptionist_id=receptionist_id, date=today).update(status=status_val)
            if updated == 0:
                record = Attendance.objects.create(receptionist_id=receptionist_id, status=status_val, date=today)
            else:
                record = Attendance.objects.filter(receptionist_id=receptionist_id, date=today).latest("id")

        serializer = AttendanceSerializer(record)
        return Response(serializer.data, status=201)

    @action(detail=True, methods=["patch"])
    def status(self, request, pk=None):
        attendance = self.get_object()
        new_status = request.data.get("status")

        if new_status not in ["Active", "Inactive"]:
            return Response({"error": "Invalid status"}, status=400)

        if attendance.staff:
            attendance.staff.status = new_status
            attendance.staff.save()
            return Response({"status": attendance.staff.status})
        elif attendance.receptionist:
            attendance.receptionist.status = new_status
            attendance.receptionist.save()
            return Response({"status": attendance.receptionist.status})

        return Response({"error": "No staff or receptionist linked"}, status=400)

    @action(detail=False, methods=["get"])
    def monthly(self, request):
        person_id = request.query_params.get("person_id")
        year = request.query_params.get("year")
        month = request.query_params.get("month")

        if not person_id or not year or not month:
            return Response({"error": "person_id, year and month are required"}, status=400)

        try:
            year = int(year)
            month = int(month)
        except ValueError:
            return Response({"error": "year and month must be integers"}, status=400)

        records = Attendance.objects.filter(
            date__year=year,
            date__month=month
        ).filter(
            staff_id=person_id
        ) | Attendance.objects.filter(
            date__year=year,
            date__month=month
        ).filter(
            receptionist_id=person_id
        )

        serializer = AttendanceSerializer(records.order_by("date"), many=True)
        return Response(serializer.data)

# ==================== HOTEL VIEWSET ====================

class HotelViewSet(ModelViewSet):
    queryset = Hotel.objects.all() 
    serializer_class = HotelSerializer

# ==================== AUTHENTICATION VIEWS ====================

from django.contrib.auth import authenticate, login
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken

class AdminLoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            email = (request.data.get("email") or "").strip()
            password = request.data.get("password") or ""

            print(f"Login attempt - Email: {email}")

            if not email or not password:
                return Response(
                    {"error": "Email and password are required"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Use filter().first() instead of get() so duplicate emails do not crash with 500.
            user_obj = (
                User.objects.filter(email__iexact=email, is_superuser=True).first()
                or User.objects.filter(email__iexact=email, is_staff=True).first()
                or User.objects.filter(email__iexact=email).first()
            )

            if not user_obj:
                print(f"No user found with email: {email}")
                return Response(
                    {"error": "Invalid credentials"},
                    status=status.HTTP_401_UNAUTHORIZED,
                )

            user = authenticate(
                request,
                username=user_obj.username,
                password=password,
            )

            if user is None:
                print(f"Authentication failed for username: {user_obj.username}")
                return Response(
                    {"error": "Invalid credentials"},
                    status=status.HTTP_401_UNAUTHORIZED,
                )

            if not (user.is_staff or user.is_superuser):
                print(f"User is not staff/superuser: {user.username}")
                return Response(
                    {"error": "You do not have admin permissions"},
                    status=status.HTTP_403_FORBIDDEN,
                )

            # JWT login only. Do not call Django session login(request, user).
            refresh = RefreshToken.for_user(user)

            return Response(
                {
                    "success": True,
                    "message": "Login successful",
                    "access": str(refresh.access_token),
                    "refresh": str(refresh),
                    "user": {
                        "id": user.id,
                        "username": user.username,
                        "email": user.email,
                        "is_staff": user.is_staff,
                        "is_superuser": user.is_superuser,
                    },
                },
                status=status.HTTP_200_OK,
            )

        except Exception as e:
            import traceback
            print("ADMIN LOGIN ERROR:", str(e))
            print(traceback.format_exc())
            return Response(
                {"error": f"Server error: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
    
class OTPRequestView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = OTPRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data["email"]

        users = User.objects.filter(email=email)
        if not users.exists():
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

        user = users.filter(is_staff=True).first() or users.filter(is_superuser=True).first() or users.first()

        otp = str(random.randint(100000, 999999))
        cache_key_otp = f"admin_reset_otp_{email}"
        cache_key_user = f"admin_reset_user_id_{email}"

        cache.set(cache_key_otp, otp, timeout=600)
        cache.set(cache_key_user, user.id, timeout=600)

        print(f"Admin OTP for {email}: {otp}")

        try:
            send_mail(
                subject="Password Reset OTP - CloudInn",
                message=(
                    f"Your OTP for password reset is: {otp}\n\n"
                    "This OTP is valid for 10 minutes.\n\n"
                    "If you did not request this, please ignore this email."
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=False,
            )
        except Exception as e:
            return Response(
                {"error": f"Failed to send email: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response(
            {"message": "OTP has been sent to your email address", "email": email},
            status=status.HTTP_200_OK,
        )


class OTPVerifyView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = OTPVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data.get("email")
        otp_entered = serializer.validated_data.get("otp")

        stored_otp = cache.get(f"admin_reset_otp_{email}")
        user_id = cache.get(f"admin_reset_user_id_{email}")

        if not stored_otp or not user_id:
            return Response(
                {"error": "OTP has expired. Please request a new OTP."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if str(stored_otp) != str(otp_entered):
            return Response(
                {"error": "Invalid OTP. Please try again."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            cache.delete(f"admin_reset_otp_{email}")
            cache.delete(f"admin_reset_user_id_{email}")
            cache.delete(f"admin_reset_verified_{email}")
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

        # Do NOT login or delete OTP here.
        # Mark OTP verified so AdminResetPassword.jsx can update password next.
        cache.set(f"admin_reset_verified_{email}", True, timeout=600)

        return Response(
            {
                "message": "OTP verified successfully. Please reset your password.",
                "email": email,
                "verified": True,
            },
            status=status.HTTP_200_OK,
        )


class AdminUpdatePasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email")
        new_password = request.data.get("new_password")

        if not email or not new_password:
            return Response(
                {"error": "Email and new password are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if len(new_password) < 6:
            return Response(
                {"error": "Password must be at least 6 characters."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        verified = cache.get(f"admin_reset_verified_{email}")
        user_id = cache.get(f"admin_reset_user_id_{email}")

        if not verified or not user_id:
            return Response(
                {"error": "OTP not verified or session expired. Please request a new OTP."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            user = User.objects.get(id=user_id, email=email)
        except User.DoesNotExist:
            cache.delete(f"admin_reset_otp_{email}")
            cache.delete(f"admin_reset_user_id_{email}")
            cache.delete(f"admin_reset_verified_{email}")
            return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)

        user.set_password(new_password)
        user.save()

        cache.delete(f"admin_reset_otp_{email}")
        cache.delete(f"admin_reset_user_id_{email}")
        cache.delete(f"admin_reset_verified_{email}")

        return Response(
            {"message": "Password updated successfully. Please login with your new password."},
            status=status.HTTP_200_OK,
        )

# ==================== RECEPTIONIST PASSWORD RESET VIEWS ====================

class ReceptionistOTPRequestView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = (request.data.get("email") or "").strip()

        if not email:
            return Response(
                {"error": "Email is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        receptionist = Receptionist.objects.filter(email__iexact=email).select_related("user").first()
        if not receptionist or not receptionist.user:
            return Response(
                {"error": "No receptionist account found with this email."},
                status=status.HTTP_404_NOT_FOUND,
            )

        user = receptionist.user
        otp = str(random.randint(100000, 999999))

        cache.set(f"receptionist_reset_otp_{email}", otp, timeout=600)
        cache.set(f"receptionist_reset_user_id_{email}", user.id, timeout=600)
        cache.delete(f"receptionist_reset_verified_{email}")

        print(f"Receptionist OTP for {email}: {otp}")

        try:
            send_mail(
                subject="Password Reset OTP - CloudInn Receptionist Portal",
                message=(
                    f"Your OTP for password reset is: {otp}\n\n"
                    "This OTP is valid for 10 minutes.\n\n"
                    "If you did not request this, please ignore this email."
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email],
                fail_silently=False,
            )
        except Exception as e:
            return Response(
                {"error": f"Failed to send email: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response(
            {"message": "OTP has been sent to your email address", "email": email},
            status=status.HTTP_200_OK,
        )


class ReceptionistOTPVerifyView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = (request.data.get("email") or "").strip()
        otp_entered = (request.data.get("otp") or "").strip()

        if not email or not otp_entered:
            return Response(
                {"error": "Email and OTP are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        stored_otp = cache.get(f"receptionist_reset_otp_{email}")
        user_id = cache.get(f"receptionist_reset_user_id_{email}")

        if not stored_otp or not user_id:
            return Response(
                {"error": "OTP has expired. Please request a new OTP."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if str(stored_otp) != str(otp_entered):
            return Response(
                {"error": "Invalid OTP. Please try again."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not Receptionist.objects.filter(email__iexact=email, user_id=user_id).exists():
            cache.delete(f"receptionist_reset_otp_{email}")
            cache.delete(f"receptionist_reset_user_id_{email}")
            cache.delete(f"receptionist_reset_verified_{email}")
            return Response(
                {"error": "Receptionist account not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        cache.set(f"receptionist_reset_verified_{email}", True, timeout=600)

        return Response(
            {
                "message": "OTP verified successfully. Please reset your password.",
                "email": email,
                "verified": True,
            },
            status=status.HTTP_200_OK,
        )


class ReceptionistUpdatePasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = (request.data.get("email") or "").strip()
        new_password = request.data.get("new_password") or ""

        if not email or not new_password:
            return Response(
                {"error": "Email and new password are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if len(new_password) < 6:
            return Response(
                {"error": "Password must be at least 6 characters."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        verified = cache.get(f"receptionist_reset_verified_{email}")
        user_id = cache.get(f"receptionist_reset_user_id_{email}")

        if not verified or not user_id:
            return Response(
                {"error": "OTP not verified or session expired. Please request a new OTP."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        receptionist = Receptionist.objects.filter(email__iexact=email, user_id=user_id).select_related("user").first()
        if not receptionist or not receptionist.user:
            cache.delete(f"receptionist_reset_otp_{email}")
            cache.delete(f"receptionist_reset_user_id_{email}")
            cache.delete(f"receptionist_reset_verified_{email}")
            return Response(
                {"error": "Receptionist account not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        receptionist.user.set_password(new_password)
        receptionist.user.save()

        cache.delete(f"receptionist_reset_otp_{email}")
        cache.delete(f"receptionist_reset_user_id_{email}")
        cache.delete(f"receptionist_reset_verified_{email}")

        return Response(
            {"message": "Password updated successfully. Please login with your new password."},
            status=status.HTTP_200_OK,
        )





# ==================== RECEPTIONIST LOGIN VIEW ====================
class ReceptionistLoginTokenView(APIView):
    """
    Custom receptionist login endpoint used by ReceptionistLoginForm.jsx.

    IMPORTANT:
    - This endpoint is ONLY for receptionist accounts.
    - It does not use OwnerLoginTokenView, so it will not show
      "This login is only for hotel owner accounts." for receptionist users.
    - It accepts the Django username generated during receptionist registration.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        username = (request.data.get("username") or "").strip()
        password = request.data.get("password") or ""

        if not username or not password:
            return Response(
                {"error": "Username and password are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user_obj = User.objects.filter(username__iexact=username).first()
        if not user_obj:
            return Response(
                {"error": "Invalid username or password."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        if not user_obj.is_active:
            return Response(
                {"error": "This receptionist account is inactive. Please contact the owner or admin."},
                status=status.HTTP_403_FORBIDDEN,
            )

        receptionist = Receptionist.objects.filter(user=user_obj).select_related("hotel").first()
        if not receptionist:
            return Response(
                {"error": "This login is only for receptionist accounts."},
                status=status.HTTP_403_FORBIDDEN,
            )

        user = authenticate(request, username=user_obj.username, password=password)
        if user is None:
            return Response(
                {"error": "Invalid username or password."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        refresh = RefreshToken.for_user(user)
        hotel = receptionist.hotel

        return Response(
            {
                "success": True,
                "message": "Login successful",
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "user_id": user.id,
                "username": user.username,
                "receptionist_id": receptionist.id,
                "receptionist_name": receptionist.name,
                "hotel_id": hotel.id if hotel else None,
                "hotel_name": hotel.name if hotel else None,
            },
            status=status.HTTP_200_OK,
        )

# ==================== OWNER LOGIN WITH ACCOUNT BLOCKING ====================
class OwnerLoginTokenView(APIView):
    """
    Custom owner login endpoint used by OwnerLoginForm.jsx.

    Correct flow:
    - Correct credentials: login successfully and clear failed attempts.
    - 1st wrong attempt: normal invalid credentials message.
    - 2nd wrong attempt: warning message.
    - 3rd wrong attempt: block the owner account by setting user.is_active = False.
    """
    permission_classes = [AllowAny]

    MAX_FAILED_ATTEMPTS = 3
    WARNING_ATTEMPT = 2
    BLOCKED_MESSAGE = "Contact the Admin to Reset your Credentials"
    WARNING_MESSAGE = "Your account will get blocked after this chance"
    INVALID_MESSAGE = "Invalid username or password. Please try again."

    def _attempt_cache_key(self, user_id):
        # v2 avoids old cached attempt counts from the previous broken version.
        return f"owner_login_failed_attempts_v2_{user_id}"

    def post(self, request):
        username = (request.data.get("username") or "").strip()
        password = request.data.get("password") or ""

        if not username or not password:
            return Response(
                {"error": "Username and password are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Find the real user first. authenticate() is case-sensitive for username,
        # so we authenticate using user_obj.username after locating it case-insensitively.
        user_obj = User.objects.filter(username__iexact=username).first()

        # Unknown usernames should not increase any real user's failed attempts.
        if not user_obj:
            return Response(
                {"error": self.INVALID_MESSAGE, "failed_attempts": 0},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        # Only allow hotel owner accounts on this login page.
        hotel = getattr(user_obj, "hotel", None)
        if not hotel:
            return Response(
                {"error": "This login is only for hotel owner accounts."},
                status=status.HTTP_403_FORBIDDEN,
            )

        cache_key = self._attempt_cache_key(user_obj.id)

        if not user_obj.is_active:
            return Response(
                {"error": self.BLOCKED_MESSAGE, "blocked": True},
                status=status.HTTP_403_FORBIDDEN,
            )

        user = authenticate(request, username=user_obj.username, password=password)

        if user is None:
            failed_attempts = int(cache.get(cache_key, 0)) + 1

            if failed_attempts >= self.MAX_FAILED_ATTEMPTS:
                user_obj.is_active = False
                user_obj.save(update_fields=["is_active"])
                cache.delete(cache_key)
                return Response(
                    {
                        "error": self.BLOCKED_MESSAGE,
                        "blocked": True,
                        "failed_attempts": failed_attempts,
                    },
                    status=status.HTTP_403_FORBIDDEN,
                )

            cache.set(cache_key, failed_attempts, timeout=60 * 60 * 24)

            if failed_attempts == self.WARNING_ATTEMPT:
                return Response(
                    {
                        "error": self.WARNING_MESSAGE,
                        "warning": True,
                        "failed_attempts": failed_attempts,
                    },
                    status=status.HTTP_401_UNAUTHORIZED,
                )

            return Response(
                {"error": self.INVALID_MESSAGE, "failed_attempts": failed_attempts},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        # Successful login: clear failed attempts.
        cache.delete(cache_key)

        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "hotel_id": hotel.id,
                "message": "Login successful",
            },
            status=status.HTTP_200_OK,
        )



class ResetOwnerCredentialsView(APIView):
    """
    Admin/public development endpoint to reset blocked hotel owner credentials.

    What it does:
    - Finds the hotel by id.
    - Finds the linked owner user.
    - Generates a new password.
    - Reactivates the blocked owner account by setting user.is_active = True.
    - Clears owner failed-login attempt cache.
    - Sends the username and new password to the hotel's email address.

    URL:
    POST /api/hotels/<hotel_id>/reset-owner-credentials/
    """
    permission_classes = [AllowAny]

    def post(self, request, pk):
        try:
            hotel = Hotel.objects.select_related("user").get(pk=pk)
        except Hotel.DoesNotExist:
            return Response(
                {"error": "Hotel not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        owner_user = hotel.user
        if not owner_user:
            return Response(
                {"error": "No owner user account is linked to this hotel."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Generate a new secure temporary password.
        new_password = generate_password(10)

        owner_user.set_password(new_password)
        owner_user.is_active = True
        owner_user.save(update_fields=["password", "is_active"])

        # Clear failed login attempts from all owner login blocking versions.
        cache.delete(f"owner_login_failed_attempts_{owner_user.id}")
        cache.delete(f"owner_login_failed_attempts_v2_{owner_user.id}")
        cache.delete(f"owner_login_failed_attempts_v3_{owner_user.id}")

        recipient_email = hotel.email or owner_user.email

        # IMPORTANT FOR LOCAL DEVELOPMENT:
        # Your settings.py uses console email backend, so the email appears in the
        # Django backend terminal, not in the browser/Next.js terminal.
        print("=" * 70)
        print("OWNER CREDENTIALS RESET")
        print(f"Hotel ID: {hotel.id}")
        print(f"Hotel Name: {hotel.name}")
        print(f"Email Sent To: {recipient_email}")
        print(f"Username: {owner_user.username}")
        print(f"New Password: {new_password}")
        print("=" * 70)

        try:
            send_mail(
                subject="CloudInn Owner Credentials Reset",
                message=(
                    f"Dear {hotel.owner},\n\n"
                    f"Your CloudInn owner account credentials have been reset by the admin.\n\n"
                    f"Hotel: {hotel.name}\n"
                    f"Username: {owner_user.username}\n"
                    f"New Password: {new_password}\n\n"
                    f"Please log in using these new credentials.\n\n"
                    f"Regards,\n"
                    f"CloudInn Admin"
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[recipient_email],
                fail_silently=False,
            )
        except Exception as e:
            return Response(
                {
                    "message": "Owner credentials reset successfully, but email could not be sent.",
                    "warning": str(e),
                    "username": owner_user.username,
                    "new_password": new_password,
                    "owner_account_active": owner_user.is_active,
                },
                status=status.HTTP_200_OK,
            )

        response_data = {
            "message": "Owner credentials reset successfully and sent to the hotel email.",
            "username": owner_user.username,
            "email": recipient_email,
            "owner_account_active": owner_user.is_active,
        }

        # Because the project is using console email backend in DEBUG mode, also
        # return the generated credentials so the admin can see them immediately.
        if settings.DEBUG:
            response_data["new_password"] = new_password

        return Response(response_data, status=status.HTTP_200_OK)

# ==================== HOTEL REGISTRATION ====================

class RegisterHotelView(APIView):
    def post(self, request):
        serializer = HotelRegisterSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        password = generate_password()
        username = data["email"].split("@")[0] + secrets.token_hex(2)

        user = User.objects.create_user(username=username, email=data["email"], password=password)

        hotel = Hotel.objects.create(
            name=data["name"],
            owner=data["owner"],
            contact=data["contact"],
            email=data["email"],
            location=data["location"],
            pan=data["pan"],
            age=request.data.get("age"),
            owner_contact=request.data.get("owner_contact"),
            citizenship=request.data.get("citizenship"),
            permanent_address=request.data.get("permanent_address"),
            user=user
        )

        subject = "Hotel Registration Credentials"
        message = f"""
        Dear {data['owner']},

        Your hotel '{data['name']}' has been registered successfully.

        Login credentials:
        Username: {username}
        Password: {password}

        Regards,
        CloudInn Platform
        """
        send_mail(subject, message, "please-reply@cloudinn.com", [data["email"]], fail_silently=False)

        return Response({"message": "Hotel registered successfully", "hotel": HotelSerializer(hotel).data, "owner_user": user.username}, status=201)

# ==================== HOTEL MANAGEMENT VIEWS ====================

class ListHotelsView(ListAPIView):
    serializer_class = HotelSerializer

    def get_queryset(self):
        status_filter = self.request.query_params.get('status')
        if status_filter in ["Active", "Inactive"]:
            return Hotel.objects.filter(status=status_filter)
        return Hotel.objects.all()

class ActivateHotelView(APIView):
    def patch(self, request, pk):
        try:
            hotel = Hotel.objects.get(pk=pk)
        except Hotel.DoesNotExist:
            return Response({"error": "Hotel not found"}, status=status.HTTP_404_NOT_FOUND)

        hotel.status = "Active"
        hotel.save()
        return Response({"message": "Hotel activated successfully", "hotel": HotelSerializer(hotel).data})

class DeactivateHotelView(APIView):
    def patch(self, request, pk):
        try:
            hotel = Hotel.objects.get(pk=pk)
        except Hotel.DoesNotExist:
            return Response({"error": "Hotel not found"}, status=status.HTTP_404_NOT_FOUND)

        hotel.status = "Inactive"
        hotel.save()
        return Response({"message": "Hotel deactivated successfully", "hotel": HotelSerializer(hotel).data})

class HotelUpdateView(UpdateAPIView):
    queryset = Hotel.objects.all()
    serializer_class = HotelSerializer

class DeleteHotelView(APIView):
    def delete(self, request, pk):
        try:
            hotel = Hotel.objects.get(pk=pk)
            hotel.delete()
            return Response({"message": "Hotel deleted successfully"}, status=status.HTTP_204_NO_CONTENT)
        except Hotel.DoesNotExist:
            return Response({"error": "Hotel not found"}, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me(request):
    user = request.user
    hotel = getattr(user, "hotel", None)
    return Response({
        "user_id": user.id,
        "hotel_id": hotel.id if hotel else None,
        "hotel_name": hotel.name if hotel else None,
    })

class HotelProfileView(APIView):
    # Public endpoint for admin/public hotel profile pages.
    # This must not depend on the owner login token, because blocked owners have inactive users.
    permission_classes = [AllowAny]

    def get(self, request, pk):
        try:
            hotel = Hotel.objects.get(pk=pk)
            serializer = HotelSerializer(hotel)
            data = serializer.data
            data["owner_account_active"] = bool(hotel.user.is_active) if hotel.user else False
            return Response(data, status=status.HTTP_200_OK)
        except Hotel.DoesNotExist:
            return Response({'error': 'Hotel not found'}, status=status.HTTP_404_NOT_FOUND)

class OwnerProfileView(APIView):
    # Public endpoint for admin/public hotel profile pages.
    permission_classes = [AllowAny]

    def get(self, request, pk):
        try:
            hotel = Hotel.objects.get(pk=pk)
            serializer = HotelSerializer(hotel)
            owner_data = {
                "id": serializer.data["id"],
                "owner": serializer.data["owner"],
                "owner_contact": serializer.data.get("owner_contact"),
                "age": serializer.data.get("age"),
                "citizenship": serializer.data.get("citizenship"),
                "permanent_address": serializer.data.get("permanent_address"),
                "email": serializer.data["email"],
            }
            return Response(owner_data, status=status.HTTP_200_OK)
        except Hotel.DoesNotExist:
            return Response({"error": "Owner profile not found"}, status=status.HTTP_404_NOT_FOUND)

# ==================== COMMISSION VIEWS ====================

class CommissionRuleView(APIView):
    def get(self, request):
        rules = CommissionRule.objects.all()
        serializer = CommissionRuleSerializer(rules, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        rules_data = request.data
        if not isinstance(rules_data, list):
            return Response({'error': 'Expected a list of rules'}, status=status.HTTP_400_BAD_REQUEST)

        for rule_data in rules_data:
            CommissionRule.objects.update_or_create(
                rule_id=rule_data.get('id'),
                defaults={
                    'name': rule_data.get('name'),
                    'description': rule_data.get('desc'),
                    'effective_date': rule_data.get('date'),
                }
            )

        return Response({'message': 'Rules saved to DB'}, status=status.HTTP_200_OK)

class CommissionPaymentView(generics.ListCreateAPIView):
    queryset = CommissionPayment.objects.all().order_by('-created_at') 
    serializer_class = CommissionPaymentSerializer

@api_view(['GET'])
def get_active_hotels(request):
    hotels = Hotel.objects.filter(status="Active").order_by('id')
    today = date.today()
    data = []

    for hotel in hotels:
        months_active = (today.year - hotel.registered_on.year) * 12 + (today.month - hotel.registered_on.month)
        amount = 'NPR 5,000' if months_active >= 12 else 'NPR 8,000'

        data.append({
            'id': f'PID-{hotel.id}',
            'hotel': hotel.name,
            'amount': amount,
            'status': 'Pending'
        })

    return Response(data, status=status.HTTP_200_OK)

@api_view(['POST'])
def confirm_payments(request):
    payments = request.data
    already_full = []

    for item in payments:
        hotel_id = int(item['id'].replace('PID-', ''))
        start_due_date = item['start_due_date']
        amount = item['amount']
        payment_status = item.get('status', 'Pending')

        existing_count = CommissionPayment.objects.filter(
            hotel_id=hotel_id,
            start_due_date=start_due_date
        ).count()

        if existing_count >= 2:
            already_full.append(item['hotel'])
        elif existing_count == 1:
            CommissionPayment.objects.create(
                hotel_id=hotel_id,
                payment_id=f"{hotel_id}.2",
                amount=amount,
                status=payment_status,
                start_due_date=start_due_date
            )
        elif existing_count == 0:
            CommissionPayment.objects.create(
                hotel_id=hotel_id,
                payment_id=f"{hotel_id}.1",
                amount=amount,
                status=payment_status,
                start_due_date=start_due_date
            )

    return Response({
        'message': 'Commission payment data saved in database.',
        'already_full': already_full
    }, status=status.HTTP_200_OK)

@api_view(['GET'])
def track_commission_revenue(request):
    month = request.GET.get('month')
    year = request.GET.get('year')

    if not month or not year:
        return Response({'error': 'Month and year are required'}, status=status.HTTP_400_BAD_REQUEST)

    prefix = f"{year}-{month}"

    payments = CommissionPayment.objects.filter(
        start_due_date__startswith=prefix,
        status__in=['Paid', 'Pending']
    ).order_by('hotel_id', 'created_at')

    serializer = CommissionRevenueSerializer(payments, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)

# ==================== ANNOUNCEMENT VIEWS ====================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_announcement(request):
    """
    ADMIN -> OWNER/HOTEL notification.

    Admin AnnouncementPanel uses this endpoint.
    It stores only Admin-sent announcements in SendAdminAnnouncement.

    Payload:
    {
        "message": "text",
        "hotel_status": "active" | "inactive" | "all"
    }
    """
    message = request.data.get('message', '').strip()
    hotel_status = request.data.get('hotel_status', 'all').lower().strip()

    if not message:
        return Response({'error': 'Message content is required.'}, status=status.HTTP_400_BAD_REQUEST)

    if hotel_status == 'active':
        hotels = Hotel.objects.filter(status__iexact='Active').order_by('id')
        target_label = 'Active Hotels'
    elif hotel_status == 'inactive':
        hotels = Hotel.objects.filter(status__iexact='Inactive').order_by('id')
        target_label = 'Inactive Hotels'
    elif hotel_status == 'all':
        hotels = Hotel.objects.all().order_by('id')
        target_label = 'All Hotels'
    else:
        return Response({'error': 'Invalid hotel_status. Use active, inactive, or all.'}, status=status.HTTP_400_BAD_REQUEST)

    if not hotels.exists():
        return Response({'error': f'No {target_label.lower()} found in database.'}, status=status.HTTP_404_NOT_FOUND)

    created_items = []
    for hotel in hotels:
        ann = SendAdminAnnouncement.objects.create(hotel=hotel, message=message)
        created_items.append(ann)

    return Response({
        'success': True,
        'message': f'Announcement sent to {target_label}.',
        'target_label': target_label,
        'display_name': target_label,
        'sent_to': len(created_items),
        'announcement_type': 'admin_to_owner',
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def recent_announcements(request):
    """
    GET /api/recent-announcements/

    Staff/Admin user:
      - returns ONLY announcements sent from Admin AnnouncementPanel.
      - used by Admin panel's own Recent Announcements section.

    Owner/receptionist/staff hotel user:
      - returns ONLY Admin -> this hotel announcements.
      - used by OwnerNotificationSetting.
    """
    if request.user.is_staff or request.user.is_superuser:
        announcements = (
            SendAdminAnnouncement.objects
            .select_related('hotel')
            .order_by('-created_at')[:300]
        )

        grouped = []
        for ann in announcements:
            matched_group = None
            for group in grouped:
                same_message = group['content'] == ann.message
                time_difference = abs((group['timestamp'] - ann.created_at).total_seconds())
                if same_message and time_difference <= 10:
                    matched_group = group
                    break

            hotel_status_value = ann.hotel.status if ann.hotel else None

            if matched_group:
                matched_group['hotel_count'] += 1
                if hotel_status_value and hotel_status_value not in matched_group['statuses']:
                    matched_group['statuses'].append(hotel_status_value)
                if ann.created_at > matched_group['timestamp']:
                    matched_group['timestamp'] = ann.created_at
            else:
                grouped.append({
                    'id': ann.id,
                    'content': ann.message,
                    'timestamp': ann.created_at,
                    'hotel_count': 1,
                    'statuses': [hotel_status_value] if hotel_status_value else [],
                })

        data = []
        for group in grouped[:50]:
            statuses = group['statuses']
            if 'Active' in statuses and 'Inactive' in statuses:
                target_label = 'All Hotels'
            elif 'Active' in statuses:
                target_label = 'Active Hotels'
            elif 'Inactive' in statuses:
                target_label = 'Inactive Hotels'
            else:
                target_label = 'Hotels'

            data.append({
                'id': group['id'],
                'content': group['content'],
                'target_label': target_label,
                'display_name': target_label,
                'hotel_count': group['hotel_count'],
                'timestamp': group['timestamp'],
                'type': 'admin_to_owner',
                'sender': 'admin',
                'recipient': 'owner',
            })

        return Response(data, status=status.HTTP_200_OK)

    hotel = getattr(request.user, 'hotel', None)
    if not hotel and hasattr(request.user, 'receptionist') and request.user.receptionist:
        hotel = request.user.receptionist.hotel
    if not hotel and hasattr(request.user, 'staff') and request.user.staff:
        hotel = request.user.staff.hotel

    if not hotel:
        return Response({'error': 'No hotel linked to this account.'}, status=status.HTTP_400_BAD_REQUEST)

    announcements = (
        SendAdminAnnouncement.objects
        .filter(hotel=hotel)
        .select_related('hotel')
        .order_by('-created_at')[:50]
    )

    data = [{
        'id': ann.id,
        'content': ann.message,
        'target_label': 'For Your Hotel',
        'display_name': 'CloudInn Admin',
        'hotel_name': ann.hotel.name if ann.hotel else None,
        'timestamp': ann.created_at,
        'type': 'admin_to_owner',
        'sender': 'admin',
        'recipient': 'owner',
    } for ann in announcements]

    return Response(data, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def owner_send_announcement(request):
    """
    OWNER -> ADMIN and/or OWNER -> RECEPTIONIST notification.

    IMPORTANT FIX:
    - sendToAdmin is saved in SendOwnerAnnouncement, NOT SendAdminAnnouncement.
    - SendAdminAnnouncement is reserved only for Admin -> Owner notifications.
    """
    message = request.data.get('message', '').strip()
    send_to_admin = bool(request.data.get('sendToAdmin', False))
    send_to_receptionist = bool(request.data.get('sendToReceptionist', False))

    if not message:
        return Response({'error': 'Message content is required.'}, status=status.HTTP_400_BAD_REQUEST)

    if not send_to_admin and not send_to_receptionist:
        return Response({'error': 'At least one recipient must be selected.'}, status=status.HTTP_400_BAD_REQUEST)

    hotel = getattr(request.user, 'hotel', None)
    if not hotel:
        return Response({'error': 'No hotel linked to this owner account.'}, status=status.HTTP_400_BAD_REQUEST)

    saved = {}
    saved_items = []

    if send_to_admin:
        ann = SendOwnerAnnouncement.objects.create(hotel=hotel, message=message)
        saved['admin'] = {
            'id': ann.id,
            'message': ann.message,
            'hotel_name': hotel.name,
            'created_at': ann.created_at,
            'recipient': 'admin',
            'type': 'owner_to_admin',
        }
        saved_items.append({
            'id': ann.id,
            'content': ann.message,
            'hotel_name': hotel.name,
            'recipients': ['admin'],
            'timestamp': ann.created_at,
            'type': 'owner_to_admin',
            'sender': 'owner',
            'recipient': 'admin',
        })

    if send_to_receptionist:
        ann = SendReceptionistAnnouncement.objects.create(hotel=hotel, message=message)
        saved['receptionist'] = {
            'id': ann.id,
            'message': ann.message,
            'hotel_name': hotel.name,
            'created_at': ann.created_at,
            'recipient': 'receptionist',
            'type': 'owner_to_receptionist',
        }
        saved_items.append({
            'id': ann.id,
            'content': ann.message,
            'hotel_name': hotel.name,
            'recipients': ['receptionist'],
            'timestamp': ann.created_at,
            'type': 'owner_to_receptionist',
            'sender': 'owner',
            'recipient': 'receptionist',
        })

    return Response({
        'success': True,
        'saved': saved,
        'announcements': saved_items,
        'message': f'Announcement sent successfully to {len(saved_items)} recipient(s).',
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([AllowAny])
def owner_recent_announcements(request):
    """
    GET /api/owner-recent-announcements/?recipient=admin
      - PUBLIC for the Admin notification bell/settings page.
      - Returns ONLY Owner -> Admin announcements.
      - This fixes 401 errors when the admin panel is opened without a JWT token.

    GET /api/owner-recent-announcements/?scope=sent
      - Still requires a logged-in owner because it needs request.user.hotel.

    GET /api/owner-recent-announcements/?recipient=receptionist
      - Still requires a logged-in receptionist/staff/owner because it needs request.user.hotel.
    """
    recipient = str(request.GET.get('recipient', '')).lower().strip()
    scope = str(request.GET.get('scope', '')).lower().strip()

    hotel = getattr(request.user, 'hotel', None)
    if not hotel and hasattr(request.user, 'receptionist') and request.user.receptionist:
        hotel = request.user.receptionist.hotel
    if not hotel and hasattr(request.user, 'staff') and request.user.staff:
        hotel = request.user.staff.hotel

    combined = []

    # Admin notification setting: show all Owner -> Admin messages.
    if recipient == 'admin':
        owner_announcements = (
            SendOwnerAnnouncement.objects
            .select_related('hotel')
            .order_by('-created_at')[:100]
        )
        for ann in owner_announcements:
            combined.append({
                'id': ann.id,
                'content': ann.message,
                'message': ann.message,
                'hotel_name': ann.hotel.name if ann.hotel else 'Hotel Owner',
                'timestamp': ann.created_at,
                'created_at': ann.created_at,
                'type': 'owner_to_admin',
                'sender': 'owner',
                'recipient': 'admin',
                'recipients': ['admin'],
            })
        return Response(combined, status=status.HTTP_200_OK)

    if not hotel:
        return Response({'error': 'No hotel linked to this account.'}, status=status.HTTP_400_BAD_REQUEST)

    # Owner panel: show only this owner's sent messages.
    if scope == 'sent' or recipient == 'all' or not recipient:
        owner_to_admin = (
            SendOwnerAnnouncement.objects
            .filter(hotel=hotel)
            .order_by('-created_at')[:50]
        )
        owner_to_receptionist = (
            SendReceptionistAnnouncement.objects
            .filter(hotel=hotel)
            .order_by('-created_at')[:50]
        )

        for ann in owner_to_admin:
            combined.append({
                'id': ann.id,
                'content': ann.message,
                'message': ann.message,
                'hotel_name': ann.hotel.name if ann.hotel else None,
                'timestamp': ann.created_at,
                'created_at': ann.created_at,
                'type': 'owner_to_admin',
                'sender': 'owner',
                'recipient': 'admin',
                'recipients': ['admin'],
            })

        for ann in owner_to_receptionist:
            combined.append({
                'id': ann.id,
                'content': ann.message,
                'message': ann.message,
                'hotel_name': ann.hotel.name if ann.hotel else None,
                'timestamp': ann.created_at,
                'created_at': ann.created_at,
                'type': 'owner_to_receptionist',
                'sender': 'owner',
                'recipient': 'receptionist',
                'recipients': ['receptionist'],
            })

    elif recipient == 'receptionist':
        receptionist_announcements = (
            SendReceptionistAnnouncement.objects
            .filter(hotel=hotel)
            .order_by('-created_at')[:50]
        )
        for ann in receptionist_announcements:
            combined.append({
                'id': ann.id,
                'content': ann.message,
                'message': ann.message,
                'hotel_name': ann.hotel.name if ann.hotel else None,
                'timestamp': ann.created_at,
                'created_at': ann.created_at,
                'type': 'owner_to_receptionist',
                'sender': 'owner',
                'recipient': 'receptionist',
                'recipients': ['receptionist'],
            })

    combined.sort(key=lambda x: x['timestamp'], reverse=True)
    return Response(combined, status=status.HTTP_200_OK)

# ==================== STARRED NOTIFICATIONS ====================

@api_view(["GET"])
@permission_classes([AllowAny])
def starred_notifications(request):
    """
    Get starred notifications for logged-in users.

    If the Admin notification page is opened without a token, return an empty
    list instead of 401 so owner announcements can still load publicly.
    Starring/un-starring still requires authentication in star_notification()
    and unstar_notification().
    """
    if not request.user or not request.user.is_authenticated:
        return Response([], status=status.HTTP_200_OK)

    starred = OwnerStarredNotification.objects.filter(
        user=request.user
    ).order_by("-starred_at")

    serializer = OwnerStarredNotificationSerializer(starred, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def star_notification(request):
    """
    Star a notification.

    Expected JSON:
    {
        "announcement": 12,
        "announcement_type": "announcement"
    }

    announcement_type can be:
    - announcement
    - promotion
    - admin
    - receptionist
    """
    announcement = request.data.get("announcement")
    announcement_type = request.data.get("announcement_type", "announcement")

    if announcement is None:
        return Response(
            {"error": "announcement is required"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        announcement = int(announcement)
    except (TypeError, ValueError):
        return Response(
            {"error": "announcement must be a number"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    announcement_type = str(announcement_type).strip() or "announcement"

    starred, created = OwnerStarredNotification.objects.get_or_create(
        user=request.user,
        announcement=announcement,
        announcement_type=announcement_type,
    )

    serializer = OwnerStarredNotificationSerializer(starred)
    return Response(
        serializer.data,
        status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
    )


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def unstar_notification(request, announcement_type, announcement):
    """
    Remove a notification from Important.
    URL example:
    /api/star-notification/announcement/12/
    """
    deleted_count, _ = OwnerStarredNotification.objects.filter(
        user=request.user,
        announcement=announcement,
        announcement_type=announcement_type,
    ).delete()

    if deleted_count == 0:
        return Response(
            {"error": "Starred notification not found"},
            status=status.HTTP_404_NOT_FOUND,
        )

    return Response(
        {"message": "Notification removed from important"},
        status=status.HTTP_200_OK,
    )


# ==================== ROOM MANAGEMENT VIEWS ====================

class RoomInventoryView(APIView):
    # GET is public when hotel_id is supplied. PUT still needs owner authentication.
    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]
        return [IsAuthenticated()]

    def _get_hotel_for_read(self, request):
        hotel_id = request.query_params.get("hotel_id") or request.query_params.get("hotel")
        if hotel_id:
            return get_object_or_404(Hotel, id=hotel_id)

        if request.user and request.user.is_authenticated:
            hotel = getattr(request.user, "hotel", None)
            if hotel:
                return hotel

        return None

    def get(self, request):
        hotel = self._get_hotel_for_read(request)
        if not hotel:
            return Response(
                {"error": "hotel_id is required for public room inventory access."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        inventory, _ = RoomInventory.objects.get_or_create(hotel=hotel)
        serializer = RoomInventorySerializer(inventory)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request):
        hotel = request.user.hotel
        inventory, _ = RoomInventory.objects.get_or_create(hotel=hotel)
        serializer = RoomInventorySerializer(inventory, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class RoomPriceView(APIView):
    # GET is public when hotel_id is supplied. PUT still needs owner authentication.
    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]
        return [IsAuthenticated()]

    def _get_hotel_for_read(self, request):
        hotel_id = request.query_params.get("hotel_id") or request.query_params.get("hotel")
        if hotel_id:
            return get_object_or_404(Hotel, id=hotel_id)

        if request.user and request.user.is_authenticated:
            hotel = getattr(request.user, "hotel", None)
            if hotel:
                return hotel

        return None

    def get(self, request):
        hotel = self._get_hotel_for_read(request)
        if not hotel:
            return Response(
                {"error": "hotel_id is required for public room price access."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        prices, _ = RoomPrice.objects.get_or_create(hotel=hotel)
        serializer = RoomPriceSerializer(prices)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request):
        hotel = request.user.hotel
        prices, _ = RoomPrice.objects.get_or_create(hotel=hotel)
        serializer = RoomPriceSerializer(prices, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# ==================== MAINTENANCE REQUESTS ====================

class ManageMaintenanceRequestListCreateView(generics.ListCreateAPIView):
    queryset = ManageMaintenanceRequest.objects.all()
    serializer_class = ManageMaintenanceRequestSerializer

class ManageMaintenanceRequestDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = ManageMaintenanceRequest.objects.all()
    serializer_class = ManageMaintenanceRequestSerializer

# ==================== PROMOTIONS ====================

class PromotionListCreateView(generics.ListCreateAPIView):
    serializer_class = PromotionSerializer

    def get_queryset(self):
        return Promotion.objects.filter(hotel=self.request.user.hotel)

    def perform_create(self, serializer):
        serializer.save(hotel=self.request.user.hotel)

class PromotionDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = PromotionSerializer

    def get_queryset(self):
        return Promotion.objects.filter(hotel=self.request.user.hotel)

# ==================== COMMISSION REPORTS ====================

class CommissionReportListCreateView(generics.ListCreateAPIView):
    serializer_class = CommissionReportSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if not hasattr(user, "hotel") or user.hotel is None:
            return CommissionReport.objects.none()
        return CommissionReport.objects.filter(hotel=user.hotel)

    def perform_create(self, serializer):
        user = self.request.user
        if not hasattr(user, "hotel") or user.hotel is None:
            raise PermissionDenied("User is not linked to a hotel.")
        serializer.save(hotel=user.hotel)

# ==================== BOOKINGS AND PAYMENTS ====================

class ManageBookingsViewSet(viewsets.ModelViewSet):
    queryset = ManageBookings.objects.all()
    serializer_class = ManageBookingsSerializer

    def perform_create(self, serializer):
        serializer.save(status="Booked")

    def perform_destroy(self, instance):
        instance.status = "Available"
        instance.save()
        instance.delete()

    def list(self, request, *args, **kwargs):
        now = timezone.now()
        for booking in self.queryset:
            if booking.checkout and now > booking.checkout:
                booking.status = "Available"
                booking.save()
        return super().list(request, *args, **kwargs)

    def retrieve(self, request, *args, **kwargs):
        booking = self.get_object()
        now = timezone.now()
        if booking.checkout and now > booking.checkout:
            booking.status = "Available"
            booking.save()
        return super().retrieve(request, *args, **kwargs)

    @action(detail=True, methods=["get"])
    def payments(self, request, pk=None):
        booking = get_object_or_404(ManageBookings, pk=pk)
        payments = ManagePayments.objects.filter(booking=booking)
        serializer = ManagePaymentsSerializer(payments, many=True)
        return Response(serializer.data)

class ManagePaymentsViewSet(viewsets.ModelViewSet):
    queryset = ManagePayments.objects.all()
    serializer_class = ManagePaymentsSerializer

# ==================== ROOM IMAGES VIEWS ====================

class RoomImagesView(APIView):
    """
    API endpoint to manage room images
    GET: Public when hotel_id is supplied.
    POST/DELETE: Owner authenticated only.
    """
    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]
        return [IsAuthenticated()]

    def _get_hotel_for_read(self, request):
        hotel_id = request.query_params.get("hotel_id") or request.query_params.get("hotel")
        if hotel_id:
            return get_object_or_404(Hotel, id=hotel_id)

        if request.user and request.user.is_authenticated:
            hotel = getattr(request.user, "hotel", None)
            if hotel:
                return hotel

        return None

    def get(self, request):
        """
        Get all images for a specific room or all rooms.
        Query params:
        - hotel_id: required for public/admin profile access
        - room_number: optional
        """
        hotel = self._get_hotel_for_read(request)
        if not hotel:
            return Response(
                {"error": "hotel_id is required for public room image access."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        room_number = request.query_params.get('room_number')
        if room_number:
            try:
                room_number = int(room_number)
            except ValueError:
                return Response(
                    {'error': 'room_number must be an integer'},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            images = RoomImage.objects.filter(hotel=hotel, room_number=room_number).order_by('order')
            image_urls = []
            for img in images:
                image_urls.append(f'/room_images/{img.image}')
            
            return Response({room_number: image_urls})
        
        all_images = RoomImage.objects.filter(hotel=hotel).order_by('room_number', 'order')
        grouped_images = {}
        for img in all_images:
            if img.room_number not in grouped_images:
                grouped_images[img.room_number] = []
            grouped_images[img.room_number].append(f'/room_images/{img.image}')
        
        return Response(grouped_images)

    def post(self, request):
        """
        Upload images for a specific room
        Replaces all existing images for that room with new ones
        """
        hotel = request.user.hotel
        
        room_number = request.data.get('roomNumber') or request.data.get('room_number')
        images = request.FILES.getlist('images')
        
        if not room_number:
            return Response(
                {'error': 'roomNumber is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            room_number = int(room_number)
        except ValueError:
            return Response(
                {'error': 'roomNumber must be an integer'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not images:
            return Response(
                {'error': 'At least one image is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if len(images) > 4:
            return Response(
                {'error': 'Maximum 4 images allowed per room'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Delete existing images for this room
        existing_images = RoomImage.objects.filter(hotel=hotel, room_number=room_number)
        for img in existing_images:
            file_path = os.path.join(settings.MEDIA_ROOT, img.image)
            if os.path.exists(file_path):
                try:
                    os.remove(file_path)
                except Exception as e:
                    print(f"Error deleting file {file_path}: {e}")
        existing_images.delete()
        
        # Create directory structure
        room_dir = os.path.join(settings.MEDIA_ROOT, f'hotel_{hotel.id}', f'room_{room_number}')
        os.makedirs(room_dir, exist_ok=True)
        
        uploaded_images = []
        for idx, image in enumerate(images):
            try:
                compressed_image = compress_image(image)
                
                ext = os.path.splitext(image.name)[1]
                filename = f"image_{idx + 1}_{uuid.uuid4().hex[:8]}{ext}"
                
                file_path = os.path.join(room_dir, filename)
                with open(file_path, 'wb') as f:
                    f.write(compressed_image.read())
                
                relative_path = os.path.join(f'hotel_{hotel.id}', f'room_{room_number}', filename)
                room_image = RoomImage.objects.create(
                    hotel=hotel,
                    room_number=room_number,
                    image=relative_path,
                    order=idx
                )
                
                uploaded_images.append(room_image)
                
            except Exception as e:
                print(f"Error uploading image {idx}: {e}")
                return Response(
                    {'error': f'Failed to upload image {idx + 1}: {str(e)}'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        
        result_images = []
        for img in uploaded_images:
            result_images.append(f'/room_images/{img.image}')
        
        return Response({
            'message': f'Successfully uploaded {len(uploaded_images)} images for room {room_number}',
            'images': result_images
        }, status=status.HTTP_201_CREATED)

    def delete(self, request):
        """
        Delete all images for a specific room
        Query params:
        - room_number: required
        """
        hotel = request.user.hotel
        room_number = request.query_params.get('room_number')
        
        if not room_number:
            return Response(
                {'error': 'room_number query parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            room_number = int(room_number)
        except ValueError:
            return Response(
                {'error': 'room_number must be an integer'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        images = RoomImage.objects.filter(hotel=hotel, room_number=room_number)
        
        for img in images:
            file_path = os.path.join(settings.MEDIA_ROOT, img.image)
            if os.path.exists(file_path):
                try:
                    os.remove(file_path)
                except Exception as e:
                    print(f"Error deleting file {file_path}: {e}")
        
        room_dir = os.path.join(settings.MEDIA_ROOT, f'hotel_{hotel.id}', f'room_{room_number}')
        if os.path.exists(room_dir):
            try:
                os.rmdir(room_dir)
            except OSError:
                pass
        
        count = images.count()
        images.delete()
        
        return Response({
            'message': f'Successfully deleted {count} images for room {room_number}'
        }, status=status.HTTP_200_OK)

class SingleRoomImageView(APIView):
    """
    API endpoint to manage individual room images
    """
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        hotel = request.user.hotel
        
        try:
            image = RoomImage.objects.get(id=pk, hotel=hotel)
            
            file_path = os.path.join(settings.MEDIA_ROOT, image.image)
            if os.path.exists(file_path):
                os.remove(file_path)
            
            image.delete()
            return Response(
                {'message': 'Image deleted successfully'},
                status=status.HTTP_200_OK
            )
        except RoomImage.DoesNotExist:
            return Response(
                {'error': 'Image not found'},
                status=status.HTTP_404_NOT_FOUND
            )

    def patch(self, request, pk):
        hotel = request.user.hotel
        new_order = request.data.get('order')
        
        if new_order is None:
            return Response(
                {'error': 'order field is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            image = RoomImage.objects.get(id=pk, hotel=hotel)
            image.order = new_order
            image.save()
            
            return Response({
                'id': image.id,
                'room_number': image.room_number,
                'order': image.order,
                'image_url': f'/room_images/{image.image}'
            })
        except RoomImage.DoesNotExist:
            return Response(
                {'error': 'Image not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        


# ==================== GUEST VIEWS ====================

class GuestRegisterView(APIView):
    """
    POST: Register a new guest account
    Generates random password and sends via email
    Handles duplicate emails by adding unique suffix
    """
    permission_classes = []
    
    def post(self, request):
        try:
            print("=" * 50)
            print("GUEST REGISTRATION ATTEMPT")
            print(f"Request data: {request.data}")
            
            # Get the data from request
            email = request.data.get('email')
            name = request.data.get('name')
            contact = request.data.get('contact', '')
            address = request.data.get('address', '')
            id_proof = request.data.get('id_proof', '')
            
            # Check if email already exists
            final_email = email
            if User.objects.filter(email=email).exists():
                # Add unique suffix to email
                base_email = email.split('@')[0]
                domain = email.split('@')[1]
                counter = 1
                
                while User.objects.filter(email=f"{base_email}v{counter}@{domain}").exists():
                    counter += 1
                
                final_email = f"{base_email}v{counter}@{domain}"
                print(f"Email changed from {email} to {final_email}")
            
            # Generate random 8-character password
            import secrets
            import string
            alphabet = string.ascii_letters + string.digits
            password = ''.join(secrets.choice(alphabet) for _ in range(8))
            
            # Create username from email
            username = email.split('@')[0] + secrets.token_hex(2)
            
            # Create user
            user = User.objects.create_user(
                username=username,
                email=final_email,  # This may be the modified unique email
                password=password
            )
            
            # Create guest profile
            guest = Guest.objects.create(
                user=user,
                name=name,
                email=email,  # Store original email for display
                contact=contact,
                address=address,
                id_proof=id_proof,
                is_active=True
            )
            
            # Send email with credentials
            try:
                send_mail(
                    subject='Welcome to CloudInn - Guest Account Created',
                    message=f"""
Dear {name},

Your guest account has been created successfully!

Login Credentials:
------------------
Email: {email}
Username: {user.username}
Password: {password}

Please keep this information safe.

If you have any issues logging in, please contact our support team.

Regards,
CloudInn Platform
""",
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[email],
                    fail_silently=False,
                )
                print(f"Email sent successfully to {email}")
            except Exception as e:
                print(f"Failed to send email: {e}")
                # Don't fail registration if email fails, but log it
            
            print(f"Guest created successfully with email: {email}")
            print(f"Username: {user.username}, Password: {password}")
            
            return Response({
                'success': True,
                'message': 'Guest account created successfully. Credentials sent to email.',
                'guest': {
                    'id': guest.id,
                    'name': guest.name,
                    'email': email,
                    'contact': guest.contact,
                    'address': guest.address
                }
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            import traceback
            print(traceback.format_exc())
            return Response(
                {'error': f'Internal server error: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )



#  GuestLoginView 
class GuestLoginView(APIView):
    """
    POST: Login as a guest using username/password
    Returns JWT tokens for authentication
    """
    permission_classes = []
    
    def post(self, request):
        try:
            print("=" * 50)
            print("GUEST LOGIN ATTEMPT")
            print(f"Request data: {request.data}")
            
            username = request.data.get('username')
            password = request.data.get('password')
            
            if not username or not password:
                return Response(
                    {'error': 'Username and password are required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Authenticate user
            user = authenticate(request, username=username, password=password)
            
            if not user:
                print(f"Authentication failed for username: {username}")
                return Response(
                    {'error': 'Invalid username or password'},
                    status=status.HTTP_401_UNAUTHORIZED
                )
            
            # Check if user has guest profile
            if not hasattr(user, 'guest') or user.guest is None:
                print("Not a guest account")
                return Response(
                    {'error': 'This account is not a guest account'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            if not user.guest.is_active:
                print("Guest account inactive")
                return Response(
                    {'error': 'Your account has been deactivated'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)
            access_token = str(refresh.access_token)
            refresh_token = str(refresh)
            
            print(f"Login successful for: {username}")
            
            return Response({
                'success': True,
                'message': 'Login successful',
                'access': access_token,
                'refresh': refresh_token,
                'user_id': user.id,
                'username': user.username,
                'email': user.guest.email,
                'name': user.guest.name,
                'guest_id': user.guest.id,
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            import traceback
            print(traceback.format_exc())
            return Response(
                {'error': f'Server error: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class GuestTokenRefreshView(TokenRefreshView):
    """
    Refresh JWT token for guests
    """
    def post(self, request, *args, **kwargs):
        try:
            response = super().post(request, *args, **kwargs)
            return Response({
                'access': response.data.get('access'),
                'refresh': response.data.get('refresh')
            }, status=status.HTTP_200_OK)
        except (InvalidToken, TokenError) as e:
            return Response(
                {'error': 'Invalid or expired refresh token'},
                status=status.HTTP_401_UNAUTHORIZED
            )        
        
class GuestLogoutView(APIView):
    """
    POST: Logout guest session
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        from django.contrib.auth import logout
        logout(request)
        return Response({'message': 'Logged out successfully.'}, status=status.HTTP_200_OK)


class GuestProfileView(APIView):
    """
    GET: Get current guest profile.
    PATCH/PUT: Update guest profile details and upload profile picture.

    Frontend endpoint:
    /api/guest/profile/
    """
    permission_classes = [IsAuthenticated]

    def _get_guest(self, request):
        try:
            return request.user.guest
        except Exception:
            return None

    def get(self, request):
        guest = self._get_guest(request)
        if not guest:
            return Response({'error': 'Not a guest account.'}, status=status.HTTP_403_FORBIDDEN)

        serializer = GuestSerializer(guest, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request):
        guest = self._get_guest(request)
        if not guest:
            return Response({'error': 'Not a guest account.'}, status=status.HTTP_403_FORBIDDEN)

        serializer = GuestSerializer(
            guest,
            data=request.data,
            partial=True,
            context={'request': request},
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request):
        return self.patch(request)


# Replace your Guest OTP views with these corrected versions



logger = logging.getLogger(__name__)

class GuestForgotPasswordView(APIView):
    """
    POST: Send OTP to guest email for password reset
    """
    permission_classes = []
    
    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response(
                {'error': 'Email is required.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if guest exists
        try:
            guest = Guest.objects.get(email=email)
            user_id = guest.user.id
            print(f"✅ Guest found: {guest.name} ({email})")
        except Guest.DoesNotExist:
            print(f"❌ No guest found with email: {email}")
            # Return success for security (don't reveal email doesn't exist)
            return Response({
                'message': 'If an account exists with this email, OTP has been sent.'
            }, status=status.HTTP_200_OK)

        # Generate 6-digit OTP
        otp = str(random.randint(100000, 999999))
        print(f"🔐 Generated OTP for {email}: {otp}")
        
        # Store in cache with all necessary data
        cache_key = f'guest_reset_{email}'
        cache.set(cache_key, {
            'otp': otp,
            'user_id': user_id,
            'email': email,
            'verified': False,  # Important: Track verification status
            'attempts': 0,
            'created_at': str(timezone.now())
        }, timeout=600)  # 10 minutes
        
        print(f"✅ OTP stored in cache with key: {cache_key}")
        print(f"Cache data: {cache.get(cache_key)}")

        # Send email
        try:
            send_mail(
                subject='Password Reset OTP - CloudInn Guest Portal',
                message=f'Your OTP for password reset is: {otp}\n\nThis OTP is valid for 10 minutes.\n\nIf you did not request this, please ignore this email.',
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email],
                fail_silently=False,
            )
            print(f"📧 Email sent to {email}")
        except Exception as e:
            print(f"❌ Email sending failed: {e}")

        return Response({
            'message': 'OTP has been sent to your email address.'
        }, status=status.HTTP_200_OK)


class GuestVerifyOTPView(APIView):
    """
    POST: Verify OTP for guest password reset
    """
    permission_classes = []
    
    def post(self, request):
        email = request.data.get('email')
        otp_entered = request.data.get('otp')

        print(f"\n🔍 Verifying OTP for {email}")
        print(f"Entered OTP: {otp_entered}")

        if not email or not otp_entered:
            return Response(
                {'error': 'Email and OTP are required.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get from cache
        cache_key = f'guest_reset_{email}'
        cached_data = cache.get(cache_key)
        
        print(f"Cache key: {cache_key}")
        print(f"Cached data: {cached_data}")

        if not cached_data:
            return Response(
                {'error': 'OTP has expired. Please request a new OTP.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check OTP attempts (max 3)
        if cached_data.get('attempts', 0) >= 3:
            cache.delete(cache_key)
            return Response(
                {'error': 'Too many failed attempts. Please request a new OTP.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verify OTP
        if str(cached_data['otp']) != str(otp_entered):
            cached_data['attempts'] = cached_data.get('attempts', 0) + 1
            cache.set(cache_key, cached_data, timeout=600)
            remaining = 3 - cached_data['attempts']
            print(f"❌ Invalid OTP. {remaining} attempts remaining")
            return Response(
                {'error': f'Invalid OTP. {remaining} attempts remaining.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Mark as verified
        cached_data['verified'] = True
        cache.set(cache_key, cached_data, timeout=600)
        
        print(f"✅ OTP verified successfully for {email}")
        print(f"Updated cache data: {cache.get(cache_key)}")

        return Response({
            'message': 'OTP verified successfully. Please set your new password.',
            'email': email
        }, status=status.HTTP_200_OK)


class GuestUpdatePasswordView(APIView):
    """
    POST: Update guest password after OTP verification
    """
    permission_classes = []
    
    def post(self, request):
        email = request.data.get('email')
        new_password = request.data.get('new_password')

        print(f"\n🔐 Password reset request for {email}")
        print(f"New password length: {len(new_password) if new_password else 0}")

        if not email or not new_password:
            return Response(
                {'error': 'Email and new password are required.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if len(new_password) < 6:
            return Response(
                {'error': 'Password must be at least 6 characters.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get from cache
        cache_key = f'guest_reset_{email}'
        cached_data = cache.get(cache_key)
        
        print(f"Cache key: {cache_key}")
        print(f"Cached data: {cached_data}")

        if not cached_data:
            return Response(
                {'error': 'Session expired. Please request a new OTP.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if OTP was verified
        if not cached_data.get('verified'):
            print(f"❌ OTP not verified for {email}")
            return Response(
                {'error': 'OTP not verified. Please verify your OTP first.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            guest = Guest.objects.get(email=email)
            user = guest.user
            user.set_password(new_password)
            user.save()
            
            # Clear cache after successful password update
            cache.delete(cache_key)
            
            print(f"✅ Password updated successfully for {email}")

            return Response({
                'message': 'Password updated successfully. Please login with your new password.'
            }, status=status.HTTP_200_OK)
            
        except Guest.DoesNotExist:
            print(f"❌ Guest not found: {email}")
            return Response(
                {'error': 'Guest account not found.'}, 
                status=status.HTTP_404_NOT_FOUND
            )



# ==================== PUBLIC HOTEL ROOM SUMMARY FOR ADMIN PROFILE ====================
@api_view(['GET'])
@permission_classes([AllowAny])
def public_hotel_room_summary(request, hotel_id):
    """
    Public endpoint for admin/public hotel profile page.
    It does not use owner token, so blocked owner accounts do not break room display.
    URL: /api/hotels/<hotel_id>/public-room-summary/
    """
    hotel = get_object_or_404(Hotel, id=hotel_id)
    inventory, _ = RoomInventory.objects.get_or_create(hotel=hotel)
    prices, _ = RoomPrice.objects.get_or_create(hotel=hotel)

    return Response({
        "hotel_id": hotel.id,
        "normal_rooms": inventory.normal_rooms,
        "deluxe_rooms": inventory.deluxe_rooms,
        "suite_rooms": inventory.suite_rooms,
        "normal_price": prices.normal_price,
        "deluxe_price": prices.deluxe_price,
        "suite_price": prices.suite_price,
    }, status=status.HTTP_200_OK)

# Add after your Guest views (around line 1300)

# ==================== GUEST ROOM AVAILABILITY ENDPOINTS ====================

@api_view(['GET'])
@permission_classes([AllowAny])
def get_hotel_rooms_for_guest(request, hotel_id):
    """
    Guest-accessible endpoint to get rooms for a specific hotel
    URL: /api/hotels/<hotel_id>/guest-rooms/
    """
    try:
        hotel = Hotel.objects.get(id=hotel_id)
        
        # Get inventory and prices for this hotel
        inventory, _ = RoomInventory.objects.get_or_create(hotel=hotel)
        prices, _ = RoomPrice.objects.get_or_create(hotel=hotel)
        
        rooms = []
        
        # Normal rooms (101-199)
        for i in range(inventory.normal_rooms):
            room_number = 101 + i
            rooms.append({
                'id': room_number,
                'room_number': room_number,
                'room_type': 'Standard',
                'type': 'standard',
                'price_per_night': float(prices.normal_price),
                'capacity': 2,
                'bed_type': 'Queen Bed',
                'amenities': ['Free WiFi', 'Air Conditioning', '40" Smart TV', 'Work Desk', 'Tea/Coffee Maker'],
                'description': 'Comfortable standard room with essential amenities.',
            })
        
        # Deluxe rooms (201-299)
        for i in range(inventory.deluxe_rooms):
            room_number = 201 + i
            rooms.append({
                'id': room_number,
                'room_number': room_number,
                'room_type': 'Deluxe',
                'type': 'deluxe',
                'price_per_night': float(prices.deluxe_price),
                'capacity': 3,
                'bed_type': 'King Bed',
                'amenities': ['Free WiFi', 'Air Conditioning', '55" Smart TV', 'Mini Bar', 'Bathtub', 'City View'],
                'description': 'Spacious deluxe room with premium furnishings and stunning views.',
            })
        
        # Suite rooms (301-399)
        for i in range(inventory.suite_rooms):
            room_number = 301 + i
            rooms.append({
                'id': room_number,
                'room_number': room_number,
                'room_type': 'Suite',
                'type': 'suite',
                'price_per_night': float(prices.suite_price),
                'capacity': 4,
                'bed_type': 'Super King Bed',
                'amenities': ['Free WiFi', 'Air Conditioning', '65" OLED TV', 'Mini Bar', 'Jacuzzi', 'Sea View', 'Private Balcony'],
                'description': 'Luxury suite with separate living area, jacuzzi, and breathtaking views.',
            })
        
        return Response({
            'success': True,
            'rooms': rooms,
            'total': len(rooms)
        }, status=status.HTTP_200_OK)
        
    except Hotel.DoesNotExist:
        return Response({'error': 'Hotel not found', 'rooms': []}, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({'error': str(e), 'rooms': []}, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_hotel_bookings_for_guest(request, hotel_id):
    """
    Guest-accessible endpoint to get bookings for a specific hotel
    URL: /api/hotels/<hotel_id>/guest-bookings/
    """
    try:
        hotel = Hotel.objects.get(id=hotel_id)
        
        # Get inventory to know room numbers for this hotel
        inventory, _ = RoomInventory.objects.get_or_create(hotel=hotel)
        
        # Generate list of room numbers for this hotel
        room_numbers = []
        
        # Normal rooms (101-199)
        for i in range(inventory.normal_rooms):
            room_numbers.append(str(101 + i))
        
        # Deluxe rooms (201-299)
        for i in range(inventory.deluxe_rooms):
            room_numbers.append(str(201 + i))
        
        # Suite rooms (301-399)
        for i in range(inventory.suite_rooms):
            room_numbers.append(str(301 + i))
        
        # Get all bookings
        all_bookings = ManageBookings.objects.all().order_by('-created_at')
        
        # Filter bookings that belong to this hotel's rooms
        hotel_bookings = []
        for booking in all_bookings:
            if booking.room:
                import re
                match = re.search(r'\d+', booking.room)
                if match:
                    room_num = match.group()
                    if room_num in room_numbers:
                        hotel_bookings.append({
                            'id': booking.id,
                            'room': booking.room,
                            'name': booking.name,
                            'email': booking.email,
                            'contact': booking.contact,
                            'check_in': booking.checkin,
                            'check_out': booking.checkout,
                            'days': booking.days,
                            'status': booking.status,
                            'created_at': booking.created_at
                        })
        
        return Response({
            'success': True,
            'bookings': hotel_bookings,
            'total': len(hotel_bookings)
        }, status=status.HTTP_200_OK)
        
    except Hotel.DoesNotExist:
        return Response({'error': 'Hotel not found', 'bookings': []}, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({'error': str(e), 'bookings': []}, status=status.HTTP_200_OK)



@api_view(["GET", "POST"])
@permission_classes([AllowAny])
def hotel_guest_reviews(request, hotel_id):
    """
    GET: Fetch reviews for one hotel.
    POST: Create a guest review with name, country, rating and comment.

    URL: /api/hotels/<hotel_id>/guest-reviews/
    Payload example:
    {
        "name": "Bikash",
        "country": "Nepal",
        "rating": 5,
        "comment": "Very good hotel."
    }
    """
    hotel = get_object_or_404(Hotel, id=hotel_id)

    if request.method == "GET":
        reviews = GuestReview.objects.filter(hotel=hotel).order_by("-created_at")
        serializer = GuestReviewSerializer(reviews, many=True)
        average = 0
        if reviews.exists():
            average = round(sum([int(r.rating or 0) for r in reviews]) / reviews.count(), 1)
        return Response({
            "success": True,
            "hotel_id": hotel.id,
            "hotel_name": hotel.name,
            "average_rating": average,
            "total": reviews.count(),
            "reviews": serializer.data,
        }, status=status.HTTP_200_OK)

    data = request.data.copy()
    data["hotel"] = hotel.id

    guest = None
    if request.user and request.user.is_authenticated and hasattr(request.user, "guest"):
        guest = request.user.guest
        data["guest"] = guest.id
        if not data.get("name"):
            data["name"] = guest.name

    serializer = GuestReviewSerializer(data=data)
    if serializer.is_valid():
        review = serializer.save(hotel=hotel, guest=guest)
        output = GuestReviewSerializer(review)
        return Response({
            "success": True,
            "message": "Review submitted successfully.",
            "review": output.data,
        }, status=status.HTTP_201_CREATED)

    return Response({
        "success": False,
        "errors": serializer.errors,
    }, status=status.HTTP_400_BAD_REQUEST)

# ==================== GUEST NOTIFICATIONS / OFFERS ====================

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def guest_notifications(request):
    """
    Guest notification page endpoint.
    Returns all active/upcoming promotions created from Owner Offers & Discounts.
    Also returns is_starred for the logged-in guest user.
    URL: /api/guest/notifications/
    """
    promotions = (
        Promotion.objects
        .exclude(status__iexact="Inactive")
        .exclude(status__iexact="Disabled")
        .order_by("-id")
    )

    starred_ids = set(
        GuestStarredPromotion.objects.filter(user=request.user)
        .values_list("promotion_id", flat=True)
    )

    data = []
    for promotion in promotions:
        data.append({
            "id": promotion.id,
            "hotel": promotion.hotel_id,
            "hotel_name": promotion.hotel.name if promotion.hotel else "",
            "title": promotion.title,
            "description": promotion.description,
            "valid_from": promotion.valid_from,
            "valid_to": promotion.valid_to,
            "status": promotion.status,
            "is_starred": promotion.id in starred_ids,
        })

    return Response(data, status=status.HTTP_200_OK)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def guest_starred_promotions(request):
    """
    Returns promotions starred by the logged-in guest.
    URL: /api/guest/starred-promotions/
    """
    starred = (
        GuestStarredPromotion.objects
        .filter(user=request.user)
        .select_related("promotion", "promotion__hotel")
        .order_by("-starred_at")
    )
    serializer = GuestStarredPromotionSerializer(starred, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def guest_star_promotion(request):
    """
    Star a promotion for the logged-in guest.
    Body: { "promotion": 1 } or { "promotion_id": 1 }
    URL: /api/guest/star-promotion/
    """
    promotion_id = request.data.get("promotion") or request.data.get("promotion_id")

    if not promotion_id:
        return Response(
            {"error": "promotion or promotion_id is required"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        promotion = Promotion.objects.get(id=promotion_id)
    except Promotion.DoesNotExist:
        return Response(
            {"error": "Promotion not found"},
            status=status.HTTP_404_NOT_FOUND,
        )

    starred, created = GuestStarredPromotion.objects.get_or_create(
        user=request.user,
        promotion=promotion,
    )

    serializer = GuestStarredPromotionSerializer(starred)
    return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def guest_unstar_promotion(request, promotion_id):
    """
    Unstar a promotion for the logged-in guest.
    URL: /api/guest/star-promotion/<promotion_id>/
    """
    deleted_count, _ = GuestStarredPromotion.objects.filter(
        user=request.user,
        promotion_id=promotion_id,
    ).delete()

    if deleted_count == 0:
        return Response(
            {"message": "Promotion was not starred."},
            status=status.HTTP_200_OK,
        )

    return Response(
        {"message": "Promotion unstarred successfully."},
        status=status.HTTP_200_OK,
    )
