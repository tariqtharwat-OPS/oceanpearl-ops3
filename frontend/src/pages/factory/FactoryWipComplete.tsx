import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Alert, FormField, Input } from '../../components/ops3/Card';
import { completeWipState, getWipState } from '../../services/ops3Service';

const FactoryWipComplete: React.FC = () => {
  const navigate = useNavigate();
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
    if (!docId.trim()) { setError('Please enter a WIP document ID.'); return; }
    setLookupLoading(true);
    setError('');
    setWipData(null);
    setResult(null);
    try {
      const data = await getWipState(docId);
      setWipData(data);
      setQuantityOut(String((data as any).quantity || ''));
    } catch (e: any) {
      setError(e.message || 'WIP record not found. Check the document ID and try again.');
    } finally {
      setLookupLoading(false);
    }
  };

  const isFormValid = wipData && transformationDocId.trim() && quantityOut && parseFloat(quantityOut) >= 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResult(null);
    if (!transformationDocId.trim()) { setError('Transformation document ID is required.'); return; }
    if (!quantityOut || parseFloat(quantityOut) < 0) { setError('Quantity out must be 0 or greater.'); return; }
    setLoading(true);
    try {
      const res = await completeWipState({
        doc_id: docId,
        transformation_document_id: transformationDocId,
        quantity_out: parseFloat(quantityOut),
        notes: notes || undefined,
      });
      setResult(res);
    } catch (e: any) {
      setError(e.message || 'Failed to complete WIP');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setWipData(null);
    setDocId('');
    setTransformationDocId('');
    setQuantityOut('');
    setNotes('');
    setError('');
  };

  if (result) {
    return (
      <div className="max-w-xl space-y-4">
        <Card title="WIP Completed" subtitle="The WIP record has been closed and linked to the transformation">
          <div className="space-y-4">
            <Alert type="success" message="WIP processing completed successfully." />
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Document ID</span>
                <span className="font-mono font-semibold">{result.doc_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status</span>
                <span className="font-semibold text-green-700">{result.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Quantity In</span>
                <span className="font-semibold">{result.quantity_in} kg</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Quantity Out</span>
                <span className="font-semibold">{result.quantity_out} kg</span>
              </div>
              {result.transformation_document_id && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Transformation Doc</span>
                  <span className="font-mono text-xs break-all">{result.transformation_document_id}</span>
                </div>
              )}
            </div>
            <p className="text-sm text-slate-600">
              The WIP record is closed. View the <strong>Batch Yield Summary</strong> to see the final yield for this batch.
            </p>
            <div className="flex gap-3 pt-2">
              <Button variant="primary" onClick={() => navigate('/app/factory/yield')}>
                View Yield Summary →
              </Button>
              <Button variant="secondary" onClick={handleReset}>
                Complete Another WIP
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
      <Card title="Complete WIP" subtitle="Link a posted transformation document to close the WIP record">
        <div className="space-y-5">
          {/* Step 1: Lookup */}
          <div className="flex gap-2">
            <div className="flex-1">
              <FormField label="WIP Document ID" required hint="Enter the doc ID from the Advance WIP step">
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
            <div className="p-4 bg-green-50 rounded-lg border border-green-200 text-sm space-y-1">
              <div className="font-semibold text-green-800">WIP Record Found</div>
              <div className="text-green-700">SKU: <strong>{(wipData as any).sku_id}</strong></div>
              <div className="text-green-700">Current Stage: <strong>{(wipData as any).stage}</strong></div>
              <div className="text-green-700">Current Quantity: <strong>{(wipData as any).quantity} kg</strong></div>
              <div className="text-green-700">Status: <strong>{(wipData as any).status}</strong></div>
            </div>
          )}

          {/* Step 2: Completion form — only shown after lookup */}
          {wipData && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <FormField
                label="Transformation Document ID"
                required
                hint="The document ID returned when posting the transformation via the Trigger Transformation screen"
              >
                <Input
                  value={transformationDocId}
                  onChange={e => setTransformationDocId(e.target.value)}
                  placeholder="e.g. abc123..."
                />
              </FormField>

              <FormField label="Quantity Out (kg)" hint="Final output quantity after processing">
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={quantityOut}
                  onChange={e => setQuantityOut(e.target.value)}
                  placeholder="e.g. 88"
                />
              </FormField>

              <FormField label="Notes">
                <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional" />
              </FormField>

              {error && <Alert type="error" message={error} />}

              <div className="flex gap-3 pt-2">
                <Button type="submit" loading={loading} disabled={!isFormValid}>
                  Complete WIP
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

export default FactoryWipComplete;
