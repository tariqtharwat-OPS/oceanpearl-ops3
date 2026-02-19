import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import '../styles/DashboardPage.css';

const DashboardPage: React.FC = () => {
    const { t } = useTranslation();
    const { user, userProfile, isAdmin } = useAuth();

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <h1>{t('dashboard.title')}</h1>
                <p>
                    {t('dashboard.welcome')}, {user?.email}
                </p>
            </div>

            <div className="dashboard-content">
                <div className="dashboard-section">
                    <h2>{t('dashboard.overview')}</h2>
                    <div className="overview-cards">
                        <div className="card">
                            <h3>{t('location.title')}</h3>
                            <p>{userProfile?.allowedLocationIds?.length || 0}</p>
                        </div>
                        {isAdmin && (
                            <div className="card">
                                <h3>{t('admin.title')}</h3>
                                <p>{t('admin.users')}</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="dashboard-section">
                    <h2>{t('dashboard.recentActivity')}</h2>
                    <p>{t('reports.noData')}</p>
                </div>

                {isAdmin && (
                    <div className="dashboard-section">
                        <h2>{t('admin.title')}</h2>
                        <ul>
                            <li>
                                <Link to="/admin/users">{t('admin.userManagement')}</Link>
                            </li>
                            <li>
                                <Link to="/admin/locations">{t('admin.createLocation')}</Link>
                            </li>
                            <li>
                                <Link to="/admin/master-data">{t('admin.masterData')}</Link>
                            </li>
                            <li>
                                <Link to="/admin/audit-logs">{t('admin.auditLogs')}</Link>
                            </li>
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DashboardPage;
