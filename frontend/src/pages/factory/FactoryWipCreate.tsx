import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Alert, FormField, Input, Select } from '../../components/ops3/Card';
import { createWipState } from '../../services/ops3Service';
import { useAuth } from '../../contexts/AuthContext';

// Valid stages as defined in the backend wipStates.js WIP_STAGES array
const STAGES = ['receiving', 'sorting', 'processing', 'quality_check', 'packing'];
const SKU_OPTIONS = ['tuna-raw', 'tuna-fillet', 'tuna-loin', 'tuna-waste', 'shrimp-raw', 'shrimp-peeled'];

const FactoryWipCreate: React.FC = () => {
  const navigate = useNavigate();
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
    } catch (e: any) {
      setError(e.message || 'Failed to create WIP state');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setBatchId('');
    setQuantity('');
    setNotes('');
    setError('');
  };

  if (result) {
    return (
      <div className="max-w-xl space-y-4">
        <Card title="WIP Processing Started" subtitle="Work-in-progress record has been created">
          <div className="space-y-4">
            <Alert type="success" message="WIP processing started successfully." />
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Document ID</span>
                <span className="font-mono font-semibold">{result.doc_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Batch ID</span>
                <span className="font-mono">{result.batch_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Current Stage</span>
                <span className="font-semibold text-blue-700">{result.current_stage || stage}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status</span>
                <span className="font-semibold text-blue-700">{result.status}</span>
              </div>
            </div>
            <p className="text-sm text-slate-600">
              Next step: Go to <strong>Advance WIP Stage</strong> to move this WIP through the processing stages.
            </p>
            <div className="flex gap-3 pt-2">
              <Button variant="primary" onClick={() => navigate('/app/factory/wip-advance')}>
                Advance WIP Stage →
              </Button>
              <Button variant="secondary" onClick={handleReset}>
                Start Another WIP
              </Button>
              <Button variant="ghost" onClick={() => navigate('/app/factory/batches')}>
                ← Back to Batches
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-xl space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" onClick={() => navigate('/app/factory/batches')}>
          ← Back to Batches
        </Button>
      </div>
      <Card title="Start WIP Processing" subtitle="Create a work-in-progress record for a batch">
        <form onSubmit={handleSubmit} className="space-y-5">
          <FormField label="Batch ID" required hint="Must reference an existing in_progress batch">
            <Input
              value={batchId}
              onChange={e => setBatchId(e.target.value)}
              placeholder="e.g. BATCH-001"
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="SKU" required>
              <Select value={skuId} onChange={e => setSkuId(e.target.value)}>
                {SKU_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </Select>
            </FormField>
            <FormField label="Quantity (kg)" required>
              <Input
                type="number"
                min="0.01"
                step="0.01"
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
                placeholder="e.g. 100"
              />
            </FormField>
          </div>

          <FormField label="Initial Stage" required hint="Starting stage for this WIP record">
            <Select value={stage} onChange={e => setStage(e.target.value)}>
              {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
            </Select>
          </FormField>

          <FormField label="Notes">
            <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional" />
          </FormField>

          {error && <Alert type="error" message={error} />}

          <div className="flex gap-3 pt-2">
            <Button type="submit" loading={loading}>Start WIP</Button>
            <Button type="button" variant="secondary" onClick={() => navigate('/app/factory/batches')}>
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default FactoryWipCreate;
