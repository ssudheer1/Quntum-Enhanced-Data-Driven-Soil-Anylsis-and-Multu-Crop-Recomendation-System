"""
API URL Configuration
Maps all API endpoints to their respective views.
"""

from django.urls import path
from api import views

urlpatterns = [
    # ── Auth: Signup (email OTP) ──
    path('signup/send-otp/', views.signup_send_otp, name='signup_send_otp'),
    path('signup/verify-otp/', views.signup_verify_otp, name='signup_verify_otp'),

    # ── Auth: Login (email OTP) — MUST come before 'login/' ──
    path('login/send-otp/', views.login_send_otp, name='login_send_otp'),
    path('login/verify-otp/', views.login_verify_otp, name='login_verify_otp'),

    # ── Auth: Password login (fallback) ──
    path('register/', views.register, name='register'),
    path('login/', views.login, name='login'),

    # ── Profile ──
    path('profile/', views.get_profile, name='profile'),

    # ── Prediction ──
    path('predict/', views.predict, name='predict'),
    path('predict/<str:model_name>/', views.predict_with_model, name='predict_with_model'),

    # ── Training ──
    path('train/', views.train_models, name='train_models'),

    # ── Model comparison ──
    path('model-comparison/', views.model_comparison, name='model_comparison'),

    # ── Weather ──
    path('weather/', views.weather, name='weather'),

    # ── Health check ──
    path('health/', views.health_check, name='health_check'),

    # ── History ──
    path('history/', views.prediction_history, name='prediction_history'),

    # ── Admin Dashboard APIs ──
    path('admin/stats/', views.admin_stats, name='admin_stats'),
    path('admin/users/', views.admin_users, name='admin_users'),
    path('admin/training-details/', views.admin_training_details, name='admin_training_details'),

    # ── Yield Dataset + K-Fold ──
    path('yield-comparison/', views.yield_comparison, name='yield_comparison'),
    path('kfold-results/', views.kfold_results, name='kfold_results'),
    path('predict-yield/', views.predict_yield, name='predict_yield'),

    # ── Srikakulam Soil Health ──
    path('srikakulam-analysis/', views.srikakulam_analysis, name='srikakulam_analysis'),
    path('predict-srikakulam/', views.predict_srikakulam, name='predict_srikakulam'),

    # ── Agri Yield Prediction (46 features) ──
    path('predict-agri-yield/', views.predict_agri_yield, name='predict_agri_yield'),
    path('agri-yield-options/', views.agri_yield_options, name='agri_yield_options'),
]
