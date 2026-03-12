import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Alert, FormField, Input, Select } from '../../components/ops3/Card';
import { createProcessingBatch } from '../../services/ops3Service';
import { useAuth } from '../../contexts/AuthContext';

const SKU_OPTIONS = ['tuna-raw', 'tuna-fillet', 'tuna-loin', 'tuna-waste', 'shrimp-raw', 'shrimp-peeled'];

const FactoryBatchCreate: React.FC = () => {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const companyId = userProfile?.companyId || 'oceanpearl';
  const locationId = userProfile?.allowedLocationIds?.[0] || 'test-loc-1';
  const unitId = userProfile?.allowedUnitIds?.[0] || 'test-factory-1';

  const [batchId, setBatchId] = useState(`BATCH-${Date.now()}`);
  const [inputSku, setInputSku] = useState('tuna-raw');
  const [inputQty, setInputQty] = useState('');
  const [outputLines, setOutputLines] = useState([
    { sku_id: 'tuna-fillet', qty: '', is_waste: false },
    { sku_id: 'tuna-waste', qty: '', is_waste: true },
  ]);
  const [expectedYield, setExpectedYield] = useState('0.5');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const addOutputLine = () => {
    setOutputLines(prev => [...prev, { sku_id: 'tuna-fillet', qty: '', is_waste: false }]);
  };

  const removeOutputLine = (idx: number) => {
    setOutputLines(prev => prev.filter((_, i) => i !== idx));
  };

  const updateOutputLine = (idx: number, field: string, value: any) => {
    setOutputLines(prev => prev.map((l, i) => i === idx ? { ...l, [field]: value } : l));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResult(null);
    if (!batchId.trim()) { setError('Batch ID is required.'); return; }
    if (!inputQty || parseFloat(inputQty) <= 0) {
      setError('Input quantity must be greater than 0.');
      return;
    }
    setLoading(true);
    try {
      const res = await createProcessingBatch({
        batch_id: batchId,
        company_id: companyId,
        location_id: locationId,
        unit_id: unitId,
        input_lines: [{ sku_id: inputSku, qty: parseFloat(inputQty), unit_id: unitId, location_id: locationId }],
        output_lines: outputLines
          .filter(l => l.qty && parseFloat(l.qty as string) > 0)
          .map(l => ({ sku_id: l.sku_id, qty: parseFloat(l.qty as string), unit_id: unitId, location_id: locationId, is_waste: l.is_waste })),
        expected_yield: parseFloat(expectedYield) || undefined,
        notes: notes || undefined,
      });
      setResult(res);
    } catch (e: any) {
      setError(e.message || 'Failed to create batch');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setBatchId(`BATCH-${Date.now()}`);
    setInputQty('');
    setOutputLines([
      { sku_id: 'tuna-fillet', qty: '', is_waste: false },
      { sku_id: 'tuna-waste', qty: '', is_waste: true },
    ]);
    setNotes('');
    setError('');
  };

  if (result) {
    return (
      <div className="max-w-2xl space-y-4">
        <Card title="Processing Batch Created" subtitle="The batch has been registered and is ready for WIP processing">
          <div className="space-y-4">
            <Alert type="success" message="Processing batch created successfully." />
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Document ID</span>
                <span className="font-mono font-semibold">{result.doc_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Batch ID</span>
                <span className="font-mono">{batchId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status</span>
                <span className="font-semibold text-blue-700">{result.status}</span>
              </div>
            </div>
            <p className="text-sm text-slate-600">
              Next step: Go to <strong>Start WIP Processing</strong> to begin factory floor processing for this batch.
            </p>
            <div className="flex gap-3 pt-2">
              <Button variant="primary" onClick={() => navigate('/app/factory/wip-create')}>
                Start WIP Processing →
              </Button>
              <Button variant="secondary" onClick={handleReset}>
                Create Another Batch
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
      <Card title="Create Processing Batch" subtitle="Define input material and expected output lines">
        <form onSubmit={handleSubmit} className="space-y-5">
          <FormField label="Batch ID" required>
            <Input value={batchId} onChange={e => setBatchId(e.target.value)} />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Input SKU" required>
              <Select value={inputSku} onChange={e => setInputSku(e.target.value)}>
                {SKU_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </Select>
            </FormField>
            <FormField label="Input Quantity (kg)" required>
              <Input
                type="number"
                min="0.01"
                step="0.01"
                value={inputQty}
                onChange={e => setInputQty(e.target.value)}
                placeholder="e.g. 100"
              />
            </FormField>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-slate-700">Output Lines</label>
              <Button type="button" variant="ghost" onClick={addOutputLine}>+ Add Line</Button>
            </div>
            <div className="space-y-2">
              {outputLines.map((line, idx) => (
                <div key={idx} className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <Select
                    value={line.sku_id}
                    onChange={e => updateOutputLine(idx, 'sku_id', e.target.value)}
                    className="flex-1"
                  >
                    {SKU_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </Select>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={line.qty}
                    onChange={e => updateOutputLine(idx, 'qty', e.target.value)}
                    placeholder="qty kg"
                    className="w-28"
                  />
                  <label className="flex items-center gap-1 text-xs text-slate-500 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={line.is_waste}
                      onChange={e => updateOutputLine(idx, 'is_waste', e.target.checked)}
                    />
                    Waste
                  </label>
                  {outputLines.length > 1 && (
                    <Button type="button" variant="ghost" onClick={() => removeOutputLine(idx)} className="text-red-500 px-2">✕</Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Expected Yield (0–1)" hint="e.g. 0.5 = 50%">
              <Input
                type="number"
                min="0"
                max="1"
                step="0.01"
                value={expectedYield}
                onChange={e => setExpectedYield(e.target.value)}
              />
            </FormField>
            <FormField label="Notes">
              <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional" />
            </FormField>
          </div>

          {error && <Alert type="error" message={error} />}

          <div className="flex gap-3 pt-2">
            <Button type="submit" loading={loading}>Create Batch</Button>
            <Button type="button" variant="secondary" onClick={() => navigate('/app/factory/batches')}>
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default FactoryBatchCreate;
