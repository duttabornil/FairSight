import React from 'react';
import { NavLink } from 'react-router-dom';
import { Database, Activity, ShieldAlert } from 'lucide-react';

const DashboardPage = () => {
  return (
    <div>
      <h1>FairSight Dashboard</h1>
      <p>Welcome to FairSight, your comprehensive tool for detecting and mitigating bias in machine learning datasets and models.</p>
      
      <div className="card-grid" style={{ marginTop: '2rem' }}>
        <div className="card">
          <Database size={32} color="var(--primary)" style={{ marginBottom: '1rem' }} />
          <h2>Data Bias Analysis</h2>
          <p>Upload your dataset to detect sensitive attributes and analyze disparate impact across different demographic groups.</p>
          <NavLink to="/data-bias" className="btn">Get Started</NavLink>
        </div>
        
        <div className="card">
          <Activity size={32} color="var(--warning)" style={{ marginBottom: '1rem' }} />
          <h2>Model Bias Detection</h2>
          <p>Evaluate your model's predictions against true labels using fairness metrics like Demographic Parity and Equalized Odds.</p>
          <NavLink to="/model-bias" className="btn" style={{ backgroundColor: 'var(--warning)', color: '#000' }}>Evaluate Model</NavLink>
        </div>
        
        <div className="card">
          <ShieldAlert size={32} color="var(--success)" style={{ marginBottom: '1rem' }} />
          <h2>Mitigation & Reports</h2>
          <p>Get actionable suggestions to mitigate bias and export comprehensive PDF or CSV reports.</p>
          <NavLink to="/mitigation" className="btn" style={{ backgroundColor: 'var(--success)' }}>View Options</NavLink>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
