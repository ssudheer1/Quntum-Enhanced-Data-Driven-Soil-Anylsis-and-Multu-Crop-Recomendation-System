"""Create the default admin user for the QuantumSoil system."""
import os, sys
os.environ['DJANGO_SETTINGS_MODULE'] = 'quantum_soil.settings'
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import django
django.setup()

from django.contrib.auth.models import User
from api.models import FarmerProfile

# Admin credentials
ADMIN_EMAIL = 'admin@49'
ADMIN_USERNAME = 'admin49'
ADMIN_PASSWORD = 'admin@49'

# Create or update admin
user, created = User.objects.get_or_create(
    username=ADMIN_USERNAME,
    defaults={
        'email': ADMIN_EMAIL,
        'first_name': 'Admin',
        'last_name': 'QuantumSoil',
        'is_staff': True,
        'is_superuser': True,
    }
)

if created:
    user.set_password(ADMIN_PASSWORD)
    user.save()
    FarmerProfile.objects.get_or_create(
        user=user,
        defaults={'phone': '', 'location': 'System', 'preferred_language': 'en'}
    )
    print(f"[Admin] Created admin user: {ADMIN_USERNAME} / {ADMIN_PASSWORD}")
else:
    user.is_staff = True
    user.is_superuser = True
    user.set_password(ADMIN_PASSWORD)
    user.save()
    print(f"[Admin] Updated existing admin user: {ADMIN_USERNAME}")

print("[Admin] Done!")
