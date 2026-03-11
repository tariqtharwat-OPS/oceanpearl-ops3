import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Topbar from '../components/Topbar';
import Sidebar, { type NavItem } from '../components/Sidebar';
import { Ship, PackagePlus, ClipboardCheck, CheckCircle, AlertOctagon } from 'lucide-react';
import HubTripList from '../pages/hub/HubTripList';
import HubReceivingCreate from '../pages/hub/HubReceivingCreate';
import HubReceivingInspect from '../pages/hub/HubReceivingInspect';
import HubReceivingConfirm from '../pages/hub/HubReceivingConfirm';
import HubVarianceReport from '../pages/hub/HubVarianceReport';

const HubOperatorLayout: React.FC = () => {
  const navItems: NavItem[] = [
    { label: 'Closed Trips', path: '/app/hub/trips', icon: Ship },
    { label: 'Create Receiving', path: '/app/hub/receiving-create', icon: PackagePlus },
    { label: 'Inspect Quantities', path: '/app/hub/receiving-inspect', icon: ClipboardCheck },
    { label: 'Confirm Receiving', path: '/app/hub/receiving-confirm', icon: CheckCircle },
    { label: 'Variance Report', path: '/app/hub/variance', icon: AlertOctagon },
  ];

  return (
    <div className="flex h-screen bg-slate-100 font-sans">
      <Sidebar items={navItems} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar roleTitle="HUB OPERATOR" />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-100 p-6">
          <Routes>
            <Route path="trips" element={<HubTripList />} />
            <Route path="receiving-create" element={<HubReceivingCreate />} />
            <Route path="receiving-inspect" element={<HubReceivingInspect />} />
            <Route path="receiving-confirm" element={<HubReceivingConfirm />} />
            <Route path="variance" element={<HubVarianceReport />} />
            <Route path="*" element={<Navigate to="trips" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default HubOperatorLayout;
