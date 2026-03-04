from builder_utils import screen, doc_header, doc_actions, a4_preview, staff_roster_panel, advance_paid_grid

def get_factory_screens():
    screens = []
    
    screens.append(screen("fac_start", "1. Start Shift / Batch",
        """
        <div class="bg-white p-8 rounded border max-w-4xl mb-8 shadow-sm border-t-4 border-indigo-600">
            <div class="grid grid-cols-2 gap-6 mb-6"><div><label class="block text-xs font-bold text-slate-500 mb-1">Shift / Batch ID</label><input class="border p-2 w-full rounded font-mono bg-slate-50" value="SHF-FAC-0226" disabled></div><div><label class="block text-xs font-bold text-slate-500 mb-1">Facility Target</label><select class="border p-2 w-full"><option>Kaimana Main Flr</option></select></div></div>
            <div class="grid grid-cols-2 gap-6 mb-6"><div><label class="block text-xs font-bold text-slate-500 mb-1">Date & Time Target</label><input type="datetime-local" class="border p-2 w-full rounded" value="2026-03-01T08:00"></div><div><label class="block text-xs font-bold text-slate-500 mb-1">Lead Supervisor</label><input type="text" class="border p-2 w-full rounded font-bold" value="Mandor Rudi"></div></div>
            """ + staff_roster_panel().replace("bg-blue-50", "bg-indigo-50").replace("blue-900", "indigo-900").replace("blue-200", "indigo-200").replace("Captain", "Supervisor").replace("Boat Faris", "Fac") + """
            <button class="bg-indigo-600 hover:bg-indigo-700 text-white font-bold w-full text-lg py-3 rounded shadow"><i data-lucide="play" class="w-5 h-5 mr-2 inline"></i> OPEN FACTORY SHIFT</button>
        </div>
        """,
        "Locks down the context bounds for this factory session. Ensures staff assigned matches system people registry."
    ))

    screens.append(screen("fac_init", "2. Factory Opening Checks",
        doc_header("INIT-FAC", "Draft") + 
        """
        <div class="bg-white p-6 rounded border mb-8 max-w-4xl border-t-4 border-indigo-600">
            <h3 class="font-bold text-indigo-900 mb-4 border-b pb-2 uppercase tracking-widest text-xs">Floor Consumables & Cash Handover</h3>
            <div class="grid grid-cols-2 gap-y-4 gap-x-6">
                <div class="bg-slate-50 p-3 rounded border border-slate-200"><label class="block text-[0.6rem] font-bold text-slate-500 uppercase">Ice Reserves (KG)</label><input type="number" class="border p-2 w-full rounded font-mono text-cyan-700 font-bold" value="1200"></div>
                <div class="bg-slate-50 p-3 rounded border border-slate-200"><label class="block text-[0.6rem] font-bold text-slate-500 uppercase">Empty Boxes (Satuan)</label><input type="number" class="border p-2 w-full rounded font-mono text-slate-600 font-bold" value="80"></div>
                <div class="bg-emerald-50 p-4 border border-emerald-200 col-span-2 mt-4 rounded shadow-sm"><label class="block text-[0.6rem] font-bold text-emerald-800 uppercase mb-2">Ops Cash Target Wal Bal (Handover)</label><input type="number" class="w-1/2 border-emerald-300 p-2 rounded text-right font-mono text-emerald-700 font-black text-xl bg-white shadow-inner" value="2500000"></div>
            </div>
            """ + advance_paid_grid() + """
        </div>
        """,
        "Logs physical consumables. Validates opening operational cash limits. Assigns and records advances natively within the shift UI context."
    ))

    screens.append(screen("fac_exp", "3. Factory Expenses",
        doc_header("EXP-FAC-01", "Draft") + 
        """
        <div class="bg-white p-6 rounded shadow-sm mb-8 border-l-4 border-yellow-400 max-w-5xl">
            <h3 class="uppercase font-black text-slate-400 text-sm tracking-widest mb-4">Factory Ops Voucher</h3>
            <div class="grid grid-cols-3 gap-4 mb-4">
                <div><label class="text-xs font-bold text-slate-500 block">Vendor</label><select class="border p-2 w-full"><option>Local PLN Agent (Token)</option><option>Crew/Employee Payment</option></select></div>
                <div><label class="text-xs font-bold text-slate-500 block">Current Wallet</label><select class="border p-2 w-full bg-slate-50 font-mono text-sm"><option>FAC OPS CASH [Bal: 2.25M]</option></select></div>
            </div>
            
            <table class="w-full inv-table shadow-sm border mb-4">
                <thead><tr><th>Expense Type (Cat)</th><th>Line Item Notes</th><th class="text-right">Line Total</th><th></th></tr></thead>
                <tbody>
                    <tr>
                         <td class="w-1/4 align-top"><select class="border p-1 w-full text-xs font-bold"><option>Electricity (PLN)</option><option>+ Add New Expense Type</option></select></td>
                         <td class="w-1/2 p-2 align-top bg-slate-50"><input type="text" class="border p-1 w-full text-xs" value="Token Listrik Sift Pagi"></td>
                         <td class="w-1/6 align-top pt-3"><input type="number" class="w-full border p-1 text-right font-bold text-red-600 font-mono" value="150000"></td>
                         <td class="align-top pt-3 text-center"><i data-lucide="x" class="text-red-500 w-4 h-4 cursor-pointer"></i></td>
                    </tr>
                </tbody>
            </table>
            <button class="text-sm font-bold text-indigo-600 flex items-center mb-6">+ Add Doc Line</button>

            <div class="flex justify-end"><div class="total-box w-64 text-right"><div class="flex justify-between font-black text-2xl text-slate-800 border-b pb-2 mb-2"><span class="text-sm">TOTAL</span><span class="font-mono">150,000</span></div></div></div>
            """ + doc_actions() + """
        </div>
        """,
        "Maps immediately to 'FAC OPS CASH'. Ensures operator provides explanation."
    ))

    screens.append(screen("fac_recv", "4. Internal Inbound Receiving",
        doc_header("RCV-TRF-01", "Draft") + 
        """
        <div class="bg-indigo-50 border border-indigo-200 p-6 shadow-sm mb-6 max-w-5xl rounded">
            <h3 class="font-black text-indigo-900 border-b border-indigo-200 pb-2 mb-4 uppercase tracking-widest flex items-center"><i data-lucide="download" class="w-5 h-5 mr-2"></i> Receive Raw Materials</h3>
             <table class="w-full inv-table rounded bg-white shadow mb-6">
                <thead><tr class="!bg-indigo-900 !text-white"><th>Source Document ID</th><th>Originating Unit</th><th class="text-right">Expected Vol</th><th class="text-center">Acknowledge Receipts (KG)</th></tr></thead>
                <tbody>
                    <tr>
                        <td class="font-mono text-slate-700 bg-white">DO-BOAT-TRF-099</td>
                        <td class="font-bold uppercase tracking-widest text-xs bg-white text-indigo-800">Boat Faris (TRIP-B1)</td>
                        <td class="text-right font-mono text-slate-500 bg-white">120.5 KG</td>
                        <td class="bg-white px-8"><input type="number" class="border-2 border-emerald-400 p-2 w-full text-right font-black font-mono text-xl shadow-inner text-emerald-700" value="120.5"></td>
                    </tr>
                </tbody>
            </table>
            <div id="mismatch_alert" class="hidden bg-red-50 border-l-4 border-red-500 p-4 mb-4 text-red-700 font-bold text-sm shadow-sm">
                Warning: Receiving short limits flagged! 120.0 received vs 120.5 expected. Justification REQUIRED.
            </div>
            """ + doc_actions() + """
        </div>
        """,
        "Direct fulfillment of a transfer document. Moves inventory quantity into 'Kaimana Main Flr' node. Validation triggered upon mismatch forcing operator explanation."
    ))

    screens.append(screen("fac_proc", "5. Processing Batch Output Matrix",
        doc_header("PRC-BAT-0226", "Draft") + 
        """
        <div class="bg-white border rounded shadow-md border-t-8 border-purple-600 max-w-6xl p-6 mb-8">
            <h3 class="font-black text-purple-900 mb-6 uppercase tracking-widest text-xl flex items-center"><i data-lucide="scissors" class="w-6 h-6 mr-3"></i> Yield Extraction Event</h3>
            
            <div class="grid grid-cols-2 gap-8 mb-8">
                <div class="bg-slate-50 border p-4 rounded shadow-inner border-slate-300">
                    <h4 class="font-black text-slate-500 uppercase tracking-widest text-xs mb-3 border-b-2 border-slate-300 pb-2">Step 1: Raw Stock Drawdown (-)</h4>
                    <table class="w-full text-sm mb-4">
                        <tr class="border-b font-bold"><td class="py-2 text-slate-600">Species/SKU</td><td class="py-2 text-right text-slate-600">Draw KG</td></tr>
                        <tr><td class="py-2"><select class="w-full p-1 border text-xs font-bold text-purple-900 shadow-sm"><option>Snapper Whole [Avail: 120.5]</option></select></td><td class="py-2 pl-2"><input type="number" class="w-full p-1 border text-right font-mono font-black text-red-600 bg-red-50" value="100.0"></td></tr>
                    </table>
                    <button class="text-xs font-bold text-purple-600 flex items-center">+ Add Input Source</button>
                    <div class="mt-4 pt-3 border-t text-right font-black font-mono text-xl text-slate-800">Input: 100.0 KG</div>
                </div>

                <div class="bg-emerald-50 border border-emerald-200 p-4 rounded shadow-md border-t-4 border-t-emerald-500">
                     <h4 class="font-black text-emerald-800 uppercase tracking-widest text-xs mb-3 border-b-2 border-emerald-300 pb-2 text-shadow">Step 2: Clean Finished Target (+)</h4>
                     <table class="w-full text-sm mb-4">
                        <tr class="border-b border-emerald-200 font-bold"><td class="py-2 text-emerald-800">Final SKU Spec</td><td class="py-2 text-right text-emerald-800">Net Target KG</td></tr>
                        <tr><td class="py-2"><select class="w-full p-1 border text-xs font-bold bg-white text-emerald-900 shadow-sm"><option>Snapper Fillet A</option></select></td><td class="py-2 pl-2"><input type="number" class="w-full p-1 border text-right font-mono font-black text-emerald-600" value="45.0"></td></tr>
                    </table>
                    <button class="text-xs font-bold text-emerald-600 flex items-center">+ Add Product Cut</button>
                    <div class="mt-4 pt-3 border-t border-emerald-300 text-right font-black font-mono text-xl text-emerald-900">Output: 45.0 KG</div>
                </div>
            </div>

             <div class="bg-red-50 p-4 rounded border border-red-200 shadow-inner mb-6">
                 <div class="flex justify-between items-center"><div class="font-bold text-red-900 uppercase text-xs tracking-widest">Step 3: Document Shrink/Waste</div><div class="font-mono text-sm bg-red-100 px-3 py-1 font-bold text-red-900 shadow-sm border border-red-300">(100.0 In - 45.0 Out = 55.0 KG Missing)</div></div>
                 <table class="w-full text-sm border-t border-red-200 mt-2">
                     <tbody><tr><td class="py-2 pr-2 w-1/3"><select class="w-full p-2 border font-bold text-amber-800"><option>Byproduct: Fish Heads</option></select></td><td class="py-2 w-1/3"><input type="number" class="w-full p-2 border text-right font-mono text-amber-600 font-bold" value="15.0"></td></tr><tr><td class="py-2 pr-2 font-bold text-slate-500 text-right text-xs uppercase pt-4">Untracked Pure Waste & Sludge Delta:</td><td class="py-2 pt-4"><input type="text" class="w-full p-2 border text-right font-mono text-red-700 bg-red-100 font-black shadow-inner" value="40.0" disabled></td></tr></tbody>
                 </table>
             </div>
             
             <div class="bg-purple-900 p-4 rounded text-purple-200 font-mono text-xs flex justify-between items-center shadow-lg uppercase tracking-widest border border-purple-600">
                 <div><i data-lucide="cpu" class="inline w-4 h-4 mr-2"></i>Yield Extraction: <span class="text-white font-black text-lg ml-1 bg-purple-950 px-2 py-0.5 rounded border border-purple-800 shadow-inner">45.0%</span></div>
                 <div class="text-emerald-400 font-bold text-shadow">(Passing bounds. Hist. Avg: ~43%)</div>
             </div>
             
            """ + doc_actions() + """
        </div>
        """,
        "Handles simultaneous multi-leg inventory transformation. Deducts raw weights. Increments final SKU and Byproduct weights. Auto-calculates system waste."
    ))

    screens.append(screen("fac_transfer", "6. Transfer Out (To Loc / CS)",
        doc_header("DO-FAC-TRF-02", "Draft") + 
        """
        <div class="bg-white p-6 border rounded shadow-sm border-t-8 border-indigo-500 max-w-5xl mb-6">
            <h3 class="font-black text-indigo-900 border-b border-indigo-200 pb-2 mb-4 uppercase tracking-widest"><i data-lucide="truck" class="w-5 h-5 inline mr-2 text-indigo-600"></i> Dispatch Finished Goods Outbound</h3>
            <div class="bg-slate-50 p-4 border rounded mb-6 w-1/2">
                <label class="text-xs font-bold text-slate-500 block mb-1">Destination Target Unit Node</label>
                <select class="border p-2 w-full text-sm font-bold shadow-sm font-mono"><option>Cold Storage (Kaimana Main)</option></select>
            </div>
            <table class="w-full inv-table shadow border border-indigo-300 rounded overflow-hidden">
                <thead><tr class="!bg-indigo-900"><th class="!text-white">Internal Finished SKU [Live Fac Bal]</th><th class="!text-white text-right">Dispatch Target Qty (KG)</th></tr></thead>
                <tbody>
                    <tr><td class="bg-white"><select class="border p-2 w-full text-xs font-bold font-mono"><option>Snapper Fillet A [Bal: 45.0]</option></select></td><td class="bg-white"><input type="number" class="border p-2 w-full text-right font-black font-mono text-xl text-indigo-700 bg-indigo-50" value="45.0"></td></tr>
                </tbody>
            </table>
             <button class="text-sm font-bold text-indigo-600 flex items-center mt-4 mb-4">+ Add SKU Box</button>
            """ + doc_actions() + """
        </div>
        """,
        "Subtracts Factory inventory immediately upon 'Post'. The target Cold Storage unit receives a pending Reception notice."
    ))

    screens.append(screen("fac_wallet", "7. Wallet Sub-View", 
        """
        <div class="bg-white p-6 border rounded shadow max-w-5xl border-t-8 border-indigo-900">
            <h3 class="font-bold border-b pb-2 mb-4 text-slate-800"><i data-lucide="wallet" class="inline w-4 h-4 mr-2 text-indigo-600"></i> Factory Petty Cash</h3>
            <div class="grid grid-cols-2 gap-4 text-sm font-mono mb-6">
                <div class="p-4 bg-indigo-50 border border-indigo-200 rounded"><div class="text-xs font-bold text-indigo-800">Available Float</div><div class="text-xl font-black text-indigo-900 mt-1">Rp 12,500,000</div></div>
                <div class="p-4 bg-red-50 border border-red-200 rounded"><div class="text-xs font-bold text-red-800">Total Shift Expenses</div><div class="text-xl font-black text-red-900 mt-1">Rp 500,000</div></div>
            </div>
            <table class="w-full text-xs font-mono border text-left">
                <thead><tr class="bg-slate-100"><th>Time</th><th>Txn ID</th><th>Type</th><th>Amount</th><th>Running Balance</th></tr></thead>
                <tbody>
                    <tr><td class="p-2 border-b text-slate-500">08:00</td><td class="p-2 border-b">TX-4</td><td class="p-2 border-b">Float Receipt</td><td class="p-2 border-b text-emerald-600">+ Rp 13,000,000</td><td class="p-2 border-b font-bold">13,000,000</td></tr>
                    <tr><td class="p-2 border-b text-slate-500">14:00</td><td class="p-2 border-b">TX-5</td><td class="p-2 border-b">Op Expense</td><td class="p-2 border-b text-red-600">- Rp 500,000</td><td class="p-2 border-b font-bold">12,500,000</td></tr>
                </tbody>
            </table>
        </div>
        """, "Mirror of Boat Wallet sweeps but context bound to FACTORY_CASH."))
    
    screens.append(screen("fac_close", "8. Close Shift",
         """
        <div class="bg-white p-6 border-t-8 border-slate-900 rounded shadow-2xl max-w-5xl mb-12 relative overflow-hidden">
            <h1 class="text-4xl font-black uppercase text-slate-900 tracking-tight mb-2">Factory Session Audit</h1>
            <p class="text-slate-500 text-sm mb-8 font-mono tracking-widest bg-slate-100 inline-block px-3 py-1 rounded">SHF-FAC-0226</p>

            <div class="grid grid-cols-2 gap-6 text-left mb-8">
                <div class="bg-slate-50 border p-6 font-mono text-sm leading-relaxed rounded border-t-4 border-t-indigo-500">
                    <span class="text-slate-500 font-bold uppercase block mb-2 border-b-2 border-slate-200 pb-1 text-xs">Gross Material Yield</span>
                    <div class="flex justify-between mb-1"><span class="text-slate-400">Batches Run:</span> <span class="font-black text-slate-700">1</span></div>
                    <div class="flex justify-between font-bold text-indigo-800 border-t border-indigo-100 pt-2"><span class="uppercase">Overall Shift Output:</span> <span>45.0 KG (45%)</span></div>
                </div>
                <div class="border p-6 font-mono text-sm rounded bg-emerald-50 border-emerald-200 border-t-4 border-t-emerald-500 flex flex-col justify-center items-center">
                    <span class="text-emerald-800 font-bold uppercase block mb-2 border-b-2 border-emerald-200 pb-1 w-full text-center tracking-widest text-[0.6rem]">Physical Treasury Box Delta</span>
                    <div class="text-4xl font-black tracking-tighter text-emerald-700 mt-2">Rp 2,350,000</div>
                    <div class="text-xs text-red-500 mt-2 block font-bold">-150,000 Exp Drawdown</div>
                </div>
            </div>

             <div class="mt-8 bg-orange-50 p-6 rounded border border-orange-200 shadow-inner">
                <h3 class="font-black text-orange-900 border-b border-orange-300 pb-2 mb-4 uppercase tracking-widest text-sm text-shadow">Shift Handover & Balances</h3>
                <p class="text-[0.6rem] text-orange-800 mb-4 font-bold uppercase tracking-widest">Calculates if internal advances override earned end-of-shift piecerate wages.</p>
                <table class="w-full inv-table rounded overflow-hidden shadow-sm">
                    <thead><tr class="!bg-orange-900 !text-orange-100"><th>Worker Ref</th><th class="text-right">Draw (Owed)</th><th class="text-right">Shift Earned</th><th class="text-right">Net Settle Action</th></tr></thead>
                    <tbody>
                        <tr><td class="font-bold border-l border-white bg-white">Pak Budi</td><td class="text-right text-red-600 font-mono bg-red-50">250,000</td><td class="text-right text-emerald-600 font-mono">0</td><td class="text-right bg-white"><span class="text-red-600 font-mono font-bold text-sm bg-red-50 border border-red-200 px-2 py-0.5 rounded shadow-sm">OWES 250,000 CFWD</span></td></tr>
                    </tbody>
                </table>
            </div>

            <button class="bg-indigo-900 hover:bg-black text-white w-full py-5 text-xl tracking-widest mt-8 font-black rounded shadow-lg flex justify-center items-center relative z-10 transition-transform active:scale-[0.98]"><i data-lucide="lock" class="w-6 h-6 mr-3 text-indigo-300"></i> HANDOVER SHIFT KEYS</button>
        </div>
        """ + a4_preview("FACTORY SESSION AUDIT", "<table class='w-full text-left text-xs font-mono border-collapse'><thead><tr class='bg-slate-100 border-b border-slate-300'><th>Metrics & End of Shift Handover</th><th class='text-right'>Value</th></tr></thead><tbody><tr><td class='border-b py-2'>Processed Yield Est.</td><td class='border-b py-2 text-right'>45% (Nominal)</td></tr><tr><td class='border-b py-2'>Total Op Expenditure</td><td class='border-b py-2 text-right'>Rp 500,000</td></tr><tr><td class='py-2 font-black text-indigo-800'>Physical Vault Handover</td><td class='py-2 text-right font-black text-emerald-700'>Rp 12,500,000</td></tr></tbody></table>", ["Shift Mandor", "Location Cashier"]),
        "Validates cash box balances. Enforces piece-rate or advance settlements for factory workers. Previews printed handover sheet."
    ))

    screens.append(screen("fac_docs", "My Documents", "<div class='bg-white p-6 border rounded shadow-sm text-center text-indigo-900 border-indigo-100 bg-indigo-50 font-mono'>READ-ONLY SEARCH: All Docs matching active Factory.</div>", ""))
    screens.append(screen("fac_print", "Print Center", 
        """
        <div class="bg-slate-50 border-4 border-dashed border-slate-300 p-12 text-center rounded-xl max-w-4xl mx-auto mt-8">
            <i data-lucide="printer" class="w-16 h-16 text-slate-400 mx-auto mb-4"></i>
            <h3 class="text-xl font-black text-slate-700 mb-2">A4 Document Injection Engine</h3>
            <p class="text-slate-500 font-mono text-sm mb-6 max-w-md mx-auto">Enter a specific Document ID to compile and render its immutable state into a printable format.</p>
            <div class="flex max-w-sm mx-auto shadow-lg">
                <input type="text" placeholder="DOC-..." class="flex-1 border-y border-l rounded-l px-4 py-2 font-mono outline-none focus:border-indigo-500">
                <button class="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-r font-bold uppercase tracking-widest text-xs transition">Preview</button>
            </div>
        </div>
        """, "Search Doc ID to inject A4 Print Template -> window.print()"))

    return screens

