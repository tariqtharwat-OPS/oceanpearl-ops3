from builder_utils import screen, doc_header, doc_actions, a4_preview

def get_loc_fin_screens():
    screens = []

    # LOCATION MANAGER
    screens.append(screen("loc_dash", "Location Dashboard",
        """
        <div class="grid grid-cols-4 gap-4 mb-8">
            <div class="bg-blue-900 border-blue-700 border p-4 shadow-xl rounded"><h4 class="text-[0.6rem] uppercase tracking-widest text-blue-300 font-bold mb-1">Active Boats</h4><div class="text-3xl font-black text-white">4</div></div>
            <div class="bg-indigo-900 border-indigo-700 border p-4 shadow-xl rounded"><h4 class="text-[0.6rem] uppercase tracking-widest text-indigo-300 font-bold mb-1">Shifts Running</h4><div class="text-3xl font-black text-white">2</div></div>
            <div class="bg-emerald-900 border-emerald-700 border p-4 shadow-xl rounded"><h4 class="text-[0.6rem] uppercase tracking-widest text-emerald-300 font-bold mb-1">Unapproved Exp</h4><div class="text-3xl font-black text-white font-mono">1.2M</div></div>
            <div class="bg-amber-900 border-amber-700 border p-4 shadow-xl rounded"><h4 class="text-[0.6rem] uppercase tracking-widest text-amber-300 font-bold mb-1">Pending Pay Reqs</h4><div class="text-3xl font-black text-white">6</div></div>
        </div>
        """,
        "Aggregates truth from children nodes globally. Provides birds eye view."
    ))

    screens.append(screen("loc_app_exp", "Approve: Expenses",
        """
        <div class="bg-white p-6 border rounded shadow max-w-5xl">
            <table class="w-full inv-table shadow-sm border border-slate-300 rounded mb-4 text-xs font-mono">
                <thead><tr class="!bg-slate-800 text-slate-100"><th>Doc Ref</th><th>Unit Context</th><th class="text-right">Line Val</th><th class="text-center">Action</th></tr></thead>
                <tbody>
                     <tr><td>EXP-B1-0226</td><td class="font-bold text-blue-900">Boat Faris</td><td class="text-right text-red-600 font-bold">250,000</td><td class="text-center p-2"><button class="bg-emerald-500 text-white font-bold px-3 py-1 rounded shadow text-xs uppercase hover:bg-emerald-700">Approve</button></td></tr>
                     <tr><td>EXP-FAC-01</td><td class="font-bold text-indigo-900">Kaimana Main Flr</td><td class="text-right text-red-600 font-bold">150,000</td><td class="text-center p-2"><button class="bg-emerald-500 text-white font-bold px-3 py-1 rounded shadow text-xs uppercase hover:bg-emerald-700">Approve</button></td></tr>
                </tbody>
            </table>
        </div>
        """,
        "Transitions document state 'Draft' -> 'Posted'. Locked rows vanish from view."
    ))

    screens.append(screen("loc_app_trans", "Approve: Transfers",
        """
        <div class="bg-emerald-50 p-6 border border-emerald-200 shadow-sm max-w-5xl rounded">
            <p class="text-sm text-emerald-800 font-bold uppercase tracking-widest mb-4">Location Cash Clearing Queue</p>
             <table class="w-full inv-table shadow border border-emerald-300 rounded overflow-hidden">
                <thead><tr class="!bg-emerald-800 text-white"><th>Reference</th><th>From Wallet String</th><th>To Target Layer</th><th class="text-right w-1/4">Sweep Target</th><th class="text-center w-1/4">Confirmation</th></tr></thead>
                <tbody>
                    <tr><td class="bg-white text-xs font-mono">TRF-WALL-B1-0226</td><td class="bg-white font-bold text-slate-600 text-xs text-blue-800">TRIP WALLET [B1]</td><td class="bg-white font-bold text-slate-600 text-xs">Kaimana Hub Treasury</td><td class="bg-white font-mono text-emerald-600 text-lg font-black text-right pr-4">6,500,000</td><td class="bg-white p-2 text-center"><button class="bg-emerald-600 text-white text-xs uppercase font-bold py-1 px-4 rounded shadow-sm hover:shadow active:bg-emerald-800">Receive Cash</button></td></tr>
                </tbody>
            </table>
        </div>
        """,
        "Authorizes physical cash returning from field wallets. Inflates Kaimana Hub central treasury directly."
    ))

    screens.append(screen("loc_app_recv", "Review: Receivings", "<div class='bg-white p-6 border rounded shadow max-w-4xl text-slate-400 font-bold'>[Grid showing DO mismatches flagged at CS or Factory]</div>", ""))
    screens.append(screen("loc_perf", "Unit Performance Grid", "<div class='bg-white p-6 border rounded shadow max-w-4xl text-slate-400 font-bold'>[Read-only analytic rollups of yield % and fuel consumption metrics per Boat/Factory.]</div>", ""))
    
    screens.append(screen("loc_inv", "Location Inventory Master",
        """
        <div class="bg-white p-6 border rounded shadow max-w-5xl">
            <table class="w-full inv-table shadow-sm border border-slate-300 mb-4 font-mono text-xs">
                 <thead><tr class="!bg-slate-900 text-slate-100"><th>Location Hierarchy</th><th>SKU Tag</th><th class="text-right">Global Qty KG</th></tr></thead>
                 <tbody>
                     <tr><td class="text-cyan-800 font-bold border-l-4 border-cyan-500 pl-4 bg-cyan-50">Kaimana Hub / CS Main</td><td>Snapper Fillet A</td><td class="text-right font-black text-emerald-600 text-base shadow-inner bg-emerald-50">45.0</td></tr>
                     <tr><td class="text-blue-800 font-bold border-l-4 border-blue-500 pl-4 bg-blue-50">Kaimana Hub / Boat Faris</td><td>Red Snapper (Live)</td><td class="text-right font-black text-emerald-600 text-base shadow-inner bg-emerald-50">145.5</td></tr>
                 </tbody>
            </table>
        </div>
        """,
        "Sub-tree visual query of inventory aggregated across location boundaries."
    ))

    screens.append(screen("loc_wallet", "Location Wallets Master", "<div class='bg-white p-6 border rounded shadow max-w-4xl text-slate-400 font-bold'>[Tree view: Kaimana Hub Central -> Petty Cash + Factory Cash + Trip Cash B1 + Trip Cash B2]</div>", ""))
    screens.append(screen("loc_staff", "Unit Staff Assignment", "<div class='bg-white p-6 border rounded shadow max-w-4xl text-slate-400 font-bold'>[Moves People from Loc pool into Boat/Factory default roster templates.]</div>", ""))
    screens.append(screen("loc_ppl", "People Registry View", "<div class='bg-white p-6 border rounded shadow max-w-4xl text-slate-400 font-bold'>[Location filter applied to Global People Registry. Read-only]</div>", ""))
    screens.append(screen("loc_print", "Doc Center (Location)", "<div class='bg-white p-6 border rounded shadow max-w-4xl text-slate-400 font-bold'>[Search all Docs where Loc=Kaimana]</div>", ""))

    # FINANCE OFFICER
    screens.append(screen("fin_dash", "Finance Dashboard",
        """
        <div class="grid grid-cols-4 gap-4 mb-4">
            <div class="bg-emerald-900 border-emerald-700 border p-4 shadow-xl"><h4 class="text-[0.6rem] uppercase tracking-widest text-emerald-300 font-bold mb-1">Global AP Due</h4><div class="text-3xl font-black font-mono text-white">6.5M</div></div>
            <div class="bg-amber-900 border-amber-700 border p-4 shadow-xl"><h4 class="text-[0.6rem] uppercase tracking-widest text-amber-300 font-bold mb-1">Global AR Out</h4><div class="text-3xl font-black font-mono text-white">6.7M</div></div>
            <div class="bg-red-900 border-red-700 border p-4 shadow-xl"><h4 class="text-[0.6rem] uppercase tracking-widest text-red-300 font-bold mb-1">Advances (Emp)</h4><div class="text-3xl font-black font-mono text-white text-shadow">350K</div></div>
            <div class="bg-slate-900 border-slate-700 border p-4 shadow-xl"><h4 class="text-[0.6rem] uppercase tracking-widest text-slate-300 font-bold mb-1">Central Float</h4><div class="text-3xl font-black font-mono text-white">45M</div></div>
        </div>
        """,
        "Aggregates financial truth natively from unit operations."
    ))

    screens.append(screen("fin_wall", "Global Wallets Matrix",
        """
        <div class="bg-white p-6 border rounded shadow-md max-w-6xl">
            <h3 class="font-black text-slate-800 border-b-2 border-slate-800 pb-2 mb-4 uppercase tracking-widest text-sm flex items-center justify-between"><span><i data-lucide="layout-grid" class="w-5 h-5 mr-3 inline text-slate-500"></i> Corporate Treasury Topology</span><span class="text-xs font-mono bg-slate-100 text-slate-500 px-2 py-1 border rounded shadow-sm">Global Scope</span></h3>
            <table class="w-full inv-table shadow text-sm">
                <thead><tr class="!bg-slate-900 text-white font-mono"><th class="w-1/2">Entity / Node Structure</th><th class="text-right">Logical Balance IDR</th><th class="text-right">Action</th></tr></thead>
                <tbody>
                    <tr><td class="font-bold border-l-4 border-slate-800 bg-slate-100 pl-4 py-3"><i data-lucide="globe" class="inline w-4 h-4 mr-2 text-slate-400"></i> HQ Master Bank (BCA)</td><td class="text-right font-black font-mono text-xl text-emerald-800 bg-emerald-50 px-4">40,000,000</td><td class="p-2 text-right"><button class="text-xs bg-slate-300 hover:bg-slate-400 px-3 py-1 font-bold rounded shadow-inner uppercase tracking-widest text-slate-700">Trf Out <i data-lucide="chevron-down" class="inline w-3 h-3 ml-1"></i></button></td></tr>
                    <tr><td class="font-bold text-slate-600 border-l-4 border-amber-600 pl-8 bg-amber-50 py-2">├─ Kaimana Hub Treasury Node</td><td class="text-right font-bold font-mono text-emerald-700 bg-emerald-50 px-4">6,500,000</td><td class="p-1"></td></tr>
                    <tr><td class="font-mono text-xs text-slate-500 border-l-4 border-blue-600 pl-12 py-1">│ ├─ BOAT FARIS (Trip Wallet)</td><td class="text-right font-mono text-xs bg-emerald-50 px-4">0</td><td class="p-1"></td></tr>
                    <tr><td class="font-mono text-xs text-slate-500 border-l-4 border-cyan-600 pl-12 py-1">│ ├─ Kaimana CS Petty Cash</td><td class="text-right font-mono text-xs font-bold text-emerald-600 bg-emerald-50 px-4">400,000</td><td class="p-1"></td></tr>
                    <tr><td class="font-mono text-xs text-slate-500 border-l-4 border-indigo-600 pl-12 py-1">│ ├─ Factory Ops Cash</td><td class="text-right font-mono text-xs font-bold text-emerald-600 bg-emerald-50 px-4">2,350,000</td><td class="p-1"></td></tr>
                </tbody>
            </table>
        </div>
        """,
        "Moves money centrally down to hub location wallets. Global wallet tree representation."
    ))

    screens.append(screen("fin_ap", "AP Workflow & Runs",
        """
        <div class="bg-white p-6 border rounded shadow-md border-t-8 border-red-700 max-w-5xl">
             <h3 class="font-black text-red-900 border-b border-red-200 pb-2 mb-4 uppercase tracking-widest flex items-center justify-between text-sm"><span><i data-lucide="arrow-down-right" class="inline mr-2 text-red-600"></i> Global AP Obligations</span><span class="text-xs font-bold text-red-600 bg-red-100 px-3 py-1 rounded shadow-inner flex items-center"><i data-lucide="alert-circle" class="w-3 h-3 mr-1"></i> Action Required</span></h3>
             
             <!-- Bulk Select AP rows -->
             <div class="bg-slate-50 border border-slate-200 p-4 rounded mb-6">
                <table class="w-full inv-table shadow border border-red-300 text-xs font-mono">
                    <thead><tr class="!bg-red-900 text-white"><th><input type="checkbox"></th><th>Doc Request Link</th><th>Vendor Entity Target</th><th class="text-right">Approved Run Amount</th></tr></thead>
                    <tbody>
                        <tr><td class="bg-white"><input type="checkbox" checked></td><td class="bg-white font-bold text-slate-600 uppercase text-[0.6rem] tracking-widest">HQ-REQ-KAIMANA-04<br><span class="text-blue-600">RCV-BUY-099</span></td><td class="bg-white font-bold text-slate-800 uppercase tracking-widest text-xs">Pak Rudi (Fisherman)</td><td class="bg-white text-right font-black text-lg text-red-700 bg-red-50">6,500,000</td></tr>
                    </tbody>
                </table>
             </div>

             <!-- Bulk Settlement Context -->
             <div class="grid grid-cols-2 gap-6 bg-red-50 p-6 border border-red-200 rounded">
                 <div>
                     <label class="text-[0.6rem] font-bold text-red-800 uppercase tracking-widest block mb-2">Funding Source Wallet Target</label>
                     <select class="border p-2 w-full font-mono text-sm bg-white shadow-inner focus:outline-none"><option>HQ Master Bank (BCA) - [Bal: 40M]</option><option>Kaimana Hub Central Treasury - [Bal: 6.5M]</option></select>
                     <p class="mt-2 text-[0.6rem] text-slate-500 font-bold italic">Sweep funds digitally. Generates immutable ledger proof.</p>
                 </div>
                 <div class="flex flex-col items-end">
                     <span class="text-[0.6rem] uppercase tracking-widest font-black text-red-800 mb-1 border-b border-red-300 w-full text-right pb-1">Payment Run Authorization</span>
                     <span class="text-4xl font-black font-mono text-red-700 tracking-tighter w-full text-right block my-2 pr-4 bg-white border border-red-100 rounded shadow-inner">Rp 6,500,000</span>
                 </div>
             </div>
             
             <button class="bg-red-800 hover:bg-black text-white w-full py-4 text-xl tracking-widest mt-6 font-black rounded shadow-[0_8px_30px_rgb(0,0,0,0.12)] uppercase flex justify-center items-center relative z-10 transition-transform active:scale-[0.98] border border-red-950"><i data-lucide="lock" class="w-6 h-6 mr-3 text-red-300"></i> EXECUTE BATCH TRANSFER / SETTLE</button>
        </div>
        """,
        "Consumes AP rows created via Boat Receive processes. Slices corporate wallets directly globally decreasing AP load."
    ))

    screens.append(screen("fin_ar", "Receivables Log",
        """
        <div class="bg-amber-50 border border-amber-200 p-6 rounded shadow-sm mb-6 max-w-5xl">
            <h3 class="font-black text-amber-900 border-b border-amber-200 pb-2 mb-4 uppercase tracking-widest text-sm flex items-center justify-between"><span><i data-lucide="arrow-up-right" class="inline mr-2 text-amber-600"></i> Active Collection Boards (AR)</span><span class="text-xs bg-amber-200 text-amber-900 px-3 py-1 font-bold rounded shadow-inner">Corporate Wide</span></h3>
            <table class="w-full inv-table shadow-sm border border-amber-300 mb-6 text-sm">
                <thead><tr class="!bg-amber-900 text-white font-mono"><th>Invoice Ref</th><th>Debtor Master</th><th class="text-right">Outstanding (Rp)</th><th class="text-center w-48">Banking Action / Recv</th></tr></thead>
                <tbody>
                    <tr><td class="font-mono text-slate-600 bg-white">INV-CS-001</td><td class="font-bold bg-white text-slate-800 uppercase tracking-widest text-xs">Jakarta Seafood Hub</td><td class="bg-white text-right font-mono text-emerald-700 font-bold bg-emerald-50 text-lg">6,750,000</td><td class="bg-white text-center p-2"><button class="bg-amber-500 text-white font-bold py-1 px-4 text-xs uppercase shadow rounded hover:bg-amber-600 w-full">Record Deposit <i data-lucide="chevron-right" class="w-3 h-3 inline"></i></button></td></tr>
                </tbody>
            </table>
        </div>
        """,
        "Maps collections against Commercial invoices posted in CS. Clicking 'Deposit' displays a modal to determine which Wallet the funds landed into."
    ))

    screens.append(screen("fin_crew", "Advances (Kasbon) Monitor",
        """
        <div class="bg-purple-50 border border-purple-200 p-6 shadow rounded shadow border-t-8 border-purple-500 max-w-5xl">
            <p class="text-sm text-purple-800 font-bold uppercase tracking-widest mb-4 border-b border-purple-200 pb-2"><i data-lucide="users" class="w-4 h-4 mr-2 inline text-purple-600"></i> Corporate Payroll / Advance Overview</p>
             <table class="w-full inv-table shadow border border-purple-300 rounded text-xs font-mono">
                <thead><tr class="!bg-purple-900 text-purple-100"><th>Worker Ref</th><th>Node Group</th><th class="text-right">Historical Outstanding Advances (Rp)</th></tr></thead>
                <tbody>
                    <tr><td class="bg-white font-bold text-slate-800 text-sm">Pak Budi</td><td class="bg-white uppercase tracking-widest text-slate-500 font-bold">Boat Captains</td><td class="bg-white text-right text-red-600 text-xl font-black bg-red-50 p-2 shadow-inner">250,000</td></tr>
                     <tr><td class="bg-white font-bold text-slate-800 text-sm">Maman</td><td class="bg-white uppercase tracking-widest text-slate-500 font-bold">Boat Crew</td><td class="bg-white text-right text-red-600 text-base font-bold bg-red-50 p-2">100,000</td></tr>
                </tbody>
            </table>
        </div>
        """,
        "Read-only consolidated view of all outstanding Staff balances."
    ))

    screens.append(screen("fin_ledger", "Global Master Ledger View",
        """
        <div class="bg-white p-6 border rounded shadow max-w-6xl font-mono text-xs text-slate-600 border-l-8 border-slate-800">
             <h3 class="font-black text-slate-800 border-b-2 border-slate-300 pb-2 mb-4 uppercase tracking-widest text-sm flex items-center "><i data-lucide="book-open" class="inline mr-2 text-slate-500 h-5 w-5"></i> Immutable Universal Ledger Log</h3>
             <table class="w-full border-collapse border border-slate-300 shadow">
                 <thead><tr class="bg-slate-200 text-slate-700 uppercase tracking-widest text-[0.6rem] font-bold"><th class="border border-slate-300 p-2 text-left">Timestamp (UTC)</th><th class="border border-slate-300 p-2 text-left">Source Document ID</th><th class="border border-slate-300 p-2 text-left">Account Label (Chart of Acc)</th><th class="border border-slate-300 p-2 text-right text-emerald-800">Debit (Dr) (+)</th><th class="border border-slate-300 p-2 text-right text-red-800">Credit (Cr) (-)</th></tr></thead>
                 <tbody>
                     <tr class="bg-white hover:bg-slate-50"><td class="border border-slate-200 p-2 bg-slate-50">2026-03-01T08:15Z</td><td class="border border-slate-200 p-2 font-bold text-slate-800 bg-slate-100 uppercase text-[0.6rem] tracking-widest">TRF-WALL-B1-0226</td><td class="border border-slate-200 p-2 text-blue-800 font-bold">Cash - Kaimana Hub Treasury</td><td class="border border-slate-200 p-2 text-right font-black text-emerald-600 shadow-inner w-32 tracking-wider">6,500,000</td><td class="border border-slate-200 p-2 text-right"></td></tr>
                     <tr class="bg-white hover:bg-slate-50"><td class="border border-slate-200 p-2 bg-slate-50">2026-03-01T08:15Z</td><td class="border border-slate-200 p-2 font-bold text-slate-800 bg-slate-100 uppercase text-[0.6rem] tracking-widest border-t-0 text-transparent">TRF-WALL-B1-0226</td><td class="border border-slate-200 p-2 text-slate-500 pl-8 font-bold text-[0.6rem] uppercase tracking-wide">Cash - Trip Wallet B1</td><td class="border border-slate-200 p-2 text-right"></td><td class="border border-slate-200 p-2 text-right font-black text-red-600 shadow-inner w-32 tracking-wider">6,500,000</td></tr>
                 </tbody>
             </table>
        </div>
        """,
        "Double-entry raw immutable log representation visually. Dr Cash, Cr Revenue mappings display here mapped by Timestamp and source Doc ID."
    ))

    screens.append(screen("fin_recon", "Bank Recon", "<div class='bg-white p-6 border rounded shadow max-w-4xl text-slate-400 font-bold'>[Reconciliation logic vs uploaded CSV.]</div>", ""))
    screens.append(screen("fin_pol", "Policy Monitor", "<div class='bg-white p-6 border rounded shadow max-w-4xl text-slate-400 font-bold'>[Rules engine output: e.g. Flag expenses > 5M]</div>", ""))
    screens.append(screen("fin_rep", "Reports Export", "<div class='bg-white p-6 border rounded shadow max-w-4xl text-slate-400 font-bold'>[Excel/PDF generator for Balance Sheet / P&L based on Ledger.]</div>", ""))
    screens.append(screen("fin_print", "Print Center (Docs)", "<div class='bg-white p-6 border text-slate-500 text-center font-bold py-24 bg-slate-50 border-dashed border-4'>[Search Doc ID to inject A4 Print Template -> window.print()]</div>", ""))

    return screens

