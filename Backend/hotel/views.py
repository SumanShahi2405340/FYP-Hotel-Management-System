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
from .models import RoomInventory, RoomPrice, ManageMaintenanceRequest, Receptionist, Promotion, ManageBookings, Staff, Attendance
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
from .models import Guest
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
    GuestSerializer, GuestRegisterSerializer, GuestLoginSerializer
   
)

User = get_user_model()

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

# ==================== OWNER AUTHENTICATION VIEWS ====================

class OwnerOTPRequestView(APIView):
    def post(self, request):
        email = request.data.get('email')
        
        if not email:
            return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            hotel = Hotel.objects.get(email=email)
            user = hotel.user
        except Hotel.DoesNotExist:
            return Response({'error': 'No owner found with this email'}, status=status.HTTP_404_NOT_FOUND)
        
        otp = str(random.randint(100000, 999999))
        
        request.session['owner_reset_otp'] = otp
        request.session['owner_reset_user_id'] = user.id
        request.session['owner_reset_email'] = email
        request.session.set_expiry(600)
        
        try:
            send_mail(
                subject='Password Reset OTP - CloudInn Owner Portal',
                message=f'Your OTP for password reset is: {otp}\n\nThis OTP is valid for 10 minutes.\n\nIf you did not request this, please ignore this email.',
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email],
                fail_silently=False,
            )
        except Exception as e:
            return Response({'error': f'Failed to send email: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        return Response({
            'message': 'OTP has been sent to your email address',
            'email': email
        }, status=status.HTTP_200_OK)

class OwnerOTPVerifyView(APIView):
    def post(self, request):
        email = request.data.get('email')
        otp_entered = request.data.get('otp')
        
        if not email or not otp_entered:
            return Response({'error': 'Email and OTP are required'}, status=status.HTTP_400_BAD_REQUEST)
        
        stored_otp = request.session.get('owner_reset_otp')
        stored_email = request.session.get('owner_reset_email')
        
        if not stored_otp:
            return Response({'error': 'OTP has expired. Please request a new OTP.'}, status=status.HTTP_400_BAD_REQUEST)
        
        if str(stored_otp) != str(otp_entered):
            return Response({'error': 'Invalid OTP. Please try again.'}, status=status.HTTP_400_BAD_REQUEST)
        
        if stored_email != email:
            return Response({'error': 'Email mismatch. Please request a new OTP.'}, status=status.HTTP_400_BAD_REQUEST)
        
        return Response({
            'message': 'OTP verified successfully. Please set your new password.',
            'email': email
        }, status=status.HTTP_200_OK)

class OwnerUpdatePasswordView(APIView):
    def post(self, request):
        email = request.data.get('email')
        new_password = request.data.get('new_password')
        
        if not email or not new_password:
            return Response({'error': 'Email and new password are required'}, status=status.HTTP_400_BAD_REQUEST)
        
        if len(new_password) < 6:
            return Response({'error': 'Password must be at least 6 characters'}, status=status.HTTP_400_BAD_REQUEST)
        
        stored_email = request.session.get('owner_reset_email')
        if not stored_email or stored_email != email:
            return Response({'error': 'OTP not verified. Please request a new OTP.'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            hotel = Hotel.objects.get(email=email)
            user = hotel.user
            user.set_password(new_password)
            user.save()
            
            request.session.pop('owner_reset_otp', None)
            request.session.pop('owner_reset_user_id', None)
            request.session.pop('owner_reset_email', None)
            
            return Response({
                'message': 'Password updated successfully. Please login with your new password.'
            }, status=status.HTTP_200_OK)
            
        except Hotel.DoesNotExist:
            return Response({'error': 'Owner not found'}, status=status.HTTP_404_NOT_FOUND)

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
    def get(self, request, pk):
        try:
            hotel = Hotel.objects.get(pk=pk)
            serializer = HotelSerializer(hotel)
            return Response(serializer.data)
        except Hotel.DoesNotExist:
            return Response({'error': 'Hotel not found'}, status=status.HTTP_404_NOT_FOUND)

class OwnerProfileView(APIView):
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

# ==================== ANNOUNCEMENT VIEWS ====================
# Replace / add these four functions in your views.py


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_announcement(request):
    """
    Admin → Hotels.
    Payload: { "message": "...", "hotel_status": "all" | "active" | "inactive" }
    Creates one SendAdminAnnouncement row per matched hotel.
    """
    message = request.data.get('message', '').strip()
    hotel_status = request.data.get('hotel_status', 'all')

    if not message:
        return Response({'error': 'Message content is required.'}, status=status.HTTP_400_BAD_REQUEST)

    qs_map = {
        'active':   Hotel.objects.filter(status='Active'),
        'inactive': Hotel.objects.filter(status='Inactive'),
        'all':      Hotel.objects.all(),
    }
    hotels = qs_map.get(hotel_status, Hotel.objects.all())

    if not hotels.exists():
        return Response(
            {'error': f'No hotels found for filter: {hotel_status}'},
            status=status.HTTP_404_NOT_FOUND
        )

    created = [
        SendAdminAnnouncement.objects.create(hotel=hotel, message=message)
        for hotel in hotels
    ]

    return Response({
        'success': True,
        'sent_to': len(created),
        'hotel_status_filter': hotel_status,
        'message': f'Announcement sent to {len(created)} hotel(s) successfully.',
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def recent_announcements(request):
    """
    Owner dashboard — returns admin announcements sent TO this owner's hotel only.
    The JWT identifies the logged-in user; we look up their hotel and filter by it.

    Response shape (matches OwnerNotificationSetting.jsx):
        [{ id, content, hotel_name, timestamp }, ...]
    """
    hotel = getattr(request.user, 'hotel', None)

    if not hotel:
        return Response(
            {'error': 'No hotel linked to this account.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    announcements = (
        SendAdminAnnouncement.objects
        .filter(hotel=hotel)           # ✅ only this hotel's announcements
        .select_related('hotel')
        .order_by('-created_at')[:30]
    )

    data = [
        {
            'id':         ann.id,
            'content':    ann.message,
            'hotel_name': ann.hotel.name if ann.hotel else None,
            'timestamp':  ann.created_at,
        }
        for ann in announcements
    ]

    return Response(data, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def owner_send_announcement(request):
    """
    Owner → Admin and/or Receptionist.
    Payload: { "message": "...", "sendToAdmin": true, "sendToReceptionist": true }
    """
    message = request.data.get('message', '').strip()
    send_to_admin        = request.data.get('sendToAdmin', False)
    send_to_receptionist = request.data.get('sendToReceptionist', False)

    if not message:
        return Response({'error': 'Message content is required.'}, status=status.HTTP_400_BAD_REQUEST)

    if not send_to_admin and not send_to_receptionist:
        return Response(
            {'error': 'At least one recipient (Admin or Receptionist) must be selected.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    hotel = getattr(request.user, 'hotel', None)
    if not hotel:
        return Response({'error': 'No hotel linked to this owner account.'}, status=status.HTTP_400_BAD_REQUEST)

    saved       = {}
    saved_items = []

    if send_to_admin:
        ann = SendAdminAnnouncement.objects.create(hotel=hotel, message=message)
        saved['admin'] = {
            'id': ann.id, 'message': ann.message,
            'hotel_name': hotel.name, 'created_at': ann.created_at, 'recipient': 'admin'
        }
        saved_items.append({
            'id': ann.id, 'content': ann.message,
            'recipients': ['admin'], 'timestamp': ann.created_at
        })

    if send_to_receptionist:
        ann = SendReceptionistAnnouncement.objects.create(hotel=hotel, message=message)
        saved['receptionist'] = {
            'id': ann.id, 'message': ann.message,
            'hotel_name': hotel.name, 'created_at': ann.created_at, 'recipient': 'receptionist'
        }
        saved_items.append({
            'id': ann.id, 'content': ann.message,
            'recipients': ['receptionist'], 'timestamp': ann.created_at
        })

    return Response({
        'success': True,
        'saved': saved,
        'announcements': saved_items,
        'message': f'Announcement sent successfully to {len(saved_items)} recipient(s).',
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def owner_recent_announcements(request):
    """
    Returns announcements sent BY the owner of this hotel
    (to admin and/or receptionist), filtered to this hotel only.

    Each item has a 'type' field: 'admin' | 'receptionist'
    so the frontends can filter correctly:
      - OwnerNotificationSetting   (admin view of what owner sent)  → filters type == 'admin'
      - ReceptionistNotificationSetting                              → filters type == 'receptionist'
    """
    hotel = getattr(request.user, 'hotel', None)

    # Also support receptionist users: their hotel lives on request.user.receptionist.hotel
    if not hotel and hasattr(request.user, 'receptionist') and request.user.receptionist:
        hotel = request.user.receptionist.hotel

    if not hotel:
        return Response({'error': 'No hotel linked to this account.'}, status=status.HTTP_400_BAD_REQUEST)

    combined = []

    for ann in SendAdminAnnouncement.objects.filter(hotel=hotel).order_by('-created_at')[:10]:
        combined.append({
            'id':         ann.id,
            'content':    ann.message,
            'hotel_name': ann.hotel.name if ann.hotel else None,
            'timestamp':  ann.created_at,
            'type':       'admin',          # ← owner sent this to admin
            'recipients': ['admin'],
        })

    for ann in SendReceptionistAnnouncement.objects.filter(hotel=hotel).order_by('-created_at')[:10]:
        combined.append({
            'id':         ann.id,
            'content':    ann.message,
            'hotel_name': ann.hotel.name if ann.hotel else None,
            'timestamp':  ann.created_at,
            'type':       'receptionist',   # ← owner sent this to receptionist
            'recipients': ['receptionist'],
        })

    combined.sort(key=lambda x: x['timestamp'], reverse=True)
    return Response(combined, status=status.HTTP_200_OK)
# ==================== STARRED NOTIFICATIONS ====================

class OwnerStarredNotificationList(generics.ListAPIView):
    serializer_class = OwnerStarredNotificationSerializer

    def get_queryset(self):
        return OwnerStarredNotification.objects.all()

class OwnerStarredNotificationCreate(generics.CreateAPIView):
    serializer_class = OwnerStarredNotificationSerializer

    def perform_create(self, serializer):
        serializer.save()

class OwnerStarredNotificationDelete(generics.DestroyAPIView):
    def delete(self, request, pk):
        try:
            starred = OwnerStarredNotification.objects.get(announcement_id=pk)
            starred.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except OwnerStarredNotification.DoesNotExist:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)

# ==================== ROOM MANAGEMENT VIEWS ====================

class RoomInventoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        hotel = request.user.hotel
        inventory, _ = RoomInventory.objects.get_or_create(hotel=hotel)
        serializer = RoomInventorySerializer(inventory)
        return Response(serializer.data)

    def put(self, request):
        hotel = request.user.hotel
        inventory, _ = RoomInventory.objects.get_or_create(hotel=hotel)
        serializer = RoomInventorySerializer(inventory, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class RoomPriceView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        hotel = request.user.hotel
        prices, _ = RoomPrice.objects.get_or_create(hotel=hotel)
        serializer = RoomPriceSerializer(prices)
        return Response(serializer.data)

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
    GET: Get all images for a specific room
    POST: Upload new images (replaces existing ones)
    DELETE: Delete all images for a specific room
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """
        Get all images for a specific room or all rooms
        Query params:
        - room_number: (optional) Get images for specific room
        """
        hotel = request.user.hotel
        
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
    GET: Get current guest profile
    PUT: Update guest profile
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            guest = request.user.guest
        except Exception:
            return Response({'error': 'Not a guest account.'}, status=status.HTTP_403_FORBIDDEN)

        serializer = GuestSerializer(guest)
        return Response(serializer.data)

    def put(self, request):
        try:
            guest = request.user.guest
        except Exception:
            return Response({'error': 'Not a guest account.'}, status=status.HTTP_403_FORBIDDEN)

        serializer = GuestSerializer(guest, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


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













# #There are three types of views like classbased ApiView, generics.ListCreateAPIView and Function based view
# import random, secrets, string
# from django.core.mail import send_mail
# from django.conf import settings
# from django.contrib.auth import authenticate, login
# from django.contrib.auth.models import User
# from rest_framework.views import APIView
# from rest_framework import viewsets
# from django.utils import timezone
# from rest_framework.response import Response
# from rest_framework import status, generics, permissions
# from rest_framework.exceptions import PermissionDenied
# from rest_framework.generics import ListAPIView, UpdateAPIView
# from rest_framework.viewsets import ModelViewSet 
# from rest_framework.decorators import action
# from datetime import date
# from django.core.cache import cache
# from .models import Hotel, CommissionRule, CommissionPayment
# from .models import SendAdminAnnouncement, SendOwnerAnnouncement, SendReceptionistAnnouncement
# from .models import OwnerStarredNotification, CommissionReport
# from .models import RoomInventory, RoomPrice, ManageMaintenanceRequest, Receptionist, Promotion, ManageBookings, Staff, Attendance
# from .models import ManagePayments
# from rest_framework.permissions import IsAuthenticated
# from django.contrib.auth.hashers import make_password
# from django.contrib.auth import get_user_model
# from rest_framework.decorators import api_view, permission_classes
# from django.shortcuts import get_object_or_404

# # from rest_framework_simplejwt.tokens import RefreshToken
# import uuid
# from .serializers import (
#     AdminLoginSerializer,
#     OTPRequestSerializer,
#     OTPVerifySerializer,
#     HotelSerializer,
#     HotelRegisterSerializer,
#     CommissionRuleSerializer,
#     CommissionPaymentSerializer,
#     CommissionRevenueSerializer,
#     #SendAdminAnnouncementSerializer,
#     SendOwnerAnnouncementSerializer,
#     SendReceptionistAnnouncementSerializer,

#     OwnerStarredNotificationSerializer,
#     # OwnerLoginSerializer,
#     RoomInventorySerializer,
#     RoomPriceSerializer,
#     ManageMaintenanceRequestSerializer,
#     ReceptionistSerializer,
#     PromotionSerializer,
#     CommissionReportSerializer,
#     ReceptionistRegisterSerializer,   
#     ManageBookingsSerializer,
#     StaffSerializer,AttendanceSerializer,
#     ManagePaymentsSerializer,

# )



# User = get_user_model()

# # Utility
# def generate_password(length=8):
#     return ''.join(random.choices(string.ascii_letters + string.digits, k=length))




# # Receptionist Register View
# @api_view(["POST"])
# @permission_classes([permissions.IsAuthenticated])
# def register_receptionist(request):
#     data = request.data.copy()
#     data["role"] = "Receptionist"   #  force role

#     serializer = ReceptionistRegisterSerializer(data=data)
#     if serializer.is_valid():
#         email = serializer.validated_data["email"]
#         # Generate unique username with only 3 letters
#         username = f"{email}_{uuid.uuid4().hex[:3]}"   #  only 3 chars
#         password = generate_password()

#         user = User.objects.create(
#             username=username,
#             email=email,
#             password=make_password(password)
#         )

#         hotel = getattr(request.user, "hotel", None)
#         if not hotel:
#             return Response({"error": "No hotel linked to this account"}, status=status.HTTP_400_BAD_REQUEST)

#         receptionist = serializer.save(user=user, hotel=hotel, role="Receptionist")

#         send_mail(
#             subject=f"Receptionist Account Created for {hotel.name}",
#             message=f"Dear {receptionist.name},\n\nYour account for {hotel.name} has been created.\nUsername: {username}\nPassword: {password}",
#             from_email="admin@cloudinn.com",
#             recipient_list=[email],
#         )

#         return Response({
#             "message": f"Receptionist registered for {hotel.name} and credentials sent.",
#             "hotel_id": hotel.id
#         }, status=status.HTTP_201_CREATED)

#     print(serializer.errors)
#     return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)





# # Receptionist  Details View in Receptionist Dashboard
# @api_view(["GET"])
# @permission_classes([permissions.IsAuthenticated])
# def get_hotel_receptionist(request):
#     hotel = getattr(request.user, "hotel", None)
#     if not hotel:
#         return Response({"error": "No hotel linked to this account"}, status=400)

#     receptionists = Receptionist.objects.filter(hotel=hotel)
#     serializer = ReceptionistSerializer(receptionists, many=True)
#     return Response(serializer.data)




# #Get Receptionist Details in managestaff and attendance in owner dashboard
# @api_view(["GET"])
# @permission_classes([IsAuthenticated])
# def get_hotel_receptionist_info(request):
#     try:
#         hotel = request.user.hotel   # Owner’s hotel relation
#     except Exception:
#         return Response({"error": "No hotel linked to this account"}, status=400)

#     receptionists = hotel.receptionists.all()
#     serializer = ReceptionistSerializer(receptionists, many=True)

#     return Response({
#         "hotel_id": hotel.id,
#         "hotel_name": hotel.name,
#         "receptionists": serializer.data
#     })



# #Staff Viewsets
# @api_view(["GET"])
# @permission_classes([IsAuthenticated])
# def get_hotel_staff_info(request):
#     hotel = getattr(request.user, "hotel", None)
#     if not hotel:
#         return Response({"error": "No hotel linked to user"}, status=status.HTTP_400_BAD_REQUEST)

#     staff = Staff.objects.filter(hotel=hotel)
#     serializer = StaffSerializer(staff, many=True)
#     return Response({
#         "hotel_id": hotel.id,
#         "hotel_name": hotel.name,
#         "staff": serializer.data
#     })

# @api_view(["POST"])
# @permission_classes([IsAuthenticated])
# def add_staff(request):
#     hotel = getattr(request.user, "hotel", None)
#     if not hotel:
#         return Response({"error": "No hotel linked to user"}, status=status.HTTP_400_BAD_REQUEST)

#     data = request.data.copy()
#     data["hotel"] = hotel.id
#     serializer = StaffSerializer(data=data)
#     if serializer.is_valid():
#         serializer.save()
#         return Response(serializer.data, status=status.HTTP_201_CREATED)
#     return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# @api_view(["DELETE"])
# @permission_classes([IsAuthenticated])
# def delete_staff(request, pk):
#     """
#     Delete a staff record by ID.
#     """
#     try:
#         staff = Staff.objects.get(pk=pk)
#         staff.delete()
#         return Response({"message": "Staff record deleted successfully"}, status=status.HTTP_204_NO_CONTENT)
#     except Staff.DoesNotExist:
#         return Response({"error": "Staff not found"}, status=status.HTTP_404_NOT_FOUND)


# # attendance/views.py
# # views.py
# class AttendanceViewSet(viewsets.ModelViewSet):
#     queryset = Attendance.objects.all()
#     serializer_class = AttendanceSerializer
#     permission_classes = [IsAuthenticated]

#     # Existing staff history
#     @action(detail=False, methods=["get"])
#     def staff_history(self, request):
#         staff_id = request.query_params.get("staff_id")
#         if not staff_id:
#             return Response({"error": "staff_id is required"}, status=400)

#         records = Attendance.objects.filter(staff_id=staff_id).order_by("-date")
#         serializer = AttendanceSerializer(records, many=True)
#         return Response(serializer.data)

#     #  New receptionist history
#     @action(detail=False, methods=["get"])
#     def receptionist_history(self, request):
#         receptionist_id = request.query_params.get("receptionist_id")
#         if not receptionist_id:
#             return Response({"error": "receptionist_id is required"}, status=400)

#         records = Attendance.objects.filter(receptionist_id=receptionist_id).order_by("-date")
#         serializer = AttendanceSerializer(records, many=True)
#         return Response(serializer.data)


#     # POST mark attendance for a staff (ensures one record per day)
#     @action(detail=False, methods=["post"])
#     def mark(self, request):
#         staff_id = request.data.get("staff_id")
#         receptionist_id = request.data.get("receptionist_id")
#         status_val = request.data.get("status")

#         if not status_val or (not staff_id and not receptionist_id):
#             return Response({"error": "Provide staff_id or receptionist_id and status"}, status=400)

#         today = date.today()

#         if staff_id:
#             updated = Attendance.objects.filter(staff_id=staff_id, date=today).update(status=status_val)
#             if updated == 0:
#                 record = Attendance.objects.create(staff_id=staff_id, status=status_val, date=today)
#             else:
#                 record = Attendance.objects.filter(staff_id=staff_id, date=today).latest("id")

#         elif receptionist_id:
#             updated = Attendance.objects.filter(receptionist_id=receptionist_id, date=today).update(status=status_val)
#             if updated == 0:
#                 record = Attendance.objects.create(receptionist_id=receptionist_id, status=status_val, date=today)
#             else:
#                 record = Attendance.objects.filter(receptionist_id=receptionist_id, date=today).latest("id")

#         serializer = AttendanceSerializer(record)
#         return Response(serializer.data, status=201)
    


#     @action(detail=True, methods=["patch"])
#     def status(self, request, pk=None):
#         attendance = self.get_object()
#         new_status = request.data.get("status")

#         if new_status not in ["Active", "Inactive"]:
#             return Response({"error": "Invalid status"}, status=400)

#         if attendance.staff:
#             attendance.staff.status = new_status
#             attendance.staff.save()
#             return Response({"status": attendance.staff.status})

#         elif attendance.receptionist:
#             attendance.receptionist.status = new_status
#             attendance.receptionist.save()
#             return Response({"status": attendance.receptionist.status})

#         return Response({"error": "No staff or receptionist linked"}, status=400)


#     # NEW: Monthly attendance filter
#     @action(detail=False, methods=["get"])
#     def monthly(self, request):
#         person_id = request.query_params.get("person_id")
#         year = request.query_params.get("year")
#         month = request.query_params.get("month")

#         if not person_id or not year or not month:
#             return Response({"error": "person_id, year and month are required"}, status=400)

#         try:
#             year = int(year)
#             month = int(month)
#         except ValueError:
#             return Response({"error": "year and month must be integers"}, status=400)

#         # Filter by either staff_id or receptionist_id
#         records = Attendance.objects.filter(
#             date__year=year,
#             date__month=month
#         ).filter(
#             staff_id=person_id
#         ) | Attendance.objects.filter(
#             date__year=year,
#             date__month=month
#         ).filter(
#             receptionist_id=person_id
#         )

#         serializer = AttendanceSerializer(records.order_by("date"), many=True)
#         return Response(serializer.data)




# # HOTEL VIEWSET
# class HotelViewSet(ModelViewSet):
#      queryset = Hotel.objects.all() 
#      serializer_class = HotelSerializer


# # AUTHENTICATION + OTP VIEWS
# User = get_user_model()

# class AdminLoginView(APIView):
#     def post(self, request):
#         email = request.data.get("email")
#         password = request.data.get("password")

#         # Find all users with this email
#         users = User.objects.filter(email=email)
#         if not users.exists():
#             return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

#         # Pick the first match (graceful handling of duplicates)
#         user = users.first()

#         # Authenticate using username (default Django backend)
#         user = authenticate(request, username=user.username, password=password)

#         if user is not None and user.is_staff:
#             login(request, user)  # session cookie set
#             return Response({'message': 'Login successful'}, status=status.HTTP_200_OK)

#         return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)




# # Step 2: Forgot password → send OTP (FIXED for duplicate emails)
# class OTPRequestView(APIView):
#     def post(self, request):
#         serializer = OTPRequestSerializer(data=request.data)
#         serializer.is_valid(raise_exception=True)

#         email = serializer.validated_data['email']
        
#         # Find all users with this email
#         users = User.objects.filter(email=email)
#         if not users.exists():
#             return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

#         # If multiple users exist, try to find an admin/staff user first
#         user = None
#         for u in users:
#             if u.is_staff or u.is_superuser:
#                 user = u
#                 break
        
#         # If no admin found, take the first user
#         if not user:
#             user = users.first()

#         # Generate 6-digit OTP
#         otp = str(random.randint(100000, 999999))
        
#         # Store in session
#         request.session['reset_otp'] = otp
#         request.session['reset_user_id'] = user.id
#         request.session['reset_user_email'] = email
#         request.session.set_expiry(600)  # 10 minutes

#         # Send email with OTP
#         try:
#             send_mail(
#                 subject='Password Reset OTP - CloudInn',
#                 message=f'Your OTP for password reset is: {otp}\n\nThis OTP is valid for 10 minutes.\n\nIf you did not request this, please ignore this email.',
#                 from_email=settings.DEFAULT_FROM_EMAIL,
#                 recipient_list=[user.email],
#                 fail_silently=False,
#             )
#         except Exception as e:
#             return Response({'error': f'Failed to send email: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

#         return Response({
#             'message': 'OTP has been sent to your email address',
#             'email': email
#         }, status=status.HTTP_200_OK)


# # Step 3: Verify OTP → login (UPDATED)
# class OTPVerifyView(APIView):
#     def post(self, request):
#         serializer = OTPVerifySerializer(data=request.data)
#         serializer.is_valid(raise_exception=True)

#         email = serializer.validated_data.get('email')
#         otp_entered = serializer.validated_data.get('otp')

#         # Check session OTP
#         stored_otp = request.session.get('reset_otp')
#         stored_email = request.session.get('reset_user_email')

#         if not stored_otp:
#             return Response({'error': 'OTP has expired. Please request a new OTP.'}, status=status.HTTP_400_BAD_REQUEST)

#         if str(stored_otp) != str(otp_entered):
#             return Response({'error': 'Invalid OTP. Please try again.'}, status=status.HTTP_400_BAD_REQUEST)

#         # Verify email matches
#         if stored_email != email:
#             return Response({'error': 'Email mismatch. Please request a new OTP.'}, status=status.HTTP_400_BAD_REQUEST)

#         user_id = request.session.get('reset_user_id')
#         if not user_id:
#             return Response({'error': 'Session expired. Please request a new OTP.'}, status=status.HTTP_400_BAD_REQUEST)

#         try:
#             user = User.objects.get(id=user_id)
#         except User.DoesNotExist:
#             return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

#         # Clear session
#         request.session.pop('reset_otp', None)
#         request.session.pop('reset_user_id', None)
#         request.session.pop('reset_user_email', None)

#         # Log the user in
#         login(request, user)

#         return Response({
#             'message': 'OTP verified successfully. You are now logged in.',
#             'user_id': user.id,
#             'email': user.email,
#             'is_admin': user.is_staff
#         }, status=status.HTTP_200_OK)
    



# # 2 Owner OTP Request View (Forgot Password)
# class OwnerOTPRequestView(APIView):
#     def post(self, request):
#         email = request.data.get('email')
        
#         if not email:
#             return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)
        
#         # Find owner by email in Hotel model
#         try:
#             hotel = Hotel.objects.get(email=email)
#             user = hotel.user  # Get the associated User
#         except Hotel.DoesNotExist:
#             return Response({'error': 'No owner found with this email'}, status=status.HTTP_404_NOT_FOUND)
        
#         # Generate 6-digit OTP
#         otp = str(random.randint(100000, 999999))
        
#         # Store in session with owner prefix
#         request.session['owner_reset_otp'] = otp
#         request.session['owner_reset_user_id'] = user.id
#         request.session['owner_reset_email'] = email
#         request.session.set_expiry(600)  # 10 minutes
        
#         # Send email with OTP
#         try:
#             send_mail(
#                 subject='Password Reset OTP - CloudInn Owner Portal',
#                 message=f'Your OTP for password reset is: {otp}\n\nThis OTP is valid for 10 minutes.\n\nIf you did not request this, please ignore this email.',
#                 from_email=settings.DEFAULT_FROM_EMAIL,
#                 recipient_list=[email],
#                 fail_silently=False,
#             )
#         except Exception as e:
#             return Response({'error': f'Failed to send email: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
#         return Response({
#             'message': 'OTP has been sent to your email address',
#             'email': email
#         }, status=status.HTTP_200_OK)


# # Owner OTP Verify View
# class OwnerOTPVerifyView(APIView):
#     def post(self, request):
#         email = request.data.get('email')
#         otp_entered = request.data.get('otp')
        
#         if not email or not otp_entered:
#             return Response({'error': 'Email and OTP are required'}, status=status.HTTP_400_BAD_REQUEST)
        
#         stored_otp = request.session.get('owner_reset_otp')
#         stored_email = request.session.get('owner_reset_email')
        
#         if not stored_otp:
#             return Response({'error': 'OTP has expired. Please request a new OTP.'}, status=status.HTTP_400_BAD_REQUEST)
        
#         if str(stored_otp) != str(otp_entered):
#             return Response({'error': 'Invalid OTP. Please try again.'}, status=status.HTTP_400_BAD_REQUEST)
        
#         if stored_email != email:
#             return Response({'error': 'Email mismatch. Please request a new OTP.'}, status=status.HTTP_400_BAD_REQUEST)
        
#         # Don't clear session yet - keep for password update
#         return Response({
#             'message': 'OTP verified successfully. Please set your new password.',
#             'email': email
#         }, status=status.HTTP_200_OK)


# # Owner Update Password View
# class OwnerUpdatePasswordView(APIView):
#     def post(self, request):
#         email = request.data.get('email')
#         new_password = request.data.get('new_password')
        
#         if not email or not new_password:
#             return Response({'error': 'Email and new password are required'}, status=status.HTTP_400_BAD_REQUEST)
        
#         if len(new_password) < 6:
#             return Response({'error': 'Password must be at least 6 characters'}, status=status.HTTP_400_BAD_REQUEST)
        
#         # Verify OTP was verified (check session)
#         stored_email = request.session.get('owner_reset_email')
#         if not stored_email or stored_email != email:
#             return Response({'error': 'OTP not verified. Please request a new OTP.'}, status=status.HTTP_400_BAD_REQUEST)
        
#         try:
#             hotel = Hotel.objects.get(email=email)
#             user = hotel.user
#             user.set_password(new_password)
#             user.save()
            
#             # Clear session
#             request.session.pop('owner_reset_otp', None)
#             request.session.pop('owner_reset_user_id', None)
#             request.session.pop('owner_reset_email', None)
            
#             return Response({
#                 'message': 'Password updated successfully. Please login with your new password.'
#             }, status=status.HTTP_200_OK)
            
#         except Hotel.DoesNotExist:
#             return Response({'error': 'Owner not found'}, status=status.HTTP_404_NOT_FOUND)



# # HOTEL MANAGEMENT  Register VIEW
# def generate_password(length=8):
#     alphabet = string.ascii_letters + string.digits
#     return ''.join(secrets.choice(alphabet) for _ in range(length))


# class RegisterHotelView(APIView):
#     def post(self, request):
#         serializer = HotelRegisterSerializer(data=request.data)
#         if not serializer.is_valid():
#             return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

#         data = serializer.validated_data
#         password = generate_password()
#         username = data["email"].split("@")[0] + secrets.token_hex(2)

#         user = User.objects.create_user(username=username, email=data["email"], password=password)

#         hotel = Hotel.objects.create(
#             name=data["name"],
#             owner=data["owner"],
#             contact=data["contact"],
#             email=data["email"],
#             location=data["location"],
#             pan=data["pan"],
#             age=request.data.get("age"),
#             owner_contact=request.data.get("owner_contact"),
#             citizenship=request.data.get("citizenship"),
#             permanent_address=request.data.get("permanent_address"),
#             user=user
#         )


#         # Send credentials via email
#         subject = "Hotel Registration Credentials"
#         message = f"""
#         Dear {data['owner']},

#         Your hotel '{data['name']}' has been registered successfully.

#         Login credentials:
#         Username: {username}
#         Password: {password}

#         Regards,
#         CloudInn Platform
#         """
#         send_mail(subject, message, "please-reply@cloudinn.com", [data["email"]], fail_silently=False)

#         return Response({"message": "Hotel registered successfully", "hotel": HotelSerializer(hotel).data, "owner_user": user.username}, status=201)
    


# #REceptionist Register View
# def generate_password(length=8):
#     return ''.join(random.choices(string.ascii_letters + string.digits, k=length))

# @api_view(["POST"])
# @permission_classes([permissions.IsAuthenticated])
# def register_receptionist(request):
#     serializer = ReceptionistRegisterSerializer(data=request.data)
#     if serializer.is_valid():
#         email = serializer.validated_data["email"]
#         #  Generate unique username even if email is duplicate
#         username = f"{email}_{uuid.uuid4().hex[:6]}"
#         password = generate_password()

#         user = User.objects.create(
#             username=username,
#             email=email,
#             password=make_password(password)
#         )

#         hotel = getattr(request.user, "hotel", None)
#         if not hotel:
#             return Response({"error": "No hotel linked to this account"}, status=status.HTTP_400_BAD_REQUEST)

#         receptionist = serializer.save(user=user, hotel=hotel)

#         send_mail(
#             subject=f"Receptionist Account Created for {hotel.name}",
#             message=f"Dear {receptionist.name},\n\nYour account for {hotel.name} has been created.\nUsername: {username}\nPassword: {password}",
#             from_email="admin@cloudinn.com",
#             recipient_list=[email],
#         )

#         return Response({
#             "message": f"Receptionist registered for {hotel.name} and credentials sent.",
#             "hotel_id": hotel.id
#         }, status=status.HTTP_201_CREATED)

#     return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# # Receptionist in Receptionist Dashboard
# @api_view(["GET"])
# @permission_classes([IsAuthenticated])
# def get_hotel_receptionist(request):
#     try:
#         # receptionist is linked to the logged-in user
#         receptionist = request.user.receptionist
#         hotel = receptionist.hotel
#     except Exception:
#         return Response({"error": "No hotel linked to this account"}, status=400)

#     # Fetch receptionists belonging to that hotel
#     receptionists = Receptionist.objects.filter(hotel=hotel)
#     serializer = ReceptionistSerializer(receptionists, many=True)

#     return Response({
#         "hotel_id": hotel.id,
#         "hotel_name": hotel.name,
#         "receptionists": serializer.data
#     })


# #Receptionist in Owner Dashboard
# @api_view(["GET"])
# @permission_classes([IsAuthenticated])
# def get_hotel_receptionist_info(request):
#     try:
#         # owner is linked to the logged-in user via hotel relation
#         hotel = request.user.hotel
#     except Exception:
#         return Response({"error": "No hotel linked to this account"}, status=400)

#     # Fetch receptionists belonging to that hotel
#     receptionists = hotel.receptionists.all()
#     serializer = ReceptionistSerializer(receptionists, many=True)

#     return Response({
#         "hotel_id": hotel.id,
#         "hotel_name": hotel.name,
#         "receptionists": serializer.data
#     })





# class ListHotelsView(ListAPIView):
#     serializer_class = HotelSerializer

#     def get_queryset(self):
#         status_filter = self.request.query_params.get('status')
#         if status_filter in ["Active", "Inactive"]:
#             return Hotel.objects.filter(status=status_filter)
#         return Hotel.objects.all()


# class ActivateHotelView(APIView):
#     def patch(self, request, pk):
#         try:
#             hotel = Hotel.objects.get(pk=pk)
#         except Hotel.DoesNotExist:
#             return Response({"error": "Hotel not found"}, status=status.HTTP_404_NOT_FOUND)

#         hotel.status = "Active"
#         hotel.save()
#         return Response({"message": "Hotel activated successfully", "hotel": HotelSerializer(hotel).data})


# class DeactivateHotelView(APIView):
#     def patch(self, request, pk):
#         try:
#             hotel = Hotel.objects.get(pk=pk)
#         except Hotel.DoesNotExist:
#             return Response({"error": "Hotel not found"}, status=status.HTTP_404_NOT_FOUND)

#         hotel.status = "Inactive"
#         hotel.save()
#         return Response({"message": "Hotel deactivated successfully", "hotel": HotelSerializer(hotel).data})


# class HotelUpdateView(UpdateAPIView):
#     queryset = Hotel.objects.all()
#     serializer_class = HotelSerializer


# class DeleteHotelView(APIView):
#     def delete(self, request, pk):
#         try:
#             hotel = Hotel.objects.get(pk=pk)
#             hotel.delete()
#             return Response({"message": "Hotel deleted successfully"}, status=status.HTTP_204_NO_CONTENT)
#         except Hotel.DoesNotExist:
#             return Response({"error": "Hotel not found"}, status=status.HTTP_404_NOT_FOUND)
        

# # contains hotel_id and hotel_name
# @api_view(['GET'])
# @permission_classes([IsAuthenticated])
# def me(request):
#     user = request.user
#     hotel = getattr(user, "hotel", None)
#     return Response({
#         "user_id": user.id,
#         "hotel_id": hotel.id if hotel else None,
#         "hotel_name": hotel.name if hotel else None,
#     })



# class HotelProfileView(APIView):
#     def get(self, request, pk):
#         try:
#             hotel = Hotel.objects.get(pk=pk)
#             serializer = HotelSerializer(hotel)
#             return Response(serializer.data)
#         except Hotel.DoesNotExist:
#             return Response({'error': 'Hotel not found'}, status=status.HTTP_404_NOT_FOUND)


# class OwnerProfileView(APIView):
#     def get(self, request, pk):
#         try:
#             hotel = Hotel.objects.get(pk=pk)
#             serializer = HotelSerializer(hotel)
#             owner_data = {
#                 "id": serializer.data["id"],
#                 "owner": serializer.data["owner"],
#                 "owner_contact": serializer.data.get("owner_contact"),
#                 "age": serializer.data.get("age"),
#                 "citizenship": serializer.data.get("citizenship"),
#                 "permanent_address": serializer.data.get("permanent_address"),
#                 "email": serializer.data["email"],
#             }
#             return Response(owner_data, status=status.HTTP_200_OK)
#         except Hotel.DoesNotExist:
#             return Response({"error": "Owner profile not found"}, status=status.HTTP_404_NOT_FOUND)



# # COMMISSION RULES API
# # Inherits from APIView, which is the lowest-level DRF class.
# #We can also use APIView to combine both model for get from both and post to both 
# class CommissionRuleView(APIView):
#     """
#     GET: Fetch all commission rules
#     POST: Save/update commission rules
#     """

#     def get(self, request):
#         rules = CommissionRule.objects.all()
#         serializer = CommissionRuleSerializer(rules, many=True)
#         return Response(serializer.data, status=status.HTTP_200_OK)

#     def post(self, request):
#         # Expecting a list of rules from frontend
#         rules_data = request.data
#         if not isinstance(rules_data, list):
#             return Response({'error': 'Expected a list of rules'}, status=status.HTTP_400_BAD_REQUEST)

#         for rule_data in rules_data:
#             CommissionRule.objects.update_or_create(
#                 rule_id=rule_data.get('id'),
#                 defaults={
#                     'name': rule_data.get('name'),
#                     'description': rule_data.get('desc'),
#                     'effective_date': rule_data.get('date'),
#                 }
#             )

#         return Response({'message': 'Rules saved to DB'}, status=status.HTTP_200_OK)



# # COMMISSION PAYMENTS API view
# #Inherits from ListCreateAPIView, which is a generic view built on top of APIView.
# #We cannot add querybased class based view   if we have two models SendOwnerAnnouncement and SendManager Announcement for get and post but its all right here
# class CommissionPaymentView(generics.ListCreateAPIView):
#      """ 
#      General API for Commission Payments 
#      GET: List all commission payments 
#      POST: Create a new commission payment 
#      """ 
#      queryset = CommissionPayment.objects.all().order_by('-created_at') 
#      serializer_class = CommissionPaymentSerializer

# @api_view(['GET'])
# def get_active_hotels(request):
#     """
#     Fetch active hotels with PID-<id>, hotel name, and amount logic.
#     """
#     hotels = Hotel.objects.filter(status="Active").order_by('id')
#     today = date.today()
#     data = []

#     for hotel in hotels:
#         # Calculate months active
#         months_active = (today.year - hotel.registered_on.year) * 12 + (today.month - hotel.registered_on.month)
#         amount = 'NPR 5,000' if months_active >= 12 else 'NPR 8,000'

#         data.append({
#             'id': f'PID-{hotel.id}',
#             'hotel': hotel.name,
#             'amount': amount,
#             'status': 'Pending'
#         })

#     return Response(data, status=status.HTTP_200_OK)

# @api_view(['POST'])
# def confirm_payments(request):
#     payments = request.data
#     already_full = []

#     for item in payments:
#         hotel_id = int(item['id'].replace('PID-', ''))
#         start_due_date = item['start_due_date']
#         amount = item['amount']
#         payment_status = item.get('status', 'Pending')

#         # Count existing records for this hotel/month
#         existing_count = CommissionPayment.objects.filter(
#             hotel_id=hotel_id,
#             start_due_date=start_due_date
#         ).count()

#         if existing_count >= 2:
#             # Already has 2 → skip
#             already_full.append(item['hotel'])
#         elif existing_count == 1:
#             # Has 1 → create 1 more, ID like 32.2
#             CommissionPayment.objects.create(
#                 hotel_id=hotel_id,
#                 payment_id=f"{hotel_id}.2",
#                 amount=amount,
#                 status=payment_status,
#                 start_due_date=start_due_date
#             )
#         elif existing_count == 0:
#             # Has none → create 1, ID like 32.1
#             CommissionPayment.objects.create(
#                 hotel_id=hotel_id,
#                 payment_id=f"{hotel_id}.1",
#                 amount=amount,
#                 status=payment_status,
#                 start_due_date=start_due_date
#             )

#     return Response({
#         'message': 'Commission payment data saved in database.',
#         'already_full': already_full
#     }, status=status.HTTP_200_OK)






# # COMMISSION REVENUE API 
# #This is function based view
# @api_view(['GET'])
# def track_commission_revenue(request):
#     """
#     Fetch all commission payments for the given month/year.
#     """
#     month = request.GET.get('month')
#     year = request.GET.get('year')

#     if not month or not year:
#         return Response({'error': 'Month and year are required'}, status=status.HTTP_400_BAD_REQUEST)

#     prefix = f"{year}-{month}"  # expects month in MM format

#     # Fetch all payments for the month/year, both statuses
#     payments = CommissionPayment.objects.filter(
#         start_due_date__startswith=prefix,
#         status__in=['Paid', 'Pending']
#     ).order_by('hotel_id', 'created_at') #we can show data in ascending or descending order by created_at

#     # return everything
#     serializer = CommissionRevenueSerializer(payments, many=True)
#     return Response(serializer.data, status=status.HTTP_200_OK)







# # ANNOUNCEMENT API 
# #We cannot add querybased class based view   if we have two models SendOwnerAnnouncement and SendManager Announcement
# #We can use APIView to combine both model for get from both and post to both 
# #But lets use function based its easier
# @api_view(['POST'])
# def send_announcement(request):
#     message = request.data.get('message')
#     send_to_owner = request.data.get('sendToOwner')
#     send_to_receptionist = request.data.get('sendToReceptionist')

#     # Validation: must have a message and at least one recipient
#     if not message or not (send_to_owner or send_to_receptionist):
#         return Response({'error': 'Message and at least one recipient required.'},
#                         status=status.HTTP_400_BAD_REQUEST)

#     saved = {}

#     # Save to owner table if checkbox is true
#     if send_to_owner:
#         owner_announcement = SendOwnerAnnouncement.objects.create(message=message)
#         saved['owner'] = SendOwnerAnnouncementSerializer(owner_announcement).data

#     # Save to manager table if checkbox is true
#     if send_to_receptionist:
#         receptionist_announcement = SendReceptionistAnnouncement.objects.create(message=message)
#         saved['receptionist'] = SendReceptionistAnnouncementSerializer(receptionist_announcement).data

#     return Response({'success': True, 'saved': saved}, status=status.HTTP_200_OK)



# @api_view(['GET'])
# def recent_announcements(request):
#     owner = SendOwnerAnnouncement.objects.order_by('-created_at')[:5]
#     receptionist = SendReceptionistAnnouncement.objects.order_by('-created_at')[:5]

#     combined = []
#     for ann in owner:
#         combined.append({
#             "id": ann.id,
#             "content": ann.message,
#             "recipients": ["owner"],
#             "timestamp": ann.created_at
#         })
#     for ann in receptionist:
#         combined.append({
#             "id": ann.id,
#             "content": ann.message,
#             "recipients": ["receptionist"],
#             "timestamp": ann.created_at
#         })

#     combined.sort(key=lambda x: x['timestamp'], reverse=True)
#     return Response(combined)



# # POST: Owner sends announcement
# @api_view(['POST'])
# def owner_send_announcement(request):
#     message = request.data.get('message')
#     send_to_admin = request.data.get('sendToAdmin')
#     send_to_receptionist = request.data.get('sendToReceptionist')

#     if not message or not (send_to_admin or send_to_receptionist):
#         return Response({'error': 'Message and at least one recipient required.'},
#                         status=status.HTTP_400_BAD_REQUEST)

#     saved = {}

#     # Save to Admin table if checkbox is true
#     if send_to_admin:
#         admin_announcement = SendAdminAnnouncement.objects.create(
#             hotel=getattr(request.user, "hotel", None),
#             message=message
#         )
#         saved['admin'] = {
#             "id": admin_announcement.id,
#             "message": admin_announcement.message,
#             "hotel_name": admin_announcement.hotel.name if admin_announcement.hotel else None,
#             "created_at": admin_announcement.created_at
#         }

#     # Save to Receptionist table if checkbox is true
#     if send_to_receptionist:
#         receptionist_announcement = SendReceptionistAnnouncement.objects.create(
#             hotel=getattr(request.user, "hotel", None),
#             message=message
#         )
#         saved['receptionist'] = {
#             "id": receptionist_announcement.id,
#             "message": receptionist_announcement.message,
#             "hotel_name": receptionist_announcement.hotel.name if receptionist_announcement.hotel else None,
#             "created_at": receptionist_announcement.created_at
#         }

#     return Response({'success': True, 'saved': saved}, status=status.HTTP_200_OK)


# @api_view(['GET'])
# def owner_recent_announcements(request):
#     combined = []

#     # Admin announcements
#     admin = SendAdminAnnouncement.objects.order_by('-created_at')[:5]
#     for ann in admin:
#         combined.append({
#             "id": ann.id,
#             "content": ann.message,
#             "recipients": ["admin"],
#             "hotel_name": ann.hotel.name if ann.hotel else None,
#             "timestamp": ann.created_at
#         })

#     # Receptionist announcements
#     receptionist = SendReceptionistAnnouncement.objects.order_by('-created_at')[:5]
#     for ann in receptionist:
#         combined.append({
#             "id": ann.id,
#             "content": ann.message,
#             "recipients": ["receptionist"],
#             "hotel_name": ann.hotel.name if ann.hotel else None,
#             "timestamp": ann.created_at
#         })

#     combined.sort(key=lambda x: x['timestamp'], reverse=True)
#     return Response(combined)




# # class OwnerLoginView(APIView):
# #     def post(self, request):
# #         serializer = OwnerLoginSerializer(data=request.data)
# #         if serializer.is_valid():
# #             user = serializer.validated_data['user']
# #             login(request, user)  # optional if you want session login too

# #             # Generate JWT tokens
# #             refresh = RefreshToken.for_user(user)
# #             access = str(refresh.access_token)

# #             # Get hotel linked to this user
# #             hotel_id = None
# #             try:
# #                 if hasattr(user, "hotel") and user.hotel is not None:
# #                     hotel_id = user.hotel.id
# #             except Hotel.DoesNotExist:
# #                 hotel_id = None

# #             return Response({
# #                 "message": "Login successful",
# #                 "username": user.username,
# #                 "email": user.email,
# #                 "hotel_id": hotel_id,
# #                 "access": access,
# #                 "refresh": str(refresh),
# #             }, status=status.HTTP_200_OK)

# #         return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)





# # List all starred notifications 
# class OwnerStarredNotificationList(generics.ListAPIView):
#     serializer_class = OwnerStarredNotificationSerializer
    

#     def get_queryset(self):
#          return OwnerStarredNotification.objects.all()

# # Star a new notification
# class OwnerStarredNotificationCreate(generics.CreateAPIView):
#     serializer_class = OwnerStarredNotificationSerializer
   

#     def perform_create(self, serializer):
#         serializer.save()


# # Unstar a notification (global, no user required)
# class OwnerStarredNotificationDelete(generics.DestroyAPIView):

#     def delete(self, request, pk):
#         try:
#             # just delete by announcement_id, no user filter
#             starred = OwnerStarredNotification.objects.get(announcement_id=pk)
#             starred.delete()
#             return Response(status=status.HTTP_204_NO_CONTENT)
#         except OwnerStarredNotification.DoesNotExist:
#             return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)



# class RoomInventoryView(APIView):
#     permission_classes = [IsAuthenticated]

#     def get(self, request):
#         hotel = request.user.hotel  # hotel linked to logged-in user
#         inventory, _ = RoomInventory.objects.get_or_create(hotel=hotel)
#         serializer = RoomInventorySerializer(inventory)
#         return Response(serializer.data)

#     def put(self, request):
#         hotel = request.user.hotel
#         inventory, _ = RoomInventory.objects.get_or_create(hotel=hotel)
#         serializer = RoomInventorySerializer(inventory, data=request.data, partial=True)
#         if serializer.is_valid():
#             serializer.save()
#             return Response(serializer.data)
#         return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# class RoomPriceView(APIView):
#     permission_classes = [IsAuthenticated]

#     def get(self, request):
#         hotel = request.user.hotel
#         prices, _ = RoomPrice.objects.get_or_create(hotel=hotel)
#         serializer = RoomPriceSerializer(prices)
#         return Response(serializer.data)

#     def put(self, request):
#         hotel = request.user.hotel
#         prices, _ = RoomPrice.objects.get_or_create(hotel=hotel)
#         serializer = RoomPriceSerializer(prices, data=request.data, partial=True)
#         if serializer.is_valid():
#             serializer.save()
#             return Response(serializer.data)
#         return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# # Receptionist: create new requests, list all
# class ManageMaintenanceRequestListCreateView(generics.ListCreateAPIView):
#     queryset = ManageMaintenanceRequest.objects.all()
#     serializer_class = ManageMaintenanceRequestSerializer

# # Owner: view details, update status,Delete if needed
# class ManageMaintenanceRequestDetailView(generics.RetrieveUpdateDestroyAPIView):
#     queryset = ManageMaintenanceRequest.objects.all()
#     serializer_class = ManageMaintenanceRequestSerializer


# # List and Create promotions for the logged-in hotel
# from rest_framework import generics
# from .models import Promotion
# from .serializers import PromotionSerializer

# class PromotionListCreateView(generics.ListCreateAPIView):
#     serializer_class = PromotionSerializer

#     def get_queryset(self):
#         # Only promotions for the logged-in user's hotel
#         return Promotion.objects.filter(hotel=self.request.user.hotel)

#     def perform_create(self, serializer):
#         serializer.save(hotel=self.request.user.hotel)


# # Retrieve, Update, Delete a single promotion for the logged-in hotel
# class PromotionDetailView(generics.RetrieveUpdateDestroyAPIView):
#     serializer_class = PromotionSerializer

#     def get_queryset(self):
#         return Promotion.objects.filter(hotel=self.request.user.hotel)



# class CommissionReportListCreateView(generics.ListCreateAPIView):
#     serializer_class = CommissionReportSerializer
#     permission_classes = [permissions.IsAuthenticated]

#     def get_queryset(self):
#         user = self.request.user
#         if not hasattr(user, "hotel") or user.hotel is None:
#             return CommissionReport.objects.none()
#         return CommissionReport.objects.filter(hotel=user.hotel)

#     def perform_create(self, serializer):
#         user = self.request.user
#         if not hasattr(user, "hotel") or user.hotel is None:
#             raise PermissionDenied("User is not linked to a hotel.")
#         serializer.save(hotel=user.hotel)





# class ManageBookingsViewSet(viewsets.ModelViewSet):
#     queryset = ManageBookings.objects.all()
#     serializer_class = ManageBookingsSerializer

#     def perform_create(self, serializer):
#         serializer.save(status="Booked")

#     def perform_destroy(self, instance):
#         instance.status = "Available"
#         instance.save()
#         instance.delete()

#     def list(self, request, *args, **kwargs):
#         now = timezone.now()
#         for booking in self.queryset:
#             if booking.checkout and now > booking.checkout:
#                 booking.status = "Available"
#                 booking.save()
#         return super().list(request, *args, **kwargs)

#     def retrieve(self, request, *args, **kwargs):
#         booking = self.get_object()
#         now = timezone.now()
#         if booking.checkout and now > booking.checkout:
#             booking.status = "Available"
#             booking.save()
#         return super().retrieve(request, *args, **kwargs)

#     #  Custom action: get payments for a booking
#     @action(detail=True, methods=["get"])
#     def payments(self, request, pk=None):
#         booking = get_object_or_404(ManageBookings, pk=pk)
#         payments = ManagePayments.objects.filter(booking=booking)
#         serializer = ManagePaymentsSerializer(payments, many=True)
#         return Response(serializer.data)



# class ManagePaymentsViewSet(viewsets.ModelViewSet):
#     queryset = ManagePayments.objects.all()
#     serializer_class = ManagePaymentsSerializer







































# # #There are three types of views like classbased ApiView, generics.ListCreateAPIView and Function based view
# # import random, secrets, string
# # from django.core.mail import send_mail
# # from django.conf import settings
# # from django.contrib.auth import authenticate, login
# # from django.contrib.auth.models import User
# # from rest_framework.views import APIView
# # from rest_framework import viewsets
# # from django.utils import timezone
# # from rest_framework.response import Response
# # from rest_framework import status, generics, permissions
# # from rest_framework.exceptions import PermissionDenied
# # from rest_framework.generics import ListAPIView, UpdateAPIView
# # from rest_framework.viewsets import ModelViewSet 
# # from rest_framework.decorators import action
# # from datetime import date
# # from .models import Hotel, CommissionRule, CommissionPayment
# # from .models import SendAdminAnnouncement, SendOwnerAnnouncement, SendReceptionistAnnouncement
# # from .models import OwnerStarredNotification, CommissionReport
# # from .models import RoomInventory, RoomPrice, ManageMaintenanceRequest, Receptionist, Promotion, ManageBookings, Staff, Attendance
# # from .models import ManagePayments
# # from rest_framework.permissions import IsAuthenticated
# # from django.contrib.auth.hashers import make_password
# # from django.contrib.auth import get_user_model
# # from rest_framework.decorators import api_view, permission_classes
# # from django.shortcuts import get_object_or_404

# # # from rest_framework_simplejwt.tokens import RefreshToken
# # import uuid
# # from .serializers import (
# #     AdminLoginSerializer,
# #     OTPRequestSerializer,
# #     OTPVerifySerializer,
# #     HotelSerializer,
# #     HotelRegisterSerializer,
# #     CommissionRuleSerializer,
# #     CommissionPaymentSerializer,
# #     CommissionRevenueSerializer,
# #     #SendAdminAnnouncementSerializer,
# #     SendOwnerAnnouncementSerializer,
# #     SendReceptionistAnnouncementSerializer,

# #     OwnerStarredNotificationSerializer,
# #     # OwnerLoginSerializer,
# #     RoomInventorySerializer,
# #     RoomPriceSerializer,
# #     ManageMaintenanceRequestSerializer,
# #     ReceptionistSerializer,
# #     PromotionSerializer,
# #     CommissionReportSerializer,
# #     ReceptionistRegisterSerializer,   
# #     ManageBookingsSerializer,
# #     StaffSerializer,AttendanceSerializer,
# #     ManagePaymentsSerializer,

# # )



# # User = get_user_model()

# # # Utility
# # def generate_password(length=8):
# #     return ''.join(random.choices(string.ascii_letters + string.digits, k=length))




# # # Receptionist Register View
# # @api_view(["POST"])
# # @permission_classes([permissions.IsAuthenticated])
# # def register_receptionist(request):
# #     data = request.data.copy()
# #     data["role"] = "Receptionist"   #  force role

# #     serializer = ReceptionistRegisterSerializer(data=data)
# #     if serializer.is_valid():
# #         email = serializer.validated_data["email"]
# #         # Generate unique username with only 3 letters
# #         username = f"{email}_{uuid.uuid4().hex[:3]}"   #  only 3 chars
# #         password = generate_password()

# #         user = User.objects.create(
# #             username=username,
# #             email=email,
# #             password=make_password(password)
# #         )

# #         hotel = getattr(request.user, "hotel", None)
# #         if not hotel:
# #             return Response({"error": "No hotel linked to this account"}, status=status.HTTP_400_BAD_REQUEST)

# #         receptionist = serializer.save(user=user, hotel=hotel, role="Receptionist")

# #         send_mail(
# #             subject=f"Receptionist Account Created for {hotel.name}",
# #             message=f"Dear {receptionist.name},\n\nYour account for {hotel.name} has been created.\nUsername: {username}\nPassword: {password}",
# #             from_email="admin@cloudinn.com",
# #             recipient_list=[email],
# #         )

# #         return Response({
# #             "message": f"Receptionist registered for {hotel.name} and credentials sent.",
# #             "hotel_id": hotel.id
# #         }, status=status.HTTP_201_CREATED)

# #     print(serializer.errors)
# #     return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)





# # # Receptionist  Details View in Receptionist Dashboard
# # @api_view(["GET"])
# # @permission_classes([permissions.IsAuthenticated])
# # def get_hotel_receptionist(request):
# #     hotel = getattr(request.user, "hotel", None)
# #     if not hotel:
# #         return Response({"error": "No hotel linked to this account"}, status=400)

# #     receptionists = Receptionist.objects.filter(hotel=hotel)
# #     serializer = ReceptionistSerializer(receptionists, many=True)
# #     return Response(serializer.data)




# # #Get Receptionist Details in managestaff and attendance in owner dashboard
# # @api_view(["GET"])
# # @permission_classes([IsAuthenticated])
# # def get_hotel_receptionist_info(request):
# #     try:
# #         hotel = request.user.hotel   # Owner’s hotel relation
# #     except Exception:
# #         return Response({"error": "No hotel linked to this account"}, status=400)

# #     receptionists = hotel.receptionists.all()
# #     serializer = ReceptionistSerializer(receptionists, many=True)

# #     return Response({
# #         "hotel_id": hotel.id,
# #         "hotel_name": hotel.name,
# #         "receptionists": serializer.data
# #     })



# # #Staff Viewsets
# # @api_view(["GET"])
# # @permission_classes([IsAuthenticated])
# # def get_hotel_staff_info(request):
# #     hotel = getattr(request.user, "hotel", None)
# #     if not hotel:
# #         return Response({"error": "No hotel linked to user"}, status=status.HTTP_400_BAD_REQUEST)

# #     staff = Staff.objects.filter(hotel=hotel)
# #     serializer = StaffSerializer(staff, many=True)
# #     return Response({
# #         "hotel_id": hotel.id,
# #         "hotel_name": hotel.name,
# #         "staff": serializer.data
# #     })

# # @api_view(["POST"])
# # @permission_classes([IsAuthenticated])
# # def add_staff(request):
# #     hotel = getattr(request.user, "hotel", None)
# #     if not hotel:
# #         return Response({"error": "No hotel linked to user"}, status=status.HTTP_400_BAD_REQUEST)

# #     data = request.data.copy()
# #     data["hotel"] = hotel.id
# #     serializer = StaffSerializer(data=data)
# #     if serializer.is_valid():
# #         serializer.save()
# #         return Response(serializer.data, status=status.HTTP_201_CREATED)
# #     return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# # @api_view(["DELETE"])
# # @permission_classes([IsAuthenticated])
# # def delete_staff(request, pk):
# #     """
# #     Delete a staff record by ID.
# #     """
# #     try:
# #         staff = Staff.objects.get(pk=pk)
# #         staff.delete()
# #         return Response({"message": "Staff record deleted successfully"}, status=status.HTTP_204_NO_CONTENT)
# #     except Staff.DoesNotExist:
# #         return Response({"error": "Staff not found"}, status=status.HTTP_404_NOT_FOUND)


# # # attendance/views.py
# # # views.py
# # class AttendanceViewSet(viewsets.ModelViewSet):
# #     queryset = Attendance.objects.all()
# #     serializer_class = AttendanceSerializer
# #     permission_classes = [IsAuthenticated]

# #     # Existing staff history
# #     @action(detail=False, methods=["get"])
# #     def staff_history(self, request):
# #         staff_id = request.query_params.get("staff_id")
# #         if not staff_id:
# #             return Response({"error": "staff_id is required"}, status=400)

# #         records = Attendance.objects.filter(staff_id=staff_id).order_by("-date")
# #         serializer = AttendanceSerializer(records, many=True)
# #         return Response(serializer.data)

# #     #  New receptionist history
# #     @action(detail=False, methods=["get"])
# #     def receptionist_history(self, request):
# #         receptionist_id = request.query_params.get("receptionist_id")
# #         if not receptionist_id:
# #             return Response({"error": "receptionist_id is required"}, status=400)

# #         records = Attendance.objects.filter(receptionist_id=receptionist_id).order_by("-date")
# #         serializer = AttendanceSerializer(records, many=True)
# #         return Response(serializer.data)


# #     # POST mark attendance for a staff (ensures one record per day)
# #     @action(detail=False, methods=["post"])
# #     def mark(self, request):
# #         staff_id = request.data.get("staff_id")
# #         receptionist_id = request.data.get("receptionist_id")
# #         status = request.data.get("status")

# #         if not status or (not staff_id and not receptionist_id):
# #             return Response({"error": "Provide staff_id or receptionist_id and status"}, status=400)

# #         today = date.today()

# #         if staff_id:
# #             updated = Attendance.objects.filter(staff_id=staff_id, date=today).update(status=status)
# #             if updated == 0:
# #                 record = Attendance.objects.create(staff_id=staff_id, status=status, date=today)
# #             else:
# #                 record = Attendance.objects.filter(staff_id=staff_id, date=today).latest("id")

# #         elif receptionist_id:
# #             updated = Attendance.objects.filter(receptionist_id=receptionist_id, date=today).update(status=status)
# #             if updated == 0:
# #                 record = Attendance.objects.create(receptionist_id=receptionist_id, status=status, date=today)
# #             else:
# #                 record = Attendance.objects.filter(receptionist_id=receptionist_id, date=today).latest("id")

# #         serializer = AttendanceSerializer(record)
# #         return Response(serializer.data, status=201)
    


# #     @action(detail=True, methods=["patch"])
# #     def status(self, request, pk=None):
# #         attendance = self.get_object()
# #         new_status = request.data.get("status")

# #         if new_status not in ["Active", "Inactive"]:
# #             return Response({"error": "Invalid status"}, status=400)

# #         if attendance.staff:
# #             attendance.staff.status = new_status
# #             attendance.staff.save()
# #             return Response({"status": attendance.staff.status})

# #         elif attendance.receptionist:
# #             attendance.receptionist.status = new_status
# #             attendance.receptionist.save()
# #             return Response({"status": attendance.receptionist.status})

# #         return Response({"error": "No staff or receptionist linked"}, status=400)


# #     # NEW: Monthly attendance filter
# #     @action(detail=False, methods=["get"])
# #     def monthly(self, request):
# #         person_id = request.query_params.get("person_id")
# #         year = request.query_params.get("year")
# #         month = request.query_params.get("month")

# #         if not person_id or not year or not month:
# #             return Response({"error": "person_id, year and month are required"}, status=400)

# #         try:
# #             year = int(year)
# #             month = int(month)
# #         except ValueError:
# #             return Response({"error": "year and month must be integers"}, status=400)

# #         # Filter by either staff_id or receptionist_id
# #         records = Attendance.objects.filter(
# #             date__year=year,
# #             date__month=month
# #         ).filter(
# #             staff_id=person_id
# #         ) | Attendance.objects.filter(
# #             date__year=year,
# #             date__month=month
# #         ).filter(
# #             receptionist_id=person_id
# #         )

# #         serializer = AttendanceSerializer(records.order_by("date"), many=True)
# #         return Response(serializer.data)




# # # HOTEL VIEWSET
# # class HotelViewSet(ModelViewSet):
# #      queryset = Hotel.objects.all() 
# #      serializer_class = HotelSerializer


# # # AUTHENTICATION + OTP VIEWS
# # User = get_user_model()

# # class AdminLoginView(APIView):
# #     def post(self, request):
# #         email = request.data.get("email")
# #         password = request.data.get("password")

# #         # Find all users with this email
# #         users = User.objects.filter(email=email)
# #         if not users.exists():
# #             return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

# #         # Pick the first match (graceful handling of duplicates)
# #         user = users.first()

# #         # Authenticate using username (default Django backend)
# #         user = authenticate(request, username=user.username, password=password)

# #         if user is not None and user.is_staff:
# #             login(request, user)  # session cookie set
# #             return Response({'message': 'Login successful'}, status=status.HTTP_200_OK)

# #         return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)




# # # Step 2: Forgot password → send OTP
# # class OTPRequestView(APIView):
# #     def post(self, request):
# #         serializer = OTPRequestSerializer(data=request.data)
# #         serializer.is_valid(raise_exception=True)

# #         email = serializer.validated_data['email']
# #         try:
# #             user = User.objects.get(email=email)
# #         except User.DoesNotExist:
# #             return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

# #         otp = random.randint(100000, 999999)
# #         request.session['otp'] = str(otp)
# #         request.session['reset_user'] = user.id

# #         send_mail(
# #             'Your OTP Code',
# #             f'Your OTP is {otp}',
# #             settings.DEFAULT_FROM_EMAIL,
# #             [user.email],
# #         )

# #         return Response({'message': 'OTP generated and sent'}, status=status.HTTP_200_OK)


# # # Step 3: Verify OTP → login
# # class OTPVerifyView(APIView):
# #     def post(self, request):
# #         serializer = OTPVerifySerializer(data=request.data)
# #         serializer.is_valid(raise_exception=True)

# #         otp_entered = serializer.validated_data['otp']

# #         if str(request.session.get('otp')) == str(otp_entered):
# #             user_id = request.session.get('reset_user')
# #             try:
# #                 user = User.objects.get(id=user_id)
# #             except User.DoesNotExist:
# #                 return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

# #             # Clear session
# #             request.session.pop('otp', None)
# #             request.session.pop('reset_user', None)

# #             login(request, user)
# #             return Response({'message': 'Login successful via OTP'}, status=status.HTTP_200_OK)

# #         return Response({'error': 'Invalid OTP'}, status=status.HTTP_400_BAD_REQUEST)



# # # HOTEL MANAGEMENT  Register VIEW
# # def generate_password(length=8):
# #     alphabet = string.ascii_letters + string.digits
# #     return ''.join(secrets.choice(alphabet) for _ in range(length))


# # class RegisterHotelView(APIView):
# #     def post(self, request):
# #         serializer = HotelRegisterSerializer(data=request.data)
# #         if not serializer.is_valid():
# #             return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# #         data = serializer.validated_data
# #         password = generate_password()
# #         username = data["email"].split("@")[0] + secrets.token_hex(2)

# #         user = User.objects.create_user(username=username, email=data["email"], password=password)

# #         hotel = Hotel.objects.create(
# #             name=data["name"],
# #             owner=data["owner"],
# #             contact=data["contact"],
# #             email=data["email"],
# #             location=data["location"],
# #             pan=data["pan"],
# #             age=request.data.get("age"),
# #             owner_contact=request.data.get("owner_contact"),
# #             citizenship=request.data.get("citizenship"),
# #             permanent_address=request.data.get("permanent_address"),
# #             user=user
# #         )


# #         # Send credentials via email
# #         subject = "Hotel Registration Credentials"
# #         message = f"""
# #         Dear {data['owner']},

# #         Your hotel '{data['name']}' has been registered successfully.

# #         Login credentials:
# #         Username: {username}
# #         Password: {password}

# #         Regards,
# #         CloudInn Platform
# #         """
# #         send_mail(subject, message, "please-reply@cloudinn.com", [data["email"]], fail_silently=False)

# #         return Response({"message": "Hotel registered successfully", "hotel": HotelSerializer(hotel).data, "owner_user": user.username}, status=201)
    


# # #REceptionist Register View
# # def generate_password(length=8):
# #     return ''.join(random.choices(string.ascii_letters + string.digits, k=length))

# # @api_view(["POST"])
# # @permission_classes([permissions.IsAuthenticated])
# # def register_receptionist(request):
# #     serializer = ReceptionistRegisterSerializer(data=request.data)
# #     if serializer.is_valid():
# #         email = serializer.validated_data["email"]
# #         #  Generate unique username even if email is duplicate
# #         username = f"{email}_{uuid.uuid4().hex[:6]}"
# #         password = generate_password()

# #         user = User.objects.create(
# #             username=username,
# #             email=email,
# #             password=make_password(password)
# #         )

# #         hotel = getattr(request.user, "hotel", None)
# #         if not hotel:
# #             return Response({"error": "No hotel linked to this account"}, status=status.HTTP_400_BAD_REQUEST)

# #         receptionist = serializer.save(user=user, hotel=hotel)

# #         send_mail(
# #             subject=f"Receptionist Account Created for {hotel.name}",
# #             message=f"Dear {receptionist.name},\n\nYour account for {hotel.name} has been created.\nUsername: {username}\nPassword: {password}",
# #             from_email="admin@cloudinn.com",
# #             recipient_list=[email],
# #         )

# #         return Response({
# #             "message": f"Receptionist registered for {hotel.name} and credentials sent.",
# #             "hotel_id": hotel.id
# #         }, status=status.HTTP_201_CREATED)

# #     return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# # # Receptionist in Receptionist Dashboard
# # @api_view(["GET"])
# # @permission_classes([IsAuthenticated])
# # def get_hotel_receptionist(request):
# #     try:
# #         # receptionist is linked to the logged-in user
# #         receptionist = request.user.receptionist
# #         hotel = receptionist.hotel
# #     except Exception:
# #         return Response({"error": "No hotel linked to this account"}, status=400)

# #     # Fetch receptionists belonging to that hotel
# #     receptionists = Receptionist.objects.filter(hotel=hotel)
# #     serializer = ReceptionistSerializer(receptionists, many=True)

# #     return Response({
# #         "hotel_id": hotel.id,
# #         "hotel_name": hotel.name,
# #         "receptionists": serializer.data
# #     })


# # #Receptionist in Owner Dashboard
# # @api_view(["GET"])
# # @permission_classes([IsAuthenticated])
# # def get_hotel_receptionist_info(request):
# #     try:
# #         # owner is linked to the logged-in user via hotel relation
# #         hotel = request.user.hotel
# #     except Exception:
# #         return Response({"error": "No hotel linked to this account"}, status=400)

# #     # Fetch receptionists belonging to that hotel
# #     receptionists = hotel.receptionists.all()
# #     serializer = ReceptionistSerializer(receptionists, many=True)

# #     return Response({
# #         "hotel_id": hotel.id,
# #         "hotel_name": hotel.name,
# #         "receptionists": serializer.data
# #     })





# # class ListHotelsView(ListAPIView):
# #     serializer_class = HotelSerializer

# #     def get_queryset(self):
# #         status_filter = self.request.query_params.get('status')
# #         if status_filter in ["Active", "Inactive"]:
# #             return Hotel.objects.filter(status=status_filter)
# #         return Hotel.objects.all()


# # class ActivateHotelView(APIView):
# #     def patch(self, request, pk):
# #         try:
# #             hotel = Hotel.objects.get(pk=pk)
# #         except Hotel.DoesNotExist:
# #             return Response({"error": "Hotel not found"}, status=status.HTTP_404_NOT_FOUND)

# #         hotel.status = "Active"
# #         hotel.save()
# #         return Response({"message": "Hotel activated successfully", "hotel": HotelSerializer(hotel).data})


# # class DeactivateHotelView(APIView):
# #     def patch(self, request, pk):
# #         try:
# #             hotel = Hotel.objects.get(pk=pk)
# #         except Hotel.DoesNotExist:
# #             return Response({"error": "Hotel not found"}, status=status.HTTP_404_NOT_FOUND)

# #         hotel.status = "Inactive"
# #         hotel.save()
# #         return Response({"message": "Hotel deactivated successfully", "hotel": HotelSerializer(hotel).data})


# # class HotelUpdateView(UpdateAPIView):
# #     queryset = Hotel.objects.all()
# #     serializer_class = HotelSerializer


# # class DeleteHotelView(APIView):
# #     def delete(self, request, pk):
# #         try:
# #             hotel = Hotel.objects.get(pk=pk)
# #             hotel.delete()
# #             return Response({"message": "Hotel deleted successfully"}, status=status.HTTP_204_NO_CONTENT)
# #         except Hotel.DoesNotExist:
# #             return Response({"error": "Hotel not found"}, status=status.HTTP_404_NOT_FOUND)
        

# # # contains hotel_id and hotel_name
# # @api_view(['GET'])
# # @permission_classes([IsAuthenticated])
# # def me(request):
# #     user = request.user
# #     hotel = getattr(user, "hotel", None)
# #     return Response({
# #         "user_id": user.id,
# #         "hotel_id": hotel.id if hotel else None,
# #         "hotel_name": hotel.name if hotel else None,
# #     })



# # class HotelProfileView(APIView):
# #     def get(self, request, pk):
# #         try:
# #             hotel = Hotel.objects.get(pk=pk)
# #             serializer = HotelSerializer(hotel)
# #             return Response(serializer.data)
# #         except Hotel.DoesNotExist:
# #             return Response({'error': 'Hotel not found'}, status=status.HTTP_404_NOT_FOUND)


# # class OwnerProfileView(APIView):
# #     def get(self, request, pk):
# #         try:
# #             hotel = Hotel.objects.get(pk=pk)
# #             serializer = HotelSerializer(hotel)
# #             owner_data = {
# #                 "id": serializer.data["id"],
# #                 "owner": serializer.data["owner"],
# #                 "owner_contact": serializer.data.get("owner_contact"),
# #                 "age": serializer.data.get("age"),
# #                 "citizenship": serializer.data.get("citizenship"),
# #                 "permanent_address": serializer.data.get("permanent_address"),
# #                 "email": serializer.data["email"],
# #             }
# #             return Response(owner_data, status=status.HTTP_200_OK)
# #         except Hotel.DoesNotExist:
# #             return Response({"error": "Owner profile not found"}, status=status.HTTP_404_NOT_FOUND)



# # # COMMISSION RULES API
# # # Inherits from APIView, which is the lowest-level DRF class.
# # #We can also use APIView to combine both model for get from both and post to both 
# # class CommissionRuleView(APIView):
# #     """
# #     GET: Fetch all commission rules
# #     POST: Save/update commission rules
# #     """

# #     def get(self, request):
# #         rules = CommissionRule.objects.all()
# #         serializer = CommissionRuleSerializer(rules, many=True)
# #         return Response(serializer.data, status=status.HTTP_200_OK)

# #     def post(self, request):
# #         # Expecting a list of rules from frontend
# #         rules_data = request.data
# #         if not isinstance(rules_data, list):
# #             return Response({'error': 'Expected a list of rules'}, status=status.HTTP_400_BAD_REQUEST)

# #         for rule_data in rules_data:
# #             CommissionRule.objects.update_or_create(
# #                 rule_id=rule_data.get('id'),
# #                 defaults={
# #                     'name': rule_data.get('name'),
# #                     'description': rule_data.get('desc'),
# #                     'effective_date': rule_data.get('date'),
# #                 }
# #             )

# #         return Response({'message': 'Rules saved to DB'}, status=status.HTTP_200_OK)



# # # COMMISSION PAYMENTS API view
# # #Inherits from ListCreateAPIView, which is a generic view built on top of APIView.
# # #We cannot add querybased class based view   if we have two models SendOwnerAnnouncement and SendManager Announcement for get and post but its all right here
# # class CommissionPaymentView(generics.ListCreateAPIView):
# #      """ 
# #      General API for Commission Payments 
# #      GET: List all commission payments 
# #      POST: Create a new commission payment 
# #      """ 
# #      queryset = CommissionPayment.objects.all().order_by('-created_at') 
# #      serializer_class = CommissionPaymentSerializer

# # @api_view(['GET'])
# # def get_active_hotels(request):
# #     """
# #     Fetch active hotels with PID-<id>, hotel name, and amount logic.
# #     """
# #     hotels = Hotel.objects.filter(status="Active").order_by('id')
# #     today = date.today()
# #     data = []

# #     for hotel in hotels:
# #         # Calculate months active
# #         months_active = (today.year - hotel.registered_on.year) * 12 + (today.month - hotel.registered_on.month)
# #         amount = 'NPR 5,000' if months_active >= 12 else 'NPR 8,000'

# #         data.append({
# #             'id': f'PID-{hotel.id}',
# #             'hotel': hotel.name,
# #             'amount': amount,
# #             'status': 'Pending'
# #         })

# #     return Response(data, status=status.HTTP_200_OK)

# # @api_view(['POST'])
# # def confirm_payments(request):
# #     payments = request.data
# #     already_full = []

# #     for item in payments:
# #         hotel_id = int(item['id'].replace('PID-', ''))
# #         start_due_date = item['start_due_date']
# #         amount = item['amount']
# #         payment_status = item.get('status', 'Pending')

# #         # Count existing records for this hotel/month
# #         existing_count = CommissionPayment.objects.filter(
# #             hotel_id=hotel_id,
# #             start_due_date=start_due_date
# #         ).count()

# #         if existing_count >= 2:
# #             # Already has 2 → skip
# #             already_full.append(item['hotel'])
# #         elif existing_count == 1:
# #             # Has 1 → create 1 more, ID like 32.2
# #             CommissionPayment.objects.create(
# #                 hotel_id=hotel_id,
# #                 payment_id=f"{hotel_id}.2",
# #                 amount=amount,
# #                 status=payment_status,
# #                 start_due_date=start_due_date
# #             )
# #         elif existing_count == 0:
# #             # Has none → create 1, ID like 32.1
# #             CommissionPayment.objects.create(
# #                 hotel_id=hotel_id,
# #                 payment_id=f"{hotel_id}.1",
# #                 amount=amount,
# #                 status=payment_status,
# #                 start_due_date=start_due_date
# #             )

# #     return Response({
# #         'message': 'Commission payment data saved in database.',
# #         'already_full': already_full
# #     }, status=status.HTTP_200_OK)






# # # COMMISSION REVENUE API 
# # #This is function based view
# # @api_view(['GET'])
# # def track_commission_revenue(request):
# #     """
# #     Fetch all commission payments for the given month/year.
# #     """
# #     month = request.GET.get('month')
# #     year = request.GET.get('year')

# #     if not month or not year:
# #         return Response({'error': 'Month and year are required'}, status=status.HTTP_400_BAD_REQUEST)

# #     prefix = f"{year}-{month}"  # expects month in MM format

# #     # Fetch all payments for the month/year, both statuses
# #     payments = CommissionPayment.objects.filter(
# #         start_due_date__startswith=prefix,
# #         status__in=['Paid', 'Pending']
# #     ).order_by('hotel_id', 'created_at') #we can show data in ascending or descending order by created_at

# #     # return everything
# #     serializer = CommissionRevenueSerializer(payments, many=True)
# #     return Response(serializer.data, status=status.HTTP_200_OK)







# # # ANNOUNCEMENT API 
# # #We cannot add querybased class based view   if we have two models SendOwnerAnnouncement and SendManager Announcement
# # #We can use APIView to combine both model for get from both and post to both 
# # #But lets use function based its easier
# # @api_view(['POST'])
# # def send_announcement(request):
# #     message = request.data.get('message')
# #     send_to_owner = request.data.get('sendToOwner')
# #     send_to_receptionist = request.data.get('sendToReceptionist')

# #     # Validation: must have a message and at least one recipient
# #     if not message or not (send_to_owner or send_to_receptionist):
# #         return Response({'error': 'Message and at least one recipient required.'},
# #                         status=status.HTTP_400_BAD_REQUEST)

# #     saved = {}

# #     # Save to owner table if checkbox is true
# #     if send_to_owner:
# #         owner_announcement = SendOwnerAnnouncement.objects.create(message=message)
# #         saved['owner'] = SendOwnerAnnouncementSerializer(owner_announcement).data

# #     # Save to manager table if checkbox is true
# #     if send_to_receptionist:
# #         receptionist_announcement = SendReceptionistAnnouncement.objects.create(message=message)
# #         saved['receptionist'] = SendReceptionistAnnouncementSerializer(receptionist_announcement).data

# #     return Response({'success': True, 'saved': saved}, status=status.HTTP_200_OK)



# # @api_view(['GET'])
# # def recent_announcements(request):
# #     owner = SendOwnerAnnouncement.objects.order_by('-created_at')[:5]
# #     receptionist = SendReceptionistAnnouncement.objects.order_by('-created_at')[:5]

# #     combined = []
# #     for ann in owner:
# #         combined.append({
# #             "id": ann.id,
# #             "content": ann.message,
# #             "recipients": ["owner"],
# #             "timestamp": ann.created_at
# #         })
# #     for ann in receptionist:
# #         combined.append({
# #             "id": ann.id,
# #             "content": ann.message,
# #             "recipients": ["receptionist"],
# #             "timestamp": ann.created_at
# #         })

# #     combined.sort(key=lambda x: x['timestamp'], reverse=True)
# #     return Response(combined)



# # # POST: Owner sends announcement
# # @api_view(['POST'])
# # def owner_send_announcement(request):
# #     message = request.data.get('message')
# #     send_to_admin = request.data.get('sendToAdmin')
# #     send_to_receptionist = request.data.get('sendToReceptionist')

# #     if not message or not (send_to_admin or send_to_receptionist):
# #         return Response({'error': 'Message and at least one recipient required.'},
# #                         status=status.HTTP_400_BAD_REQUEST)

# #     saved = {}

# #     # Save to Admin table if checkbox is true
# #     if send_to_admin:
# #         admin_announcement = SendAdminAnnouncement.objects.create(
# #             hotel=getattr(request.user, "hotel", None),
# #             message=message
# #         )
# #         saved['admin'] = {
# #             "id": admin_announcement.id,
# #             "message": admin_announcement.message,
# #             "hotel_name": admin_announcement.hotel.name if admin_announcement.hotel else None,
# #             "created_at": admin_announcement.created_at
# #         }

# #     # Save to Receptionist table if checkbox is true
# #     if send_to_receptionist:
# #         receptionist_announcement = SendReceptionistAnnouncement.objects.create(
# #             hotel=getattr(request.user, "hotel", None),
# #             message=message
# #         )
# #         saved['receptionist'] = {
# #             "id": receptionist_announcement.id,
# #             "message": receptionist_announcement.message,
# #             "hotel_name": receptionist_announcement.hotel.name if receptionist_announcement.hotel else None,
# #             "created_at": receptionist_announcement.created_at
# #         }

# #     return Response({'success': True, 'saved': saved}, status=status.HTTP_200_OK)


# # @api_view(['GET'])
# # def owner_recent_announcements(request):
# #     combined = []

# #     # Admin announcements
# #     admin = SendAdminAnnouncement.objects.order_by('-created_at')[:5]
# #     for ann in admin:
# #         combined.append({
# #             "id": ann.id,
# #             "content": ann.message,
# #             "recipients": ["admin"],
# #             "hotel_name": ann.hotel.name if ann.hotel else None,
# #             "timestamp": ann.created_at
# #         })

# #     # Receptionist announcements
# #     receptionist = SendReceptionistAnnouncement.objects.order_by('-created_at')[:5]
# #     for ann in receptionist:
# #         combined.append({
# #             "id": ann.id,
# #             "content": ann.message,
# #             "recipients": ["receptionist"],
# #             "hotel_name": ann.hotel.name if ann.hotel else None,
# #             "timestamp": ann.created_at
# #         })

# #     combined.sort(key=lambda x: x['timestamp'], reverse=True)
# #     return Response(combined)




# # # class OwnerLoginView(APIView):
# # #     def post(self, request):
# # #         serializer = OwnerLoginSerializer(data=request.data)
# # #         if serializer.is_valid():
# # #             user = serializer.validated_data['user']
# # #             login(request, user)  # optional if you want session login too

# # #             # Generate JWT tokens
# # #             refresh = RefreshToken.for_user(user)
# # #             access = str(refresh.access_token)

# # #             # Get hotel linked to this user
# # #             hotel_id = None
# # #             try:
# # #                 if hasattr(user, "hotel") and user.hotel is not None:
# # #                     hotel_id = user.hotel.id
# # #             except Hotel.DoesNotExist:
# # #                 hotel_id = None

# # #             return Response({
# # #                 "message": "Login successful",
# # #                 "username": user.username,
# # #                 "email": user.email,
# # #                 "hotel_id": hotel_id,
# # #                 "access": access,
# # #                 "refresh": str(refresh),
# # #             }, status=status.HTTP_200_OK)

# # #         return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)





# # # List all starred notifications 
# # class OwnerStarredNotificationList(generics.ListAPIView):
# #     serializer_class = OwnerStarredNotificationSerializer
    

# #     def get_queryset(self):
# #          return OwnerStarredNotification.objects.all()

# # # Star a new notification
# # class OwnerStarredNotificationCreate(generics.CreateAPIView):
# #     serializer_class = OwnerStarredNotificationSerializer
   

# #     def perform_create(self, serializer):
# #         serializer.save()


# # # Unstar a notification (global, no user required)
# # class OwnerStarredNotificationDelete(generics.DestroyAPIView):

# #     def delete(self, request, pk):
# #         try:
# #             # just delete by announcement_id, no user filter
# #             starred = OwnerStarredNotification.objects.get(announcement_id=pk)
# #             starred.delete()
# #             return Response(status=status.HTTP_204_NO_CONTENT)
# #         except OwnerStarredNotification.DoesNotExist:
# #             return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)



# # class RoomInventoryView(APIView):
# #     permission_classes = [IsAuthenticated]

# #     def get(self, request):
# #         hotel = request.user.hotel  # hotel linked to logged-in user
# #         inventory, _ = RoomInventory.objects.get_or_create(hotel=hotel)
# #         serializer = RoomInventorySerializer(inventory)
# #         return Response(serializer.data)

# #     def put(self, request):
# #         hotel = request.user.hotel
# #         inventory, _ = RoomInventory.objects.get_or_create(hotel=hotel)
# #         serializer = RoomInventorySerializer(inventory, data=request.data, partial=True)
# #         if serializer.is_valid():
# #             serializer.save()
# #             return Response(serializer.data)
# #         return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# # class RoomPriceView(APIView):
# #     permission_classes = [IsAuthenticated]

# #     def get(self, request):
# #         hotel = request.user.hotel
# #         prices, _ = RoomPrice.objects.get_or_create(hotel=hotel)
# #         serializer = RoomPriceSerializer(prices)
# #         return Response(serializer.data)

# #     def put(self, request):
# #         hotel = request.user.hotel
# #         prices, _ = RoomPrice.objects.get_or_create(hotel=hotel)
# #         serializer = RoomPriceSerializer(prices, data=request.data, partial=True)
# #         if serializer.is_valid():
# #             serializer.save()
# #             return Response(serializer.data)
# #         return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# # # Receptionist: create new requests, list all
# # class ManageMaintenanceRequestListCreateView(generics.ListCreateAPIView):
# #     queryset = ManageMaintenanceRequest.objects.all()
# #     serializer_class = ManageMaintenanceRequestSerializer

# # # Owner: view details, update status,Delete if needed
# # class ManageMaintenanceRequestDetailView(generics.RetrieveUpdateDestroyAPIView):
# #     queryset = ManageMaintenanceRequest.objects.all()
# #     serializer_class = ManageMaintenanceRequestSerializer


# # # List and Create promotions for the logged-in hotel
# # from rest_framework import generics
# # from .models import Promotion
# # from .serializers import PromotionSerializer

# # class PromotionListCreateView(generics.ListCreateAPIView):
# #     serializer_class = PromotionSerializer

# #     def get_queryset(self):
# #         # Only promotions for the logged-in user's hotel
# #         return Promotion.objects.filter(hotel=self.request.user.hotel)

# #     def perform_create(self, serializer):
# #         serializer.save(hotel=self.request.user.hotel)


# # # Retrieve, Update, Delete a single promotion for the logged-in hotel
# # class PromotionDetailView(generics.RetrieveUpdateDestroyAPIView):
# #     serializer_class = PromotionSerializer

# #     def get_queryset(self):
# #         return Promotion.objects.filter(hotel=self.request.user.hotel)



# # class CommissionReportListCreateView(generics.ListCreateAPIView):
# #     serializer_class = CommissionReportSerializer
# #     permission_classes = [permissions.IsAuthenticated]

# #     def get_queryset(self):
# #         user = self.request.user
# #         if not hasattr(user, "hotel") or user.hotel is None:
# #             return CommissionReport.objects.none()
# #         return CommissionReport.objects.filter(hotel=user.hotel)

# #     def perform_create(self, serializer):
# #         user = self.request.user
# #         if not hasattr(user, "hotel") or user.hotel is None:
# #             raise PermissionDenied("User is not linked to a hotel.")
# #         serializer.save(hotel=user.hotel)





# # class ManageBookingsViewSet(viewsets.ModelViewSet):
# #     queryset = ManageBookings.objects.all()
# #     serializer_class = ManageBookingsSerializer

# #     def perform_create(self, serializer):
# #         serializer.save(status="Booked")

# #     def perform_destroy(self, instance):
# #         instance.status = "Available"
# #         instance.save()
# #         instance.delete()

# #     def list(self, request, *args, **kwargs):
# #         now = timezone.now()
# #         for booking in self.queryset:
# #             if booking.checkout and now > booking.checkout:
# #                 booking.status = "Available"
# #                 booking.save()
# #         return super().list(request, *args, **kwargs)

# #     def retrieve(self, request, *args, **kwargs):
# #         booking = self.get_object()
# #         now = timezone.now()
# #         if booking.checkout and now > booking.checkout:
# #             booking.status = "Available"
# #             booking.save()
# #         return super().retrieve(request, *args, **kwargs)

# #     #  Custom action: get payments for a booking
# #     @action(detail=True, methods=["get"])
# #     def payments(self, request, pk=None):
# #         booking = get_object_or_404(ManageBookings, pk=pk)
# #         payments = ManagePayments.objects.filter(booking=booking)
# #         serializer = ManagePaymentsSerializer(payments, many=True)
# #         return Response(serializer.data)



# # class ManagePaymentsViewSet(viewsets.ModelViewSet):
# #     queryset = ManagePayments.objects.all()
# #     serializer_class = ManagePaymentsSerializer





