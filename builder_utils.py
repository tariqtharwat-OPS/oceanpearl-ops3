import os
HTML_FILE = "d:/OPS3/01_SOURCE_CODE/docs/ui/OPS3_BLUEPRINT.html"

def get_head():
    return """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OCEAN PEARL | OPS3 COMPLETE PROTOTYPE</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/lucide@latest"></script>
    <style>@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap'); body{font-family:'Inter',sans-serif;background-color:#f8fafc;color:#0f172a;margin:0;overflow:hidden;} .screen{display:none;height:100%;overflow-y:auto;padding:1.5rem;background-color:#f1f5f9;} .screen.active{display:block;} .nav-item{cursor:pointer;transition:all 0.2s;} .nav-item.active{background-color:rgba(255,255,255,0.2)!important;color:white;border-left:4px solid #fff;} .a4-preview{width:210mm;min-height:297mm;background:white;margin:2rem auto;padding:15mm;box-shadow:0 10px 15px -3px rgb(0 0 0 / 0.1);position:relative;} @media print { body * { visibility: hidden; } .a4-preview, .a4-preview * { visibility: visible; } .a4-preview { position: absolute; left: 0; top: 0; margin: 0; padding: 0mm; box-shadow: none; width: 100%; height: auto; } .no-print { display: none !important; } } .inv-table th { @apply bg-slate-800 text-white font-bold text-xs uppercase tracking-wider py-2 px-3 text-left border-b-2 border-slate-900; } .inv-table td { @apply py-2 px-3 text-sm border-b border-slate-200 bg-white; } .spec-panel{ @apply border border-slate-300 bg-slate-100 p-4 rounded-lg mt-8 text-xs text-slate-800 font-mono shadow-inner no-print;} .doc-header { @apply flex justify-between items-center bg-white p-4 border border-slate-200 rounded-lg shadow-sm mb-6; } .total-box { @apply bg-slate-50 border border-slate-300 p-4 rounded; } .btn-primary { @apply bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded shadow flex items-center justify-center cursor-pointer; } .btn-success { @apply bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-6 rounded shadow flex items-center justify-center cursor-pointer; } .btn-secondary { @apply bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 font-bold py-2 px-4 rounded shadow flex items-center justify-center cursor-pointer; }</style>
</head>
<body class="flex h-screen w-screen">
    <aside id="mainSidebar" class="w-72 bg-slate-900 text-slate-300 flex flex-col shadow-xl z-20 flex-shrink-0 transition-colors duration-300">
        <div class="h-16 bg-black/50 flex items-center justify-between px-4 border-b border-white/10"><span class="font-black tracking-widest text-white text-lg flex items-center"><i data-lucide="anchor" class="w-5 h-5 mr-3 text-white"></i> OPS3 WORKFLOW</span><span class="text-[0.6rem] font-bold bg-white/20 text-white px-1.5 py-0.5 rounded tracking-widest uppercase border border-white/30">H-REV 4.0</span></div>
        <div class="p-4 bg-black/20 border-b border-white/10">
            <label class="text-xs font-bold text-slate-300 uppercase tracking-widest mb-1 block">Context Loader</label>
            <select id="roleSelector" class="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded px-2 py-2 outline-none font-bold shadow-inner focus:ring-2 focus:ring-blue-500" onchange="switchRoleContext(this.value)">
                <optgroup label="A) Unit-Level Users">
                    <option value="role_boat">Boat Operator (Vessel)</option>
                    <option value="role_factory">Factory Operator (Proc)</option>
                    <option value="role_coldstorage">Cold Storage Operator</option>
                    <option value="role_office">Office Admin</option>
                </optgroup>
                <optgroup label="B/C/D) Aggregation">
                    <option value="role_locationmgr">Location Manager</option>
                    <option value="role_finance">Finance Officer</option>
                    <option value="role_ceo" selected>CEO Command</option>
                    <option value="role_investor">Investor (Read-Only)</option>
                </optgroup>
                <optgroup label="E/F) System & Ops">
                    <option value="role_admin">System Admin</option>
                    <option value="role_shark">Shark AI Ops</option>
                </optgroup>
            </select>
        </div>
        <nav id="dynamicNav" class="flex-1 overflow-y-auto py-2 space-y-1 px-3 custom-scrollbar"></nav>
        <div class="p-4 border-t border-black/30 text-xs text-center font-mono opacity-50">Blueprint UI Mode Only<br>Strict Render</div>
    </aside>

    <div class="flex-1 flex flex-col h-screen overflow-hidden bg-slate-100 relative">
        <header class="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shadow-sm flex-shrink-0 z-10 no-print">
            <div class="flex items-center text-sm font-semibold text-slate-600"><span id="topbarRole" class="uppercase tracking-widest text-slate-400 font-bold"></span><i data-lucide="chevron-right" class="w-4 h-4 mx-3 text-slate-300"></i><span id="topbarScreen" class="text-slate-800 uppercase tracking-wider font-black text-lg"></span></div>
            <div class="flex flex-col items-end"><div class="text-xs font-bold text-slate-500">John Doe (budi@oceanpearl)</div><div class="text-[0.65rem] text-slate-400 font-mono">Location: Kaimana Hub | UI-Proto</div></div>
        </header>
        <main id="mainContainer" class="flex-1 overflow-y-auto relative p-8">
"""

def get_js():
    return """
        <div id="screen_noconfig" class="screen bg-red-50 relative">
            <div class="absolute inset-0 flex items-center justify-center">
                <div class="bg-white p-8 border-4 border border-red-500 rounded-xl shadow-2xl max-w-lg text-center">
                    <i data-lucide="alert-triangle" class="w-16 h-16 text-red-500 mx-auto mb-4"></i>
                    <h2 class="text-3xl font-black text-red-900 mb-2 uppercase tracking-wide">ROLE CONFIG MISSING</h2>
                    <p class="text-red-700 font-mono bg-red-100 p-2 rounded block" id="error_role_id_display"></p>
                    <p class="mt-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Hard stopping. No default fallback provided.</p>
                </div>
            </div>
        </div>
        <div id="screen_missing" class="screen bg-amber-50 relative">
            <div class="absolute inset-0 flex items-center justify-center">
                <div class="bg-white p-8 border-4 border-amber-500 rounded-xl shadow-2xl max-w-lg text-center">
                    <i data-lucide="alert-octagon" class="w-16 h-16 text-amber-500 mx-auto mb-4"></i>
                    <h2 class="text-3xl font-black text-amber-900 mb-2 uppercase tracking-wide">SCREEN MISSING</h2>
                    <p class="text-amber-700 font-mono bg-amber-100 p-2 rounded block" id="error_screen_id_display"></p>
                    <p class="mt-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Hard stopping. Mockup block has not been created yet.</p>
                </div>
            </div>
        </div>

        <div class="mt-24 bg-white p-8 border-t-8 border-emerald-600 rounded shadow-sm max-w-4xl mx-auto mb-12">
            <h2 class="text-2xl font-black text-emerald-900 mb-6 uppercase tracking-widest flex items-center"><i data-lucide="shield-check" class="w-6 h-6 mr-3 text-emerald-600"></i> UI FREEZE CHECKLIST</h2>
            <div class="space-y-4">
                <label class="flex items-center space-x-3 bg-slate-50 p-3 rounded border border-slate-200"><input type="checkbox" checked disabled class="w-5 h-5 text-emerald-600 rounded"> <span class="font-bold text-slate-800 uppercase tracking-wide text-sm">All roles have isolated navigation</span></label>
                <label class="flex items-center space-x-3 bg-slate-50 p-3 rounded border border-slate-200"><input type="checkbox" checked disabled class="w-5 h-5 text-emerald-600 rounded"> <span class="font-bold text-slate-800 uppercase tracking-wide text-sm">All documents have invoice layouts</span></label>
                <label class="flex items-center space-x-3 bg-slate-50 p-3 rounded border border-slate-200"><input type="checkbox" checked disabled class="w-5 h-5 text-emerald-600 rounded"> <span class="font-bold text-slate-800 uppercase tracking-wide text-sm">All workflows have start → operations → close loops</span></label>
                <label class="flex items-center space-x-3 bg-slate-50 p-3 rounded border border-slate-200"><input type="checkbox" checked disabled class="w-5 h-5 text-emerald-600 rounded"> <span class="font-bold text-slate-800 uppercase tracking-wide text-sm">No placeholder screens remain</span></label>
                <label class="flex items-center space-x-3 bg-slate-50 p-3 rounded border border-slate-200"><input type="checkbox" checked disabled class="w-5 h-5 text-emerald-600 rounded"> <span class="font-bold text-slate-800 uppercase tracking-wide text-sm">No routing fallbacks exist</span></label>
            </div>
            <div class="mt-8 pt-6 border-t border-slate-200 text-center"><span class="bg-emerald-100 text-emerald-800 font-black px-6 py-2 rounded shadow-sm tracking-widest uppercase border border-emerald-300">This marks the UI blueprint as frozen.</span></div>
        </div>

        </main>
    </div>

    <script>
        const roleConfig = {
            'role_boat': {
                color: 'bg-blue-900', label: 'Boat Operator',
                nav: [
                    { id: 'boat_start', label: '1. Start Trip', icon: 'play' }, { id: 'boat_init', label: '2. Trip Start Balances', icon: 'battery-charging' }, { id: 'boat_exp', label: '3. Trip Expense Invoice', icon: 'receipt' }, { id: 'boat_recv_own', label: '4. Receiv: Own Catch', icon: 'anchor' }, { id: 'boat_recv_buy', label: '5. Receiv: Buy Fishermen', icon: 'file-input' }, { id: 'boat_sale', label: '6. Boat Sale Invoice', icon: 'shopping-cart' }, { id: 'boat_wallet', label: '7. Trip Wallet & Transfers', icon: 'wallet' }, { id: 'boat_close', label: '8. Close Trip', icon: 'check-square' }, { id: 'boat_docs', label: 'My Documents', icon: 'folder' }, { id: 'boat_print', label: 'Print Center', icon: 'printer' }
                ]
            },
            'role_factory': {
                color: 'bg-indigo-900', label: 'Factory Operator',
                nav: [
                    { id: 'fac_start', label: '1. Start Shift/Batch', icon: 'play' }, { id: 'fac_init', label: '2. Factory Opening Checks', icon: 'clipboard-check' }, { id: 'fac_exp', label: '3. Expense Invoice', icon: 'receipt' }, { id: 'fac_recv', label: '4. Inbound Receiving', icon: 'truck' }, { id: 'fac_proc', label: '5. Processing Batch', icon: 'scissors' }, { id: 'fac_transfer', label: '6. Internal Transfer Out', icon: 'arrow-right-circle' }, { id: 'fac_wallet', label: '7. Wallet Snapshot', icon: 'wallet' }, { id: 'fac_close', label: '8. Close Shift/Batch', icon: 'check-square' }, { id: 'fac_docs', label: 'My Documents', icon: 'folder' }, { id: 'fac_print', label: 'Print Center', icon: 'printer' }
                ]
            },
            'role_coldstorage': {
                color: 'bg-cyan-950', label: 'Cold Storage Op',
                nav: [
                    { id: 'cs_start', label: '1. Start Loading', icon: 'play' }, { id: 'cs_init', label: '2. CS Opening Checks', icon: 'clipboard-check' }, { id: 'cs_exp', label: '3. Expense Invoice', icon: 'receipt' }, { id: 'cs_recv', label: '4. Inbound Acceptance', icon: 'import' }, { id: 'cs_stock', label: '5. Stock On Hand', icon: 'boxes' }, { id: 'cs_outbound', label: '6. Outbound Loading', icon: 'package-minus' }, { id: 'cs_sale', label: '7. Sales Invoice', icon: 'shopping-cart' }, { id: 'cs_waste', label: '8. Damage/Waste Log', icon: 'trash-2' }, { id: 'cs_wallet', label: '9. Wallet Snapshot', icon: 'wallet' }, { id: 'cs_close', label: '10. Close Loading Session', icon: 'check-square' }, { id: 'cs_docs', label: 'My Documents', icon: 'folder' }, { id: 'cs_print', label: 'Print Center', icon: 'printer' }
                ]
            },
            'role_office': {
                color: 'bg-teal-900', label: 'Office Admin',
                nav: [
                    { id: 'off_start', label: '1. Start Day', icon: 'sun' }, { id: 'off_init', label: '2. Petty Cash Opening', icon: 'wallet' }, { id: 'off_exp', label: '3. Expense Invoice', icon: 'receipt' }, { id: 'off_payreq', label: '4. Payment Reqs', icon: 'banknote' }, { id: 'off_ar', label: '5. AR Follow-up Log', icon: 'phone-call' }, { id: 'off_close', label: '6. Close Day Summary', icon: 'moon' }, { id: 'off_docs', label: 'My Documents', icon: 'folder' }, { id: 'off_print', label: 'Print Center', icon: 'printer' }
                ]
            },
            'role_locationmgr': {
                color: 'bg-emerald-900', label: 'Location Manager',
                nav: [
                    { id: 'loc_dash', label: 'Location Dashboard', icon: 'layout' }, { id: 'loc_app_exp', label: 'Approve: Expenses', icon: 'check-square' }, { id: 'loc_app_trans', label: 'Approve: Transfers', icon: 'check-square' }, { id: 'loc_app_recv', label: 'Review: Receivings', icon: 'eye' }, { id: 'loc_perf', label: 'Unit Performance', icon: 'activity' }, { id: 'loc_inv', label: 'Location Inventory', icon: 'archive' }, { id: 'loc_wallet', label: 'Location Wallets', icon: 'credit-card' }, { id: 'loc_staff', label: 'Unit Staff Assignment', icon: 'users' }, { id: 'loc_ppl', label: 'People Registry View', icon: 'contact' }, { id: 'loc_print', label: 'Doc & Print Center', icon: 'printer' }
                ]
            },
            'role_finance': {
                color: 'bg-amber-900', label: 'Finance Officer',
                nav: [
                    { id: 'fin_dash', label: 'Finance Dashboard', icon: 'pie-chart' }, { id: 'fin_wall', label: 'Wallets Overview', icon: 'wallet' }, { id: 'fin_ap', label: 'Payables (AP) & Payment Run', icon: 'arrow-down-right' }, { id: 'fin_ar', label: 'Receivables (AR) & Collection', icon: 'arrow-up-right' }, { id: 'fin_crew', label: 'Crew/Emp Advances OS', icon: 'users' }, { id: 'fin_ledger', label: 'Global Ledger', icon: 'book-open' }, { id: 'fin_recon', label: 'Bank Recon', icon: 'refresh-cw' }, { id: 'fin_pol', label: 'Expense Policy Monitor', icon: 'shield-alert' }, { id: 'fin_rep', label: 'Reports Export', icon: 'download' }, { id: 'fin_print', label: 'Print Center', icon: 'printer' }
                ]
            },
            'role_ceo': {
                color: 'bg-slate-900', label: 'CEO Command',
                nav: [
                    { id: 'ceo_dash', label: 'Executive Pulse', icon: 'bar-chart-2' }, { id: 'ceo_map', label: 'Global Inventory Map', icon: 'globe' }, { id: 'ceo_yield', label: 'Yield Anomalies', icon: 'alert-triangle' }, { id: 'ceo_health', label: 'Financial Health', icon: 'dollar-sign' }, { id: 'ceo_risk', label: 'Risk Dashboard', icon: 'shield' }, { id: 'ceo_appr', label: 'Approvals / Overrides', icon: 'key' }, { id: 'ceo_shark', label: 'Shark AI Ops', icon: 'cpu' }
                ]
            },
            'role_investor': {
                color: 'bg-gray-800', label: 'Investor',
                nav: [
                    { id: 'inv_dash', label: 'Investor Dashboard', icon: 'trending-up' }, { id: 'inv_val', label: 'Inventory Valuation', icon: 'box' }, { id: 'inv_rev', label: 'Revenue/Margin', icon: 'pie-chart' }, { id: 'inv_risk', label: 'Risk Summary', icon: 'shield-check' }
                ]
            },
            'role_admin': {
                color: 'bg-fuchsia-900', label: 'System Admin',
                nav: [
                    { id: 'adm_usr', label: 'User Mgt (Roles/Scope)', icon: 'users' }, { id: 'adm_loc', label: 'Location/Unit Tree', icon: 'git-merge' }, { id: 'adm_ppl', label: 'People Registry Master', icon: 'contact' }, { id: 'adm_exp_type', label: 'Expense Type Master', icon: 'list' }, { id: 'adm_mdm', label: 'Master Data Configs', icon: 'database' }, { id: 'adm_aud', label: 'System Audit Log', icon: 'list' }, { id: 'adm_perm', label: 'Permissions Matrix', icon: 'lock' }, { id: 'adm_set', label: 'System Settings', icon: 'settings' }
                ]
            },
            'role_shark': {
                color: 'bg-purple-900', label: 'Shark AI',
                nav: [
                    { id: 'shk_chat', label: 'Ops Console Chat', icon: 'message-square' }, { id: 'shk_grid', label: 'Risk Monitor Grid', icon: 'grid' }, { id: 'shk_hist', label: 'Alert History', icon: 'clock' }, { id: 'shk_wa', label: 'WhatsApp Templates', icon: 'message-circle' }, { id: 'shk_rule', label: 'Rule Configuration', icon: 'sliders' }
                ]
            }
        };

        function switchRoleContext(roleId) {
            document.querySelectorAll('.screen').forEach(el => el.classList.remove('active'));
            const conf = roleConfig[roleId];
            const sidebar = document.getElementById('mainSidebar');
            
            if(!conf) {
                // HARD REQUIREMENT: NO FALLBACK. RENDER BLOCKING ERROR.
                sidebar.className = `w-72 flex flex-col shadow-xl z-20 flex-shrink-0 bg-red-900 text-red-200`;
                document.getElementById('dynamicNav').innerHTML = '';
                document.getElementById('topbarRole').innerText = "ERROR";
                document.getElementById('error_role_id_display').innerText = `Role ID [${roleId}] missing config!`;
                document.getElementById('screen_noconfig').classList.add('active');
                return;
            }

            sidebar.className = `w-72 flex flex-col shadow-xl z-20 flex-shrink-0 transition-colors duration-300 ${conf.color} text-slate-300`;
            const nav = document.getElementById('dynamicNav');
            nav.innerHTML = '';
            document.getElementById('topbarRole').innerText = conf.label;

            conf.nav.forEach((item, i) => {
                const el = document.createElement('div');
                el.className = `nav-item flex items-center px-4 py-3 text-sm rounded font-medium transition mt-1 text-slate-300 hover:text-white hover:bg-black/20`;
                el.innerHTML = `<i data-lucide="${item.icon}" class="w-4 h-4 mr-3 opacity-80"></i> ${item.label}`;
                el.onclick = () => activateScreen(item.id, el, item.label);
                nav.appendChild(el);
            });
            
            if(window.lucide) { lucide.createIcons(); }
            nav.firstChild.click(); // Always explicit deterministic first selection per role config
        }

        function activateScreen(screenId, navEl, labelText) {
            document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
            navEl.classList.add('active');

            document.getElementById('topbarScreen').innerText = labelText;
            document.querySelectorAll('.screen').forEach(el => el.classList.remove('active'));
            
            const target = document.getElementById(screenId);
            if(target) { 
                target.classList.add('active'); 
            } else {
                // HARD REQUIREMENT: NO FALLBACK. RENDER BLOCKING ERROR.
                document.getElementById('error_screen_id_display').innerText = `Screen ID [${screenId}] missing markup block!`;
                document.getElementById('screen_missing').classList.add('active');
            }
        }

        window.onload = () => switchRoleContext('role_boat');
    </script>
</body>
</html>
"""

def screen(id, title, content, spec):
    return f'''<div id="{id}" class="screen">
        <h2 class="text-2xl font-black text-slate-800 mb-6 uppercase tracking-widest border-b-2 border-slate-300 pb-2 flex items-center">{title}</h2>
        {content}
        <div class="spec-panel"><strong>UI OUTCOME SPEC:</strong> {spec}</div>
    </div>'''

def doc_header(doc_no="DOC-001", badge="Draft", date="2026-03-01 10:00"):
    return f'''<div class="doc-header flex justify-between items-start bg-white p-4 border border-slate-200 rounded-lg shadow-sm mb-6">
        <div class="flex items-center">
            <div class="bg-blue-900 w-10 h-10 rounded flex items-center justify-center mr-4 shadow-sm"><i data-lucide="anchor" class="text-white w-6 h-6"></i></div>
            <div>
                <div class="text-[0.6rem] font-black tracking-widest text-slate-400 uppercase">Ocean Pearl Seafood</div>
                <div class="text-2xl font-black font-mono text-slate-800 leading-none mt-1">{doc_no}</div>
                <div class="text-xs font-bold text-slate-500 mt-1">{date} | Loc: Kaimana Hub</div>
            </div>
        </div>
        <div class="px-3 py-1 bg-amber-100 text-amber-800 font-bold rounded shadow-sm text-sm uppercase tracking-wide">{badge}</div>
    </div>'''

def doc_actions():
    return '''<div class="mt-6 border-t border-slate-200 pt-6 flex justify-between items-center bg-slate-50 p-4 rounded no-print">
        <button class="btn-secondary" onclick="window.print()"><i data-lucide="printer" class="w-4 h-4 mr-2"></i> Print Preview</button>
        <div class="flex space-x-3"><button class="btn-secondary px-8">Save Draft</button><button class="btn-success px-12 uppercase tracking-wide"><i data-lucide="lock" class="w-4 h-4 mr-2"></i> Post Document</button></div>
    </div>'''

def a4_preview(title, center_content, signatures):
    sigs_html = "".join([f'<div class="border-t border-black pt-2 w-40 text-center text-xs font-bold uppercase">{s}</div>' for s in signatures])
    return f'''<div class="a4-preview border shadow-xl mt-16 relative">
        <div class="flex justify-between border-b-2 border-slate-800 pb-4 mb-8">
            <div class="flex items-center">
                <div class="w-12 h-12 bg-black text-white flex items-center justify-center mr-4"><i data-lucide="anchor" class="w-8 h-8"></i></div>
                <div>
                    <h1 class="text-4xl font-black tracking-tighter">OCEAN PEARL</h1>
                    <p class="text-xs uppercase font-bold mt-1 tracking-widest text-slate-500">Kaimana Hub</p>
                </div>
            </div>
            <div class="text-right flex items-center text-right space-x-6">
                <div>
                    <h2 class="text-2xl uppercase tracking-widest text-slate-400 font-light">{title}</h2>
                    <p class="font-mono mt-2 text-sm font-black tracking-widest">OPS3-DOC-REF</p>
                </div>
                <div class="w-20 h-20 bg-slate-100 border-2 border-slate-300 p-2 flex items-center justify-center flex-col shadow-sm">
                    <i data-lucide="qr-code" class="w-12 h-12 text-slate-400"></i>
                    <span class="text-[0.5rem] font-bold mt-1 text-slate-500">SCAN VALIDATE</span>
                </div>
            </div>
        </div>
        {center_content}
        <div class="absolute bottom-12 flex justify-between px-8 w-[calc(100%-30mm)]">{sigs_html}</div>
        <div class="absolute bottom-2 right-2 text-[0.6rem] font-mono text-slate-400">OPS3 SYSTEM GENERATED / IMMUTABLE RECORD</div>
    </div>'''

def staff_roster_panel():
    return '''<div class="bg-blue-50 border border-blue-200 p-6 rounded mb-8 shadow-sm">
        <h3 class="font-black text-blue-900 uppercase tracking-widest mb-4 flex items-center border-b border-blue-200 pb-2"><i data-lucide="users" class="w-5 h-5 mr-2"></i> Session Staff Roster</h3>
        <table class="w-full inv-table rounded overflow-hidden">
            <thead><tr><th class="!bg-blue-900 !text-blue-100">Name</th><th class="!bg-blue-900 !text-blue-100">Role</th><th class="!bg-blue-900 !text-blue-100 text-right">Ext. Advance Bal</th><th class="!bg-blue-900 !text-blue-100">Action</th></tr></thead>
            <tbody>
                <tr><td>Pak Budi (ID-011)</td><td>Captain / Shift Lead</td><td class="text-right text-red-600 font-mono">Rp 500,000</td><td class="text-red-500 font-bold p-2"><i data-lucide="x" class="w-4 h-4 cursor-pointer hover:bg-red-50"></i></td></tr>
                <tr><td>Maman (ID-042)</td><td>Crew / Employee</td><td class="text-right text-slate-400 font-mono">Rp 0</td><td class="text-red-500 font-bold p-2"><i data-lucide="x" class="w-4 h-4 cursor-pointer hover:bg-red-50"></i></td></tr>
            </tbody>
        </table>
        <button class="mt-4 text-sm font-bold text-blue-700 hover:text-blue-900 block flex items-center">+ Add Staff Member (via People Registry)</button>
    </div>'''

def advance_paid_grid():
    return '''<div class="bg-amber-50 border border-amber-200 p-6 rounded mt-8">
        <h3 class="font-black text-amber-900 uppercase tracking-widest mb-4 flex items-center border-b border-amber-200 pb-2"><i data-lucide="coins" class="w-5 h-5 mr-2"></i> Employee Advances Paid at Start</h3>
        <table class="w-full inv-table rounded overflow-hidden shadow-sm">
            <thead><tr><th class="!bg-amber-800 !text-amber-100">Staff Member</th><th class="!bg-amber-800 !text-amber-100">Reason/Detail</th><th class="!bg-amber-800 !text-amber-100 text-right">Amount (Rp)</th><th class="!bg-amber-800 !text-amber-100 text-right">Wallet Source</th><th class="!bg-amber-800 !text-amber-100"></th></tr></thead>
            <tbody><tr><td><select class="w-full p-1 border"><option>Pak Budi</option><option>Maman</option><option>+ Inline Add Person</option></select></td><td><input type="text" class="w-full p-1 border" value="Weekly Food Advance"></td><td><input type="number" class="w-full p-1 border text-right font-mono text-red-600 font-bold" value="250000"></td><td><select class="w-full p-1 border text-xs bg-slate-50"><option>Session Wallet</option></select></td><td><i data-lucide="x" class="text-red-500 w-4 h-4 cursor-pointer"></i></td></tr></tbody>
        </table>
        <button class="mt-4 text-sm font-bold text-amber-700 hover:text-amber-900 flex items-center">+ Add Advance Line</button>
        <div class="flex justify-end mt-4"><div class="bg-white p-3 border border-amber-200 rounded text-right w-64 shadow-sm"><div class="text-xs text-amber-800 font-bold">Total Session Advances:</div><div class="text-xl font-black text-amber-900 font-mono mt-1">Rp 250,000</div></div></div>
    </div>'''
