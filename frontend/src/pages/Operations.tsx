/**
 * OPS V3 - Operations Hub
 * Full workflow support: Receiving, Production, Transfer, Waste, Trip Expense
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
        <h3 style={{ margin: '0 0 0.5rem 0', color: result.error ? '#991b1b' : '#166534' }}>{result.type} {result.error ? 'Error' : 'Success'}</h3>
        <pre style={{ fontSize: '0.875rem', overflow: 'auto' }}>{JSON.stringify(result.error || result.data, null, 2)}</pre>
        {result.data?.batchId && (
        <div style={{ marginTop: '0.5rem' }}>
          <strong>Batch ID:</strong> {result.data.batchId}
          <button onClick={() => copyToClipboard(result.data.batchId)} style={{ marginLeft: '0.5rem', padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}>{t('common_copy', language)}</button>
      </div>
            )}
    </div>
    <button onClick={() => setResult(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.25rem' }}>×</button>
        </div >
      )}

<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>

  {/* 1. RECORD RECEIVING */}
  <WorkflowCard title={t('ops_record_receiving', language)} onSubmit={() => runWorkflow('recordReceiving', {...receiving, qtyKg: Number(receiving.qtyKg), unitCostIDR: Number(receiving.unitCostIDR) }, 'RECV')} loading={loading} language={language}>
  <FormGroup label="Location / Unit">
    <input type="text" placeholder="Location ID" value={receiving.locationId} onChange={e => setReceiving({...receiving, locationId: e.target.value})} style={inputStyle} />
    <input type="text" placeholder="Unit ID" value={receiving.unitId} onChange={e => setReceiving({...receiving, unitId: e.target.value})} style={inputStyle} />
  </FormGroup>
  <FormGroup label="SKU / Qty">
    <input type="text" placeholder="SKU ID" value={receiving.skuId} onChange={e => setReceiving({...receiving, skuId: e.target.value})} style={inputStyle} />
    <input type="number" placeholder="Qty (Kg)" value={receiving.qtyKg} onChange={e => setReceiving({...receiving, qtyKg: e.target.value})} style={inputStyle} />
  </FormGroup>
  <FormGroup label="Cost / Source">
    <input type="number" placeholder="Cost/Kg (IDR)" value={receiving.unitCostIDR} onChange={e => setReceiving({...receiving, unitCostIDR: e.target.value})} style={inputStyle} />
    <input type="text" placeholder="Supplier" value={receiving.supplierName} onChange={e => setReceiving({...receiving, supplierName: e.target.value})} style={inputStyle} />
  </FormGroup>
</WorkflowCard>

{/* 2. RECORD PRODUCTION */ }
<WorkflowCard title={t('ops_record_production', language)} onSubmit={() => runWorkflow('recordProduction', { ...production, outputQtyKg: Number(production.outputQtyKg), processingCostIDR: Number(production.processingCostIDR) }, 'PROD')} loading = { loading } language = { language } >
          <FormGroup label="Location / Unit">
            <input type="text" placeholder="Location ID" value={production.locationId} onChange={e => setProduction({...production, locationId: e.target.value})} style={inputStyle} />
            <input type="text" placeholder="Unit ID" value={production.unitId} onChange={e => setProduction({...production, unitId: e.target.value})} style={inputStyle} />
          </FormGroup>
          <FormGroup label="Input Batch / Output SKU">
            <input type="text" placeholder="Input Batch ID" value={production.inputBatchId} onChange={e => setProduction({...production, inputBatchId: e.target.value})} style={inputStyle} />
            <input type="text" placeholder="Output SKU" value={production.outputSkuId} onChange={e => setProduction({...production, outputSkuId: e.target.value})} style={inputStyle} />
          </FormGroup>
          <FormGroup label="Output Qty / Post Cost">
            <input type="number" placeholder="Output Qty (Kg)" value={production.outputQtyKg} onChange={e => setProduction({...production, outputQtyKg: e.target.value})} style={inputStyle} />
            <input type="number" placeholder="Process Cost (IDR)" value={production.processingCostIDR} onChange={e => setProduction({...production, processingCostIDR: e.target.value})} style={inputStyle} />
          </FormGroup>
        </WorkflowCard >

  {/* 3. RECORD TRANSFER */ }
  < WorkflowCard title = { t('ops_record_transfer', language) } onSubmit = {() => runWorkflow('recordTransfer', transfer, 'XFER')} loading = { loading } language = { language } >
          <FormGroup label="From">
            <input type="text" placeholder="From Location" value={transfer.fromLocationId} onChange={e => setTransfer({...transfer, fromLocationId: e.target.value})} style={inputStyle} />
            <input type="text" placeholder="From Unit" value={transfer.fromUnitId} onChange={e => setTransfer({...transfer, fromUnitId: e.target.value})} style={inputStyle} />
          </FormGroup>
          <FormGroup label="To">
            <input type="text" placeholder="To Location" value={transfer.toLocationId} onChange={e => setTransfer({...transfer, toLocationId: e.target.value})} style={inputStyle} />
            <input type="text" placeholder="To Unit" value={transfer.toUnitId} onChange={e => setTransfer({...transfer, toUnitId: e.target.value})} style={inputStyle} />
          </FormGroup>
          <FormGroup label="Batch">
            <input type="text" placeholder="Batch ID" value={transfer.batchId} onChange={e => setTransfer({...transfer, batchId: e.target.value})} style={{...inputStyle, width: '100%'}} />
          </FormGroup>
        </WorkflowCard >

  {/* 4. RECORD WASTE */ }
  < WorkflowCard title = { t('ops_record_waste', language) } onSubmit = {() => runWorkflow('recordWaste', { ...waste, qtyKg: Number(waste.qtyKg) }, 'WSTE')} loading = { loading } language = { language } >
          <FormGroup label="Location / Unit">
            <input type="text" placeholder="Location ID" value={waste.locationId} onChange={e => setWaste({...waste, locationId: e.target.value})} style={inputStyle} />
            <input type="text" placeholder="Unit ID" value={waste.unitId} onChange={e => setWaste({...waste, unitId: e.target.value})} style={inputStyle} />
          </FormGroup>
          <FormGroup label="Batch ID / Qty">
            <input type="text" placeholder="Batch ID" value={waste.batchId} onChange={e => setWaste({...waste, batchId: e.target.value})} style={inputStyle} />
            <input type="number" placeholder="Qty (Kg)" value={waste.qtyKg} onChange={e => setWaste({...waste, qtyKg: e.target.value})} style={inputStyle} />
          </FormGroup>
          <FormGroup label="Reason">
            <select value={waste.reason} onChange={e => setWaste({...waste, reason: e.target.value})} style={{...inputStyle, width: '100%'}}>
              <option value="SPOILAGE">Spoilage / Busuk</option>
              <option value="DRIER_LOSS">Drier Loss</option>
              <option value="SORTING_ERROR">Sorting Error</option>
            </select>
          </FormGroup >
        </WorkflowCard >

  {/* 5. TRIP EXPENSE */ }
  < WorkflowCard title = { t('ops_trip_expense', language) } onSubmit = {() => runWorkflow('recordTripExpense', { ...expense, amountIDR: Number(expense.amountIDR) }, 'TRIP')} loading = { loading } language = { language } >
          <FormGroup label="Scope">
            <input type="text" placeholder="Location ID" value={expense.locationId} onChange={e => setExpense({...expense, locationId: e.target.value})} style={inputStyle} />
            <input type="text" placeholder="Unit ID" value={expense.unitId} onChange={e => setExpense({...expense, unitId: e.target.value})} style={inputStyle} />
          </FormGroup>
          <FormGroup label="Details">
            <input type="number" placeholder="Amount (IDR)" value={expense.amountIDR} onChange={e => setExpense({...expense, amountIDR: e.target.value})} style={inputStyle} />
            <input type="text" placeholder="Memo" value={expense.memo} onChange={e => setExpense({...expense, memo: e.target.value})} style={inputStyle} />
          </FormGroup>
        </WorkflowCard >

      </div >
    </div >
  );
};

const WorkflowCard = ({ title, children, onSubmit, loading, language }: { title: string, children: React.ReactNode, onSubmit: () => void, loading: boolean, language: Language }) =>(
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
