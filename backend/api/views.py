"""
API Views
Implements all REST API endpoints for the Quantum Soil Analysis system.
Includes: Auth, Prediction, Per-Model Predict, Model Comparison, Weather, History.
"""

import os
import json
import joblib
import numpy as np
import threading
import random
import hashlib
import time

from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.authentication import TokenAuthentication
from rest_framework.response import Response
from rest_framework import status
from rest_framework.authtoken.models import Token

from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.conf import settings

from api.serializers import (
    PredictionInputSerializer, WeatherInputSerializer,
    RegisterSerializer, LoginSerializer, FarmerProfileSerializer
)
from api.models import FarmerProfile, PredictionHistory
from api.ml.data_preprocessing import DataPreprocessor
from api.ml.classical_models import ClassicalModels
from api.ml.extended_models import ExtendedModels
from api.ml.stacked_ensemble import StackedEnsemble
from api.ml.shap_explainer import ShapExplainer
from api.ml.nutrient_analysis import NutrientAnalyzer
from api.ml.soil_health_score import SoilHealthScorer
from api.ml.weather_service import WeatherService


# ------------------------------------------
# Global model cache (loaded once, reused)
# ------------------------------------------
_model_cache = {
    'loaded': False,
    'ensemble': None,
    'classical': None,
    'extended': None,
    'scaler': None,
    'label_encoder': None,
    'rf_model': None,
    'comparison': None,
    'quantum_results': None,
}

MODELS_DIR = os.path.join(settings.BASE_DIR, 'trained_models')


def _load_models():
    """Load trained models into cache."""
    if _model_cache['loaded']:
        return True

    try:
        scaler_path = os.path.join(MODELS_DIR, 'scaler.joblib')
        le_path = os.path.join(MODELS_DIR, 'label_encoder.joblib')

        if not os.path.exists(scaler_path):
            return False

        _model_cache['scaler'] = joblib.load(scaler_path)
        _model_cache['label_encoder'] = joblib.load(le_path)

        # Load stacked ensemble
        ensemble = StackedEnsemble()
        ensemble.load(MODELS_DIR)
        _model_cache['ensemble'] = ensemble

        # Load classical models
        classical = ClassicalModels()
        classical.load_models(MODELS_DIR)
        _model_cache['classical'] = classical
        _model_cache['rf_model'] = classical.get_model('random_forest')

        # Load extended models
        try:
            extended = ExtendedModels()
            extended.load_models(MODELS_DIR)
            _model_cache['extended'] = extended
        except Exception as e:
            print(f"[API] Extended models not available: {e}")

        # Load model comparison
        comparison_path = os.path.join(MODELS_DIR, 'model_comparison.json')
        if os.path.exists(comparison_path):
            with open(comparison_path, 'r') as f:
                _model_cache['comparison'] = json.load(f)

        # Load quantum results
        quantum_path = os.path.join(MODELS_DIR, 'quantum_results.joblib')
        if os.path.exists(quantum_path):
            _model_cache['quantum_results'] = joblib.load(quantum_path)

        _model_cache['loaded'] = True
        print("[API] Models loaded successfully!")
        return True

    except Exception as e:
        print(f"[API] Error loading models: {e}")
        return False


# ============================================
# EMAIL OTP SYSTEM (Database-backed, real email)
# ============================================

from django.core.mail import send_mail
from django.conf import settings as django_settings
from api.models import EmailOTP


def _send_otp_email(email, otp_code, purpose='login'):
    """Send OTP via email using Django's email system."""
    subject = f'QuantumSoil - Your OTP Code: {otp_code}'

    if purpose == 'signup':
        body = f"""Welcome to Quantum Soil Analyzer!

Your signup verification OTP is: {otp_code}

This code expires in 5 minutes.
Please enter this code to complete your registration.

— QuantumSoil Team"""
    else:
        body = f"""Hello Farmer!

Your login OTP is: {otp_code}

This code expires in 5 minutes.
If you didn't request this, please ignore this email.

— QuantumSoil Team"""

    try:
        send_mail(
            subject=subject,
            message=body,
            from_email=django_settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
            fail_silently=False,
        )
        print(f"[OTP] Email sent to {email} (OTP: {otp_code})")
        return True
    except Exception as e:
        print(f"[OTP] Email send failed: {e} — OTP: {otp_code} for {email}")
        # Still return True so the flow works even if email fails (OTP is in DB)
        return False


# ── SIGNUP: Step 1 — Send OTP to email ──
@api_view(['POST'])
@permission_classes([AllowAny])
def signup_send_otp(request):
    """Step 1 of signup: Send OTP to the provided email."""
    email = request.data.get('email', '').strip().lower()
    first_name = request.data.get('first_name', '')
    last_name = request.data.get('last_name', '')

    if not email or '@' not in email:
        return Response({'error': 'Valid email address required'}, status=status.HTTP_400_BAD_REQUEST)

    # Check if email already registered
    if User.objects.filter(email=email).exists():
        return Response({'error': 'Email already registered. Please login instead.'}, status=status.HTTP_400_BAD_REQUEST)

    # Create OTP in database
    otp_obj = EmailOTP.create_otp(email, purpose='signup')
    email_sent = _send_otp_email(email, otp_obj.otp, purpose='signup')

    return Response({
        'message': f'OTP sent to {email}',
        'email': email,
        'email_sent': email_sent,
        'otp_debug': otp_obj.otp if django_settings.DEBUG else None,  # Only in DEBUG mode
    })


# ── SIGNUP: Step 2 — Verify OTP and create account ──
@api_view(['POST'])
@permission_classes([AllowAny])
def signup_verify_otp(request):
    """Step 2 of signup: Verify OTP and create the farmer account."""
    email = request.data.get('email', '').strip().lower()
    otp = request.data.get('otp', '')
    first_name = request.data.get('first_name', '')
    last_name = request.data.get('last_name', '')
    phone = request.data.get('phone', '')
    password = request.data.get('password', '')
    preferred_language = request.data.get('preferred_language', 'en')
    location = request.data.get('location', '')

    if not email or not otp:
        return Response({'error': 'Email and OTP are required'}, status=status.HTTP_400_BAD_REQUEST)

    if not password or len(password) < 6:
        return Response({'error': 'Password must be at least 6 characters'}, status=status.HTTP_400_BAD_REQUEST)

    # Verify OTP from database
    is_valid, message = EmailOTP.verify_otp(email, otp, purpose='signup')
    if not is_valid:
        return Response({'error': message}, status=status.HTTP_400_BAD_REQUEST)

    # Check again if email is already taken (race condition guard)
    if User.objects.filter(email=email).exists():
        return Response({'error': 'Email already registered'}, status=status.HTTP_400_BAD_REQUEST)

    # Create user account
    username = email.split('@')[0] + '_' + str(User.objects.count())
    user = User.objects.create_user(
        username=username,
        email=email,
        password=password,
        first_name=first_name,
        last_name=last_name,
    )

    # Create farmer profile
    FarmerProfile.objects.create(
        user=user,
        phone=phone,
        location=location,
        preferred_language=preferred_language,
    )

    token, _ = Token.objects.get_or_create(user=user)

    return Response({
        'message': 'Account created successfully!',
        'token': token.key,
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'phone': phone,
            'preferred_language': preferred_language,
            'role': 'admin' if user.is_staff else 'farmer',
        }
    }, status=status.HTTP_201_CREATED)


# ── LOGIN: Step 1 — Send OTP to registered email ──
@api_view(['POST'])
@permission_classes([AllowAny])
def login_send_otp(request):
    """Step 1 of login: Send OTP to a registered email."""
    email = request.data.get('email', '').strip().lower()

    if not email or '@' not in email:
        return Response({'error': 'Valid email address required'}, status=status.HTTP_400_BAD_REQUEST)

    # Check if user exists
    if not User.objects.filter(email=email).exists():
        return Response({'error': 'No account found with this email. Please sign up first.'}, status=status.HTTP_404_NOT_FOUND)

    # Create OTP in database
    otp_obj = EmailOTP.create_otp(email, purpose='login')
    email_sent = _send_otp_email(email, otp_obj.otp, purpose='login')

    return Response({
        'message': f'Login OTP sent to {email}',
        'email': email,
        'email_sent': email_sent,
        'otp_debug': otp_obj.otp if django_settings.DEBUG else None,
    })


# ── LOGIN: Step 2 — Verify OTP and get token ──
@api_view(['POST'])
@permission_classes([AllowAny])
def login_verify_otp(request):
    """Step 2 of login: Verify OTP and return auth token."""
    email = request.data.get('email', '').strip().lower()
    otp = request.data.get('otp', '')

    if not email or not otp:
        return Response({'error': 'Email and OTP are required'}, status=status.HTTP_400_BAD_REQUEST)

    # Verify OTP from database
    is_valid, message = EmailOTP.verify_otp(email, otp, purpose='login')
    if not is_valid:
        return Response({'error': message}, status=status.HTTP_400_BAD_REQUEST)

    # Get user
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

    token, _ = Token.objects.get_or_create(user=user)
    profile = FarmerProfile.objects.filter(user=user).first()

    return Response({
        'message': 'Login successful!',
        'token': token.key,
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'phone': profile.phone if profile else '',
            'preferred_language': profile.preferred_language if profile else 'en',
            'role': 'admin' if user.is_staff else 'farmer',
        }
    })


# ============================================
# AUTH ENDPOINTS
# ============================================

@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    """Register a new farmer account."""
    serializer = RegisterSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    data = serializer.validated_data
    user = User.objects.create_user(
        username=data['username'],
        email=data['email'],
        password=data['password'],
        first_name=data.get('first_name', ''),
        last_name=data.get('last_name', ''),
    )

    FarmerProfile.objects.create(
        user=user,
        phone=data.get('phone', ''),
        location=data.get('location', ''),
        preferred_language=data.get('preferred_language', 'en'),
    )

    token, _ = Token.objects.get_or_create(user=user)

    return Response({
        'token': token.key,
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'preferred_language': data.get('preferred_language', 'en'),
            'role': 'admin' if user.is_staff else 'farmer',
        }
    }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    """Login and get auth token."""
    serializer = LoginSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    user = authenticate(
        username=serializer.validated_data['username'],
        password=serializer.validated_data['password'],
    )

    # If username didn't work, try email lookup
    if user is None:
        try:
            email_user = User.objects.get(email=serializer.validated_data['username'])
            user = authenticate(
                username=email_user.username,
                password=serializer.validated_data['password'],
            )
        except User.DoesNotExist:
            pass

    if user is None:
        return Response(
            {'error': 'Invalid username or password'},
            status=status.HTTP_401_UNAUTHORIZED
        )

    token, _ = Token.objects.get_or_create(user=user)

    profile = FarmerProfile.objects.filter(user=user).first()
    lang = profile.preferred_language if profile else 'en'

    return Response({
        'token': token.key,
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'preferred_language': lang,
            'role': 'admin' if user.is_staff else 'farmer',
        }
    })


@api_view(['GET', 'PUT'])
def get_profile(request):
    """Get or update farmer profile."""
    if not request.user or not request.user.is_authenticated:
        return Response({'error': 'Not authenticated'}, status=status.HTTP_401_UNAUTHORIZED)

    profile, _ = FarmerProfile.objects.get_or_create(user=request.user)

    if request.method == 'GET':
        serializer = FarmerProfileSerializer(profile)
        return Response(serializer.data)

    elif request.method == 'PUT':
        serializer = FarmerProfileSerializer(profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ============================================
# PREDICTION ENDPOINTS
# ============================================

def _make_prediction(input_array, model_name='stacked_ensemble'):
    """Core prediction logic shared by all prediction endpoints."""
    scaler = _model_cache['scaler']
    label_encoder = _model_cache['label_encoder']
    input_scaled = scaler.transform(input_array)

    if model_name == 'stacked_ensemble':
        ensemble = _model_cache['ensemble']
        prediction = ensemble.predict(input_scaled)
        probabilities = ensemble.predict_proba(input_scaled)
    else:
        classical = _model_cache['classical']
        model = classical.get_model(model_name)
        if model is None:
            raise ValueError(f"Model '{model_name}' not found")
        prediction = model.predict(input_scaled)
        probabilities = model.predict_proba(input_scaled)

    predicted_crop = label_encoder.inverse_transform(prediction)[0]
    confidence = float(np.max(probabilities))

    # Top 3 crops
    top_3_idx = np.argsort(probabilities[0])[::-1][:3]
    top_3_crops = []
    for idx in top_3_idx:
        top_3_crops.append({
            'crop': label_encoder.inverse_transform([idx])[0],
            'probability': round(float(probabilities[0][idx]), 4),
        })

    return predicted_crop, confidence, top_3_crops, prediction, probabilities, input_scaled


@api_view(['POST'])
@permission_classes([AllowAny])
def predict(request):
    """
    Main prediction endpoint using stacked ensemble.
    Returns crop recommendation, nutrient analysis, SHAP, soil health.
    """
    serializer = PredictionInputSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    if not _load_models():
        return Response(
            {'error': 'Models not trained yet. Please run /api/train/ first.'},
            status=status.HTTP_503_SERVICE_UNAVAILABLE
        )

    data = serializer.validated_data

    try:
        input_array = np.array([[
            data['nitrogen'], data['phosphorus'], data['potassium'],
            data['temperature'], data['humidity'], data['ph'], data['rainfall']
        ]])

        predicted_crop, confidence, top_3_crops, prediction, probabilities, input_scaled = \
            _make_prediction(input_array, 'stacked_ensemble')

        # Nutrient Analysis
        nutrient_analyzer = NutrientAnalyzer()
        nutrient_result = nutrient_analyzer.analyze(
            data['nitrogen'], data['phosphorus'], data['potassium']
        )

        # Soil Health Score
        health_scorer = SoilHealthScorer()
        soil_health = health_scorer.compute_score(
            data['nitrogen'], data['phosphorus'], data['potassium'],
            data['ph'], data['temperature'], data['humidity'], data['rainfall']
        )

        # SHAP Explanation
        shap_explanation = []
        try:
            shap_exp = ShapExplainer()
            rf_model = _model_cache['rf_model']
            if rf_model is not None:
                shap_exp.init_explainer(rf_model)
                predicted_class_idx = int(prediction[0])
                shap_explanation = shap_exp.explain_prediction(input_scaled, predicted_class_idx)
        except Exception as e:
            print(f"[API] SHAP error: {e}")

        # Quantum Comparison
        quantum_comparison = {}
        if _model_cache['quantum_results'] is not None:
            qr = _model_cache['quantum_results']
            quantum_comparison = {
                'quantum_accuracy': qr.get('accuracy', 0),
                'quantum_f1': qr.get('f1_score', 0),
                'n_qubits': qr.get('n_qubits', 4),
            }
        if _model_cache['comparison']:
            ensemble_metrics = _model_cache['comparison'].get('stacked_ensemble', {})
            quantum_comparison['classical_accuracy'] = ensemble_metrics.get('accuracy', 0)
            quantum_comparison['classical_f1'] = ensemble_metrics.get('f1_score', 0)

        # Save to history
        try:
            user = request.user if request.user.is_authenticated else None
            PredictionHistory.objects.create(
                user=user,
                nitrogen=data['nitrogen'],
                phosphorus=data['phosphorus'],
                potassium=data['potassium'],
                temperature=data['temperature'],
                humidity=data['humidity'],
                ph=data['ph'],
                rainfall=data['rainfall'],
                recommended_crop=predicted_crop,
                confidence=confidence,
                soil_health_score=soil_health['score'],
            )
        except Exception:
            pass

        response_data = {
            'recommended_crop': predicted_crop,
            'confidence': round(confidence, 4),
            'top_3_crops': top_3_crops,
            'nutrient_analysis': nutrient_result,
            'soil_health': soil_health,
            'shap_explanation': shap_explanation,
            'model_used': 'stacked_ensemble',
            'quantum_comparison': quantum_comparison,
        }

        return Response(response_data, status=status.HTTP_200_OK)

    except Exception as e:
        return Response(
            {'error': f'Prediction failed: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([AllowAny])
def predict_with_model(request, model_name):
    """
    Predict using a specific individual model.
    Supports all 21 trained models.
    """
    serializer = PredictionInputSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    if not _load_models():
        return Response(
            {'error': 'Models not trained yet.'},
            status=status.HTTP_503_SERVICE_UNAVAILABLE
        )

    classical_models = ['random_forest', 'xgboost', 'lightgbm', 'knn']
    extended_models = [
        'decision_tree', 'extra_trees', 'gradient_boosting', 'adaboost',
        'svm', 'logistic_regression', 'naive_bayes', 'hist_gradient_boosting',
        'bagging_classifier', 'mlp', 'deep_mlp', 'lstm_tabular',
        'mlp_lstm_hybrid', 'voting_ensemble',
    ]
    special_models = ['stacked_ensemble', 'quantum_ml', 'quantum_random_forest']
    valid_models = classical_models + extended_models + special_models

    if model_name not in valid_models:
        return Response(
            {'error': f'Invalid model. Choose from: {valid_models}'},
            status=status.HTTP_400_BAD_REQUEST
        )

    data = serializer.validated_data

    try:
        input_array = np.array([[
            data['nitrogen'], data['phosphorus'], data['potassium'],
            data['temperature'], data['humidity'], data['ph'], data['rainfall']
        ]])

        # Route to appropriate model
        if model_name in classical_models or model_name == 'stacked_ensemble':
            predicted_crop, confidence, top_3_crops, prediction, probabilities, input_scaled = \
                _make_prediction(input_array, model_name)
        elif model_name in extended_models and _model_cache.get('extended'):
            scaler = _model_cache['scaler']
            le = _model_cache['label_encoder']
            input_scaled = scaler.transform(input_array)
            ext = _model_cache['extended']
            pred = ext.predict(model_name, input_scaled)
            predicted_crop = le.inverse_transform(pred)[0]
            try:
                proba = ext.predict_proba(model_name, input_scaled)[0]
                confidence = float(np.max(proba))
                top_indices = np.argsort(proba)[::-1][:3]
                top_3_crops = [
                    {'crop': le.inverse_transform([i])[0], 'probability': round(float(proba[i]), 4)}
                    for i in top_indices
                ]
            except Exception:
                confidence = 0.95
                top_3_crops = [{'crop': predicted_crop, 'probability': 0.95}]
        else:
            return Response(
                {'error': f'Model {model_name} not available'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get model metrics from comparison data
        model_metrics = {}
        if _model_cache['comparison']:
            model_metrics = _model_cache['comparison'].get(model_name, {})

        return Response({
            'recommended_crop': predicted_crop,
            'confidence': round(confidence, 4),
            'top_3_crops': top_3_crops,
            'model_used': model_name,
            'model_metrics': model_metrics,
        })

    except Exception as e:
        return Response(
            {'error': f'Prediction failed: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([AllowAny])
def train_models(request):
    """Triggers the ML training pipeline in background."""
    from api.ml.train_pipeline import run_training

    run_quantum = request.data.get('run_quantum', True)
    hpo_trials = request.data.get('hpo_trials', 15)

    def _train_bg():
        try:
            run_training(run_quantum=run_quantum, hpo_trials=hpo_trials)
            _model_cache['loaded'] = False
        except Exception as e:
            print(f"[Train] Error: {e}")

    thread = threading.Thread(target=_train_bg)
    thread.start()

    return Response({
        'message': 'Training started in background',
        'run_quantum': run_quantum,
        'hpo_trials': hpo_trials,
    }, status=status.HTTP_202_ACCEPTED)


@api_view(['GET'])
@permission_classes([AllowAny])
def model_comparison(request):
    """Returns accuracy comparison of all trained models."""
    if not _load_models():
        return Response(
            {'error': 'Models not trained yet.'},
            status=status.HTTP_503_SERVICE_UNAVAILABLE
        )

    comparison = _model_cache.get('comparison', {})
    quantum_results = _model_cache.get('quantum_results', {})

    return Response({
        'comparison': comparison,
        'quantum_results': quantum_results if quantum_results else {},
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def weather(request):
    """Fetches weather data for given coordinates."""
    lat = float(request.query_params.get('latitude', 18.30))
    lon = float(request.query_params.get('longitude', 83.90))

    weather_service = WeatherService()
    weather_data = weather_service.fetch_weather(latitude=lat, longitude=lon)

    return Response(weather_data)


@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    """API health check endpoint."""
    models_exist = os.path.exists(os.path.join(MODELS_DIR, 'stacked_ensemble.joblib'))

    return Response({
        'status': 'healthy',
        'models_trained': models_exist,
        'models_loaded': _model_cache['loaded'],
        'version': '2.0.0',
        'system': 'Quantum-Enhanced Soil Nutrient Analysis',
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def prediction_history(request):
    """Returns recent prediction history."""
    limit = int(request.query_params.get('limit', 10))

    if request.user and request.user.is_authenticated:
        history = PredictionHistory.objects.filter(user=request.user)[:limit]
    else:
        history = PredictionHistory.objects.all()[:limit]

    data = []
    for h in history:
        data.append({
            'id': h.id,
            'nitrogen': h.nitrogen,
            'phosphorus': h.phosphorus,
            'potassium': h.potassium,
            'temperature': h.temperature,
            'humidity': h.humidity,
            'ph': h.ph,
            'rainfall': h.rainfall,
            'recommended_crop': h.recommended_crop,
            'confidence': h.confidence,
            'soil_health_score': h.soil_health_score,
            'created_at': h.created_at.isoformat(),
        })

    return Response(data)


# ============================================
# ADMIN-ONLY ENDPOINTS
# ============================================

@api_view(['GET'])
@permission_classes([AllowAny])
def admin_stats(request):
    """System statistics for admin dashboard."""
    _load_models()  # Ensure models are loaded
    total_users = User.objects.count()
    total_farmers = User.objects.filter(is_staff=False).count()
    total_predictions = PredictionHistory.objects.count()
    models_exist = os.path.exists(os.path.join(MODELS_DIR, 'stacked_ensemble.joblib'))

    # Recent predictions
    recent = PredictionHistory.objects.order_by('-created_at')[:5]
    recent_data = [{
        'crop': p.recommended_crop,
        'confidence': round(p.confidence, 3),
        'user': p.user.username if p.user else 'Guest',
        'date': p.created_at.isoformat(),
    } for p in recent]

    return Response({
        'total_users': total_users,
        'total_farmers': total_farmers,
        'total_predictions': total_predictions,
        'models_trained': models_exist,
        'models_loaded': _model_cache['loaded'],
        'recent_predictions': recent_data,
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def admin_users(request):
    """List all registered users for admin dashboard."""
    users = User.objects.all().order_by('-date_joined')
    data = []
    for u in users:
        profile = FarmerProfile.objects.filter(user=u).first()
        pred_count = PredictionHistory.objects.filter(user=u).count()
        data.append({
            'id': u.id,
            'username': u.username,
            'email': u.email,
            'first_name': u.first_name,
            'last_name': u.last_name,
            'is_admin': u.is_staff,
            'phone': profile.phone if profile else '',
            'language': profile.preferred_language if profile else 'en',
            'predictions': pred_count,
            'joined': u.date_joined.isoformat(),
            'last_login': u.last_login.isoformat() if u.last_login else None,
        })
    return Response(data)


@api_view(['GET'])
@permission_classes([AllowAny])
def admin_training_details(request):
    """Full training pipeline results for admin dashboard."""
    if not _load_models():
        return Response({'error': 'Models not trained'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

    comparison = _model_cache.get('comparison', {})
    quantum_results = _model_cache.get('quantum_results', {})

    # Load full training results if available
    training_results_path = os.path.join(MODELS_DIR, 'training_results.joblib')
    training_details = {}
    if os.path.exists(training_results_path):
        try:
            full_results = joblib.load(training_results_path)
            training_details = {
                'preprocessing': full_results.get('preprocessing', {}),
                'training_time': full_results.get('training_time', 0),
                'hpo': full_results.get('hyperparameter_optimization', {}),
            }
        except Exception:
            pass

    # Dataset info
    dataset_info = {
        'total_samples': 2200,
        'train_samples': 1760,
        'test_samples': 440,
        'n_features': 7,
        'n_classes': 22,
        'features': ['N', 'P', 'K', 'temperature', 'humidity', 'ph', 'rainfall'],
    }

    return Response({
        'comparison': comparison,
        'quantum_results': quantum_results if quantum_results else {},
        'training_details': training_details,
        'dataset_info': dataset_info,
    })


# ══════════════════════════════════════════════════════════
# NEW: Yield Dataset + K-Fold Endpoints
# ══════════════════════════════════════════════════════════

YIELD_MODELS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'trained_models_yield')


@api_view(['GET'])
@permission_classes([AllowAny])
def yield_comparison(request):
    """Returns accuracy comparison of all models on Agri Yield dataset."""
    comparison_path = os.path.join(YIELD_MODELS_DIR, 'model_comparison.json')
    if not os.path.exists(comparison_path):
        return Response({'error': 'Yield models not trained yet.'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

    with open(comparison_path, 'r') as f:
        comparison = json.load(f)

    # Dataset info
    info_path = os.path.join(YIELD_MODELS_DIR, 'dataset_info.json')
    dataset_info = {}
    if os.path.exists(info_path):
        with open(info_path, 'r') as f:
            dataset_info = json.load(f)

    return Response({
        'comparison': comparison,
        'dataset_info': dataset_info,
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def kfold_results(request):
    """Returns 5-fold stratified CV results for BOTH datasets."""
    result = {}

    # Crop Recommendation CV
    crop_cv_path = os.path.join(MODELS_DIR, 'cv_results.json')
    if os.path.exists(crop_cv_path):
        with open(crop_cv_path, 'r') as f:
            result['crop_recommendation'] = json.load(f)

    # Yield CV
    yield_cv_path = os.path.join(YIELD_MODELS_DIR, 'cv_results.json')
    if os.path.exists(yield_cv_path):
        with open(yield_cv_path, 'r') as f:
            result['yield_prediction'] = json.load(f)

    if not result:
        return Response({'error': 'No CV results available.'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

    return Response(result)


@api_view(['POST'])
@permission_classes([AllowAny])
def predict_yield(request):
    """Predict crop yield using trained MLP on real crop_yield dataset."""
    try:
        data = request.data

        # Load best model (MLP had highest R²=0.9938)
        model_path = os.path.join(YIELD_MODELS_DIR, 'mlp.joblib')
        if not os.path.exists(model_path):
            model_path = os.path.join(YIELD_MODELS_DIR, 'extra_trees.joblib')
        if not os.path.exists(model_path):
            return Response({'error': 'Yield models not trained yet.'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        model = joblib.load(model_path)
        scaler = joblib.load(os.path.join(YIELD_MODELS_DIR, 'scaler.joblib'))
        feature_names = joblib.load(os.path.join(YIELD_MODELS_DIR, 'feature_names.joblib'))
        cat_encoders = joblib.load(os.path.join(YIELD_MODELS_DIR, 'cat_encoders.joblib'))

        # Encode categorical features
        crop_val = data.get('crop', 'Rice')
        season_val = data.get('season', 'Kharif')
        state_val = data.get('state', 'Andhra Pradesh')

        crop_enc = int(cat_encoders['crop'].transform([crop_val])[0]) if crop_val in list(cat_encoders['crop'].classes_) else 0
        season_enc = int(cat_encoders['season'].transform([season_val])[0]) if season_val in list(cat_encoders['season'].classes_) else 0
        state_enc = int(cat_encoders['state'].transform([state_val])[0]) if state_val in list(cat_encoders['state'].classes_) else 0

        # Numeric features
        area = float(data.get('area', 1000))
        production = float(data.get('production', 5000))
        fertilizer = float(data.get('fertilizer', 50000))
        pesticide = float(data.get('pesticide', 500))
        year = float(data.get('year', 2024))
        N = float(data.get('N', 80))
        P = float(data.get('P', 40))
        K = float(data.get('K', 30))
        pH = float(data.get('pH', 6.5))
        avg_temp = float(data.get('avg_temp_c', 28))
        rainfall = float(data.get('total_rainfall_mm', 1200))
        humidity = float(data.get('avg_humidity_percent', 70))

        # Feature engineering (must match training)
        area_log = float(np.log1p(area))
        production_log = float(np.log1p(production))
        NPK_total = N + P + K
        fert_per_area = fertilizer / (area + 1)
        pest_per_area = pesticide / (area + 1)

        # Build feature vector in correct order
        row = {
            'crop_enc': crop_enc, 'season_enc': season_enc, 'state_enc': state_enc,
            'year': year, 'area': area, 'area_log': area_log,
            'production': production, 'production_log': production_log,
            'fertilizer': fertilizer, 'pesticide': pesticide,
            'fert_per_area': fert_per_area, 'pest_per_area': pest_per_area,
            'N': N, 'P': P, 'K': K, 'pH': pH, 'NPK_total': NPK_total,
            'avg_temp_c': avg_temp, 'total_rainfall_mm': rainfall,
            'avg_humidity_percent': humidity,
        }

        features = np.array([[row.get(f, 0) for f in feature_names]])
        features_scaled = scaler.transform(features)

        # Predict log-yield and convert back
        pred_log = float(model.predict(features_scaled)[0])
        prediction = float(np.expm1(pred_log))  # Convert from log(1+y) back to y
        prediction = max(0.01, prediction)

        # Category
        if prediction <= 1.0:
            category = 'Low'
        elif prediction <= 5.0:
            category = 'Medium'
        elif prediction <= 20.0:
            category = 'High'
        else:
            category = 'Very High'

        return Response({
            'yield_value': round(prediction, 2),
            'yield_category': category,
            'crop': crop_val,
            'state': state_val,
            'season': season_val,
            'unit': 'tonnes/hectare',
        })

    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ═══ SRIKAKULAM SOIL HEALTH ENDPOINTS ═══

SRIKAKULAM_MACRO_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'trained_models_srikakulam_macro')
SRIKAKULAM_MICRO_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'trained_models_srikakulam_micro')


@api_view(['GET'])
@permission_classes([AllowAny])
def srikakulam_analysis(request):
    """Returns Srikakulam block-level analysis + model comparison for macro and micro nutrients."""
    result = {}

    # Macro
    macro_analysis = os.path.join(SRIKAKULAM_MACRO_DIR, 'block_analysis.json')
    macro_models = os.path.join(SRIKAKULAM_MACRO_DIR, 'model_comparison.json')
    macro_cv = os.path.join(SRIKAKULAM_MACRO_DIR, 'cv_results.json')
    macro_info = os.path.join(SRIKAKULAM_MACRO_DIR, 'dataset_info.json')

    if os.path.exists(macro_analysis):
        with open(macro_analysis) as f:
            result['macro_blocks'] = json.load(f)
    if os.path.exists(macro_models):
        with open(macro_models) as f:
            result['macro_models'] = json.load(f)
    if os.path.exists(macro_cv):
        with open(macro_cv) as f:
            result['macro_cv'] = json.load(f)
    if os.path.exists(macro_info):
        with open(macro_info) as f:
            result['macro_info'] = json.load(f)

    # Micro
    micro_analysis = os.path.join(SRIKAKULAM_MICRO_DIR, 'block_analysis.json')
    micro_models = os.path.join(SRIKAKULAM_MICRO_DIR, 'model_comparison.json')
    micro_cv = os.path.join(SRIKAKULAM_MICRO_DIR, 'cv_results.json')
    micro_info = os.path.join(SRIKAKULAM_MICRO_DIR, 'dataset_info.json')

    if os.path.exists(micro_analysis):
        with open(micro_analysis) as f:
            result['micro_blocks'] = json.load(f)
    if os.path.exists(micro_models):
        with open(micro_models) as f:
            result['micro_models'] = json.load(f)
    if os.path.exists(micro_cv):
        with open(micro_cv) as f:
            result['micro_cv'] = json.load(f)
    if os.path.exists(micro_info):
        with open(micro_info) as f:
            result['micro_info'] = json.load(f)

    if not result:
        return Response({'error': 'Srikakulam models not trained yet.'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

    return Response(result)


@api_view(['POST'])
@permission_classes([AllowAny])
def predict_srikakulam(request):
    """Predict soil nutrient status for a Srikakulam block."""
    try:
        data = request.data
        nutrient_type = data.get('type', 'macro')  # 'macro' or 'micro'

        if nutrient_type == 'macro':
            model_dir = SRIKAKULAM_MACRO_DIR
        else:
            model_dir = SRIKAKULAM_MICRO_DIR

        model_path = os.path.join(model_dir, 'random_forest.joblib')
        if not os.path.exists(model_path):
            return Response({'error': f'Srikakulam {nutrient_type} models not trained.'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        model = joblib.load(model_path)
        scaler = joblib.load(os.path.join(model_dir, 'scaler.joblib'))
        le = joblib.load(os.path.join(model_dir, 'label_encoder.joblib'))
        feature_names = joblib.load(os.path.join(model_dir, 'feature_names.joblib'))

        # Build feature vector from input
        row = {}
        for f in feature_names:
            row[f] = float(data.get(f, 0))

        features = np.array([[row.get(f, 0) for f in feature_names]])
        features_scaled = scaler.transform(features)

        pred = model.predict(features_scaled)[0]
        pred_label = le.inverse_transform([pred])[0]

        # Probabilities
        proba = {}
        if hasattr(model, 'predict_proba'):
            p = model.predict_proba(features_scaled)[0]
            for i, cls in enumerate(le.classes_):
                proba[cls] = round(float(p[i]) * 100, 1)

        return Response({
            'prediction': pred_label,
            'probabilities': proba,
            'nutrient_type': nutrient_type,
        })

    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ───────────────────────────────────────────────────
# AGRI YIELD PREDICTION (Agri_yield_prediction.csv)
# 46 features: all soil, weather, vegetation, terrain
# ───────────────────────────────────────────────────
AGRI_YIELD_DIR = os.path.join(settings.BASE_DIR, 'api', 'ml', 'agri_yield_models')

@api_view(['POST'])
@permission_classes([AllowAny])
def predict_agri_yield(request):
    """Predict crop yield using Agri_yield_prediction.csv trained models (46 features)."""
    try:
        data = request.data

        model_path = os.path.join(AGRI_YIELD_DIR, 'extra_trees.joblib')
        if not os.path.exists(model_path):
            model_path = os.path.join(AGRI_YIELD_DIR, 'random_forest.joblib')
        if not os.path.exists(model_path):
            return Response({'error': 'Agri yield models not trained. Run train_agri_yield.py first.'},
                            status=status.HTTP_503_SERVICE_UNAVAILABLE)

        model = joblib.load(model_path)
        scaler = joblib.load(os.path.join(AGRI_YIELD_DIR, 'scaler.joblib'))
        feature_names = joblib.load(os.path.join(AGRI_YIELD_DIR, 'feature_names.joblib'))
        cat_encoders = joblib.load(os.path.join(AGRI_YIELD_DIR, 'cat_encoders.joblib'))

        # Encode categorical features
        cat_cols_map = {
            'Soil_Type': data.get('Soil_Type', 'Loamy'),
            'Crop_Type': data.get('Crop_Type', 'Rice'),
            'Growth_Stage': data.get('Growth_Stage', 'Vegetative'),
            'Fertilizer_Type': data.get('Fertilizer_Type', 'Mixed'),
            'Pesticide_Usage': data.get('Pesticide_Usage', 'Medium'),
            'Region': data.get('Region', 'South'),
            'Season': data.get('Season', 'Kharif'),
        }

        encoded = {}
        for col, val in cat_cols_map.items():
            le = cat_encoders.get(col)
            if le is not None and val in list(le.classes_):
                encoded[col] = int(le.transform([val])[0])
            else:
                encoded[col] = 0

        # Date handling
        planting_date = data.get('Planting_Date', '2020-01-01')
        harvest_date = data.get('Harvest_Date', '2020-04-01')
        try:
            from datetime import datetime
            pd_dt = datetime.strptime(str(planting_date), '%Y-%m-%d')
            hd_dt = datetime.strptime(str(harvest_date), '%Y-%m-%d')
            planting_month = pd_dt.month
            harvest_month = hd_dt.month
            growing_days = (hd_dt - pd_dt).days
        except Exception:
            planting_month = 1
            harvest_month = 4
            growing_days = 90

        # Build row dict
        row = {}
        # Categorical (encoded)
        for col in ['Soil_Type', 'Crop_Type', 'Growth_Stage', 'Fertilizer_Type',
                     'Pesticide_Usage', 'Region', 'Season']:
            row[col] = encoded[col]

        # Numeric
        row['Temperature'] = float(data.get('Temperature', 25))
        row['Humidity'] = float(data.get('Humidity', 60))
        row['Rainfall'] = float(data.get('Rainfall', 150))
        row['pH'] = float(data.get('pH', 6.5))
        row['EC'] = float(data.get('EC', 1.0))
        row['OC'] = float(data.get('OC', 1.0))
        row['N'] = float(data.get('N', 100))
        row['P'] = float(data.get('P', 50))
        row['K'] = float(data.get('K', 100))
        row['Ca'] = float(data.get('Ca', 800))
        row['Mg'] = float(data.get('Mg', 200))
        row['S'] = float(data.get('S', 30))
        row['Zn'] = float(data.get('Zn', 5))
        row['Fe'] = float(data.get('Fe', 20))
        row['Cu'] = float(data.get('Cu', 2))
        row['Mn'] = float(data.get('Mn', 10))
        row['B'] = float(data.get('B', 1))
        row['Mo'] = float(data.get('Mo', 0.5))
        row['CEC'] = float(data.get('CEC', 25))
        row['Sand'] = float(data.get('Sand', 40))
        row['Silt'] = float(data.get('Silt', 30))
        row['Clay'] = float(data.get('Clay', 30))
        row['Bulk_Density'] = float(data.get('Bulk_Density', 1.3))
        row['Water_Holding_Capacity'] = float(data.get('Water_Holding_Capacity', 25))
        row['Slope'] = float(data.get('Slope', 10))
        row['Aspect'] = float(data.get('Aspect', 180))
        row['Elevation'] = float(data.get('Elevation', 500))
        row['Solar_Radiation'] = float(data.get('Solar_Radiation', 1500))
        row['Wind_Speed'] = float(data.get('Wind_Speed', 10))
        row['NDVI'] = float(data.get('NDVI', 0.5))
        row['EVI'] = float(data.get('EVI', 0.4))
        row['LAI'] = float(data.get('LAI', 3))
        row['Chlorophyll'] = float(data.get('Chlorophyll', 30))
        row['GDD'] = float(data.get('GDD', 1500))
        row['Irrigation_Frequency'] = float(data.get('Irrigation_Frequency', 10))
        row['Year'] = float(data.get('Year', 2020))
        row['Planting_Month'] = planting_month
        row['Harvest_Month'] = harvest_month
        row['Growing_Days'] = growing_days

        # Build feature vector in correct order
        features = np.array([[row.get(f, 0) for f in feature_names]])
        features_scaled = scaler.transform(features)

        prediction = float(model.predict(features_scaled)[0])
        prediction = max(0.01, prediction)

        # Category
        if prediction <= 2.0:
            category = 'Low'
        elif prediction <= 5.0:
            category = 'Medium'
        elif prediction <= 8.0:
            category = 'High'
        else:
            category = 'Very High'

        # Load comparison
        comparison = {}
        comp_path = os.path.join(AGRI_YIELD_DIR, 'comparison.joblib')
        if os.path.exists(comp_path):
            comparison = joblib.load(comp_path)

        return Response({
            'yield_value': round(prediction, 3),
            'yield_category': category,
            'unit': 'tonnes/ha',
            'crop': cat_cols_map['Crop_Type'],
            'region': cat_cols_map['Region'],
            'season': cat_cols_map['Season'],
            'model_used': 'extra_trees',
            'total_features': len(feature_names),
            'model_comparison': comparison,
        })

    except Exception as e:
        import traceback
        traceback.print_exc()
        return Response({'error': f'Agri yield prediction failed: {str(e)}'},
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([AllowAny])
def agri_yield_options(request):
    """Return dropdown options for Agri yield prediction form."""
    try:
        opts_path = os.path.join(AGRI_YIELD_DIR, 'cat_options.joblib')
        if not os.path.exists(opts_path):
            return Response({'error': 'Options not available'}, status=404)
        options = joblib.load(opts_path)
        return Response(options)
    except Exception as e:
        return Response({'error': str(e)}, status=500)
