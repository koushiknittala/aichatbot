import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  LogOut,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Clock,
  User as UserIcon,
  Bot,
  Search,
  Filter
} from 'lucide-react';
import Header from './Header';
import './UserLogs.css';

// Use same-origin API in deployments; override for local dev if needed.
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '/api';

function UserLogs() {
  const [sessions, setSessions] = useState([]);
  const [filteredSessions, setFilteredSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterFeedback, setFilterFeedback] = useState('all'); // 'all', 'good', 'bad', 'none'
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }
    loadChatLogs();
  }, [navigate]);

  useEffect(() => {
    filterSessions();
  }, [sessions, searchQuery, filterFeedback]);

  const loadChatLogs = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`${API_BASE_URL}/admin/logs`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        // Sort sessions by updated_at (most recent first)
        const sortedSessions = (response.data.sessions || []).sort((a, b) => {
          return new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at);
        });
        setSessions(sortedSessions);
        setFilteredSessions(sortedSessions);
      }
    } catch (error) {
      console.error('Error loading chat logs:', error);
      if (error.response?.status === 401) {
        handleLogout();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const filterSessions = () => {
    let filtered = [...sessions];

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(session =>
        session.messages?.some(msg =>
          msg.user_message?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          msg.bot_response?.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }

    // Filter by feedback
    if (filterFeedback !== 'all') {
      filtered = filtered.filter(session =>
        session.messages?.some(msg => {
          if (filterFeedback === 'none') {
            return !msg.feedback;
          }
          return msg.feedback === filterFeedback;
        })
      );
    }

    setFilteredSessions(filtered);
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

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getFeedbackIcon = (feedback) => {
    if (feedback === 'good') {
      return <ThumbsUp size={14} className="feedback-icon good" />;
    } else if (feedback === 'bad') {
      return <ThumbsDown size={14} className="feedback-icon bad" />;
    }
    return null;
  };

  const navLinks = [
    { to: '/', label: 'Home', end: true },
    { to: '/about', label: 'About' },
    { to: '/services', label: 'Services' },
    { to: '/contact', label: 'Contact' }
  ];

  if (isLoading) {
    return (
      <div className="user-logs">
        <div className="loading">Loading chat logs...</div>
      </div>
    );
  }

  return (
    <div className="user-logs">
      <Header
        navLinks={navLinks}
        rightContent={
          <>
            <button
              className="admin-tab"
              type="button"
              onClick={() => navigate('/admin')}
            >
              Admin Panel
            </button>
            <button className="admin-tab active" type="button">
              User Logs
            </button>
            <button onClick={handleLogout} className="logout-button" type="button">
              <LogOut size={18} />
              Logout
            </button>
          </>
        }
      />

      <div className="logs-content">
        <div className="logs-sidebar">
          <div className="logs-header">
            <h2>Chat History</h2>
            <div className="session-count">
              {filteredSessions.length} {filteredSessions.length === 1 ? 'session' : 'sessions'}
            </div>
          </div>

          <div className="search-filter">
            <div className="search-box">
              <Search size={18} />
              <input
                type="text"
                placeholder="Search chats..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="filter-box">
              <Filter size={18} />
              <select
                value={filterFeedback}
                onChange={(e) => setFilterFeedback(e.target.value)}
              >
                <option value="all">All Feedback</option>
                <option value="good">Good Only</option>
                <option value="bad">Bad Only</option>
                <option value="none">No Feedback</option>
              </select>
            </div>
          </div>

          <div className="sessions-list">
            {filteredSessions.length === 0 ? (
              <div className="no-sessions">
                <MessageSquare size={48} />
                <p>No chat sessions found</p>
              </div>
            ) : (
              filteredSessions.map((session) => {
                const messageCount = session.messages?.length || 0;
                const lastMessage = session.messages?.[messageCount - 1];
                const hasFeedback = session.messages?.some(msg => msg.feedback);
                
                return (
                  <div
                    key={session.session_id}
                    className={`session-item ${selectedSession?.session_id === session.session_id ? 'active' : ''}`}
                    onClick={() => setSelectedSession(session)}
                  >
                    <div className="session-header">
                      <Clock size={14} />
                      <span className="session-date">
                        {formatDate(session.updated_at || session.created_at)}
                      </span>
                    </div>
                    <div className="session-preview">
                      {lastMessage?.user_message?.substring(0, 50) || 'Empty session'}
                      {lastMessage?.user_message?.length > 50 && '...'}
                    </div>
                    <div className="session-meta">
                      <span className="message-count">{messageCount} messages</span>
                      {hasFeedback && (
                        <span className="has-feedback">Has feedback</span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="logs-main">
          {selectedSession ? (
            <div className="session-detail">
              <div className="session-detail-header">
                <h3>Chat Session</h3>
                <div className="session-info">
                  <div>
                    <strong>Session ID:</strong> {selectedSession.session_id.substring(0, 20)}...
                  </div>
                  <div>
                    <strong>Created:</strong> {formatDate(selectedSession.created_at)}
                  </div>
                  <div>
                    <strong>Updated:</strong> {formatDate(selectedSession.updated_at)}
                  </div>
                  <div>
                    <strong>Messages:</strong> {selectedSession.messages?.length || 0}
                  </div>
                </div>
              </div>

              <div className="messages-list">
                {selectedSession.messages?.map((msg, idx) => (
                  <div key={idx} className="log-message">
                    <div className="log-message-header">
                      <div className="log-message-sender">
                        <UserIcon size={16} />
                        <span>User</span>
                      </div>
                      <div className="log-message-time">
                        {formatDate(msg.timestamp)}
                      </div>
                    </div>
                    <div className="log-message-content user">
                      {msg.user_message}
                    </div>

                    {msg.bot_response && (
                      <>
                        <div className="log-message-header">
                          <div className="log-message-sender">
                            <Bot size={16} />
                            <span>Bot</span>
                            {msg.model && (
                              <span className="model-tag">{msg.model}</span>
                            )}
                            {msg.agent_id && (
                              <span className="agent-tag">{msg.agent_id}</span>
                            )}
                          </div>
                          <div className="log-message-feedback">
                            {getFeedbackIcon(msg.feedback)}
                            {msg.feedback && (
                              <span className={`feedback-label ${msg.feedback}`}>
                                {msg.feedback === 'good' ? 'Good' : 'Bad'}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="log-message-content bot">
                          {msg.bot_response}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="no-selection">
              <MessageSquare size={64} />
              <p>Select a chat session to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default UserLogs;
