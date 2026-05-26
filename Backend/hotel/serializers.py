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
    EsewaTransaction,
    RoomImage,  # Add RoomImage import
    Guest,
    GuestStarredPromotion,
    AdminProfile,
    GuestReview,
)

from django.contrib.auth import get_user_model

User = get_user_model()


# ADMIN PROFILE SERIALIZER
class AdminProfileSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source="user.email", read_only=True)
    username = serializers.CharField(source="user.username", read_only=True)
    photo_url = serializers.SerializerMethodField()

    class Meta:
        model = AdminProfile
        fields = [
            "id",
            "name",
            "email",
            "username",
            "contact",
            "address",
            "role",
            "status",
            "photo",
            "photo_url",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "email", "username", "photo_url", "created_at", "updated_at"]

    def get_photo_url(self, obj):
        request = self.context.get("request")
        if obj.photo:
            try:
                url = obj.photo.url
                return request.build_absolute_uri(url) if request else url
            except Exception:
                return None
        return None


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
            'latitude',
            'longitude', 
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
    email = serializers.EmailField(required=True)
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



# ANNOUNCEMENTS SERIALIZERS
class SendAdminAnnouncementSerializer(serializers.ModelSerializer):
    hotel_name = serializers.CharField(source='hotel.name', read_only=True)

    class Meta:
        model = SendAdminAnnouncement
        fields = ['id', 'hotel', 'hotel_name', 'message', 'created_at']
        read_only_fields = ['id', 'created_at']


class SendOwnerAnnouncementSerializer(serializers.ModelSerializer):
    hotel_name = serializers.CharField(source='hotel.name', read_only=True)

    class Meta:
        model = SendOwnerAnnouncement
        fields = ['id', 'hotel', 'hotel_name', 'message', 'created_at']
        read_only_fields = ['id', 'created_at']


class SendReceptionistAnnouncementSerializer(serializers.ModelSerializer):
    hotel_name = serializers.CharField(source='hotel.name', read_only=True)

    class Meta:
        model = SendReceptionistAnnouncement
        fields = ['id', 'hotel', 'hotel_name', 'message', 'created_at']
        read_only_fields = ['id', 'created_at']



# OWNER NOTIFICATION
class OwnerStarredNotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = OwnerStarredNotification
        fields = [
            "id",
            "user",
            "announcement",
            "announcement_type",
            "starred_at",
        ]
        read_only_fields = ["id", "user", "starred_at"]


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
    hotel_name = serializers.CharField(source='hotel.name', read_only=True)

    class Meta:
        model = Promotion
        fields = [
            'id',
            'hotel',
            'hotel_name',
            'title',
            'description',
            'valid_from',
            'valid_to',
            'status',
        ]


class GuestStarredPromotionSerializer(serializers.ModelSerializer):
    promotion_id = serializers.IntegerField(source='promotion.id', read_only=True)
    title = serializers.CharField(source='promotion.title', read_only=True)
    description = serializers.CharField(source='promotion.description', read_only=True)
    valid_from = serializers.DateField(source='promotion.valid_from', read_only=True)
    valid_to = serializers.DateField(source='promotion.valid_to', read_only=True)
    status = serializers.CharField(source='promotion.status', read_only=True)
    hotel_name = serializers.CharField(source='promotion.hotel.name', read_only=True)

    class Meta:
        model = GuestStarredPromotion
        fields = [
            'id',
            'promotion_id',
            'title',
            'description',
            'valid_from',
            'valid_to',
            'status',
            'hotel_name',
            'starred_at',
        ]
        read_only_fields = ['id', 'starred_at']


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


class EsewaTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = EsewaTransaction
        fields = "__all__"
        read_only_fields = ["created_at"]


# ============================================================
# ROOM IMAGE SERIALIZERS
# ============================================================

class RoomImageSerializer(serializers.ModelSerializer):
    """
    Serializer for RoomImage model
    Returns image URLs that can be used directly in the frontend
    """
    image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = RoomImage
        fields = ['id', 'room_number', 'image', 'image_url', 'order', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_image_url(self, obj):
        """
        Generate the full URL for the image
        Images are stored in the frontend public folder, so we return the path
        """
        from django.conf import settings
        if obj.image:
            # Return the URL path that will be served by Next.js from public folder
            return f'/room_images/{obj.image}'
        return None


class RoomImagesUploadSerializer(serializers.Serializer):
    """
    Serializer for uploading multiple images for a room
    """
    roomNumber = serializers.IntegerField(help_text="Room number to upload images for")
    images = serializers.ListField(
        child=serializers.ImageField(
            max_length=1000000,
            allow_empty_file=False,
            use_url=True
        ),
        max_length=4,
        min_length=1,
        help_text="List of image files (max 4 images)"
    )
    
    def validate_images(self, value):
        """
        Validate each uploaded image
        """
        for image in value:
            # Check file size (max 5MB)
            if image.size > 5 * 1024 * 1024:
                raise serializers.ValidationError(
                    f"Image {image.name} is too large. Maximum size is 5MB."
                )
            
            # Check file type
            allowed_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
            if image.content_type not in allowed_types:
                raise serializers.ValidationError(
                    f"Image {image.name} has invalid type. Allowed: JPEG, PNG, WEBP"
                )
        
        return value


class SingleRoomImageUpdateSerializer(serializers.Serializer):
    """
    Serializer for updating a single image's order
    """
    order = serializers.IntegerField(min_value=0, max_value=3, required=True)


from .models import Guest

# GUEST SERIALIZERS
class GuestSerializer(serializers.ModelSerializer):
    profile_picture_url = serializers.SerializerMethodField()
    profile_image = serializers.SerializerMethodField()
    username = serializers.CharField(source="user.username", read_only=True)

    class Meta:
        model = Guest
        fields = [
            'id',
            'name',
            'email',
            'username',
            'contact',
            'address',
            'id_proof',
            'profile_picture',
            'profile_picture_url',
            'profile_image',
            'loyalty_tier',
            'loyalty_points',
            'joined_date',
            'is_active',
        ]
        read_only_fields = ['id', 'username', 'profile_picture_url', 'profile_image', 'joined_date']

    def get_profile_picture_url(self, obj):
        request = self.context.get('request')
        if obj.profile_picture:
            try:
                url = obj.profile_picture.url
                return request.build_absolute_uri(url) if request else url
            except Exception:
                return None
        return None

    def get_profile_image(self, obj):
        return self.get_profile_picture_url(obj)


class GuestRegisterSerializer(serializers.Serializer):
    name = serializers.CharField()
    email = serializers.EmailField()
    contact = serializers.CharField(required=False, allow_blank=True)
    address = serializers.CharField(required=False, allow_blank=True)
    id_proof = serializers.CharField(required=False, allow_blank=True)

    def validate_email(self, value):
        # Note: We're not raising error for duplicate emails
        # because we'll handle it in the view by adding suffix
        return value


class GuestLoginSerializer(serializers.Serializer):
    username = serializers.CharField(required=True)
    password = serializers.CharField(required=True, write_only=True)

    def validate(self, data):
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        username = data.get('username')
        password = data.get('password')
        
        if not username or not password:
            raise serializers.ValidationError("Username and password are required")
        
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            raise serializers.ValidationError("Invalid username or password")
        
        if not user.check_password(password):
            raise serializers.ValidationError("Invalid username or password")
        
        if not hasattr(user, 'guest') or user.guest is None:
            raise serializers.ValidationError("This account is not a guest account")
        
        if not user.guest.is_active:
            raise serializers.ValidationError("Your account has been deactivated")
        
        data['user'] = user
        return data
    

    # Add/replace this serializer in serializers.py

class PromotionSerializer(serializers.ModelSerializer):
    hotel_name = serializers.CharField(source="hotel.name", read_only=True)
    offer_title = serializers.CharField(source="title", read_only=True)

    class Meta:
        model = Promotion
        fields = [
            "id",
            "hotel",
            "hotel_name",
            "title",
            "offer_title",
            "description",
            "valid_from",
            "valid_to",
            "status",
        ]
        read_only_fields = ["id", "hotel", "hotel_name", "offer_title"]
























# GUEST REVIEW SERIALIZER
class GuestReviewSerializer(serializers.ModelSerializer):
    hotel_name = serializers.CharField(source="hotel.name", read_only=True)
    guest_name = serializers.CharField(source="guest.name", read_only=True)
    user = serializers.SerializerMethodField()

    class Meta:
        model = GuestReview
        fields = [
            "id",
            "hotel",
            "hotel_name",
            "guest",
            "guest_name",
            "user",
            "name",
            "country",
            "rating",
            "comment",
            "created_at",
        ]
        read_only_fields = ["id", "hotel", "hotel_name", "guest", "guest_name", "user", "created_at"]

    def get_user(self, obj):
        name = obj.name or (obj.guest.name if obj.guest else "Guest")
        parts = name.split(maxsplit=1)
        return {
            "first_name": parts[0] if parts else "Guest",
            "last_name": parts[1] if len(parts) > 1 else "",
        }

    def validate_rating(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError("Rating must be between 1 and 5.")
        return value

    def validate_comment(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Review comment is required.")
        return value.strip()
