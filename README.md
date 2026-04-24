<div align="center">

<img src="https://img.shields.io/badge/FraudShield-v1.0.0-6366f1?style=for-the-badge&logo=shield&logoColor=white" alt="Version"/>
<img src="https://img.shields.io/badge/Python-3.11-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python"/>
<img src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React"/>
<img src="https://img.shields.io/badge/FastAPI-0.109-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI"/>
<img src="https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker"/>
<img src="https://img.shields.io/badge/License-MIT-22c55e?style=for-the-badge" alt="License"/>
<img src="https://img.shields.io/badge/Security-Hardened-ef4444?style=for-the-badge&logo=security&logoColor=white" alt="Security"/>

<br/><br/>

# 🛡️ FraudShield

### Explainable & Privacy-Preserving Fraud Detection for Mobile Banking

*A research-grade platform combining Federated Learning + Graph Neural Networks + Explainable AI  
— detecting fraud without ever sharing raw customer data.*

[🌐 Live Demo](https://lovelycse-fraudshield.hf.space) · [🚀 Quick Start](#-quick-start) · [📡 API Reference](#-api-reference) · [📖 Research Paper](#-research-alignment) · [🔒 Security](#-security)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Quick Start](#-quick-start)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
  - [Docker Setup](#docker-setup-recommended)
- [Environment Variables](#-environment-variables)
- [API Reference](#-api-reference)
- [Performance Metrics](#-performance-metrics)
- [Research Alignment](#-research-alignment)
- [Security](#-security)
- [Contributing](#-contributing)
- [License](#-license)
- [Acknowledgements](#-acknowledgements)

---

## 🔍 Overview

**FraudShield** is an end-to-end, audit-ready fraud detection platform built for modern mobile banking ecosystems (UPI, NEFT, IMPS). It implements a novel **Orthogonal Defence Strategy** — evaluating every transaction from two completely independent mathematical perspectives simultaneously, achieving industry-leading accuracy without banks having to share sensitive customer data.

This project is a full-stack research implementation of the paper:
> *"Explainable and Privacy-Preserving Fraud Detection in Mobile Banking using Federated Learning and Graph Neural Networks"*

Unlike traditional centralised fraud models, FraudShield operates under strict privacy constraints aligned with **GDPR Article 22** and the **RBI Data Localisation Mandate (2018)**.

---

## ✨ Key Features

### 🔐 Privacy by Design
- **Federated Learning (FedAvg)** — 5 simulated bank nodes (HDFC, SBI, ICICI, PNB, Axis) each train locally; only aggregated model weights are shared, never raw data
- **Zero PII exposure** — no raw transaction data ever leaves the originating institution
- Fully compliant with GDPR Article 22 & RBI Data Localisation mandates

### 🧠 Dual-Engine AI

| Engine | Technology | Purpose |
|--------|-----------|---------|
| **Tabular Engine** | Federated Learning (SGDClassifier / LogisticRegression) | Behavioural anomaly detection |
| **Structural Engine** | GraphSAGE-inspired GNN | Money-laundering network detection |

### 💡 Full Explainability (XAI)
- **SHAP** — Feature-level contribution scores using game theory (Shapley values)
- **LIME** — Human-readable "Bank Manager Summaries" explaining each decision in plain English
- **D3 Network Graph** — Interactive, physics-based transaction network visualisation showing mule chains and suspicious flows

### ⚡ Intelligent Decision Engine
A tunable **Dual-Threshold Policy Matrix** with 3 outcomes:
- 🔴 **BLOCK** — Hard decline; both engines confirm fraud (`sFL > 0.8 AND sGNN > 0.7`)
- 🟡 **FLAG** — Step-up OTP / manual review (`sFL > 0.6 OR sGNN > 0.7`)
- 🟢 **ALLOW** — Instant settlement (passes both checks cleanly)

### 📊 Performance Dashboard
- Live Recall, Precision, F1-Score, AUC-ROC metrics
- Epoch-by-epoch GNN training curve with Early Stopping at Epoch 20
- FL vs. Centralised XGBoost comparison table
- Confusion matrix visualisations

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                       FraudShield Platform                       │
├──────────────────────────┬───────────────────────────────────────┤
│     REACT FRONTEND       │          FASTAPI BACKEND              │
│  ┌─────────────────────┐ │  ┌──────────────────────────────────┐ │
│  │ Landing Page        │ │  │  POST /api/predict               │ │
│  │ Analyze (Input)     │◄┼─►│  POST /api/explain               │ │
│  │ Results + XAI       │ │  │  GET  /api/metrics               │ │
│  │ Metrics Dashboard   │ │  │  GET  /api/samples               │ │
│  │ Alert Queue         │ │  └──────────────┬───────────────────┘ │
│  └─────────────────────┘ │                 │                     │
├──────────────────────────┤  ┌──────────────▼──────────────────┐  │
│     D3 Graph View        │  │        Decision Engine           │  │
│   (Network Topology)     │  │   sFL ──┐                       │  │
│                          │  │         ├──► BLOCK / FLAG / ALLOW│  │
│                          │  │   sGNN ─┘                       │  │
└──────────────────────────┘  └───────┬─────────────┬───────────┘  │
                                      │             │               │
                          ┌───────────▼──┐  ┌───────▼───────────┐  │
                          │  FL Model    │  │   GNN Model        │  │
                          │ (FedAvg)     │  │  (GraphSAGE)       │  │
                          │ 5 Bank Nodes │  │ NetworkX Graph     │  │
                          └──────────────┘  └───────────────────┘  │
                                      │             │               │
                          ┌───────────▼─────────────▼───────────┐  │
                          │            XAI Layer                 │  │
                          │  SHAP Explainer  │  LIME Explainer   │  │
                          └──────────────────────────────────────┘  │
```

### Decision Flow

```
Transaction Input
      │
      ├──► FL Model ──────────────────────► FL Score (sFL)
      │    (Behavioural: Amount, Time,               │
      │     Location, V-features)                    │
      │                                              ▼
      │                                    Decision Engine
      │                                  ┌──────────────────┐
      ├──► GNN Model ────────────────────► sFL > 0.8 AND    ├──► 🔴 BLOCK
           (Structural: Network topology, │ sGNN > 0.7       │
            Fan-In / Fan-Out patterns)   │                  │
                          │              │ sFL > 0.6 OR     ├──► 🟡 FLAG
                          │              │ sGNN > 0.7       │
                          │              │                  │
                          └──► GNN Score │ Otherwise        ├──► 🟢 ALLOW
                                (sGNN)   └──────────────────┘
```

---

## 🛠️ Tech Stack

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| **FastAPI** | 0.109.2 | REST API framework |
| **Uvicorn** | 0.27.1 | ASGI server |
| **scikit-learn** | 1.4.1 | FL model (LogisticRegression, SGDClassifier) |
| **SHAP** | 0.44.1 | Feature importance explainability |
| **LIME** | 0.2.0.1 | Local surrogate explainability |
| **NetworkX** | 3.2.1 | Graph construction & GNN simulation |
| **NumPy / Pandas** | 1.26.4 / 2.2.0 | Data processing |
| **Pydantic** | 2.6.1 | Request/response validation |

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 18.3.1 | UI framework |
| **Vite** | 5.2.0 | Build tool & dev server |
| **React Router** | 6.22.3 | Client-side routing |
| **Recharts** | 2.12.2 | Metrics charts & gauges |
| **D3.js** | 7.9.0 | Interactive network graph |
| **Framer Motion** | 11.1.7 | Animations & transitions |
| **Axios** | 1.6.8 | HTTP client |

### Infrastructure
| Technology | Purpose |
|------------|---------|
| **Docker** (multi-stage build) | Single-container deployment (frontend + backend) |
| **Hugging Face Spaces** | Cloud deployment target |

---

## 📁 Project Structure

```
Explainable-and-privacy-preserving-fraud-detection/
├── 📄 README.md
├── 📄 Dockerfile              # Multi-stage build (React → Python)
├── 📄 .env.example            # Environment variable template
├── 📄 SECURITY.md             # Security policy & vulnerability reporting
├── 📄 LICENSE
│
├── backend/
│   ├── 📄 main.py             # FastAPI entry point, CORS, lifespan
│   ├── 📄 requirements.txt
│   ├── 📄 test_logic_local.py # Local sanity test script
│   │
│   ├── models/
│   │   ├── fl_model.py        # Federated Learning inference wrapper
│   │   ├── gnn_model.py       # GraphSAGE-inspired GNN model
│   │   └── decision_engine.py # Dual-threshold BLOCK/FLAG/ALLOW engine
│   │
│   ├── routers/
│   │   ├── predict.py         # POST /api/predict
│   │   ├── explain.py         # POST /api/explain  (SHAP + LIME + Graph)
│   │   └── metrics.py         # GET  /api/metrics
│   │
│   ├── explainability/
│   │   ├── shap_utils.py      # SHAP computation
│   │   └── lime_utils.py      # LIME computation
│   │
│   ├── graph/                 # GNN graph data utilities
│   ├── data/                  # Sample transaction JSON
│   └── saved_models/          # Pre-trained model weights (gitignored)
│
└── frontend/
    ├── 📄 index.html
    ├── 📄 package.json
    ├── 📄 vite.config.js
    │
    └── src/
        ├── App.jsx            # Root component + routing
        ├── index.css          # Global styles & design system
        ├── main.jsx
        │
        ├── pages/
        │   ├── Landing.jsx    # Hero page
        │   ├── Analyze.jsx    # Transaction input form
        │   ├── Results.jsx    # Prediction + XAI results
        │   ├── Metrics.jsx    # Performance dashboard
        │   └── AlertQueue.jsx # Fraud alert management
        │
        └── components/
            ├── Navbar.jsx           # Navigation bar
            ├── ScoreGauge.jsx       # Animated risk score gauge
            ├── ShapChart.jsx        # SHAP bar chart
            ├── LimePanel.jsx        # LIME explanation panel
            ├── GraphView.jsx        # D3 transaction network
            ├── DecisionBadge.jsx    # BLOCK/FLAG/ALLOW badge
            └── ThresholdSlider.jsx  # Interactive threshold controls
```

---

## 🚀 Quick Start

### Prerequisites

- **Python** 3.11+
- **Node.js** 20+ and **npm**
- **Git**
- *(Optional)* **Docker** for containerised deployment

---

### Backend Setup

```bash
# 1. Clone the repository
git clone https://github.com/YOUR_USERNAME/Explainable-and-privacy-preserving-fraud-detection.git
cd Explainable-and-privacy-preserving-fraud-detection

# 2. Navigate to the backend
cd backend

# 3. Create and activate a virtual environment
python -m venv venv

# Windows:
venv\Scripts\activate
# macOS / Linux:
source venv/bin/activate

# 4. Install dependencies
pip install -r requirements.txt

# 5. Set environment to development (enables Swagger docs + hot reload)
# Windows PowerShell:
$env:APP_ENV="development"
# macOS / Linux:
export APP_ENV=development

# 6. Start the backend server
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

The API will be available at:
| URL | Purpose |
|-----|---------|
| `http://localhost:8000` | API base |
| `http://localhost:8000/docs` | Swagger UI *(development only)* |
| `http://localhost:8000/redoc` | ReDoc *(development only)* |
| `http://localhost:8000/health` | Health check |

> **Note:** If no pre-trained model weights are found in `backend/saved_models/`, the backend automatically initialises a calibrated mock model trained on synthetic fraud data — the demo always works out of the box without any training step.

---

### Frontend Setup

Open a **new terminal** (keep the backend running):

```bash
# From the repository root
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

The frontend will be available at **`http://localhost:5173`** and is pre-configured to proxy all `/api` requests to the backend.

---

### Docker Setup (Recommended)

The included `Dockerfile` performs a **multi-stage build** — compiling the React frontend and embedding it inside the Python backend image for a single-container deployment:

```bash
# From the repository root (where Dockerfile lives)

# Build the image
docker build -t fraudshield:latest .

# Run in production mode (docs disabled by default)
docker run -p 7860:7860 \
  -e APP_ENV=production \
  -e ALLOWED_ORIGINS=http://localhost:7860 \
  fraudshield:latest
```

Access the full application at: **`http://localhost:7860`**

> To run the Hugging Face Spaces deployment, set `ALLOWED_ORIGINS` to your Space URL (e.g., `https://your-space.hf.space`).

---

## ⚙️ Environment Variables

Copy `.env.example` to `.env` and fill in your values. **Never commit `.env` to Git.**

| Variable | Default | Description |
|----------|---------|-------------|
| `APP_ENV` | `production` | Set to `development` to enable Swagger UI and hot reload |
| `ALLOWED_ORIGINS` | `http://localhost:5173,http://localhost:3000` | Comma-separated list of allowed frontend origins for CORS |
| `VITE_API_URL` | *(empty)* | Frontend API base URL — leave empty when using the Vite proxy or Docker |

---

## 📡 API Reference

All endpoints are prefixed with `/api`.

> **Note:** Interactive API documentation (`/docs`, `/redoc`) is only available when `APP_ENV=development`. Docs are disabled in production for security.

---

### `POST /api/predict`

Runs a transaction through the full FL + GNN pipeline and returns fraud scores with a final decision.

**Request Body:**
```json
{
  "amount": 75000.00,
  "time": 2.5,
  "sender_id": "ACC_8821",
  "receiver_id": "MUL_9921",
  "transaction_type": "TRANSFER",
  "location_risk": 0.85,
  "tau_fl_flag": 0.6,
  "tau_fl_block": 0.8,
  "tau_gnn": 0.7
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `amount` | float | ✅ | Transaction amount in INR (must be > 0) |
| `time` | float | ✅ | Hour of day (0–24) |
| `sender_id` | string | ✅ | Sender account identifier |
| `receiver_id` | string | ✅ | Receiver account identifier |
| `transaction_type` | string | ✅ | One of: `UPI`, `NEFT`, `IMPS`, `TRANSFER`, `POS`, `ATM`, `ONLINE` |
| `location_risk` | float | — | Geographic/IP risk score (0=safe, 1=high). Default: `0.3` |
| `tau_fl_flag` | float | — | FL FLAG threshold. Default: `0.6` |
| `tau_fl_block` | float | — | FL BLOCK threshold. Default: `0.8` |
| `tau_gnn` | float | — | GNN threshold. Default: `0.7` |

**Response:**
```json
{
  "transaction_id": "TXN_A3F8B21C",
  "fl_score": 0.8734,
  "gnn_score": 0.7291,
  "decision": "BLOCK",
  "risk_tier": "CRITICAL",
  "confidence": 0.9120,
  "reasoning": "High behavioural risk AND structural mule-chain connection detected.",
  "pattern_type": "Fan-In Money Mule Chain",
  "client_id": "HDFC-Node",
  "fl_above_threshold": true,
  "gnn_above_threshold": true,
  "tau_fl_flag": 0.6,
  "tau_fl_block": 0.8,
  "tau_gnn": 0.7,
  "latency_ms": 38.4,
  "timestamp": "2026-04-24T08:00:00.000000+00:00",
  "using_mock": true
}
```

---

### `POST /api/explain`

Returns SHAP + LIME explanations and a D3-ready fraud subgraph for a transaction. Call this after `/api/predict`.

**Request Body:**
```json
{
  "amount": 75000.00,
  "time": 2.5,
  "sender_id": "ACC_8821",
  "receiver_id": "MUL_9921",
  "transaction_type": "TRANSFER",
  "location_risk": 0.85,
  "fl_score": 0.8734,
  "gnn_score": 0.7291,
  "pattern_type": "Fan-In Money Mule Chain",
  "transaction_id": "TXN_A3F8B21C"
}
```

> `fl_score`, `gnn_score`, and `pattern_type` come directly from the `/api/predict` response.

**Response:**
```json
{
  "transaction_id": "TXN_A3F8B21C",
  "shap": {
    "base_value": 0.1,
    "output_value": 0.8734,
    "feature_contributions": [
      {"feature": "Amount", "value": 0.32, "raw_value": 75000.0},
      {"feature": "Time", "value": 0.25, "raw_value": 2.5},
      {"feature": "LocationRisk", "value": 0.19, "raw_value": 0.85}
    ],
    "method": "SHAP KernelExplainer"
  },
  "lime": {
    "prediction": 0.8734,
    "conditions": [
      {"feature": "Amount", "condition": "> ₹75,000", "weight": 0.25, "direction": "FRAUD"},
      {"feature": "Time", "condition": "Night (00:00–04:00)", "weight": 0.22, "direction": "FRAUD"}
    ],
    "narrative": "This transaction was flagged primarily due to Amount (> ₹75,000) and Time (Night 00:00–04:00). The model assigns a fraud probability of 87.3%.",
    "method": "LIME TabularExplainer"
  },
  "subgraph": {
    "nodes": [...],
    "edges": [...]
  }
}
```

---

### `GET /api/metrics`

Returns static model performance metrics from the research paper (pre-computed — not recalculated at runtime).

**Response includes:**
- FL-only, GNN-only, and combined system metrics (recall, precision, F1, AUC-ROC)
- Comparison table vs. centralised baselines (Logistic Regression, XGBoost)
- Confusion matrices for all three configurations
- Federated convergence curve (10 rounds)
- GNN early stopping data (Epoch 20 vs. Epoch 50)
- SHAP feature stability across runs

---

### `GET /api/samples`

Returns 4 pre-built sample transactions for demo use (Coordinated Attack, Mule Transfer, Transactional Fraud, Normal Activity).

---

### `GET /health`

Returns API health status and loaded model names.

**Response:**
```json
{"status": "healthy", "models": ["fl_model", "gnn_model"]}
```

---

## 📊 Performance Metrics

| Metric | FraudShield (FL + GNN) | Centralised XGBoost |
|--------|------------------------|---------------------|
| **Recall** | **98.5%** | 99.5% |
| **AUC-ROC** | **99.3%** | 99.7% |
| **Privacy** | ✅ Full (GDPR/RBI) | ❌ None |
| **Explainability** | ✅ SHAP + LIME + Graph | ❌ None |
| **Avg. Latency** | ~42ms | ~18ms |

> **Why is Precision low (1.4%)?** Real-world banking data is severely class-imbalanced — roughly 1,000 legitimate transactions for every 1 fraudulent one. The low precision is acceptable because FraudShield's **FLAG** tier converts false positives into harmless OTP challenges, not account freezes.

### GNN Early Stopping

The GNN uses Early Stopping at **Epoch 20** to prevent over-smoothing — a phenomenon where fraud nodes and legitimate nodes mathematically converge with excessive training:

| Epoch | Recall |
|-------|--------|
| **20** (optimal) | **97.6%** |
| 50 (over-trained) | 85.6% |

---

## 📖 Research Alignment

This implementation directly implements the methodology from the research paper on **Explainable and Privacy-Preserving Fraud Detection in Mobile Banking**.

### Core Contributions Implemented

| Paper Concept | File |
|--------------|------|
| FedAvg aggregation across 5 bank nodes | `backend/models/fl_model.py` |
| GraphSAGE neighbourhood aggregation | `backend/models/gnn_model.py` |
| Decision-level fusion (not feature-level) | `backend/models/decision_engine.py` |
| SHAP explainability | `backend/explainability/shap_utils.py` |
| LIME surrogate explanations | `backend/explainability/lime_utils.py` |
| Dual-threshold policy matrix (τF / τG) | `backend/models/decision_engine.py` |
| Early Stopping at Epoch 20 | `backend/models/gnn_model.py` |

### Privacy Compliance

| Regulation | Compliance | How |
|------------|-----------|-----|
| **GDPR Article 22** | ✅ | SHAP/LIME explanations for every automated decision |
| **RBI Data Localisation (2018)** | ✅ | Raw data never leaves the originating bank node |
| **Differential Privacy** | ✅ | Only aggregated gradients (weights) are shared via FedAvg |
| **No PII in transmission** | ✅ | Account IDs are synthetic; no names/phone numbers processed |

---

## 🔒 Security

FraudShield is hardened for public deployment:

| Control | Implementation |
|---------|---------------|
| **CORS** | Locked to explicit origins via `ALLOWED_ORIGINS` env var — no wildcard |
| **API Docs** | Disabled in production (`APP_ENV=production`); enabled only in development |
| **HTTP Methods** | Restricted to `GET` and `POST` only |
| **Credentials** | `allow_credentials=False` — no cross-origin cookie sharing |
| **Secrets** | All configuration via environment variables; `.env` excluded from Git |
| **Docker** | Defaults to `APP_ENV=production` — safe out of the box |

For vulnerability reporting, see [SECURITY.md](SECURITY.md).

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes using [Conventional Commits](https://www.conventionalcommits.org/): `git commit -m 'feat: add your feature'`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Open a Pull Request

### Development Guidelines

- Follow **PEP 8** for all Python code
- Add **docstrings** to all new Python functions and classes
- Use **ESLint** formatting for JavaScript/React
- Document any new API endpoints in this README
- Do not commit `.env` files or pre-trained model weights (`.pkl`)

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgements

- Research paper authors for the foundational methodology and datasets
- [SHAP](https://github.com/slundberg/shap) — Lundberg & Lee (2017) game-theoretic explainability
- [LIME](https://github.com/marcotcr/lime) — Ribeiro et al. (2016) local surrogate models
- [NetworkX](https://networkx.org/) — Graph construction and analysis
- [Hugging Face Spaces](https://huggingface.co/spaces) — Free model hosting
- [FastAPI](https://fastapi.tiangolo.com/) — High-performance Python API framework

---

<div align="center">

**Built for privacy-first, explainable AI in financial services**

⭐ If this project helped you, please consider giving it a star!

</div>
