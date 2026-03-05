from builder_utils import screen, doc_header, doc_actions, a4_preview, staff_roster_panel, advance_paid_grid

def get_cs_screens():
    screens = []
    
    screens.append(screen("cs_start", "1. Start Loading/Shipping Shift",
        """
        <div class="bg-white p-8 rounded border max-w-4xl mb-8 shadow-sm border-t-4 border-cyan-600">
            <div class="grid grid-cols-2 gap-6 mb-6 pb-6 border-b border-cyan-100">
                <div><label class="block text-xs font-bold text-slate-500 mb-1">Session</label><input class="border p-2 w-full rounded font-mono bg-slate-50" value="SHF-CS-0226" disabled></div>
                <div><label class="block text-xs font-bold text-slate-500 mb-1">Facility Name</label><select class="border p-2 w-full"><option>Cold Storage (Kaimana Main)</option></select></div>
            </div>
            """ + staff_roster_panel().replace("bg-blue-50", "bg-cyan-50").replace("blue-900", "cyan-900").replace("blue-200", "cyan-200").replace("Captain", "Gatekeeper") + """
            <button class="bg-cyan-600 hover:bg-cyan-700 text-white font-bold w-full text-lg py-3 rounded"><i data-lucide="play" class="w-5 h-5 mr-2 inline"></i> START WAREHOUSE OPS</button>
        </div>
        """,
        "Locks down the context bounds for this CS session. Assigns loading/unloading staff natively for piece-rate accumulation."
    ))

    screens.append(screen("cs_init", "2. Cold Storage Opening Checklist",
        doc_header("INIT-CS", "Draft") + 
        """
        <div class="bg-white p-6 rounded border mb-8 max-w-4xl border-t-4 border-cyan-600">
            <h3 class="font-bold text-cyan-900 mb-4 border-b pb-2 uppercase tracking-widest text-xs">Environment & Ops Box</h3>
            <div class="grid grid-cols-2 gap-y-4 gap-x-6">
                <div class="bg-slate-50 p-3 border rounded border-slate-200"><label class="block text-[0.6rem] font-bold text-slate-500 uppercase">ABF Room Temp Target</label><input type="number" class="border p-2 w-full rounded font-mono text-cyan-600 font-bold bg-white" value="-20.5"></div>
                <div class="bg-emerald-50 p-3 border rounded border-emerald-200"><label class="block text-[0.6rem] font-bold text-emerald-800 uppercase">Petty Cash Handover Val</label><input type="number" class="w-full border p-2 rounded text-right font-mono text-emerald-700 font-black text-xl bg-white shadow-sm" value="500000"></div>
            </div>
            """ + advance_paid_grid() + """
        </div>
        """,
        "Establishes initial state variables and ensures staff loading advances are mapped."
    ))

    screens.append(screen("cs_exp", "3. CS Expense Invoice",
        doc_header("EXP-CS-01", "Draft") + 
        """
        <div class="bg-white p-6 rounded shadow-sm mb-8 border-l-4 border-yellow-400 max-w-5xl">
            <h3 class="uppercase font-black text-slate-400 text-sm tracking-widest mb-4">CS Operating Voucher</h3>
            <table class="w-full inv-table shadow-sm border mb-4">
                <thead><tr><th>Expense Type (Cat)</th><th>Description</th><th class="text-right">Line Total</th><th></th></tr></thead>
                <tbody>
                    <tr>
                         <td class="w-1/4 align-top"><select class="border p-1 w-full text-xs font-bold"><option>Labor/Loaders (Daily)</option><option>+ Add</option></select></td>
                         <td class="w-1/2 p-2 align-top bg-slate-50"><input type="text" class="border p-1 w-full text-xs" value="Gaji Harian Buruh Angkut"></td>
                         <td class="w-1/6 align-top pt-3"><input type="number" class="w-full border p-1 text-right font-bold text-red-600 font-mono" value="100000"></td>
                         <td class="align-top pt-3 text-center"><i data-lucide="x" class="text-red-500 w-4 h-4 cursor-pointer"></i></td>
                    </tr>
                </tbody>
            </table>
            <button class="text-sm font-bold text-cyan-600 flex items-center mb-6">+ Add Row</button>
            <div class="flex justify-end"><div class="total-box w-64 text-right"><div class="flex justify-between font-black text-2xl text-slate-800 border-b pb-2 mb-2"><span class="text-sm">TOTAL</span><span class="font-mono">100,000</span></div></div></div>
            """ + doc_actions() + """
        </div>
        """,
        "Identical logic to Factory/Boat logic but pulls from 'CS Ops Cash'."
    ))

    screens.append(screen("cs_recv", "4. Finished Goods Acceptance",
        doc_header("RCV-CS-TRF-02", "Draft") + 
        """
        <div class="bg-cyan-50 border border-cyan-200 p-6 shadow-sm mb-6 max-w-5xl rounded">
            <h3 class="font-black text-cyan-900 border-b border-cyan-200 pb-2 mb-4 uppercase tracking-widest"><i data-lucide="download-cloud" class="w-5 h-5 mr-2 inline text-cyan-600"></i> Accept Internal Transfer</h3>
             <table class="w-full inv-table rounded bg-white shadow mb-6 hidden-border">
                <thead><tr class="!bg-cyan-900 !text-white"><th>Dispatched Ref</th><th>Originating Yield Station</th><th class="text-right">Awaiting Net KG</th><th class="text-center w-1/4">Confirm Stored Qty</th></tr></thead>
                <tbody>
                    <tr>
                        <td class="font-mono text-slate-700 bg-white">DO-FAC-TRF-02</td>
                        <td class="font-bold uppercase tracking-widest text-xs bg-white text-indigo-800">Kaimana Main Flr</td>
                        <td class="text-right font-mono text-slate-500 bg-white">45.0 KG (Snapper Fillet A)</td>
                        <td class="bg-white px-4"><input type="number" class="border-2 border-emerald-400 p-2 w-full text-right font-black font-mono text-xl shadow-inner text-emerald-700" value="45.0"></td>
                    </tr>
                </tbody>
            </table>
            """ + doc_actions() + """
        </div>
        """,
        "Completes the transfer linkage from Factory. Inflates Kaimana CS Inventory quantities physically."
    ))

    screens.append(screen("cs_stock", "5. Live Stock Availability",
        """
        <div class="bg-white p-6 border rounded shadow-sm max-w-5xl mb-6">
            <h3 class="font-black text-slate-800 uppercase tracking-widest mb-4 border-b-2 border-slate-800 pb-2 flex items-center justify-between"><span><i data-lucide="boxes" class="w-5 h-5 mr-2 inline"></i> Cold Room Grid</span><span class="text-xs bg-emerald-100 text-emerald-800 px-3 py-1 rounded shadow-sm border border-emerald-300">Hub Verified</span></h3>
            <table class="w-full inv-table shadow border border-slate-300">
                <thead><tr class="!bg-slate-800 text-white"><th>Verified SKU Master Tag</th><th class="text-right">Present Vol (KG)</th><th class="text-right">Global Est Val Basis</th></tr></thead>
                <tbody>
                    <tr><td class="font-bold text-slate-800 border-l-4 border-cyan-500 pl-4 bg-cyan-50">Snapper Fillet A</td><td class="text-right font-mono font-black text-xl text-cyan-700 bg-cyan-50">45.0</td><td class="text-right font-mono text-slate-500 bg-cyan-50">Rp 4.2M</td></tr>
                    <tr><td class="font-bold text-slate-800 border-l-4 border-slate-300 pl-4">Grouper Whole</td><td class="text-right font-mono font-bold text-lg text-slate-600">0.0</td><td class="text-right font-mono text-slate-500">Rp 0</td></tr>
                </tbody>
            </table>
        </div>
        """,
        "Real-time grid viewing local stock mapped to context Unit ID. Read-only presentation of live totals."
    ))

    screens.append(screen("cs_outbound", "6. Packing / Loading Manifest (DO)",
        doc_header("DO-MAN-0226", "Draft") + 
        """
        <div class="bg-white p-6 border rounded shadow-md border-t-8 border-cyan-600 max-w-5xl mb-6">
            <h3 class="font-black text-cyan-900 border-b border-cyan-200 pb-2 mb-4 uppercase tracking-widest"><i data-lucide="truck" class="inline text-cyan-600 mr-2"></i> Draft Commercial Manifest (Pre-Sale)</h3>
            <div class="bg-slate-50 p-4 rounded border grid grid-cols-2 gap-6 mb-6">
                <div><label class="text-xs font-bold text-slate-500 mb-1 block">Consignee Target (Optional)</label><input type="text" class="border p-2 w-full bg-white shadow-inner" placeholder="Jakarta Hub Transpo"></div>
                <div><label class="text-[0.6rem] font-bold text-slate-500 uppercase tracking-widest mb-1 block">Carrier Ext</label><input type="text" class="border p-2 w-full bg-white font-mono" placeholder="Flight / Vessel ID"></div>
            </div>
            
             <table class="w-full inv-table shadow border border-cyan-300 rounded mb-6">
                <thead><tr class="!bg-cyan-900 !text-white"><th>SKU Pulled Target</th><th class="text-right">Container Seal #</th><th class="text-right w-1/4">Packed Outbound Qty (KG)</th></tr></thead>
                <tbody>
                    <tr>
                        <td class="bg-white"><select class="border p-1 w-full text-xs font-bold font-mono"><option>Snapper Fillet A [Bal: 45.0]</option></select></td>
                        <td class="bg-white"><input type="text" class="border p-1 w-full text-right font-mono text-xs" value="SEAL-XP-12"></td>
                        <td class="bg-white"><input type="number" class="border p-1 w-full text-right font-black font-mono text-xl text-cyan-700 bg-cyan-50 shadow-inner" value="45.0"></td>
                    </tr>
                </tbody>
            </table>
             <button class="text-sm font-bold text-cyan-600 flex items-center mb-6">+ Add Master Carton Line</button>
            """ + doc_actions() + """
        </div>
        """ + a4_preview("LOADING DO MANIFEST", "<strong>Dispatch Totals:</strong> 45.0 KG (Snapper Fillet A)", ["Gatehouse Sig", "Carrier Acceptance"]),
        "Generates physical Delivery Order prior to financial clearing. Subtracts physical inventory locally without writing to global AP/AR yet."
    ))

    screens.append(screen("cs_sale", "7. Commercial Sales Invoice (Link DO)",
        doc_header("INV-CS-001", "Draft") + 
        """
        <div class="bg-amber-50 p-6 border border-amber-200 rounded shadow-md border-t-8 border-amber-500 max-w-5xl mb-6 flex flex-col">
            <h3 class="font-black text-amber-900 border-b border-amber-300 pb-2 mb-4 uppercase tracking-widest flex items-center"><i data-lucide="file-text" class="w-5 h-5 mr-3 text-amber-600"></i> Final Commercial Invoice Execution</h3>
            
            <div class="grid grid-cols-2 gap-6 bg-white p-4 border border-amber-100 rounded mb-6 shadow-sm">
                 <div>
                    <label class="text-xs font-bold text-slate-500 block mb-1">Bind To Extant Outbound DO</label>
                    <select class="border p-2 w-full font-mono text-sm shadow-inner bg-slate-50"><option>DO-MAN-0226 (Snapper Fillet A x45.0)</option></select>
                 </div>
                 <div>
                    <label class="text-[0.6rem] font-black tracking-widest text-amber-800 uppercase block mb-1">Funds Target Path</label>
                    <select class="border p-2 w-full text-sm font-mono border-amber-300 focus:outline-none"><option>Corporate Account Receivable (AR HQ)</option><option>Physical CS Wallet Immediate Cash</option></select>
                    <p class="text-[0.6rem] text-amber-700 mt-2 font-bold italic">Selecting AR binds this commercial paper to Hub Finance Collection boards.</p>
                 </div>
            </div>
            
            <table class="w-full inv-table shadow border border-amber-400 rounded overflow-hidden">
                <thead><tr class="!bg-amber-800 !text-white"><th>SKU (Inherited from DO)</th><th class="text-right">Billed Qty KG</th><th class="text-right">Unit B2B Sales Price (Rp)</th><th class="text-right w-1/4">Line Extension</th></tr></thead>
                <tbody>
                    <tr><td class="font-bold text-slate-700 bg-white">Snapper Fillet A</td><td class="text-right font-mono text-slate-500 bg-white">45.0</td><td class="bg-white"><input type="number" class="border p-2 w-full text-right font-mono bg-yellow-50 shadow-inner text-lg font-bold" value="150000"></td><td class="bg-white"><input type="text" disabled class="border p-1 w-full text-right font-mono font-black text-amber-700 bg-amber-50 text-xl" value="6,750,000"></td></tr>
                </tbody>
            </table>
            
           <div class="flex justify-between items-end mt-6">
                <button class="text-sm font-bold text-amber-700 hover:text-amber-900 bg-amber-100 px-4 py-2 rounded">+ Add Surcharge Line</button>
                <div class="text-right bg-white border-2 border-amber-400 p-4 rounded shadow-lg"><div class="uppercase text-amber-800 text-xs font-black tracking-widest border-b border-amber-200 pb-1 mb-1">Accounts Receivable Delta</div><div class="text-4xl font-black font-mono text-amber-600">Rp 6,750,000</div></div>
            </div>
            """ + doc_actions() + """
        </div>
        """ + a4_preview("COMMERCIAL TAX INVOICE", "<strong>Billed Entity:</strong> Local Trader<br><strong>Sale Value Subtotal:</strong> Rp 6,750,000", ["Authorized Finance", "Unit CS Stamp"]),
        "Links to previously dispatched DO. Assigns final financial basis to the shipped quantity. Binds to global AR matrix."
    ))

    screens.append(screen("cs_waste", "8. Expiry, Spoil & Waste Log",
        doc_header("WST-CS-0226", "Draft") + 
        """
        <div class="bg-white p-6 border rounded shadow border-t-8 border-red-700 max-w-5xl mb-6">
             <h3 class="font-black text-red-900 border-b border-red-200 pb-2 mb-4 uppercase tracking-widest"><i data-lucide="trash-2" class="w-5 h-5 inline mr-2 text-red-600"></i> Pure Stock Reduction Event</h3>
             <table class="w-full inv-table border border-red-300 shadow-sm mb-4">
                <thead><tr class="!bg-red-900 !text-white"><th>Destroyed SKU</th><th>Explanation Text</th><th class="text-right">Deducted Weight KG</th></tr></thead>
                <tbody>
                    <tr><td class="bg-white"><select class="border p-1 w-full text-xs font-bold text-red-800"><option>Snapper Fillet A [Bal: 45.0]</option></select></td><td class="bg-white"><input type="text" class="border p-1 w-full text-xs shadow-inner" value="Compressor failure sector B. Thawed out."></td><td class="bg-white"><input type="number" class="w-full border p-1 text-right font-mono font-black text-red-600 bg-red-100" value="5.0"></td></tr>
                </tbody>
            </table>
            <button class="bg-red-600 hover:bg-red-800 text-white font-black px-8 py-3 rounded shadow shadow-red-300 mt-4 tracking-widest flex items-center justify-center w-full"><i data-lucide="alert-triangle" class="w-5 h-5 mr-3 text-red-200"></i> COMMIT CARGO CULL TO IMMUTABLE LOG</button>
        </div>
        """,
        "Bypasses dispatch mechanisms and destroys local stock value silently alerting Location Manager."
    ))

    screens.append(screen("cs_wallet", "9. Wallet Sub-View", 
        """
        <div class="bg-white p-6 border rounded shadow max-w-5xl">
            <h3 class="font-bold border-b pb-2 mb-4 text-slate-800"><i data-lucide="wallet" class="inline w-4 h-4 mr-2 text-cyan-600"></i> Cold Storage Petty Cash</h3>
            <div class="grid grid-cols-2 gap-4 text-sm font-mono mb-6">
                <div class="p-4 bg-cyan-50 border border-cyan-200 rounded"><div class="text-xs font-bold text-cyan-800">Available Float</div><div class="text-xl font-black text-cyan-900 mt-1">Rp 15,000,000</div></div>
                <div class="p-4 bg-red-50 border border-red-200 rounded"><div class="text-xs font-bold text-red-800">Total Shift Expenses</div><div class="text-xl font-black text-red-900 mt-1">Rp 1,000,000</div></div>
            </div>
            <table class="w-full text-xs font-mono border text-left">
                <thead><tr class="bg-slate-100"><th>Time</th><th>Txn ID</th><th>Type</th><th>Amount</th><th>Running Balance</th></tr></thead>
                <tbody>
                    <tr><td class="p-2 border-b text-slate-500">08:00</td><td class="p-2 border-b">TX-1</td><td class="p-2 border-b">Float Receipt</td><td class="p-2 border-b text-emerald-600">+ Rp 16,000,000</td><td class="p-2 border-b font-bold">16,000,000</td></tr>
                    <tr><td class="p-2 border-b text-slate-500">11:00</td><td class="p-2 border-b">TX-2</td><td class="p-2 border-b">Fuel Expense</td><td class="p-2 border-b text-red-600">- Rp 1,000,000</td><td class="p-2 border-b font-bold">15,000,000</td></tr>
                </tbody>
            </table>
        </div>
        """, "Mirror of Factory Wallet logic bound strictly to CS_PettyCash tag."))
    
    screens.append(screen("cs_close", "10. Settle Session Operations",
        """
        <div class="bg-white p-6 border-t-8 border-cyan-800 rounded shadow-2xl max-w-5xl mb-12 relative overflow-hidden">
             <!-- Settlement Table rendering logic identical to Boat but displaying CS Crew -->
             <h1 class="text-4xl font-black uppercase text-cyan-900 tracking-tight mb-2">Warehouse Session Stop</h1>
             <p class="text-slate-500 text-sm mb-8 font-mono tracking-widest bg-cyan-50 inline-block px-3 py-1 border border-cyan-200 rounded">SHF-CS-0226</p>
             
             <div class="bg-slate-50 border p-6 font-mono text-sm leading-relaxed rounded border-t-4 border-t-emerald-500 flex justify-between items-center mb-8">
                <div><span class="text-emerald-800 font-bold uppercase block mb-2 border-b-2 border-emerald-200 pb-1 w-full tracking-widest text-xs">Petty Cash Handover End</span><span class="text-slate-400">Opening 500k -> Exp 100k</span></div>
                <div class="text-3xl font-black tracking-tighter text-emerald-700 bg-emerald-100 px-4 py-2 border border-emerald-300 rounded shadow-inner">Rp 400,000</div>
             </div>

             <!-- Employee Settlements rendered for visual representation -->
             <div class="bg-orange-50 p-6 rounded border border-orange-200 shadow mb-8">
                 <h3 class="font-black text-orange-900 mb-4 uppercase tracking-widest text-sm"><i data-lucide="users" class="w-4 h-4 mr-2 text-orange-600 inline"></i> Session Gang/Loader Settlements</h3>
                 <table class="w-full text-left text-xs font-mono font-bold text-orange-900 border border-orange-200 bg-white">
                     <thead><tr class="bg-orange-100 border-b border-orange-200"><th class="p-2">Name</th><th class="p-2">Role</th><th class="p-2 text-right">Piece Rate Rp</th><th class="p-2 text-right">Advances Rp</th><th class="p-2 border-l border-orange-200 text-right">Net Payout Rp</th></tr></thead>
                     <tbody>
                         <tr><td class="p-2 border-b">Udin</td><td class="p-2 border-b text-orange-600">Head Loader</td><td class="p-2 border-b text-right">95,000</td><td class="p-2 border-b text-right text-red-600">(50,000)</td><td class="p-2 border-b border-l border-orange-200 text-right text-emerald-700 text-base">45,000</td></tr>
                         <tr><td class="p-2">Maman</td><td class="p-2 text-orange-600">Loader</td><td class="p-2 text-right">85,000</td><td class="p-2 text-right text-slate-400">0</td><td class="p-2 border-l border-orange-200 text-right text-emerald-700 text-base">85,000</td></tr>
                     </tbody>
                 </table>
             </div>
             
             <button class="bg-cyan-900 hover:bg-black text-white w-full py-5 text-xl tracking-widest font-black rounded shadow flex justify-center items-center relative z-10 transition-transform active:scale-[0.98]"><i data-lucide="lock" class="w-6 h-6 mr-3"></i> CLOSE STATION</button>
        </div>
        """,
        "Requires zero pending inbound transfers. Reconciles loader balances vs petty cash layout prints the handover sign-offs."
    ))

    screens.append(screen("cs_docs", "My Documents", "<div class='bg-white p-6 border rounded shadow-sm text-center text-cyan-900 border-cyan-100 bg-cyan-50 font-mono'>READ-ONLY SEARCH: All Docs matching active CS Unit.</div>", ""))
    screens.append(screen("cs_print", "Print Center", 
        """
        <div class="bg-slate-50 border-4 border-dashed border-slate-300 p-12 text-center rounded-xl max-w-4xl mx-auto mt-8">
            <i data-lucide="printer" class="w-16 h-16 text-slate-400 mx-auto mb-4"></i>
            <h3 class="text-xl font-black text-slate-700 mb-2">A4 Document Injection Engine</h3>
            <p class="text-slate-500 font-mono text-sm mb-6 max-w-md mx-auto">Enter a specific Document ID to compile and render its immutable state into a printable format.</p>
            <div class="flex max-w-sm mx-auto shadow-lg">
                <input type="text" placeholder="DOC-ID" class="flex-1 border-y border-l rounded-l px-4 py-2 font-mono outline-none focus:border-indigo-500">
                <button class="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-r font-bold uppercase tracking-widest text-xs transition">Preview</button>
            </div>
        </div>
        """, "Search Doc ID to inject A4 Print Template -> window.print()"))

    return screens

