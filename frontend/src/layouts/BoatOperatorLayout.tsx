import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Topbar from '../components/Topbar';
import Sidebar, { type NavItem } from '../components/Sidebar';
import { Anchor, Play, DollarSign, ArrowRightLeft, Lock, ShoppingBag, ShoppingCart } from 'lucide-react';

import TripStart from '../pages/boat/TripStart';
import OpeningBalances from '../pages/boat/OpeningBalances';
import TripExpenses from '../pages/boat/TripExpenses';
import OwnCatch from '../pages/boat/OwnCatch';
import BuyCatch from '../pages/boat/BuyCatch';
import BoatSale from '../pages/boat/BoatSale';
import TripClosure from '../pages/boat/TripClosure';

const BoatOperatorLayout: React.FC = () => {

    const operatorNavs: NavItem[] = [
        { label: '1. Start Trip', path: '/app/boat/start', icon: Play },
        { label: '2. Opening Balances', path: '/app/boat/init', icon: DollarSign },
        { label: '3. Trip Expenses', path: '/app/boat/expenses', icon: DollarSign },
        { label: '4. Receiv: Own Catch', path: '/app/boat/receive-own', icon: Anchor },
        { label: '5. Receiv: Buy Fishermen', path: '/app/boat/receive-buy', icon: ShoppingBag },
        { label: '6. Boat Sales', path: '/app/boat/sales', icon: ShoppingCart },
        { label: '7. Wallet Transfers', path: '/app/boat/wallet', icon: ArrowRightLeft },
        { label: '8. Close Trip', path: '/app/boat/close', icon: Lock }
    ];

    return (
        <div className="flex h-screen bg-slate-100 font-sans">
            <Sidebar items={operatorNavs} />

            <div className="flex-1 flex flex-col overflow-hidden">
                <Topbar roleTitle="BOAT OPERATIONS" />

                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-100 p-6">
                    <Routes>
                        <Route path="start" element={<TripStart />} />
                        <Route path="init" element={<OpeningBalances />} />
                        <Route path="expenses" element={<TripExpenses />} />
                        <Route path="receive-own" element={<OwnCatch />} />
                        <Route path="receive-buy" element={<BuyCatch />} />
                        <Route path="sales" element={<BoatSale />} />
                        <Route path="wallet" element={<div>7. Wallet Transfers - Phase 1 Gate 4</div>} />
                        <Route path="close" element={<TripClosure />} />
                        <Route path="*" element={<Navigate to="start" replace />} />
                    </Routes>
                </main>
            </div>
        </div>
    );
};

export default BoatOperatorLayout;
