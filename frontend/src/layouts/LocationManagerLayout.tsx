import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Topbar from '../components/Topbar';
import Sidebar, { NavItem } from '../components/Sidebar';
import { Map, Users, ArrowRightLeft, Activity } from 'lucide-react';

const LocationManagerLayout: React.FC = () => {

    // Location Manager focuses on the aggregate health of the location and transit between units
    const locationNavs: NavItem[] = [
        { label: 'Location Transit Hub', path: '/app/location/transit', icon: Map },
        { label: 'Unit Production Metrics', path: '/app/location/metrics', icon: Activity },
        { label: 'Inter-Unit Transfers', path: '/app/location/transfers', icon: ArrowRightLeft },
        { label: 'Local Team roster', path: '/app/location/roster', icon: Users }
    ];

    return (
        <div className="flex h-screen bg-slate-100 font-sans">
            <Sidebar items={locationNavs} />

            <div className="flex-1 flex flex-col overflow-hidden">
                <Topbar roleTitle="LOCATION COMMAND" />

                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-100 p-6">
                    <Routes>
                        {/* Specialized screens mapped under /app/location/* */}
                        <Route path="transit" element={<div>Location Transit Hub Under Construction</div>} />
                        <Route path="metrics" element={<div>Unit Production Metrics Under Construction</div>} />
                        <Route path="transfers" element={<div>Inter-Unit Transfers Under Construction</div>} />
                        <Route path="roster" element={<div>Local Team Roster Under Construction</div>} />
                        <Route path="*" element={<Navigate to="transit" replace />} />
                    </Routes>
                </main>
            </div>
        </div>
    );
};

export default LocationManagerLayout;
