# 🌱 Quantum-Enhanced Data-Driven Soil Analysis & Multi-Crop Recommendation System

An intelligent, full-stack agricultural decision support platform that combines **Quantum Machine Learning (QSVM, Quantum Random Forest)**, classical machine learning ensembles, and real-time environmental data to deliver high-accuracy crop recommendations, soil health scoring, nutrient deficiency diagnostics, and SHAP explainability.

---

## 🚀 Key Highlights

- **Quantum Machine Learning**: Quantum-kernel SVM (QSVM) and Quantum Random Forest (QRF) utilizing parameterized quantum circuits and quantum kernels.
- **Multi-Model Suite**: 20+ ML models including Ensemble Voting, Stacked Generalization, LightGBM, XGBoost, CatBoost/Gradient Boosting, Deep MLPs, and LSTM hybrids.
- **Soil Health Index & Nutrient Diagnostics**: Computes dynamic NPK balance gauges, pH/temperature/humidity ratings, and customized soil correction plans.
- **SHAP Explainability**: Visual feature importance highlighting key environmental and nutrient drivers behind every recommendation.
- **Automated Weather Integration**: Live weather fetching based on geographic coordinates or city lookup.
- **Multilingual Support**: Interactive interface supporting English, Hindi, Telugu, Tamil, and more.
- **Role-Based Auth & Dashboard**: User authentication (Email OTP + Password), farmer history management, and administrative model performance dashboard.

---

## 🏗️ Architecture & Tech Stack

### Backend
- **Framework**: Django & Django REST Framework (DRF)
- **Quantum & ML**: Qiskit, Scikit-learn, XGBoost, LightGBM, SHAP, Joblib
- **Database**: SQLite (Development) / PostgreSQL compatible

### Frontend
- **Framework**: React 18 with Vite
- **Styling**: Modern responsive Glassmorphism CSS with CSS Variables
- **Visualizations**: Lucide Icons, Recharts, Custom SVG Gauges

---

## 📂 Project Structure

```
├── backend/
│   ├── api/                    # Django app: ML inference, authentication, history
│   │   ├── ml/                 # ML pipelines (QSVM, QRF, Ensembles, SHAP, Preprocessing)
│   │   ├── models.py           # Database models
│   │   ├── serializers.py      # DRF serializers
│   │   ├── views.py            # API ViewSets & endpoints
│   │   └── urls.py             # App routing
│   ├── quantum_soil/           # Django project configuration
│   ├── trained_models/         # Pretrained ML & Quantum models (Git LFS tracked)
│   ├── manage.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/         # React UI components (Dashboard, Form, Gauges, Auth)
│   │   ├── services/           # Axios API connectors
│   │   ├── i18n/               # Localization
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
├── DATASETS/
│   └── Crop_recommendation.csv # Training & validation dataset
└── README.md
```

---

## ⚡ Quickstart Guide

### 1. Prerequisites
- Python 3.10+
- Node.js 18+ and npm
- Git & Git LFS (`git lfs install`)

### 2. Backend Setup
```bash
cd backend
python -m venv venv
# Activate virtual environment:
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

---

## 📜 License
This project is developed for academic and research purposes.
