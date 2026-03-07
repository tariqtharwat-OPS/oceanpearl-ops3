import React, { useState } from 'react';
import { Anchor, Info, X, Printer, Lock } from 'lucide-react';
import { firestoreWriterService } from '../../services/firestoreWriterService';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: (string | undefined | null | false)[]) {
    return twMerge(clsx(inputs));
}

const TripExpenses: React.FC = () => {
    const [vendor, setVendor] = useState('Pertamina (Fuel)');
    const [wallet, setWallet] = useState('TRIP-WALLET-B1');
    const [crewName, setCrewName] = useState('Pak Budi (ID-011)');
    const [lines, setLines] = useState([
        { id: 1, type: 'Crew/Employee Payment / Advance', desc: 'Additional provisioning advance', amount: 250000 }
    ]);

    // Status can be: 'draft', 'loading', 'success', 'error'
    const [status, setStatus] = useState<'draft' | 'loading' | 'success' | 'error'>('draft');
    const [errorMsg, setErrorMsg] = useState('');

    const documentId = "EXP-B1-0226";
    const tripId = "TRIP-B1-0226";

    const addLine = () => {
        setLines([...lines, { id: Date.now(), type: 'General Expense', desc: '', amount: 0 }]);
    };

    const removeLine = (id: number) => {
        setLines(lines.filter(l => l.id !== id));
    };

    const updateLine = (id: number, field: string, value: any) => {
        setLines(lines.map(l => l.id === id ? { ...l, [field]: value } : l));
    };

    const total = lines.reduce((acc, l) => acc + (Number(l.amount) || 0), 0);
    const isCrewPayment = vendor === 'Crew/Employee Payment';

    const handlePostDocument = async () => {
        if (lines.length === 0) return;
        setStatus('loading');

        try {
            const documentPayload = {
                document_id: documentId,
                document_type: "expense_invoice",
                trip_id: tripId,
                vendor: vendor,
                wallet_source: wallet,
                total_amount: total,
                recorded_at: new Date().toISOString(),
                lines: lines.map(line => ({
                    wallet_id: wallet,
                    amount: Number(line.amount),
                    event_type: "expense", // Map based on type, but for now we just use 'expense'
                    expense_category: line.type,
                    description: line.desc,
                    employee_id: isCrewPayment ? crewName : undefined,
                    source_screen: "boat_exp"
                }))
            };

            await firestoreWriterService.writeDocumentRequest(documentPayload);
            setStatus('success');
        } catch (e: any) {
            console.error("Failed to post document:", e);
            setStatus('error');
            setErrorMsg(e.message || "Unknown error occurred");
        }
    };

    return (
        <div className="screen active">
            <h2 className="text-2xl font-black text-slate-800 mb-6 uppercase tracking-widest border-b-2 border-slate-300 pb-2 flex items-center">
                3. Trip Expenses
            </h2>

            <div className="doc-header flex justify-between items-start bg-white p-4 border border-slate-200 rounded-lg shadow-sm mb-6">
                <div className="flex items-center">
                    <div className="bg-blue-900 w-10 h-10 rounded flex items-center justify-center mr-4 shadow-sm">
                        <Anchor className="text-white w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-[0.6rem] font-black tracking-widest text-slate-400 uppercase">Ocean Pearl Seafood</div>
                        <div className="text-2xl font-black font-mono text-slate-800 leading-none mt-1">{documentId}</div>
                        <div className="text-xs font-bold text-slate-500 mt-1">2026-03-01 10:00 | Loc: Kaimana Hub</div>
                    </div>
                </div>
                <div className={cn(
                    "px-3 py-1 font-bold rounded shadow-sm text-sm uppercase tracking-wide",
                    status === 'draft' ? "bg-amber-100 text-amber-800" :
                        status === 'success' ? "bg-emerald-100 text-emerald-800" :
                            status === 'error' ? "bg-red-100 text-red-800" :
                                "bg-blue-100 text-blue-800"
                )}>
                    {status === 'success' ? 'Posted' : status === 'error' ? 'Error' : status === 'loading' ? 'Posting...' : 'Draft'}
                </div>
            </div>

            <div className="bg-white p-6 rounded shadow-sm mb-8 border-l-4 border-yellow-400 max-w-5xl">
                <h3 className="uppercase font-black text-slate-400 text-sm tracking-widest mb-4">Expense Voucher</h3>
                <div className="grid grid-cols-3 gap-4 mb-4">
                    <div>
                        <label className="text-xs font-bold text-slate-500 block">Vendor/Payee</label>
                        <select
                            className="border p-2 w-full"
                            value={vendor}
                            onChange={(e) => setVendor(e.target.value)}
                            disabled={status === 'success' || status === 'loading'}
                        >
                            <option value="Pertamina (Fuel)">Pertamina (Fuel)</option>
                            <option value="Crew/Employee Payment">Crew/Employee Payment</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 block">Selected Payer/Wallet</label>
                        <select
                            className="border p-2 w-full bg-slate-50 font-mono text-xs"
                            value={wallet}
                            onChange={(e) => setWallet(e.target.value)}
                            disabled={status === 'success' || status === 'loading'}
                        >
                            <option value="TRIP-WALLET-B1">TRIP WALLET [Bal: 4.75M]</option>
                            <option value="Unpaid">Unpaid (AP generated to Location Hub)</option>
                        </select>
                    </div>
                </div>

                {isCrewPayment && (
                    <div id="crew_payment_expander" className="bg-indigo-50 p-4 border border-indigo-200 rounded mb-4">
                        <h4 className="font-bold text-xs uppercase text-indigo-800 mb-2 tracking-wide flex items-center">
                            <Info className="w-3 h-3 mr-1" /> Staff Payment Details
                        </h4>
                        <div className="flex space-x-4">
                            <div className="w-1/3">
                                <label className="text-[0.6rem] text-indigo-600 font-bold block">Person Name</label>
                                <select
                                    className="border p-1 w-full text-sm"
                                    value={crewName}
                                    onChange={(e) => setCrewName(e.target.value)}
                                    disabled={status === 'success' || status === 'loading'}
                                >
                                    <option value="Pak Budi (ID-011)">Pak Budi (ID-011)</option>
                                    <option value="Maman (ID-042)">Maman (ID-042)</option>
                                </select>
                            </div>
                            <div className="w-2/3">
                                <label className="text-[0.6rem] text-indigo-600 font-bold block">Wallet Impact</label>
                                <div className="font-mono text-xs mt-1 p-1 bg-white border rounded">
                                    Minus Rp {total.toLocaleString()} (Expense) -&gt; Reduces {wallet} by {total.toLocaleString()}.
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <table className="w-full inv-table shadow-sm border mb-4">
                    <thead>
                        <tr>
                            <th className="bg-slate-800 text-white font-bold text-xs uppercase tracking-wider py-2 px-3 text-left">Expense Type (Cat)</th>
                            <th className="bg-slate-800 text-white font-bold text-xs uppercase tracking-wider py-2 px-3 text-left">Description</th>
                            <th className="bg-slate-800 text-white font-bold text-xs uppercase tracking-wider py-2 px-3 text-right">Amount IDR</th>
                            <th className="bg-slate-800 text-white font-bold text-xs uppercase tracking-wider py-2 px-3 text-center"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {lines.map((line) => (
                            <tr key={line.id}>
                                <td className="w-1/4 align-top border-b border-slate-200 p-2">
                                    <select
                                        className="border p-1 w-full text-xs font-bold"
                                        value={line.type}
                                        onChange={(e) => updateLine(line.id, 'type', e.target.value)}
                                        disabled={status === 'success' || status === 'loading'}
                                    >
                                        <option value="Crew/Employee Payment / Advance">Crew/Employee Payment / Advance</option>
                                        <option value="Fuel (Solar/BBM)">Fuel (Solar/BBM)</option>
                                        <option value="General Expense">General Expense</option>
                                    </select>
                                </td>
                                <td className="w-1/2 p-2 align-top bg-slate-50 border-b border-slate-200">
                                    <input
                                        type="text"
                                        className="border p-1 w-full text-xs"
                                        value={line.desc}
                                        onChange={(e) => updateLine(line.id, 'desc', e.target.value)}
                                        disabled={status === 'success' || status === 'loading'}
                                    />
                                </td>
                                <td className="w-1/6 align-top pt-3 border-b border-slate-200 p-2">
                                    <input
                                        type="number"
                                        className="w-full border p-1 text-right font-bold text-red-600 font-mono"
                                        value={line.amount}
                                        onChange={(e) => updateLine(line.id, 'amount', e.target.value)}
                                        disabled={status === 'success' || status === 'loading'}
                                    />
                                </td>
                                <td className="align-top pt-3 text-center border-b border-slate-200">
                                    <button
                                        onClick={() => removeLine(line.id)}
                                        disabled={status === 'success' || status === 'loading' || lines.length === 1}
                                        className="disabled:opacity-50"
                                    >
                                        <X className="text-red-500 w-4 h-4 cursor-pointer hover:bg-red-50 rounded" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {status !== 'success' && (
                    <button
                        className="text-sm font-bold text-slate-500 hover:text-slate-800 mb-4"
                        onClick={addLine}
                    >
                        + Add Document Line
                    </button>
                )}

                <div className="flex justify-end">
                    <div className="bg-slate-50 border border-slate-300 p-4 rounded w-64 text-right">
                        <div className="flex justify-between font-black text-2xl text-slate-800 border-b pb-2 mb-2">
                            <span className="text-sm">TOTAL</span>
                            <span className="font-mono">{total.toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                {status === 'error' && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm font-bold rounded">
                        Error: {errorMsg}
                    </div>
                )}

                <div className="mt-6 border-t border-slate-200 pt-6 flex justify-between items-center bg-slate-50 p-4 rounded no-print">
                    <button className="bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 font-bold py-2 px-4 rounded shadow flex items-center justify-center cursor-pointer">
                        <Printer className="w-4 h-4 mr-2" /> Print Preview
                    </button>
                    <div className="flex space-x-3">
                        <button className="bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 font-bold py-2 px-8 rounded shadow flex items-center justify-center cursor-pointer">
                            Save Draft
                        </button>
                        <button
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-12 rounded shadow flex items-center justify-center cursor-pointer uppercase tracking-wide disabled:opacity-50"
                            onClick={handlePostDocument}
                            disabled={status === 'success' || status === 'loading' || lines.length === 0}
                        >
                            <Lock className="w-4 h-4 mr-2" />
                            {status === 'loading' ? 'Posting...' : 'Post Document'}
                        </button>
                    </div>
                </div>
            </div>

            <div className="border border-slate-300 bg-slate-100 p-4 rounded-lg mt-8 text-xs text-slate-800 font-mono shadow-inner">
                <strong>UI OUTCOME SPEC:</strong> Validates wallet balance delta upon post. Requires 'Person Name' selection if 'Crew/Employee Payment' is the chosen vendor. Dropdowns link to Admin master registries via inline additions.
            </div>
        </div>
    );
};

export default TripExpenses;
