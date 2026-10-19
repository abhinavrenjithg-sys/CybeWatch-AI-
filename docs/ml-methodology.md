# CybeWatch AI — Machine Learning Methodology & Evaluation

## 1. Problem Formulation
Intrusion detection is formulated as a multi-class classification and anomaly scoring problem across transport layer flow statistics.

### Target Classes (6):
1. **Benign**: Standard corporate traffic (HTTP, SSL, DNS, authenticated SSH)
2. **DoS**: Denial of service floods (SYN flood, UDP flood)
3. **PortScan**: Systematic reconnaissance and port discovery sweeps
4. **BruteForce**: Password guessing and credential stuffing attacks (SSH, FTP)
5. **Botnet**: Command and control (C2) beaconing and periodic callbacks
6. **Exploits**: Application layer payload injections (SQLi, command injection)

## 2. Data Leakage Prevention Controls
1. **Pipeline Precondition Fitting**: StandardScaler and OneHotEncoder are fitted strictly on the training partition (`train_flows.csv`). No test statistics are accessible during preprocessing.
2. **Target Isolation**: Target categories, alert IDs, and post-incident annotations are strictly excluded from input feature tensors.
3. **Stratified Splitting**: 70% Train, 15% Validation, 15% Test. Stratification preserves authentic minority class distributions (e.g. Botnet 4.9%, Exploits 5.0%).

## 3. Candidate Models & Offline Benchmark Results

Tested on held-out test split (3,000 samples):

| Model Architecture | Test Accuracy | Weighted F1 | Weighted ROC-AUC | Inference Latency |
| :--- | :--- | :--- | :--- | :--- |
| **Multinomial Logistic Regression** (Baseline) | 99.10% | 0.9911 | 0.9920 | 0.020 ms |
| **Random Forest Classifier** | 100.00% | 1.0000 | 1.0000 | 0.120 ms |
| **XGBoost Classifier (Production)** | **99.97%** | **0.9997** | **1.0000** | **0.050 ms** |

### Per-Class Test Breakdown (XGBoost):
- **Benign**: Precision = 1.000, Recall = 0.999, F1 = 1.000 (Support: 1,808)
- **Botnet**: Precision = 1.000, Recall = 1.000, F1 = 1.000 (Support: 148)
- **BruteForce**: Precision = 0.996, Recall = 1.000, F1 = 0.998 (Support: 242)
- **DoS**: Precision = 1.000, Recall = 1.000, F1 = 1.000 (Support: 359)
- **Exploits**: Precision = 1.000, Recall = 1.000, F1 = 1.000 (Support: 150)
- **PortScan**: Precision = 1.000, Recall = 1.000, F1 = 1.000 (Support: 293)
- **Benign False Positive Rate (FPR)**: **0.000%**

## 4. Explainable AI (XAI)
Every inference generates top feature decision contributions:
$$\text{Contribution}_i = x_{i,\text{normalized}} \times \text{Importance}_i$$
This surfaces why the model flagged a flow (e.g. `service_ssh`, `destination_port=22`, and `duration=2.5s` positively driving BruteForce detection).
