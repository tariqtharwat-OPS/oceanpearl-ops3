import React, { useState } from 'react';
import { ShoppingBag, Trash2, Printer, Lock } from 'lucide-react';
import { firestoreWriterService } from '../../services/firestoreWriterService';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: (string | undefined | null | false)[]) {
    return twMerge(clsx(inputs));
}

const BuyCatch: React.FC = () => {
    const [supplier, setSupplier] = useState('Pak Nelayan A');
    const [settlement, setSettlement] = useState('ap'); // 'ap' or 'cash'
    const [lines, setLines] = useState([
        { id: 1, sku: 'Grouper (Live)', weight: 25.0, price: 85000 }
    ]);

    const [status, setStatus] = useState<'draft' | 'loading' | 'success' | 'error'>('draft');
    const [errorMsg, setErrorMsg] = useState('');

    const documentId = "RCV-BUY-0226";
    const tripId = "TRIP-B1-0226";
    const vesseId = "Boat-Faris";
    const locationId = "Kaimana-Hub";
    const walletId = "TRIP-WALLET-B1";

    const addLine = () => {
        setLines([...lines, { id: Date.now(), sku: 'Grouper (Live)', weight: 0, price: 0 }]);
    };

    const removeLine = (id: number) => {
        setLines(lines.filter(l => l.id !== id));
    };

    const updateLine = (id: number, field: string, value: any) => {
        setLines(lines.map(l => l.id === id ? { ...l, [field]: value } : l));
    };

    const totalValue = lines.reduce((acc, l) => acc + (Number(l.weight) * Number(l.price) || 0), 0);

    const handlePost = async () => {
        if (lines.length === 0) return;
        setStatus('loading');

        try {
            const documentPayload = {
                document_id: documentId,
                document_type: "purchase_invoice",
                trip_id: tripId,
                supplier_id: supplier,
                settlement_method: settlement,
                total_amount: totalValue,
                recorded_at: new Date().toISOString(),
                location_id: locationId,
                unit_id: vesseId,
                lines: lines.map(line => ({
                    // Inventory Part
                    sku_id: line.sku.toLowerCase().replace(/\s+/g, '-'),
                    amount: Number(line.weight),
                    event_type: "receive_buy",
                    location_id: locationId,
                    unit_id: vesseId,

                    // Financial Part (if cash)
                    wallet_id: settlement === 'cash' ? walletId : undefined,
                    payment_amount: Number(line.weight) * Number(line.price),
                    payment_event_type: settlement === 'cash' ? "expense_purchase" : undefined,

                    // Metadata
                    price_per_kg: Number(line.price),
                    total_value: Number(line.weight) * Number(line.price),
                    source_screen: "boat_recv_buy"
                }))
            };

            await firestoreWriterService.writeDocumentRequest(documentPayload);
            setStatus('success');
        } catch (e: any) {
            console.error("Failed to post buy catch:", e);
            setStatus('error');
            setErrorMsg(e.message || "Unknown error occurred");
        }
    };

    return (
        <div className="screen active">
            <h2 className="text-2xl font-black text-slate-800 mb-6 uppercase tracking-widest border-b-2 border-slate-300 pb-2 flex items-center">
                5. Receive via Purchase
            </h2>

            <div className="doc-header flex justify-between items-start bg-white p-4 border border-slate-200 rounded-lg shadow-sm mb-6">
                <div className="flex items-center">
                    <div className="bg-blue-900 w-10 h-10 rounded flex items-center justify-center mr-4 shadow-sm">
                        <ShoppingBag className="text-white w-6 h-6" />
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

            <div className="bg-white p-6 border rounded shadow-sm border-t-8 border-indigo-600 max-w-5xl mb-6">
                <h3 className="font-black text-indigo-900 border-b border-indigo-200 pb-2 mb-4 uppercase tracking-widest flex items-center">
                    <ShoppingBag className="w-5 h-5 mr-3" /> Buy Catch from Local Fishermen
                </h3>

                <div className="grid grid-cols-2 gap-6 bg-slate-50 p-4 rounded border mb-6">
                    <div>
                        <label className="text-xs font-bold text-slate-500 block mb-1">Supplier Fisherman</label>
                        <select
                            className="border p-2 w-full font-bold text-indigo-800"
                            value={supplier}
                            onChange={(e) => setSupplier(e.target.value)}
                            disabled={status === 'success' || status === 'loading'}
                        >
                            <option value="Pak Nelayan A">Pak Nelayan A</option>
                            <option value="Pak Nelayan B">Pak Nelayan B</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-[0.6rem] font-black uppercase text-indigo-800 tracking-widest block mb-1">Settlement Method</label>
                        <select
                            className="border p-2 w-full bg-white font-mono text-sm border-indigo-300"
                            value={settlement}
                            onChange={(e) => setSettlement(e.target.value)}
                            disabled={status === 'success' || status === 'loading'}
                        >
                            <option value="ap">Create AP Hutang to Location HQ</option>
                            <option value="cash">Pay Cash via TRIP WALLET</option>
                        </select>
                        <p className="text-[0.6rem] text-slate-400 mt-2 font-bold italic">
                            {settlement === 'ap' ? 'Selecting AP flags HQ Finance for payment run.' : 'Directly deducts from Boat trip wallet.'}
                        </p>
                    </div>
                </div>

                <table className="w-full inv-table shadow border border-indigo-300 mb-6 rounded overflow-hidden">
                    <thead>
                        <tr className="bg-indigo-900">
                            <th className="text-white font-bold text-xs uppercase tracking-wider py-2 px-3 text-left">SKU Tag</th>
                            <th className="text-white font-bold text-xs uppercase tracking-wider py-2 px-3 text-right">Acquired KG</th>
                            <th className="text-white font-bold text-xs uppercase tracking-wider py-2 px-3 text-right">Agreed Price / KG</th>
                            <th className="text-white font-bold text-xs uppercase tracking-wider py-2 px-3 text-right">Line Total Value</th>
                            <th className="text-white font-bold text-xs uppercase tracking-wider py-2 px-3 text-center"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {lines.map((line) => (
                            <tr key={line.id}>
                                <td className="bg-white border-b border-indigo-100 p-2">
                                    <select
                                        className="border p-1 w-full text-xs font-bold"
                                        value={line.sku}
                                        onChange={(e) => updateLine(line.id, 'sku', e.target.value)}
                                        disabled={status === 'success' || status === 'loading'}
                                    >
                                        <option value="Grouper (Live)">Grouper (Live)</option>
                                        <option value="Snapper (Red)">Snapper (Red)</option>
                                    </select>
                                </td>
                                <td className="bg-white border-b border-indigo-100 p-2">
                                    <input
                                        type="number"
                                        className="border p-1 w-full text-right font-mono font-bold"
                                        value={line.weight}
                                        onChange={(e) => updateLine(line.id, 'weight', e.target.value)}
                                        disabled={status === 'success' || status === 'loading'}
                                    />
                                </td>
                                <td className="bg-white border-b border-indigo-100 p-2">
                                    <input
                                        type="number"
                                        className="border p-1 w-full text-right font-mono text-slate-500"
                                        value={line.price}
                                        onChange={(e) => updateLine(line.id, 'price', e.target.value)}
                                        disabled={status === 'success' || status === 'loading'}
                                    />
                                </td>
                                <td className="bg-white border-b border-indigo-100 p-2">
                                    <input
                                        type="text"
                                        className="border p-1 w-full text-right font-mono font-black text-red-600 bg-red-50"
                                        value={(line.weight * line.price).toLocaleString()}
                                        disabled
                                    />
                                </td>
                                <td className="bg-white text-center border-b border-indigo-100 p-2">
                                    <button
                                        onClick={() => removeLine(line.id)}
                                        disabled={status === 'success' || status === 'loading' || lines.length === 1}
                                    >
                                        <Trash2 className="w-4 h-4 text-red-400 inline cursor-pointer" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {status !== 'success' && (
                    <button
                        className="text-sm font-bold text-indigo-600 flex items-center mb-6"
                        onClick={addLine}
                    >
                        + Add Fish Row
                    </button>
                )}

                <div className="flex justify-between items-end mb-6">
                    <div className="total-box text-right bg-indigo-50 border-indigo-200 p-4 rounded min-w-[300px]">
                        <div className="text-xs font-bold text-indigo-800 uppercase tracking-widest">Gross Document Obligation</div>
                        <div className="font-black text-3xl font-mono text-indigo-900 mt-1 pb-1 border-b border-indigo-300">
                            Rp {totalValue.toLocaleString()}
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
                            onClick={handlePost}
                            disabled={status === 'success' || status === 'loading' || lines.length === 0}
                        >
                            <Lock className="w-4 h-4 mr-2" />
                            {status === 'loading' ? 'Posting...' : 'Post Document'}
                        </button>
                    </div>
                </div>
            </div>

            <div className="spec-panel border border-slate-300 bg-slate-100 p-4 rounded-lg mt-8 text-xs text-slate-800 font-mono shadow-inner">
                <strong>UI OUTCOME SPEC:</strong> Simultaneous block mapping: Increases inventory quantity. Checks payment method choice to preview either a reduction in Trip Wallet OR the creation of an outstanding AP invoice for the Hub.
            </div>
        </div>
    );
};

export default BuyCatch;
