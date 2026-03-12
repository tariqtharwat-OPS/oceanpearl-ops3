import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Alert, FormField, Input, Select } from '../../components/ops3/Card';
import { postTransformation, type TransformationLine } from '../../services/ops3Service';
import { useAuth } from '../../contexts/AuthContext';

const SKU_OPTIONS = ['tuna-raw', 'tuna-fillet', 'tuna-loin', 'tuna-waste', 'shrimp-raw', 'shrimp-peeled'];

interface LineForm {
  sku_id: string;
  amount: string;
  event_type: 'transformation_out' | 'transformation_in';
}

const FactoryTransformation: React.FC = () => {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const companyId = userProfile?.companyId || 'oceanpearl';
  const locationId = userProfile?.allowedLocationIds?.[0] || 'test-loc-1';
  const unitId = userProfile?.allowedUnitIds?.[0] || 'test-factory-1';

  const [documentId, setDocumentId] = useState(`TRANS-${Date.now()}`);
  const [batchId, setBatchId] = useState('');
  const [lines, setLines] = useState<LineForm[]>([
    { sku_id: 'tuna-raw', amount: '', event_type: 'transformation_out' },
    { sku_id: 'tuna-fillet', amount: '', event_type: 'transformation_in' },
    { sku_id: 'tuna-waste', amount: '', event_type: 'transformation_in' },
  ]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const addLine = (type: 'transformation_out' | 'transformation_in') => {
    setLines(prev => [...prev, { sku_id: 'tuna-raw', amount: '', event_type: type }]);
  };

  const removeLine = (idx: number) => setLines(prev => prev.filter((_, i) => i !== idx));

  const updateLine = (idx: number, field: string, value: string) => {
    setLines(prev => prev.map((l, i) => i === idx ? { ...l, [field]: value } : l));
  };

  const hasValidOut = lines.some(l => l.event_type === 'transformation_out' && l.amount && parseFloat(l.amount) > 0);
  const hasValidIn = lines.some(l => l.event_type === 'transformation_in' && l.amount && parseFloat(l.amount) > 0);
  const isFormValid = documentId.trim() && hasValidOut && hasValidIn;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResult(null);
    const validLines = lines.filter(l => l.amount && parseFloat(l.amount) > 0);
    if (!hasValidOut || !hasValidIn) {
      setError('At least one transformation_out and one transformation_in line with quantity > 0 are required.');
      return;
    }
    setLoading(true);
    try {
      const txnLines: TransformationLine[] = validLines.map(l => ({
        sku_id: l.sku_id,
        amount: parseFloat(l.amount),
        event_type: l.event_type,
        location_id: locationId,
        unit_id: unitId,
      }));
      const res = await postTransformation({
        document_id: documentId,
        company_id: companyId,
        location_id: locationId,
        unit_id: unitId,
        lines: txnLines,
        batch_id: batchId || undefined,
        notes: notes || undefined,
      });
      setResult(res);
    } catch (e: any) {
      setError(e.message || 'Failed to post transformation');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setDocumentId(`TRANS-${Date.now()}`);
    setBatchId('');
    setLines([
      { sku_id: 'tuna-raw', amount: '', event_type: 'transformation_out' },
      { sku_id: 'tuna-fillet', amount: '', event_type: 'transformation_in' },
      { sku_id: 'tuna-waste', amount: '', event_type: 'transformation_in' },
    ]);
    setNotes('');
    setError('');
  };

  if (result) {
    return (
      <div className="max-w-2xl space-y-4">
        <Card title="Transformation Posted" subtitle="The inventory transformation has been posted to the ledger">
          <div className="space-y-4">
            <Alert type="success" message="Transformation posted to the immutable ledger." />
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Document ID</span>
                <span className="font-mono font-semibold">{result.document_id}</span>
              </div>
              {result.idempotency_key && (
                <div className="flex flex-col gap-1">
                  <span className="text-slate-500">Idempotency Key</span>
                  <code className="text-xs font-mono bg-slate-100 p-2 rounded break-all">{result.idempotency_key}</code>
                </div>
              )}
            </div>
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
              <strong>Important:</strong> Copy the <strong>Idempotency Key</strong> above. You will need it as the <code>transformation_document_id</code> when completing WIP on the <strong>Complete WIP</strong> screen.
            </div>
            <p className="text-sm text-slate-600">
              Inventory states will update asynchronously as the ledger trigger processes the transformation.
            </p>
            <div className="flex gap-3 pt-2">
              <Button variant="primary" onClick={() => navigate('/app/factory/wip-complete')}>
                Complete WIP →
              </Button>
              <Button variant="secondary" onClick={handleReset}>
                Post Another Transformation
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
    <div className="max-w-2xl space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" onClick={() => navigate('/app/factory/batches')}>
          ← Back to Batches
        </Button>
      </div>
      <Card title="Record Transformation" subtitle="Post an inventory transformation to the immutable ledger">
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
          <strong>Architecture note:</strong> This writes a <code>document_request</code> to Firestore. The backend trigger processes it asynchronously and updates <code>inventory_states</code> via the immutable ledger. The returned <code>idempotency_key</code> is used as the transformation document ID when completing WIP.
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Document ID" required>
              <Input value={documentId} onChange={e => setDocumentId(e.target.value)} />
            </FormField>
            <FormField label="Batch ID" hint="Optional — links this transformation to a batch">
              <Input value={batchId} onChange={e => setBatchId(e.target.value)} placeholder="e.g. BATCH-001" />
            </FormField>
          </div>

          {/* OUT lines */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-red-700">
                Transformation OUT <span className="font-normal text-slate-500">(consumed / raw input)</span>
              </label>
              <Button type="button" variant="ghost" onClick={() => addLine('transformation_out')} className="text-red-600">+ Add Out</Button>
            </div>
            <div className="space-y-2">
              {lines.map((line, idx) => line.event_type === 'transformation_out' && (
                <div key={idx} className="flex items-center gap-2 p-3 bg-red-50 rounded-lg border border-red-100">
                  <Select value={line.sku_id} onChange={e => updateLine(idx, 'sku_id', e.target.value)} className="flex-1">
                    {SKU_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </Select>
                  <Input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={line.amount}
                    onChange={e => updateLine(idx, 'amount', e.target.value)}
                    placeholder="qty kg"
                    className="w-28"
                  />
                  <Button type="button" variant="ghost" onClick={() => removeLine(idx)} className="text-red-500 px-2">✕</Button>
                </div>
              ))}
            </div>
          </div>

          {/* IN lines */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-green-700">
                Transformation IN <span className="font-normal text-slate-500">(produced / finished output)</span>
              </label>
              <Button type="button" variant="ghost" onClick={() => addLine('transformation_in')} className="text-green-600">+ Add In</Button>
            </div>
            <div className="space-y-2">
              {lines.map((line, idx) => line.event_type === 'transformation_in' && (
                <div key={idx} className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-100">
                  <Select value={line.sku_id} onChange={e => updateLine(idx, 'sku_id', e.target.value)} className="flex-1">
                    {SKU_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </Select>
                  <Input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={line.amount}
                    onChange={e => updateLine(idx, 'amount', e.target.value)}
                    placeholder="qty kg"
                    className="w-28"
                  />
                  <Button type="button" variant="ghost" onClick={() => removeLine(idx)} className="text-green-500 px-2">✕</Button>
                </div>
              ))}
            </div>
          </div>

          <FormField label="Notes">
            <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional" />
          </FormField>

          {error && <Alert type="error" message={error} />}

          <div className="flex gap-3 pt-2">
            <Button type="submit" loading={loading} disabled={!isFormValid}>
              Post Transformation
            </Button>
            <Button type="button" variant="secondary" onClick={() => navigate('/app/factory/batches')}>
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default FactoryTransformation;
