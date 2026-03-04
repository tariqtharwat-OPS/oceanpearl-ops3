import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Topbar from '../components/Topbar';
import Sidebar, { NavItem } from '../components/Sidebar';
import { UsersRound, Settings, Database, ShieldAlert } from 'lucide-react';

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
                        <Route path="users" element={<div>User Role Management Under Construction</div>} />
                        <Route path="settings" element={<div>System Configuration Under Construction</div>} />
                        <Route path="data" element={<div>Database Tools Under Construction</div>} />
                        <Route path="security" element={<div>Security Audit Under Construction</div>} />
                        <Route path="*" element={<Navigate to="users" replace />} />
                    </Routes>
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
