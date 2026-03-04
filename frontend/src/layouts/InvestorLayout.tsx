import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Topbar from '../components/Topbar';
import Sidebar, { NavItem } from '../components/Sidebar';
import { LineChart, BarChart3, Presentation, Landmark } from 'lucide-react';

const InvestorLayout: React.FC = () => {

    const investorNavs: NavItem[] = [
        { label: 'Executive Summary', path: '/app/investor/summary', icon: Presentation },
        { label: 'Asset Valuation', path: '/app/investor/assets', icon: Landmark },
        { label: 'Revenue Trends', path: '/app/investor/revenue', icon: LineChart },
        { label: 'Target vs Actual', path: '/app/investor/targets', icon: BarChart3 }
    ];

    return (
        <div className="flex h-screen bg-slate-50 font-sans">
            <Sidebar items={investorNavs} />

            <div className="flex-1 flex flex-col overflow-hidden">
                <Topbar roleTitle="STAKEHOLDER PORTAL" />

                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 p-6">
                    <Routes>
                        <Route path="summary" element={<div>Executive Summary Under Construction</div>} />
                        <Route path="assets" element={<div>Asset Valuation Under Construction</div>} />
                        <Route path="revenue" element={<div>Revenue Trends Under Construction</div>} />
                        <Route path="targets" element={<div>Target vs Actuals Under Construction</div>} />
                        <Route path="*" element={<Navigate to="summary" replace />} />
                    </Routes>
                </main>
            </div>
        </div>
    );
};

export default InvestorLayout;
