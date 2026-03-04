import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Topbar from '../components/Topbar';
import Sidebar, { NavItem } from '../components/Sidebar';
import { BookOpen, DollarSign, FileText, CreditCard } from 'lucide-react';

const FinanceLayout: React.FC = () => {

    const financeNavs: NavItem[] = [
        { label: 'General Ledger', path: '/app/finance/ledger', icon: BookOpen },
        { label: 'Wallets & Liquidity', path: '/app/finance/wallets', icon: DollarSign },
        { label: 'Expense Vouchers', path: '/app/finance/vouchers', icon: FileText },
        { label: 'Payables / Receivables', path: '/app/finance/balances', icon: CreditCard }
    ];

    return (
        <div className="flex h-screen bg-slate-100 font-sans">
            <Sidebar items={financeNavs} />

            <div className="flex-1 flex flex-col overflow-hidden">
                <Topbar roleTitle="FINANCE & LEDGER" />

                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-100 p-6">
                    <Routes>
                        <Route path="ledger" element={<div>General Ledger Under Construction</div>} />
                        <Route path="wallets" element={<div>Wallets & Liquidity Under Construction</div>} />
                        <Route path="vouchers" element={<div>Expense Vouchers Under Construction</div>} />
                        <Route path="balances" element={<div>Payables & Receivables Under Construction</div>} />
                        <Route path="*" element={<Navigate to="ledger" replace />} />
                    </Routes>
                </main>
            </div>
        </div>
    );
};

export default FinanceLayout;
