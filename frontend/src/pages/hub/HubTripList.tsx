import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, StatusBadge, Table, Button, Alert } from '../../components/ops3/Card';
import { listClosedTrips } from '../../services/ops3Service';
import { useAuth } from '../../contexts/AuthContext';

const HubTripList: React.FC = () => {
  const navigate = useNavigate();
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
    <span className="text-xs text-slate-500">
      {t.closed_at?.toDate?.()?.toLocaleDateString() || t.updated_at?.toDate?.()?.toLocaleDateString() || '—'}
    </span>,
    <span className="text-xs">{t.vessel_name || '—'}</span>,
    <Button
      variant="ghost"
      className="text-xs px-2 py-1"
      onClick={() => navigate('/app/hub/create')}
    >
      Create Receiving →
    </Button>,
  ]);

  return (
    <div className="space-y-4">
      <Card title="Closed Trips" subtitle="Trips available for hub receiving">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-slate-500">
            {loading ? 'Loading...' : `${trips.length} closed trip(s) found`}
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={load} loading={loading}>Refresh</Button>
            <Button variant="primary" onClick={() => navigate('/app/hub/create')}>
              + Create Receiving
            </Button>
          </div>
        </div>
        {error && <Alert type="error" message={error} />}
        <Table
          headers={['Trip ID', 'Boat Unit', 'Status', 'Closed At', 'Vessel', 'Action']}
          rows={rows}
          emptyMessage="No closed trips found. Trips must be closed by the boat operator before hub receiving can begin."
        />
      </Card>
    </div>
  );
};

export default HubTripList;
