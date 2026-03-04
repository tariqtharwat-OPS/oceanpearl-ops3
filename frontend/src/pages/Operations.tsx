/**
 * OPS V3 - Operations Hub
 * Full workflow support: Receiving, Production, Transfer, Waste, Trip Expense
 */

import { useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase';
import { getCurrentLanguage, t, type Language } from '../i18n';

// Injected CSS for printing support
const PrintStyles = () => (
  <style>{`
    @media print {
      body * {
        visibility: hidden;
      }
      .print-only, .print-only * {
        visibility: visible;
      }
      .print-only {
        display: block !important;
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        margin: 0;
        padding: 0;
      }
      .no-print {
        display: none !important;
      }
    }
  `}</style>
);

interface UserProfile {
  email: string;
  role: string;
  allowedLocationIds: string[];
  allowedUnitIds: string[];
}

interface OperationsProps {
  userProfile: UserProfile | null;
}

const Operations = ({ userProfile }: OperationsProps) => {
  const [language] = useState<Language>(getCurrentLanguage());
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ type: string; data?: any; error?: string } | null>(null);

  // Helper for auto-generating idempotency keys
  const getIK = (prefix: string) => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  // Form States
  const [receiving, setReceiving] = useState({
    locationId: userProfile?.allowedLocationIds?.[0] || '',
    unitId: userProfile?.allowedUnitIds?.[0] || '',
    skuId: 'ANCH-FRESH',
    qtyKg: '',
    unitCostIDR: '',
    supplierName: '',
    vesselName: ''
  });

  const [production, setProduction] = useState({
    locationId: userProfile?.allowedLocationIds?.[0] || '',
    unitId: userProfile?.allowedUnitIds?.[0] || '',
    inputBatchId: '',
    outputSkuId: 'ANCH-DRY-MED-A',
    outputQtyKg: '',
    processingCostIDR: '0'
  });

  const [transfer, setTransfer] = useState({
    fromLocationId: userProfile?.allowedLocationIds?.[0] || '',
    fromUnitId: userProfile?.allowedUnitIds?.[0] || '',
    toLocationId: '',
    toUnitId: '',
    batchId: ''
  });

  const [waste, setWaste] = useState({
    locationId: userProfile?.allowedLocationIds?.[0] || '',
    unitId: userProfile?.allowedUnitIds?.[0] || '',
    batchId: '',
    qtyKg: '',
    reason: 'SPOILAGE'
  });

  const [expense, setExpense] = useState({
    locationId: userProfile?.allowedLocationIds?.[0] || '',
    unitId: userProfile?.allowedUnitIds?.[0] || '',
    amountIDR: '',
    memo: ''
  });

  const [walletTransfer, setWalletTransfer] = useState({
    fromLocationId: '',
    fromUnitId: '',
    toLocationId: '',
    toUnitId: '',
    amountIDR: '',
    memo: ''
  });

  const [tripStart, setTripStart] = useState({
    locationId: userProfile?.allowedLocationIds?.[0] || '',
    unitId: userProfile?.allowedUnitIds?.[0] || '',
    vesselName: 'Boat Faris'
  });

  const [sale, setSale] = useState({
    locationId: userProfile?.allowedLocationIds?.[0] || '',
    unitId: userProfile?.allowedUnitIds?.[0] || '',
    skuId: 'ANCH-DRY-MED-A',
    qty: '',
    unitPriceIDR: '',
    customerName: ''
  });

  const runWorkflow = async (name: string, data: any, prefix: string) => {
    setLoading(true);
    setResult(null);
    try {
      const callable = httpsCallable(functions, `workflows-${name}`);
      const ik = getIK(prefix);
      const res = await callable({ ...data, idempotencyKey: ik });
      setResult({ type: name, data: res.data });
    } catch (error: any) {
      setResult({ type: `${name} Error`, error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert(t('common_success', language));
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      <PrintStyles />
      <h1 style={{ color: '#0f172a', marginBottom: '2rem' }}>{t('ops_hub', language)}</h1>

      {result && (
        <div style={{
          marginBottom: '2rem',
          padding: '1.5rem',
          background: result.error ? '#fef2f2' : '#f0fdf4',
          borderRadius: '1rem',
          border: `1px solid ${result.error ? '#fee2e2' : '#dcfce7'}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start'
        }}>
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: '0 0 0.5rem 0', color: result.error ? '#991b1b' : '#166534' }}>{result.type} {result.error ? t('common_error', language) : t('common_success', language)}</h3>
            <pre style={{ fontSize: '0.875rem', overflow: 'auto' }}>{JSON.stringify(result.error || result.data, null, 2)}</pre>
            {result.data?.batchId && (
              <div style={{ marginTop: '0.5rem' }}>
                <strong>Batch ID:</strong> {result.data.batchId}
                <button onClick={() => copyToClipboard(result.data.batchId)} style={{ marginLeft: '0.5rem', padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}>{t('common_copy', language)}</button>
              </div>
            )}
            {result.data?.tripId && (
              <div style={{ marginTop: '0.5rem' }}>
                <strong>Trip ID:</strong> {result.data.tripId}
                <button onClick={() => copyToClipboard(result.data.tripId)} style={{ marginLeft: '0.5rem', padding: '0.2rem 0.5rem', fontSize: '0.75rem' }} className="no-print">{t('common_copy', language)}</button>
              </div>
            )}

            {result.type === 'recordReceiving' && (
              <div style={{ marginTop: '1rem' }} className="no-print">
                <button onClick={() => window.print()} style={{ padding: '0.5rem 1rem', background: '#2563eb', color: 'white', borderRadius: '0.25rem', border: 'none', cursor: 'pointer' }}>Print Receiving Slip</button>
              </div>
            )}
          </div>
          <button onClick={() => setResult(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.25rem' }} className="no-print">×</button>

          {/* Printable Receipt Area */}
          {result.type === 'recordReceiving' && (
            <div className="print-only" style={{ display: 'none', position: 'absolute', top: 0, left: 0, width: '100%', padding: '2rem', background: 'white', color: 'black' }}>
              <div style={{ display: 'flex', alignItems: 'center', borderBottom: '2px solid black', paddingBottom: '1rem', marginBottom: '1rem' }}>
                <img src="/favicon.png" alt="Ocean Pearl Logo" style={{ width: '50px', height: '50px', marginRight: '1rem' }} />
                <h2>Ocean Pearl Seafood - Receiving Slip</h2>
              </div>
              <p><strong>Date:</strong> {new Date().toLocaleDateString('en-US')}</p>
              <p><strong>Batch ID:</strong> {result.data?.batchId}</p>
              <p><strong>Location ID:</strong> {receiving.locationId}</p>
              <p><strong>Unit ID:</strong> {receiving.unitId}</p>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid black' }}>
                    <th style={{ textAlign: 'left', padding: '0.5rem' }}>SKU</th>
                    <th style={{ textAlign: 'right', padding: '0.5rem' }}>Quantity (KG)</th>
                    <th style={{ textAlign: 'right', padding: '0.5rem' }}>Unit Price (IDR)</th>
                    <th style={{ textAlign: 'right', padding: '0.5rem' }}>Total Value (IDR)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ padding: '0.5rem' }}>{receiving.skuId}</td>
                    <td style={{ textAlign: 'right', padding: '0.5rem' }}>{receiving.qtyKg}</td>
                    <td style={{ textAlign: 'right', padding: '0.5rem' }}>{Number(receiving.unitCostIDR).toLocaleString('en-US')}</td>
                    <td style={{ textAlign: 'right', padding: '0.5rem' }}>{(Number(receiving.qtyKg) * Number(receiving.unitCostIDR)).toLocaleString('en-US')}</td>
                  </tr>
                </tbody>
              </table>
              <div style={{ marginTop: '2rem', borderTop: '1px solid black', paddingTop: '1rem' }}>
                <strong>Supplier / Vessel:</strong> {receiving.supplierName || receiving.vesselName || 'OWN CATCH'}
              </div>
            </div>
          )}
        </div >
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>

        {/* 1. RECORD RECEIVING */}
        <WorkflowCard title={t('ops_record_receiving', language)} onSubmit={() => runWorkflow('recordReceiving', { ...receiving, qtyKg: Number(receiving.qtyKg), unitCostIDR: Number(receiving.unitCostIDR) }, 'RECV')} loading={loading} language={language}>
          <FormGroup label={t('ops_location_unit', language)}>
            <input type="text" placeholder={t('fin_location', language)} value={receiving.locationId} onChange={e => setReceiving({ ...receiving, locationId: e.target.value })} style={inputStyle} />
            <input type="text" placeholder={t('fin_unit', language)} value={receiving.unitId} onChange={e => setReceiving({ ...receiving, unitId: e.target.value })} style={inputStyle} />
          </FormGroup>
          <FormGroup label={t('ops_sku_qty', language)}>
            <input type="text" placeholder={t('ops_sku', language)} value={receiving.skuId} onChange={e => setReceiving({ ...receiving, skuId: e.target.value })} style={inputStyle} />
            <input type="number" placeholder={t('ops_qty', language)} value={receiving.qtyKg} onChange={e => setReceiving({ ...receiving, qtyKg: e.target.value })} style={inputStyle} />
          </FormGroup>
          <FormGroup label={t('ops_cost_source', language)}>
            <input type="number" placeholder={t('ops_cost', language)} value={receiving.unitCostIDR} onChange={e => setReceiving({ ...receiving, unitCostIDR: e.target.value })} style={inputStyle} />
            <input type="text" placeholder={t('ops_supplier', language)} value={receiving.supplierName} onChange={e => setReceiving({ ...receiving, supplierName: e.target.value })} style={inputStyle} />
          </FormGroup>
        </WorkflowCard>

        {/* 2. RECORD PRODUCTION */}
        <WorkflowCard title={t('ops_record_production', language)} onSubmit={() => runWorkflow('recordProduction', { ...production, outputQtyKg: Number(production.outputQtyKg), processingCostIDR: Number(production.processingCostIDR) }, 'PROD')} loading={loading} language={language} >
          <FormGroup label={t('ops_location_unit', language)}>
            <input type="text" placeholder={t('fin_location', language)} value={production.locationId} onChange={e => setProduction({ ...production, locationId: e.target.value })} style={inputStyle} />
            <input type="text" placeholder={t('fin_unit', language)} value={production.unitId} onChange={e => setProduction({ ...production, unitId: e.target.value })} style={inputStyle} />
          </FormGroup>
          <FormGroup label={t('ops_batch_sku', language)}>
            <input type="text" placeholder={t('ops_input_batch', language)} value={production.inputBatchId} onChange={e => setProduction({ ...production, inputBatchId: e.target.value })} style={inputStyle} />
            <input type="text" placeholder={t('ops_output_sku', language)} value={production.outputSkuId} onChange={e => setProduction({ ...production, outputSkuId: e.target.value })} style={inputStyle} />
          </FormGroup>
          <FormGroup label={t('ops_qty_cost', language)}>
            <input type="number" placeholder={t('ops_output_qty', language)} value={production.outputQtyKg} onChange={e => setProduction({ ...production, outputQtyKg: e.target.value })} style={inputStyle} />
            <input type="number" placeholder={t('ops_processing_cost', language)} value={production.processingCostIDR} onChange={e => setProduction({ ...production, processingCostIDR: e.target.value })} style={inputStyle} />
          </FormGroup>
        </WorkflowCard >

        {/* 3. RECORD TRANSFER */}
        < WorkflowCard title={t('ops_record_transfer', language)} onSubmit={() => runWorkflow('recordTransfer', transfer, 'XFER')} loading={loading} language={language} >
          <FormGroup label={t('ops_from', language)}>
            <input type="text" placeholder={t('fin_location', language)} value={transfer.fromLocationId} onChange={e => setTransfer({ ...transfer, fromLocationId: e.target.value })} style={inputStyle} />
            <input type="text" placeholder={t('fin_unit', language)} value={transfer.fromUnitId} onChange={e => setTransfer({ ...transfer, fromUnitId: e.target.value })} style={inputStyle} />
          </FormGroup>
          <FormGroup label={t('ops_to', language)}>
            <input type="text" placeholder={t('fin_location', language)} value={transfer.toLocationId} onChange={e => setTransfer({ ...transfer, toLocationId: e.target.value })} style={inputStyle} />
            <input type="text" placeholder={t('fin_unit', language)} value={transfer.toUnitId} onChange={e => setTransfer({ ...transfer, toUnitId: e.target.value })} style={inputStyle} />
          </FormGroup>
          <FormGroup label={t('ops_batch_id', language)}>
            <input type="text" placeholder={t('ops_batch_id', language)} value={transfer.batchId} onChange={e => setTransfer({ ...transfer, batchId: e.target.value })} style={{ ...inputStyle, width: '100%' }} />
          </FormGroup>
        </WorkflowCard >

        {/* 4. RECORD WASTE */}
        < WorkflowCard title={t('ops_record_waste', language)} onSubmit={() => runWorkflow('recordWaste', { ...waste, qtyKg: Number(waste.qtyKg) }, 'WSTE')} loading={loading} language={language} >
          <FormGroup label={t('ops_location_unit', language)}>
            <input type="text" placeholder={t('fin_location', language)} value={waste.locationId} onChange={e => setWaste({ ...waste, locationId: e.target.value })} style={inputStyle} />
            <input type="text" placeholder={t('fin_unit', language)} value={waste.unitId} onChange={e => setWaste({ ...waste, unitId: e.target.value })} style={inputStyle} />
          </FormGroup>
          <FormGroup label={t('ops_batch_sku', language)}>
            <input type="text" placeholder={t('ops_batch_id', language)} value={waste.batchId} onChange={e => setWaste({ ...waste, batchId: e.target.value })} style={inputStyle} />
            <input type="number" placeholder={t('ops_qty', language)} value={waste.qtyKg} onChange={e => setWaste({ ...waste, qtyKg: e.target.value })} style={inputStyle} />
          </FormGroup>
          <FormGroup label={t('ops_reason', language)}>
            <select value={waste.reason} onChange={e => setWaste({ ...waste, reason: e.target.value })} style={{ ...inputStyle, width: '100%' }}>
              <option value="SPOILAGE">{t('ops_spoilage', language)}</option>
              <option value="DRIER_LOSS">{t('ops_drier_loss', language)}</option>
              <option value="SORTING_ERROR">{t('ops_sorting_error', language)}</option>
            </select>
          </FormGroup >
        </WorkflowCard >

        {/* 5. TRIP EXPENSE */}
        < WorkflowCard title={t('ops_trip_expense', language)} onSubmit={() => runWorkflow('recordTripExpense', { ...expense, amountIDR: Number(expense.amountIDR) }, 'TRIP')} loading={loading} language={language} >
          <FormGroup label={t('ops_scope', language)}>
            <input type="text" placeholder={t('fin_location', language)} value={expense.locationId} onChange={e => setExpense({ ...expense, locationId: e.target.value })} style={inputStyle} />
            <input type="text" placeholder={t('fin_unit', language)} value={expense.unitId} onChange={e => setExpense({ ...expense, unitId: e.target.value })} style={inputStyle} />
          </FormGroup>
          <FormGroup label={t('ops_details', language)}>
            <input type="number" placeholder={t('ops_amount', language)} value={expense.amountIDR} onChange={e => setExpense({ ...expense, amountIDR: e.target.value })} style={inputStyle} />
            <input type="text" placeholder={t('ops_memo', language)} value={expense.memo} onChange={e => setExpense({ ...expense, memo: e.target.value })} style={inputStyle} />
          </FormGroup>
        </WorkflowCard >

        {/* 6. WALLET TRANSFER */}
        < WorkflowCard title={t('ops_wallet_transfer', language)} onSubmit={() => runWorkflow('recordWalletTransfer', { ...walletTransfer, amountIDR: Number(walletTransfer.amountIDR) }, 'WTRF')} loading={loading} language={language} >
          <FormGroup label={t('ops_from', language)}>
            <input type="text" placeholder={t('fin_location', language)} value={walletTransfer.fromLocationId} onChange={e => setWalletTransfer({ ...walletTransfer, fromLocationId: e.target.value })} style={inputStyle} />
            <input type="text" placeholder={t('fin_unit', language)} value={walletTransfer.fromUnitId} onChange={e => setWalletTransfer({ ...walletTransfer, fromUnitId: e.target.value })} style={inputStyle} />
          </FormGroup>
          <FormGroup label={t('ops_to', language)}>
            <input type="text" placeholder={t('fin_location', language)} value={walletTransfer.toLocationId} onChange={e => setWalletTransfer({ ...walletTransfer, toLocationId: e.target.value })} style={inputStyle} />
            <input type="text" placeholder={t('fin_unit', language)} value={walletTransfer.toUnitId} onChange={e => setWalletTransfer({ ...walletTransfer, toUnitId: e.target.value })} style={inputStyle} />
          </FormGroup>
          <FormGroup label={t('ops_details', language)}>
            <input type="number" placeholder={t('ops_amount', language)} value={walletTransfer.amountIDR} onChange={e => setWalletTransfer({ ...walletTransfer, amountIDR: e.target.value })} style={inputStyle} />
            <input type="text" placeholder={t('ops_memo', language)} value={walletTransfer.memo} onChange={e => setWalletTransfer({ ...walletTransfer, memo: e.target.value })} style={inputStyle} />
          </FormGroup>
        </WorkflowCard >

        {/* 7. START TRIP */}
        < WorkflowCard title="Start Trip" onSubmit={() => runWorkflow('recordTripStart', tripStart, 'TRIP')} loading={loading} language={language} >
          <FormGroup label={t('ops_location_unit', language)}>
            <input type="text" placeholder={t('fin_location', language)} value={tripStart.locationId} onChange={e => setTripStart({ ...tripStart, locationId: e.target.value })} style={inputStyle} />
            <input type="text" placeholder={t('fin_unit', language)} value={tripStart.unitId} onChange={e => setTripStart({ ...tripStart, unitId: e.target.value })} style={inputStyle} />
          </FormGroup>
          <FormGroup label="Vessel / Context">
            <input type="text" placeholder="Vessel Name" value={tripStart.vesselName} onChange={e => setTripStart({ ...tripStart, vesselName: e.target.value })} style={{ ...inputStyle, width: '100%' }} />
          </FormGroup>
        </WorkflowCard >

        {/* 8. RECORD SALE */}
        <WorkflowCard title={t('ops_sale', language)} onSubmit={() => runWorkflow('recordSale', { ...sale, qty: Number(sale.qty), unitPriceIDR: Number(sale.unitPriceIDR) }, 'SALE')} loading={loading} language={language}>
          <FormGroup label={t('ops_location_unit', language)}>
            <input type="text" placeholder={t('fin_location', language)} value={sale.locationId} onChange={e => setSale({ ...sale, locationId: e.target.value })} style={inputStyle} />
            <input type="text" placeholder={t('fin_unit', language)} value={sale.unitId} onChange={e => setSale({ ...sale, unitId: e.target.value })} style={inputStyle} />
          </FormGroup>
          <FormGroup label={t('ops_sku_qty', language)}>
            <input type="text" placeholder={t('ops_sku', language)} value={sale.skuId} onChange={e => setSale({ ...sale, skuId: e.target.value })} style={inputStyle} />
            <input type="number" placeholder={t('ops_qty', language)} value={sale.qty} onChange={e => setSale({ ...sale, qty: e.target.value })} style={inputStyle} />
          </FormGroup>
          <FormGroup label={t('ops_price_customer', language)}>
            <input type="number" placeholder={t('ops_price', language)} value={sale.unitPriceIDR} onChange={e => setSale({ ...sale, unitPriceIDR: e.target.value })} style={inputStyle} />
            <input type="text" placeholder={t('ops_customer', language)} value={sale.customerName} onChange={e => setSale({ ...sale, customerName: e.target.value })} style={inputStyle} />
          </FormGroup>
        </WorkflowCard>

      </div >
    </div >
  );
};

const WorkflowCard = ({ title, children, onSubmit, loading, language }: { title: string, children: React.ReactNode, onSubmit: () => void, loading: boolean, language: Language }) => (
  <div style={{ background: 'white', padding: '1.5rem', borderRadius: '1rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', border: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
    <h2 style={{ fontSize: '1.25rem', color: '#1e293b' }}>{title}</h2>
    {children}
    <button
      onClick={onSubmit}
      disabled={loading}
      style={{ marginTop: 'auto', padding: '0.875rem', background: '#0f172a', color: 'white', border: 'none', borderRadius: '0.5rem', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer' }}
    >
      {loading ? t('common_loading', language) : t('common_save', language)}
    </button>
  </div>
);

const FormGroup = ({ label, children }: { label: string, children: React.ReactNode }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
    <label style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: '#64748b' }}>{label}</label>
    <div style={{ display: 'flex', gap: '0.5rem' }}>{children}</div>
  </div>
);

const inputStyle: React.CSSProperties = {
  flex: 1,
  padding: '0.75rem',
  fontSize: '0.875rem',
  border: '1px solid #e2e8f0',
  borderRadius: '0.5rem',
  background: '#f8fafc'
};

export default Operations;
