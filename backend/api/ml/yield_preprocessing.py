"""
Yield Dataset Preprocessor — REGRESSION
Target: Yield (continuous, 1.0 - 10.0)
Features: All soil, weather, crop, and management features
"""

import pandas as pd
import numpy as np
import joblib
import os
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder


class YieldPreprocessor:
    """Preprocesses the Agri Yield Prediction dataset for Yield regression."""

    def __init__(self, dataset_path):
        self.dataset_path = dataset_path
        self.df = None
        self.scaler = StandardScaler()
        self.target_scaler = StandardScaler()
        self.cat_encoders = {}
        self.feature_names = []

    def load_data(self):
        self.df = pd.read_csv(self.dataset_path)
        print(f"[YieldPreprocessor] Loaded: {self.df.shape[0]} rows, {self.df.shape[1]} columns")
        print(f"[YieldPreprocessor] Yield stats: mean={self.df['Yield'].mean():.2f}, "
              f"std={self.df['Yield'].std():.2f}, range=[{self.df['Yield'].min():.2f}, {self.df['Yield'].max():.2f}]")
        return self.df

    def clean_data(self):
        """Drop dates, encode categoricals, engineer features."""
        # Drop date columns
        drop_cols = ['Planting_Date', 'Harvest_Date']
        self.df = self.df.drop(columns=[c for c in drop_cols if c in self.df.columns])

        # Feature engineering
        self.df['N_P_ratio'] = self.df['N'] / (self.df['P'] + 1)
        self.df['N_K_ratio'] = self.df['N'] / (self.df['K'] + 1)
        self.df['NPK_total'] = self.df['N'] + self.df['P'] + self.df['K']
        self.df['temp_humidity'] = self.df['Temperature'] * self.df['Humidity']
        self.df['rain_temp_ratio'] = self.df['Rainfall'] / (self.df['Temperature'] + 1)
        self.df['soil_fertility'] = self.df['OC'] * self.df['CEC']
        self.df['micro_nutrients'] = self.df['Zn'] + self.df['Fe'] + self.df['Cu'] + self.df['Mn'] + self.df['B']
        self.df['macro_nutrients'] = self.df['N'] + self.df['P'] + self.df['K'] + self.df['Ca'] + self.df['Mg']
        self.df['vegetation_index'] = self.df['NDVI'] * self.df['EVI']
        self.df['water_availability'] = self.df['Rainfall'] * self.df['Water_Holding_Capacity']
        self.df['growing_conditions'] = self.df['GDD'] * self.df['Solar_Radiation']

        # Encode categorical columns
        cat_cols = ['Soil_Type', 'Crop_Type', 'Growth_Stage', 'Fertilizer_Type',
                    'Pesticide_Usage', 'Region', 'Season']

        for col in cat_cols:
            if col in self.df.columns:
                le = LabelEncoder()
                self.df[col] = le.fit_transform(self.df[col].astype(str))
                self.cat_encoders[col] = le
                print(f"[YieldPreprocessor] Encoded {col}: {len(le.classes_)} classes")

        self.df = self.df.dropna()
        print(f"[YieldPreprocessor] Final data: {self.df.shape}")
        return self.df

    def split_data(self, test_size=0.2, random_state=42):
        """80:20 split for regression."""
        target_col = 'Yield'
        feature_cols = [c for c in self.df.columns if c != target_col]
        self.feature_names = feature_cols

        X = self.df[feature_cols].values.astype(np.float64)
        y = self.df[target_col].values.astype(np.float64)

        print(f"[YieldPreprocessor] Features: {len(feature_cols)}")
        print(f"[YieldPreprocessor] Target: Yield (continuous)")

        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=test_size, random_state=random_state
        )

        X_train = self.scaler.fit_transform(X_train)
        X_test = self.scaler.transform(X_test)

        print(f"[YieldPreprocessor] Train: {len(X_train)}, Test: {len(X_test)}")

        return {
            'X_train': X_train, 'X_test': X_test,
            'y_train': y_train, 'y_test': y_test,
            'feature_names': feature_cols,
        }

    def save_artifacts(self, save_dir):
        os.makedirs(save_dir, exist_ok=True)
        joblib.dump(self.scaler, os.path.join(save_dir, 'scaler.joblib'))
        joblib.dump(self.cat_encoders, os.path.join(save_dir, 'cat_encoders.joblib'))
        joblib.dump(self.feature_names, os.path.join(save_dir, 'feature_names.joblib'))
        print(f"[YieldPreprocessor] Artifacts saved to {save_dir}")
