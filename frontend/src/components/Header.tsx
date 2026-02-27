import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import '../styles/Header.css';

const Header: React.FC = () => {
    const { t } = useTranslation();
    const { user, logout, isAdmin } = useAuth();
    const { language, toggleLanguage } = useLanguage();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const logoUrl = `${import.meta.env.BASE_URL}assets/logo.png`;

    return (
        <header className="header">
            <div className="header-container">
                <div className="header-logo">
                    <img src={logoUrl} alt="Ocean Pearl" className="logo-small" />
                    <span className="app-name">{t('common.appName')}</span>
                </div>

                <nav className="header-nav">
                    <Link to="/dashboard">{t('nav.dashboard')}</Link>
                    <Link to="/operations">{t('nav.operations')}</Link>
                    <Link to="/finance">{t('nav.finance')}</Link>
                    <Link to="/shark">{t('nav.shark')}</Link>
                    <Link to="/traceability">{t('nav.trace')}</Link>
                    {isAdmin && (
                        <>
                            <Link to="/admin">{t('nav.admin')}</Link>
                            <Link to="/admin/users">{t('admin.users')}</Link>
                        </>
                    )}
                </nav>

                <div className="header-actions">
                    <button onClick={toggleLanguage} className="lang-toggle">
                        {language === 'en' ? 'ID' : 'EN'}
                    </button>
                    <span className="user-email">{user?.email}</span>
                    <button onClick={handleLogout} className="logout-btn">
                        {t('common.logout')}
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Header;
