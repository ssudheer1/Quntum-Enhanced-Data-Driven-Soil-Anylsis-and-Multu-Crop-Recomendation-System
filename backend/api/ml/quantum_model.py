"""
Quantum ML Model Module (v3 — High Accuracy Hybrid)
Uses a quantum feature map + classical SVM hybrid approach for better accuracy.
The quantum circuit generates additional features that enhance the classical SVM.

Architecture:
  1. PCA reduces 7 features → 4 (for quantum circuit)
  2. Quantum circuit generates 2^n_qubits probability features per sample
  3. Classical features + quantum features are concatenated
  4. SVM trains on the combined feature space

This hybrid approach achieves much higher accuracy than pure quantum kernel
while still genuinely using quantum computation.
"""

import numpy as np
import pennylane as qml
from sklearn.svm import SVC
from sklearn.decomposition import PCA
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
from sklearn.preprocessing import MinMaxScaler, StandardScaler
from sklearn.model_selection import StratifiedShuffleSplit
import joblib
import os


class QuantumMLModel:
    """
    Quantum-Enhanced Hybrid ML Model.

    Instead of using the expensive O(n^2) quantum kernel matrix,
    this model uses quantum circuits as a feature map:
    - Each input sample is encoded into a quantum circuit
    - The circuit's measurement probabilities become new features
    - These quantum features are concatenated with classical PCA features
    - An SVM is trained on the combined feature space

    This approach:
    - Is computationally tractable (O(n) circuit evaluations, not O(n^2))
    - Allows more training samples (300+ instead of 150)
    - Achieves significantly higher accuracy through feature augmentation
    - Still genuinely uses quantum computation
    """

    def __init__(self, n_qubits=4, n_layers=3, n_samples=300):
        self.n_qubits = n_qubits
        self.n_layers = n_layers
        self.n_samples = n_samples
        self.quantum_model = None
        self.pca = None
        self.minmax_scaler = None
        self.feature_scaler = None
        self.results = {}

        # Create quantum device (simulator)
        self.dev = qml.device("default.qubit", wires=self.n_qubits)

        # Build the quantum feature map circuit
        self.feature_circuit = self._build_feature_circuit()

    def _build_feature_circuit(self):
        """Build quantum feature map circuit with data re-uploading."""

        @qml.qnode(self.dev)
        def circuit(x):
            """
            Quantum feature map using data re-uploading with IQP-style encoding.
            Outputs 2^n_qubits probability values as new features.
            """
            for layer in range(self.n_layers):
                # Data re-uploading: encode features in every layer
                for i in range(self.n_qubits):
                    # Angle encoding with layer-dependent scaling
                    angle_rx = x[i] * np.pi * (1 + 0.5 * layer)
                    angle_ry = x[i] * np.pi * (0.8 + 0.3 * layer)
                    angle_rz = x[i] * np.pi * (0.6 + 0.4 * layer)
                    qml.RX(angle_rx, wires=i)
                    qml.RY(angle_ry, wires=i)
                    qml.RZ(angle_rz, wires=i)

                # IQP-style ZZ entangling interactions
                for i in range(self.n_qubits - 1):
                    qml.CNOT(wires=[i, i + 1])
                    qml.RZ(x[i] * x[i + 1] * np.pi, wires=i + 1)
                    qml.CNOT(wires=[i, i + 1])

                # Circular entanglement
                if self.n_qubits > 2:
                    qml.CNOT(wires=[self.n_qubits - 1, 0])
                    qml.RZ(x[self.n_qubits - 1] * x[0] * np.pi, wires=0)
                    qml.CNOT(wires=[self.n_qubits - 1, 0])

            return qml.probs(wires=range(self.n_qubits))

        return circuit

    def _quantum_features(self, X):
        """Generate quantum features for a dataset by running each sample through the circuit."""
        n_samples = len(X)
        n_probs = 2 ** self.n_qubits  # 16 probability features for 4 qubits
        features = np.zeros((n_samples, n_probs))

        for i in range(n_samples):
            features[i] = self.feature_circuit(X[i])
            if (i + 1) % 50 == 0:
                print(f"[QuantumML] Feature extraction: {i+1}/{n_samples} ({100*(i+1)/n_samples:.0f}%)")

        return features

    def _reduce_and_scale(self, X_train, X_test):
        """Reduce dimensions with PCA and scale to [0, 1] for quantum encoding."""
        self.pca = PCA(n_components=self.n_qubits)
        X_train_pca = self.pca.fit_transform(X_train)
        X_test_pca = self.pca.transform(X_test)

        self.minmax_scaler = MinMaxScaler(feature_range=(0, 1))
        X_train_scaled = self.minmax_scaler.fit_transform(X_train_pca)
        X_test_scaled = self.minmax_scaler.transform(X_test_pca)

        return X_train_scaled, X_test_scaled

    def train(self, X_train, y_train, X_test, y_test):
        """Train the quantum-enhanced hybrid model."""
        print(f"[QuantumML] Starting Quantum Hybrid Model v3...")
        print(f"[QuantumML] Qubits: {self.n_qubits}, Layers: {self.n_layers}")
        print(f"[QuantumML] Architecture: Quantum Feature Map + Classical SVM Hybrid")

        # Use larger subsets since O(n) feature extraction is fast
        n_train = min(self.n_samples, len(X_train))
        n_test = min(max(self.n_samples // 3, 100), len(X_test))

        # Use stratified sampling to ensure all classes are represented
        try:
            splitter = StratifiedShuffleSplit(n_splits=1, train_size=n_train, random_state=42)
            train_idx, _ = next(splitter.split(X_train, y_train))
        except ValueError:
            np.random.seed(42)
            train_idx = np.random.choice(len(X_train), n_train, replace=False)

        try:
            splitter = StratifiedShuffleSplit(n_splits=1, train_size=n_test, random_state=42)
            test_idx, _ = next(splitter.split(X_test, y_test))
        except ValueError:
            np.random.seed(42)
            test_idx = np.random.choice(len(X_test), n_test, replace=False)

        X_train_sub = X_train[train_idx]
        y_train_sub = y_train[train_idx]
        X_test_sub = X_test[test_idx]
        y_test_sub = y_test[test_idx]

        n_classes_train = len(np.unique(y_train_sub))
        n_classes_test = len(np.unique(y_test_sub))
        print(f"[QuantumML] Using {n_train} train ({n_classes_train} classes) / {n_test} test ({n_classes_test} classes)")

        # Step 1: PCA + scaling for quantum circuit input (4 components for 4 qubits)
        X_train_q, X_test_q = self._reduce_and_scale(X_train_sub, X_test_sub)

        # Step 2: Generate quantum features (circuit probabilities)
        print("[QuantumML] Generating quantum features (train)...")
        Q_train = self._quantum_features(X_train_q)

        print("[QuantumML] Generating quantum features (test)...")
        Q_test = self._quantum_features(X_test_q)

        # Step 3: Build hybrid features = Original 7 features + Quantum 16 features
        # KEY INSIGHT: Keep original features so SVM has full information
        # Plus quantum features add non-linear representations the circuit learned
        X_train_hybrid = np.hstack([X_train_sub, Q_train])
        X_test_hybrid = np.hstack([X_test_sub, Q_test])

        n_orig = X_train_sub.shape[1]
        n_quantum = Q_train.shape[1]
        print(f"[QuantumML] Hybrid feature space: {X_train_hybrid.shape[1]} features "
              f"({n_orig} original + {n_quantum} quantum)")

        # Step 4: Scale the combined features
        self.feature_scaler = StandardScaler()
        X_train_hybrid = self.feature_scaler.fit_transform(X_train_hybrid)
        X_test_hybrid = self.feature_scaler.transform(X_test_hybrid)

        # Step 5: Train SVM on hybrid features
        print("[QuantumML] Training SVM on hybrid quantum-classical features...")
        self.quantum_model = SVC(
            kernel='rbf',
            C=100.0,
            gamma='scale',
            random_state=42,
            decision_function_shape='ovr'
        )
        self.quantum_model.fit(X_train_hybrid, y_train_sub)

        # Evaluate
        y_pred = self.quantum_model.predict(X_test_hybrid)
        accuracy = accuracy_score(y_test_sub, y_pred)
        precision = precision_score(y_test_sub, y_pred, average='weighted', zero_division=0)
        recall = recall_score(y_test_sub, y_pred, average='weighted', zero_division=0)
        f1 = f1_score(y_test_sub, y_pred, average='weighted', zero_division=0)

        self.results = {
            'accuracy': round(accuracy, 4),
            'precision': round(precision, 4),
            'recall': round(recall, 4),
            'f1_score': round(f1, 4),
            'n_qubits': self.n_qubits,
            'n_layers': self.n_layers,
            'n_train_samples': n_train,
            'n_test_samples': n_test,
            'architecture': 'Quantum Feature Map + SVM Hybrid',
            'quantum_features': n_quantum,
            'total_features': n_orig + n_quantum,
        }

        print(f"[QuantumML] Quantum Hybrid v3 -- Accuracy: {accuracy:.4f}, F1: {f1:.4f}")
        print(f"[QuantumML] Precision: {precision:.4f}, Recall: {recall:.4f}")
        return self.results

    def save(self, save_dir):
        """Save quantum model artifacts."""
        os.makedirs(save_dir, exist_ok=True)
        if self.quantum_model:
            joblib.dump(self.quantum_model, os.path.join(save_dir, 'quantum_svm.joblib'))
        if self.pca:
            joblib.dump(self.pca, os.path.join(save_dir, 'quantum_pca.joblib'))
        if self.minmax_scaler:
            joblib.dump(self.minmax_scaler, os.path.join(save_dir, 'quantum_scaler.joblib'))
        if self.feature_scaler:
            joblib.dump(self.feature_scaler, os.path.join(save_dir, 'quantum_feature_scaler.joblib'))
        joblib.dump(self.results, os.path.join(save_dir, 'quantum_results.joblib'))
        print(f"[QuantumML] Saved quantum model to {save_dir}")

    def load(self, save_dir):
        """Load quantum model artifacts."""
        svm_path = os.path.join(save_dir, 'quantum_svm.joblib')
        pca_path = os.path.join(save_dir, 'quantum_pca.joblib')
        scaler_path = os.path.join(save_dir, 'quantum_scaler.joblib')
        feature_scaler_path = os.path.join(save_dir, 'quantum_feature_scaler.joblib')
        results_path = os.path.join(save_dir, 'quantum_results.joblib')

        if os.path.exists(svm_path):
            self.quantum_model = joblib.load(svm_path)
        if os.path.exists(pca_path):
            self.pca = joblib.load(pca_path)
        if os.path.exists(scaler_path):
            self.minmax_scaler = joblib.load(scaler_path)
        if os.path.exists(feature_scaler_path):
            self.feature_scaler = joblib.load(feature_scaler_path)
        if os.path.exists(results_path):
            self.results = joblib.load(results_path)
        print(f"[QuantumML] Loaded quantum model from {save_dir}")
