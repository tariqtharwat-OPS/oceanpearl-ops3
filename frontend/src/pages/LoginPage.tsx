import React, { useState, useRef } from 'react';
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
    const emailRef = useRef<HTMLInputElement>(null);
    const passwordRef = useRef<HTMLInputElement>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        // Read values from DOM refs to support both React state and direct DOM input
        const emailVal = emailRef.current?.value || email;
        const passwordVal = passwordRef.current?.value || password;

        try {
            await login(emailVal, passwordVal);
            setTimeout(() => {
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
                            ref={emailRef}
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
                            ref={passwordRef}
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
