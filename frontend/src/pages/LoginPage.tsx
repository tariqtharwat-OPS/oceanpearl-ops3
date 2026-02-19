import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import '../styles/LoginPage.css';

const LoginPage: React.FC = () => {
    const { t } = useTranslation();
    const { login } = useAuth();
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
            await login(email, password);
            navigate('/dashboard');
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
