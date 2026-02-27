import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import Header from './components/Header';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import AdminUsersPage from './pages/AdminUsersPage';
import LocationPage from './pages/LocationPage';
import ReportsPage from './pages/ReportsPage';
import OperationsPage from './pages/Operations';
import FinancePage from './pages/Finance';
import SharkAIPage from './pages/SharkAI';
import TraceabilityPage from './pages/Traceability';
import AdminPanelFull from './pages/AdminPanelFull';
import UnitOperatorPage from './pages/UnitOperator';
import BootstrapPage from './pages/Bootstrap';
import './styles/index.css';

const AppRoutes: React.FC = () => {
  const { userProfile } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Header />
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute requireAdmin>
            <Header />
            <AdminUsersPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/location"
        element={
          <ProtectedRoute>
            <Header />
            <LocationPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <ProtectedRoute>
            <Header />
            <ReportsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/operations"
        element={
          <ProtectedRoute>
            <Header />
            <OperationsPage userProfile={userProfile} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/finance"
        element={
          <ProtectedRoute>
            <Header />
            <FinancePage userProfile={userProfile} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/shark"
        element={
          <ProtectedRoute>
            <Header />
            <SharkAIPage userProfile={userProfile} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/traceability"
        element={
          <ProtectedRoute>
            <Header />
            <TraceabilityPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/unit-operator"
        element={
          <ProtectedRoute>
            <Header />
            <UnitOperatorPage userProfile={userProfile} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute requireAdmin>
            <Header />
            <AdminPanelFull userProfile={userProfile} />
          </ProtectedRoute>
        }
      />
      <Route path="/bootstrap" element={<BootstrapPage />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <Router basename="/app">
      <LanguageProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </LanguageProvider>
    </Router>
  );
};

export default App;
