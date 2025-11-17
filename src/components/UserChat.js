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
  Mic,
  MicOff,
  ThumbsUp,
  ThumbsDown,
  Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import '../App.css';
import Header from './Header';

const API_BASE_URL = 'http://localhost:5000/api';

function UserChat() {
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
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [selectedModel, setSelectedModel] = useState(null); // null means use default
  const [availableModels, setAvailableModels] = useState(['llama3.2', 'llama3', 'llama2', 'mistral', 'phi']);
  const [defaultModel, setDefaultModel] = useState('llama3.2');
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const modelPickerRef = useRef(null);
  const navigate = useNavigate();
  const languageOptions = [
    { code: 'en', label: 'English' },
    { code: 'hi', label: 'Hindi' },
    { code: 'te', label: 'Telugu' },
    { code: 'ta', label: 'Tamil' },
    { code: 'kn', label: 'Kannada' },
    { code: 'ml', label: 'Malayalam' },
  ];

  // Simple UI translations (static labels). Extend as needed.
  const uiTranslations = {
    home: { en: 'Home', hi: 'मुखपृष्ठ', te: 'హోమ్', ta: 'முகப்பு', kn: 'ಮುಖಪುಟ', ml: 'ഹോം' },
    about: { en: 'About', hi: 'परिचय', te: 'గురించి', ta: 'பற்றி', kn: 'ಬಗ್ಗೆ', ml: 'കുറിച്ച്' },
    services: { en: 'Services', hi: 'सेवाएँ', te: 'సేవలు', ta: 'சேவைகள்', kn: 'ಸೇವೆಗಳು', ml: 'സേവനങ്ങൾ' },
    contact: { en: 'Contact', hi: 'संपर्क', te: 'సంప్రదించండి', ta: 'தொடர்பு', kn: 'ಸಂಪರ್ಕ', ml: 'ബന്ധപ്പെടുക' },
    supportBot: { en: 'Support Bot', hi: 'सहायता बॉट', te: 'సపోర్ట్ బాట్', ta: 'ஆதரவு பாட்', kn: 'ಸಹಾಯ ಬಾಟ್', ml: 'സഹായ ബോട്ട്' },
    chatSubtitle: { en: 'Ask me anything about MSME ONE or upload documents for specific questions', hi: 'MSME ONE के बारे में कुछ भी पूछें या विशिष्ट प्रश्नों के लिए दस्तावेज़ अपलोड करें', te: 'MSME ONE గురించి ఏదైనా అడగండి లేదా ప్రత్యేక ప్రశ్నలకు పత్రాలు అప్‌లోడ్ చేయండి', ta: 'MSME ONE குறித்து எதையும் கேளுங்கள் அல்லது குறிப்பிட்ட கேள்விகளுக்காக ஆவணங்களை பதிவேற்றவும்', kn: 'MSME ONE ಬಗ್ಗೆ ಯಾವುದನ್ನಾದರೂ ಕೇಳಿ ಅಥವಾ ವಿಶೇಷ ಪ್ರಶ್ನೆಗಳಿಗಾಗಿ ದಾಖಲೆಗಳನ್ನು ಅಪ್‌ಲೋಡ್ ಮಾಡಿ', ml: 'MSME ONEയെ കുറിച്ച് എന്തും ചോദിക്കൂ അല്ലെങ്കിൽ പ്രത്യേക ചോദ്യങ്ങൾക്ക് രേഖകൾ അപ്ലോഡ് ചെയ്യൂ' },
    typePlaceholder: { en: 'Type your message or use voice input...', hi: 'अपना संदेश टाइप करें या वॉइस इनपुट का उपयोग करें...', te: 'మీ సందేశాన్ని టైప్ చేయండి లేదా వాయిస్ ఇన్‌పుట్ ఉపయోగించండి...', ta: 'உங்கள் செய்தியைத் தட்டச்சு செய்யவும் அல்லது குரல் உள்ளீட்டை பயன்படுத்தவும்...', kn: 'ನಿಮ್ಮ ಸಂದೇಶವನ್ನು ಟೈಪ್ ಮಾಡಿ ಅಥವಾ ಧ್ವನಿ ಇನ್‌ಪುಟ್ ಬಳಸಿ...', ml: 'നിങ്ങളുടെ സന്ദേശം ടൈപ്പ് ചെയ്യുക അല്ലെങ്കിൽ വോയ്സ് ഇൻപുട്ട് ഉപയോഗിക്കുക...' },
    uploadDocuments: { en: 'Upload Documents', hi: 'दस्तावेज़ अपलोड करें', te: 'పత్రాలు అప్‌లోడ్ చేయండి', ta: 'ஆவணங்களை பதிவேற்றவும்', kn: 'ದಾಖಲೆಗಳನ್ನು ಅಪ್‌ಲೋಡ್ ಮಾಡಿ', ml: 'ഡോക്യുമെന്റുകൾ അപ്ലോഡ് ചെയ്യുക' },
    dragDrop: { en: 'Drag and drop PDF files here or click to browse', hi: 'यहाँ PDF फाइलें खींचकर छोड़ें या ब्राउज़ करने के लिए क्लिक करें', te: 'PDF ఫైళ్లను ఇక్కడికి లాగి వదలండి లేదా బ్రౌజ్ చేయడానికి క్లిక్ చేయండి', ta: 'PDF கோப்புகளை இங்கே இழுத்து விடவும் அல்லது உலாவ கிளிக் செய்யவும்', kn: 'PDF ಕಡತಗಳನ್ನು ಇಲ್ಲಿ ಎಳೆದಿಟ್ಟು ಬಿಡಿ ಅಥವಾ ಬ್ರೌಸ್ ಮಾಡಲು ಕ್ಲಿಕ್ ಮಾಡಿ', ml: 'ഇവിടെ PDF ഫയലുകൾ വലിച്ചിടുക അല്ലെങ്കിൽ ബ്രൗസ് ചെയ്യാൻ ക്ലിക്ക് ചെയ്യുക' },
    chooseFiles: { en: 'Choose Files', hi: 'फाइलें चुनें', te: 'ఫైళ్లను ఎంచుకోండి', ta: 'கோப்புகளைத் தேர்ந்தெடுக்கவும்', kn: 'ಕಡತಗಳನ್ನು ಆಯ್ಕೆಮಾಡಿ', ml: 'ഫയലുകൾ തിരഞ്ഞെടുക്കുക' },
    uploading: { en: 'Uploading...', hi: 'अपलोड हो रहा है...', te: 'అప్‌లోడ్ అవుతోంది...', ta: 'பதிவேற்றுகிறது...', kn: 'ಅಪ್‌ಲೋಡ್ ಆಗುತ್ತಿದೆ...', ml: 'അപ്‌ലോഡ് ചെയ്യുന്നു...' },
    uploadedDocuments: { en: 'Uploaded Documents:', hi: 'अपलोड किए गए दस्तावेज़:', te: 'అప్‌లోడ్ చేసిన పత్రాలు:', ta: 'பதிவேற்றப்பட்ட ஆவணங்கள்:', kn: 'ಅಪ್‌ಲೋಡ್ ಮಾಡಿದ ದಾಖಲೆಗಳು:', ml: 'അപ്‌ലോഡ് ചെയ്ത ഡോക്യുമെന്റുകൾ:' },
    startVoice: { en: 'Start Voice Input', hi: 'वॉइस इनपुट शुरू करें', te: 'వాయిస్ ఇన్‌పుట్ ప్రారంభించండి', ta: 'குரல் உள்ளீட்டை தொடங்கவும்', kn: 'ಧ್ವನಿ ಇನ್‌ಪುಟ್ ಪ್ರಾರಂಭಿಸಿ', ml: 'വോയ്സ് ഇൻപുട്ട് ആരംഭിക്കുക' },
    stopRecording: { en: 'Stop Recording', hi: 'रिकॉर्डिंग रोकें', te: 'రికార్డింగ్ ఆపండి', ta: 'பதிவை நிறுத்தவும்', kn: 'ರೆಕಾರ್ಡಿಂಗ್ ನಿಲ್ಲಿಸಿ', ml: 'റെക്കോർഡിംഗ് നിർത്തുക' },
    transcribing: { en: 'Transcribing...', hi: 'ट्रांसक्राइब हो रहा है...', te: 'ట్రాన్స్‌క్రిప్ట్ చేస్తోంది...', ta: 'உரை மாற்றுகிறது...', kn: 'ಟ್ರಾನ್ಸ್‌ಕ್ರೈಬ್ ಮಾಡಲಾಗುತ್ತಿದೆ...', ml: 'ട്രാൻസ്ക്രൈബ് ചെയ്യുന്നു...' },
    selectAgent: { en: 'Select AI Agent', hi: 'AI एजेंट चुनें', te: 'AI ఎజెంట్ ఎంచుకోండి', ta: 'AI முகவரைத் தேர்ந்தெடுக்கவும்', kn: 'AI ಏಜೆಂಟ್ ಆಯ್ಕೆಮಾಡಿ', ml: 'AI ഏജന്റ് തിരഞ്ഞെടുക്കുക' },
  };

  const t = (key) => (uiTranslations[key]?.[selectedLanguage]) || uiTranslations[key]?.en || '';
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  // Load available models
  useEffect(() => {
    loadModels();
    // Initialize session ID
    const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setSessionId(newSessionId);
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        modelPickerRef.current &&
        !modelPickerRef.current.contains(event.target)
      ) {
        setShowModelPicker(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const loadModels = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/models`);
      if (response.data.available_models) {
        setAvailableModels(response.data.available_models);
      }
      if (response.data.default_model) {
        setDefaultModel(response.data.default_model);
      }
    } catch (error) {
      console.error('Error loading models:', error);
    }
  };

  const translateText = async (text, src, dest) => {
    if (!text || src === dest) return text;
    try {
      const { data } = await axios.post(`${API_BASE_URL}/translate`, { text, src, dest });
      return data.text;
    } catch (e) {
      console.error('Translation error:', e);
      return text;
    }
  };

  const handleLanguageChange = async (lang) => {
    const prevLang = selectedLanguage;
    setSelectedLanguage(lang);
    // Translate existing messages to the new language
    try {
      const translatedMessages = await Promise.all(
        messages.map(async (m) => ({
          ...m,
          text: await translateText(m.text, 'auto', lang)
        }))
      );
      setMessages(translatedMessages);
    } catch (e) {
      console.error('Error translating messages:', e);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: Date.now(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date(),
      feedback: null
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    try {
      const messageForAI = await translateText(inputMessage, selectedLanguage, 'en');

      const response = await axios.post(`${API_BASE_URL}/chat`, {
        message: messageForAI,
        agent_id: 'default',
        model: selectedModel, // null will use default
        session_id: sessionId
      });

      // Update session ID if returned
      if (response.data.session_id) {
        setSessionId(response.data.session_id);
      }

      setTimeout(() => {
        const handleBotMessage = async () => {
          const reply = response.data.response || '';
          const translatedReply = await translateText(reply, 'en', selectedLanguage);
          const messageTimestamp = response.data.message_timestamp || new Date().toISOString();
          return {
            id: Date.now() + 1,
            text: translatedReply,
            sender: 'bot',
            timestamp: new Date(),
            sessionId: response.data.session_id || sessionId,
            messageTimestamp,
            model: response.data.model || defaultModel,
            feedback: null
          };
        };
        handleBotMessage().then((botMessage) => {
          setMessages(prev => [...prev, botMessage]);
          setIsTyping(false);
        }).catch(() => {
          const fallbackBot = {
            id: Date.now() + 1,
            text: response.data.response,
            sender: 'bot',
            timestamp: new Date(),
            sessionId: response.data.session_id || sessionId,
            messageTimestamp: response.data.message_timestamp || new Date().toISOString(),
            model: response.data.model || defaultModel,
            feedback: null
          };
          setMessages(prev => [...prev, fallbackBot]);
          setIsTyping(false);
        });
      }, 1000);

    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        id: Date.now() + 1,
        text: 'Sorry, I encountered an error. Please try again.',
        sender: 'bot',
        timestamp: new Date(),
        feedback: null
      };
      setMessages(prev => [...prev, errorMessage]);
      setIsTyping(false);
    }
  };

  const submitFeedback = async (messageId, feedback) => {
    const message = messages.find(m => m.id === messageId);
    if (!message || message.sender !== 'bot') return;
    if (!message.sessionId || !message.messageTimestamp) return;

    try {
      await axios.post(`${API_BASE_URL}/feedback`, {
        session_id: message.sessionId || sessionId,
        timestamp: message.messageTimestamp,
        feedback: feedback
      });

      // Update message feedback locally
      setMessages(prev => prev.map(m => 
        m.id === messageId ? { ...m, feedback } : m
      ));
    } catch (error) {
      console.error('Error submitting feedback:', error);
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

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await sendAudioForTranscription(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Could not access microphone. Please check your permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const sendAudioForTranscription = async (audioBlob) => {
    setIsTranscribing(true);
    
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      formData.append('language', selectedLanguage);

      const response = await axios.post(`${API_BASE_URL}/transcribe`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000, // 60 seconds timeout for transcription
      });

      if (response.data && response.data.text) {
        setInputMessage(prev => prev + (prev ? ' ' : '') + response.data.text);
      } else {
        alert('Transcription failed. Please try again.');
      }
    } catch (error) {
      console.error('Transcription error:', error);
      alert('Error transcribing audio. Please try again.');
    } finally {
      setIsTranscribing(false);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <div className="app">
      <Header
        navLinks={[
          { to: '/', label: t('home'), end: true },
          { to: '/about', label: t('about') },
          { to: '/services', label: t('services') },
          { to: '/contact', label: t('contact') }
        ]}
        rightContent={
          <>
            <div className="language-selector">
              <select
                value={selectedLanguage}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="language-select"
                title="Choose language"
              >
                {languageOptions.map(opt => (
                  <option key={opt.code} value={opt.code}>{opt.label}</option>
                ))}
              </select>
            </div>
            <button
              className="admin-tab"
              onClick={() => navigate('/admin/login')}
              title="Go to Admin Panel"
            >
              Admin
            </button>
            <button className="icon-btn" type="button" title="Notifications">
              <Bell size={20} />
            </button>
            <div className="user-avatar">
              <User size={20} />
            </div>
          </>
        }
      />

      {/* Main Container */}
      <div className="main-container">
        <div className="chat-container">
          {/* Chat Header */}
          <div className="chat-header">
            <div className="chat-title">{t('supportBot')}</div>
            <div className="chat-subtitle">
              {t('chatSubtitle')}
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
                    {message.sender === 'bot' && message.model && (
                      <span className="model-badge">{message.model}</span>
                    )}
                  </div>
                  <div className={`message-bubble ${message.sender === 'user' ? 'user-message' : 'bot-message'}`}>
                    {message.text}
                  </div>
                  {message.sender === 'bot' && message.sessionId && message.messageTimestamp && (
                    <div className="feedback-buttons">
                      <button
                        className={`feedback-btn ${message.feedback === 'good' ? 'active' : ''}`}
                        onClick={() => submitFeedback(message.id, 'good')}
                        title="Good response"
                      >
                        <ThumbsUp size={14} />
                      </button>
                      <button
                        className={`feedback-btn ${message.feedback === 'bad' ? 'active' : ''}`}
                        onClick={() => submitFeedback(message.id, 'bad')}
                        title="Bad response"
                      >
                        <ThumbsDown size={14} />
                      </button>
                    </div>
                  )}
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
                placeholder={t('typePlaceholder')}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isTyping || isTranscribing}
              />
              <div className="input-actions">
                {/* Model Selector - Prominent */}
                <div className="model-selector-main" ref={modelPickerRef}>
                  <button
                    className={`model-selector-btn ${showModelPicker ? 'active' : ''}`}
                    onClick={() => setShowModelPicker(prev => !prev)}
                    type="button"
                    title="Select AI Model"
                  >
                    <Sparkles size={18} />
                    <span className="model-name">{selectedModel || defaultModel}</span>
                  </button>
                  {showModelPicker && (
                    <div className="model-picker-dropdown">
                      <div className="model-picker-header">
                        <h4>Select AI Model</h4>
                        <span className="current-model">Current: {selectedModel || defaultModel}</span>
                      </div>
                      <div className="model-options-list">
                        {availableModels.map(model => (
                          <div
                            key={model}
                            className={`model-option-item ${(selectedModel === model || (!selectedModel && model === defaultModel)) ? 'active' : ''}`}
                            onClick={() => {
                              setSelectedModel(model === defaultModel ? null : model);
                              setShowModelPicker(false);
                            }}
                          >
                            <Sparkles size={14} />
                            <span className="model-option-name">{model}</span>
                            {model === defaultModel && <span className="default-badge">Default</span>}
                            {(selectedModel === model || (!selectedModel && model === defaultModel)) && (
                              <span className="check-mark">✓</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <button 
                  className={`action-btn mic-btn ${isRecording ? 'recording' : ''} ${isTranscribing ? 'transcribing' : ''}`}
                  onClick={toggleRecording}
                  disabled={isTyping || isTranscribing}
                  title={isRecording ? t('stopRecording') : isTranscribing ? t('transcribing') : t('startVoice')}
                >
                  {isRecording ? <MicOff size={16} /> : <Mic size={16} />}
                  {isRecording && <span className="recording-pulse"></span>}
                </button>
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
                  disabled={!inputMessage.trim() || isTyping || isTranscribing}
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Upload Section */}
          {showUpload && (
            <div className="upload-section">
              <div className="upload-title">{t('uploadDocuments')}</div>
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
                  {t('dragDrop')}
                </div>
                <button className="upload-btn" disabled={isUploading}>
                  {isUploading ? t('uploading') : t('chooseFiles')}
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
                  <div className="uploaded-files-title">{t('uploadedDocuments')}</div>
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

export default UserChat;

