import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Topbar from '../components/Topbar';
import Sidebar, { type NavItem } from '../components/Sidebar';
import { UsersRound, Settings, Database, ShieldAlert } from 'lucide-react';
import AdminUsersPage from '../pages/AdminUsersPage';

const AdminLayout: React.FC = () => {

    const adminNavs: NavItem[] = [
        { label: 'Role & Users', path: '/app/admin/users', icon: UsersRound },
        { label: 'System Configuration', path: '/app/admin/settings', icon: Settings },
        { label: 'Database Tools', path: '/app/admin/data', icon: Database },
        { label: 'Security Audit', path: '/app/admin/security', icon: ShieldAlert }
    ];

    return (
        <div className="flex h-screen bg-slate-900 font-sans">
            <Sidebar items={adminNavs} />

            <div className="flex-1 flex flex-col overflow-hidden">
                <Topbar roleTitle="SYSTEM ADMINISTRATION" />

                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-100 p-6">
                    <Routes>
                        <Route path="users" element={<AdminUsersPage />} />
                        <Route path="settings" element={<div className="p-4 text-slate-600">System Configuration — Coming Soon</div>} />
                        <Route path="data" element={<div className="p-4 text-slate-600">Database Tools — Coming Soon</div>} />
                        <Route path="security" element={<div className="p-4 text-slate-600">Security Audit — Coming Soon</div>} />
                        <Route path="*" element={<Navigate to="users" replace />} />
                    </Routes>
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
