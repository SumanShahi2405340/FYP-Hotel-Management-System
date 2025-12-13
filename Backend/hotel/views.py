# backend/views.py

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import authenticate, login
from django.contrib.auth.models import User
from django.core.mail import send_mail
from django.conf import settings
import random

from .serializers import AdminLoginSerializer, OTPRequestSerializer, OTPVerifySerializer


# Step 1: Normal login with email + password
class AdminLoginView(APIView):
    def post(self, request):
        serializer = AdminLoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data['email']
        password = serializer.validated_data['password']

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            print("DEBUG: No user found with email:", email)
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

        # Authenticate using username (Django default)
        user = authenticate(request, username=user.username, password=password)

        if user is not None:
            login(request, user)
            print("DEBUG: Login successful for user:", user.username)
            return Response({'message': 'Login successful'}, status=status.HTTP_200_OK)

        print("DEBUG: Invalid credentials for email:", email)
        return Response({'error': 'Invalid credentials'}, status=status.HTTP_400_BAD_REQUEST)



# Step 2: Forgot password → send OTP
class OTPRequestView(APIView):
    def post(self, request):
        serializer = OTPRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data['email']
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            print("DEBUG: No user found with email:", email)
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

        otp = random.randint(100000, 999999)
        request.session['otp'] = str(otp)
        request.session['reset_user'] = user.id

        # Debug prints
        print("DEBUG: Generated OTP:", otp)
        print("DEBUG: Stored in session:", request.session['otp'])
        print("DEBUG: Reset user ID:", request.session['reset_user'])

        send_mail(
            'Your OTP Code',
            f'Your OTP is {otp}',
            settings.DEFAULT_FROM_EMAIL,
            [user.email],
        )

        return Response({'message': 'OTP generated and sent'}, status=status.HTTP_200_OK)


# Step 3: Verify OTP → login
class OTPVerifyView(APIView):
    def post(self, request):
        serializer = OTPVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data.get('email')
        otp_entered = serializer.validated_data['otp']

        # Debugging
        print("DEBUG: Entered OTP:", otp_entered)
        print("DEBUG: Session OTP:", request.session.get('otp'))
        print("DEBUG: Session User ID:", request.session.get('reset_user'))

        if str(request.session.get('otp')) == str(otp_entered):
            user_id = request.session.get('reset_user')
            try:
                user = User.objects.get(id=user_id)
                print("DEBUG: Found user:", user.username, "with email:", user.email)
            except User.DoesNotExist:
                print("DEBUG: No user found with ID:", user_id, "and email:", email)
                return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

            # Clear session
            request.session.pop('otp', None)
            request.session.pop('reset_user', None)

            login(request, user)
            return Response({'message': 'Login successful via OTP'}, status=status.HTTP_200_OK)

        print("DEBUG: OTP mismatch. Entered:", otp_entered, "Expected:", request.session.get('otp'))
        return Response({'error': 'Invalid OTP'}, status=status.HTTP_400_BAD_REQUEST)
