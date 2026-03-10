import React, { useState } from 'react';
import { Card, Button, Alert, FormField, Input, StatusBadge } from '../../components/ops3/Card';
import { getHubReceiving, confirmHubReceiving, cancelHubReceiving } from '../../services/ops3Service';

const HubReceivingConfirm: React.FC = () => {
  const [docId, setDocId] = useState('');
  const [receivingData, setReceivingData] = useState<any>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [showCancel, setShowCancel] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const lookupReceiving = async () => {
    if (!docId.trim()) return;
    setLookupLoading(true);
    setError('');
    setReceivingData(null);
    setResult(null);
    try {
      const res = await getHubReceiving(docId);
      setReceivingData((res as any).data);
    } catch (e: any) {
      setError(e.message || 'Hub receiving record not found');
    } finally {
      setLookupLoading(false);
    }
  };

  const handleConfirm = async () => {
    setError('');
    setResult(null);
    setLoading(true);
    try {
      const res = await confirmHubReceiving({ doc_id: docId });
      setResult({ type: 'confirmed', ...res });
      setReceivingData(null);
    } catch (e: any) {
      setError(e.message || 'Failed to confirm receiving');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!cancelReason.trim()) { setError('Cancellation reason is required.'); return; }
    setError('');
    setCancelLoading(true);
    try {
      const res = await cancelHubReceiving({ doc_id: docId, reason: cancelReason });
      setResult({ type: 'cancelled', ...res });
      setReceivingData(null);
      setShowCancel(false);
    } catch (e: any) {
      setError(e.message || 'Failed to cancel receiving');
    } finally {
      setCancelLoading(false);
    }
  };

  const totalExpected = receivingData?.received_lines?.reduce((s: number, l: any) => s + (l.expected_qty || 0), 0) || 0;
  const totalReceived = receivingData?.received_lines?.reduce((s: number, l: any) => s + (l.received_qty || 0), 0) || 0;
  const variance = totalReceived - totalExpected;

  return (
    <div className="max-w-2xl space-y-4">
      <Card title="Confirm Receiving" subtitle="Confirm an inspected hub receiving record to post the inventory transfer">
        <div className="space-y-5">
          <div className="flex gap-2">
            <div className="flex-1">
              <FormField label="Hub Receiving Document ID" required>
                <Input value={docId} onChange={e => setDocId(e.target.value)} placeholder="Hub receiving doc ID" />
              </FormField>
            </div>
            <div className="flex items-end">
              <Button type="button" variant="secondary" onClick={lookupReceiving} loading={lookupLoading}>Look Up</Button>
            </div>
          </div>

          {receivingData && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-semibold text-slate-800">Receiving Summary</span>
                  <StatusBadge status={receivingData.status} />
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-xl font-bold text-slate-800">{totalExpected} kg</div>
                    <div className="text-xs text-slate-500">Expected</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-slate-800">{totalReceived} kg</div>
                    <div className="text-xs text-slate-500">Received</div>
                  </div>
                  <div>
                    <div className={`text-xl font-bold ${variance < 0 ? 'text-red-600' : variance > 0 ? 'text-green-600' : 'text-slate-800'}`}>
                      {variance >= 0 ? '+' : ''}{variance} kg
                    </div>
                    <div className="text-xs text-slate-500">Variance</div>
                  </div>
                </div>
              </div>

              {/* Lines */}
              <div className="space-y-1">
                {receivingData.received_lines?.map((l: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-2 bg-white border border-slate-100 rounded text-sm">
                    <span className="font-mono text-slate-700">{l.sku_id}</span>
                    <span className="text-slate-500">Expected: {l.expected_qty} kg</span>
                    <span className="text-slate-700">Received: {l.received_qty ?? '—'} kg</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${l.qc_status === 'passed' ? 'bg-green-100 text-green-700' : l.qc_status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {l.qc_status || '—'}
                    </span>
                  </div>
                ))}
              </div>

              {/* Actions */}
              {receivingData.status === 'in_inspection' && (
                <div className="flex gap-3">
                  <Button onClick={handleConfirm} loading={loading}>
                    Confirm & Post to Ledger
                  </Button>
                  <Button variant="danger" type="button" onClick={() => setShowCancel(!showCancel)}>
                    Cancel Receiving
                  </Button>
                </div>
              )}

              {showCancel && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg space-y-3">
                  <FormField label="Cancellation Reason" required>
                    <Input value={cancelReason} onChange={e => setCancelReason(e.target.value)} placeholder="Reason for cancellation" />
                  </FormField>
                  <Button variant="danger" onClick={handleCancel} loading={cancelLoading}>Confirm Cancellation</Button>
                </div>
              )}
            </div>
          )}

          {error && <Alert type="error" message={error} />}

          {result && result.type === 'confirmed' && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-sm space-y-1">
              <div className="font-semibold text-green-800">Receiving Confirmed — Inventory Transfer Posted</div>
              <div className="text-green-700">Status: <strong>{result.status}</strong></div>
              <div className="text-green-700 break-all">Ledger Document ID: <code className="text-xs">{result.ledger_document_id}</code></div>
              <div className="text-green-600 text-xs mt-1">The inventory transfer has been queued in the ledger. Inventory states will update asynchronously.</div>
            </div>
          )}

          {result && result.type === 'cancelled' && (
            <Alert type="warning" message={`Receiving cancelled: ${result.doc_id} · Status: ${result.status}`} />
          )}
        </div>
      </Card>
    </div>
  );
};

export default HubReceivingConfirm;
