#There are three types of views like classbased ApiView, generics.ListCreateAPIView and Function based view
import random, secrets, string
from django.core.mail import send_mail
from django.conf import settings
from django.contrib.auth import authenticate, login
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
from .models import Hotel, CommissionRule, CommissionPayment
from .models import SendAdminAnnouncement, SendOwnerAnnouncement, SendReceptionistAnnouncement
from .models import OwnerStarredNotification, CommissionReport
from .models import RoomInventory, RoomPrice, ManageMaintenanceRequest, Receptionist, Promotion, ManageBookings, Staff, Attendance
from .models import ManagePayments
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth.hashers import make_password
from django.contrib.auth import get_user_model
from rest_framework.decorators import api_view, permission_classes
from django.shortcuts import get_object_or_404

# from rest_framework_simplejwt.tokens import RefreshToken
import uuid
from .serializers import (
    AdminLoginSerializer,
    OTPRequestSerializer,
    OTPVerifySerializer,
    HotelSerializer,
    HotelRegisterSerializer,
    CommissionRuleSerializer,
    CommissionPaymentSerializer,
    CommissionRevenueSerializer,
    #SendAdminAnnouncementSerializer,
    SendOwnerAnnouncementSerializer,
    SendReceptionistAnnouncementSerializer,

    OwnerStarredNotificationSerializer,
    # OwnerLoginSerializer,
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

)



User = get_user_model()

# Utility
def generate_password(length=8):
    return ''.join(random.choices(string.ascii_letters + string.digits, k=length))




# Receptionist Register View
@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def register_receptionist(request):
    data = request.data.copy()
    data["role"] = "Receptionist"   #  force role

    serializer = ReceptionistRegisterSerializer(data=data)
    if serializer.is_valid():
        email = serializer.validated_data["email"]
        # Generate unique username with only 3 letters
        username = f"{email}_{uuid.uuid4().hex[:3]}"   #  only 3 chars
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





# Receptionist  Details View in Receptionist Dashboard
@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def get_hotel_receptionist(request):
    hotel = getattr(request.user, "hotel", None)
    if not hotel:
        return Response({"error": "No hotel linked to this account"}, status=400)

    receptionists = Receptionist.objects.filter(hotel=hotel)
    serializer = ReceptionistSerializer(receptionists, many=True)
    return Response(serializer.data)




#Get Receptionist Details in managestaff and attendance in owner dashboard
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_hotel_receptionist_info(request):
    try:
        hotel = request.user.hotel   # Owner’s hotel relation
    except Exception:
        return Response({"error": "No hotel linked to this account"}, status=400)

    receptionists = hotel.receptionists.all()
    serializer = ReceptionistSerializer(receptionists, many=True)

    return Response({
        "hotel_id": hotel.id,
        "hotel_name": hotel.name,
        "receptionists": serializer.data
    })



#Staff Viewsets
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
    """
    Delete a staff record by ID.
    """
    try:
        staff = Staff.objects.get(pk=pk)
        staff.delete()
        return Response({"message": "Staff record deleted successfully"}, status=status.HTTP_204_NO_CONTENT)
    except Staff.DoesNotExist:
        return Response({"error": "Staff not found"}, status=status.HTTP_404_NOT_FOUND)


# attendance/views.py
# views.py
class AttendanceViewSet(viewsets.ModelViewSet):
    queryset = Attendance.objects.all()
    serializer_class = AttendanceSerializer
    permission_classes = [IsAuthenticated]

    # Existing staff history
    @action(detail=False, methods=["get"])
    def staff_history(self, request):
        staff_id = request.query_params.get("staff_id")
        if not staff_id:
            return Response({"error": "staff_id is required"}, status=400)

        records = Attendance.objects.filter(staff_id=staff_id).order_by("-date")
        serializer = AttendanceSerializer(records, many=True)
        return Response(serializer.data)

    #  New receptionist history
    @action(detail=False, methods=["get"])
    def receptionist_history(self, request):
        receptionist_id = request.query_params.get("receptionist_id")
        if not receptionist_id:
            return Response({"error": "receptionist_id is required"}, status=400)

        records = Attendance.objects.filter(receptionist_id=receptionist_id).order_by("-date")
        serializer = AttendanceSerializer(records, many=True)
        return Response(serializer.data)


    # POST mark attendance for a staff (ensures one record per day)
    @action(detail=False, methods=["post"])
    def mark(self, request):
        staff_id = request.data.get("staff_id")
        receptionist_id = request.data.get("receptionist_id")
        status = request.data.get("status")

        if not status or (not staff_id and not receptionist_id):
            return Response({"error": "Provide staff_id or receptionist_id and status"}, status=400)

        today = date.today()

        if staff_id:
            updated = Attendance.objects.filter(staff_id=staff_id, date=today).update(status=status)
            if updated == 0:
                record = Attendance.objects.create(staff_id=staff_id, status=status, date=today)
            else:
                record = Attendance.objects.filter(staff_id=staff_id, date=today).latest("id")

        elif receptionist_id:
            updated = Attendance.objects.filter(receptionist_id=receptionist_id, date=today).update(status=status)
            if updated == 0:
                record = Attendance.objects.create(receptionist_id=receptionist_id, status=status, date=today)
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


    # NEW: Monthly attendance filter
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

        # Filter by either staff_id or receptionist_id
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




# HOTEL VIEWSET
class HotelViewSet(ModelViewSet):
     queryset = Hotel.objects.all() 
     serializer_class = HotelSerializer


# AUTHENTICATION + OTP VIEWS
User = get_user_model()

class AdminLoginView(APIView):
    def post(self, request):
        email = request.data.get("email")
        password = request.data.get("password")

        # Find all users with this email
        users = User.objects.filter(email=email)
        if not users.exists():
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

        # Pick the first match (graceful handling of duplicates)
        user = users.first()

        # Authenticate using username (default Django backend)
        user = authenticate(request, username=user.username, password=password)

        if user is not None and user.is_staff:
            login(request, user)  # session cookie set
            return Response({'message': 'Login successful'}, status=status.HTTP_200_OK)

        return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)




# Step 2: Forgot password → send OTP
class OTPRequestView(APIView):
    def post(self, request):
        serializer = OTPRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data['email']
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

        otp = random.randint(100000, 999999)
        request.session['otp'] = str(otp)
        request.session['reset_user'] = user.id

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

        otp_entered = serializer.validated_data['otp']

        if str(request.session.get('otp')) == str(otp_entered):
            user_id = request.session.get('reset_user')
            try:
                user = User.objects.get(id=user_id)
            except User.DoesNotExist:
                return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

            # Clear session
            request.session.pop('otp', None)
            request.session.pop('reset_user', None)

            login(request, user)
            return Response({'message': 'Login successful via OTP'}, status=status.HTTP_200_OK)

        return Response({'error': 'Invalid OTP'}, status=status.HTTP_400_BAD_REQUEST)



# HOTEL MANAGEMENT  Register VIEW
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

        return Response({"message": "Hotel registered successfully", "hotel": HotelSerializer(hotel).data, "owner_user": user.username}, status=201)
    


#REceptionist Register View
def generate_password(length=8):
    return ''.join(random.choices(string.ascii_letters + string.digits, k=length))

@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def register_receptionist(request):
    serializer = ReceptionistRegisterSerializer(data=request.data)
    if serializer.is_valid():
        email = serializer.validated_data["email"]
        #  Generate unique username even if email is duplicate
        username = f"{email}_{uuid.uuid4().hex[:6]}"
        password = generate_password()

        user = User.objects.create(
            username=username,
            email=email,
            password=make_password(password)
        )

        hotel = getattr(request.user, "hotel", None)
        if not hotel:
            return Response({"error": "No hotel linked to this account"}, status=status.HTTP_400_BAD_REQUEST)

        receptionist = serializer.save(user=user, hotel=hotel)

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

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# Receptionist in Receptionist Dashboard
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_hotel_receptionist(request):
    try:
        # receptionist is linked to the logged-in user
        receptionist = request.user.receptionist
        hotel = receptionist.hotel
    except Exception:
        return Response({"error": "No hotel linked to this account"}, status=400)

    # Fetch receptionists belonging to that hotel
    receptionists = Receptionist.objects.filter(hotel=hotel)
    serializer = ReceptionistSerializer(receptionists, many=True)

    return Response({
        "hotel_id": hotel.id,
        "hotel_name": hotel.name,
        "receptionists": serializer.data
    })


#Receptionist in Owner Dashboard
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_hotel_receptionist_info(request):
    try:
        # owner is linked to the logged-in user via hotel relation
        hotel = request.user.hotel
    except Exception:
        return Response({"error": "No hotel linked to this account"}, status=400)

    # Fetch receptionists belonging to that hotel
    receptionists = hotel.receptionists.all()
    serializer = ReceptionistSerializer(receptionists, many=True)

    return Response({
        "hotel_id": hotel.id,
        "hotel_name": hotel.name,
        "receptionists": serializer.data
    })





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
        

# contains hotel_id and hotel_name
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



# COMMISSION RULES API
# Inherits from APIView, which is the lowest-level DRF class.
#We can also use APIView to combine both model for get from both and post to both 
class CommissionRuleView(APIView):
    """
    GET: Fetch all commission rules
    POST: Save/update commission rules
    """

    def get(self, request):
        rules = CommissionRule.objects.all()
        serializer = CommissionRuleSerializer(rules, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        # Expecting a list of rules from frontend
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



# COMMISSION PAYMENTS API view
#Inherits from ListCreateAPIView, which is a generic view built on top of APIView.
#We cannot add querybased class based view   if we have two models SendOwnerAnnouncement and SendManager Announcement for get and post but its all right here
class CommissionPaymentView(generics.ListCreateAPIView):
     """ 
     General API for Commission Payments 
     GET: List all commission payments 
     POST: Create a new commission payment 
     """ 
     queryset = CommissionPayment.objects.all().order_by('-created_at') 
     serializer_class = CommissionPaymentSerializer

@api_view(['GET'])
def get_active_hotels(request):
    """
    Fetch active hotels with PID-<id>, hotel name, and amount logic.
    """
    hotels = Hotel.objects.filter(status="Active").order_by('id')
    today = date.today()
    data = []

    for hotel in hotels:
        # Calculate months active
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

        # Count existing records for this hotel/month
        existing_count = CommissionPayment.objects.filter(
            hotel_id=hotel_id,
            start_due_date=start_due_date
        ).count()

        if existing_count >= 2:
            # Already has 2 → skip
            already_full.append(item['hotel'])
        elif existing_count == 1:
            # Has 1 → create 1 more, ID like 32.2
            CommissionPayment.objects.create(
                hotel_id=hotel_id,
                payment_id=f"{hotel_id}.2",
                amount=amount,
                status=payment_status,
                start_due_date=start_due_date
            )
        elif existing_count == 0:
            # Has none → create 1, ID like 32.1
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






# COMMISSION REVENUE API 
#This is function based view
@api_view(['GET'])
def track_commission_revenue(request):
    """
    Fetch all commission payments for the given month/year.
    """
    month = request.GET.get('month')
    year = request.GET.get('year')

    if not month or not year:
        return Response({'error': 'Month and year are required'}, status=status.HTTP_400_BAD_REQUEST)

    prefix = f"{year}-{month}"  # expects month in MM format

    # Fetch all payments for the month/year, both statuses
    payments = CommissionPayment.objects.filter(
        start_due_date__startswith=prefix,
        status__in=['Paid', 'Pending']
    ).order_by('hotel_id', 'created_at') #we can show data in ascending or descending order by created_at

    # return everything
    serializer = CommissionRevenueSerializer(payments, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)







# ANNOUNCEMENT API 
#We cannot add querybased class based view   if we have two models SendOwnerAnnouncement and SendManager Announcement
#We can use APIView to combine both model for get from both and post to both 
#But lets use function based its easier
@api_view(['POST'])
def send_announcement(request):
    message = request.data.get('message')
    send_to_owner = request.data.get('sendToOwner')
    send_to_receptionist = request.data.get('sendToReceptionist')

    # Validation: must have a message and at least one recipient
    if not message or not (send_to_owner or send_to_receptionist):
        return Response({'error': 'Message and at least one recipient required.'},
                        status=status.HTTP_400_BAD_REQUEST)

    saved = {}

    # Save to owner table if checkbox is true
    if send_to_owner:
        owner_announcement = SendOwnerAnnouncement.objects.create(message=message)
        saved['owner'] = SendOwnerAnnouncementSerializer(owner_announcement).data

    # Save to manager table if checkbox is true
    if send_to_receptionist:
        receptionist_announcement = SendReceptionistAnnouncement.objects.create(message=message)
        saved['receptionist'] = SendReceptionistAnnouncementSerializer(receptionist_announcement).data

    return Response({'success': True, 'saved': saved}, status=status.HTTP_200_OK)



@api_view(['GET'])
def recent_announcements(request):
    owner = SendOwnerAnnouncement.objects.order_by('-created_at')[:5]
    receptionist = SendReceptionistAnnouncement.objects.order_by('-created_at')[:5]

    combined = []
    for ann in owner:
        combined.append({
            "id": ann.id,
            "content": ann.message,
            "recipients": ["owner"],
            "timestamp": ann.created_at
        })
    for ann in receptionist:
        combined.append({
            "id": ann.id,
            "content": ann.message,
            "recipients": ["receptionist"],
            "timestamp": ann.created_at
        })

    combined.sort(key=lambda x: x['timestamp'], reverse=True)
    return Response(combined)



# POST: Owner sends announcement
@api_view(['POST'])
def owner_send_announcement(request):
    message = request.data.get('message')
    send_to_admin = request.data.get('sendToAdmin')
    send_to_receptionist = request.data.get('sendToReceptionist')

    if not message or not (send_to_admin or send_to_receptionist):
        return Response({'error': 'Message and at least one recipient required.'},
                        status=status.HTTP_400_BAD_REQUEST)

    saved = {}

    # Save to Admin table if checkbox is true
    if send_to_admin:
        admin_announcement = SendAdminAnnouncement.objects.create(
            hotel=getattr(request.user, "hotel", None),
            message=message
        )
        saved['admin'] = {
            "id": admin_announcement.id,
            "message": admin_announcement.message,
            "hotel_name": admin_announcement.hotel.name if admin_announcement.hotel else None,
            "created_at": admin_announcement.created_at
        }

    # Save to Receptionist table if checkbox is true
    if send_to_receptionist:
        receptionist_announcement = SendReceptionistAnnouncement.objects.create(
            hotel=getattr(request.user, "hotel", None),
            message=message
        )
        saved['receptionist'] = {
            "id": receptionist_announcement.id,
            "message": receptionist_announcement.message,
            "hotel_name": receptionist_announcement.hotel.name if receptionist_announcement.hotel else None,
            "created_at": receptionist_announcement.created_at
        }

    return Response({'success': True, 'saved': saved}, status=status.HTTP_200_OK)


@api_view(['GET'])
def owner_recent_announcements(request):
    combined = []

    # Admin announcements
    admin = SendAdminAnnouncement.objects.order_by('-created_at')[:5]
    for ann in admin:
        combined.append({
            "id": ann.id,
            "content": ann.message,
            "recipients": ["admin"],
            "hotel_name": ann.hotel.name if ann.hotel else None,
            "timestamp": ann.created_at
        })

    # Receptionist announcements
    receptionist = SendReceptionistAnnouncement.objects.order_by('-created_at')[:5]
    for ann in receptionist:
        combined.append({
            "id": ann.id,
            "content": ann.message,
            "recipients": ["receptionist"],
            "hotel_name": ann.hotel.name if ann.hotel else None,
            "timestamp": ann.created_at
        })

    combined.sort(key=lambda x: x['timestamp'], reverse=True)
    return Response(combined)




# class OwnerLoginView(APIView):
#     def post(self, request):
#         serializer = OwnerLoginSerializer(data=request.data)
#         if serializer.is_valid():
#             user = serializer.validated_data['user']
#             login(request, user)  # optional if you want session login too

#             # Generate JWT tokens
#             refresh = RefreshToken.for_user(user)
#             access = str(refresh.access_token)

#             # Get hotel linked to this user
#             hotel_id = None
#             try:
#                 if hasattr(user, "hotel") and user.hotel is not None:
#                     hotel_id = user.hotel.id
#             except Hotel.DoesNotExist:
#                 hotel_id = None

#             return Response({
#                 "message": "Login successful",
#                 "username": user.username,
#                 "email": user.email,
#                 "hotel_id": hotel_id,
#                 "access": access,
#                 "refresh": str(refresh),
#             }, status=status.HTTP_200_OK)

#         return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)





# List all starred notifications 
class OwnerStarredNotificationList(generics.ListAPIView):
    serializer_class = OwnerStarredNotificationSerializer
    

    def get_queryset(self):
         return OwnerStarredNotification.objects.all()

# Star a new notification
class OwnerStarredNotificationCreate(generics.CreateAPIView):
    serializer_class = OwnerStarredNotificationSerializer
   

    def perform_create(self, serializer):
        serializer.save()


# Unstar a notification (global, no user required)
class OwnerStarredNotificationDelete(generics.DestroyAPIView):

    def delete(self, request, pk):
        try:
            # just delete by announcement_id, no user filter
            starred = OwnerStarredNotification.objects.get(announcement_id=pk)
            starred.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except OwnerStarredNotification.DoesNotExist:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)



class RoomInventoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        hotel = request.user.hotel  # hotel linked to logged-in user
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


# Receptionist: create new requests, list all
class ManageMaintenanceRequestListCreateView(generics.ListCreateAPIView):
    queryset = ManageMaintenanceRequest.objects.all()
    serializer_class = ManageMaintenanceRequestSerializer

# Owner: view details, update status,Delete if needed
class ManageMaintenanceRequestDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = ManageMaintenanceRequest.objects.all()
    serializer_class = ManageMaintenanceRequestSerializer


# List and Create promotions for the logged-in hotel
from rest_framework import generics
from .models import Promotion
from .serializers import PromotionSerializer

class PromotionListCreateView(generics.ListCreateAPIView):
    serializer_class = PromotionSerializer

    def get_queryset(self):
        # Only promotions for the logged-in user's hotel
        return Promotion.objects.filter(hotel=self.request.user.hotel)

    def perform_create(self, serializer):
        serializer.save(hotel=self.request.user.hotel)


# Retrieve, Update, Delete a single promotion for the logged-in hotel
class PromotionDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = PromotionSerializer

    def get_queryset(self):
        return Promotion.objects.filter(hotel=self.request.user.hotel)



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

    #  Custom action: get payments for a booking
    @action(detail=True, methods=["get"])
    def payments(self, request, pk=None):
        booking = get_object_or_404(ManageBookings, pk=pk)
        payments = ManagePayments.objects.filter(booking=booking)
        serializer = ManagePaymentsSerializer(payments, many=True)
        return Response(serializer.data)



class ManagePaymentsViewSet(viewsets.ModelViewSet):
    queryset = ManagePayments.objects.all()
    serializer_class = ManagePaymentsSerializer

