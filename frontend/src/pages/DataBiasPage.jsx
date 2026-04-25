import React, { useState, useRef } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { UploadCloud, CheckCircle, AlertTriangle, Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const DataBiasPage = () => {
  const [file, setFile] = useState(null);
  const [columns, setColumns] = useState([]);
  const [sensitiveAttr, setSensitiveAttr] = useState('');
  const [targetAttr, setTargetAttr] = useState('');
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
        setTargetAttr(res.data.columns[1] || '');
      } catch (err) {
        setError('Failed to extract columns. Please ensure it is a valid CSV.');
      }
    }
  };

  const handleAnalyze = async () => {
    if (!file || !sensitiveAttr || !targetAttr) return;
    
    setLoading(true);
    setError(null);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('sensitive_attribute', sensitiveAttr);
    formData.append('target_attribute', targetAttr);
    
    try {
      const res = await axios.post('http://localhost:8000/api/data/analyze', formData);
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
    pdf.save('data_bias_report.pdf');
  };

  const exportCSV = () => {
    if (!results) return;
    const headers = ['Group', 'Count', 'Positive Count', 'Positive Rate', 'Disparate Impact Ratio', 'Status'];
    const rows = results.group_stats.map(s => [
      s.group, s.count, s.positive_count, s.positive_rate, s.disparate_impact_ratio, s.flag
    ]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(',') + '\n' 
      + rows.map(e => e.join(',')).join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "data_bias_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      <h1>Data Bias Analysis</h1>
      <p>Analyze your dataset for demographic disparities.</p>
      
      {!file && (
        <div className="card">
          <div className="dropzone" onClick={() => document.getElementById('file-upload').click()}>
            <UploadCloud size={48} color="var(--primary)" style={{ margin: '0 auto 1rem' }} />
            <h3>Upload Dataset</h3>
            <p>Drag and drop or click to select a CSV file</p>
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
          
          <div className="card-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div className="form-group">
              <label>Sensitive Attribute (e.g., Race, Gender)</label>
              <select value={sensitiveAttr} onChange={e => setSensitiveAttr(e.target.value)}>
                {columns.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Target Attribute (Outcome to predict)</label>
              <select value={targetAttr} onChange={e => setTargetAttr(e.target.value)}>
                {columns.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          
          {error && <div style={{ color: 'var(--danger)', marginBottom: '1rem', padding: '1rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: 'var(--radius)' }}>{error}</div>}
          
          <button className="btn" onClick={handleAnalyze} disabled={loading || !sensitiveAttr || !targetAttr}>
            {loading ? 'Analyzing...' : 'Run Analysis'}
          </button>
        </div>
      )}

      {results && (
        <div ref={reportRef} style={{ backgroundColor: 'var(--bg-dark)', padding: '1rem', margin: '-1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', padding: '1rem' }}>
            <h2>Analysis Results</h2>
            <div style={{ display: 'flex', gap: '1rem' }} data-html2canvas-ignore="true">
              <button className="btn btn-secondary" onClick={exportCSV}><Download size={16} /> CSV</button>
              <button className="btn btn-secondary" onClick={exportPDF}><Download size={16} /> PDF</button>
            </div>
          </div>

          <div className="card">
            <h3>Disparate Impact (4/5ths Rule)</h3>
            <p>If the disparate impact ratio is less than 0.8 (80%), it may indicate adverse impact for that group.</p>
            
            <div style={{ height: '300px', marginTop: '2rem' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={results.group_stats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="group" stroke="var(--text-muted)" />
                  <YAxis stroke="var(--text-muted)" />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }} />
                  <Legend />
                  <Bar dataKey="positive_rate" name="Positive Rate" fill="var(--primary)" />
                  <Bar dataKey="disparate_impact_ratio" name="Disparate Impact Ratio" fill="var(--warning)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card">
            <h3>Group Statistics</h3>
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>Group</th>
                    <th>Count</th>
                    <th>Positive Outcomes</th>
                    <th>Positive Rate</th>
                    <th>Disparate Impact Ratio</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {results.group_stats.map((stat, i) => (
                    <tr key={i}>
                      <td>{stat.group}</td>
                      <td>{stat.count}</td>
                      <td>{stat.positive_count}</td>
                      <td>{(stat.positive_rate * 100).toFixed(2)}%</td>
                      <td>{stat.disparate_impact_ratio.toFixed(2)}</td>
                      <td>
                        {stat.flag === 'red' ? (
                          <span style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <AlertTriangle size={16} /> Flagged
                          </span>
                        ) : (
                          <span style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <CheckCircle size={16} /> OK
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataBiasPage;
