# ⚖️ FairSight: AI Bias Audit & Mitigation Tool

**FairSight** is a comprehensive web-based platform designed to detect, visualize, and mitigate bias in datasets and machine learning models. It provides data scientists and auditors with the tools to ensure algorithmic fairness and regulatory compliance.

![FairSight Dashboard Preview](https://via.placeholder.com/1200x600?text=FairSight+Audit+Dashboard+Preview)

---

## 🚀 Key Features

- **📊 Data Bias Analysis**: Automatically detect statistical imbalances in your datasets. Calculate metrics like Disparate Impact Ratio and Statistical Parity across sensitive attributes (race, gender, age, etc.).
- **🤖 Model Fairness Evaluation**: Audit trained models for performance disparities. Compare Equalized Odds, Demographic Parity, and Predictive Rate Parity.
- **🛠️ Bias Mitigation Suite**: Apply state-of-the-art mitigation techniques:
  - **Pre-processing**: Resampling and Correlation Removal (Fairlearn integration).
  - **In-processing**: Adversarial Debiasing suggestions.
  - **Post-processing**: Threshold Optimization.
- **📈 Interactive Visualizations**: Dynamic charts powered by Recharts to identify bias trends at a glance.
- **📄 Audit Reports**: Export findings as CSV or downloadable debiased datasets.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: [React 19](https://reactjs.org/) (Vite)
- **Styling**: Vanilla CSS (Custom Design System)
- **Visualization**: [Recharts](https://recharts.org/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **API Client**: [Axios](https://axios-http.com/)

### Backend
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/) (Python)
- **Data Processing**: [Pandas](https://pandas.pydata.org/), [NumPy](https://numpy.org/)
- **Fairness Library**: [Fairlearn](https://fairlearn.org/)
- **Machine Learning**: [Scikit-learn](https://scikit-learn.org/)

---

## 🏗️ Project Structure

```text
FairSight/
├── backend/            # FastAPI Server
│   ├── api/            # Route handlers (Data, Model, Mitigation)
│   ├── main.py         # Application entry point
│   └── venv/           # Python Virtual Environment
├── frontend/           # React Frontend
│   ├── src/
│   │   ├── components/ # Reusable UI components
│   │   ├── pages/      # Dashboard pages (DataBias, ModelBias, etc.)
│   │   └── App.jsx     # Main application logic
│   └── package.json    # Frontend dependencies
└── test/               # Unit and Integration tests
```

---

## 🚦 Getting Started

### 1. Prerequisites
- Python 3.9+
- Node.js 18+
- npm or yarn

### 2. Backend Setup
```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv

# Activate venv
# Windows:
.\venv\Scripts\activate
# Unix/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the server
python main.py
```
The backend will be running at `http://localhost:8000`.

### 3. Frontend Setup
```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```
The frontend will be running at `http://localhost:5173`.

---

## 📖 Usage

1. **Upload Dataset**: Go to the **Data Bias** page and upload your CSV.
2. **Select Attributes**: Choose the *Sensitive Attribute* (e.g., Gender) and the *Target Attribute* (e.g., Credit_Approval).
3. **Analyze**: View the Disparate Impact Ratio. Groups highlighted in red indicate potential bias.
4. **Mitigate**: Navigate to the **Mitigation** tab to apply techniques like *Resampling* and download the cleaned dataset.

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request or open an Issue for feature requests and bug reports.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

*Built with ❤️ for a fairer AI future.*
