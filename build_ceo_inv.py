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

    screens.append(screen("ceo_yield", "Yield Anomalies", "<div class='bg-white p-6 border rounded shadow max-w-4xl text-slate-400 font-bold'>[Flags processing batches that fall outside statistical norm expectations. Powered by Shark AI history.]</div>", ""))
    screens.append(screen("ceo_health", "Financial Health", "<div class='bg-white p-6 border rounded shadow max-w-4xl text-slate-400 font-bold'>[Charts derived from global Ledger view. Real-time P&L estimates.]</div>", ""))
    screens.append(screen("ceo_risk", "Risk Dashboard", "<div class='bg-white p-6 border rounded shadow max-w-4xl text-slate-400 font-bold'>[Displays unapproved expenses > 7 days, aging AR > 30 days, high cash float balances on disconnected boats.]</div>", ""))
    screens.append(screen("ceo_appr", "Approvals (Overrides)", "<div class='bg-white p-6 border rounded shadow max-w-4xl text-slate-400 font-bold'>[Unlocks specific documents blocked by Finance Policy logic.]</div>", ""))
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

    screens.append(screen("inv_val", "Inventory Valuation", "<div class='bg-white p-6 border rounded shadow max-w-4xl text-slate-400 font-bold'>[Grid displaying estimated mark-to-market value of all cold storage.]</div>", ""))
    screens.append(screen("inv_rev", "Revenue/Margin", "<div class='bg-white p-6 border rounded shadow max-w-4xl text-slate-400 font-bold'>[Chart of Commercial Sales invoices grouped by Hub.]</div>", ""))
    screens.append(screen("inv_risk", "Risk Summary", "<div class='bg-white p-6 border rounded shadow max-w-4xl text-slate-400 font-bold'>[Summary of waste deductions & uncollected AR ratios.]</div>", ""))

    return screens
