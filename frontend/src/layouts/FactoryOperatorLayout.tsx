import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Topbar from '../components/Topbar';
import Sidebar, { type NavItem } from '../components/Sidebar';
import { Layers, Plus, Play, ChevronRight, CheckSquare, RefreshCw, BarChart2 } from 'lucide-react';
import FactoryBatchList from '../pages/factory/FactoryBatchList';
import FactoryBatchCreate from '../pages/factory/FactoryBatchCreate';
import FactoryWipCreate from '../pages/factory/FactoryWipCreate';
import FactoryWipAdvance from '../pages/factory/FactoryWipAdvance';
import FactoryWipComplete from '../pages/factory/FactoryWipComplete';
import FactoryTransformation from '../pages/factory/FactoryTransformation';
import FactoryYieldSummary from '../pages/factory/FactoryYieldSummary';

const FactoryOperatorLayout: React.FC = () => {
  const navItems: NavItem[] = [
    { label: 'Active Batches', path: '/app/factory/batches', icon: Layers },
    { label: 'Create Batch', path: '/app/factory/batch-create', icon: Plus },
    { label: 'Start WIP', path: '/app/factory/wip-create', icon: Play },
    { label: 'Advance WIP Stage', path: '/app/factory/wip-advance', icon: ChevronRight },
    { label: 'Complete WIP', path: '/app/factory/wip-complete', icon: CheckSquare },
    { label: 'Record Transformation', path: '/app/factory/transformation', icon: RefreshCw },
    { label: 'Yield Summary', path: '/app/factory/yield', icon: BarChart2 },
  ];

  return (
    <div className="flex h-screen bg-slate-100 font-sans">
      <Sidebar items={navItems} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar roleTitle="FACTORY OPERATOR" />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-100 p-6">
          <Routes>
            <Route path="batches" element={<FactoryBatchList />} />
            <Route path="batch-create" element={<FactoryBatchCreate />} />
            <Route path="wip-create" element={<FactoryWipCreate />} />
            <Route path="wip-advance" element={<FactoryWipAdvance />} />
            <Route path="wip-complete" element={<FactoryWipComplete />} />
            <Route path="transformation" element={<FactoryTransformation />} />
            <Route path="yield" element={<FactoryYieldSummary />} />
            <Route path="*" element={<Navigate to="batches" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default FactoryOperatorLayout;
