import React, { useState } from 'react';
import { Anchor, Lock, Users, Printer, QrCode } from 'lucide-react';
import { firestoreWriterService } from '../../services/firestoreWriterService';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: (string | undefined | null | false)[]) {
    return twMerge(clsx(inputs));
}

const TripClosure: React.FC = () => {
    const [status, setStatus] = useState<'draft' | 'loading' | 'success' | 'error'>('draft');
    const [errorMsg, setErrorMsg] = useState('');

    const tripId = "TRIP-B1-0226";
    const vesselId = "Boat Faris";
    const locationId = "Kaimana-Hub";
    const walletId = "TRIP-WALLET-B1";
    const hubWalletId = "HUB-TREASURY-01";

    // Summary Data (Mocked for UI rendering as per Phase 1 scope)
    const summary = {
        catch: {
            own: 120.5,
            purchased: 25.0,
            total: 145.5
        },
        audit: {
            opening: 5000000,
            sales: 2000000,
            expenses: 500000,
            remitted: 6500000,
            balance: 0
        },
        crew: [
            { name: "Pak Budi (ID-011)", advance: 750000, earned: 1000000, net: 250000, carry: 0 },
            { name: "Maman (ID-042)", advance: 100000, earned: 0, net: -100, carry: 100000 }
        ]
    };

    const handleCloseTrip = async () => {
        setStatus('loading');
        try {
            const closurePayload = {
                document_id: `CLOSE-${tripId}`,
                document_type: "trip_closure",
                trip_id: tripId,
                recorded_at: new Date().toISOString(),
                location_id: locationId,
                unit_id: vesselId,
                lines: [
                    // Cash Remittance Line
                    {
                        wallet_id: walletId,
                        payment_amount: summary.audit.remitted,
                        payment_event_type: "transfer_initiated",
                        destination_wallet_id: hubWalletId,
                        source_screen: "boat_close"
                    },
                    // Inventory Remittance Lines (Example for Snapper)
                    {
                        sku_id: "snapper-grade-a",
                        amount: summary.catch.total,
                        event_type: "transfer_initiated",
                        location_id: locationId,
                        unit_id: vesselId,
                        destination_location_id: locationId, // Hub Location
                        destination_unit_id: "HUB-WAREHOUSE",
                        source_screen: "boat_close"
                    }
                ]
            };

            await firestoreWriterService.writeDocumentRequest(closurePayload);
            setStatus('success');
        } catch (e: any) {
            console.error("Failed to close trip:", e);
            setStatus('error');
            setErrorMsg(e.message || "Unknown error occurred");
        }
    };

    return (
        <div className="screen active">
            <h2 className="text-2xl font-black text-slate-800 mb-6 uppercase tracking-widest border-b-2 border-slate-300 pb-2 flex items-center">
                8. Close Trip & Settle
            </h2>

            <div className="bg-white p-6 border-t-8 border-slate-900 rounded shadow-2xl max-w-5xl mb-12 relative overflow-hidden">
                <div className="absolute -right-16 -top-16 opacity-5 pointer-events-none text-slate-900">
                    <Anchor className="w-96 h-96" />
                </div>
                <h1 className="text-4xl font-black uppercase text-slate-900 tracking-tight mb-2 italic">Trip Closure & Final Settlement</h1>
                <p className="text-slate-500 text-sm mb-8 font-mono tracking-widest bg-slate-100 inline-block px-3 py-1 rounded">
                    {tripId} | {vesselId}
                </p>

                <div className="grid grid-cols-2 gap-6 text-left mb-8 relative z-10 font-mono">
                    <div className="bg-slate-50 border p-6 text-sm leading-relaxed rounded shadow-inner border-t-4 border-t-blue-500">
                        <span className="text-slate-500 font-bold uppercase block mb-2 border-b-2 border-slate-200 pb-1 text-xs tracking-widest">Aggregate Catch Flow</span>
                        <div className="flex justify-between mb-1">
                            <span className="text-slate-400">Total Own Catch:</span>
                            <span className="font-black text-base text-slate-700">{summary.catch.own} KG</span>
                        </div>
                        <div className="flex justify-between mb-1">
                            <span className="text-slate-400">Total Purchased:</span>
                            <span className="font-black text-base text-slate-700">{summary.catch.purchased} KG</span>
                        </div>
                        <div className="flex justify-between font-bold text-blue-800 border-t border-blue-100 pt-2 mt-2 bg-blue-50/50 -mx-6 px-6 pb-2">
                            <span className="uppercase">Net Trip Stock Retained:</span>
                            <span className="text-xl tracking-tighter text-blue-600 shadow-sm bg-white px-2 py-0.5 rounded border border-blue-200">{summary.catch.total} KG</span>
                        </div>
                    </div>

                    <div className="border p-6 text-sm rounded bg-emerald-50 border-emerald-200 border-t-4 border-t-emerald-500 shadow-sm relative">
                        <span className="text-emerald-800 font-bold uppercase block mb-2 border-b-2 border-emerald-200 pb-1 text-xs tracking-widest">Trip Final Cash Audit</span>
                        <div className="flex justify-between mb-1">
                            <span className="text-emerald-700/70 uppercase text-[0.6rem] font-bold tracking-widest">Opening Bal:</span>
                            <span className="text-emerald-900 font-bold">Rp {summary.audit.opening.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between mb-1 bg-white border border-emerald-100/50 p-1 rounded-sm">
                            <span className="text-emerald-700/70 uppercase text-[0.6rem] font-bold tracking-widest">Net Sales/Trf (In):</span>
                            <span className="text-emerald-600 font-bold">+ Rp {summary.audit.sales.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between mb-1 bg-white border border-red-50 p-1 rounded-sm">
                            <span className="text-red-400 uppercase text-[0.6rem] font-bold tracking-widest">Exp/Purch (Out):</span>
                            <span className="text-red-500 font-bold">- Rp {summary.audit.expenses.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between mb-1 bg-white border border-amber-50 p-1 rounded-sm">
                            <span className="text-amber-500 uppercase text-[0.6rem] font-bold tracking-widest">Remitted HQ (Out):</span>
                            <span className="text-amber-600 font-bold">- Rp {summary.audit.remitted.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between border-t-2 border-emerald-300 pt-3 mt-3 shadow-[0_-4px_6px_-6px_rgba(0,0,0,0.1)]">
                            <span className="font-black text-emerald-900 text-sm uppercase">Wallet Close Sys Bal:</span>
                            <span className="font-black text-2xl tracking-tighter text-emerald-600">Rp {summary.audit.balance.toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                <div className="mt-8 bg-orange-50 p-6 rounded border border-orange-200 shadow-inner relative z-10">
                    <h3 className="font-black text-orange-900 border-b border-orange-300 pb-2 mb-4 uppercase tracking-widest flex items-center text-sm italic">
                        <Users className="w-4 h-4 mr-2 text-orange-600" /> Final Crew Settlement Table
                    </h3>
                    <p className="text-xs text-orange-800 mb-4 bg-white p-2 border border-orange-100 rounded font-bold">
                        Net clearance of all advances pulled from opening and mid-trip against actual wage/profit share earned.
                    </p>
                    <table className="w-full inv-table shadow border border-orange-300 rounded overflow-hidden">
                        <thead>
                            <tr className="bg-orange-900 text-orange-100">
                                <th className="p-2 text-left text-xs uppercase tracking-wider">Crew Roster Name</th>
                                <th className="p-2 text-right text-xs uppercase tracking-wider">Total Advance (Owed)</th>
                                <th className="p-2 text-right text-xs uppercase tracking-wider">Wages (Earned)</th>
                                <th className="p-2 text-right text-xs uppercase tracking-wider">Net Settle</th>
                                <th className="p-2 text-right text-xs uppercase tracking-wider">Carry Forward</th>
                            </tr>
                        </thead>
                        <tbody className="font-mono text-sm uppercase font-bold">
                            {summary.crew.map((member, i) => (
                                <tr key={i}>
                                    <td className="p-2 bg-white border-b border-orange-100 text-slate-800">{member.name}</td>
                                    <td className="p-2 bg-red-50 border-b border-orange-100 text-red-600 text-right">Rp {member.advance.toLocaleString()}</td>
                                    <td className="p-2 bg-white border-b border-orange-100 text-emerald-600 text-right">Rp {member.earned.toLocaleString()}</td>
                                    <td className="p-2 bg-white border-b border-orange-100 text-right">
                                        {member.net >= 0 ? (
                                            <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded border border-emerald-300 uppercase italic">Pay: Rp {member.net.toLocaleString()}</span>
                                        ) : (
                                            <span className="text-red-500">-</span>
                                        )}
                                    </td>
                                    <td className="p-2 bg-slate-50 border-b border-orange-100 text-right italic text-slate-400">
                                        {member.carry > 0 ? `OWES: Rp ${member.carry.toLocaleString()}` : '0'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {status === 'error' && (
                    <div className="mt-8 p-4 bg-red-50 border border-red-200 text-red-600 font-bold rounded">
                        Error: {errorMsg}
                    </div>
                )}

                <button
                    className={cn(
                        "w-full py-5 text-xl tracking-widest mt-8 font-black rounded shadow-2xl border transition-all active:scale-[0.98] flex justify-center items-center uppercase",
                        status === 'success' ? "bg-slate-400 border-slate-500 text-white cursor-default" : "bg-slate-800 hover:bg-black text-white border-slate-700"
                    )}
                    onClick={handleCloseTrip}
                    disabled={status === 'loading' || status === 'success'}
                >
                    <Lock className="w-6 h-6 mr-3" />
                    {status === 'loading' ? 'PROCESSING CLOSURE...' : status === 'success' ? 'TRIP CLOSED & LOCKED' : 'ATTEST / LOCK TRIP DATA'}
                </button>
            </div>

            {/* Print Section (A4 Preview) */}
            <div className="a4-preview border shadow-xl mt-16 p-12 bg-white max-w-[210mm] mx-auto hidden lg:block">
                <div className="flex justify-between border-b-2 border-slate-800 pb-4 mb-8">
                    <div className="flex items-center">
                        <div className="w-12 h-12 bg-black text-white flex items-center justify-center mr-4">
                            <Anchor className="w-8 h-8" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black tracking-tighter">OCEAN PEARL</h1>
                            <p className="text-xs uppercase font-bold mt-1 tracking-widest text-slate-500">Kaimana Hub</p>
                        </div>
                    </div>
                    <div className="text-right flex items-center space-x-6">
                        <div>
                            <h2 className="text-2xl uppercase tracking-widest text-slate-400 font-light">TRIP CLOSURE SETTLEMENT</h2>
                            <p className="font-mono mt-2 text-sm font-black tracking-widest">CLOSE-{tripId}</p>
                        </div>
                        <div className="w-20 h-20 bg-slate-100 border-2 border-slate-300 p-2 flex items-center justify-center flex-col shadow-sm">
                            <QrCode className="w-12 h-12 text-slate-400" />
                            <span className="text-[0.5rem] font-bold mt-1 text-slate-500">SCAN VALIDATE</span>
                        </div>
                    </div>
                </div>

                <div className="border-2 border-dashed border-slate-200 p-8 text-center text-slate-400 font-mono italic">
                    [ Official Trip Closure Summary Document Content ]
                </div>

                <div className="mt-8 flex justify-between">
                    <div className="w-1/3 border-t border-slate-800 pt-2 text-center">
                        <span className="text-[0.6rem] font-bold uppercase tracking-widest">Boat Captain</span>
                    </div>
                    <div className="w-1/3 border-t border-slate-800 pt-2 text-center">
                        <span className="text-[0.6rem] font-bold uppercase tracking-widest">Hub Treasury</span>
                    </div>
                </div>
            </div>

            <div className="spec-panel border border-slate-300 bg-slate-100 p-4 rounded-lg mt-8 text-xs text-slate-800 font-mono shadow-inner">
                <strong>UI OUTCOME SPEC:</strong> Verifies outbound requested transfer amount against current active wallet state. Status 'Posted' implies recipient Hub wallet increases while Trip Wallet decreases. Trip becomes immutable.
            </div>
        </div>
    );
};

export default TripClosure;
