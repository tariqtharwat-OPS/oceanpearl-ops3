from builder_utils import screen, doc_header, doc_actions, a4_preview

def get_admin_shark_screens():
    screens = []

    # SYSTEM ADMIN
    screens.append(screen("adm_usr", "User Management",
        """
        <div class="bg-white p-6 border rounded shadow-md max-w-5xl text-sm font-mono border-t-8 border-fuchsia-800">
             <h3 class="font-black text-fuchsia-900 border-b border-fuchsia-200 pb-2 mb-4 uppercase tracking-widest text-sm flex items-center justify-between"><i data-lucide="users" class="w-5 h-5 mr-3 inline text-fuchsia-600"></i> Corporate Access Control Registry</h3>
             <table class="w-full border-collapse border border-fuchsia-200 shadow">
                 <thead><tr class="bg-fuchsia-900 text-fuchsia-100 uppercase tracking-widest text-[0.6rem] font-bold"><th class="border border-fuchsia-700 p-2 text-left">Internal Name</th><th class="border border-fuchsia-700 p-2 text-left">Login Email / Auth ID</th><th class="border border-fuchsia-700 p-2 text-center text-amber-300">Base Role Matrix Level</th><th class="border border-fuchsia-700 p-2 text-center">Node Bound Restrict</th><th class="border border-fuchsia-700 p-2 text-right">Settings</th></tr></thead>
                 <tbody>
                     <tr class="bg-white hover:bg-fuchsia-50"><td class="border border-fuchsia-100 p-2 font-bold text-fuchsia-900">John Doe</td><td class="border border-fuchsia-100 p-2 text-slate-500 text-xs">john.d@ops3.internal</td><td class="border border-fuchsia-100 p-2 text-center font-bold text-amber-600 bg-amber-50">role_locationmgr</td><td class="border border-fuchsia-100 p-2 text-center text-xs tracking-widest font-black text-blue-800 bg-blue-50">Kaimana Hub</td><td class="border border-fuchsia-100 p-2 text-right"><i data-lucide="settings" class="inline text-slate-400 w-4 h-4 cursor-pointer"></i></td></tr>
                     <tr class="bg-white hover:bg-fuchsia-50"><td class="border border-fuchsia-100 p-2 font-bold text-fuchsia-900">Budi</td><td class="border border-fuchsia-100 p-2 text-slate-500 text-xs">budi@ops3.boat</td><td class="border border-fuchsia-100 p-2 text-center font-bold text-slate-600">role_boat</td><td class="border border-fuchsia-100 p-2 text-center text-xs tracking-widest font-black text-indigo-800 bg-indigo-50">Boat Faris</td><td class="border border-fuchsia-100 p-2 text-right text-red-400"><i data-lucide="lock" class="inline w-4 h-4 cursor-pointer"></i></td></tr>
                 </tbody>
             </table>
             <button class="bg-fuchsia-100 hover:bg-fuchsia-200 text-fuchsia-900 font-bold px-6 py-2 mt-4 rounded border border-fuchsia-300 shadow text-xs tracking-widest uppercase"><i data-lucide="plus" class="w-4 h-4 inline mr-1"></i> Provision New Auth Node</button>
        </div>
        """,
        "Maps Google Auth records to OPS3 internal roles and hard-binds them to explicit location node contexts. Affects Firestore Rules natively."
    ))

    screens.append(screen("adm_loc", "Location Builder", "<div class='bg-white p-6 border rounded shadow max-w-4xl text-slate-400 font-bold'>[Visual drag-n-drop or explicit tree editor placing Boats -> Hubs -> Global]</div>", ""))
    
    screens.append(screen("adm_ppl", "Global People Registry Master",
        """
        <div class="bg-slate-50 border p-6 rounded shadow-sm max-w-5xl border-t-8 border-slate-700 text-sm">
             <h3 class="font-black text-slate-800 border-b border-slate-300 pb-2 mb-4 uppercase tracking-widest"><i data-lucide="contact" class="inline mr-2 w-5 h-5 text-slate-500"></i> Personnel Reference Directory</h3>
             <table class="w-full inv-table rounded border border-slate-300 font-mono shadow-inner mb-4">
                <thead><tr class="!bg-slate-800 text-white"><th>Registry ID</th><th>Legal Full Name</th><th>Default Group Mapping</th><th class="text-center">Status</th></tr></thead>
                <tbody>
                    <tr class="bg-white"><td class="font-bold text-blue-700 bg-blue-50 w-32 border-r border-slate-100">ID-011</td><td class="font-bold">Pak Budi Santoso</td><td class="text-slate-500 italic">Boat Captains / Kaimana</td><td class="text-center"><span class="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-xs">Active</span></td></tr>
                    <tr class="bg-white"><td class="font-bold text-red-700 bg-red-50 w-32 border-r border-slate-100">ID-042</td><td class="font-bold text-slate-600">Maman</td><td class="text-slate-500 italic">Boat Crew Pool</td><td class="text-center"><span class="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-xs">Active</span></td></tr>
                </tbody>
            </table>
            <button class="bg-slate-800 hover:bg-black text-white px-4 py-2 font-bold text-xs uppercase shadow tracking-widest rounded">+ Mint Employee ID</button>
        </div>
        """,
        "Central dictionary for Staff. Any addition here populates dropdowns across Boat, Factory, CS, and Office advance logic."
    ))

    screens.append(screen("adm_exp_type", "Expense Typology Configs",
        """
        <div class="bg-slate-50 border p-6 rounded shadow-sm max-w-5xl border-t-8 border-slate-600 text-sm">
            <h3 class="font-black text-slate-800 border-b border-slate-300 pb-2 mb-4 uppercase tracking-widest flex justify-between"><span><i data-lucide="list" class="inline w-5 h-5 mr-2 text-slate-500"></i> Ledger Type Mappings</span><span class="text-xs bg-slate-200 text-slate-600 px-3 py-1 font-bold rounded shadow-inner">Config Mode</span></h3>
             <table class="w-full inv-table shadow border border-slate-300 text-xs font-mono">
                <thead><tr class="!bg-slate-700 text-slate-100"><th>Friendly App Name (Dropdown)</th><th>Backing Chart of Accounts (COA) ID</th><th class="text-center">Scope Limit</th></tr></thead>
                <tbody>
                    <tr><td class="bg-white font-bold text-slate-700 p-2">Crew/Employee Payment / Advance</td><td class="bg-white p-2 text-slate-500 border-r tracking-widest border-slate-100">COA-5100: Direct Labor / Advances</td><td class="bg-white text-center p-2"><span class="text-[0.6rem] bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold px-1 rounded uppercase">All Operatives</span></td></tr>
                    <tr><td class="bg-white font-bold text-slate-700 p-2 border-t border-slate-100">Electricity (PLN)</td><td class="bg-white p-2 text-slate-500 border-r tracking-widest border-t border-slate-100">COA-6200: Utilities Provision</td><td class="bg-white text-center p-2 border-t border-slate-100"><span class="text-[0.6rem] bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold px-1 rounded uppercase">Fac / CS Only</span></td></tr>
                </tbody>
            </table>
        </div>
        """,
        "Binds UI operational expense dropdown items directly to Finance-layer Chart of Accounts strings."
    ))

    screens.append(screen("adm_mdm", "Master Data Config", "<div class='bg-white p-6 border rounded shadow max-w-4xl text-slate-400 font-bold'>[Manage SKU tables, standard conversion yields, and pricing minimums limit blocks.]</div>", ""))
    screens.append(screen("adm_aud", "System Audit Tool", "<div class='bg-white p-6 border rounded shadow max-w-4xl text-slate-400 font-bold'>[Raw immutable append-log viewer capturing every Firebase interaction bound by UID.]</div>", ""))
    screens.append(screen("adm_perm", "Permissions Matrix", "<div class='bg-white p-6 border rounded shadow max-w-4xl text-slate-400 font-bold'>[Overrides standard RoleConfig if exact granular blocks are required per user ID.]</div>", ""))
    screens.append(screen("adm_set", "Global Constants", "<div class='bg-white p-6 border rounded shadow max-w-4xl text-slate-400 font-bold'>[System naming conventions, timezones, fiscal year start dates.]</div>", ""))

    # SHARK AI OPS
    screens.append(screen("shk_chat", "Shark Consult & Override",
        """
        <div class="bg-slate-900 border border-purple-900 shadow-2xl rounded max-w-4xl flex flex-col h-[600px] border-t-8 border-t-purple-500">
            <div class="p-4 bg-black/40 border-b border-purple-800/50 flex items-center justify-between shadow-inner">
                <span class="font-black tracking-widest text-purple-400 text-sm flex items-center"><i data-lucide="cpu" class="w-5 h-5 mr-3"></i> OPS3 SHARK COMPANION</span>
                <span class="text-[0.6rem] text-emerald-400 font-bold uppercase tracking-widest animate-pulse border border-emerald-900/50 bg-emerald-900/20 px-2 py-0.5 rounded shadow">Ingesting Live Streams</span>
            </div>
            <div class="flex-1 overflow-y-auto p-6 font-mono text-xs space-y-6">
                 <div class="flex items-start opacity-70">
                    <div class="w-8 h-8 rounded bg-slate-800 text-slate-500 flex items-center justify-center mr-3 border border-slate-700 font-black">U</div>
                    <div class="bg-slate-800 text-slate-300 p-3 rounded-tr-lg rounded-br-lg rounded-bl-lg shadow max-w-[80%] uppercase tracking-wide border border-slate-700 flex flex-col items-end">
                        <span class="text-right">Run a fraud risk analysis on Boat F-14 last 3 trips. Did the Captain overdraw fuel compared to logged catch?</span>
                    </div>
                </div>
                 <div class="flex items-start mt-4">
                    <div class="w-8 h-8 rounded bg-gradient-to-br from-purple-800 to-purple-900 border border-purple-600 shadow-xl shadow-purple-900 text-purple-200 flex items-center justify-center mr-3 animate-pulse"><i data-lucide="zap" class="w-4 h-4"></i></div>
                    <div class="bg-black/40 text-purple-300 font-bold p-4 rounded border border-purple-800/50 shadow-inner max-w-[85%] leading-relaxed flex flex-col group hover:border-purple-600 transition-colors">
                        <span class="text-[0.6rem] font-black uppercase text-purple-500 tracking-widest mb-2 border-b border-purple-900/50 pb-1 w-[fit-content]">Shark Diagnostic Output</span>
                        Running matrix correlation: (FUEL_EXP) vs (YIELD_KG/DISTANCE).<br><br>
                        Trip B1-011: Nominal. Ratio 12:1.<br>
                        Trip B1-012: Nominal. Ratio 11.5:1.<br>
                        Trip B1-013: <span class="bg-red-900/50 text-red-400 px-1 font-black">ANOMALY.</span> Ratio spiked to 24:1. Fuel drawn: 2500L, Catch reported: 104kg.<br><br>
                        <span class="text-amber-300">CONCLUSION: High probability of fuel diversion/theft on the 3rd trip. Automatically flagging Location Manager dashboard and suspending Auto-Approval for Captain's future EXP docs.</span>
                        <div class="mt-4 pt-3 border-t border-purple-800/30 w-full flex space-x-3 opacity-50 group-hover:opacity-100 transition-opacity">
                             <button class="bg-purple-900/40 border border-purple-700 hover:bg-purple-800 hover:text-white px-3 py-1 rounded text-[0.6rem] uppercase tracking-widest text-purple-400 flex items-center shadow"><i data-lucide="file-text" class="w-3 h-3 mr-1 inline"></i> View Trip 13 Audit</button>
                             <button class="bg-red-900/20 border border-red-900 hover:bg-red-900 text-red-500 font-black hover:text-white px-3 py-1 rounded text-[0.6rem] uppercase tracking-widest transition shadow flex items-center"><i data-lucide="lock" class="w-3 h-3 mr-1 inline"></i> Lock User Matrix</button>
                        </div>
                    </div>
                </div>
                 <div class="flex items-center text-slate-600 text-[0.6rem] uppercase tracking-widest font-black mt-4 ml-12">
                     <i data-lucide="cpu" class="w-3 h-3 mr-1 animate-spin"></i> Context Engine Idling...
                 </div>
            </div>
            <div class="p-4 bg-slate-800 border-t border-purple-900">
                <div class="relative flex items-center bg-black/30 border border-purple-800 p-2 rounded shadow-inner">
                   <div class="absolute left-4 w-2 h-2 rounded-full bg-emerald-500 animate-pulse hidden md:block"></div>
                   <input type="text" class="w-full bg-transparent text-white font-mono text-sm px-8 outline-none placeholder-purple-900 font-bold" placeholder="Command Shark AI (e.g. Generate weekly P&L estimation)...">
                   <button class="bg-purple-700 hover:bg-purple-600 border border-purple-400 text-white p-2 rounded transition-colors shadow-lg"><i data-lucide="send" class="w-4 h-4"></i></button>
                </div>
            </div>
        </div>
        """,
        "Intelligent multi-agent orchestrator. Chat interface for systemic overrides and deep diagnostic querying directly into immutable ledgers."
    ))

    screens.append(screen("shk_grid", "Risk Matrix Watch (Active)",
        """
        <div class="bg-white p-6 border rounded shadow-md max-w-6xl font-mono text-xs border-t-8 border-purple-900">
            <h3 class="font-black text-slate-800 border-b-2 border-slate-300 pb-2 mb-4 uppercase tracking-widest text-sm flex items-center "><i data-lucide="grid" class="inline mr-2 text-slate-400 h-5 w-5"></i> Systemic Anomaly Board</h3>
             <table class="w-full border-collapse border border-slate-300 shadow">
                 <thead><tr class="bg-slate-900 text-white uppercase tracking-widest text-[0.6rem] font-bold"><th class="border border-slate-700 p-2 text-left">Confidence</th><th class="border border-slate-700 p-2 text-left">Entity Context Bound</th><th class="border border-slate-700 p-2 text-left">Heuristic / Rule Triggered</th><th class="border border-slate-700 p-2 text-center">Auto-Action Attempted</th></tr></thead>
                 <tbody>
                     <tr class="bg-red-50 hover:bg-red-100"><td class="border border-slate-200 p-2 text-center text-red-600 font-black"><i data-lucide="alert-triangle" class="w-4 h-4 inline mr-1 animate-pulse"></i> 98.5%</td><td class="border border-slate-200 p-2 font-bold text-slate-800">Boat Faris (TRIP-B1-0226)</td><td class="border border-slate-200 p-2 text-slate-600">Yield Divergence: High fuel burn (2500L), low catch value (Rp 4M).</td><td class="border border-slate-200 p-2 text-center font-bold text-slate-700 uppercase"><span class="bg-amber-200 text-amber-900 text-[0.6rem] px-1 py-0.5 rounded border border-amber-400">Suspend Payments</span></td></tr>
                     <tr class="bg-white hover:bg-slate-50"><td class="border border-slate-200 p-2 text-center text-amber-500 font-black">72.0%</td><td class="border border-slate-200 p-2 font-bold text-slate-800">HQ Master Bank (BCA) Node</td><td class="border border-slate-200 p-2 text-slate-600">Float Violation: Central funds dipped below Rp 50M reserve buffer limit.</td><td class="border border-slate-200 p-2 text-center font-bold text-slate-700 uppercase"><span class="bg-blue-100 text-blue-800 text-[0.6rem] px-1 py-0.5 rounded border border-blue-300">CEO SMS Alerted</span></td></tr>
                 </tbody>
             </table>
        </div>
        """,
        "Presents the active, unfixed rules triggered via background asynchronous Cloud Functions monitoring the global ledger."
    ))

    screens.append(screen("shk_hist", "Alert Decay History", "<div class='bg-white p-6 border rounded shadow max-w-4xl text-slate-400 font-bold'>[Logs when a Risk was cleared, by whom, and what mitigation was supplied.]</div>", ""))
    screens.append(screen("shk_wa", "C-Suite Broadcast", "<div class='bg-white p-6 border rounded shadow max-w-4xl text-slate-400 font-bold'>[Configures WhatsApp / Telegram webhook texts triggered by specific system bounds (e.g. Daily EOD Recap).]</div>", ""))
    screens.append(screen("shk_rule", "Rule Adjustments", "<div class='bg-white p-6 border rounded shadow max-w-4xl text-slate-400 font-bold'>[Manages the percentage limits triggering 'Yield Divergence' or 'Float Violation'.]</div>", ""))

    return screens
