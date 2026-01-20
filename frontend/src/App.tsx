import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AgendaProvider } from './context/AgendaContext';
import { DemoProvider } from './context/DemoContext';
import HomePage from './pages/HomePage';
import AgendaPage from './pages/AgendaPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AutoPilotDemoPage from './pages/AutoPilotDemoPage';
import { ToastProvider } from './context/ToastContext';
import ShowToast from './components/Toast';
import { TutorialProvider } from './context/TutorialContext';
import { TutorialOverlay } from './components/TutorialOverlay';
import FooterBadge from './components/FooterBadge';
import { AutoPilotProvider } from './context/AutoPilotContext';

// Protected Route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100">
        <div className="animate-spin rounded-full h-24 w-24 border-t-4 border-b-4 border-blue-400 opacity-60"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <DemoProvider>
    <AuthProvider>
      <ToastProvider>
        <ShowToast />
        <TutorialProvider>
          <AutoPilotProvider>
          <TutorialOverlay />
          <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          {/* Demo Routes - Publicly accessible */}
          <Route 
            path="/demo" 
            element={<HomePage />} 
          />
          <Route 
            path="/demo/agenda/:id" 
            element={<AgendaPage />} 
          />
          <Route 
            path="/auto-pilot-demo" 
            element={<AutoPilotDemoPage />} 
          />
          <Route 
            path="/auto-pilot-demo/agenda/:id" 
            element={<AgendaPage />} 
          />

          {/* Shared Agendas - Publicly accessible */}
          <Route 
            path="/shared/:token" 
            element={<AgendaPage />} 
          />

          {/* Protected App Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AgendaProvider>
                  <HomePage />
                </AgendaProvider>
              </ProtectedRoute>
            }
          />
          <Route
            path="/agenda/:id"
            element={
              <ProtectedRoute>
                <AgendaProvider>
                  <AgendaPage />
                </AgendaProvider>
              </ProtectedRoute>
            }
          />
        </Routes>
        <FooterBadge />
        </AutoPilotProvider>
        </TutorialProvider>
      </ToastProvider>
    </AuthProvider>
    </DemoProvider>
  );
}
