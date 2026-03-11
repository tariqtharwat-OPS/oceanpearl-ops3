import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Topbar from '../components/Topbar';
import Sidebar, { type NavItem } from '../components/Sidebar';
import { LayoutDashboard, TrendingUp, Anchor, DollarSign, BrainCircuit, Activity } from 'lucide-react';

const CeoLayout: React.FC = () => {

    // CEO gets omni-directional read access + Shark capabilities
    const ceoNavs: NavItem[] = [
        { label: 'Executive Pulse', path: '/app/ceo/dashboard', icon: LayoutDashboard },
        { label: 'Global Inventory', path: '/app/ceo/inventory', icon: Anchor },
        { label: 'Yield & Production', path: '/app/ceo/yield', icon: Activity },
        { label: 'Financial Health', path: '/app/ceo/finance', icon: DollarSign },
        { label: 'Sales & Export', path: '/app/ceo/sales', icon: TrendingUp },
        { label: 'Shark AI Operations', path: '/app/ceo/shark', icon: BrainCircuit }
    ];

    return (
        <div className="flex h-screen bg-slate-100 font-sans">
            <Sidebar items={ceoNavs} />

            <div className="flex-1 flex flex-col overflow-hidden">
                <Topbar roleTitle="CHIEF EXECUTIVE OFFICER" />

                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-100 p-6">
                    <Routes>
                        <Route path="dashboard" element={<div>Executive Pulse Under Construction</div>} />
                        <Route path="inventory" element={<div>Global Inventory Under Construction</div>} />
                        <Route path="yield" element={<div>Yield & Production Under Construction</div>} />
                        <Route path="finance" element={<div>Financial Health Under Construction</div>} />
                        <Route path="sales" element={<div>Sales & Export Under Construction</div>} />
                        <Route path="shark" element={<div>Shark AI Interface Under Construction</div>} />
                        <Route path="*" element={<Navigate to="dashboard" replace />} />
                    </Routes>
                </main>
            </div>
        </div>
    );
};

export default CeoLayout;
