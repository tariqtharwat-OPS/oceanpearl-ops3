import React, { useState } from 'react';
import { Card, Button, Alert, FormField, Input, Select } from '../../components/ops3/Card';
import { createProcessingBatch } from '../../services/ops3Service';
import { useAuth } from '../../contexts/AuthContext';

const SKU_OPTIONS = ['tuna-raw', 'tuna-fillet', 'tuna-loin', 'tuna-waste', 'shrimp-raw', 'shrimp-peeled'];

const FactoryBatchCreate: React.FC = () => {
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
      setBatchId(`BATCH-${Date.now()}`);
    } catch (e: any) {
      setError(e.message || 'Failed to create batch');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-4">
      <Card title="Create Processing Batch" subtitle="Define input material and expected output lines">
        <form onSubmit={handleSubmit} className="space-y-5">
          <FormField label="Batch ID" required>
            <Input value={batchId} onChange={e => setBatchId(e.target.value)} required />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Input SKU" required>
              <Select value={inputSku} onChange={e => setInputSku(e.target.value)}>
                {SKU_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </Select>
            </FormField>
            <FormField label="Input Quantity (kg)" required>
              <Input type="number" min="0.01" step="0.01" value={inputQty} onChange={e => setInputQty(e.target.value)} placeholder="e.g. 100" required />
            </FormField>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-slate-700">Output Lines</label>
              <Button type="button" variant="ghost" onClick={addOutputLine}>+ Add Line</Button>
            </div>
            <div className="space-y-2">
              {outputLines.map((line, idx) => (
                <div key={idx} className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
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
                    <input type="checkbox" checked={line.is_waste} onChange={e => updateOutputLine(idx, 'is_waste', e.target.checked)} />
                    Waste
                  </label>
                  <Button type="button" variant="ghost" onClick={() => removeOutputLine(idx)} className="text-red-500 px-2">✕</Button>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Expected Yield (0–1)" hint="e.g. 0.5 = 50%">
              <Input type="number" min="0" max="1" step="0.01" value={expectedYield} onChange={e => setExpectedYield(e.target.value)} />
            </FormField>
            <FormField label="Notes">
              <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional" />
            </FormField>
          </div>

          {error && <Alert type="error" message={error} />}
          {result && (
            <Alert type="success" message={`Batch created: ${result.doc_id} · Status: ${result.status}`} />
          )}

          <Button type="submit" loading={loading}>Create Batch</Button>
        </form>
      </Card>
    </div>
  );
};

export default FactoryBatchCreate;
