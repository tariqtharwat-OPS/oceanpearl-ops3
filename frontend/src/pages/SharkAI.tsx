/**
 * OPS V3 - Shark AI Dashboard
 * Fraud detection and risk monitoring
 */

import { useState, useEffect } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase';
import { getCurrentLanguage, t, type Language } from '../i18n';

interface UserProfile {
  email: string;
  role: string;
}

interface SharkAIProps {
  userProfile: UserProfile | null;
}

const SharkAI = ({ userProfile }: SharkAIProps) => {
  const [language] = useState<Language>(getCurrentLanguage());
  const [alerts, setAlerts] = useState<any[]>([]);
  const [riskSummary, setRiskSummary] = useState<any>(null);
  const [closingAlert, setClosingAlert] = useState<string | null>(null);
  const [resolutionNote, setResolutionNote] = useState('');

  const canClose = ['ADMIN', 'CEO', 'FINANCE_OFFICER'].includes(userProfile?.role || '');

  const fetchAlerts = async () => {

    try {
      const listSharkAlerts = httpsCallable(functions, 'shark-listSharkAlerts');
      const res: any = await listSharkAlerts({ limit: 50 });
      setAlerts(res.data.alerts || []);
    } catch (error: any) {
      console.error('Error fetching alerts:', error);
    }
  };

  const fetchRisk = async () => {
    try {
      const getRiskSummary = httpsCallable(functions, 'shark-getRiskSummary');
      const res: any = await getRiskSummary();
      setRiskSummary(res.data);
    } catch (error) {
      console.error('Error fetching risk:', error);
    }
  };

  useEffect(() => {
    fetchAlerts();
    fetchRisk();
  }, []);

  const handleCloseAlert = async (alertId: string) => {
    if (!resolutionNote) return alert(t('shark_resolution', language) + ' required');

    try {
      const closeSharkAlert = httpsCallable(functions, 'shark-closeSharkAlert');
      await closeSharkAlert({ alertId, resolutionNote });
      setClosingAlert(null);
      setResolutionNote('');
      fetchAlerts();
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    }
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ color: '#0f172a', margin: 0 }}>{t('shark_dashboard', language)}</h1>
          <p style={{ color: '#64748b', margin: '0.5rem 0 0 0' }}>{t('shark_realtime', language)}</p>
        </div>
        <button onClick={fetchAlerts} style={btnStyle}>{t('common_search', language)} {t('shark_update', language)}</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: '2rem' }}>
        {/* Sidebar: Risk Summary */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={cardStyle}>
            <h3 style={{ fontSize: '1rem', color: '#64748b', textTransform: 'uppercase', marginBottom: '1rem' }}>{t('shark_risk_summary', language)}</h3>
            {riskSummary ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ textAlign: 'center', padding: '1.5rem', background: '#f8fafc', borderRadius: '1rem' }}>
                  <div style={{ fontSize: '3rem', fontWeight: '800', color: riskSummary.globalScore > 70 ? '#ef4444' : '#f59e0b' }}>{riskSummary.globalScore}</div>
                  <div style={{ fontSize: '0.875rem', fontWeight: '700', color: '#64748b' }}>{t('shark_global_risk', language)}</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <StatBox label={t('shark_active_alerts', language)} value={riskSummary.activeCount} />
                  <StatBox label={t('shark_detection', language)} value="ON" color="#10b981" />
                </div>
              </div>
            ) : <p>{t('common_loading', language)}</p>}
          </div>
        </div>

        {/* Main: Alerts Feed */}
        <div style={cardStyle}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>{t('shark_alerts', language)}</h3>
          {alerts.length === 0 ? (
            <div style={{ padding: '4rem', textAlign: 'center', color: '#94a3b8' }}>
              <span style={{ fontSize: '3rem' }}>🛡️</span>
              <p>{t('shark_no_alerts', language)}</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {alerts.map(a => (
                <div key={a.id} style={{
                  padding: '1.5rem',
                  background: 'white',
                  borderRadius: '1rem',
                  border: `1px solid ${a.status === 'OPEN' ? '#fee2e2' : '#e2e8f0'}`,
                  boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <span style={{
                          padding: '0.25rem 0.5rem',
                          borderRadius: '0.5rem',
                          fontSize: '0.75rem',
                          fontWeight: '800',
                          background: a.severity === 'CRITICAL' ? '#ef4444' : '#f59e0b',
                          color: 'white'
                        }}>{a.severity}</span>
                        <span style={{ fontSize: '0.875rem', color: '#64748b' }}>{a.id}</span>
                      </div>
                      <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.125rem' }}>{a.type}</h4>
                      <p style={{ margin: 0, fontSize: '0.875rem', color: '#475569' }}>{a.reason}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.5rem' }}>{new Date(a.detectedAt?.seconds * 1000).toLocaleString()}</div>
                      {a.status === 'OPEN' && canClose && (
                        <button
                          onClick={() => setClosingAlert(a.id)}
                          style={{ padding: '0.4rem 0.8rem', background: '#0f172a', color: 'white', border: 'none', borderRadius: '0.5rem', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer' }}
                        >
                          {t('shark_close_alert', language)}
                        </button>
                      )}
                      {a.status === 'CLOSED' && (
                        <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#10b981' }}>{t('shark_resolved', language)}</span>
                      )}
                    </div>
                  </div>

                  {closingAlert === a.id && (
                    <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#f8fafc', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600' }}>{t('shark_resolution', language)}</label>
                      <textarea
                        value={resolutionNote}
                        onChange={e => setResolutionNote(e.target.value)}
                        placeholder={t('shark_explain_closure', language)}
                        style={{ width: '100%', padding: '0.5rem', borderRadius: '0.4rem', border: '1px solid #cbd5e1', marginBottom: '1rem', height: '80px' }}
                      />
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={() => handleCloseAlert(a.id)} style={{ padding: '0.5rem 1rem', background: '#10b981', color: 'white', border: 'none', borderRadius: '0.4rem', fontWeight: '700', cursor: 'pointer' }}>{t('shark_confirm_res', language)}</button>
                        <button onClick={() => setClosingAlert(null)} style={{ padding: '0.5rem 1rem', background: 'transparent', border: '1px solid #cbd5e1', borderRadius: '0.4rem', cursor: 'pointer' }}>{t('common_cancel', language)}</button>
                      </div>
                    </div>
                  )}

                  {a.status === 'CLOSED' && a.resolutionNote && (
                    <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#f0fdf4', borderRadius: '0.5rem', border: '1px solid #dcfce7', fontSize: '0.875rem' }}>
                      <strong>Resolution:</strong> {a.resolutionNote}
                    </div>
                  )}
                </div>
              ))}
            </div >
          )}
        </div >
      </div >
    </div >
  );
};

const StatBox = ({ label, value, color }: any) => (
  <div style={{ padding: '0.75rem', background: '#f1f5f9', borderRadius: '0.5rem' }}>
    <div style={{ fontSize: '0.7rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase' }}>{label}</div>
    <div style={{ fontSize: '1.25rem', fontWeight: '800', color: color || '#1e293b' }}>{value}</div>
  </div>
);

const cardStyle: React.CSSProperties = { background: 'white', padding: '1.5rem', borderRadius: '1rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', border: '1px solid #f1f5f9' };
const btnStyle: React.CSSProperties = { padding: '0.6rem 1.2rem', background: '#0f172a', color: 'white', border: 'none', borderRadius: '0.5rem', fontWeight: '600', cursor: 'pointer' };

export default SharkAI;
