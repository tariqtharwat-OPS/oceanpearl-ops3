from builder_utils import screen, doc_header, doc_actions, a4_preview, staff_roster_panel, advance_paid_grid

def get_office_screens():
    screens = []

    def staff_settlement_summary():
        return '''
        <div class="bg-teal-50 p-6 rounded shadow border border-teal-200 mt-8 mb-8">
            <h3 class="font-black text-teal-900 uppercase tracking-widest mb-4 flex items-center border-b border-teal-200 pb-2"><i data-lucide="users" class="w-5 h-5 mr-2"></i> Office Staff Advances Summary</h3>
            <table class="w-full inv-table mb-4">
                <thead><tr><th>Ext ID</th><th>Staff Name</th><th class="text-right">Daily Advances Handed Out</th><th class="text-right">OS Balance Update</th></tr></thead>
                <tbody>
                    <tr><td class="font-mono text-slate-400">ID-331</td><td class="font-bold">Rina (Admin)</td><td class="text-right text-red-600 font-mono">100,000</td><td class="text-right font-bold text-red-700 font-mono text-lg">Rp 100,000</td></tr>
                </tbody>
            </table>
        </div>
        '''

    screens.append(screen("off_start", "1. Start Office Day",
        """
        <div class="bg-white p-8 rounded border max-w-4xl mb-8 shadow-sm border-t-4 border-teal-600">
            <div class="grid grid-cols-2 gap-6 mb-6 pb-6 border-b border-teal-100">
                <div><label class="block text-xs font-bold text-slate-500 mb-1">Session ID</label><input class="border p-2 w-full rounded font-mono bg-slate-50" value="OFC-DAY-0226" disabled></div>
                <div><label class="block text-xs font-bold text-slate-500 mb-1">Location</label><select class="border p-2 w-full"><option>Kaimana HQ Desk</option></select></div>
                <div><label class="block text-xs font-bold text-teal-600 mb-1">Admin User</label><input type="text" disabled class="border p-2 w-full font-bold bg-teal-50" value="Budi Admin"></div>
            </div>
            """ + staff_roster_panel().replace("bg-blue-50", "bg-teal-50").replace("blue-900", "teal-900").replace("blue-200", "teal-200") + """
            <button class="bg-teal-600 hover:bg-teal-700 text-white font-bold w-full text-lg py-3 rounded"><i data-lucide="sun" class="w-5 h-5 mr-2 inline"></i> OPEN ADMIN DAY</button>
        </div>
        """,
        "Binds office staff and establishes the administrative cash timeline for local expenditures."
    ))

    screens.append(screen("off_init", "2. Petty Cash Opening Checks",
        """
        <div class="bg-white p-6 rounded border mb-8 max-w-4xl border-t-4 border-teal-600">
            <h3 class="font-bold text-teal-900 mb-4 border-b pb-2 uppercase tracking-widest text-xs">Petty Cash Confirmation</h3>
            <div class="grid grid-cols-2 gap-y-4 gap-x-6">
                <div><label class="block text-xs font-bold text-slate-500">Declared Physical Cash</label><input type="number" class="border p-2 w-full rounded font-mono text-teal-800 font-bold bg-teal-50 border-teal-300" placeholder="Count notes in drawer"></div>
                <div><label class="block text-xs font-bold text-slate-500">System Expected Wallet Bal</label><input type="number" value="2500000" class="border p-2 w-full rounded font-mono text-emerald-600 font-bold bg-emerald-50" disabled></div>
            </div>
            """ + advance_paid_grid() + """
            <div class="mt-6 pt-4 border-t flex justify-end space-x-4"><button class="btn-success bg-teal-600"><i data-lucide="check" class="inline w-4 h-4 mr-2"></i> Verify Cash Drawer & Start</button></div>
        </div>
        """,
        "Crucial fraud-prevention step locking the physical cash count vs internal system expectation at shift start."
    ))

    screens.append(screen("off_exp", "3. Admin Expense Invoice",
        doc_header("EXP-OFF-01", "Draft") + 
        """
        <div class="bg-white p-6 border rounded shadow-sm mb-8 border-l-4 border-yellow-400 max-w-5xl">
            <h3 class="uppercase font-black text-slate-400 text-sm tracking-widest mb-4">Office & Local Purchasing</h3>
            <div class="grid grid-cols-3 gap-4 mb-4">
                <div><label class="text-xs font-bold text-slate-500 block">Vendor</label><select class="border p-2 w-full"><option>Local Stationary Store</option><option>Crew/Employee Payment</option></select></div>
                <div><label class="text-xs font-bold text-slate-500 block">Wallet Origin</label><select class="border p-2 w-full bg-slate-50 font-mono"><option>OFFICE PETTY CASH [Bal: 2.5M]</option></select></div>
            </div>
            
             <div id="crew_payment_expander_off" class="bg-indigo-50 p-4 border border-indigo-200 rounded mb-4">
                 <h4 class="font-bold text-xs uppercase text-indigo-800 mb-2 tracking-wide block"><i data-lucide="info" class="w-3 h-3 inline mr-1"></i> Staff Payment Details</h4>
                 <div class="flex space-x-4">
                     <div class="w-1/3"><label class="text-[0.6rem] text-indigo-600 font-bold block">Person Name</label><select class="border p-1 w-full text-sm"><option>Rina (Admin)</option><option>+ Add Person via Registry</option></select></div>
                     <div class="w-2/3"><label class="text-[0.6rem] text-indigo-600 font-bold block">Wallet Impact</label><div class="font-mono text-xs mt-1 p-1 bg-white border rounded">Minus Rp 450,000 (Expense) -> Reduces Petty Cash by 450,000.</div></div>
                 </div>
            </div>

            <table class="w-full inv-table shadow-sm border mb-4">
                <thead><tr><th>Account Type</th><th>Item Detail</th><th class="text-right">Line Total</th><th></th></tr></thead>
                <tbody>
                    <tr>
                        <td class="w-1/4 align-top"><select class="border p-1 w-full text-sm font-bold"><option>Stationary & Prints</option><option>+ Add New Expense Type</option></select></td>
                        <td class="w-1/2 p-2 align-top bg-slate-50"><input type="text" class="border p-1 w-full text-xs" value="Printer ink cartridges (3x)"></td>
                        <td class="w-1/6 align-top pt-3"><input type="number" class="w-full border p-1 text-right font-bold text-red-600 font-mono" value="450000"></td>
                        <td class="align-top pt-3 text-center"><i data-lucide="x" class="text-red-500 w-4 h-4 cursor-pointer"></i></td>
                    </tr>
                </tbody>
            </table>
            <button class="text-sm font-bold text-teal-600 flex items-center mb-6">+ Add Invoice Row</button>
            <div class="flex justify-end items-end">
                <div class="total-box w-64 text-right">
                    <div class="flex justify-between font-black text-2xl text-slate-800 border-b pb-2 mb-2"><span class="text-sm">TOTAL</span><span class="font-mono">450,000</span></div>
                </div>
            </div>
            """ + doc_actions() + """
        </div>
        """,
        "Admin equivalent of an operational expense. Draws from petty cash instead of trip funds."
    ))

    screens.append(screen("off_payreq", "4. Payment Requests",
        """
        <div class="bg-blue-50 border border-blue-200 p-6 rounded shadow-sm mb-6 max-w-6xl text-sm">
            <h3 class="font-black text-blue-900 border-b border-blue-200 pb-2 mb-4 uppercase tracking-widest"><i data-lucide="upload-cloud" class="inline mr-2"></i> Submit AP Bundle Request To HQ Finance</h3>
            <p class="mb-4 text-xs text-blue-800">Select unsettled vendor payables (from Boat purchases) to bundle into a formal funding request.</p>
            <table class="w-full inv-table shadow-sm border border-blue-300">
                <thead><tr><th class="!bg-blue-900"><input type="checkbox"></th><th class="!bg-blue-900">Source Doc</th><th class="!bg-blue-900">Creditor / Fisherman</th><th class="!bg-blue-900 text-right">Age</th><th class="!bg-blue-900 text-right">Requested Amt</th></tr></thead>
                <tbody>
                    <tr><td class="bg-white"><input type="checkbox" checked></td><td class="bg-white font-mono font-bold text-blue-700">RCV-BUY-099</td><td class="bg-white font-bold">Pak Rudi</td><td class="bg-white text-right text-red-600 font-bold bg-red-50">3 Days</td><td class="bg-white text-right font-mono font-black text-lg">6,500,000</td></tr>
                </tbody>
            </table>
            
            <div class="mt-6 p-4 bg-white border border-blue-300 shadow flex justify-between items-center rounded">
                <div><div class="text-xs uppercase font-bold text-slate-500">Total Bundle Request Amount</div><div class="text-2xl font-black text-blue-900 font-mono mt-1">Rp 6,500,000</div></div>
                <button class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded shadow"><i data-lucide="send" class="mr-2 inline"></i> TRANSMIT REQUEST TO FINANCE</button>
            </div>
        </div>
        """,
        "Moves local AP responsibility into the Global AP Queue (Finance level). Acts as an internal memo envelope."
    ))

    screens.append(screen("off_ar", "5. Collection / AR Follow-up Log",
        """
        <div class="bg-amber-50 border border-amber-200 p-6 rounded shadow-sm mb-6 max-w-5xl">
            <h3 class="font-black text-amber-900 border-b border-amber-200 pb-2 mb-4 uppercase tracking-widest"><i data-lucide="phone-call" class="inline mr-2"></i> Local Accounts Receivable Follow-up</h3>
            <table class="w-full inv-table shadow-sm border border-amber-300 mb-6 text-sm">
                <thead><tr><th class="!bg-amber-900">Doc Ref</th><th class="!bg-amber-900">Debtor Name</th><th class="!bg-amber-900 text-right">Owed</th><th class="!bg-amber-900">Action Status Logging</th></tr></thead>
                <tbody>
                    <tr><td class="font-mono text-slate-500 bg-white">INV-CS-001</td><td class="font-bold bg-white text-amber-900">Jakarta Seafood HQ</td><td class="bg-white text-right font-mono text-red-700 font-bold">1,900,000</td><td class="bg-white w-1/3 p-2 leading-none"><input type="text" class="border p-2 w-full shadow-inner text-xs" placeholder="Left voicemail on March 1st"></td></tr>
                </tbody>
            </table>
            <div class="flex justify-end"><button class="btn-secondary py-2 px-6 font-bold shadow-sm">Save Note Logs</button></div>
        </div>
        """,
        "Admin task for chasing active AR generated by Cold Storage Sales. Simple UI annotation table."
    ))

    screens.append(screen("off_close", "6. Close Office Day",
        """
        <div class="bg-white p-6 border-t-8 border-teal-800 rounded shadow-xl max-w-4xl pt-8 pb-12 mb-12">
            <h1 class="text-3xl font-black uppercase text-teal-900 tracking-tight mb-2">Office Daily Check-Out</h1>
            <p class="text-slate-500 text-sm mb-8 font-mono tracking-widest bg-teal-50 inline-block px-3 py-1 rounded">OFC-DAY-0226</p>
            
            <div class="grid grid-cols-2 gap-6 text-left mb-8">
                <div class="bg-slate-50 border p-6 font-mono text-sm leading-relaxed rounded border-red-200">
                    <span class="text-slate-500 font-bold uppercase block mb-2 border-b border-red-200 pb-1">Petty Cash Status</span>
                    <span class="text-slate-400">Opening:</span> <span class="font-black text-lg text-slate-700">2,500,000</span><br>
                    <span class="text-slate-400">Expenses:</span> <span class="font-black text-lg text-red-600">450,000</span><br>
                    <span class="text-slate-400">Closing Sys:</span> <span class="font-black text-xl text-blue-600 block mt-2 border-t pt-2 border-blue-200">2,050,000</span>
                </div>
                <div class="border p-6 font-mono text-sm rounded bg-amber-50 border-amber-200">
                    <span class="text-slate-500 font-bold uppercase block mb-2 border-b border-amber-200 pb-1">Bundled Payment Requests</span>
                    <span class="font-black text-2xl text-amber-900 block mt-4">Rp 6,500,000</span>
                    <span class="italic text-xs text-amber-700 mt-2 block">Sent to Finance Queue</span>
                </div>
            </div>
            """ + staff_settlement_summary() + """
            <button class="bg-teal-700 hover:bg-teal-900 text-white w-full py-5 text-xl tracking-widest mt-4 font-black rounded shadow-lg"><i data-lucide="lock" class="w-6 h-6 mr-3 inline"></i> LOCK DAY & PRINT RECON</button>
        </div>
        """ + a4_preview("DAILY ADMIN SUMMARY", "Displays reconciled petty cash logic and prints AP Request cover sheets internally.", ["Admin", "Loc Mgr"]),
        "Settles administrative cash layer natively within the same workflow boundaries."
    ))

    screens.append(screen("off_docs", "My Documents", "<div class='bg-white p-6 border rounded shadow-sm text-center text-teal-900 border-teal-100 bg-teal-50 font-mono'>OFFICE DOC BROWSER (EXP, REQ)</div>", ""))
    screens.append(screen("off_print", "Print Center", 
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
