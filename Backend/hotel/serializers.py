from rest_framework import serializers
from .models import Hotel
from .models import CommissionRule, CommissionPayment
from .models import SendOwnerAnnouncement, SendReceptionistAnnouncement, SendAdminAnnouncement
from .models import OwnerStarredNotification
from .models import RoomInventory,RoomPrice
# from django.contrib.auth import authenticate


class HotelSerializer(serializers.ModelSerializer):
    class Meta:
        model = Hotel
        # include the status field instead of is_active
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
            'status',        # <-- replaced is_active with status
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


class AdminLoginSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(required=True, write_only=True)


class OTPRequestSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)


class OTPVerifySerializer(serializers.Serializer):
    otp = serializers.CharField(required=True)


class CommissionRuleSerializer(serializers.ModelSerializer):
    class Meta:
        model = CommissionRule
        fields = ['rule_id', 'name', 'description', 'effective_date']


class CommissionPaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = CommissionPayment
        fields = '__all__'


#  NEW: Track Commission Revenue Serializer
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

#Send Announcement to OwnerSerializer
class SendOwnerAnnouncementSerializer(serializers.ModelSerializer):
    class Meta:
        model = SendOwnerAnnouncement
        fields = '__all__'


#Send Announcement to ManagerSerializer
class SendReceptionistAnnouncementSerializer(serializers.ModelSerializer):
    class Meta:
        model = SendReceptionistAnnouncement
        fields = '__all__'

#Send Announcement to AdminSerializer
class SendAdminAnnouncementSerializer(serializers.ModelSerializer):
    class Meta:
        model = SendAdminAnnouncement
        fields = '__all__'


# # Owner Login Serializer
# class OwnerLoginSerializer(serializers.Serializer):
#     username = serializers.CharField(required=True)
#     password = serializers.CharField(required=True, write_only=True)

#     def validate(self, data):
#         user = authenticate(username=data['username'], password=data['password'])
#         if not user:
#             raise serializers.ValidationError("Invalid username or password")
#         data['user'] = user
#         return data
        

# Owner StarredNotification Serializer
class OwnerStarredNotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = OwnerStarredNotification
        fields = ['id', 'announcement', 'starred_at']



# -------------------------
# ROOM INVENTORY / PRICE SERIALIZERS
# -------------------------
class RoomInventorySerializer(serializers.ModelSerializer):
    class Meta:
        model = RoomInventory
        fields = ['id',  'normal_rooms', 'deluxe_rooms', 'suite_rooms']


class RoomPriceSerializer(serializers.ModelSerializer):
    class Meta:
        model = RoomPrice
        fields = ['id',"normal_price", "deluxe_price", "suite_price"]
