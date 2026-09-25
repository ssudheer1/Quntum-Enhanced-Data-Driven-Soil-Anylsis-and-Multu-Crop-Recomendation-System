"""
Train ML models on Agri_yield_prediction.csv (46 features, 10K rows)
Features: Temperature, Humidity, Rainfall, Soil_Type, pH, EC, OC, N, P, K,
          Ca, Mg, S, Zn, Fe, Cu, Mn, B, Mo, CEC, Sand, Silt, Clay,
          Bulk_Density, Water_Holding_Capacity, Slope, Aspect, Elevation,
          Solar_Radiation, Wind_Speed, NDVI, EVI, LAI, Chlorophyll, GDD,
          Crop_Type, Planting_Date, Harvest_Date, Growth_Stage,
          Irrigation_Frequency, Fertilizer_Type, Pesticide_Usage,
          Yield (target), Region, Season, Year
"""
import os
import sys
import numpy as np
import pandas as pd
import joblib
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.ensemble import (
    RandomForestRegressor, ExtraTreesRegressor,
    GradientBoostingRegressor, HistGradientBoostingRegressor
)
from sklearn.neural_network import MLPRegressor
from sklearn.metrics import r2_score, mean_absolute_error, mean_squared_error

# Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_PATH = os.path.join(BASE_DIR, '..', 'DATASETS', 'Agri_yield_prediction.csv')
MODELS_DIR = os.path.join(BASE_DIR, 'api', 'ml', 'agri_yield_models')
os.makedirs(MODELS_DIR, exist_ok=True)

print("=" * 60)
print("  AGRI YIELD PREDICTION — MODEL TRAINING")
print("  Dataset: Agri_yield_prediction.csv (46 features)")
print("=" * 60)

# Load dataset
print("\n[1/5] Loading dataset...")
df = pd.read_csv(DATASET_PATH)
print(f"  Shape: {df.shape}")
print(f"  Columns: {list(df.columns)}")

# Separate target
y = df['Yield'].values

# Categorical columns to encode
CAT_COLS = ['Soil_Type', 'Crop_Type', 'Growth_Stage', 'Fertilizer_Type',
            'Pesticide_Usage', 'Region', 'Season']

# Date columns — extract month
df['Planting_Month'] = pd.to_datetime(df['Planting_Date'], errors='coerce').dt.month.fillna(1).astype(int)
df['Harvest_Month'] = pd.to_datetime(df['Harvest_Date'], errors='coerce').dt.month.fillna(4).astype(int)
df['Growing_Days'] = (pd.to_datetime(df['Harvest_Date'], errors='coerce') - pd.to_datetime(df['Planting_Date'], errors='coerce')).dt.days.fillna(90).astype(int)

# Drop original date columns and target
drop_cols = ['Yield', 'Planting_Date', 'Harvest_Date']
df_features = df.drop(columns=drop_cols)

# Encode categoricals
print("\n[2/5] Encoding categorical features...")
cat_encoders = {}
for col in CAT_COLS:
    le = LabelEncoder()
    df_features[col] = le.fit_transform(df_features[col].astype(str))
    cat_encoders[col] = le
    print(f"  {col}: {len(le.classes_)} classes — {list(le.classes_[:5])}...")

# All numeric features
NUMERIC_COLS = ['Temperature', 'Humidity', 'Rainfall', 'pH', 'EC', 'OC',
                'N', 'P', 'K', 'Ca', 'Mg', 'S', 'Zn', 'Fe', 'Cu', 'Mn',
                'B', 'Mo', 'CEC', 'Sand', 'Silt', 'Clay', 'Bulk_Density',
                'Water_Holding_Capacity', 'Slope', 'Aspect', 'Elevation',
                'Solar_Radiation', 'Wind_Speed', 'NDVI', 'EVI', 'LAI',
                'Chlorophyll', 'GDD', 'Irrigation_Frequency', 'Year',
                'Planting_Month', 'Harvest_Month', 'Growing_Days']

ENCODED_CAT_COLS = CAT_COLS  # same names, now numeric

feature_names = ENCODED_CAT_COLS + NUMERIC_COLS
X = df_features[feature_names].values.astype(float)

# Handle NaN
X = np.nan_to_num(X, nan=0.0)
y = np.nan_to_num(y, nan=0.0)

print(f"\n  Feature matrix: {X.shape}")
print(f"  Feature names ({len(feature_names)}): {feature_names}")

# Scale
print("\n[3/5] Scaling features...")
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# Train-test split
X_train, X_test, y_train, y_test = train_test_split(
    X_scaled, y, test_size=0.2, random_state=42
)
print(f"  Train: {X_train.shape[0]}, Test: {X_test.shape[0]}")

# Models
print("\n[4/5] Training models...")
models = {
    'extra_trees': ExtraTreesRegressor(n_estimators=200, random_state=42, n_jobs=-1),
    'random_forest': RandomForestRegressor(n_estimators=200, random_state=42, n_jobs=-1),
    'gradient_boosting': GradientBoostingRegressor(n_estimators=200, random_state=42, max_depth=5),
    'hist_gradient_boosting': HistGradientBoostingRegressor(max_iter=300, random_state=42),
    'mlp': MLPRegressor(hidden_layer_sizes=(256, 128, 64), max_iter=500,
                        random_state=42, early_stopping=True, learning_rate='adaptive'),
}

results = {}
best_model_name = None
best_r2 = -999

for name, model in models.items():
    print(f"\n  Training {name}...")
    model.fit(X_train, y_train)
    y_pred = model.predict(X_test)

    r2 = r2_score(y_test, y_pred)
    mae = mean_absolute_error(y_test, y_pred)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))

    results[name] = {'r2': round(r2, 4), 'mae': round(mae, 4), 'rmse': round(rmse, 4)}
    print(f"    R²={r2:.4f}  MAE={mae:.4f}  RMSE={rmse:.4f}")

    # Save model
    joblib.dump(model, os.path.join(MODELS_DIR, f'{name}.joblib'))

    if r2 > best_r2:
        best_r2 = r2
        best_model_name = name

# Save artifacts
print("\n[5/5] Saving artifacts...")
joblib.dump(scaler, os.path.join(MODELS_DIR, 'scaler.joblib'))
joblib.dump(feature_names, os.path.join(MODELS_DIR, 'feature_names.joblib'))
joblib.dump(cat_encoders, os.path.join(MODELS_DIR, 'cat_encoders.joblib'))
joblib.dump(results, os.path.join(MODELS_DIR, 'comparison.joblib'))

# Save category options for frontend
cat_options = {}
for col, le in cat_encoders.items():
    cat_options[col] = list(le.classes_)
joblib.dump(cat_options, os.path.join(MODELS_DIR, 'cat_options.joblib'))

print(f"\n{'=' * 60}")
print(f"  TRAINING COMPLETE!")
print(f"  Best model: {best_model_name} (R²={best_r2:.4f})")
print(f"  Models saved to: {MODELS_DIR}")
print(f"  Total features: {len(feature_names)}")
print(f"{'=' * 60}")

for name, m in results.items():
    print(f"  {name:30s}  R²={m['r2']:.4f}  MAE={m['mae']:.4f}  RMSE={m['rmse']:.4f}")
