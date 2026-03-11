import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Topbar from '../components/Topbar';
import Sidebar, { type NavItem } from '../components/Sidebar';
import { FilePlus2, Scissors, ArrowRightLeft, Target, AlertTriangle } from 'lucide-react';

const UnitOperatorLayout: React.FC = () => {

    // Only highly specific Unit Operator actions. Not a global dashboard.
    const operatorNavs: NavItem[] = [
        { label: 'Unit Dashboard', path: '/app/operator/dashboard', icon: Target },
        { label: 'Record Receiving', path: '/app/operator/receiving', icon: FilePlus2 },
        { label: 'Processing & Yield', path: '/app/operator/processing', icon: Scissors },
        { label: 'Transit / Dispatch', path: '/app/operator/transit', icon: ArrowRightLeft },
        { label: 'Report Waste', path: '/app/operator/waste', icon: AlertTriangle }
    ];

    return (
        <div className="flex h-screen bg-slate-100 font-sans">
            {/* Strict Sidebar Layout */}
            <Sidebar items={operatorNavs} />

            <div className="flex-1 flex flex-col overflow-hidden">
                <Topbar roleTitle="UNIT OPERATIONS" />

                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-100 p-6">
                    <Routes>
                        {/* Future specialized screens */}
                        <Route path="dashboard" element={<div>Unit Operator Dashboard Under Construction</div>} />
                        <Route path="receiving" element={<div>Record Receiving Form Under Construction</div>} />
                        <Route path="processing" element={<div>Processing Yield Form Under Construction</div>} />
                        <Route path="transit" element={<div>Transit Dispatch Form Under Construction</div>} />
                        <Route path="waste" element={<div>Report Waste Form Under Construction</div>} />
                        <Route path="*" element={<Navigate to="dashboard" replace />} />
                    </Routes>
                </main>
            </div>
        </div>
    );
};

export default UnitOperatorLayout;
