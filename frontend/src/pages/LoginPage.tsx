import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import '../styles/LoginPage.css';

const ROLE_ROUTES: Record<string, string> = {
    admin:             '/app/admin/users',
    ceo:               '/app/ceo/dashboard',
    finance_officer:   '/app/finance/ledger',
    location_manager:  '/app/location/transit',
    unit_operator:     '/app/operator/dashboard',
    factory_operator:  '/app/factory/batches',
    hub_operator:      '/app/hub/trips',
    boat_operator:     '/app/boat/start',
    investor:          '/app/investor/dashboard',
};

const LoginPage: React.FC = () => {
    const { t } = useTranslation();
    const { login, userProfile } = useAuth();
    const { language, toggleLanguage } = useLanguage();
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // login() in AuthContext now fetches the profile immediately.
            // After it resolves, userProfile state is set — but React state
            // updates are async, so we use the returned AuthUser to derive
            // the route from the already-fetched profile in AuthContext.
            await login(email, password);
            // Give React one tick to apply the state update, then read userProfile
            // from the context (which was set synchronously in the login() call).
            // We use a small timeout to ensure the state has propagated.
            setTimeout(() => {
                // Read the current userProfile from the context via a ref-like pattern.
                // Since login() sets userProfile synchronously before returning,
                // the context value will be updated on the next render cycle.
                // We navigate to /app/routing as a safe fallback — the RoleBasedRouter
                // will redirect to the correct route once userProfile is available.
                navigate('/app/routing');
            }, 100);
        } catch (err: any) {
            setError(err.message || t('auth.loginError'));
        } finally {
            setLoading(false);
        }
    };

    const logoUrl = `${import.meta.env.BASE_URL}assets/logo.png`;

    return (
        <div className="login-container">
            <div className="login-header">
                <img src={logoUrl} alt="Ocean Pearl" className="logo" />
                <h1>{t('common.appName')}</h1>
                <p>{t('common.tagline')}</p>
            </div>

            <div className="language-toggle">
                <button onClick={toggleLanguage} className="lang-btn">
                    {language === 'en' ? 'ID' : 'EN'}
                </button>
            </div>

            <div className="login-form-container">
                <h2>{t('auth.loginTitle')}</h2>
                <p className="login-subtitle">{t('auth.loginSubtitle')}</p>

                {error && <div className="error-message">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="email">{t('common.email')}</label>
                        <input
                            id="email"
                            type="email"
                            placeholder={t('auth.emailPlaceholder')}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            disabled={loading}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">{t('common.password')}</label>
                        <input
                            id="password"
                            type="password"
                            placeholder={t('auth.passwordPlaceholder')}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            disabled={loading}
                        />
                    </div>

                    <button type="submit" className="login-button" disabled={loading}>
                        {loading ? t('common.loading') : t('auth.loginButton')}
                    </button>
                </form>

                <div className="login-footer">
                    <p>{t('auth.forgotPassword')}</p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
