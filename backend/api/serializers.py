"""
API Serializers
Handles validation and serialization for all API endpoints.
"""

from rest_framework import serializers
from django.contrib.auth.models import User
from api.models import FarmerProfile, PredictionHistory


class RegisterSerializer(serializers.Serializer):
    """Farmer registration."""
    username = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(min_length=6, write_only=True)
    first_name = serializers.CharField(max_length=100, required=False, default='')
    last_name = serializers.CharField(max_length=100, required=False, default='')
    phone = serializers.CharField(max_length=15, required=False, default='')
    location = serializers.CharField(max_length=200, required=False, default='')
    preferred_language = serializers.ChoiceField(
        choices=FarmerProfile.LANGUAGE_CHOICES, default='en'
    )

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Username already exists")
        return value

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email already registered")
        return value


class LoginSerializer(serializers.Serializer):
    """Farmer login."""
    username = serializers.CharField()
    password = serializers.CharField()


class FarmerProfileSerializer(serializers.ModelSerializer):
    """Farmer profile details."""
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.CharField(source='user.email', read_only=True)
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    last_name = serializers.CharField(source='user.last_name', read_only=True)

    class Meta:
        model = FarmerProfile
        fields = ['username', 'email', 'first_name', 'last_name',
                  'phone', 'location', 'preferred_language', 'created_at']
        read_only_fields = ['created_at']


class PredictionInputSerializer(serializers.Serializer):
    """Validates soil and climate parameters for prediction."""
    nitrogen = serializers.FloatField(min_value=0, max_value=300)
    phosphorus = serializers.FloatField(min_value=0, max_value=200)
    potassium = serializers.FloatField(min_value=0, max_value=250)
    temperature = serializers.FloatField(min_value=-10, max_value=60)
    humidity = serializers.FloatField(min_value=0, max_value=100)
    ph = serializers.FloatField(min_value=0, max_value=14)
    rainfall = serializers.FloatField(min_value=0, max_value=500)


class WeatherInputSerializer(serializers.Serializer):
    """Validates weather query parameters."""
    latitude = serializers.FloatField(default=18.30)
    longitude = serializers.FloatField(default=83.90)
