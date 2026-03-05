from builder_utils import screen, doc_header, doc_actions, a4_preview, staff_roster_panel, advance_paid_grid

def get_boat_screens():
    screens = []
    
    screens.append(screen("boat_start", "1. Start Trip",
        """
        <div class="bg-white p-8 rounded border max-w-4xl mb-8 shadow-sm border-t-4 border-blue-600">
            <div class="grid grid-cols-2 gap-6 mb-6"><div><label class="block text-xs font-bold text-slate-500 mb-1">Trip ID</label><input type="text" class="border p-2 w-full rounded font-mono bg-slate-50" value="TRIP-AUTO" disabled></div><div><label class="block text-xs font-bold text-slate-500 mb-1">Vessel / Unit</label><select class="border p-2 w-full"><option>Boat Faris</option></select></div></div>
            <div class="grid grid-cols-2 gap-6 mb-6"><div><label class="block text-xs font-bold text-slate-500 mb-1">Date & Time Out</label><input type="datetime-local" class="border p-2 w-full rounded" value="2026-03-01T08:00"></div><div><label class="block text-xs font-bold text-slate-500 mb-1">Trip Goal/Zone</label><input type="text" class="border p-2 w-full rounded" placeholder="Zone C South"></div></div>
            """ + staff_roster_panel() + """
            <button class="bg-blue-600 hover:bg-blue-700 text-white font-bold w-full text-lg py-3 rounded"><i data-lucide="play" class="w-5 h-5 mr-2 inline"></i> INITIATE VESSEL TRIP</button>
        </div>
        """,
        "Locks down the context bounds for this trip. The staff roster defines who gets paid and who takes advances. No DB insert terminology. Generates Trip ID visually. Blocks if Vessel not selected."
    ))

    screens.append(screen("boat_init", "2. Opening Balances",
        doc_header("TRIP-B1-0226", "Draft") + 
        """
        <div class="bg-white p-6 rounded border mb-8 max-w-4xl border-t-4 border-blue-600">
            <h3 class="font-bold text-blue-900 mb-4 border-b pb-2 uppercase tracking-widest text-xs">Vessel Load & Fuel Status</h3>
            <div class="grid grid-cols-3 gap-4 mb-4">
                <div class="bg-slate-50 p-3 rounded border border-slate-200"><label class="text-[0.6rem] font-bold text-slate-500 uppercase">Fuel Loading (Liters)</label><input type="number" class="w-full mt-1 border border-slate-300 p-1 text-right font-mono text-blue-700 font-bold" value="1500"></div>
                <div class="bg-slate-50 p-3 rounded border border-slate-200"><label class="text-[0.6rem] font-bold text-slate-500 uppercase">Ice Block Loading (Satuan)</label><input type="number" class="w-full mt-1 border border-slate-300 p-1 text-right font-mono text-cyan-600 font-bold" value="45"></div>
            </div>
            <h3 class="font-bold text-blue-900 mt-8 mb-4 border-b pb-2 uppercase tracking-widest text-xs">Trip Cash Wallet Declaration</h3>
            <div class="grid grid-cols-2 gap-4">
                <div class="bg-emerald-50 p-4 rounded border border-emerald-200"><label class="text-[0.7rem] font-bold text-emerald-800 uppercase block mb-2">Physical Cash On Board</label><input type="number" class="w-full border-emerald-300 p-2 text-right font-mono text-emerald-700 font-black text-xl" value="5000000"></div>
                <div class="p-4 rounded border border-slate-200 bg-white"><label class="text-[0.7rem] font-bold text-slate-500 uppercase block mb-1">Wallet Tag Creation</label><div class="font-mono text-sm font-bold text-slate-800 mt-3 pt-3 border-t border-slate-100">"TRIP-WALLET-B1"</div><p class="text-[0.6rem] mt-2 text-slate-400">This balance is dynamically tracked for the duration of the trip.</p></div>
            </div>
            """ + advance_paid_grid() + """
        </div>
        """ + a4_preview("OPENING TRIP SHEET", "<div><span class='font-bold uppercase'>Trip Wallet Seed:</span> Rp 5,000,000</div>", ["Captain", "Hub Treasury"]),
        "Locks starting variables. Establishes the Trip Wallet balance constraint. Visually logs Kasbon/Panjar amounts against rostered crew before departure."
    ))

    screens.append(screen("boat_exp", "3. Trip Expenses",
        doc_header("EXP-B1-0226", "Draft") + 
        """
        <div class="bg-white p-6 rounded shadow-sm mb-8 border-l-4 border-yellow-400 max-w-5xl">
            <h3 class="uppercase font-black text-slate-400 text-sm tracking-widest mb-4">Expense Voucher</h3>
            <div class="grid grid-cols-3 gap-4 mb-4">
                <div><label class="text-xs font-bold text-slate-500 block">Vendor/Payee</label><select class="border p-2 w-full"><option>Pertamina (Fuel)</option><option>Crew/Employee Payment</option></select></div>
                <div><label class="text-xs font-bold text-slate-500 block">Selected Payer/Wallet</label><select class="border p-2 w-full bg-slate-50 font-mono text-xs"><option>TRIP WALLET [Bal: 4.75M]</option><option>Unpaid (AP generated to Location Hub)</option></select></div>
            </div>
            
            <div id="crew_payment_expander" class="bg-indigo-50 p-4 border border-indigo-200 rounded mb-4">
                 <h4 class="font-bold text-xs uppercase text-indigo-800 mb-2 tracking-wide block"><i data-lucide="info" class="w-3 h-3 inline mr-1"></i> Staff Payment Details</h4>
                 <div class="flex space-x-4">
                     <div class="w-1/3"><label class="text-[0.6rem] text-indigo-600 font-bold block">Person Name</label><select class="border p-1 w-full text-sm"><option>Pak Budi</option><option>+ Add Person via Registry</option></select></div>
                     <div class="w-2/3"><label class="text-[0.6rem] text-indigo-600 font-bold block">Wallet Impact</label><div class="font-mono text-xs mt-1 p-1 bg-white border rounded">Minus Rp 250,000 (Expense) -> Reduces Trip Wallet by 250,000.</div></div>
                 </div>
            </div>

            <table class="w-full inv-table shadow-sm border mb-4">
                <thead><tr><th>Expense Type (Cat)</th><th>Description</th><th class="text-right">Amount IDR</th><th></th></tr></thead>
                <tbody>
                    <tr>
                        <td class="w-1/4 align-top"><select class="border p-1 w-full text-xs font-bold"><option>Crew/Employee Payment / Advance</option><option>+ Add New Expense Type</option></select></td>
                        <td class="w-1/2 p-2 align-top bg-slate-50"><input type="text" class="border p-1 w-full text-xs" value="Additional provisioning advance"></td>
                        <td class="w-1/6 align-top pt-3"><input type="number" class="w-full border p-1 text-right font-bold text-red-600 font-mono" value="250000"></td>
                        <td class="align-top pt-3 text-center"><i data-lucide="x" class="text-red-500 w-4 h-4 cursor-pointer"></i></td>
                    </tr>
                </tbody>
            </table>
            <div class="flex justify-end"><div class="total-box w-64 text-right"><div class="flex justify-between font-black text-2xl text-slate-800 border-b pb-2 mb-2"><span class="text-sm">TOTAL</span><span class="font-mono">250,000</span></div></div></div>
            """ + doc_actions() + """
        </div>
        """,
        "Validates wallet balance delta upon post. Requires 'Person Name' selection if 'Crew/Employee Payment' is the chosen vendor. Dropdowns link to Admin master registries via inline additions."
    ))

    screens.append(screen("boat_recv_own", "4. Receive Own Catch",
        doc_header("RCV-OWN-0226", "Draft") + 
        """
        <div class="bg-white p-6 border rounded shadow-sm border-t-8 border-cyan-600 max-w-5xl mb-6">
            <h3 class="font-black text-cyan-900 border-b border-cyan-200 pb-2 mb-4 uppercase tracking-widest flex items-center"><i data-lucide="anchor" class="w-5 h-5 mr-3"></i> Physical Fish Onboarding (Own Vessel)</h3>
            <table class="w-full inv-table shadow-sm border border-cyan-200 mb-6 rounded overflow-hidden">
                <thead><tr class="!bg-cyan-900"><th class="!text-white">Fish SKU / Species</th><th class="!text-white text-right">Gross Weight KG</th><th class="!text-white text-center">Quality / Temp</th><th class="!text-white"></th></tr></thead>
                <tbody>
                    <tr><td class="bg-white"><select class="border p-2 w-full text-sm"><option>Snapper (Grade A)</option></select></td><td class="bg-white"><input type="number" class="border p-2 w-full text-right font-black text-xl font-mono text-cyan-700" value="120.5"></td><td class="bg-white text-center text-sm font-bold text-slate-400">Standard / Cold</td><td class="bg-white text-center"><i data-lucide="trash-2" class="w-4 h-4 text-red-400 cursor-pointer inline"></i></td></tr>
                </tbody>
            </table>
            <button class="text-sm font-bold text-cyan-600 flex items-center mb-6">+ Add Fish SKU Row</button>
            <div class="bg-cyan-50 border border-cyan-300 p-4 rounded text-right mb-6"><div class="text-xs uppercase tracking-widest text-cyan-800 font-bold mb-1">Total Trip Catch Volume</div><div class="font-black font-mono text-3xl text-cyan-900">120.5 KG</div></div>
            """ + doc_actions() + """
        </div>
        """,
        "Visually increases Boat Inventory Quantity. Does not affect AP or Wallets (zero cost basis onboarding)."
    ))

    screens.append(screen("boat_recv_buy", "5. Receive via Purchase",
        doc_header("RCV-BUY-0226", "Draft") + 
        """
        <div class="bg-white p-6 border rounded shadow-sm border-t-8 border-indigo-600 max-w-5xl mb-6">
            <h3 class="font-black text-indigo-900 border-b border-indigo-200 pb-2 mb-4 uppercase tracking-widest flex items-center"><i data-lucide="shopping-bag" class="w-5 h-5 mr-3"></i> Buy Catch from Local Fishermen</h3>
            
            <div class="grid grid-cols-2 gap-6 bg-slate-50 p-4 rounded border mb-6">
                <div><label class="text-xs font-bold text-slate-500 block mb-1">Supplier Fisherman</label><select class="border p-2 w-full font-bold text-indigo-800"><option>Pak Nelayan A</option><option>+ New Fisherman</option></select></div>
                <div><label class="text-[0.6rem] font-black uppercase text-indigo-800 tracking-widest block mb-1">Settlement Method</label><select class="border p-2 w-full bg-white font-mono text-sm border-indigo-300"><option>Create AP Hutang to Location HQ</option><option>Pay Cash via TRIP WALLET</option></select><p class="text-[0.6rem] text-slate-400 mt-2 font-bold italic">Selecting AP flags HQ Finance for payment run.</p></div>
            </div>

            <table class="w-full inv-table shadow border border-indigo-300 mb-6 rounded overflow-hidden">
                <thead><tr class="!bg-indigo-900 !text-white"><th>SKU Tag</th><th class="text-right">Acquired KG</th><th class="text-right">Agreed Price / KG</th><th class="text-right">Line Total Value</th><th></th></tr></thead>
                <tbody>
                    <tr><td class="bg-white"><select class="border p-1 w-full text-xs font-bold"><option>Grouper (Live)</option></select></td><td class="bg-white"><input type="number" class="border p-1 w-full text-right font-mono font-bold" value="25.0"></td><td class="bg-white"><input type="number" class="border p-1 w-full text-right font-mono text-slate-500" value="85000"></td><td class="bg-white"><input type="text" class="border p-1 w-full text-right font-mono font-black text-red-600 bg-red-50" value="2,125,000" disabled></td><td class="bg-white text-center"><i data-lucide="x" class="w-4 h-4 text-red-400 inline cursor-pointer"></i></td></tr>
                </tbody>
            </table>
            
            <div class="flex justify-between items-end mb-6">
                 <button class="text-sm font-bold text-indigo-600 flex items-center">+ Add Fish Row</button>
                 <div class="total-box text-right bg-indigo-50 border-indigo-200"><div class="text-xs font-bold text-indigo-800 uppercase tracking-widest">Gross Document Obligation</div><div class="font-black text-3xl font-mono text-indigo-900 mt-1 pb-1 border-b border-indigo-300">Rp 2,125,000</div></div>
            </div>
            """ + doc_actions() + """
        </div>
        """,
        "Simultaneous block mapping: Increases inventory quantity. Checks payment method choice to preview either a reduction in Trip Wallet OR the creation of a pending AP invoice for the Hub."
    ))

    screens.append(screen("boat_sale", "6. Boat Sales",
        doc_header("INV-B1-SALE-0226", "Draft") + 
        """
        <div class="bg-white p-6 border rounded shadow-sm border-t-8 border-emerald-500 max-w-5xl mb-6 flex flex-col">
            <h3 class="font-black text-emerald-900 border-b border-emerald-200 pb-2 mb-4 uppercase tracking-widest flex items-center"><i data-lucide="shopping-cart" class="w-5 h-5 mr-3 text-emerald-600"></i> Direct Outbound Sale (Commercial)</h3>
            
            <div class="grid grid-cols-2 gap-6 bg-slate-50 p-4 border rounded mb-6">
                <div><label class="text-xs font-bold text-slate-500 block mb-1">Customer Entity</label><select class="border p-2 w-full text-sm font-bold"><option>Local Market Trader</option></select></div>
                <div><label class="text-[0.6rem] font-bold text-slate-500 uppercase tracking-widest block mb-1">Funds Receipt Path</label><select class="border p-2 w-full text-sm font-mono border-emerald-300"><option>Paid into TRIP WALLET</option><option>Unpaid (Generates Corporate AR)</option></select></div>
            </div>
            
            <table class="w-full inv-table border border-emerald-300 shadow-sm mb-6">
                <thead><tr class="!bg-emerald-900 !text-white"><th>SKU Sold From Stock</th><th class="text-right">Outbound Qty KG</th><th class="text-right">Unit Sale Price</th><th class="text-right">Revenue Generation</th></tr></thead>
                <tbody>
                    <tr><td class="bg-white"><select class="border p-1 w-full text-xs font-bold bg-emerald-50"><option>Snapper (Grade A) [Bal: 120.5kg]</option></select></td><td class="bg-white"><input type="number" class="w-full border p-1 text-right font-mono font-black" value="20.0"></td><td class="bg-white"><input type="number" class="w-full border p-1 text-right font-mono" value="100000"></td><td class="bg-white"><input type="text" disabled class="w-full border p-1 text-right font-mono font-black text-emerald-700 bg-emerald-50" value="2,000,000"></td></tr>
                </tbody>
            </table>
            
            <div class="flex justify-end mb-6"><div class="text-right bg-white border border-emerald-400 p-4 rounded shadow"><div class="uppercase text-emerald-800 text-[0.6rem] font-black tracking-widest">Total Invoice Recognition</div><div class="text-3xl font-black font-mono text-emerald-600">Rp 2,000,000</div></div></div>
            """ + doc_actions() + """
        </div>
        """,
        "Deducts SKU quantity identically to a transfer. Determines if Trip Wallet increases immediately or if global AR is incremented for Hub Finance tracking."
    ))

    screens.append(screen("boat_wallet", "7. Wallet Transfers",
        doc_header("TRF-WALL-B1-0226", "Draft") + 
        """
        <div class="bg-white p-6 border rounded shadow-sm border-t-8 border-slate-700 max-w-5xl mb-6">
            <h3 class="font-black text-slate-800 border-b-2 border-slate-800 pb-2 mb-4 uppercase tracking-widest flex items-center"><i data-lucide="arrow-right-left" class="w-5 h-5 mr-3 text-slate-700"></i> Cash Remittance & Sweeps</h3>
            
            <div class="flex items-center space-x-6 bg-slate-50 p-6 border rounded shadow-inner mb-6">
                <div class="w-1/3 text-center"><div class="text-[0.6rem] font-black uppercase text-slate-400 tracking-widest mb-1">Source Wallet Target</div><div class="font-bold text-slate-800 border-b border-slate-300 pb-2 mb-2 bg-white rounded p-2 shadow border">TRIP WALLET [B1]</div><div class="font-mono font-black text-xl text-emerald-600">Bal: 6,500,000</div></div>
                <div class="w-1/3 flex flex-col items-center"><i data-lucide="chevrons-right" class="w-8 h-8 text-slate-300"></i><input type="number" class="mt-2 border-2 border-emerald-400 p-2 text-center font-mono font-black text-xl w-3/4 rounded shadow" placeholder="Amount To Sweep" value="6500000"></div>
                <div class="w-1/3 text-center"><div class="text-[0.6rem] font-black uppercase text-slate-400 tracking-widest mb-1">Destination Wallet Target</div><select class="w-full p-2 border bg-white rounded shadow text-sm font-bold text-blue-900 border-blue-400"><option>Kaimana Hub Central Treasury</option><option>HQ Central Bank Tags</option></select><div class="text-[0.6rem] font-bold text-slate-400 mt-3 italic">Remitting cash physical end-of-trip.</div></div>
            </div>
            """ + doc_actions() + """
        </div>
        """,
        "Verifies outbound requested transfer amount against current active wallet state. Status 'Posted' implies recipient Hub wallet increases while Trip Wallet decreases."
    ))

    screens.append(screen("boat_close", "8. Close Trip & Settle",
        """
        <div class="bg-white p-6 border-t-8 border-slate-900 rounded shadow-2xl max-w-5xl mb-12 relative overflow-hidden">
            <div class="absolute -right-16 -top-16 opacity-5 pointer-events-none text-slate-900"><i data-lucide="anchor" class="w-96 h-96"></i></div>
            <h1 class="text-4xl font-black uppercase text-slate-900 tracking-tight mb-2">Trip Closure & Final Settlement</h1>
            <p class="text-slate-500 text-sm mb-8 font-mono tracking-widest bg-slate-100 inline-block px-3 py-1 rounded">TRIP-B1-0226 | Boat Faris</p>

            <div class="grid grid-cols-2 gap-6 text-left mb-8 relative z-10">
                <div class="bg-slate-50 border p-6 font-mono text-sm leading-relaxed rounded shadow-inner border-t-4 border-t-blue-500">
                    <span class="text-slate-500 font-bold uppercase block mb-2 border-b-2 border-slate-200 pb-1 text-xs tracking-widest">Aggregate Catch Flow</span>
                    <div class="flex justify-between mb-1"><span class="text-slate-400">Total Own Catch:</span> <span class="font-black text-base text-slate-700">120.5 KG</span></div>
                    <div class="flex justify-between mb-1"><span class="text-slate-400">Total Purchased:</span> <span class="font-black text-base text-slate-700">25.0 KG</span></div>
                    <div class="flex justify-between font-bold text-blue-800 border-t border-blue-100 pt-2 mt-2 bg-blue-50/50 -mx-6 px-6 pb-2"><span class="uppercase">Net Trip Stock Retained:</span> <span class="text-xl tracking-tighter text-blue-600 shadow-sm bg-white px-2 py-0.5 rounded border border-blue-200">145.5 KG</span></div>
                </div>
                <div class="border p-6 font-mono text-sm rounded bg-emerald-50 border-emerald-200 border-t-4 border-t-emerald-500 shadow-sm relative">
                    <div class="absolute top-2 right-2 flex space-x-1"><div class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div></div>
                    <span class="text-emerald-800 font-bold uppercase block mb-2 border-b-2 border-emerald-200 pb-1 text-xs tracking-widest text-shadow-sm">Trip Final Cash Audit</span>
                    <div class="flex justify-between mb-1"><span class="text-emerald-700/70 uppercase text-[0.6rem] font-bold tracking-widest">Opening Bal:</span> <span class="text-emerald-900">Rp 5,000,000</span></div>
                    <div class="flex justify-between mb-1 bg-white border border-emerald-100/50 p-1 rounded-sm"><span class="text-emerald-700/70 uppercase text-[0.6rem] font-bold tracking-widest">Net Sales/Trf (In):</span> <span class="text-emerald-600 font-bold">+ Rp 2,000,000</span></div>
                    <div class="flex justify-between mb-1 bg-white border border-red-50 p-1 rounded-sm"><span class="text-red-400 uppercase text-[0.6rem] font-bold tracking-widest">Exp/Purch (Out):</span> <span class="text-red-500 font-bold">- Rp 500,000</span></div>
                    <div class="flex justify-between mb-1 bg-white border border-amber-50 p-1 rounded-sm"><span class="text-amber-500 uppercase text-[0.6rem] font-bold tracking-widest">Remitted HQ (Out):</span> <span class="text-amber-600 font-bold">- Rp 6,500,000</span></div>
                    <div class="flex justify-between border-t-2 border-emerald-300 pt-3 mt-3 shadow-[0_-4px_6px_-6px_rgba(0,0,0,0.1)]"><span class="font-black text-emerald-900 text-sm uppercase">Wallet Close Sys Bal:</span> <span class="font-black text-2xl tracking-tighter text-emerald-600">Rp 0</span></div>
                </div>
            </div>

            <div class="mt-8 bg-orange-50 p-6 rounded border border-orange-200 shadow-inner relative z-10">
                <h3 class="font-black text-orange-900 border-b border-orange-300 pb-2 mb-4 uppercase tracking-widest flex items-center text-sm"><i data-lucide="users" class="w-4 h-4 mr-2 text-orange-600"></i> Final Crew Settlement Table</h3>
                <p class="text-xs text-orange-800 mb-4 bg-white p-2 border border-orange-100 rounded">Net clearance of all advances pulled from opening and mid-trip against actual wage/profit share earned.</p>
                <table class="w-full inv-table shadow border border-orange-300 rounded overflow-hidden">
                    <thead><tr class="!bg-orange-900 !text-orange-100 pr-2"><th>Crew Roster Name</th><th class="text-right">Total Advance/Kasbon (Owed)</th><th class="text-right">Wages/Share (Earned)</th><th class="text-right">Net Immediate Settle</th><th class="text-right">Carry Forward Bal (Dept HR)</th></tr></thead>
                    <tbody>
                        <tr><td class="font-bold text-slate-800 border-l border-white bg-white">Pak Budi (ID-011)</td><td class="text-right text-red-600 font-mono bg-red-50 border-r border-red-100">Rp 750,000</td><td class="text-right text-emerald-600 font-mono border-r border-slate-100 bg-white">Rp 1,000,000</td><td class="text-right text-slate-800 font-mono font-bold bg-white"><span class="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded border border-emerald-300">Pay: Rp 250,000</span></td><td class="text-right text-slate-400 font-mono italic bg-slate-50 border-r border-white">0</td></tr>
                        <tr><td class="font-bold text-slate-800 border-l border-white bg-white">Maman (ID-042)</td><td class="text-right text-red-600 font-mono bg-red-50 border-r border-red-100">Rp 100,000</td><td class="text-right text-emerald-600 font-mono border-r border-slate-100 bg-white">0</td><td class="text-right text-slate-800 font-mono font-bold bg-white text-xs uppercase tracking-widest text-red-500 font-black">-</td><td class="text-right text-red-600 font-mono font-bold bg-red-50 border-r border-white border border-red-200 rounded shadow-sm">OWES: Rp 100,000</td></tr>
                    </tbody>
                </table>
            </div>

            <button class="bg-slate-800 hover:bg-black text-white w-full py-5 text-xl tracking-widest mt-8 font-black rounded shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-700 relative z-10 transition-transform active:scale-[0.98] flex justify-center items-center"><i data-lucide="lock" class="w-6 h-6 mr-3"></i> ATTEST / LOCK TRIP DATA</button>
        </div>
        """ + a4_preview("TRIP CLOSURE SETTLEMENT", "<table class='w-full text-left text-xs font-mono border-collapse'><thead><tr class='bg-slate-100 border-b border-slate-300'><th>Description</th><th class='text-right'>Value</th></tr></thead><tbody><tr><td class='border-b py-2'>Total Trip Fuel Exp</td><td class='border-b py-2 text-right'>Rp 1,000,000</td></tr><tr><td class='border-b py-2'>Total Catch Est Val</td><td class='border-b py-2 text-right'>Rp 8,500,000</td></tr><tr><td class='border-b py-2 font-black'>Crew Net Settlement</td><td class='border-b py-2 text-right font-black'>Rp 1,000,000</td></tr><tr><td class='py-2 font-black'>Cash Handover to Hub</td><td class='py-2 text-right font-black text-emerald-700'>Rp 3,000,000</td></tr></tbody></table>", ["Captain Signature", "Hub Finance Manager"]),
        "Ultimate end state. Renders visually if trip cash is not zeroed. Compares all known staff advances against logged expenses to output net settlement paths. Generates paper trail."
    ))

    screens.append(screen("boat_docs", "My Documents", "<div class='bg-white p-6 border rounded shadow-sm text-center text-blue-900 border-blue-100 bg-blue-50 font-mono'>READ-ONLY SEARCH: All Docs matching active Boat constraint.</div>", ""))
    screens.append(screen("boat_print", "Print Center", 
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

