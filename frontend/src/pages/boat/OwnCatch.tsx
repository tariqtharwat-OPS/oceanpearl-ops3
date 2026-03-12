import React, { useState } from 'react';
import { Anchor, Trash2, Printer, Lock } from 'lucide-react';
import { firestoreWriterService } from '../../services/firestoreWriterService';
import { useAuth } from '../../contexts/AuthContext';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: (string | undefined | null | false)[]) {
    return twMerge(clsx(inputs));
}

const OwnCatch: React.FC = () => {
    const { userProfile } = useAuth();
    const companyId = 'oceanpearl';
    const locationId = userProfile?.allowedLocationIds?.[0] || 'LOC-BOAT-01';
    const unitId = userProfile?.allowedUnitIds?.[0] || 'UNIT-BOAT-01';
    const [lines, setLines] = useState([
        { id: 1, sku: 'Snapper (Grade A)', weight: 120.5, quality: 'Standard / Cold' }
    ]);

    const [status, setStatus] = useState<'draft' | 'loading' | 'success' | 'error'>('draft');
    const [errorMsg, setErrorMsg] = useState('');

    const documentId = "RCV-OWN-0226";
    const tripId = "TRIP-B1-0226";
    const vesseId = "Boat-Faris";

    const addLine = () => {
        setLines([...lines, { id: Date.now(), sku: 'Snapper (Grade A)', weight: 0, quality: 'Standard / Cold' }]);
    };

    const removeLine = (id: number) => {
        setLines(lines.filter(l => l.id !== id));
    };

    const updateLine = (id: number, field: string, value: any) => {
        setLines(lines.map(l => l.id === id ? { ...l, [field]: value } : l));
    };

    const totalWeight = lines.reduce((acc, l) => acc + (Number(l.weight) || 0), 0);

    const handlePost = async () => {
        if (lines.length === 0) return;
        setStatus('loading');

        try {
            // For own catch, it's a direct inventory record per line or a bundled document.
            // Following the directive "UI action -> signed request -> inventory_event_requests inbox",
            // we will send it as an inventory event. 
            // Since the UI allows multiple lines, we can either send multiple events or a bundled one if the backend supports it.
            // Current validateTransferEvent handles one event. So we loop.

            for (const line of lines) {
                const payload = {
                    event_type: "receive_own",
                    location_id: locationId,
                    unit_id: vesseId,
                    company_id: companyId,

                    location_id: locationId,

                    unit_id: unitId,

                    sku_id: line.sku.toLowerCase().replace(/\s+/g, '-'), // dummy slugify
                    amount: Number(line.weight),
                    trip_id: tripId,
                    document_id: documentId,
                    quality: line.quality,
                    recorded_at: new Date().toISOString(),
                    source_screen: "boat_recv_own"
                };
                await firestoreWriterService.writeInventoryEvent(payload);
            }

            setStatus('success');
        } catch (e: any) {
            console.error("Failed to post own catch:", e);
            setStatus('error');
            setErrorMsg(e.message || "Unknown error occurred");
        }
    };

    return (
        <div className="screen active">
            <h2 className="text-2xl font-black text-slate-800 mb-6 uppercase tracking-widest border-b-2 border-slate-300 pb-2 flex items-center">
                4. Receive Own Catch
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

            <div className="bg-white p-6 border rounded shadow-sm border-t-8 border-cyan-600 max-w-5xl mb-6">
                <h3 className="font-black text-cyan-900 border-b border-cyan-200 pb-2 mb-4 uppercase tracking-widest flex items-center">
                    <Anchor className="w-5 h-5 mr-3" /> Physical Fish Onboarding (Own Vessel)
                </h3>

                <table className="w-full inv-table shadow-sm border border-cyan-200 mb-6 rounded overflow-hidden">
                    <thead>
                        <tr className="bg-cyan-900">
                            <th className="text-white font-bold text-xs uppercase tracking-wider py-2 px-3 text-left">Fish SKU / Species</th>
                            <th className="text-white font-bold text-xs uppercase tracking-wider py-2 px-3 text-right">Gross Weight KG</th>
                            <th className="text-white font-bold text-xs uppercase tracking-wider py-2 px-3 text-center">Quality / Temp</th>
                            <th className="text-white font-bold text-xs uppercase tracking-wider py-2 px-3 text-center"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {lines.map((line) => (
                            <tr key={line.id}>
                                <td className="bg-white border-b border-slate-200 p-2">
                                    <select
                                        className="border p-2 w-full text-sm"
                                        value={line.sku}
                                        onChange={(e) => updateLine(line.id, 'sku', e.target.value)}
                                        disabled={status === 'success' || status === 'loading'}
                                    >
                                        <option value="Snapper (Grade A)">Snapper (Grade A)</option>
                                        <option value="Grouper (Grade A)">Grouper (Grade A)</option>
                                        <option value="Tuna (Grade A)">Tuna (Grade A)</option>
                                    </select>
                                </td>
                                <td className="bg-white border-b border-slate-200 p-2">
                                    <input
                                        type="number"
                                        className="border p-2 w-full text-right font-black text-xl font-mono text-cyan-700"
                                        value={line.weight}
                                        onChange={(e) => updateLine(line.id, 'weight', e.target.value)}
                                        disabled={status === 'success' || status === 'loading'}
                                    />
                                </td>
                                <td className="bg-white text-center text-sm font-bold text-slate-400 border-b border-slate-200 p-2">
                                    {line.quality}
                                </td>
                                <td className="bg-white text-center border-b border-slate-200 p-2">
                                    <button
                                        onClick={() => removeLine(line.id)}
                                        disabled={status === 'success' || status === 'loading' || lines.length === 1}
                                    >
                                        <Trash2 className="w-4 h-4 text-red-400 cursor-pointer inline" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {status !== 'success' && (
                    <button
                        className="text-sm font-bold text-cyan-600 flex items-center mb-6"
                        onClick={addLine}
                    >
                        + Add Fish SKU Row
                    </button>
                )}

                <div className="bg-cyan-50 border border-cyan-300 p-4 rounded text-right mb-6">
                    <div className="text-xs uppercase tracking-widest text-cyan-800 font-bold mb-1">Total Trip Catch Volume</div>
                    <div className="font-black font-mono text-3xl text-cyan-900">{totalWeight.toFixed(1)} KG</div>
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
                <strong>UI OUTCOME SPEC:</strong> Visually increases Boat Inventory Quantity. Does not affect AP or Wallets (zero cost basis onboarding).
            </div>
        </div>
    );
};

export default OwnCatch;
