"""
Quantum Random Forest Model
Architecture: PennyLane Quantum Feature Map + Random Forest Classifier
Uses quantum circuit to generate probability features, then trains RF on hybrid feature space.
"""

import numpy as np
import joblib
import os
import pennylane as qml
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.utils import resample
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score


class QuantumRandomForest:
    """Quantum Feature Map + Random Forest Hybrid."""

    def __init__(self, n_qubits=4, n_layers=3, n_samples=880):
        self.n_qubits = n_qubits
        self.n_layers = n_layers
        self.n_samples = n_samples
        self.scaler = None
        self.rf = None
        self.n_quantum_features = 2 ** n_qubits  # 16 for 4 qubits

        # Build quantum device and circuit
        self.dev = qml.device('default.qubit', wires=n_qubits)
        self.circuit = qml.QNode(self._quantum_circuit, self.dev)

    def _quantum_circuit(self, inputs):
        """Quantum circuit that generates feature map probabilities."""
        n_inp = min(len(inputs), self.n_qubits)
        # Data encoding via angle embedding
        for i in range(n_inp):
            qml.RY(inputs[i], wires=i)
            qml.RZ(inputs[i] * 0.5, wires=i)
        # Entangling layers
        for layer in range(self.n_layers):
            for i in range(self.n_qubits - 1):
                qml.CNOT(wires=[i, i + 1])
            qml.CNOT(wires=[self.n_qubits - 1, 0])
            for i in range(n_inp):
                qml.RX(inputs[i] * (layer + 1) * 0.3, wires=i)
                qml.RY(inputs[i] * (layer + 1) * 0.2, wires=i)
        return qml.probs(wires=range(self.n_qubits))

    def _extract_features(self, X, label=""):
        """Extract quantum features for all samples."""
        quantum_features = []
        for i, x in enumerate(X):
            probs = self.circuit(x[:self.n_qubits])
            quantum_features.append(np.array(probs))
            if (i + 1) % 100 == 0:
                print(f"[QuantumRF] {label} feature extraction: {i+1}/{len(X)} ({(i+1)*100//len(X)}%)")
        return np.array(quantum_features)

    def train(self, X_train, y_train, X_test, y_test):
        """Train the Quantum Random Forest hybrid model."""
        print(f"[QuantumRF] Starting Quantum Random Forest Hybrid...")
        print(f"[QuantumRF] Qubits: {self.n_qubits}, Layers: {self.n_layers}")

        # Stratified subsample
        n_classes = len(np.unique(y_train))
        n_per_class = self.n_samples // n_classes
        X_sub, y_sub = [], []
        for cls in np.unique(y_train):
            mask = y_train == cls
            X_cls = X_train[mask]
            y_cls = y_train[mask]
            n_take = min(n_per_class, len(X_cls))
            idx = np.random.RandomState(42).choice(len(X_cls), n_take, replace=False)
            X_sub.append(X_cls[idx])
            y_sub.append(y_cls[idx])
        X_sub = np.vstack(X_sub)
        y_sub = np.concatenate(y_sub)

        # Test subset
        n_test = min(len(X_test), int(len(X_sub) * 0.33))
        test_idx = np.random.RandomState(42).choice(len(X_test), n_test, replace=False)
        X_test_sub = X_test[test_idx]
        y_test_sub = y_test[test_idx]

        print(f"[QuantumRF] Using {len(X_sub)} train / {len(X_test_sub)} test")

        # Extract quantum features
        print("[QuantumRF] Generating quantum features (train)...")
        q_train = self._extract_features(X_sub, "train")

        print("[QuantumRF] Generating quantum features (test)...")
        q_test = self._extract_features(X_test_sub, "test")

        # Combine: original features + quantum features
        X_hybrid_train = np.hstack([X_sub, q_train])
        X_hybrid_test = np.hstack([X_test_sub, q_test])

        total_features = X_hybrid_train.shape[1]
        print(f"[QuantumRF] Hybrid feature space: {total_features} features ({X_sub.shape[1]} original + {self.n_quantum_features} quantum)")

        # Scale hybrid features
        self.scaler = StandardScaler()
        X_hybrid_train = self.scaler.fit_transform(X_hybrid_train)
        X_hybrid_test = self.scaler.transform(X_hybrid_test)

        # Train Random Forest on hybrid features
        print("[QuantumRF] Training Random Forest on hybrid quantum-classical features...")
        self.rf = RandomForestClassifier(
            n_estimators=300, max_depth=25,
            min_samples_split=2, min_samples_leaf=1,
            random_state=42, n_jobs=-1
        )
        self.rf.fit(X_hybrid_train, y_sub)

        # Evaluate
        y_pred = self.rf.predict(X_hybrid_test)
        acc = accuracy_score(y_test_sub, y_pred)
        prec = precision_score(y_test_sub, y_pred, average='weighted', zero_division=0)
        rec = recall_score(y_test_sub, y_pred, average='weighted', zero_division=0)
        f1 = f1_score(y_test_sub, y_pred, average='weighted', zero_division=0)

        print(f"[QuantumRF] Accuracy: {acc:.4f}, F1: {f1:.4f}")
        print(f"[QuantumRF] Precision: {prec:.4f}, Recall: {rec:.4f}")

        self.results = {
            'accuracy': round(acc, 4),
            'precision': round(prec, 4),
            'recall': round(rec, 4),
            'f1_score': round(f1, 4),
            'n_qubits': self.n_qubits,
            'n_layers': self.n_layers,
            'n_train_samples': len(X_sub),
            'n_test_samples': len(X_test_sub),
            'architecture': 'Quantum Feature Map + Random Forest Hybrid',
            'quantum_features': self.n_quantum_features,
            'total_features': total_features,
        }
        return self.results

    def save(self, save_dir):
        os.makedirs(save_dir, exist_ok=True)
        joblib.dump({
            'rf': self.rf,
            'scaler': self.scaler,
            'n_qubits': self.n_qubits,
            'n_layers': self.n_layers,
            'results': self.results,
        }, os.path.join(save_dir, 'quantum_rf.joblib'))
        print(f"[QuantumRF] Model saved to {save_dir}")

    def load(self, save_dir):
        path = os.path.join(save_dir, 'quantum_rf.joblib')
        if os.path.exists(path):
            data = joblib.load(path)
            self.rf = data['rf']
            self.scaler = data['scaler']
            self.n_qubits = data['n_qubits']
            self.n_layers = data['n_layers']
            self.results = data.get('results', {})
            print("[QuantumRF] Model loaded")
            return True
        return False
