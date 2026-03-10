import React, { useState } from 'react';
import { Card, Button, Alert, FormField, Input, Select } from '../../components/ops3/Card';
import { createWipState } from '../../services/ops3Service';
import { useAuth } from '../../contexts/AuthContext';

const STAGES = ['receiving', 'sorting', 'filleting', 'freezing', 'packing', 'dispatch'];
const SKU_OPTIONS = ['tuna-raw', 'tuna-fillet', 'tuna-loin', 'tuna-waste', 'shrimp-raw', 'shrimp-peeled'];

const FactoryWipCreate: React.FC = () => {
  const { userProfile } = useAuth();
  const companyId = userProfile?.companyId || 'oceanpearl';
  const locationId = userProfile?.allowedLocationIds?.[0] || 'test-loc-1';
  const unitId = userProfile?.allowedUnitIds?.[0] || 'test-factory-1';

  const [batchId, setBatchId] = useState('');
  const [skuId, setSkuId] = useState('tuna-raw');
  const [quantity, setQuantity] = useState('');
  const [stage, setStage] = useState('receiving');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResult(null);
    if (!batchId.trim()) { setError('Batch ID is required.'); return; }
    if (!quantity || parseFloat(quantity) <= 0) { setError('Quantity must be greater than 0.'); return; }
    setLoading(true);
    try {
      const res = await createWipState({
        batch_id: batchId,
        sku_id: skuId,
        quantity: parseFloat(quantity),
        stage,
        company_id: companyId,
        location_id: locationId,
        unit_id: unitId,
        notes: notes || undefined,
      });
      setResult(res);
      setBatchId('');
      setQuantity('');
    } catch (e: any) {
      setError(e.message || 'Failed to create WIP state');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl space-y-4">
      <Card title="Start WIP Processing" subtitle="Create a work-in-progress record for a batch">
        <form onSubmit={handleSubmit} className="space-y-5">
          <FormField label="Batch ID" required hint="Must reference an existing in_progress batch">
            <Input value={batchId} onChange={e => setBatchId(e.target.value)} placeholder="e.g. BATCH-001" required />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="SKU" required>
              <Select value={skuId} onChange={e => setSkuId(e.target.value)}>
                {SKU_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </Select>
            </FormField>
            <FormField label="Quantity (kg)" required>
              <Input type="number" min="0.01" step="0.01" value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="e.g. 100" required />
            </FormField>
          </div>

          <FormField label="Initial Stage" required>
            <Select value={stage} onChange={e => setStage(e.target.value)}>
              {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
            </Select>
          </FormField>

          <FormField label="Notes">
            <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional" />
          </FormField>

          {error && <Alert type="error" message={error} />}
          {result && (
            <Alert type="success" message={`WIP created: ${result.doc_id} · Batch: ${result.batch_id} · Status: ${result.status}`} />
          )}

          <Button type="submit" loading={loading}>Start WIP</Button>
        </form>
      </Card>
    </div>
  );
};

export default FactoryWipCreate;
