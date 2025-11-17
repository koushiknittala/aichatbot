import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Upload,
  FileText,
  LogOut,
  Brain,
  Trash2,
  CheckCircle,
  AlertCircle,
  Settings,
  BarChart3,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Sparkles,
  Folder
} from 'lucide-react';
import Header from './Header';
import './AdminPanel.css';

const API_BASE_URL = 'http://localhost:5000/api';

function AdminPanel() {
  const [documents, setDocuments] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [description, setDescription] = useState('');
  const [isTraining, setIsTraining] = useState(false);
  const [trainingStatus, setTrainingStatus] = useState('');
  const [feedbackStats, setFeedbackStats] = useState(null);
  const [adminSettings, setAdminSettings] = useState({
    default_model: 'llama3.2',
    available_models: ['llama3.2', 'llama3', 'llama2', 'mistral', 'phi']
  });
  const [showSettings, setShowSettings] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }
    loadAdminData();
    loadAdminSettings();
    loadFeedbackStats();
  }, [navigate]);

  const loadAdminData = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`${API_BASE_URL}/admin/data`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.documents) {
        setDocuments(response.data.documents);
      }
    } catch (error) {
      console.error('Error loading admin data:', error);
      if (error.response?.status === 401) {
        handleLogout();
      }
    }
  };

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      await axios.post(`${API_BASE_URL}/admin/logout`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('adminToken');
      navigate('/admin/login');
    }
  };

  const uploadDocuments = async (files) => {
    if (!files || files.length === 0) return;

    // Filter only PDF files
    const pdfFiles = Array.from(files).filter(file => file.type === 'application/pdf');
    
    if (pdfFiles.length === 0) {
      alert('Please upload only PDF files.');
      return;
    }

    // For single file upload, description is required
    // For folder/multiple file upload, description is optional
    if (pdfFiles.length === 1 && !description.trim()) {
      alert('Please enter a description before uploading.');
      return;
    }

    setIsUploading(true);

    try {
      const token = localStorage.getItem('adminToken');
      const formData = new FormData();
      
      // Append all files
      pdfFiles.forEach(file => {
        formData.append('files', file);
      });
      
      formData.append('agent_id', 'default');
      if (description.trim()) {
        formData.append('description', description.trim());
      }

      const response = await axios.post(`${API_BASE_URL}/admin/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.success) {
        await loadAdminData();
        if (pdfFiles.length === 1) {
          setDescription('');
        }
        
        let message = response.data.message || `${pdfFiles.length} file(s) uploaded successfully!`;
        if (response.data.warnings && response.data.warnings.length > 0) {
          message += '\n\nWarnings:\n' + response.data.warnings.join('\n');
        }
        alert(message);
      }
    } catch (error) {
      console.error('Upload error:', error);
      const errorMsg = error.response?.data?.error || 'Unknown error';
      const errors = error.response?.data?.errors || [];
      let fullError = errorMsg;
      if (errors.length > 0) {
        fullError += '\n\nErrors:\n' + errors.join('\n');
      }
      alert(`Error uploading files: ${fullError}`);
    } finally {
      setIsUploading(false);
    }
  };

  const uploadDocument = async (file) => {
    await uploadDocuments([file]);
  };

  const handleFileInputChange = async (event) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      await uploadDocuments(files);
    }
    if (event.target) {
      event.target.value = '';
    }
  };

  const handleFolderInputChange = async (event) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      await uploadDocuments(files);
    }
    if (event.target) {
      event.target.value = '';
    }
  };

  const handleDrop = async (event) => {
    event.preventDefault();
    event.currentTarget.classList.remove('dragover');
    const files = event.dataTransfer.files;
    if (files && files.length > 0) {
      await uploadDocuments(files);
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    event.currentTarget.classList.add('dragover');
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    event.currentTarget.classList.remove('dragover');
  };

  const handleTrainAgent = async () => {
    setIsTraining(true);
    setTrainingStatus('Training agent...');

    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.post(
        `${API_BASE_URL}/admin/train`,
        { agent_id: 'default' },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setTrainingStatus('Agent trained successfully!');
        await loadAdminData();
        setTimeout(() => setTrainingStatus(''), 3000);
      }
    } catch (error) {
      console.error('Training error:', error);
      setTrainingStatus(`Error: ${error.response?.data?.error || 'Training failed'}`);
      setTimeout(() => setTrainingStatus(''), 5000);
    } finally {
      setIsTraining(false);
    }
  };

  const handleDeleteDocument = async (docId) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;

    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.delete(`${API_BASE_URL}/admin/documents/${docId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        data: { agent_id: 'default' }
      });

      if (response.data.success) {
        await loadAdminData();
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Error deleting document');
    }
  };

  const loadAdminSettings = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`${API_BASE_URL}/admin/settings`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success && response.data.settings) {
        setAdminSettings(response.data.settings);
      }
    } catch (error) {
      console.error('Error loading admin settings:', error);
    }
  };

  const updateDefaultModel = async (model) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.post(
        `${API_BASE_URL}/admin/settings`,
        { default_model: model },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setAdminSettings(response.data.settings);
        alert('Default model updated successfully!');
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      alert('Error updating default model');
    }
  };

  const loadFeedbackStats = async () => {
    try {
      setStatsLoading(true);
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`${API_BASE_URL}/admin/logs/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setFeedbackStats(response.data.stats);
      }
    } catch (error) {
      console.error('Error loading feedback stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const allDocuments = documents.filter(doc => doc.agent_id === 'default' || !doc.agent_id);

  const navLinks = [
    { to: '/', label: 'Home', end: true },
    { to: '/about', label: 'About' },
    { to: '/services', label: 'Services' },
    { to: '/contact', label: 'Contact' }
  ];

  return (
    <div className="admin-panel">
      <Header
        navLinks={navLinks}
        rightContent={
          <>
            <button
              className="admin-tab"
              type="button"
              onClick={() => navigate('/')}
            >
              User
            </button>
            <button className="admin-tab active" type="button">
              Admin
            </button>
            <button
              className="admin-tab"
              type="button"
              onClick={() => navigate('/admin/logs')}
            >
              User Logs
            </button>
            <button onClick={handleLogout} className="logout-button" type="button">
              <LogOut size={18} />
              Logout
            </button>
          </>
        }
      />

      <div className="admin-content">
        <div className="admin-main">
          {/* Feedback Stats Section */}
          {feedbackStats && (
            <div className="stats-section">
              <div className="stats-header">
                <BarChart3 size={24} />
                <h3>Feedback Statistics</h3>
                <button
                  className="refresh-stats-btn"
                  onClick={loadFeedbackStats}
                  disabled={statsLoading}
                  title="Refresh statistics"
                >
                  ↻
                </button>
              </div>
              <div className="stats-grid">
                <div className="stat-card">
                  <MessageSquare size={20} />
                  <div className="stat-value">{feedbackStats.total_responses || 0}</div>
                  <div className="stat-label">Total Responses</div>
                </div>
                <div className="stat-card good">
                  <ThumbsUp size={20} />
                  <div className="stat-value">{feedbackStats.good_feedback || 0}</div>
                  <div className="stat-label">Good Feedback</div>
                </div>
                <div className="stat-card bad">
                  <ThumbsDown size={20} />
                  <div className="stat-value">{feedbackStats.bad_feedback || 0}</div>
                  <div className="stat-label">Bad Feedback</div>
                </div>
                <div className="stat-card">
                  <AlertCircle size={20} />
                  <div className="stat-value">{feedbackStats.no_feedback || 0}</div>
                  <div className="stat-label">No Feedback</div>
                </div>
              </div>
              {feedbackStats.model_stats && Object.keys(feedbackStats.model_stats).length > 0 && (
                <div className="model-stats">
                  <h4>Statistics by Model:</h4>
                  {Object.entries(feedbackStats.model_stats).map(([model, stats]) => (
                    <div key={model} className="model-stat-item">
                      <strong>{model}:</strong> Total: {stats.total}, Good: {stats.good}, Bad: {stats.bad}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Settings Section */}
          <div className="settings-section">
            <div className="settings-header" onClick={() => setShowSettings(!showSettings)}>
              <Settings size={20} />
              <h3>AI Model Settings</h3>
              <span className="toggle-icon">{showSettings ? '▼' : '▶'}</span>
            </div>
            {showSettings && (
              <div className="settings-content">
                <div className="setting-item">
                  <label>Default AI Model:</label>
                  <div className="model-selector-settings">
                    {adminSettings.available_models?.map((model) => (
                      <button
                        key={model}
                        className={`model-btn ${adminSettings.default_model === model ? 'active' : ''}`}
                        onClick={() => updateDefaultModel(model)}
                      >
                        <Sparkles size={16} />
                        {model}
                        {adminSettings.default_model === model && (
                          <span className="default-indicator">Default</span>
                        )}
                      </button>
                    ))}
                  </div>
                  <p className="setting-hint">
                    Users will use this model by default, but can override it in the chat interface.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="admin-section">
            <h2>Document Management</h2>
            <p className="section-description">
              Upload documents to enhance the AI chatbot's knowledge base
            </p>
            <div className="training-guide">
              <ol>
                <li>Add a short description (optional for folder uploads).</li>
                <li>Upload PDF files or entire folders.</li>
                <li>The AI will automatically use these documents when answering questions.</li>
                <li>Click <strong>Train</strong> to refresh the knowledge base with latest files.</li>
              </ol>
            </div>

            {trainingStatus && (
              <div className={`training-status ${trainingStatus.includes('Error') ? 'error' : 'success'}`}>
                {trainingStatus}
              </div>
            )}

            <div className="description-section">
              <label htmlFor="admin-doc-description">Document Description</label>
              <textarea
                id="admin-doc-description"
                className="description-input"
                placeholder="Add a short description or summary for this document..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isUploading}
              />
              <p className="description-hint">
                Descriptions help you identify documents later and improve context for your team.
              </p>
            </div>

            <div className="upload-section">
              <h3>Upload Documents</h3>
              <div
                className="upload-area"
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <Upload size={48} />
                <p>Drag and drop PDF files here or use the buttons below</p>
                <div className="upload-buttons">
                  <button
                    className="upload-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    disabled={isUploading || !description.trim()}
                    type="button"
                  >
                    <Upload size={18} />
                    {isUploading ? 'Uploading...' : 'Choose File(s)'}
                  </button>
                  <button
                    className="upload-btn folder-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      folderInputRef.current?.click();
                    }}
                    disabled={isUploading}
                    type="button"
                  >
                    <Folder size={18} />
                    {isUploading ? 'Uploading...' : 'Upload Folder'}
                  </button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="file-input"
                  accept=".pdf"
                  multiple
                  onChange={handleFileInputChange}
                  disabled={isUploading}
                />
                <input
                  ref={folderInputRef}
                  type="file"
                  className="file-input"
                  accept=".pdf"
                  multiple
                  webkitdirectory=""
                  directory=""
                  onChange={handleFolderInputChange}
                  disabled={isUploading}
                />
              </div>
              <p className="upload-hint">
                <strong>Single File:</strong> Description required. <strong>Folder/Multiple Files:</strong> Description optional (will use filename if not provided).
              </p>
            </div>

            <div className="documents-section">
              <h3>Uploaded Documents ({allDocuments.length})</h3>
              {allDocuments.length === 0 ? (
                <div className="no-documents">
                  <FileText size={48} />
                  <p>No documents uploaded yet.</p>
                </div>
              ) : (
                <div className="documents-list">
                  {allDocuments.map((doc) => (
                    <div key={doc.id} className="document-item">
                      <FileText size={20} />
                      <div className="document-info">
                        <div className="document-name">{doc.filename}</div>
                        {doc.description && (
                          <div className="document-description">{doc.description}</div>
                        )}
                        <div className="document-date">
                          Uploaded: {doc.uploaded_at ? new Date(doc.uploaded_at).toLocaleString() : 'N/A'}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteDocument(doc.id)}
                        className="delete-btn"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="train-section">
              <button
                onClick={handleTrainAgent}
                disabled={isTraining || allDocuments.length === 0}
                className="train-button"
              >
                <Brain size={20} />
                {isTraining ? 'Training...' : 'Train AI'}
              </button>
              <p className="train-hint">
                {allDocuments.length === 0
                  ? 'Upload documents before training'
                  : 'Train the AI to use your latest documents'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminPanel;