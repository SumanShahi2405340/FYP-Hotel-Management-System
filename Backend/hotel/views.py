# from rest_framework.views import APIView
# from rest_framework.response import Response
# from rest_framework import status
# from django.contrib.auth import authenticate, login
# from django.contrib.auth.models import User
# from django.core.mail import send_mail
# from django.conf import settings
# import random

# from .serializers import AdminLoginSerializer, OTPRequestSerializer, OTPVerifySerializer


# # Step 1: Normal login with email + password
# class AdminLoginView(APIView):
#     def post(self, request):
#         serializer = AdminLoginSerializer(data=request.data)
#         serializer.is_valid(raise_exception=True)

#         email = serializer.validated_data['email']
#         password = serializer.validated_data['password']

#         try:
#             user = User.objects.get(email=email)
#         except User.DoesNotExist:
#             print("DEBUG: No user found with email:", email)
#             return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

#         # Authenticate using username (Django default)
#         user = authenticate(request, username=user.username, password=password)

#         if user is not None:
#             login(request, user)
#             print("DEBUG: Login successful for user:", user.username)
#             return Response({'message': 'Login successful'}, status=status.HTTP_200_OK)

#         print("DEBUG: Invalid credentials for email:", email)
#         return Response({'error': 'Invalid credentials'}, status=status.HTTP_400_BAD_REQUEST)



# # Step 2: Forgot password → send OTP
# class OTPRequestView(APIView):
#     def post(self, request):
#         serializer = OTPRequestSerializer(data=request.data)
#         serializer.is_valid(raise_exception=True)

#         email = serializer.validated_data['email']
#         try:
#             user = User.objects.get(email=email)
#         except User.DoesNotExist:
#             print("DEBUG: No user found with email:", email)
#             return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

#         otp = random.randint(100000, 999999)
#         request.session['otp'] = str(otp)
#         request.session['reset_user'] = user.id

#         # Debug prints
#         print("DEBUG: Generated OTP:", otp)
#         print("DEBUG: Stored in session:", request.session['otp'])
#         print("DEBUG: Reset user ID:", request.session['reset_user'])

#         send_mail(
#             'Your OTP Code',
#             f'Your OTP is {otp}',
#             settings.DEFAULT_FROM_EMAIL,
#             [user.email],
#         )

#         return Response({'message': 'OTP generated and sent'}, status=status.HTTP_200_OK)


# # Step 3: Verify OTP → login
# class OTPVerifyView(APIView):
#     def post(self, request):
#         serializer = OTPVerifySerializer(data=request.data)
#         serializer.is_valid(raise_exception=True)

#         email = serializer.validated_data.get('email')
#         otp_entered = serializer.validated_data['otp']

#         # Debugging
#         print("DEBUG: Entered OTP:", otp_entered)
#         print("DEBUG: Session OTP:", request.session.get('otp'))
#         print("DEBUG: Session User ID:", request.session.get('reset_user'))

#         if str(request.session.get('otp')) == str(otp_entered):
#             user_id = request.session.get('reset_user')
#             try:
#                 user = User.objects.get(id=user_id)
#                 print("DEBUG: Found user:", user.username, "with email:", user.email)
#             except User.DoesNotExist:
#                 print("DEBUG: No user found with ID:", user_id, "and email:", email)
#                 return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

#             # Clear session
#             request.session.pop('otp', None)
#             request.session.pop('reset_user', None)

#             login(request, user)
#             return Response({'message': 'Login successful via OTP'}, status=status.HTTP_200_OK)

#         print("DEBUG: OTP mismatch. Entered:", otp_entered, "Expected:", request.session.get('otp'))
#         return Response({'error': 'Invalid OTP'}, status=status.HTTP_400_BAD_REQUEST)



import secrets, string
from django.core.mail import send_mail
from rest_framework.views import APIView
from rest_framework.generics import ListAPIView, UpdateAPIView
from rest_framework.response import Response
from rest_framework import status
from .models import Hotel
from .serializers import HotelSerializer, HotelRegisterSerializer

def generate_password(length=8):
    alphabet = string.ascii_letters + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(length))


class RegisterHotelView(APIView):
    def post(self, request):
        serializer = HotelRegisterSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        password = generate_password()
        username = data["email"].split("@")[0]

        # ✅ Create hotel with all fields, not just serializer ones
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
        )

        # Send credentials via email
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

        return Response({"message": "Hotel registered successfully", "hotel": HotelSerializer(hotel).data}, status=201)


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
        return Response(
            {"message": "Hotel activated successfully", "hotel": HotelSerializer(hotel).data},
            status=status.HTTP_200_OK
        )


class DeactivateHotelView(APIView):
    def patch(self, request, pk):
        try:
            hotel = Hotel.objects.get(pk=pk)
        except Hotel.DoesNotExist:
            return Response({"error": "Hotel not found"}, status=status.HTTP_404_NOT_FOUND)

        hotel.status = "Inactive"
        hotel.save()
        return Response(
            {"message": "Hotel deactivated successfully", "hotel": HotelSerializer(hotel).data},
            status=status.HTTP_200_OK
        )


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