import React from 'react';
import { Coins, X, Check, Save } from 'lucide-react';

const OpeningBalances: React.FC = () => {
    return (
        <div className="p-4 flex flex-col items-center w-full">
            <h1 className="text-2xl font-black uppercase text-slate-800 tracking-widest gap-4 flex items-center mb-6 border-b-2 border-slate-300 pb-2 w-full max-w-4xl">
                2. Opening Balances
            </h1>

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
                        <input type="number" className="w-full mt-1 border border-slate-300 p-1 text-right font-mono text-blue-700 font-bold" defaultValue="1500" />
                    </div>
                    <div className="bg-slate-50 p-3 rounded border border-slate-200">
                        <label className="text-[0.6rem] font-bold text-slate-500 uppercase">Ice Block Loading (Satuan)</label>
                        <input type="number" className="w-full mt-1 border border-slate-300 p-1 text-right font-mono text-cyan-600 font-bold" defaultValue="45" />
                    </div>
                </div>

                <h3 className="font-bold text-blue-900 mt-8 mb-4 border-b pb-2 uppercase tracking-widest text-xs">Trip Cash Wallet Declaration</h3>

                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-emerald-50 p-4 rounded border border-emerald-200">
                        <label className="text-[0.7rem] font-bold text-emerald-800 uppercase block mb-2">Physical Cash On Board</label>
                        <input type="number" className="w-full border border-emerald-300 p-2 text-right font-mono text-emerald-700 font-black text-xl" defaultValue="5000000" />
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
                                    <select className="w-full p-1 border">
                                        <option>Pak Budi</option>
                                        <option>Maman</option>
                                    </select>
                                </td>
                                <td className="p-2 border">
                                    <input type="text" className="w-full p-1 border" defaultValue="Weekly Food Advance" />
                                </td>
                                <td className="p-2 border">
                                    <input type="number" className="w-full p-1 border text-right font-mono text-red-600 font-bold" defaultValue="250000" />
                                </td>
                                <td className="p-2 border">
                                    <select className="w-full p-1 border text-xs bg-slate-50">
                                        <option>Session Wallet</option>
                                    </select>
                                </td>
                                <td className="p-2 border text-center align-middle">
                                    <X className="text-red-500 w-4 h-4 cursor-pointer inline-block" />
                                </td>
                            </tr>
                        </tbody>
                    </table>
                    <button className="mt-4 text-sm font-bold text-amber-700 hover:text-amber-900 flex items-center transition-colors">
                        + Add Advance Line
                    </button>
                </div>
            </div>

            {/* Document Action Panel Mock */}
            <div className="flex space-x-4 max-w-4xl w-full justify-end mt-4">
                <button className="px-6 py-2 bg-slate-100 border border-slate-300 text-slate-600 font-bold uppercase text-xs tracking-widest rounded shadow-[0_4px_14px_0_rgb(0,0,0,0.1)] transition hover:bg-white hover:text-slate-800 flex items-center">
                    <Save className="w-4 h-4 mr-2" /> Save Draft
                </button>
                <button className="px-8 py-3 bg-blue-600 text-white font-bold uppercase text-sm tracking-widest rounded shadow-[0_4px_14px_0_rgb(0,118,255,0.39)] hover:shadow-[0_6px_20px_rgba(0,118,255,0.23)] transition flex items-center">
                    <Check className="w-5 h-5 mr-2" /> Approve & Post
                </button>
            </div>
        </div>
    );
};

export default OpeningBalances;
