import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Alert, FormField, Input, Select, StatusBadge } from '../../components/ops3/Card';
import { getHubReceiving, updateHubReceivingInspection } from '../../services/ops3Service';

const QC_STATUSES = ['passed', 'failed', 'partial'];

const HubReceivingInspect: React.FC = () => {
  const navigate = useNavigate();
  const [docId, setDocId] = useState('');
  const [receivingData, setReceivingData] = useState<any>(null);
  const [inspectedLines, setInspectedLines] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const lookupReceiving = async () => {
    if (!docId.trim()) { setError('Please enter a document ID.'); return; }
    setLookupLoading(true);
    setError('');
    setReceivingData(null);
    setResult(null);
    try {
      const res = await getHubReceiving(docId);
      const data = (res as any).data;
      setReceivingData(data);
      setInspectedLines(data.received_lines.map((l: any) => ({
        sku_id: l.sku_id,
        expected_qty: l.expected_qty,
        received_qty: l.received_qty != null ? String(l.received_qty) : '',
        qc_status: l.qc_status || 'passed',
      })));
    } catch (e: any) {
      setError(e.message || 'Hub receiving record not found. Check the document ID and try again.');
    } finally {
      setLookupLoading(false);
    }
  };

  const updateLine = (idx: number, field: string, value: string) => {
    setInspectedLines(prev => prev.map((l, i) => i === idx ? { ...l, [field]: value } : l));
  };

  const isFormValid = inspectedLines.length > 0 &&
    inspectedLines.every(l => l.received_qty !== '' && parseFloat(l.received_qty) >= 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResult(null);
    if (!isFormValid) { setError('All lines must have a received quantity (can be 0).'); return; }
    setLoading(true);
    try {
      const res = await updateHubReceivingInspection({
        doc_id: docId,
        received_lines: inspectedLines.map(l => ({
          sku_id: l.sku_id,
          expected_qty: l.expected_qty,
          received_qty: parseFloat(l.received_qty),
          qc_status: l.qc_status,
          variance_qty: parseFloat(l.received_qty) - l.expected_qty,
        })),
      });
      setResult(res);
    } catch (e: any) {
      setError(e.message || 'Failed to update inspection');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setReceivingData(null);
    setDocId('');
    setInspectedLines([]);
    setError('');
  };

  if (result) {
    return (
      <div className="max-w-2xl space-y-4">
        <Card title="Inspection Saved" subtitle="Received quantities and QC status have been recorded">
          <div className="space-y-4">
            <Alert type="success" message="Inspection updated successfully." />
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Document ID</span>
                <span className="font-mono font-semibold">{result.doc_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status</span>
                <span className="font-semibold text-blue-700">{result.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Has Variance</span>
                <span className={result.has_variance ? 'text-red-600 font-semibold' : 'text-green-600 font-semibold'}>
                  {result.has_variance ? 'Yes — Flagged' : 'No'}
                </span>
              </div>
            </div>
            <p className="text-sm text-slate-600">
              Next step: Navigate to <strong>Confirm Receiving</strong> to finalize this receiving record.
            </p>
            <div className="flex gap-3 pt-2">
              <Button variant="primary" onClick={() => navigate('/app/hub/confirm')}>
                Go to Confirm Receiving →
              </Button>
              <Button variant="secondary" onClick={handleReset}>
                Inspect Another
              </Button>
              <Button variant="ghost" onClick={() => navigate('/app/hub/trips')}>
                ← Back to Trips
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
        <Button variant="ghost" onClick={() => navigate('/app/hub/trips')}>
          ← Back to Trips
        </Button>
      </div>
      <Card title="Inspect Quantities" subtitle="Record actual received quantities and QC status for each SKU">
        <div className="space-y-5">
          {/* Step 1: Lookup */}
          <div className="flex gap-2">
            <div className="flex-1">
              <FormField label="Hub Receiving Document ID" required hint="Enter the doc ID from the Create Receiving step">
                <Input
                  value={docId}
                  onChange={e => { setDocId(e.target.value); setError(''); }}
                  placeholder="Hub receiving doc ID"
                />
              </FormField>
            </div>
            <div className="flex items-end">
              <Button type="button" variant="secondary" onClick={lookupReceiving} loading={lookupLoading}>
                Look Up
              </Button>
            </div>
          </div>

          {/* Record found banner */}
          {receivingData && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 text-sm space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-blue-800">Receiving Record Found</span>
                <StatusBadge status={receivingData.status} />
              </div>
              <div className="text-blue-700">Trip: <strong>{receivingData.trip_id}</strong></div>
              <div className="text-blue-700">Source Unit: <strong>{receivingData.source_unit_id}</strong></div>
            </div>
          )}

          {/* Step 2: Inspection form — only shown after lookup */}
          {receivingData && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <div className="grid grid-cols-4 gap-2 mb-2 text-xs font-semibold text-slate-500 px-2">
                  <span>SKU</span>
                  <span>Expected</span>
                  <span>Received (kg)</span>
                  <span>QC Status</span>
                </div>
                <div className="space-y-2">
                  {inspectedLines.map((line, idx) => (
                    <div key={idx} className="grid grid-cols-4 gap-2 items-center p-2 bg-slate-50 rounded-lg border border-slate-200">
                      <span className="font-mono text-xs text-slate-700">{line.sku_id}</span>
                      <span className="text-sm text-slate-600">{line.expected_qty} kg</span>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={line.received_qty}
                        onChange={e => updateLine(idx, 'received_qty', e.target.value)}
                        placeholder="0"
                        className="text-sm"
                      />
                      <Select
                        value={line.qc_status}
                        onChange={e => updateLine(idx, 'qc_status', e.target.value)}
                        className="text-sm"
                      >
                        {QC_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                      </Select>
                    </div>
                  ))}
                </div>
              </div>

              {error && <Alert type="error" message={error} />}

              <div className="flex gap-3 pt-2">
                <Button type="submit" loading={loading} disabled={!isFormValid}>
                  Save Inspection
                </Button>
                <Button type="button" variant="secondary" onClick={handleReset}>
                  Cancel
                </Button>
              </div>
            </form>
          )}

          {/* Error shown before lookup */}
          {!receivingData && error && <Alert type="error" message={error} />}
        </div>
      </Card>
    </div>
  );
};

export default HubReceivingInspect;
