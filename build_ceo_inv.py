from builder_utils import screen, doc_header, doc_actions, a4_preview, freeze_checklist_screen

def get_ceo_inv_screens():
    screens = []

    # CEO COMMAND
    screens.append(screen("ceo_dash", "Executive Pulse",
        """
        <div class="grid grid-cols-4 gap-4 mb-4">
            <div class="bg-slate-900 border-slate-700 border p-4 shadow-xl"><h4 class="text-[0.6rem] uppercase tracking-widest text-slate-400 font-bold mb-1"><i data-lucide="activity" class="inline w-3 h-3 mr-1 text-emerald-400"></i> Active Core Units</h4><div class="text-3xl font-black font-mono text-white">42</div></div>
            <div class="bg-indigo-900 border-indigo-700 border p-4 shadow-xl"><h4 class="text-[0.6rem] uppercase tracking-widest text-indigo-300 font-bold mb-1"><i data-lucide="anchor" class="inline w-3 h-3 mr-1 text-blue-400"></i> Live Catch Tonnage (Today)</h4><div class="text-3xl font-black font-mono text-white">12.5T</div></div>
            <div class="bg-red-900 border-red-700 border p-4 shadow-xl"><h4 class="text-[0.6rem] uppercase tracking-widest text-red-300 font-bold mb-1"><i data-lucide="alert-triangle" class="inline w-3 h-3 mr-1 text-red-400 animate-pulse"></i> Level 1 Escalations</h4><div class="text-3xl font-black font-mono text-white">3</div></div>
            <div class="bg-emerald-900 border-emerald-700 border p-4 shadow-xl"><h4 class="text-[0.6rem] uppercase tracking-widest text-emerald-300 font-bold mb-1"><i data-lucide="pie-chart" class="inline w-3 h-3 mr-1 text-emerald-400"></i> Corporate Float (Total)</h4><div class="text-3xl font-black font-mono text-white">75B</div></div>
        </div>
        <div class="mt-8 bg-slate-800 p-6 rounded border border-slate-700 shadow-inner">
             <h3 class="font-black text-slate-300 uppercase tracking-widest text-sm mb-4 border-b border-slate-600 pb-2"><i data-lucide="cpu" class="inline text-purple-400 mr-2 w-4 h-4"></i> Shark AI Ops Summary</h3>
             <ul class="text-xs font-mono text-slate-400 space-y-2">
                <li>System running fully nominal. Processing 124 concurrent active sessions.</li>
                <li><span class="text-red-400 font-bold">[YIELD ALERT]</span> Kaimana Factory #2 producing fillets at 38% (Expected >43%). Flagging for review.</li>
                <li><span class="text-amber-400 font-bold">[FRAUD PROBABILITY]</span> Unusually high consecutive fuel expenses (Boat F-14). Triggering audit request to Loc Mgr.</li>
             </ul>
        </div>
        """,
        "Bird's-eye view across all layers. Summarizes AI findings."
    ))

    screens.append(screen("ceo_map", "Global Inventory Map",
        """
        <div class="bg-white p-6 border rounded shadow-md max-w-6xl font-mono text-xs">
             <table class="w-full border-collapse border border-slate-300 shadow">
                 <thead><tr class="bg-slate-900 text-white uppercase tracking-widest text-[0.6rem] font-bold"><th class="border border-slate-700 p-2 text-left">Location / Unit Level</th><th class="border border-slate-700 p-2 text-left text-blue-300">Total KG Volume</th><th class="border border-slate-700 p-2 text-right text-emerald-300">Est Master Val (Rp)</th><th class="border border-slate-700 p-2 text-center text-red-300 w-24">Risk / Spoil</th></tr></thead>
                 <tbody>
                     <tr class="bg-slate-100 hover:bg-white"><td class="border border-slate-200 p-2 font-bold text-slate-800 uppercase tracking-wide"><i data-lucide="map-pin" class="w-4 h-4 inline mr-2 text-slate-400"></i> Kaimana Hub (Aggregate)</td><td class="border border-slate-200 p-2 font-black text-blue-700 text-base">4,250.0</td><td class="border border-slate-200 p-2 text-right font-black text-emerald-700 text-lg shadow-inner">245,000,000</td><td class="border border-slate-200 p-2 text-center">Low</td></tr>
                     <tr class="bg-white hover:bg-slate-50"><td class="border border-slate-200 p-2 pl-12 text-slate-600 font-bold text-[0.6rem] uppercase tracking-widest">├─ CS Main Storage</td><td class="border border-slate-200 p-2 text-blue-600 font-bold">4,104.5</td><td class="border border-slate-200 p-2 text-right text-emerald-600 font-bold shadow-inner w-48">241,000,000</td><td class="border border-slate-200 p-2 text-center hidden-border"><span class="bg-red-100 text-red-700 px-2 py-0.5 rounded font-black shadow-sm">5.0 Waste</span></td></tr>
                     <tr class="bg-white hover:bg-slate-50"><td class="border border-slate-200 p-2 pl-12 text-slate-600 font-bold text-[0.6rem] uppercase tracking-widest">├─ Boat Faris (Trip B1) [Live]</td><td class="border border-slate-200 p-2 text-blue-600 font-bold">145.5</td><td class="border border-slate-200 p-2 text-right text-emerald-600 font-bold shadow-inner w-48">4,000,000</td><td class="border border-slate-200 p-2 text-center">Nominal</td></tr>
                 </tbody>
             </table>
        </div>
        """,
        "Maps every physical asset (stock) and estimated value recursively."
    ))

    screens.append(screen("ceo_yield", "Yield Anomalies", 
        """
        <div class="bg-white p-6 border rounded shadow max-w-5xl">
            <h3 class="font-bold border-b pb-2 mb-4 text-slate-800"><i data-lucide="alert-triangle" class="inline w-4 h-4 mr-2 text-red-500"></i> Statistical Norm Deviations</h3>
            <table class="w-full text-xs font-mono border text-left">
                <thead><tr class="bg-slate-100"><th>Batch ID</th><th>Location</th><th>Expected Yield</th><th>Actual Yield</th><th>Action</th></tr></thead>
                <tbody>
                    <tr><td class="p-2 border-b">BATCH-099</td><td class="p-2 border-b">Kaimana Fac 2</td><td class="p-2 border-b">45%</td><td class="p-2 border-b text-red-600 font-bold">38%</td><td class="p-2 border-b"><button class="bg-slate-800 text-white px-2 py-1 rounded">Investigate</button></td></tr>
                </tbody>
            </table>
        </div>
        """, "Powered by Shark AI history."))
    screens.append(screen("ceo_health", "Financial Health", 
        """
        <div class="bg-white p-6 border rounded shadow max-w-5xl">
            <h3 class="font-bold border-b pb-2 mb-4 text-slate-800"><i data-lucide="dollar-sign" class="inline w-4 h-4 mr-2 text-emerald-500"></i> Real-time P&L Estimate</h3>
            <div class="grid grid-cols-2 gap-4 text-sm font-mono">
                <div class="p-4 bg-emerald-50 border border-emerald-200 rounded"><div class="text-xs font-bold text-emerald-800">Total Revenue YTD</div><div class="text-xl font-black text-emerald-900 mt-1">Rp 4,500,000,000</div></div>
                <div class="p-4 bg-red-50 border border-red-200 rounded"><div class="text-xs font-bold text-red-800">Total Expenses YTD</div><div class="text-xl font-black text-red-900 mt-1">Rp 1,200,000,000</div></div>
            </div>
        </div>
        """, "Charts derived from global Ledger view."))
    screens.append(screen("ceo_risk", "Risk Dashboard", 
        """
        <div class="bg-white p-6 border rounded shadow max-w-5xl">
            <h3 class="font-bold border-b pb-2 mb-4 text-slate-800"><i data-lucide="shield" class="inline w-4 h-4 mr-2 text-amber-500"></i> Active Risks</h3>
            <div class="flex flex-col space-y-2 font-mono text-xs">
                <div class="p-3 bg-red-50 border border-red-200 rounded text-red-800 font-bold">Unapproved Expenses > 7 days: 5 items</div>
                <div class="p-3 bg-amber-50 border border-amber-200 rounded text-amber-800 font-bold">High Cash Float (>50M) on unconnected boats: Boat Faris</div>
            </div>
        </div>
        """, "Displays aging risks and float balances."))
    screens.append(screen("ceo_appr", "Approvals (Overrides)", 
        """
        <div class="bg-white p-6 border rounded shadow max-w-5xl">
            <h3 class="font-bold border-b pb-2 mb-4 text-slate-800"><i data-lucide="key" class="inline w-4 h-4 mr-2"></i> Policy Overrides</h3>
            <div class="font-mono text-xs mb-4 text-slate-600">The following documents have been blocked by Finance Policy but requested CEO override.</div>
            <table class="w-full text-xs font-mono border text-left">
                <thead><tr class="bg-slate-100"><th>Doc ID</th><th>Requested By</th><th>Amount</th><th>Policy Blocker</th><th>Action</th></tr></thead>
                <tbody>
                    <tr><td class="p-2 border-b">EXP-9921</td><td class="p-2 border-b">John (Loc Mgr)</td><td class="p-2 border-b">Rp 150M</td><td class="p-2 border-b">Exceeds limits</td><td class="p-2 border-b"><button class="bg-emerald-600 text-white px-2 py-1 rounded">Force Approve</button></td></tr>
                </tbody>
            </table>
        </div>
        """, "Unlocks specific documents blocked by Finance."))
    screens.append(screen("ceo_shark", "Ask Shark AI", "<div class='bg-slate-900 border-slate-700 p-6 rounded shadow max-w-4xl text-emerald-400 font-mono text-sm leading-relaxed border-t-8 border-t-purple-600 h-96'>OPS_SHARK_V4 ONLINE.<br>_ <span class='animate-pulse text-white'>_</span></div>", ""))

    screens.append(freeze_checklist_screen())

    # INVESTOR (READ-ONLY)
    screens.append(screen("inv_dash", "Investor Dashboard",
        """
        <div class="grid grid-cols-3 gap-6 mb-8">
            <div class="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 border p-6 shadow-2xl rounded"><h4 class="text-xs uppercase tracking-widest text-slate-300 font-bold mb-2">Total Managed Asset Val</h4><div class="text-4xl font-black font-mono text-white text-shadow-sm">Rp 128B</div></div>
            <div class="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 border p-6 shadow-2xl rounded"><h4 class="text-xs uppercase tracking-widest text-slate-300 font-bold mb-2">YTD Realized Rev</h4><div class="text-4xl font-black font-mono text-emerald-400 text-shadow-sm">Rp 42B</div></div>
            <div class="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 border p-6 shadow-2xl rounded"><h4 class="text-xs uppercase tracking-widest text-slate-300 font-bold mb-2">Active Field Ops</h4><div class="text-4xl font-black font-mono text-blue-400 text-shadow-sm">54 Nodes</div></div>
        </div>
        """,
        "High-level sanitized read-only metrics aggregated directly from immutable underlying datasets."
    ))

    screens.append(screen("inv_val", "Inventory Valuation", 
        """
        <div class="bg-white p-6 border rounded shadow max-w-5xl">
            <h3 class="font-bold border-b pb-2 mb-4 text-slate-800">Mark-to-Market Valuation</h3>
            <table class="w-full text-xs font-mono border text-left">
                <thead><tr class="bg-slate-100"><th>Facility</th><th>Total Stock (KG)</th><th>Est Current Value</th></tr></thead>
                <tbody>
                    <tr><td class="p-2 border-b border-r">Kaimana CS Main</td><td class="p-2 border-b border-r text-right">4,104.5</td><td class="p-2 border-b text-right font-bold text-emerald-700">Rp 241,000,000</td></tr>
                </tbody>
            </table>
        </div>
        """, "Grid displaying estimated MTM value of all cold storage."))
    screens.append(screen("inv_rev", "Revenue/Margin", 
        """
        <div class="bg-white p-6 border rounded shadow max-w-5xl">
            <h3 class="font-bold border-b pb-2 mb-4 text-slate-800">Commercial Sales Rollup</h3>
            <div class="h-32 bg-slate-50 border border-slate-200 rounded flex items-center justify-center text-slate-400 font-mono text-xs italic">[Bar chart visualization mapping Sales Invoices grouped by Hub over time placeholder]</div>
        </div>
        """, "Chart of Commercial Sales invoices grouped by Hub."))
    screens.append(screen("inv_risk", "Risk Summary", 
        """
        <div class="bg-white p-6 border rounded shadow max-w-5xl">
            <h3 class="font-bold border-b pb-2 mb-4 text-slate-800">Operational Risk Rollup</h3>
            <div class="grid grid-cols-2 gap-4 text-xs font-mono">
                <div class="p-4 bg-red-50 rounded border border-red-200"><div class="font-bold text-red-900 mb-1">Global Waste Ratio</div><div class="text-xl">4.2%</div><div class="mt-2 text-[0.6rem] text-red-600">Target < 2.0%</div></div>
                <div class="p-4 bg-amber-50 rounded border border-amber-200"><div class="font-bold text-amber-900 mb-1">Uncollected AR Ratio</div><div class="text-xl">12%</div><div class="mt-2 text-[0.6rem] text-amber-600">Target < 5%</div></div>
            </div>
        </div>
        """, "Summary of waste deductions & uncollected AR ratios."))

    return screens
