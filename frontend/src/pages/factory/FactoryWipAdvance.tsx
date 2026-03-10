import React, { useState } from 'react';
import { Card, Button, Alert, FormField, Input, Select } from '../../components/ops3/Card';
import { advanceWipStage, getWipState } from '../../services/ops3Service';

const STAGES = ['receiving', 'sorting', 'filleting', 'freezing', 'packing', 'dispatch'];

const FactoryWipAdvance: React.FC = () => {
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
    if (!docId.trim()) return;
    setLookupLoading(true);
    setError('');
    setWipData(null);
    try {
      const data = await getWipState(docId);
      setWipData(data);
      // Pre-select next stage
      const currentIdx = STAGES.indexOf((data as any).stage);
      if (currentIdx >= 0 && currentIdx < STAGES.length - 1) {
        setNewStage(STAGES[currentIdx + 1]);
      }
    } catch (e: any) {
      setError(e.message || 'WIP record not found');
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
      setWipData(null);
      setDocId('');
    } catch (e: any) {
      setError(e.message || 'Failed to advance WIP stage');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl space-y-4">
      <Card title="Advance WIP Stage" subtitle="Move a WIP record to the next processing stage">
        <div className="space-y-5">
          <div className="flex gap-2">
            <div className="flex-1">
              <FormField label="WIP Document ID" required>
                <Input value={docId} onChange={e => setDocId(e.target.value)} placeholder="WIP doc ID" />
              </FormField>
            </div>
            <div className="flex items-end">
              <Button type="button" variant="secondary" onClick={lookupWip} loading={lookupLoading}>Look Up</Button>
            </div>
          </div>

          {wipData && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 text-sm space-y-1">
              <div className="font-semibold text-blue-800">WIP Record Found</div>
              <div className="text-blue-700">SKU: <strong>{(wipData as any).sku_id}</strong></div>
              <div className="text-blue-700">Current Stage: <strong>{(wipData as any).stage}</strong></div>
              <div className="text-blue-700">Current Quantity: <strong>{(wipData as any).quantity} kg</strong></div>
              <div className="text-blue-700">Status: <strong>{(wipData as any).status}</strong></div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField label="New Stage" required>
              <Select value={newStage} onChange={e => setNewStage(e.target.value)}>
                {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
              </Select>
            </FormField>

            <FormField label="Quantity Loss (kg)" hint="Leave blank if no loss at this stage">
              <Input type="number" min="0" step="0.01" value={quantityLoss} onChange={e => setQuantityLoss(e.target.value)} placeholder="0" />
            </FormField>

            <FormField label="Notes">
              <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional" />
            </FormField>

            {error && <Alert type="error" message={error} />}
            {result && (
              <Alert type="success" message={`Stage advanced to: ${result.new_stage} · Remaining quantity: ${result.quantity} kg`} />
            )}

            <Button type="submit" loading={loading} disabled={!docId}>Advance Stage</Button>
          </form>
        </div>
      </Card>
    </div>
  );
};

export default FactoryWipAdvance;
