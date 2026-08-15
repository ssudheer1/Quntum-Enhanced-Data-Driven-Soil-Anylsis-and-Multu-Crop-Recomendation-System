from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
import random
import string


class EmailOTP(models.Model):
    """Stores OTPs sent via email for signup/login verification."""
    PURPOSE_CHOICES = [
        ('signup', 'Signup Verification'),
        ('login', 'Login Verification'),
    ]

    email = models.EmailField()
    otp = models.CharField(max_length=6)
    purpose = models.CharField(max_length=10, choices=PURPOSE_CHOICES)
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"OTP for {self.email} ({self.purpose}) - {'Used' if self.is_verified else 'Active'}"

    def is_expired(self):
        return timezone.now() > self.expires_at

    @staticmethod
    def generate_otp():
        return ''.join(random.choices(string.digits, k=6))

    @classmethod
    def create_otp(cls, email, purpose='login', expiry_minutes=5):
        """Create a new OTP, invalidating any previous ones for this email+purpose."""
        # Invalidate old OTPs
        cls.objects.filter(email=email, purpose=purpose, is_verified=False).delete()
        # Create new
        otp_code = cls.generate_otp()
        expires = timezone.now() + timezone.timedelta(minutes=expiry_minutes)
        return cls.objects.create(email=email, otp=otp_code, purpose=purpose, expires_at=expires)

    @classmethod
    def verify_otp(cls, email, otp_code, purpose='login'):
        """Verify an OTP. Returns True if valid, False otherwise."""
        try:
            otp_obj = cls.objects.filter(
                email=email, otp=otp_code, purpose=purpose, is_verified=False
            ).latest('created_at')
        except cls.DoesNotExist:
            return False, "Invalid OTP"

        if otp_obj.is_expired():
            otp_obj.delete()
            return False, "OTP expired. Please request a new one."

        otp_obj.is_verified = True
        otp_obj.save()
        return True, "OTP verified successfully"


class FarmerProfile(models.Model):
    """Extended profile for farmers."""
    LANGUAGE_CHOICES = [
        ('en', 'English'),
        ('te', 'Telugu'),
        ('hi', 'Hindi'),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    phone = models.CharField(max_length=15, blank=True)
    location = models.CharField(max_length=200, blank=True)
    preferred_language = models.CharField(max_length=2, choices=LANGUAGE_CHOICES, default='en')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.get_preferred_language_display()}"


class PredictionHistory(models.Model):
    """Stores history of predictions made by the system."""
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='predictions')
    nitrogen = models.FloatField()
    phosphorus = models.FloatField()
    potassium = models.FloatField()
    temperature = models.FloatField()
    humidity = models.FloatField()
    ph = models.FloatField()
    rainfall = models.FloatField()
    recommended_crop = models.CharField(max_length=100)
    confidence = models.FloatField()
    soil_health_score = models.FloatField()
    model_used = models.CharField(max_length=100, default='stacked_ensemble')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name_plural = 'Prediction Histories'

    def __str__(self):
        return f"{self.recommended_crop} ({self.confidence:.2%}) - {self.created_at}"
