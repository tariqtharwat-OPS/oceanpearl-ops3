import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, StatusBadge, Table, Button, Alert } from '../../components/ops3/Card';
import { listProcessingBatches } from '../../services/ops3Service';
import { useAuth } from '../../contexts/AuthContext';

const FactoryBatchList: React.FC = () => {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const companyId = userProfile?.companyId || 'oceanpearl';
  const locationId = userProfile?.allowedLocationIds?.[0] || 'test-loc-1';
  const unitId = userProfile?.allowedUnitIds?.[0] || 'test-factory-1';

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await listProcessingBatches(companyId, locationId, unitId, statusFilter || undefined);
      setBatches(data);
    } catch (e: any) {
      setError(e.message || 'Failed to load batches');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [statusFilter]);

  const rows = batches.map(b => [
    <span className="font-mono text-xs">{b.batch_id || b.id}</span>,
    <StatusBadge status={b.status} />,
    <span>{b.total_input_qty ?? '—'} kg</span>,
    <span>{b.total_output_qty ?? '—'} kg</span>,
    <span>{b.actual_yield != null ? `${(b.actual_yield * 100).toFixed(1)}%` : '—'}</span>,
    <span className="text-xs text-slate-500">{b.created_at?.toDate?.()?.toLocaleDateString() || '—'}</span>,
    <Button
      variant="ghost"
      className="text-xs px-2 py-1"
      onClick={() => navigate('/app/factory/wip-create')}
    >
      Start WIP →
    </Button>,
  ]);

  return (
    <div className="space-y-4">
      <Card title="Active Processing Batches" subtitle={`Unit: ${unitId} · Location: ${locationId}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <select
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <Button variant="secondary" onClick={load} loading={loading}>Refresh</Button>
          </div>
          <Button variant="primary" onClick={() => navigate('/app/factory/batch-create')}>
            + Create Batch
          </Button>
        </div>
        {error && <Alert type="error" message={error} />}
        <Table
          headers={['Batch ID', 'Status', 'Input Qty', 'Output Qty', 'Yield', 'Created', 'Action']}
          rows={rows}
          emptyMessage="No processing batches found for this unit. Click '+ Create Batch' to get started."
        />
      </Card>
    </div>
  );
};

export default FactoryBatchList;
