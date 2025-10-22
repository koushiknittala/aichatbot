import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { 
  Send, 
  Paperclip, 
  Upload, 
  FileText, 
  X, 
  Bot, 
  User, 
  Bell,
  Menu
} from 'lucide-react';
import './App.css';

const API_BASE_URL = 'http://localhost:5000/api';

function App() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! I'm here to help you with any questions about MSME ONE. What can I do for you today?",
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [showUpload, setShowUpload] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: Date.now(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/chat`, {
        message: inputMessage
      });

      setTimeout(() => {
        const botMessage = {
          id: Date.now() + 1,
          text: response.data.response,
          sender: 'bot',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, botMessage]);
        setIsTyping(false);
      }, 1000);

    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        id: Date.now() + 1,
        text: 'Sorry, I encountered an error. Please try again.',
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      setIsTyping(false);
    }
  };

  const handleFileUpload = async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);

    for (const file of files) {
      if (file.type !== 'application/pdf') {
        alert('Please upload only PDF files.');
        continue;
      }

      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await axios.post(`${API_BASE_URL}/upload`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        if (response.data) {
          setUploadedFiles(prev => [...prev, {
            id: Date.now() + Math.random(),
            name: file.name,
            fileId: response.data.file_id
          }]);

          const botMessage = {
            id: Date.now() + Math.random(),
            text: `Document "${file.name}" uploaded successfully! You can now ask questions about it.`,
            sender: 'bot',
            timestamp: new Date()
          };
          setMessages(prev => [...prev, botMessage]);
        }
      } catch (error) {
        console.error('Upload error:', error);
        alert(`Error uploading ${file.name}: ${error.response?.data?.error || 'Unknown error'}`);
      }
    }

    setIsUploading(false);
    setShowUpload(false);
  };

  const removeFile = (fileId) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="logo">
          <div className="logo-icon">M</div>
          <div className="logo-text">MSME ONE</div>
        </div>
        <nav className="nav">
          <div className="nav-links">
            <a href="#home">Home</a>
            <a href="#about">About</a>
            <a href="#services">Services</a>
            <a href="#contact">Contact</a>
          </div>
          <div className="header-icons">
            <button className="icon-btn">
              <Bell size={20} />
            </button>
            <div className="user-avatar">
              <User size={20} />
            </div>
          </div>
        </nav>
      </header>

      {/* Main Container */}
      <div className="main-container">
        <div className="chat-container">
          {/* Chat Header */}
          <div className="chat-header">
            <div className="chat-title">Support Bot</div>
            <div className="chat-subtitle">
              Ask me anything about MSME ONE or upload documents for specific questions
            </div>
          </div>

          {/* Messages */}
          <div className="messages-container">
            {messages.map((message) => (
              <div key={message.id} className={`message ${message.sender}`}>
                <div className={`message-avatar ${message.sender === 'user' ? 'user-avatar' : 'bot-avatar'}`}>
                  {message.sender === 'user' ? <User size={20} /> : <Bot size={20} />}
                </div>
                <div className="message-content">
                  <div className="message-label">
                    {message.sender === 'user' ? 'You' : 'Support Bot'}
                  </div>
                  <div className={`message-bubble ${message.sender === 'user' ? 'user-message' : 'bot-message'}`}>
                    {message.text}
                  </div>
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="message bot">
                <div className="message-avatar bot-avatar">
                  <Bot size={20} />
                </div>
                <div className="message-content">
                  <div className="message-label">Support Bot</div>
                  <div className="message-bubble bot-message">
                    <div className="typing-indicator">
                      <div className="typing-dot"></div>
                      <div className="typing-dot"></div>
                      <div className="typing-dot"></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Container */}
          <div className="input-container">
            <div className="input-wrapper">
              <div className="input-avatar">
                <User size={16} />
              </div>
              <input
                type="text"
                className="message-input"
                placeholder="Type your message in English or Telugu..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isTyping}
              />
              <div className="input-actions">
                <button 
                  className="action-btn attach-btn"
                  onClick={() => setShowUpload(!showUpload)}
                  title="Upload Documents"
                >
                  <Paperclip size={16} />
                </button>
                <button 
                  className="action-btn send-btn"
                  onClick={sendMessage}
                  disabled={!inputMessage.trim() || isTyping}
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Upload Section */}
          {showUpload && (
            <div className="upload-section">
              <div className="upload-title">Upload Documents</div>
              <div 
                className="upload-area"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.add('dragover');
                }}
                onDragLeave={(e) => {
                  e.currentTarget.classList.remove('dragover');
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.remove('dragover');
                  handleFileUpload({ target: { files: e.dataTransfer.files } });
                }}
              >
                <div className="upload-icon">
                  <Upload size={32} />
                </div>
                <div className="upload-text">
                  Drag and drop PDF files here or click to browse
                </div>
                <button className="upload-btn" disabled={isUploading}>
                  {isUploading ? 'Uploading...' : 'Choose Files'}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="file-input"
                  accept=".pdf"
                  multiple
                  onChange={handleFileUpload}
                />
              </div>
              
              {/* Uploaded Files */}
              {uploadedFiles.length > 0 && (
                <div className="uploaded-files">
                  <div className="uploaded-files-title">Uploaded Documents:</div>
                  {uploadedFiles.map((file) => (
                    <div key={file.id} className="file-item">
                      <div className="file-info">
                        <FileText size={16} className="file-icon" />
                        <span>{file.name}</span>
                      </div>
                      <button 
                        onClick={() => removeFile(file.id)}
                        className="remove-btn"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
