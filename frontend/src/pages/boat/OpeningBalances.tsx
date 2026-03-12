import React, { useState } from 'react';
import { Coins, X, Check, Save, Loader2, CheckCircle } from 'lucide-react';
import { firestoreWriterService } from '../../services/firestoreWriterService';
import { useAuth } from '../../contexts/AuthContext';

const OpeningBalances: React.FC = () => {
    const { userProfile } = useAuth();
    const companyId = 'oceanpearl';
    const locationId = userProfile?.allowedLocationIds?.[0] || 'LOC-BOAT-01';
    const unitId = userProfile?.allowedUnitIds?.[0] || 'UNIT-BOAT-01';
    const [status, setStatus] = useState<'IDLE' | 'LOADING' | 'SUCCESS'>('IDLE');
    const [error, setError] = useState<string | null>(null);

    const handleApproveAndPost = async () => {
        try {
            setStatus('LOADING');
            setError(null);

            // 1. Physical Cash Deposit Event
            const depositPayload = {
                company_id: companyId,

                location_id: locationId,

                unit_id: unitId,

                wallet_id: "TRIP-WALLET-B1",
                event_type: "deposit_cash_handover",
                amount: 5000000,
                source_screen: "boat_open",
                recorded_at: new Date().toISOString(),
                trip_id: "TRIP-B1-0226"
            };

            await firestoreWriterService.writeWalletEvent(depositPayload);

            // 2. Employee Advance Event
            const advancePayload = {
                company_id: companyId,

                location_id: locationId,

                unit_id: unitId,

                wallet_id: "TRIP-WALLET-B1",
                event_type: "expense_advance",
                amount: 250000,
                source_screen: "boat_open",
                recorded_at: new Date().toISOString(),
                trip_id: "TRIP-B1-0226",
                employee_id: "ID-011",
                reason: "Weekly Food Advance"
            };

            await firestoreWriterService.writeWalletEvent(advancePayload);

            setStatus('SUCCESS');
        } catch (e: any) {
            console.error("Open balances error:", e);
            setError(e.message);
            setStatus('IDLE');
        }
    };

    return (
        <div className="p-4 flex flex-col items-center w-full">
            <h1 className="text-2xl font-black uppercase text-slate-800 tracking-widest gap-4 flex items-center mb-6 border-b-2 border-slate-300 pb-2 w-full max-w-4xl">
                2. Opening Balances
            </h1>

            {error && (
                <div className="bg-red-50 border border-red-300 text-red-800 p-4 rounded mb-4 w-full max-w-4xl">
                    <p className="font-bold">Failed to post opening balances</p>
                    <p className="text-sm">{error}</p>
                </div>
            )}

            {status === 'SUCCESS' && (
                <div className="bg-green-100 border border-green-400 text-green-800 font-bold uppercase p-4 mb-4 rounded flex w-full max-w-4xl justify-center items-center">
                    <CheckCircle className="w-5 h-5 mr-2" /> MOCK OPENING REGISTERS SENT TO INBOX
                </div>
            )}

            {/* Simulated Doc Header */}
            <div className="flex justify-between items-center w-full max-w-4xl mb-4 bg-slate-100 p-4 border rounded">
                <div className="text-xl font-mono font-black text-slate-700 tracking-tighter">TRIP-B1-0226</div>
                <div className="bg-amber-100 text-amber-800 uppercase px-3 py-1 font-bold text-xs tracking-widest rounded-full shadow-sm border border-amber-300">
                    Draft
                </div>
            </div>

            <div className="bg-white p-6 rounded border mb-8 max-w-4xl w-full border-t-4 border-blue-600 shadow-sm">
                <h3 className="font-bold text-blue-900 mb-4 border-b pb-2 uppercase tracking-widest text-xs">Vessel Load & Fuel Status</h3>

                <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="bg-slate-50 p-3 rounded border border-slate-200">
                        <label className="text-[0.6rem] font-bold text-slate-500 uppercase">Fuel Loading (Liters)</label>
                        <input type="number" className="w-full mt-1 border border-slate-300 p-1 text-right font-mono text-blue-700 font-bold" defaultValue="1500" disabled />
                    </div>
                    <div className="bg-slate-50 p-3 rounded border border-slate-200">
                        <label className="text-[0.6rem] font-bold text-slate-500 uppercase">Ice Block Loading (Satuan)</label>
                        <input type="number" className="w-full mt-1 border border-slate-300 p-1 text-right font-mono text-cyan-600 font-bold" defaultValue="45" disabled />
                    </div>
                </div>

                <h3 className="font-bold text-blue-900 mt-8 mb-4 border-b pb-2 uppercase tracking-widest text-xs">Trip Cash Wallet Declaration</h3>

                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-emerald-50 p-4 rounded border border-emerald-200">
                        <label className="text-[0.7rem] font-bold text-emerald-800 uppercase block mb-2">Physical Cash On Board</label>
                        <input type="number" className="w-full border border-emerald-300 p-2 text-right font-mono text-emerald-700 font-black text-xl" defaultValue="5000000" disabled />
                    </div>
                    <div className="p-4 rounded border border-slate-200 bg-white">
                        <label className="text-[0.7rem] font-bold text-slate-500 uppercase block mb-1">Wallet Tag Creation</label>
                        <div className="font-mono text-sm font-bold text-slate-800 mt-3 pt-3 border-t border-slate-100">"TRIP-WALLET-B1"</div>
                        <p className="text-[0.6rem] mt-2 text-slate-400">This balance is dynamically tracked for the duration of the trip.</p>
                    </div>
                </div>

                {/* Advance Paid Grid */}
                <div className="bg-amber-50 border border-amber-200 p-6 rounded mt-8">
                    <h3 className="font-black text-amber-900 uppercase tracking-widest mb-4 flex items-center border-b border-amber-200 pb-2">
                        <Coins className="w-5 h-5 mr-2" /> Employee Advances Paid at Start
                    </h3>
                    <table className="w-full shadow-sm text-sm text-left border-collapse border border-slate-200">
                        <thead>
                            <tr>
                                <th className="bg-amber-800 text-amber-100 p-2 border font-bold">Staff Member</th>
                                <th className="bg-amber-800 text-amber-100 p-2 border font-bold">Reason/Detail</th>
                                <th className="bg-amber-800 text-amber-100 p-2 border font-bold text-right">Amount (Rp)</th>
                                <th className="bg-amber-800 text-amber-100 p-2 border font-bold">Wallet Source</th>
                                <th className="bg-amber-800 text-amber-100 p-2 border"></th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="bg-white">
                                <td className="p-2 border">
                                    <select className="w-full p-1 border" disabled>
                                        <option>Pak Budi</option>
                                    </select>
                                </td>
                                <td className="p-2 border">
                                    <input type="text" className="w-full p-1 border" defaultValue="Weekly Food Advance" disabled />
                                </td>
                                <td className="p-2 border">
                                    <input type="number" className="w-full p-1 border text-right font-mono text-red-600 font-bold" defaultValue="250000" disabled />
                                </td>
                                <td className="p-2 border">
                                    <select className="w-full p-1 border text-xs bg-slate-50" disabled>
                                        <option>Session Wallet</option>
                                    </select>
                                </td>
                                <td className="p-2 border text-center align-middle">
                                    <X className="text-red-500 w-4 h-4 cursor-pointer inline-block" />
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Document Action Panel Mock */}
            <div className="flex space-x-4 max-w-4xl w-full justify-end mt-4">
                <button
                    disabled={status !== 'IDLE'}
                    className="px-6 py-2 bg-slate-100 border border-slate-300 text-slate-600 font-bold uppercase text-xs tracking-widest rounded transition hover:bg-white hover:text-slate-800 flex items-center disabled:opacity-50"
                >
                    <Save className="w-4 h-4 mr-2" /> Save Draft
                </button>
                <button
                    disabled={status !== 'IDLE'}
                    onClick={handleApproveAndPost}
                    className="px-8 py-3 bg-blue-600 text-white font-bold uppercase text-sm tracking-widest rounded transition hover:bg-blue-700 flex items-center disabled:opacity-50"
                >
                    {status === 'LOADING' ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Check className="w-5 h-5 mr-2" />}
                    {status === 'LOADING' ? 'POSTING...' : 'Approve & Post'}
                </button>
            </div>
        </div>
    );
};

export default OpeningBalances;
