"""
Django settings for quantum_soil project.
Quantum-Enhanced Soil Nutrient Analysis & Multi-Crop Recommendation System
"""

from pathlib import Path
import os

# Load .env file
try:
    from dotenv import load_dotenv
    load_dotenv(os.path.join(Path(__file__).resolve().parent.parent, '.env'))
except ImportError:
    pass  # python-dotenv not installed, use system env vars

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = 'django-insecure-quantum-soil-2024-dev-key-change-in-production'

DEBUG = True

ALLOWED_HOSTS = ['*']

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # Third party
    'rest_framework',
    'rest_framework.authtoken',
    'corsheaders',
    # Local
    'api',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'quantum_soil.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'quantum_soil.wsgi.application'

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Asia/Kolkata'
USE_I18N = True
USE_TZ = True

STATIC_URL = 'static/'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# CORS settings - allow React dev server
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

CORS_ALLOW_ALL_ORIGINS = True

# REST Framework
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.AllowAny',
    ],
}

# ML Model paths
TRAINED_MODELS_DIR = os.path.join(BASE_DIR, 'trained_models')
DATASET_PATH = os.path.join(BASE_DIR, '..', 'DATASETS', 'Crop_recommendation.csv')

# ── Email Configuration (Gmail SMTP) ──
# Reads from .env file: SMTP_USER, SMTP_PASS, SMTP_FROM
# To get an App Password: Google Account → Security → 2FA → App Passwords

_SMTP_ENABLED = os.environ.get('SMTP_ENABLED', 'false').lower() == 'true'
_SMTP_USER = os.environ.get('SMTP_USER', '')
_SMTP_PASS = os.environ.get('SMTP_PASS', '')
_SMTP_FROM = os.environ.get('SMTP_FROM', _SMTP_USER)

if _SMTP_ENABLED and _SMTP_USER and _SMTP_PASS:
    EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
    EMAIL_HOST = 'smtp.gmail.com'
    EMAIL_PORT = 587
    EMAIL_USE_TLS = True
    EMAIL_HOST_USER = _SMTP_USER
    EMAIL_HOST_PASSWORD = _SMTP_PASS
    DEFAULT_FROM_EMAIL = _SMTP_FROM
    print(f"[Settings] Email: Gmail SMTP configured ({_SMTP_USER})")
else:
    EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
    DEFAULT_FROM_EMAIL = 'quantumsoil@project.com'
    print("[Settings] Email: Using console backend (configure .env for real email)")

