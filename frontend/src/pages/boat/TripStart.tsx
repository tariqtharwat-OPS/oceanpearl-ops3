import React, { useState } from 'react';
import { Play, Users, X, Loader2, CheckCircle } from 'lucide-react';
import { firestoreWriterService } from '../../services/firestoreWriterService';
import { useAuth } from '../../contexts/AuthContext';

const TripStart: React.FC = () => {
    const [status, setStatus] = useState<'IDLE' | 'LOADING' | 'SUCCESS'>('IDLE');
    const [error, setError] = useState<string | null>(null);
    const { userProfile } = useAuth();
    const companyId = 'oceanpearl';
    const locationId = userProfile?.allowedLocationIds?.[0] || 'LOC-BOAT-01';
    const unitId = userProfile?.allowedUnitIds?.[0] || 'UNIT-BOAT-01';

    const handleStartTrip = async () => {
        try {
            setStatus('LOADING');
            setError(null);

            const payload = {
                company_id: companyId,
                location_id: locationId,
                unit_id: unitId,
                wallet_id: "TRIP-WALLET-B1", // The wallet created for this trip
                event_type: "trip_start",
                amount: 0, // No money moved, just an initialization event
                source_screen: "boat_start",
                recorded_at: new Date().toISOString(),
                trip_id: "TRIP-B1-0226",
                vessel: "Boat Faris",
                zone: "Zone C South"
            };

            const result = await firestoreWriterService.writeWalletEvent(payload);
            console.log("Trip Start Request queued to inbox:", result);
            setStatus('SUCCESS');
        } catch (e: any) {
            console.error("Start trip error:", e);
            setError(e.message);
            setStatus('IDLE');
        }
    };

    return (
        <div className="p-4 flex flex-col items-center w-full">
            <h1 className="text-2xl font-black uppercase text-slate-800 tracking-widest mb-6 border-b-2 border-slate-300 pb-2 w-full max-w-4xl">1. Start Trip</h1>

            {error && (
                <div className="bg-red-50 border border-red-300 text-red-800 p-4 rounded mb-4 w-full max-w-4xl">
                    <p className="font-bold">Failed to initiate trip</p>
                    <p className="text-sm">{error}</p>
                </div>
            )}

            <div className="bg-white p-8 rounded border max-w-4xl w-full mb-8 shadow-sm border-t-4 border-blue-600">
                <div className="grid grid-cols-2 gap-6 mb-6">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Trip ID</label>
                        <input type="text" className="border p-2 w-full rounded font-mono bg-slate-50" value="TRIP-B1-0226" disabled />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Vessel / Unit</label>
                        <select className="border p-2 w-full">
                            <option>Boat Faris</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-6 mb-6">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Date & Time Out</label>
                        <input type="datetime-local" className="border p-2 w-full rounded" defaultValue="2026-03-01T08:00" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Trip Goal/Zone</label>
                        <input type="text" className="border p-2 w-full rounded" placeholder="Zone C South" />
                    </div>
                </div>

                {/* Staff Roster Panel */}
                <div className="bg-blue-50 border border-blue-200 p-6 rounded mb-8 shadow-sm">
                    <h3 className="font-black text-blue-900 uppercase tracking-widest mb-4 flex items-center border-b border-blue-200 pb-2">
                        <Users className="w-5 h-5 mr-2" /> Session Staff Roster
                    </h3>
                    <table className="w-full text-left bg-white border border-slate-200 rounded overflow-hidden shadow-sm text-sm">
                        <thead>
                            <tr>
                                <th className="bg-blue-900 text-blue-100 p-2 font-bold uppercase tracking-wider text-xs">Name</th>
                                <th className="bg-blue-900 text-blue-100 p-2 font-bold uppercase tracking-wider text-xs">Role</th>
                                <th className="bg-blue-900 text-blue-100 p-2 font-bold uppercase tracking-wider text-xs text-right">Ext. Advance Bal</th>
                                <th className="bg-blue-900 text-blue-100 p-2 font-bold uppercase tracking-wider text-xs text-center w-12">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="border-t border-slate-100">
                                <td className="p-2">Pak Budi (ID-011)</td>
                                <td className="p-2">Captain / Shift Lead</td>
                                <td className="p-2 text-right text-red-600 font-mono">Rp 500,000</td>
                                <td className="p-2 text-center">
                                    <X className="w-4 h-4 text-red-500 cursor-pointer mx-auto hover:text-red-700" />
                                </td>
                            </tr>
                            <tr className="border-t border-slate-100 bg-slate-50">
                                <td className="p-2">Maman (ID-042)</td>
                                <td className="p-2">Crew / Employee</td>
                                <td className="p-2 text-right text-slate-400 font-mono">Rp 0</td>
                                <td className="p-2 text-center">
                                    <X className="w-4 h-4 text-red-500 cursor-pointer mx-auto hover:text-red-700" />
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {status === 'SUCCESS' ? (
                    <div className="bg-green-100 border border-green-400 text-green-800 font-bold uppercase p-4 rounded flex justify-center items-center">
                        <CheckCircle className="w-5 h-5 mr-2" /> MOCK TRIP INITIATED TO INBOX
                    </div>
                ) : (
                    <button
                        disabled={status === 'LOADING'}
                        onClick={handleStartTrip}
                        className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition flex items-center justify-center text-white font-bold w-full text-lg py-3 rounded"
                    >
                        {status === 'LOADING' ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Play className="w-5 h-5 mr-2" />}
                        {status === 'LOADING' ? 'INITIATING...' : 'INITIATE VESSEL TRIP'}
                    </button>
                )}
            </div>
        </div>
    );
};

export default TripStart;
