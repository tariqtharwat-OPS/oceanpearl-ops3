import React, { useEffect, useState } from 'react';
import { Card, Button, Alert, StatusBadge, Table } from '../../components/ops3/Card';
import { listHubReceivings } from '../../services/ops3Service';
import { useAuth } from '../../contexts/AuthContext';

const HubVarianceReport: React.FC = () => {
  const { userProfile } = useAuth();
  const companyId = userProfile?.companyId || 'oceanpearl';
  const locationId = userProfile?.allowedLocationIds?.[0] || 'test-loc-1';
  const unitId = userProfile?.allowedUnitIds?.[0] || 'test-hub-1';

  const [receivings, setReceivings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      // Load confirmed receivings
      const confirmed = await listHubReceivings(companyId, locationId, unitId, 'confirmed');
      setReceivings(confirmed);
    } catch (e: any) {
      setError(e.message || 'Failed to load variance data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const computeVariance = (rec: any) => {
    const lines = rec.received_lines || [];
    const totalExpected = lines.reduce((s: number, l: any) => s + (l.expected_qty || 0), 0);
    const totalReceived = lines.reduce((s: number, l: any) => s + (l.received_qty || 0), 0);
    return { totalExpected, totalReceived, variance: totalReceived - totalExpected };
  };

  const rows = receivings.map(r => {
    const { totalExpected, totalReceived, variance } = computeVariance(r);
    const variancePct = totalExpected > 0 ? ((variance / totalExpected) * 100).toFixed(1) : '0.0';
    return [
      <span className="font-mono text-xs">{r.id}</span>,
      <span className="font-mono text-xs">{r.trip_id}</span>,
      <StatusBadge status={r.status} />,
      <span>{totalExpected} kg</span>,
      <span>{totalReceived} kg</span>,
      <span className={`font-semibold ${variance < 0 ? 'text-red-600' : variance > 0 ? 'text-green-600' : 'text-slate-600'}`}>
        {variance >= 0 ? '+' : ''}{variance} kg ({variancePct}%)
      </span>,
      r.has_variance ? (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">Flagged</span>
      ) : (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">OK</span>
      ),
    ];
  });

  // Summary stats
  const totalVarianceKg = receivings.reduce((s, r) => {
    const { variance } = computeVariance(r);
    return s + variance;
  }, 0);
  const flaggedCount = receivings.filter(r => r.has_variance).length;

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <div className="text-2xl font-bold text-slate-800">{receivings.length}</div>
          <div className="text-sm text-slate-500 mt-1">Confirmed Receivings</div>
        </Card>
        <Card>
          <div className={`text-2xl font-bold ${flaggedCount > 0 ? 'text-red-600' : 'text-green-600'}`}>{flaggedCount}</div>
          <div className="text-sm text-slate-500 mt-1">Variance Flagged</div>
        </Card>
        <Card>
          <div className={`text-2xl font-bold ${totalVarianceKg < 0 ? 'text-red-600' : totalVarianceKg > 0 ? 'text-green-600' : 'text-slate-800'}`}>
            {totalVarianceKg >= 0 ? '+' : ''}{totalVarianceKg.toFixed(1)} kg
          </div>
          <div className="text-sm text-slate-500 mt-1">Total Net Variance</div>
        </Card>
      </div>

      <Card title="Variance Report" subtitle="All confirmed hub receivings with quantity variance analysis">
        <div className="flex justify-end mb-4">
          <Button variant="secondary" onClick={load} loading={loading}>Refresh</Button>
        </div>
        {error && <Alert type="error" message={error} />}
        <Table
          headers={['Doc ID', 'Trip ID', 'Status', 'Expected', 'Received', 'Variance', 'Flag']}
          rows={rows}
          emptyMessage="No confirmed receivings found. Confirm a hub receiving record to see variance data here."
        />
      </Card>
    </div>
  );
};

export default HubVarianceReport;
