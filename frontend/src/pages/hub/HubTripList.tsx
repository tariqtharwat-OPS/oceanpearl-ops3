import React, { useEffect, useState } from 'react';
import { Card, StatusBadge, Table, Button, Alert } from '../../components/ops3/Card';
import { listClosedTrips } from '../../services/ops3Service';
import { useAuth } from '../../contexts/AuthContext';

const HubTripList: React.FC = () => {
  const { userProfile } = useAuth();
  const locationId = userProfile?.allowedLocationIds?.[0] || 'test-loc-1';

  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await listClosedTrips(locationId);
      setTrips(data);
    } catch (e: any) {
      setError(e.message || 'Failed to load trips');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const rows = trips.map(t => [
    <span className="font-mono text-xs">{t.id}</span>,
    <span>{t.unit_id || '—'}</span>,
    <StatusBadge status={t.status} />,
    <span className="text-xs text-slate-500">{t.closed_at?.toDate?.()?.toLocaleDateString() || t.updated_at?.toDate?.()?.toLocaleDateString() || '—'}</span>,
    <span className="text-xs">{t.vessel_name || '—'}</span>,
  ]);

  return (
    <div className="space-y-4">
      <Card title="Closed Trips" subtitle="Trips available for hub receiving">
        <div className="flex justify-end mb-4">
          <Button variant="secondary" onClick={load} loading={loading}>Refresh</Button>
        </div>
        {error && <Alert type="error" message={error} />}
        <Table
          headers={['Trip ID', 'Boat Unit', 'Status', 'Closed At', 'Vessel']}
          rows={rows}
          emptyMessage="No closed trips found. Trips must be closed by the boat operator before hub receiving can begin."
        />
      </Card>
    </div>
  );
};

export default HubTripList;
