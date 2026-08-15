"""
Data Preprocessing Module
Handles loading, cleaning, encoding, scaling, and splitting the crop recommendation dataset.
"""

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
import joblib
import os


class DataPreprocessor:
    """Preprocesses the Crop_recommendation.csv dataset for ML training."""

    def __init__(self, dataset_path):
        self.dataset_path = dataset_path
        self.scaler = StandardScaler()
        self.label_encoder = LabelEncoder()
        self.feature_columns = ['N', 'P', 'K', 'temperature', 'humidity', 'ph', 'rainfall']
        self.target_column = 'label'
        self.df = None

    def load_data(self):
        """Load the CSV dataset."""
        self.df = pd.read_csv(self.dataset_path)
        print(f"[DataPreprocessor] Loaded dataset: {self.df.shape[0]} rows, {self.df.shape[1]} columns")
        print(f"[DataPreprocessor] Columns: {list(self.df.columns)}")
        print(f"[DataPreprocessor] Unique crops: {self.df[self.target_column].nunique()}")
        return self.df

    def clean_data(self):
        """Handle missing values and outliers."""
        if self.df is None:
            self.load_data()

        # Check for missing values
        missing = self.df.isnull().sum()
        if missing.sum() > 0:
            print(f"[DataPreprocessor] Found missing values:\n{missing[missing > 0]}")
            # Fill numeric columns with median
            for col in self.feature_columns:
                if self.df[col].isnull().sum() > 0:
                    self.df[col].fillna(self.df[col].median(), inplace=True)
            # Fill label with mode
            if self.df[self.target_column].isnull().sum() > 0:
                self.df[self.target_column].fillna(self.df[self.target_column].mode()[0], inplace=True)
        else:
            print("[DataPreprocessor] No missing values found — dataset is clean!")

        # Remove duplicates
        before = len(self.df)
        self.df.drop_duplicates(inplace=True)
        after = len(self.df)
        if before != after:
            print(f"[DataPreprocessor] Removed {before - after} duplicate rows")

        # Validate ranges (basic sanity checks)
        assert (self.df['N'] >= 0).all(), "Negative Nitrogen values found"
        assert (self.df['P'] >= 0).all(), "Negative Phosphorus values found"
        assert (self.df['K'] >= 0).all(), "Negative Potassium values found"
        assert (self.df['ph'] >= 0).all() and (self.df['ph'] <= 14).all(), "pH out of range"

        print("[DataPreprocessor] Data cleaning complete")
        return self.df

    def get_statistics(self):
        """Return dataset statistics."""
        if self.df is None:
            self.load_data()
        return {
            'shape': self.df.shape,
            'describe': self.df.describe().to_dict(),
            'crops': self.df[self.target_column].value_counts().to_dict(),
            'missing': self.df.isnull().sum().to_dict(),
        }

    def prepare_features(self):
        """Scale features and encode labels."""
        if self.df is None:
            self.clean_data()

        X = self.df[self.feature_columns].values
        y = self.df[self.target_column].values

        # Encode labels
        y_encoded = self.label_encoder.fit_transform(y)

        # Scale features
        X_scaled = self.scaler.fit_transform(X)

        print(f"[DataPreprocessor] Features shape: {X_scaled.shape}")
        print(f"[DataPreprocessor] Labels encoded: {len(self.label_encoder.classes_)} classes")

        return X_scaled, y_encoded, X, y

    def split_data(self, test_size=0.2, random_state=42):
        """Split into train and test sets with stratification."""
        X_scaled, y_encoded, X_raw, y_raw = self.prepare_features()

        X_train, X_test, y_train, y_test = train_test_split(
            X_scaled, y_encoded,
            test_size=test_size,
            random_state=random_state,
            stratify=y_encoded
        )

        # Also split raw data (unscaled) for tree-based models
        X_train_raw, X_test_raw, _, _ = train_test_split(
            X_raw, y_encoded,
            test_size=test_size,
            random_state=random_state,
            stratify=y_encoded
        )

        print(f"[DataPreprocessor] Train set: {X_train.shape[0]} samples")
        print(f"[DataPreprocessor] Test set: {X_test.shape[0]} samples")

        return {
            'X_train': X_train,
            'X_test': X_test,
            'y_train': y_train,
            'y_test': y_test,
            'X_train_raw': X_train_raw,
            'X_test_raw': X_test_raw,
            'feature_names': self.feature_columns,
            'label_encoder': self.label_encoder,
            'scaler': self.scaler,
        }

    def save_artifacts(self, save_dir):
        """Save scaler and label encoder for inference."""
        os.makedirs(save_dir, exist_ok=True)
        joblib.dump(self.scaler, os.path.join(save_dir, 'scaler.joblib'))
        joblib.dump(self.label_encoder, os.path.join(save_dir, 'label_encoder.joblib'))
        print(f"[DataPreprocessor] Saved scaler and label encoder to {save_dir}")

    def transform_input(self, input_data):
        """Transform a single input for prediction (dict → scaled array)."""
        values = np.array([[
            input_data['nitrogen'],
            input_data['phosphorus'],
            input_data['potassium'],
            input_data['temperature'],
            input_data['humidity'],
            input_data['ph'],
            input_data['rainfall'],
        ]])
        return self.scaler.transform(values), values
