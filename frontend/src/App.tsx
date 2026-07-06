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
import LandingPage from './pages/LandingPage';
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
      <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(circle_at_top_left,#f5f7ff,transparent_42%),radial-gradient(circle_at_top_right,#eef5ff,transparent_38%),#f8fafc]">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// Root route: marketing landing page for visitors, the app for signed-in users
function RootRoute() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(circle_at_top_left,#f5f7ff,transparent_42%),radial-gradient(circle_at_top_right,#eef5ff,transparent_38%),#f8fafc]">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <LandingPage />;
  }

  return (
    <AgendaProvider>
      <HomePage />
    </AgendaProvider>
  );
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

          {/* Root: landing page for visitors, app home for signed-in users */}
          <Route path="/" element={<RootRoute />} />
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
