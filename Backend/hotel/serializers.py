# from rest_framework import serializers
# from .models import Hotel

# class AdminLoginSerializer(serializers.Serializer):
#     email = serializers.EmailField(required=True)
#     password = serializers.CharField(required=True, write_only=True)

# class OTPRequestSerializer(serializers.Serializer):
#     email = serializers.EmailField(required=True)

# class OTPVerifySerializer(serializers.Serializer):
#     otp = serializers.CharField(required=True)




from rest_framework import serializers
from .models import Hotel

class HotelSerializer(serializers.ModelSerializer):
    class Meta:
        model = Hotel
        # include the new status field instead of is_active
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





