/**
 * OPS V3 - System Admin Panel
 * Bootstrap controls, Seed data, and User Directory
 */

import { useState, useEffect } from 'react';
import { httpsCallable } from 'firebase/functions';
import { collection, getDocs } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';
import { functions, db } from '../firebase';

interface UserProfile {
  email: string;
  role: string;
  allowedLocationIds: string[];
  allowedUnitIds: string[];
}

interface AdminPanelProps {
  userProfile: UserProfile | null;
}

const AdminPanelFull = ({ userProfile }: AdminPanelProps) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [result, setResult] = useState<any>(null);

  // Fetch users from Firestore
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const q = collection(db, 'v3_users');
      const snap = await getDocs(q);
      const userList = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(userList);
    } catch (error: any) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleBootstrap = async () => {
    setLoading(true);
    setResult(null);
    try {
      const v3Bootstrap = httpsCallable(functions, 'v3Bootstrap');
      const res = await v3Bootstrap({ secret: 'OceanPearl2026Bootstrap!' });
      setResult({ type: 'Bootstrap', data: res.data });
    } catch (error: any) {
      setResult({ type: 'Bootstrap Error', error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSeed = async () => {
    setLoading(true);
    setResult(null);
    try {
      const v3SeedTestPack = httpsCallable(functions, 'v3SeedTestPack');
      const res = await v3SeedTestPack();
      setResult({ type: 'Seed', data: res.data });
      fetchUsers(); // Refresh users after seed
    } catch (error: any) {
      setResult({ type: 'Seed Error', error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ color: '#0f172a', marginBottom: '0.5rem' }}>{t('admin_custom.panel')}</h1>
      <p style={{ color: '#64748b', marginBottom: '2rem' }}>{t('auth.loggedInAs')}: <strong>{userProfile?.email}</strong> ({userProfile?.role})</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>

        {/* System Controls */}
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '1rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', border: '1px solid #f1f5f9' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', color: '#1e293b' }}>{t('nav.settings')}</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>{t('admin_custom.bootstrap')}</h3>
              <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '1rem' }}>{t('admin_custom.bootstrap_desc')}</p>
              <button
                onClick={handleBootstrap}
                disabled={loading}
                style={{ width: '100%', padding: '0.75rem', background: '#0f172a', color: 'white', border: 'none', borderRadius: '0.5rem', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer' }}
              >
                {t('admin_custom.run')} Bootstrap
              </button>
            </div>

            <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>{t('admin_custom.seed')}</h3>
              <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '1rem' }}>{t('admin_custom.seed_desc')}</p>
              <button
                onClick={handleSeed}
                disabled={loading}
                style={{ width: '100%', padding: '0.75rem', background: '#2563eb', color: 'white', border: 'none', borderRadius: '0.5rem', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer' }}
              >
                {t('admin_custom.run')} Seeding
              </button>
            </div>
          </div>

          {result && (
            <div style={{ marginTop: '1.5rem', padding: '1rem', background: result.error ? '#fef2f2' : '#f0fdf4', borderRadius: '0.5rem', border: `1px solid ${result.error ? '#fee2e2' : '#dcfce7'}` }}>
              <h4 style={{ fontSize: '0.875rem', margin: '0 0 0.5rem 0' }}>{result.type} {t('admin_custom.result')}:</h4>
              <pre style={{ fontSize: '0.75rem', overflow: 'auto', maxHeight: '200px' }}>
                {JSON.stringify(result.error || result.data, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* User Directory */}
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '1rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', border: '1px solid #f1f5f9' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', color: '#1e293b' }}>{t('admin_custom.users')}</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {users.length === 0 && <p style={{ fontSize: '0.875rem', color: '#94a3b8' }}>{t('admin_custom.no_users')}</p>}
            {users.map(u => (
              <div key={u.id} style={{ padding: '1rem', background: '#f8fafc', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: '700', color: '#0f172a' }}>{u.displayName || u.email}</span>
                  <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', background: '#e2e8f0', borderRadius: '1rem', fontWeight: '600' }}>{u.role}</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  <div><strong>{t('admin.locations')}:</strong> {u.allowedLocationIds?.length ? u.allowedLocationIds.join(', ') : 'Global'}</div>
                  <div><strong>{t('location.places')}:</strong> {u.allowedUnitIds?.length ? u.allowedUnitIds.join(', ') : 'All'}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminPanelFull;
