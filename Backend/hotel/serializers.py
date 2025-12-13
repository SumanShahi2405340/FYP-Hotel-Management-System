from rest_framework import serializers

class AdminLoginSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(required=True, write_only=True)

class OTPRequestSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)

class OTPVerifySerializer(serializers.Serializer):
    otp = serializers.CharField(required=True)
