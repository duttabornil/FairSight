import React, { useState } from 'react';
import axios from 'axios';
import { UploadCloud, CheckCircle, Download, Shield } from 'lucide-react';

const MitigationPage = () => {
  const [file, setFile] = useState(null);
  const [columns, setColumns] = useState([]);
  const [sensitiveAttr, setSensitiveAttr] = useState('');
  const [targetAttr, setTargetAttr] = useState('');
  const [suggestions, setSuggestions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = async (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setSuggestions(null);
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

  const handleGetSuggestions = async () => {
    if (!file || !sensitiveAttr || !targetAttr) return;
    
    setLoading(true);
    setError(null);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('sensitive_attribute', sensitiveAttr);
    formData.append('target_attribute', targetAttr);
    
    try {
      const res = await axios.post('http://localhost:8000/api/mitigation/suggest', formData);
      setSuggestions(res.data.suggestions);
    } catch (err) {
      setError(err.response?.data?.detail || 'An error occurred fetching suggestions');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyMitigation = async (method) => {
    if (!file || !sensitiveAttr) return;
    
    setApplying(true);
    setError(null);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('sensitive_attribute', sensitiveAttr);
    formData.append('target_attribute', targetAttr);
    formData.append('method', method);
    
    try {
      const res = await axios.post('http://localhost:8000/api/mitigation/apply', formData, {
        responseType: 'blob'
      });
      
      // Create download link for the returned CSV
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `debiased_${file.name}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError('An error occurred while applying mitigation. Ensure your dataset has suitable numeric features for this method.');
    } finally {
      setApplying(false);
    }
  };

  return (
    <div>
      <h1>Bias Mitigation</h1>
      <p>Get suggestions and apply algorithms to mitigate bias in your datasets and models.</p>
      
      {!file && (
        <div className="card">
          <div className="dropzone" onClick={() => document.getElementById('file-upload').click()}>
            <UploadCloud size={48} color="var(--primary)" style={{ margin: '0 auto 1rem' }} />
            <h3>Upload Dataset</h3>
            <p>Upload your original dataset to see mitigation strategies.</p>
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
            <button className="btn btn-secondary" onClick={() => { setFile(null); setSuggestions(null); setColumns([]); }}>Change File</button>
          </div>
          
          <div className="card-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div className="form-group">
              <label>Sensitive Attribute</label>
              <select value={sensitiveAttr} onChange={e => setSensitiveAttr(e.target.value)}>
                {columns.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Target Attribute</label>
              <select value={targetAttr} onChange={e => setTargetAttr(e.target.value)}>
                {columns.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          
          {error && <div style={{ color: 'var(--danger)', marginBottom: '1rem', padding: '1rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: 'var(--radius)' }}>{error}</div>}
          
          <button className="btn" onClick={handleGetSuggestions} disabled={loading || !sensitiveAttr || !targetAttr}>
            {loading ? 'Analyzing...' : 'Get Mitigation Suggestions'}
          </button>
        </div>
      )}

      {suggestions && (
        <div style={{ marginTop: '2rem' }}>
          <h2>Recommended Strategies</h2>
          <div className="card-grid">
            {suggestions.map((s, idx) => (
              <div key={idx} className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                    <Shield size={24} color="var(--primary)" />
                    <h3 style={{ margin: 0 }}>{s.name}</h3>
                  </div>
                  <span style={{ display: 'inline-block', padding: '0.25rem 0.5rem', backgroundColor: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary)', borderRadius: '1rem', fontSize: '0.875rem', marginBottom: '1rem' }}>
                    {s.type}
                  </span>
                  <p>{s.description}</p>
                </div>
                
                {['Correlation Remover', 'Resampling'].includes(s.name) && (
                  <button 
                    className="btn" 
                    style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }}
                    onClick={() => handleApplyMitigation(s.name)}
                    disabled={applying}
                  >
                    {applying ? 'Applying...' : <><Download size={16} /> Download Debiased Data</>}
                  </button>
                )}
                {!['Correlation Remover', 'Resampling'].includes(s.name) && (
                  <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }} disabled>
                    Documentation Only
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MitigationPage;
