/**
 * OPS V3 - Bilingual i18n Configuration
 * 
 * Supports Indonesian (id) and English (en) throughout the system.
 */

export type Language = 'id' | 'en';

export const defaultLanguage: Language = 'id';

export interface TranslationKeys {
  // Common
  common_save: string;
  common_cancel: string;
  common_delete: string;
  common_edit: string;
  common_add: string;
  common_search: string;
  common_filter: string;
  common_export: string;
  common_loading: string;
  common_error: string;
  common_success: string;
  common_back: string;
  common_copy: string;
  common_idempotency: string;
  common_info: string;

  // Navigation
  nav_dashboard: string;
  nav_operations: string;
  nav_finance: string;
  nav_inventory: string;
  nav_reports: string;
  nav_settings: string;
  nav_logout: string;
  nav_admin: string;
  nav_shark: string;
  nav_trace: string;

  // Roles
  role_admin: string;
  role_ceo: string;
  role_location_manager: string;
  role_unit_operator: string;
  role_finance_officer: string;
  role_investor: string;
  role_shark: string;

  // Units
  unit_boat: string;
  unit_drying: string;
  unit_processing: string;
  unit_cold_storage: string;
  unit_fishmeal: string;
  unit_sorting: string;

  // Operations
  ops_hub: string;
  ops_record_receiving: string;
  ops_record_production: string;
  ops_record_transfer: string;
  ops_record_waste: string;
  ops_trip_expense: string;
  ops_sale: string;
  ops_price_customer: string;
  ops_sku: string;
  ops_qty: string;
  ops_cost: string;
  ops_supplier: string;
  ops_vessel: string;
  ops_input_batch: string;
  ops_output_sku: string;
  ops_output_qty: string;
  ops_processing_cost: string;
  ops_from_location: string;
  ops_to_location: string;
  ops_from_unit: string;
  ops_to_unit: string;
  ops_batch_id: string;
  ops_amount: string;
  ops_memo: string;
  ops_reason: string;
  ops_customer: string;
  ops_price: string;
  ops_payment: string;

  // Finance
  fin_center: string;
  fin_ledger: string;
  fin_balance: string;
  fin_trial_balance: string;
  fin_pnl: string;
  fin_inventory_value: string;
  fin_moving_average: string;
  fin_partner_balance: string;
  fin_revenue: string;
  fin_cogs: string;
  fin_expenses: string;
  fin_gross_profit: string;
  fin_net_income: string;
  fin_account: string;
  fin_total_value: string;

  // Shark
  shark_dashboard: string;
  shark_alerts: string;
  shark_risk_summary: string;
  shark_close_alert: string;
  shark_resolution: string;
  shark_severity: string;
  shark_status: string;
  shark_detected: string;

  // Admin
  admin_panel: string;
  admin_bootstrap: string;
  admin_seed: string;
  admin_users: string;
  admin_run: string;
  admin_result: string;

  // Traceability
  trace_verify: string;
  trace_scan: string;
  trace_public_info: string;
  trace_timeline: string;

  // Auth
  auth_welcome: string;
  auth_signin: string;
  auth_signout: string;
  auth_email: string;
  auth_password: string;
  auth_role: string;
  auth_unauthorized: string;

  // New keys for Operations/Finance/Shark
  ops_location_unit: string;
  ops_sku_qty: string;
  ops_cost_source: string;
  ops_batch_sku: string;
  ops_qty_cost: string;
  ops_from: string;
  ops_to: string;
  ops_scope: string;
  ops_details: string;
  ops_spoilage: string;
  ops_drier_loss: string;
  ops_sorting_error: string;
  ops_wallet_transfer: string;
  fin_location: string;
  fin_unit: string;
  fin_debit: string;
  fin_credit: string;
  fin_net_balance: string;
  fin_account_id: string;
  fin_loc_short: string;
  fin_sku_id: string;
  shark_realtime: string;
  shark_update: string;
  shark_global_risk: string;
  shark_active_alerts: string;
  shark_detection: string;
  shark_no_alerts: string;
  shark_resolved: string;
  shark_confirm_res: string;
  shark_explain_closure: string;

  // Additional Traceability details
  trace_check_origin: string;
  trace_sku: string;
  trace_status: string;
  trace_loc: string;
  trace_unit: string;

  // Bootstrap
  boot_title: string;
  boot_step1: string;
  boot_step1_desc: string;
  boot_step2: string;
  boot_step2_desc: string;
  boot_step2_note: string;
  boot_instructions: string;
  boot_run: string;
  boot_run_seed: string;
}

export const translations: Record<Language, TranslationKeys> = {
  id: {
    common_save: 'Simpan',
    common_cancel: 'Batal',
    common_delete: 'Hapus',
    common_edit: 'Ubah',
    common_add: 'Tambah',
    common_search: 'Cari',
    common_filter: 'Filter',
    common_export: 'Ekspor',
    common_loading: 'Memuat...',
    common_error: 'Kesalahan',
    common_success: 'Berhasil',
    common_back: 'Kembali',
    common_copy: 'Salin',
    common_idempotency: 'Kunci Idempotensi',
    common_info: 'Informasi',

    nav_dashboard: 'Dasbor',
    nav_operations: 'Operasional',
    nav_finance: 'Keuangan',
    nav_inventory: 'Inventori',
    nav_reports: 'Laporan',
    nav_settings: 'Pengaturan',
    nav_logout: 'Keluar',
    nav_admin: 'Admin Sistem',
    nav_shark: 'Shark AI',
    nav_trace: 'Traceability',

    role_admin: 'Administrator',
    role_ceo: 'CEO',
    role_location_manager: 'Manajer Lokasi',
    role_unit_operator: 'Operator Unit',
    role_finance_officer: 'Petugas Keuangan',
    role_investor: 'Investor',
    role_shark: 'Shark AI',

    unit_boat: 'Kapal',
    unit_drying: 'Pengeringan',
    unit_processing: 'Pengolahan',
    unit_cold_storage: 'Penyimpanan Dingin',
    unit_fishmeal: 'Tepung Ikan',
    unit_sorting: 'Penyortiran',

    ops_hub: 'Operations Hub',
    ops_record_receiving: 'Catat Penerimaan',
    ops_record_production: 'Catat Produksi',
    ops_record_transfer: 'Catat Transfer',
    ops_record_waste: 'Catat Kerugian',
    ops_trip_expense: 'Biaya Perjalanan',
    ops_sale: 'Penjualan',
    ops_price_customer: 'Harga / Pelanggan',
    ops_sku: 'ID SKU',
    ops_qty: 'Kuantitas (Kg)',
    ops_cost: 'Biaya/Kg (IDR)',
    ops_supplier: 'Nama Pemasok',
    ops_vessel: 'Nama Kapal',
    ops_input_batch: 'ID Batch Input',
    ops_output_sku: 'SKU Output',
    ops_output_qty: 'Qty Output (Kg)',
    ops_processing_cost: 'Biaya Pengolahan',
    ops_from_location: 'Dari Lokasi',
    ops_to_location: 'Ke Lokasi',
    ops_from_unit: 'Dari Unit',
    ops_to_unit: 'Ke Unit',
    ops_batch_id: 'ID Batch',
    ops_amount: 'Jumlah (IDR)',
    ops_memo: 'Memo / Deskripsi',
    ops_reason: 'Alasan',
    ops_customer: 'Nama Pelanggan',
    ops_price: 'Harga/Kg (IDR)',
    ops_payment: 'Tipe Pembayaran',

    fin_center: 'Finance Center',
    fin_ledger: 'Buku Besar',
    fin_balance: 'Saldo',
    fin_trial_balance: 'Neraca Saldo',
    fin_pnl: 'Laporan Laba Rugi',
    fin_inventory_value: 'Nilai Inventori',
    fin_moving_average: 'Rata-rata Bergerak',
    fin_partner_balance: 'Saldo Mitra',
    fin_revenue: 'Pendapatan',
    fin_cogs: 'HPP (COGS)',
    fin_expenses: 'Biaya Operasional',
    fin_gross_profit: 'Laba Kotor',
    fin_net_income: 'Laba Bersih',
    fin_account: 'Akun',
    fin_total_value: 'Nilai Total',

    shark_dashboard: 'Shark AI Dashboard',
    shark_alerts: 'Peringatan Shark',
    shark_risk_summary: 'Ringkasan Risiko',
    shark_close_alert: 'Tutup Peringatan',
    shark_resolution: 'Catatan Resolusi',
    shark_severity: 'Tingkat Keparahan',
    shark_status: 'Status',
    shark_detected: 'Terdeteksi',

    admin_panel: 'System Admin Panel',
    admin_bootstrap: 'Bootstrap Sistem',
    admin_seed: 'Seed Data Tes',
    admin_users: 'Daftar Pengguna',
    admin_run: 'Jalankan',
    admin_result: 'Hasil',

    trace_verify: 'Verifikasi Produk',
    trace_scan: 'Tempel ID Batch untuk Verifikasi',
    trace_public_info: 'Informasi Publik',
    trace_timeline: 'Riwayat Batch',

    auth_welcome: 'Selamat Datang Kembali',
    auth_signin: 'Masuk ke akun Anda',
    auth_signout: 'Keluar',
    auth_email: 'Alamat Email',
    auth_password: 'Kata Sandi',
    auth_role: 'Peran',
    auth_unauthorized: 'Akses Tidak Diizinkan',

    ops_location_unit: 'Lokasi / Unit',
    ops_sku_qty: 'SKU / Qty',
    ops_cost_source: 'Biaya / Sumber',
    ops_batch_sku: 'Batch Input / SKU Output',
    ops_qty_cost: 'Qty Output / Biaya',
    ops_from: 'Dari',
    ops_to: 'Ke',
    ops_scope: 'Cakupan',
    ops_details: 'Detail',
    ops_spoilage: 'Pembusukan',
    ops_drier_loss: 'Kehilangan Pengering',
    ops_sorting_error: 'Kesalahan Sortir',
    ops_wallet_transfer: 'Transfer Dompet',
    fin_location: 'Lokasi',
    fin_unit: 'Unit',
    fin_debit: 'Debit',
    fin_credit: 'Kredit',
    fin_net_balance: 'Saldo Bersih',
    fin_account_id: 'ID Akun',
    fin_loc_short: 'Lok',
    fin_sku_id: 'ID SKU',
    shark_realtime: 'Deteksi kecurangan waktu nyata dan pemantauan risiko operasional',
    shark_update: 'Pembaruan',
    shark_global_risk: 'INDEKS RISIKO GLOBAL',
    shark_active_alerts: 'Peringatan Aktif',
    shark_detection: 'Deteksi',
    shark_no_alerts: 'Tidak ada peringatan aktif. Operasi stabil.',
    shark_resolved: 'DISELESAIKAN',
    shark_confirm_res: 'Konfirmasi Resolusi',
    shark_explain_closure: 'Jelaskan mengapa peringatan ini ditutup...',
    trace_check_origin: 'Periksa asal dan riwayat batch seafood Anda',
    trace_sku: 'SKU',
    trace_status: 'Status',
    trace_loc: 'Lokasi',
    trace_unit: 'Unit',
    boot_title: 'Bootstrap & Data Tes OPS V3',
    boot_step1: 'Langkah 1: Bootstrap (Buat Admin Pertama)',
    boot_step1_desc: 'Ini akan membuat akun admin CEO: ceo@oceanpearlseafood.com / OceanPearl2026!',
    boot_step2: 'Langkah 2: Seed Test Pack (Setelah Bootstrap)',
    boot_step2_desc: 'Ini akan membuat semua data tes: lokasi, unit, mitra, spesies, produk, dan pengguna tes.',
    boot_step2_note: 'Anda harus masuk sebagai CEO/admin untuk menjalankan ini.',
    boot_instructions: 'Instruksi:',
    boot_run: 'Jalankan Bootstrap',
    boot_run_seed: 'Jalankan Seed Test Pack'
  },
  en: {
    common_save: 'Save',
    common_cancel: 'Cancel',
    common_delete: 'Delete',
    common_edit: 'Edit',
    common_add: 'Add',
    common_search: 'Search',
    common_filter: 'Filter',
    common_export: 'Export',
    common_loading: 'Loading...',
    common_error: 'Error',
    common_success: 'Success',
    common_back: 'Back',
    common_copy: 'Copy',
    common_idempotency: 'Idempotency Key',
    common_info: 'Information',

    nav_dashboard: 'Dashboard',
    nav_operations: 'Operations',
    nav_finance: 'Finance',
    nav_inventory: 'Inventory',
    nav_reports: 'Reports',
    nav_settings: 'Settings',
    nav_logout: 'Logout',
    nav_admin: 'System Admin',
    nav_shark: 'Shark AI',
    nav_trace: 'Traceability',

    role_admin: 'Administrator',
    role_ceo: 'CEO',
    role_location_manager: 'Location Manager',
    role_unit_operator: 'Unit Operator',
    role_finance_officer: 'Finance Officer',
    role_investor: 'Investor',
    role_shark: 'Shark AI',

    unit_boat: 'Boat',
    unit_drying: 'Drying',
    unit_processing: 'Processing',
    unit_cold_storage: 'Cold Storage',
    unit_fishmeal: 'Fishmeal',
    unit_sorting: 'Sorting',

    ops_hub: 'Operations Hub',
    ops_record_receiving: 'Record Receiving',
    ops_record_production: 'Record Production',
    ops_record_transfer: 'Record Transfer',
    ops_record_waste: 'Record Waste',
    ops_trip_expense: 'Trip Expense',
    ops_sale: 'Sale',
    ops_price_customer: 'Price / Customer',
    ops_sku: 'SKU ID',
    ops_qty: 'Quantity (Kg)',
    ops_cost: 'Cost/Kg (IDR)',
    ops_supplier: 'Supplier Name',
    ops_vessel: 'Vessel Name',
    ops_input_batch: 'Input Batch ID',
    ops_output_sku: 'Output SKU',
    ops_output_qty: 'Output Qty (Kg)',
    ops_processing_cost: 'Processing Cost',
    ops_from_location: 'From Location',
    ops_to_location: 'To Location',
    ops_from_unit: 'From Unit',
    ops_to_unit: 'To Unit',
    ops_batch_id: 'Batch ID',
    ops_amount: 'Amount (IDR)',
    ops_memo: 'Memo / Description',
    ops_reason: 'Reason',
    ops_customer: 'Customer Name',
    ops_price: 'Price/Kg (IDR)',
    ops_payment: 'Payment Type',

    fin_center: 'Finance Center',
    fin_ledger: 'Ledger',
    fin_balance: 'Balance',
    fin_trial_balance: 'Trial Balance',
    fin_pnl: 'P&L Summary',
    fin_inventory_value: 'Inventory Value',
    fin_moving_average: 'Moving Average',
    fin_partner_balance: 'Partner Balance',
    fin_revenue: 'Revenue',
    fin_cogs: 'COGS',
    fin_expenses: 'Expenses',
    fin_gross_profit: 'Gross Profit',
    fin_net_income: 'Net Income',
    fin_account: 'Account',
    fin_total_value: 'Total Value',

    shark_dashboard: 'Shark AI Dashboard',
    shark_alerts: 'Shark Alerts',
    shark_risk_summary: 'Risk Summary',
    shark_close_alert: 'Close Alert',
    shark_resolution: 'Resolution Note',
    shark_severity: 'Severity',
    shark_status: 'Status',
    shark_detected: 'Detected',

    admin_panel: 'System Admin Panel',
    admin_bootstrap: 'System Bootstrap',
    admin_seed: 'Seed Test Data',
    admin_users: 'User Directory',
    admin_run: 'Run',
    admin_result: 'Result',

    trace_verify: 'Product Verification',
    trace_scan: 'Paste Batch ID for Verification',
    trace_public_info: 'Public Information',
    trace_timeline: 'Batch Timeline',

    auth_welcome: 'Welcome Back',
    auth_signin: 'Sign in to your account',
    auth_signout: 'Sign Out',
    auth_email: 'Email Address',
    auth_password: 'Password',
    auth_role: 'Role',
    auth_unauthorized: 'Unauthorized Access',

    ops_location_unit: 'Location / Unit',
    ops_sku_qty: 'SKU / Qty',
    ops_cost_source: 'Cost / Source',
    ops_batch_sku: 'Input Batch / Output SKU',
    ops_qty_cost: 'Output Qty / Post Cost',
    ops_from: 'From',
    ops_to: 'To',
    ops_scope: 'Scope',
    ops_details: 'Details',
    ops_spoilage: 'Spoilage',
    ops_drier_loss: 'Drier Loss',
    ops_sorting_error: 'Sorting Error',
    ops_wallet_transfer: 'Wallet Transfer',
    fin_location: 'Location',
    fin_unit: 'Unit',
    fin_debit: 'Debit',
    fin_credit: 'Credit',
    fin_net_balance: 'Net Balance',
    fin_account_id: 'Account ID',
    fin_loc_short: 'Loc',
    fin_sku_id: 'SKU ID',
    shark_realtime: 'Real-time fraud detection and operational risk monitoring',
    shark_update: 'Update',
    shark_global_risk: 'GLOBAL RISK INDEX',
    shark_active_alerts: 'Active Alerts',
    shark_detection: 'Detection',
    shark_no_alerts: 'No active alerts detected. Operations are stable.',
    shark_resolved: 'RESOLVED',
    shark_confirm_res: 'Confirm Resolution',
    shark_explain_closure: 'Explain why this alert is being closed...',
    trace_check_origin: 'Check the origin and history of your seafood batch',
    trace_sku: 'SKU',
    trace_status: 'Status',
    trace_loc: 'Location',
    trace_unit: 'Unit',
    boot_title: 'OPS V3 Bootstrap & Test Data',
    boot_step1: 'Step 1: Bootstrap (Create First Admin)',
    boot_step1_desc: 'This creates the CEO admin account: ceo@oceanpearlseafood.com / OceanPearl2026!',
    boot_step2: 'Step 2: Seed Test Pack (After Bootstrap)',
    boot_step2_desc: 'This creates all test data: locations, units, partners, species, products, and test users.',
    boot_step2_note: 'You must be signed in as the CEO/admin to run this.',
    boot_instructions: 'Instructions:',
    boot_run: 'Run Bootstrap',
    boot_run_seed: 'Run Seed Test Pack'
  }
};

export function t(key: keyof TranslationKeys, lang: Language = defaultLanguage): string {
  return translations[lang][key] || key;
}

export function getCurrentLanguage(): Language {
  const stored = localStorage.getItem('language');
  return (stored === 'id' || stored === 'en') ? stored : defaultLanguage;
}

export function setCurrentLanguage(lang: Language): void {
  localStorage.setItem('language', lang);
  window.location.reload(); // Reload to apply language change
}
