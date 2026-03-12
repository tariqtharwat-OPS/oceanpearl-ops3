import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Alert, FormField, Input, Select } from '../../components/ops3/Card';
import { advanceWipStage, getWipState } from '../../services/ops3Service';

// Valid stages as defined in the backend wipStates.js WIP_STAGES array
const STAGES = ['receiving', 'sorting', 'processing', 'quality_check', 'packing'];

const FactoryWipAdvance: React.FC = () => {
  const navigate = useNavigate();
  const [docId, setDocId] = useState('');
  const [wipData, setWipData] = useState<any>(null);
  const [newStage, setNewStage] = useState('sorting');
  const [quantityLoss, setQuantityLoss] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const lookupWip = async () => {
    if (!docId.trim()) { setError('Please enter a WIP document ID.'); return; }
    setLookupLoading(true);
    setError('');
    setWipData(null);
    setResult(null);
    try {
      const data = await getWipState(docId);
      setWipData(data);
      // Pre-select next stage
      const currentIdx = STAGES.indexOf((data as any).stage);
      if (currentIdx >= 0 && currentIdx < STAGES.length - 1) {
        setNewStage(STAGES[currentIdx + 1]);
      }
    } catch (e: any) {
      setError(e.message || 'WIP record not found. Check the document ID and try again.');
    } finally {
      setLookupLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResult(null);
    setLoading(true);
    try {
      const res = await advanceWipStage({
        doc_id: docId,
        new_stage: newStage,
        quantity_loss: quantityLoss ? parseFloat(quantityLoss) : undefined,
        notes: notes || undefined,
      });
      setResult(res);
    } catch (e: any) {
      setError(e.message || 'Failed to advance WIP stage');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setWipData(null);
    setDocId('');
    setQuantityLoss('');
    setNotes('');
    setError('');
  };

  if (result) {
    return (
      <div className="max-w-xl space-y-4">
        <Card title="WIP Stage Advanced" subtitle="The WIP record has moved to the next processing stage">
          <div className="space-y-4">
            <Alert type="success" message={`Stage advanced to: ${result.new_stage}`} />
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Document ID</span>
                <span className="font-mono font-semibold">{result.doc_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">New Stage</span>
                <span className="font-semibold text-blue-700">{result.new_stage}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Remaining Quantity</span>
                <span className="font-semibold">{result.quantity} kg</span>
              </div>
              {result.quantity_loss > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Quantity Loss</span>
                  <span className="text-red-600 font-semibold">-{result.quantity_loss} kg</span>
                </div>
              )}
            </div>
            <p className="text-sm text-slate-600">
              Continue advancing stages or go to <strong>Complete WIP</strong> when processing is finished.
            </p>
            <div className="flex gap-3 pt-2">
              <Button variant="primary" onClick={handleReset}>
                Advance Another Stage
              </Button>
              <Button variant="secondary" onClick={() => navigate('/app/factory/wip-complete')}>
                Complete WIP →
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
      <Card title="Advance WIP Stage" subtitle="Move a WIP record to the next processing stage">
        <div className="space-y-5">
          {/* Step 1: Lookup */}
          <div className="flex gap-2">
            <div className="flex-1">
              <FormField label="WIP Document ID" required hint="Enter the doc ID from the Start WIP step">
                <Input
                  value={docId}
                  onChange={e => { setDocId(e.target.value); setError(''); }}
                  placeholder="WIP doc ID"
                />
              </FormField>
            </div>
            <div className="flex items-end">
              <Button type="button" variant="secondary" onClick={lookupWip} loading={lookupLoading}>
                Look Up
              </Button>
            </div>
          </div>

          {/* WIP record info */}
          {wipData && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 text-sm space-y-1">
              <div className="font-semibold text-blue-800">WIP Record Found</div>
              <div className="text-blue-700">SKU: <strong>{(wipData as any).sku_id}</strong></div>
              <div className="text-blue-700">Current Stage: <strong>{(wipData as any).stage}</strong></div>
              <div className="text-blue-700">Current Quantity: <strong>{(wipData as any).quantity} kg</strong></div>
              <div className="text-blue-700">Status: <strong>{(wipData as any).status}</strong></div>
            </div>
          )}

          {/* Step 2: Advance form — only shown after lookup */}
          {wipData && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <FormField label="New Stage" required hint="Select the next stage to advance to">
                <Select value={newStage} onChange={e => setNewStage(e.target.value)}>
                  {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                </Select>
              </FormField>

              <FormField label="Quantity Loss (kg)" hint="Leave blank if no loss at this stage">
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={quantityLoss}
                  onChange={e => setQuantityLoss(e.target.value)}
                  placeholder="0"
                />
              </FormField>

              <FormField label="Notes">
                <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional" />
              </FormField>

              {error && <Alert type="error" message={error} />}

              <div className="flex gap-3 pt-2">
                <Button type="submit" loading={loading}>
                  Advance Stage
                </Button>
                <Button type="button" variant="secondary" onClick={handleReset}>
                  Cancel
                </Button>
              </div>
            </form>
          )}

          {/* Error shown before lookup */}
          {!wipData && error && <Alert type="error" message={error} />}
        </div>
      </Card>
    </div>
  );
};

export default FactoryWipAdvance;
