import React, { useState } from 'react';
import { Anchor, ShoppingCart, Trash2, Printer, Lock } from 'lucide-react';
import { firestoreWriterService } from '../../services/firestoreWriterService';
import { useAuth } from '../../contexts/AuthContext';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: (string | undefined | null | false)[]) {
    return twMerge(clsx(inputs));
}

const BoatSale: React.FC = () => {
    const { userProfile } = useAuth();
    const companyId = 'oceanpearl';
    const locationId = userProfile?.allowedLocationIds?.[0] || 'LOC-BOAT-01';
    const unitId = userProfile?.allowedUnitIds?.[0] || 'UNIT-BOAT-01';
    const [customer, setCustomer] = useState('Local Market Trader');
    const [paymentMethod, setPaymentMethod] = useState('cash'); // 'cash' or 'receivable'
    const [lines, setLines] = useState([
        { id: 1, sku: 'snapper-grade-a', skuLabel: 'Snapper (Grade A) [Bal: 120.5kg]', quantity: 20.0, unitPrice: 100000 }
    ]);

    const [status, setStatus] = useState<'draft' | 'loading' | 'success' | 'error'>('draft');
    const [errorMsg, setErrorMsg] = useState('');

    const documentId = "INV-B1-SALE-0226";
    const tripId = "TRIP-B1-0226";
    const vesseId = "Boat-Faris";
    const walletId = "TRIP-WALLET-B1";

    const addLine = () => {
        setLines([...lines, { id: Date.now(), sku: 'snapper-grade-a', skuLabel: 'Snapper (Grade A)', quantity: 0, unitPrice: 0 }]);
    };

    const removeLine = (id: number) => {
        setLines(lines.filter(l => l.id !== id));
    };

    const updateLine = (id: number, field: string, value: any) => {
        setLines(lines.map(l => l.id === id ? { ...l, [field]: value } : l));
    };

    const totalValue = lines.reduce((acc, l) => acc + (Number(l.quantity) * Number(l.unitPrice) || 0), 0);

    const handlePostDocument = async () => {
        if (lines.length === 0) return;
        setStatus('loading');

        try {
            const documentPayload = {
                document_id: documentId,
                document_type: "sale_invoice",
                trip_id: tripId,
                customer: customer,
                payment_method: paymentMethod,
                total_amount: totalValue,
                recorded_at: new Date().toISOString(),
                location_id: locationId,
                unit_id: vesseId,
                lines: lines.map(line => ({
                    // Inventory Part
                    company_id: companyId,

                    location_id: locationId,

                    unit_id: unitId,

                    sku_id: line.sku,
                    amount: Number(line.quantity),
                    event_type: "sale_out",
                    location_id: locationId,
                    unit_id: vesseId,

                    // Financial Part (if cash)
                    company_id: companyId,

                    location_id: locationId,

                    unit_id: unitId,

                    wallet_id: paymentMethod === 'cash' ? walletId : undefined,
                    payment_amount: Number(line.quantity) * Number(line.unitPrice),
                    payment_event_type: paymentMethod === 'cash' ? "revenue_cash" : undefined,

                    // Metadata
                    unit_price: Number(line.unitPrice),
                    line_total: Number(line.quantity) * Number(line.unitPrice),
                    source_screen: "boat_sale"
                }))
            };

            await firestoreWriterService.writeDocumentRequest(documentPayload);
            setStatus('success');
        } catch (e: any) {
            console.error("Failed to post sale:", e);
            setStatus('error');
            setErrorMsg(e.message || "Unknown error occurred");
        }
    };

    return (
        <div className="screen active">
            <h2 className="text-2xl font-black text-slate-800 mb-6 uppercase tracking-widest border-b-2 border-slate-300 pb-2 flex items-center">
                6. Boat Sales
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

            <div className="bg-white p-6 border rounded shadow-sm border-t-8 border-emerald-500 max-w-5xl mb-6 flex flex-col">
                <h3 className="font-black text-emerald-900 border-b border-emerald-200 pb-2 mb-4 uppercase tracking-widest flex items-center">
                    <ShoppingCart className="w-5 h-5 mr-3 text-emerald-600" /> Direct Outbound Sale (Commercial)
                </h3>

                <div className="grid grid-cols-2 gap-6 bg-slate-50 p-4 border rounded mb-6">
                    <div>
                        <label className="text-xs font-bold text-slate-500 block mb-1">Customer Entity</label>
                        <select
                            className="border p-2 w-full text-sm font-bold"
                            value={customer}
                            onChange={(e) => setCustomer(e.target.value)}
                            disabled={status === 'success' || status === 'loading'}
                        >
                            <option value="Local Market Trader">Local Market Trader</option>
                            <option value="Export Agent X">Export Agent X</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-[0.6rem] font-bold text-slate-500 uppercase tracking-widest block mb-1">Funds Receipt Path</label>
                        <select
                            className="border p-2 w-full text-sm font-mono border-emerald-300"
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            disabled={status === 'success' || status === 'loading'}
                        >
                            <option value="cash">Paid into TRIP WALLET</option>
                            <option value="receivable">Unpaid (Generates Corporate AR)</option>
                        </select>
                    </div>
                </div>

                <table className="w-full inv-table border border-emerald-300 shadow-sm mb-6 overflow-hidden rounded">
                    <thead>
                        <tr className="bg-emerald-900">
                            <th className="text-white font-bold text-xs uppercase tracking-wider py-2 px-3 text-left">SKU Sold From Stock</th>
                            <th className="text-white font-bold text-xs uppercase tracking-wider py-2 px-3 text-right">Outbound Qty KG</th>
                            <th className="text-white font-bold text-xs uppercase tracking-wider py-2 px-3 text-right">Unit Sale Price</th>
                            <th className="text-white font-bold text-xs uppercase tracking-wider py-2 px-3 text-right">Revenue Generation</th>
                            <th className="text-white font-bold text-xs uppercase tracking-wider py-2 px-3 text-center"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {lines.map((line) => (
                            <tr key={line.id}>
                                <td className="bg-white border-b border-emerald-100 p-2">
                                    <select
                                        className="border p-1 w-full text-xs font-bold bg-emerald-50"
                                        value={line.sku}
                                        onChange={(e) => updateLine(line.id, 'sku', e.target.value)}
                                        disabled={status === 'success' || status === 'loading'}
                                    >
                                        <option value="snapper-grade-a">Snapper (Grade A) [Bal: 120.5kg]</option>
                                        <option value="grouper-live">Grouper (Live)</option>
                                    </select>
                                </td>
                                <td className="bg-white border-b border-emerald-100 p-2">
                                    <input
                                        type="number"
                                        className="w-full border p-1 text-right font-mono font-black"
                                        value={line.quantity}
                                        onChange={(e) => updateLine(line.id, 'quantity', e.target.value)}
                                        disabled={status === 'success' || status === 'loading'}
                                    />
                                </td>
                                <td className="bg-white border-b border-emerald-100 p-2">
                                    <input
                                        type="number"
                                        className="w-full border p-1 text-right font-mono"
                                        value={line.unitPrice}
                                        onChange={(e) => updateLine(line.id, 'unitPrice', e.target.value)}
                                        disabled={status === 'success' || status === 'loading'}
                                    />
                                </td>
                                <td className="bg-white border-b border-emerald-100 p-2">
                                    <input
                                        type="text"
                                        disabled
                                        className="w-full border p-1 text-right font-mono font-black text-emerald-700 bg-emerald-50"
                                        value={(line.quantity * line.unitPrice).toLocaleString()}
                                    />
                                </td>
                                <td className="bg-white border-b border-emerald-100 p-2 text-center">
                                    <button
                                        onClick={() => removeLine(line.id)}
                                        disabled={status === 'success' || status === 'loading' || lines.length === 1}
                                    >
                                        <Trash2 className="w-4 h-4 text-red-400 cursor-pointer" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {status !== 'success' && (
                    <button
                        className="text-sm font-bold text-emerald-600 flex items-center mb-6"
                        onClick={addLine}
                    >
                        + Add Fish SKU Row
                    </button>
                )}

                <div className="flex justify-end mb-6">
                    <div className="text-right bg-white border border-emerald-400 p-4 rounded shadow min-w-[250px]">
                        <div className="uppercase text-emerald-800 text-[0.6rem] font-black tracking-widest">Total Invoice Recognition</div>
                        <div className="text-3xl font-black font-mono text-emerald-600">
                            Rp {totalValue.toLocaleString()}
                        </div>
                    </div>
                </div>

                {status === 'error' && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm font-bold rounded mb-6">
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

            <div className="spec-panel border border-slate-300 bg-slate-100 p-4 rounded-lg mt-8 text-xs text-slate-800 font-mono shadow-inner">
                <strong>UI OUTCOME SPEC:</strong> Deducts SKU quantity identically to a transfer. Determines if Trip Wallet increases immediately or if global AR is incremented for Hub Finance tracking.
            </div>
        </div>
    );
};

export default BoatSale;
