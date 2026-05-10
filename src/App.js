import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './hooks/useAuth';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: 'var(--bg-card)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-bright)',
            fontFamily: 'var(--mono)',
            fontSize: '12px',
            borderRadius: '8px',
          },
          success: { iconTheme: { primary: 'var(--success)', secondary: 'var(--bg-primary)' } },
          error: { iconTheme: { primary: 'var(--danger)', secondary: 'var(--bg-primary)' } },
          duration: 4000,
        }}
      />
    </AuthProvider>
  );
}
