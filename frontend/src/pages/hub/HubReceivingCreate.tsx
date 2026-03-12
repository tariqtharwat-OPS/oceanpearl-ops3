import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Alert, FormField, Input, Select } from '../../components/ops3/Card';
import { createHubReceiving } from '../../services/ops3Service';
import { useAuth } from '../../contexts/AuthContext';

const SKU_OPTIONS = ['tuna-raw', 'tuna-fillet', 'tuna-loin', 'shrimp-raw', 'shrimp-peeled'];

interface ReceivingLine {
  sku_id: string;
  expected_qty: string;
}

const HubReceivingCreate: React.FC = () => {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const companyId = userProfile?.companyId || 'oceanpearl';
  const locationId = userProfile?.allowedLocationIds?.[0] || 'test-loc-1';
  const unitId = userProfile?.allowedUnitIds?.[0] || 'test-hub-1';

  const [tripId, setTripId] = useState('');
  const [sourceUnitId, setSourceUnitId] = useState('');
  const [lines, setLines] = useState<ReceivingLine[]>([
    { sku_id: 'tuna-raw', expected_qty: '' },
  ]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const addLine = () => setLines(prev => [...prev, { sku_id: 'tuna-raw', expected_qty: '' }]);
  const removeLine = (idx: number) => setLines(prev => prev.filter((_, i) => i !== idx));
  const updateLine = (idx: number, field: string, value: string) => {
    setLines(prev => prev.map((l, i) => i === idx ? { ...l, [field]: value } : l));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResult(null);
    if (!tripId.trim()) { setError('Trip ID is required.'); return; }
    if (!sourceUnitId.trim()) { setError('Source unit ID is required.'); return; }
    const validLines = lines.filter(l => l.expected_qty && parseFloat(l.expected_qty) > 0);
    if (validLines.length === 0) { setError('At least one line with expected quantity > 0 is required.'); return; }
    setLoading(true);
    try {
      const res = await createHubReceiving({
        company_id: companyId,
        location_id: locationId,
        unit_id: unitId,
        source_unit_id: sourceUnitId,
        trip_id: tripId,
        received_lines: validLines.map(l => ({
          sku_id: l.sku_id,
          expected_qty: parseFloat(l.expected_qty),
          received_qty: null,
        })),
        notes: notes || undefined,
      });
      setResult(res);
    } catch (e: any) {
      setError(e.message || 'Failed to create hub receiving');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setTripId('');
    setSourceUnitId('');
    setLines([{ sku_id: 'tuna-raw', expected_qty: '' }]);
    setNotes('');
    setError('');
  };

  if (result) {
    return (
      <div className="max-w-2xl space-y-4">
        <Card title="Hub Receiving Created" subtitle="The receiving record has been registered successfully">
          <div className="space-y-4">
            <Alert type="success" message={`Receiving record created successfully.`} />
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Document ID</span>
                <span className="font-mono font-semibold text-slate-800">{result.doc_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status</span>
                <span className="font-semibold text-blue-700">{result.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Trip ID</span>
                <span className="font-mono">{tripId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Lines</span>
                <span>{lines.filter(l => l.expected_qty && parseFloat(l.expected_qty) > 0).length} SKU(s)</span>
              </div>
            </div>
            <p className="text-sm text-slate-600">
              Next step: Navigate to <strong>Inspect Quantities</strong> to record actual received quantities and QC status for this receiving.
            </p>
            <div className="flex gap-3 pt-2">
              <Button variant="primary" onClick={() => navigate('/app/hub/inspect')}>
                Go to Inspect Quantities →
              </Button>
              <Button variant="secondary" onClick={handleReset}>
                Create Another
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
      <Card title="Create Hub Receiving" subtitle="Register expected catch from a closed boat trip">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Trip ID" required hint="Must be a closed trip">
              <Input value={tripId} onChange={e => setTripId(e.target.value)} placeholder="e.g. TRIP-001" />
            </FormField>
            <FormField label="Source Boat Unit ID" required hint="The boat unit that made the trip">
              <Input value={sourceUnitId} onChange={e => setSourceUnitId(e.target.value)} placeholder="e.g. test-boat-1" />
            </FormField>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-slate-700">
                Expected Lines <span className="text-red-500">*</span>
              </label>
              <Button type="button" variant="ghost" onClick={addLine}>+ Add SKU</Button>
            </div>
            <div className="space-y-2">
              {lines.map((line, idx) => (
                <div key={idx} className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <Select value={line.sku_id} onChange={e => updateLine(idx, 'sku_id', e.target.value)} className="flex-1">
                    {SKU_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </Select>
                  <Input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={line.expected_qty}
                    onChange={e => updateLine(idx, 'expected_qty', e.target.value)}
                    placeholder="expected kg"
                    className="w-36"
                  />
                  {lines.length > 1 && (
                    <Button type="button" variant="ghost" onClick={() => removeLine(idx)} className="text-red-500 px-2">✕</Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <FormField label="Notes">
            <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional notes" />
          </FormField>

          {error && <Alert type="error" message={error} />}

          <div className="flex gap-3 pt-2">
            <Button type="submit" loading={loading}>Create Receiving Record</Button>
            <Button type="button" variant="secondary" onClick={() => navigate('/app/hub/trips')}>
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default HubReceivingCreate;
