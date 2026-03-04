import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getCurrentLanguage, t } from '../i18n';

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
    const { userProfile, loading } = useAuth();
    const language = getCurrentLanguage();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center font-medium text-slate-500">
                    Validating Security Clearance...
                </div>
            </div>
        );
    }

    if (!userProfile) {
        // Not logged in, send to login page
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && allowedRoles.length > 0) {
        const userRole = userProfile.role.toLowerCase();

        // Admins implicitly have access to CEO layer in the new structure
        const hasClearance = allowedRoles.includes(userRole) || (userRole === 'admin' && allowedRoles.includes('ceo'));

        if (!hasClearance) {
            // User is logged in but doesn't have the required role for this specific layout
            console.warn(`Access Denied. User Role: ${userRole}. Required: ${allowedRoles.join(', ')}`);

            // Send them to the smart router to be bounced to their correct area
            return <Navigate to="/app/routing" replace />;
        }
    }

    return <>{children}</>;
};

export default ProtectedRoute;
