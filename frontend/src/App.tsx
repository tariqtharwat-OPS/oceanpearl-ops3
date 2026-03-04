import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import LoginPage from './pages/LoginPage';

// Base Layouts per strict role containerization
import AdminLayout from './layouts/AdminLayout';
import CeoLayout from './layouts/CeoLayout';
import FinanceLayout from './layouts/FinanceLayout';
import LocationManagerLayout from './layouts/LocationManagerLayout';
import UnitOperatorLayout from './layouts/UnitOperatorLayout';
import InvestorLayout from './layouts/InvestorLayout';

// Shared Components
import ProtectedRoute from './components/ProtectedRoute';

const AppRoutes: React.FC = () => {
  const { userProfile, loading } = useAuth();

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50">Loading OPS3...</div>;

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      {/* Role-Specific Segregation 
          Each role gets a dedicated layout shell and isolated nested routes.
      */}

      {/* ADMIN (Full System Control) */}
      <Route path="/app/admin/*" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminLayout />
        </ProtectedRoute>
      } />

      {/* CEO (Full Operational Visibility) */}
      <Route path="/app/ceo/*" element={
        <ProtectedRoute allowedRoles={['ceo']}>
          <CeoLayout />
        </ProtectedRoute>
      } />

      {/* FINANCE OFFICER (Ledgers & Money) */}
      <Route path="/app/finance/*" element={
        <ProtectedRoute allowedRoles={['finance_officer']}>
          <FinanceLayout />
        </ProtectedRoute>
      } />

      {/* LOCATION MANAGER (Aggregated Location Control) */}
      <Route path="/app/location/*" element={
        <ProtectedRoute allowedRoles={['location_manager']}>
          <LocationManagerLayout />
        </ProtectedRoute>
      } />

      {/* UNIT OPERATOR (Strict Action / Execution Floor) */}
      <Route path="/app/operator/*" element={
        <ProtectedRoute allowedRoles={['unit_operator']}>
          <UnitOperatorLayout />
        </ProtectedRoute>
      } />

      {/* INVESTOR (Read-only Overview) */}
      <Route path="/app/investor/*" element={
        <ProtectedRoute allowedRoles={['investor']}>
          <InvestorLayout />
        </ProtectedRoute>
      } />

      {/* DEFAULT FALLBACK - intelligently routes based on role or sends to login */}
      <Route path="/" element={<Navigate to="/app/routing" replace />} />
      <Route path="/app" element={<Navigate to="/app/routing" replace />} />

      {/* Dynamic Entry Router */}
      <Route path="/app/routing" element={<RoleBasedRouter />} />
      <Route path="*" element={<Navigate to="/app/routing" replace />} />
    </Routes>
  );
};

// Smart component to bounce the user to their designated shell
const RoleBasedRouter = () => {
  const { userProfile } = useAuth();
  if (!userProfile) return <Navigate to="/login" replace />;

  switch (userProfile.role.toLowerCase()) {
    case 'admin': return <Navigate to="/app/admin/users" replace />;
    case 'ceo': return <Navigate to="/app/ceo/dashboard" replace />;
    case 'finance_officer': return <Navigate to="/app/finance/ledger" replace />;
    case 'location_manager': return <Navigate to="/app/location/transit" replace />;
    case 'unit_operator': return <Navigate to="/app/operator/dashboard" replace />;
    case 'investor': return <Navigate to="/app/investor/dashboard" replace />;
    default: return <Navigate to="/login" replace />; // Fallback failsafe
  }
};

const App: React.FC = () => {
  return (
    <Router>
      <LanguageProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </LanguageProvider>
    </Router>
  );
};

export default App;
