import { useState } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';

export default function Bootstrap() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleBootstrap = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const functions = getFunctions();
      const v3Bootstrap = httpsCallable(functions, 'v3Bootstrap');
      const response = await v3Bootstrap({ secret: 'OceanPearl2026Bootstrap!' });
      setResult(response.data);
    } catch (err: any) {
      setError(err.message || 'Bootstrap failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSeedTestPack = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const functions = getFunctions();
      const v3SeedTestPack = httpsCallable(functions, 'v3SeedTestPack');
      const response = await v3SeedTestPack({ packId: 'V3_TP1' });
      setResult(response.data);
    } catch (err: any) {
      setError(err.message || 'Seed test pack failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>OPS V3 Bootstrap & Test Data</h1>
      
      <div style={{ marginTop: '30px' }}>
        <h2>Step 1: Bootstrap (Create First Admin)</h2>
        <p>This creates the CEO admin account: ceo@oceanpearlseafood.com / OceanPearl2026!</p>
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
          {loading ? 'Running...' : 'Run Bootstrap'}
        </button>
      </div>

      <div style={{ marginTop: '30px' }}>
        <h2>Step 2: Seed Test Pack (After Bootstrap)</h2>
        <p>This creates all test data: locations, units, partners, species, products, and test users.</p>
        <p><strong>Note:</strong> You must be signed in as the CEO/admin to run this.</p>
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
          {loading ? 'Running...' : 'Run Seed Test Pack'}
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
          <strong>Error:</strong> {error}
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
          <strong>Success!</strong>
          <pre style={{ marginTop: '10px', whiteSpace: 'pre-wrap' }}>
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}

      <div style={{ marginTop: '40px', padding: '16px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
        <h3>Instructions:</h3>
        <ol>
          <li>Click "Run Bootstrap" to create the first admin user</li>
          <li>Sign in with: ceo@oceanpearlseafood.com / OceanPearl2026!</li>
          <li>Come back to this page and click "Run Seed Test Pack"</li>
          <li>All test data will be created</li>
        </ol>
      </div>
    </div>
  );
}
