import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import UserChat from './components/UserChat';
import AdminLogin from './components/AdminLogin';
import AdminPanel from './components/AdminPanel';
import UserLogs from './components/UserLogs';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<UserChat />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/admin/logs" element={<UserLogs />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
