/**
 * OPS V3 - Traceability Page
 * Public-safe verification for QR/Batch IDs
 */

import { useState } from 'react';
import { getCurrentLanguage, t, type Language } from '../i18n';

const Traceability = () => {
    const [language] = useState<Language>(getCurrentLanguage());
    const [batchId, setBatchId] = useState('');
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<any>(null);
    const [error, setError] = useState('');

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!batchId) return;
        setLoading(true);
        setError('');
        setData(null);

        try {
            // Calling the PUBLIC HTTPS endpoint
            const response = await fetch(`http://127.0.0.1:5001/oceanpearl-ops/asia-southeast1/traceability-verifyBatchPublic?batchId=${batchId}`);
            const result = await response.json();

            if (result.ok) {
                setData(result);
            } else {
                setError(result.error || 'Verification failed');
            }
        } catch (err: any) {
            setError('Connection failed. Is the emulator running?');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: '800', color: '#0f172a' }}>{t('trace_verify', language)}</h1>
                <p style={{ color: '#64748b' }}>{t('trace_check_origin', language)}</p>
            </div>

            <div style={{ background: 'white', padding: '2rem', borderRadius: '1.5rem', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', border: '1px solid #f1f5f9' }}>
                <form onSubmit={handleVerify} style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                    <input
                        type="text"
                        placeholder={t('trace_scan', language)}
                        value={batchId}
                        onChange={e => setBatchId(e.target.value)}
                        style={{ flex: 1, padding: '1rem', fontSize: '1.125rem', border: '2px solid #e2e8f0', borderRadius: '0.75rem', outline: 'none' }}
                    />
                    <button
                        type="submit"
                        disabled={loading}
                        style={{ padding: '0 2rem', background: '#0f172a', color: 'white', borderRadius: '0.75rem', fontWeight: '700', fontSize: '1rem', cursor: loading ? 'not-allowed' : 'pointer', border: 'none' }}
                    >
                        {loading ? '...' : t('common_search', language)}
                    </button>
                </form>

                {error && (
                    <div style={{ padding: '1rem', background: '#fef2f2', border: '1px solid #fee2e2', color: '#b91c1c', borderRadius: '0.75rem', textAlign: 'center' }}>
                        {error}
                    </div>
                )}

                {data && (
                    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
                        <div style={{ borderBottom: '2px solid #f1f5f9', paddingBottom: '1.5rem', marginBottom: '1.5rem' }}>
                            <h2 style={{ fontSize: '1rem', color: '#64748b', textTransform: 'uppercase', marginBottom: '1rem' }}>{t('trace_public_info', language)}</h2>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                <DataField label={t('trace_sku', language)} value={data.batch.skuId} />
                                <DataField label={t('trace_status', language)} value={data.batch.status} highlight />
                                <DataField label={t('trace_loc', language)} value={data.batch.locationId} />
                                <DataField label={t('trace_unit', language)} value={data.batch.unitId} />
                            </div>
                        </div>

                        <div>
                            <h2 style={{ fontSize: '1rem', color: '#64748b', textTransform: 'uppercase', marginBottom: '1.5rem' }}>{t('trace_timeline', language)}</h2>
                            <div style={{ position: 'relative', paddingLeft: '2rem' }}>
                                <div style={{ position: 'absolute', left: '7px', top: '5px', bottom: '5px', width: '2px', background: '#e2e8f0' }}></div>
                                {data.timeline.map((event: any, i: number) => (
                                    <div key={i} style={{ position: 'relative', marginBottom: '1.5rem' }}>
                                        <div style={{ position: 'absolute', left: '-2rem', top: '5px', width: '16px', height: '16px', borderRadius: '50%', background: 'white', border: '3px solid #0f172a' }}></div>
                                        <div style={{ fontWeight: '700', color: '#0f172a' }}>{event.type}</div>
                                        <div style={{ fontSize: '0.875rem', color: '#64748b' }}>{new Date(event.createdAt?.seconds * 1000).toLocaleString()}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const DataField = ({ label, value, highlight }: any) => (
    <div>
        <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#94a3b8', marginBottom: '0.25rem' }}>{label}</div>
        <div style={{ fontSize: '1.125rem', fontWeight: '800', color: highlight ? '#10b981' : '#1e293b' }}>{value || 'N/A'}</div>
    </div>
);

export default Traceability;
