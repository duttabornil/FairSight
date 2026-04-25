import React, { useState, useRef } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { UploadCloud, CheckCircle, Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const ModelBiasPage = () => {
  const [file, setFile] = useState(null);
  const [columns, setColumns] = useState([]);
  const [sensitiveAttr, setSensitiveAttr] = useState('');
  const [trueLabel, setTrueLabel] = useState('');
  const [predLabel, setPredLabel] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const reportRef = useRef(null);

  const handleFileChange = async (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setResults(null);
      setError(null);
      
      const formData = new FormData();
      formData.append('file', selectedFile);
      
      try {
        const res = await axios.post('http://localhost:8000/api/data/columns', formData);
        setColumns(res.data.columns);
        setSensitiveAttr(res.data.columns[0] || '');
        setTrueLabel(res.data.columns[1] || '');
        setPredLabel(res.data.columns[2] || '');
      } catch (err) {
        setError('Failed to extract columns. Please ensure it is a valid CSV.');
      }
    }
  };

  const handleAnalyze = async () => {
    if (!file || !sensitiveAttr || !trueLabel || !predLabel) return;
    
    setLoading(true);
    setError(null);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('sensitive_attribute', sensitiveAttr);
    formData.append('true_label_attribute', trueLabel);
    formData.append('pred_label_attribute', predLabel);
    
    try {
      const res = await axios.post('http://localhost:8000/api/model/analyze', formData);
      setResults(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'An error occurred during analysis');
    } finally {
      setLoading(false);
    }
  };

  const exportPDF = async () => {
    if (!reportRef.current) return;
    const canvas = await html2canvas(reportRef.current);
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save('model_bias_report.pdf');
  };

  return (
    <div>
      <h1>Model Bias Detection</h1>
      <p>Evaluate your model's predictions using fairness metrics like Demographic Parity and Equalized Odds.</p>
      
      {!file && (
        <div className="card">
          <div className="dropzone" onClick={() => document.getElementById('file-upload').click()}>
            <UploadCloud size={48} color="var(--primary)" style={{ margin: '0 auto 1rem' }} />
            <h3>Upload Predictions Dataset</h3>
            <p>Upload a CSV with true labels, predicted labels, and sensitive attributes.</p>
            <input id="file-upload" type="file" accept=".csv" style={{ display: 'none' }} onChange={handleFileChange} />
          </div>
        </div>
      )}

      {file && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle size={20} color="var(--success)" />
              {file.name}
            </h3>
            <button className="btn btn-secondary" onClick={() => { setFile(null); setResults(null); setColumns([]); }}>Change File</button>
          </div>
          
          <div className="card-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
            <div className="form-group">
              <label>Sensitive Attribute</label>
              <select value={sensitiveAttr} onChange={e => setSensitiveAttr(e.target.value)}>
                {columns.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>True Label Attribute</label>
              <select value={trueLabel} onChange={e => setTrueLabel(e.target.value)}>
                {columns.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Predicted Label Attribute</label>
              <select value={predLabel} onChange={e => setPredLabel(e.target.value)}>
                {columns.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          
          {error && <div style={{ color: 'var(--danger)', marginBottom: '1rem', padding: '1rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: 'var(--radius)' }}>{error}</div>}
          
          <button className="btn" onClick={handleAnalyze} disabled={loading || !sensitiveAttr || !trueLabel || !predLabel}>
            {loading ? 'Analyzing...' : 'Run Analysis'}
          </button>
        </div>
      )}

      {results && (
        <div ref={reportRef} style={{ backgroundColor: 'var(--bg-dark)', padding: '1rem', margin: '-1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', padding: '1rem' }}>
            <h2>Evaluation Results</h2>
            <button className="btn btn-secondary" onClick={exportPDF} data-html2canvas-ignore="true"><Download size={16} /> Export PDF</button>
          </div>

          <div className="card-grid">
            <div className="card metric-card">
              <span style={{ color: 'var(--text-muted)' }}>Overall Accuracy</span>
              <span className="metric-value">{(results.overall_metrics.accuracy * 100).toFixed(1)}%</span>
            </div>
            <div className="card metric-card">
              <span style={{ color: 'var(--text-muted)' }}>Demographic Parity Diff</span>
              <span className={`metric-value ${results.fairness_metrics.demographic_parity_difference > 0.1 ? 'status-red' : 'status-green'}`}>
                {results.fairness_metrics.demographic_parity_difference.toFixed(4)}
              </span>
            </div>
            <div className="card metric-card">
              <span style={{ color: 'var(--text-muted)' }}>Equalized Odds Diff</span>
              <span className={`metric-value ${results.fairness_metrics.equalized_odds_difference > 0.1 ? 'status-red' : 'status-green'}`}>
                {results.fairness_metrics.equalized_odds_difference.toFixed(4)}
              </span>
            </div>
          </div>

          <div className="card">
            <h3>Group Fairness Metrics</h3>
            <div style={{ height: '300px', marginTop: '2rem' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={results.group_metrics}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="group" stroke="var(--text-muted)" />
                  <YAxis stroke="var(--text-muted)" />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }} />
                  <Legend />
                  <Bar dataKey="selection_rate" name="Selection Rate (Positive Pred)" fill="var(--primary)" />
                  <Bar dataKey="tpr" name="True Positive Rate" fill="var(--success)" />
                  <Bar dataKey="fpr" name="False Positive Rate" fill="var(--danger)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card">
            <h3>Metric Details</h3>
            <p><strong>Demographic Parity</strong>: Requires the model's positive predictions to be independent of the sensitive attribute. (Diff should be close to 0).</p>
            <p><strong>Equalized Odds</strong>: Requires the model's true positive and false positive rates to be independent of the sensitive attribute. (Diff should be close to 0).</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModelBiasPage;
