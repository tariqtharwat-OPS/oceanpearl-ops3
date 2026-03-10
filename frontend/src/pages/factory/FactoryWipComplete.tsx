import React, { useState } from 'react';
import { Card, Button, Alert, FormField, Input } from '../../components/ops3/Card';
import { completeWipState, getWipState } from '../../services/ops3Service';

const FactoryWipComplete: React.FC = () => {
  const [docId, setDocId] = useState('');
  const [wipData, setWipData] = useState<any>(null);
  const [transformationDocId, setTransformationDocId] = useState('');
  const [quantityOut, setQuantityOut] = useState('');
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
      setQuantityOut(String((data as any).quantity || ''));
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
    if (!transformationDocId.trim()) { setError('Transformation document ID is required.'); return; }
    setLoading(true);
    try {
      const res = await completeWipState({
        doc_id: docId,
        transformation_document_id: transformationDocId,
        quantity_out: quantityOut ? parseFloat(quantityOut) : undefined,
        notes: notes || undefined,
      });
      setResult(res);
      setWipData(null);
      setDocId('');
      setTransformationDocId('');
    } catch (e: any) {
      setError(e.message || 'Failed to complete WIP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl space-y-4">
      <Card title="Complete WIP" subtitle="Link a posted transformation document to close the WIP record">
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
            <div className="p-4 bg-green-50 rounded-lg border border-green-200 text-sm space-y-1">
              <div className="font-semibold text-green-800">WIP Record</div>
              <div className="text-green-700">SKU: <strong>{(wipData as any).sku_id}</strong></div>
              <div className="text-green-700">Stage: <strong>{(wipData as any).stage}</strong></div>
              <div className="text-green-700">Quantity: <strong>{(wipData as any).quantity} kg</strong></div>
              <div className="text-green-700">Status: <strong>{(wipData as any).status}</strong></div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField label="Transformation Document ID" required hint="The idempotency_key returned when posting the transformation">
              <Input
                value={transformationDocId}
                onChange={e => setTransformationDocId(e.target.value)}
                placeholder="e.g. abc123..."
                required
              />
            </FormField>

            <FormField label="Quantity Out (kg)" hint="Defaults to current WIP quantity if not specified">
              <Input type="number" min="0" step="0.01" value={quantityOut} onChange={e => setQuantityOut(e.target.value)} placeholder="e.g. 88" />
            </FormField>

            <FormField label="Notes">
              <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional" />
            </FormField>

            {error && <Alert type="error" message={error} />}
            {result && (
              <Alert type="success" message={`WIP completed: ${result.doc_id} · Status: ${result.status}`} />
            )}

            <Button type="submit" loading={loading} disabled={!docId}>Complete WIP</Button>
          </form>
        </div>
      </Card>
    </div>
  );
};

export default FactoryWipComplete;
