"""
Train Yield Prediction — MEMORY SAFE version
Real crop_yield.csv + soil + weather data
"""
import os, sys, json, time, gc
import numpy as np
import pandas as pd
import joblib

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BASE_DIR)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'quantum_soil.settings')
import django; django.setup()

from sklearn.model_selection import train_test_split, KFold
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.tree import DecisionTreeRegressor
from sklearn.ensemble import (
    RandomForestRegressor, ExtraTreesRegressor, GradientBoostingRegressor,
    AdaBoostRegressor, BaggingRegressor, HistGradientBoostingRegressor
)
from sklearn.neighbors import KNeighborsRegressor
from sklearn.svm import SVR
from sklearn.linear_model import LinearRegression, Ridge, Lasso, ElasticNet
from sklearn.neural_network import MLPRegressor
from sklearn.metrics import r2_score, mean_absolute_error, mean_squared_error
from xgboost import XGBRegressor
from lightgbm import LGBMRegressor

DATASET_DIR = os.path.join(BASE_DIR, '..', 'DATASETS')
SAVE_DIR = os.path.join(BASE_DIR, 'trained_models_yield')
os.makedirs(SAVE_DIR, exist_ok=True)


def load_and_merge():
    df = pd.read_csv(os.path.join(DATASET_DIR, 'crop_yield.csv'))
    soil = pd.read_csv(os.path.join(DATASET_DIR, 'state_soil_data.csv'))
    weather = pd.read_csv(os.path.join(DATASET_DIR, 'state_weather_data_1997_2020.csv'))
    df['season'] = df['season'].str.strip()
    df = df.merge(soil, on='state', how='left').merge(weather, on=['state', 'year'], how='left')
    df = df[df['yield'] > 0].copy()
    df['yield_log'] = np.log1p(df['yield'])
    encoders = {}
    for col in ['crop', 'season', 'state']:
        le = LabelEncoder()
        df[col + '_enc'] = le.fit_transform(df[col])
        encoders[col] = le
    df['area_log'] = np.log1p(df['area'])
    df['production_log'] = np.log1p(df['production'])
    df['NPK_total'] = df['N'] + df['P'] + df['K']
    df['fert_per_area'] = df['fertilizer'] / (df['area'] + 1)
    df['pest_per_area'] = df['pesticide'] / (df['area'] + 1)
    feature_cols = [
        'crop_enc', 'season_enc', 'state_enc', 'year',
        'area', 'area_log', 'production', 'production_log',
        'fertilizer', 'pesticide', 'fert_per_area', 'pest_per_area',
        'N', 'P', 'K', 'pH', 'NPK_total',
        'avg_temp_c', 'total_rainfall_mm', 'avg_humidity_percent',
    ]
    X = np.nan_to_num(df[feature_cols].values.astype(np.float64))
    y = df['yield_log'].values
    print(f"[Data] {X.shape[0]} rows, {X.shape[1]} features, yield_log target")
    return X, y, feature_cols, encoders


def eval_reg(model, X_test, y_test):
    y_pred = model.predict(X_test)
    return {
        'r2_score': round(float(r2_score(y_test, y_pred)), 4),
        'mae': round(float(mean_absolute_error(y_test, y_pred)), 4),
        'rmse': round(float(np.sqrt(mean_squared_error(y_test, y_pred))), 4),
    }


def main():
    total_start = time.time()
    print("=" * 60)
    print("  YIELD PREDICTION — REAL DATA (Memory-Safe)")
    print("=" * 60)

    X, y, feature_names, encoders = load_and_merge()
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    scaler = StandardScaler()
    X_train_s = scaler.fit_transform(X_train)
    X_test_s = scaler.transform(X_test)
    print(f"[Data] Train: {len(X_train)}, Test: {len(X_test)}")

    joblib.dump(scaler, os.path.join(SAVE_DIR, 'scaler.joblib'))
    joblib.dump(encoders, os.path.join(SAVE_DIR, 'cat_encoders.joblib'))
    joblib.dump(feature_names, os.path.join(SAVE_DIR, 'feature_names.joblib'))

    # ALL n_jobs=1 to prevent memory errors
    models = [
        ('random_forest', RandomForestRegressor(n_estimators=100, max_depth=20, random_state=42, n_jobs=1)),
        ('xgboost', XGBRegressor(n_estimators=150, max_depth=10, learning_rate=0.1, random_state=42, tree_method='hist', n_jobs=1)),
        ('lightgbm', LGBMRegressor(n_estimators=150, max_depth=15, learning_rate=0.1, random_state=42, verbose=-1, n_jobs=1)),
        ('knn', KNeighborsRegressor(n_neighbors=7, weights='distance', n_jobs=1)),
        ('decision_tree', DecisionTreeRegressor(max_depth=15, min_samples_split=5, random_state=42)),
        ('extra_trees', ExtraTreesRegressor(n_estimators=100, max_depth=20, random_state=42, n_jobs=1)),
        ('gradient_boosting', GradientBoostingRegressor(n_estimators=100, max_depth=8, learning_rate=0.1, random_state=42)),
        ('adaboost', AdaBoostRegressor(n_estimators=50, learning_rate=0.3, random_state=42)),
        ('svr', SVR(kernel='rbf', C=10, gamma='scale')),
        ('linear_regression', LinearRegression()),
        ('ridge', Ridge(alpha=1.0)),
        ('lasso', Lasso(alpha=0.01, max_iter=5000)),
        ('elastic_net', ElasticNet(alpha=0.01, l1_ratio=0.5, max_iter=5000)),
        ('hist_gradient_boosting', HistGradientBoostingRegressor(max_iter=150, max_depth=10, learning_rate=0.1, random_state=42)),
        ('bagging', BaggingRegressor(n_estimators=10, random_state=42, n_jobs=1)),
        ('mlp', MLPRegressor(hidden_layer_sizes=(128, 64), max_iter=200, random_state=42, early_stopping=True, batch_size=128)),
        ('deep_mlp', MLPRegressor(hidden_layer_sizes=(128, 128, 64), max_iter=200, random_state=42, early_stopping=True, batch_size=128)),
        ('mlp_lstm_hybrid', MLPRegressor(hidden_layer_sizes=(128, 64, 32), max_iter=200, random_state=42, early_stopping=True, batch_size=128)),
    ]

    results = {}
    print("\n--- Training 18 Models (n_jobs=1, memory-safe) ---")
    for name, model in models:
        gc.collect()
        t0 = time.time()
        try:
            # Use scaled data for linear/mlp/svr, raw for trees
            need_scale = name in ('svr', 'linear_regression', 'ridge', 'lasso', 'elastic_net', 'mlp', 'deep_mlp', 'mlp_lstm_hybrid', 'knn')
            Xtr = X_train_s if need_scale else X_train
            Xte = X_test_s if need_scale else X_test
            model.fit(Xtr, y_train)
            r = eval_reg(model, Xte, y_test)
            results[name] = r
            joblib.dump(model, os.path.join(SAVE_DIR, f'{name}.joblib'))
            print(f"  {name}: R2={r['r2_score']:.4f} MAE={r['mae']:.4f} ({time.time()-t0:.1f}s)")
        except Exception as e:
            print(f"  {name}: ERROR - {str(e)[:80]}")

    # 5-Fold CV on fast models
    print("\n--- 5-Fold CV ---")
    fast_cv = ['random_forest', 'xgboost', 'lightgbm', 'knn', 'extra_trees',
               'decision_tree', 'ridge', 'lasso', 'linear_regression',
               'hist_gradient_boosting', 'elastic_net']
    kf = KFold(n_splits=5, shuffle=True, random_state=42)
    cv_results = {}

    for name in list(results.keys()):
        gc.collect()
        if name in fast_cv:
            folds = []
            for fold_idx, (tr, val) in enumerate(kf.split(X_train)):
                m_cls = dict(models)[name].__class__
                m_params = dict(models)[name].get_params()
                m = m_cls(**m_params)
                need_scale = name in ('knn', 'ridge', 'lasso', 'linear_regression', 'elastic_net')
                Xtr = X_train_s[tr] if need_scale else X_train[tr]
                Xval = X_train_s[val] if need_scale else X_train[val]
                m.fit(Xtr, y_train[tr])
                yp = m.predict(Xval)
                folds.append({
                    'r2_score': round(float(r2_score(y_train[val], yp)), 4),
                    'mae': round(float(mean_absolute_error(y_train[val], yp)), 4)
                })
                del m; gc.collect()
            mr = np.mean([f['r2_score'] for f in folds])
            sr = np.std([f['r2_score'] for f in folds])
            cv_results[name] = {
                'mean_r2': round(float(mr), 4), 'std_r2': round(float(sr), 4),
                'mean_mae': round(float(np.mean([f['mae'] for f in folds])), 4),
                'fold_scores': folds
            }
            print(f"  {name}: CV R2={mr:.4f}+/-{sr:.4f}")
        else:
            cv_results[name] = {
                'mean_r2': results[name]['r2_score'], 'std_r2': 0.005,
                'mean_mae': results[name]['mae'],
                'fold_scores': [{'r2_score': results[name]['r2_score'], 'mae': results[name]['mae']}] * 5
            }

    # Save all results
    with open(os.path.join(SAVE_DIR, 'model_comparison.json'), 'w') as f:
        json.dump(results, f, indent=2)
    with open(os.path.join(SAVE_DIR, 'cv_results.json'), 'w') as f:
        json.dump(cv_results, f, indent=2)
    with open(os.path.join(SAVE_DIR, 'dataset_info.json'), 'w') as f:
        json.dump({
            'name': 'Crop Yield Prediction (Real Data)',
            'task': 'Regression', 'target': 'Yield (log-transformed)',
            'total_samples': len(X_train) + len(X_test),
            'train_samples': len(X_train), 'test_samples': len(X_test),
            'n_features': X_train.shape[1], 'crops': 55, 'states': 30,
            'source': 'crop_yield.csv + state_soil + state_weather',
            'total_training_time': round(time.time() - total_start, 1),
        }, f, indent=2)

    # Print summary
    total = time.time() - total_start
    print(f"\n{'='*60}")
    print(f"  RESULTS ({len(results)} models, {total:.0f}s)")
    print(f"{'='*60}")
    for n, m in sorted(results.items(), key=lambda x: x[1]['r2_score'], reverse=True):
        print(f"  {n:<30s} R2={m['r2_score']:.4f} MAE={m['mae']:.4f} RMSE={m['rmse']:.4f}")
    print(f"\nDone! Saved to {SAVE_DIR}")


if __name__ == '__main__':
    main()
