import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Alert, FormField, Input, StatusBadge } from '../../components/ops3/Card';
import { getHubReceiving, confirmHubReceiving, cancelHubReceiving } from '../../services/ops3Service';

const HubReceivingConfirm: React.FC = () => {
  const navigate = useNavigate();
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
    if (!docId.trim()) { setError('Please enter a document ID.'); return; }
    setLookupLoading(true);
    setError('');
    setReceivingData(null);
    setResult(null);
    setShowCancel(false);
    try {
      const res = await getHubReceiving(docId);
      setReceivingData((res as any).data);
    } catch (e: any) {
      setError(e.message || 'Hub receiving record not found. Check the document ID and try again.');
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

  if (result?.type === 'confirmed') {
    return (
      <div className="max-w-2xl space-y-4">
        <Card title="Receiving Confirmed" subtitle="Inventory transfer has been posted to the ledger">
          <div className="space-y-4">
            <Alert type="success" message="Hub receiving confirmed. Inventory transfer queued in the ledger." />
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Document ID</span>
                <span className="font-mono font-semibold">{result.doc_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status</span>
                <span className="font-semibold text-green-700">{result.status}</span>
              </div>
              {result.ledger_document_id && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Ledger Doc ID</span>
                  <span className="font-mono text-xs break-all">{result.ledger_document_id}</span>
                </div>
              )}
            </div>
            <p className="text-sm text-slate-600">
              Inventory states will update asynchronously as the ledger trigger processes the transfer.
              View the <strong>Variance Report</strong> to see the confirmed receiving.
            </p>
            <div className="flex gap-3 pt-2">
              <Button variant="primary" onClick={() => navigate('/app/hub/variance')}>
                View Variance Report →
              </Button>
              <Button variant="secondary" onClick={() => { setResult(null); setDocId(''); }}>
                Confirm Another
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

  if (result?.type === 'cancelled') {
    return (
      <div className="max-w-2xl space-y-4">
        <Card title="Receiving Cancelled" subtitle="The receiving record has been cancelled">
          <div className="space-y-4">
            <Alert type="warning" message={`Receiving cancelled. Document ID: ${result.doc_id}`} />
            <div className="flex gap-3 pt-2">
              <Button variant="secondary" onClick={() => { setResult(null); setDocId(''); }}>
                Look Up Another
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
      <Card title="Confirm Receiving" subtitle="Confirm an inspected hub receiving record to post the inventory transfer">
        <div className="space-y-5">
          {/* Step 1: Lookup */}
          <div className="flex gap-2">
            <div className="flex-1">
              <FormField label="Hub Receiving Document ID" required hint="Enter the doc ID from the Inspect Quantities step">
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

          {/* Step 2: Review and confirm — only shown after lookup */}
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

              {/* Lines detail */}
              <div className="space-y-1">
                {receivingData.received_lines?.map((l: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-2 bg-white border border-slate-100 rounded text-sm">
                    <span className="font-mono text-slate-700">{l.sku_id}</span>
                    <span className="text-slate-500">Exp: {l.expected_qty} kg</span>
                    <span className="text-slate-700">Rcv: {l.received_qty ?? '—'} kg</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${l.qc_status === 'passed' ? 'bg-green-100 text-green-700' : l.qc_status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {l.qc_status || '—'}
                    </span>
                  </div>
                ))}
              </div>

              {/* Status warning if not in_inspection */}
              {receivingData.status !== 'in_inspection' && (
                <Alert type="warning" message={`This receiving is in status "${receivingData.status}" and cannot be confirmed. Only records in "in_inspection" status can be confirmed.`} />
              )}

              {/* Actions — only shown when in_inspection */}
              {receivingData.status === 'in_inspection' && (
                <div className="flex gap-3">
                  <Button onClick={handleConfirm} loading={loading}>
                    Confirm & Post to Ledger
                  </Button>
                  <Button variant="danger" type="button" onClick={() => setShowCancel(!showCancel)}>
                    {showCancel ? 'Hide Cancel' : 'Cancel Receiving'}
                  </Button>
                  <Button variant="ghost" type="button" onClick={() => { setReceivingData(null); setDocId(''); }}>
                    ← Back
                  </Button>
                </div>
              )}

              {showCancel && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg space-y-3">
                  <FormField label="Cancellation Reason" required>
                    <Input
                      value={cancelReason}
                      onChange={e => setCancelReason(e.target.value)}
                      placeholder="Reason for cancellation"
                    />
                  </FormField>
                  <div className="flex gap-3">
                    <Button variant="danger" onClick={handleCancel} loading={cancelLoading}>
                      Confirm Cancellation
                    </Button>
                    <Button variant="ghost" onClick={() => setShowCancel(false)}>
                      Keep Record
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Errors shown at bottom */}
          {error && <Alert type="error" message={error} />}
        </div>
      </Card>
    </div>
  );
};

export default HubReceivingConfirm;
