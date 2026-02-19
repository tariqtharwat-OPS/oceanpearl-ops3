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
    auth_unauthorized: 'Akses Tidak Diizinkan'
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
    auth_unauthorized: 'Unauthorized Access'
  }
};

export function t(key: keyof TranslationKeys, lang: Language = defaultLanguage): string {
  return translations[lang][key] || key;
}

export function getCurrentLanguage(): Language {
  const stored = localStorage.getItem('ops_language');
  return (stored === 'id' || stored === 'en') ? stored : defaultLanguage;
}

export function setCurrentLanguage(lang: Language): void {
  localStorage.setItem('ops_language', lang);
  window.location.reload(); // Reload to apply language change
}
