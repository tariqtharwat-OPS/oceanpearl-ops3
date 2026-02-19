/**
 * OPS V3 - Finance Center
 * Reports: Trial Balance, P&L, Inventory Summary, Ledger Lookup
 */

import { useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase';
import { getCurrentLanguage, t, type Language } from '../i18n';

interface UserProfile {
  email: string;
  role: string;
  allowedLocationIds: string[];
  allowedUnitIds: string[];
}

interface FinanceProps {
  userProfile: UserProfile | null;
}

const Finance = ({ userProfile }: FinanceProps) => {
  const [language] = useState<Language>(getCurrentLanguage());
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<{ type: string; data: any } | null>(null);

  const [scope, setScope] = useState({
    locationId: userProfile?.allowedLocationIds?.[0] || 'LOC-KAI',
    unitId: userProfile?.allowedUnitIds?.[0] || 'UNIT-BOAT-1'
  });

  const [ledgerQuery, setLedgerQuery] = useState({
    accountId: 'INV_RAW_FISH',
    locationId: userProfile?.allowedLocationIds?.[0] || 'LOC-KAI',
    unitId: userProfile?.allowedUnitIds?.[0] || 'UNIT-BOAT-1'
  });

  const [valuationQuery, setValuationQuery] = useState({
    locationId: userProfile?.allowedLocationIds?.[0] || 'LOC-KAI',
    unitId: userProfile?.allowedUnitIds?.[0] || 'UNIT-BOAT-1',
    skuId: 'ANCH-FRESH'
  });

  const fetchReport = async (name: string, data: any, label: string) => {
    setLoading(true);
  setReport(null);
  try {
    const callable = httpsCallable(functions, name);
    const res = await callable(data);
    setReport({ type: label, data: res.data });
  } catch (error: any) {
    alert(`Error: ${error.message}`);
  } finally {
    setLoading(false);
  }
};

return (
  <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
    <h1 style={{ color: '#0f172a', marginBottom: '2rem' }}>{t('fin_center', language)}</h1>

    {/* Global Scope Selector */}
    <div style={{ background: 'white', padding: '1.5rem', borderRadius: '1rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', marginBottom: '2rem', display: 'flex', gap: '2rem', alignItems: 'center' }}>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <label style={{ fontWeight: '700', fontSize: '0.875rem' }}>Location:</label>
        <input type="text" value={scope.locationId} onChange={e => setScope({...scope, locationId: e.target.value})} style={inputStyle} />
      </div>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <label style={{ fontWeight: '700', fontSize: '0.875rem' }}>Unit:</label>
        <input type="text" value={scope.unitId} onChange={e => setScope({...scope, unitId: e.target.value})} style={inputStyle} />
      </div>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button onClick={() => fetchReport('reporting-getTrialBalance', scope, t('fin_trial_balance', language))} disabled={loading} style={btnStyle}>{t('fin_trial_balance', language)}</button>
      <button onClick={() => fetchReport('reporting-getPnLSummary', scope, t('fin_pnl', language))} disabled={loading} style={btnStyle}>{t('fin_pnl', language)}</button>
    <button onClick={() => fetchReport('reporting-getInventorySummary', scope, t('nav_inventory', language))} disabled={loading} style={btnStyle}>{t('nav_inventory', language)}</button>
        </div >
      </div >

  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
    {/* Ledger Lookup */}
    <div style={cardStyle}>
      <h3>{t('fin_ledger', language)} Lookup</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', marginBottom: '1rem' }}>
        <input type="text" placeholder="Account ID" value={ledgerQuery.accountId} onChange={e => setLedgerQuery({...ledgerQuery, accountId: e.target.value})} style={inputStyle} />
        <input type="text" placeholder="Loc" value={ledgerQuery.locationId} onChange={e => setLedgerQuery({...ledgerQuery, locationId: e.target.value})} style={inputStyle} />
        <input type="text" placeholder="Unit" value={ledgerQuery.unitId} onChange={e => setLedgerQuery({...ledgerQuery, unitId: e.target.value})} style={inputStyle} />
      </div>
      <button onClick={() => fetchReport('ledger-getLedgerBalance', ledgerQuery, t('fin_balance', language))} disabled={loading} style={{ ...btnStyle, width: '100%' }}>{t('common_search', language)}</button>
  </div>

{/* Inventory Specific Lookup */ }
<div style={cardStyle}>
  <h3>{t('fin_inventory_value', language)} Lookup</h3>
  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', marginBottom: '1rem' }}>
    <input type="text" placeholder="Loc" value={valuationQuery.locationId} onChange={e => setValuationQuery({...valuationQuery, locationId: e.target.value})} style={inputStyle} />
    <input type="text" placeholder="Unit" value={valuationQuery.unitId} onChange={e => setValuationQuery({...valuationQuery, unitId: e.target.value})} style={inputStyle} />
    <input type="text" placeholder="SKU ID" value={valuationQuery.skuId} onChange={e => setValuationQuery({...valuationQuery, skuId: e.target.value})} style={inputStyle} />
  </div>
  <button onClick={() => fetchReport('inventory-getInventoryValuation', valuationQuery, t('fin_inventory_value', language))} disabled={loading} style={{ ...btnStyle, width: '100%' }}>{t('common_search', language)}</button>
        </div >
      </div >

  {/* REPORT DISPLAY AREA */ }
{report &&(
  <div style={{ background: 'white', padding: '2rem', borderRadius: '1rem', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', border: '1px solid #f1f5f9' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
      <h2 style={{ margin: 0 }}>{report.type}</h2>
      <button onClick={() => setReport(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.5rem' }}>×</button>
  </div>
          
          { report.type === t('fin_trial_balance', language) &&<TrialBalanceTable balances = {report.data.balances } language = { language } />}
{ report.type === t('fin_pnl', language) && < PnLSummary data = { report.data } language = { language } />}
{ report.type === t('nav_inventory', language) && < InventoryTable items = { report.data.items } language = { language } />}
{ report.type === t('fin_balance', language) && < pre > { JSON.stringify(report.data, null, 2) }</pre >}
{ report.type === t('fin_inventory_value', language) && < pre > { JSON.stringify(report.data, null, 2) }</pre >}
        </div >
      )}
    </div >
  );
};

const TrialBalanceTable = ({ balances, language }: { balances: any[], language: Language }) => (
  <table style={tableStyle}>
    <thead>
      <tr style={thRowStyle}>
        <th style={tdStyle}>{t('fin_account', language)}</th>
        <th style={tdStyle}>Debit</th>
        <th style={tdStyle}>Credit</th>
        <th style={tdStyle}>Net Balance</th>
      </tr>
    </thead>
    <tbody>
      {balances.map((b, i) => (
      <tr key={i} style={i % 2 === 0 ? {} : { background: '#f8fafc' }}>
        <td style={tdStyle}><strong>{b.accountId}</strong> <br /><span style={{ fontSize: '0.75rem', color: '#64748b' }}>{b.category}</span></td>
        <td style={tdStyle}>{b.debitTotal?.toLocaleString()}</td>
        <td style={tdStyle}>{b.creditTotal?.toLocaleString()}</td>
        <td style={{ ...tdStyle, fontWeight: '700', color: b.balance < 0 ? '#ef4444' : '#10b981'}}>{b.balance?.toLocaleString()}</td>
    </tr>
      ))}
  </tbody>
  </table >
);

const PnLSummary = ({ data, language }: { data: any, language: Language }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '600px' }}>
    <PnLRow label={t('fin_revenue', language)} value={data.totalRevenue} />
    <PnLRow label={t('fin_cogs', language)} value={data.totalCOGS} isNegative />
    <hr />
    <PnLRow label={t('fin_gross_profit', language)} value={data.grossProfit} isBold />
    <PnLRow label={t('fin_expenses', language)} value={data.totalExpenses} isNegative />
    <hr />
    <PnLRow label={t('fin_net_income', language)} value={data.netIncome} isBold highlight />
  </div>
);

const PnLRow = ({ label, value, isNegative, isBold, highlight }: any) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: isBold ? '1.25rem' : '1.125rem', fontWeight: isBold ? '800' : '500', color: highlight ? '#10b981' : '#0f172a' }}>
    <span>{label}</span>
    <span>{isNegative ? '-' : ''} IDR {Math.abs(value).toLocaleString()}</span>
  </div>
);

const InventoryTable = ({ items, language }: { items: any[], language: Language }) => (
  <table style={tableStyle}>
    <thead>
      <tr style={thRowStyle}>
        <th style={tdStyle}>SKU</th>
        <th style={tdStyle}>{t('ops_qty', language)}</th>
        <th style={tdStyle}>{t('fin_moving_average', language)}</th>
        <th style={tdStyle}>{t('fin_total_value', language)}</th>
      </tr>
    </thead>
    <tbody>
      {items.map((it, i) => (
      <tr key={i} style={i % 2 === 0 ? {} : { background: '#f8fafc' }}>
        <td style={tdStyle}><strong>{it.skuId}</strong></td>
        <td style={tdStyle}>{it.qtyKg?.toFixed(2)} kg</td>
        <td style={tdStyle}>IDR {it.avgCostIDR?.toLocaleString()}</td>
        <td style={{ ...tdStyle, fontWeight: '700' }}>IDR {it.inventoryValue?.toLocaleString()}</td>
      </tr>
      ))}
    </tbody>
  </table>
);

const cardStyle: React.CSSProperties = { background: 'white', padding: '1.5rem', borderRadius: '1rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', border: '1px solid #f1f5f9' };
const inputStyle: React.CSSProperties = { padding: '0.6rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem', outline: 'none' };
const btnStyle: React.CSSProperties = { padding: '0.6rem 1.2rem', background: '#0f172a', color: 'white', border: 'none', borderRadius: '0.5rem', fontWeight: '600', cursor: 'pointer' };
const tableStyle: React.CSSProperties = { width: '100%', borderCollapse: 'collapse', textAlign: 'left' };
const thRowStyle: React.CSSProperties = { borderBottom: '2px solid #e2e8f0', background: '#f8fafc' };
const tdStyle: React.CSSProperties = { padding: '1rem', borderBottom: '1px solid #f1f5f9' };

export default Finance;
