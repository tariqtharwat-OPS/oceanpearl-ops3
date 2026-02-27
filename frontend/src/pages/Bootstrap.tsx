import { useState } from 'react';
import { functions } from '../firebase';
import { httpsCallable } from 'firebase/functions';
import { getCurrentLanguage, t, type Language } from '../i18n';

export default function Bootstrap() {
  const [language] = useState<Language>(getCurrentLanguage());
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleBootstrap = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const v3Bootstrap = httpsCallable(functions, 'v3Bootstrap');
      const response = await v3Bootstrap({ secret: 'OceanPearl2026Bootstrap!' });
      setResult(response.data);
    } catch (err: any) {
      setError(err.message || t('common_error', language));
    } finally {
      setLoading(false);
    }
  };

  const handleSeedTestPack = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const v3SeedTestPack = httpsCallable(functions, 'v3SeedTestPack');
      const response = await v3SeedTestPack({ packId: 'V3_TP1' });
      setResult(response.data);
    } catch (err: any) {
      setError(err.message || t('common_error', language));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>{t('boot_title', language)}</h1>

      <div style={{ marginTop: '30px' }}>
        <h2>{t('boot_step1', language)}</h2>
        <p>{t('boot_step1_desc', language)}</p>
        <button
          onClick={handleBootstrap}
          disabled={loading}
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            backgroundColor: '#1a365d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? t('common_loading', language) : t('boot_run', language)}
        </button>
      </div>

      <div style={{ marginTop: '30px' }}>
        <h2>{t('boot_step2', language)}</h2>
        <p>{t('boot_step2_desc', language)}</p>
        <p><strong>{t('common_info', language)}:</strong> {t('boot_step2_note', language)}</p>
        <button
          onClick={handleSeedTestPack}
          disabled={loading}
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            backgroundColor: '#1a365d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? t('common_loading', language) : t('boot_run_seed', language)}
        </button>
      </div>

      {error && (
        <div style={{
          marginTop: '20px',
          padding: '16px',
          backgroundColor: '#fee',
          border: '1px solid #fcc',
          borderRadius: '4px'
        }}>
          <strong>{t('common_error', language)}:</strong> {error}
        </div>
      )}

      {result && (
        <div style={{
          marginTop: '20px',
          padding: '16px',
          backgroundColor: '#efe',
          border: '1px solid #cfc',
          borderRadius: '4px'
        }}>
          <strong>{t('common_success', language)}!</strong>
          <pre style={{ marginTop: '10px', whiteSpace: 'pre-wrap' }}>
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}

      <div style={{ marginTop: '40px', padding: '16px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
        <h3>{t('boot_instructions', language)}</h3>
        <ol>
          <li>Click "{t('boot_run', language)}" to create the first admin user</li>
          <li>Sign in with: ceo@oceanpearlseafood.com / OceanPearl2026!</li>
          <li>Come back to this page and click "{t('boot_run_seed', language)}"</li>
          <li>All test data will be created</li>
        </ol>
      </div>
    </div>
  );
}
