from rest_framework import serializers
from .models import (
    Hotel,
    CommissionRule,
    CommissionPayment,
    SendOwnerAnnouncement,
    SendReceptionistAnnouncement,
    SendAdminAnnouncement,
    OwnerStarredNotification,
    RoomInventory,
    RoomPrice,
    ManageMaintenanceRequest,
    Receptionist,
    Promotion,
    CommissionReport,
    ManageBookings,
    Staff,
    Attendance,
    ManagePayments,
)


# HOTEL SERIALIZERS
class HotelSerializer(serializers.ModelSerializer):
    class Meta:
        model = Hotel
        fields = [
            'id',
            'name',
            'owner',
            'contact',
            'email',
            'location',
            'pan',
            'age',
            'owner_contact',
            'citizenship',
            'permanent_address',
            'status',
            'review_score',
            'usage_score',
            'created_at',
        ]


class HotelRegisterSerializer(serializers.Serializer):
    name = serializers.CharField()
    owner = serializers.CharField()
    contact = serializers.CharField()
    email = serializers.EmailField()
    location = serializers.CharField()
    pan = serializers.CharField()


# ADMIN LOGIN
class AdminLoginSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(required=True, write_only=True)

    def validate_email(self, value):
        from django.contrib.auth import get_user_model
        User = get_user_model()
        if not User.objects.filter(email=value).exists():
            raise serializers.ValidationError("No user with this email")
        return value


# OTP SERIALIZERS
class OTPRequestSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)


class OTPVerifySerializer(serializers.Serializer):
    otp = serializers.CharField(required=True)


# COMMISSION SERIALIZERS
class CommissionRuleSerializer(serializers.ModelSerializer):
    class Meta:
        model = CommissionRule
        fields = ['rule_id', 'name', 'description', 'effective_date']


class CommissionPaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = CommissionPayment
        fields = '__all__'


class CommissionRevenueSerializer(serializers.ModelSerializer):
    hotel_name = serializers.CharField(source='hotel.name', read_only=True)
    hotel_id = serializers.CharField(source='hotel.id', read_only=True)

    class Meta:
        model = CommissionPayment
        fields = [
            'payment_id',
            'hotel_id',
            'hotel_name',
            'amount',
            'status',
            'start_due_date',
        ]


# ANNOUNCEMENTS
class SendOwnerAnnouncementSerializer(serializers.ModelSerializer):
    hotel_name = serializers.CharField(source="owner.hotel.name", read_only=True)

    class Meta:
        model = SendOwnerAnnouncement
        fields = '__all__'


class SendReceptionistAnnouncementSerializer(serializers.ModelSerializer):
    hotel_name = serializers.CharField(source="owner.hotel.name", read_only=True)

    class Meta:
        model = SendReceptionistAnnouncement
        fields = '__all__'


class SendAdminAnnouncementSerializer(serializers.ModelSerializer):
    hotel_name = serializers.CharField(source="owner.hotel.name", read_only=True)

    class Meta:
        model = SendAdminAnnouncement
        fields = '__all__'


# OWNER NOTIFICATION
class OwnerStarredNotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = OwnerStarredNotification
        fields = ['id', 'announcement', 'starred_at']


# ROOM INVENTORY / PRICE
class RoomInventorySerializer(serializers.ModelSerializer):
    class Meta:
        model = RoomInventory
        fields = ['id', 'normal_rooms', 'deluxe_rooms', 'suite_rooms']


class RoomPriceSerializer(serializers.ModelSerializer):
    class Meta:
        model = RoomPrice
        fields = ['id', "normal_price", "deluxe_price", "suite_price"]


# MAINTENANCE REQUEST
class ManageMaintenanceRequestSerializer(serializers.ModelSerializer):
    hotel_name = serializers.CharField(source='hotel.name', read_only=True)

    class Meta:
        model = ManageMaintenanceRequest
        fields = "__all__"


# RECEPTIONIST SERIALIZERS
class ReceptionistSerializer(serializers.ModelSerializer):
    class Meta:
        model = Receptionist
        fields = "__all__"
        read_only_fields = ["user"]


# NEW: Receptionist Registration Serializer
class ReceptionistRegisterSerializer(serializers.ModelSerializer):
    class Meta:
        model = Receptionist
        fields = [
            'name',
            'age',
            'email',
            'contact',
            'permanent_address',
            'citizenship',
            'joined_date',
            'status',
            'role', 
        ]
        read_only_fields = ['user', 'hotel','id']




class StaffSerializer(serializers.ModelSerializer):
    class Meta:
        model = Staff
        fields = "__all__"


class AttendanceSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    role = serializers.SerializerMethodField()

    class Meta:
        model = Attendance
        fields = ["id", "date", "status", "name", "role"]

    def get_name(self, obj):
        if obj.staff:
            return obj.staff.name
        elif obj.receptionist:
            return obj.receptionist.name
        return None

    def get_role(self, obj):
        if obj.staff:
            return obj.staff.role
        elif obj.receptionist:
            return obj.receptionist.role
        return None



# PROMOTION
class PromotionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Promotion
        fields = "__all__"


# COMMISSION REPORT
class CommissionReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = CommissionReport
        fields = "__all__"
        read_only_fields = ["hotel", "created_at"]



class ManageBookingsSerializer(serializers.ModelSerializer):
    current_status = serializers.SerializerMethodField()

    class Meta:
        model = ManageBookings
        fields = "__all__"

    def get_current_status(self, obj):
        return obj.current_status()



class ManagePaymentsSerializer(serializers.ModelSerializer):
    class Meta:
        model = ManagePayments
        fields = "__all__"
