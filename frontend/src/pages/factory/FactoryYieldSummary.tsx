import React, { useState } from 'react';
import { Card, Button, Alert, FormField, Input, StatusBadge } from '../../components/ops3/Card';
import { getProcessingBatch } from '../../services/ops3Service';

const FactoryYieldSummary: React.FC = () => {
  const [docId, setDocId] = useState('');
  const [batch, setBatch] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBatch(null);
    if (!docId.trim()) return;
    setLoading(true);
    try {
      const data = await getProcessingBatch(docId);
      setBatch(data);
    } catch (e: any) {
      setError(e.message || 'Batch not found');
    } finally {
      setLoading(false);
    }
  };

  const yieldPct = batch?.actual_yield != null ? (batch.actual_yield * 100).toFixed(2) : null;
  const expectedPct = batch?.expected_yield != null ? (batch.expected_yield * 100).toFixed(2) : null;
  const variancePct = batch?.variance != null ? (batch.variance * 100).toFixed(2) : null;
  const variancePositive = batch?.variance != null && batch.variance >= 0;

  return (
    <div className="max-w-2xl space-y-4">
      <Card title="Batch Yield Summary" subtitle="Look up a processing batch to view its yield metrics">
        <form onSubmit={handleLookup} className="flex gap-2 mb-6">
          <div className="flex-1">
            <Input value={docId} onChange={e => setDocId(e.target.value)} placeholder="Processing batch doc_id" />
          </div>
          <Button type="submit" loading={loading}>Look Up</Button>
        </form>

        {error && <Alert type="error" message={error} />}

        {batch && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-bold text-slate-800">{batch.batch_id || batch.doc_id}</div>
                <div className="text-sm text-slate-500">{batch.unit_id} · {batch.location_id}</div>
              </div>
              <StatusBadge status={batch.status} />
            </div>

            {/* Yield metrics */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-slate-50 rounded-lg text-center">
                <div className="text-2xl font-bold text-slate-800">{batch.total_input_qty ?? '—'}</div>
                <div className="text-xs text-slate-500 mt-1">Input (kg)</div>
              </div>
              <div className="p-4 bg-slate-50 rounded-lg text-center">
                <div className="text-2xl font-bold text-slate-800">{batch.total_output_qty ?? '—'}</div>
                <div className="text-xs text-slate-500 mt-1">Output (kg)</div>
              </div>
              <div className={`p-4 rounded-lg text-center ${yieldPct ? 'bg-blue-50' : 'bg-slate-50'}`}>
                <div className="text-2xl font-bold text-blue-700">{yieldPct ? `${yieldPct}%` : '—'}</div>
                <div className="text-xs text-slate-500 mt-1">Actual Yield</div>
              </div>
            </div>

            {/* Variance */}
            {expectedPct && (
              <div className="p-4 bg-white border border-slate-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Expected Yield</span>
                  <span className="font-semibold">{expectedPct}%</span>
                </div>
                {variancePct && (
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm text-slate-600">Variance</span>
                    <span className={`font-semibold ${variancePositive ? 'text-green-600' : 'text-red-600'}`}>
                      {variancePositive ? '+' : ''}{variancePct}%
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Input lines */}
            {batch.input_lines?.length > 0 && (
              <div>
                <div className="text-sm font-semibold text-slate-700 mb-2">Input Lines</div>
                <div className="space-y-1">
                  {batch.input_lines.map((l: any, i: number) => (
                    <div key={i} className="flex justify-between text-sm p-2 bg-red-50 rounded">
                      <span className="font-mono">{l.sku_id}</span>
                      <span className="text-red-700">−{l.qty} kg</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Output lines */}
            {batch.output_lines?.length > 0 && (
              <div>
                <div className="text-sm font-semibold text-slate-700 mb-2">Output Lines</div>
                <div className="space-y-1">
                  {batch.output_lines.map((l: any, i: number) => (
                    <div key={i} className={`flex justify-between text-sm p-2 rounded ${l.is_waste ? 'bg-orange-50' : 'bg-green-50'}`}>
                      <span className="font-mono">{l.sku_id}{l.is_waste ? ' (waste)' : ''}</span>
                      <span className={l.is_waste ? 'text-orange-700' : 'text-green-700'}>+{l.qty} kg</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Linked transformations */}
            {batch.transformation_document_ids?.length > 0 && (
              <div>
                <div className="text-sm font-semibold text-slate-700 mb-2">Linked Transformation Documents</div>
                <div className="space-y-1">
                  {batch.transformation_document_ids.map((id: string, i: number) => (
                    <div key={i} className="text-xs font-mono p-2 bg-slate-50 rounded text-slate-600 break-all">{id}</div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};

export default FactoryYieldSummary;
