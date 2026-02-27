import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import type { Location } from '../services/firestoreService';
import { firestoreService } from '../services/firestoreService';
import '../styles/ReportsPage.css';

const ReportsPage: React.FC = () => {
    const { t } = useTranslation();
    const { userProfile } = useAuth();
    const [locations, setLocations] = useState<Location[]>([]);
    const [selectedLocation, setSelectedLocation] = useState<string>('');
    const [reportType, setReportType] = useState<string>('stock');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        loadLocations();
    }, [userProfile]);

    const loadLocations = async () => {
        setLoading(true);
        setError('');
        try {
            const allLocations = await firestoreService.getLocations();
            const accessibleLocations = allLocations.filter((loc) =>
                userProfile?.allowedLocationIds.includes(loc.id)
            );
            setLocations(accessibleLocations);
            if (accessibleLocations.length > 0) {
                setSelectedLocation(accessibleLocations[0].id);
            }
        } catch (err: any) {
            setError(err.message || t('errors.serverError'));
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateReport = () => {
        console.log(`Generating ${reportType} report for location ${selectedLocation}`);
        // Report generation logic will be implemented
    };

    return (
        <div className="reports-page">
            <h1>{t('reports.title')}</h1>

            {error && <div className="error-message">{error}</div>}

            <div className="reports-container">
                <div className="report-filters">
                    <div className="filter-group">
                        <label>{t('location.selectLocation')}</label>
                        <select value={selectedLocation} onChange={(e) => setSelectedLocation(e.target.value)}>
                            <option value="">{t('common.loading')}</option>
                            {locations.map((loc) => (
                                <option key={loc.id} value={loc.id}>
                                    {loc.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="filter-group">
                        <label>{t('reports.title')}</label>
                        <select value={reportType} onChange={(e) => setReportType(e.target.value)}>
                            <option value="stock">{t('reports.stockReport')}</option>
                            <option value="ledger">{t('reports.ledgerReport')}</option>
                            <option value="batch">{t('reports.batchReport')}</option>
                        </select>
                    </div>

                    <button onClick={handleGenerateReport} className="btn-generate" disabled={!selectedLocation || loading}>
                        {loading ? t('common.loading') : t('reports.generateReport')}
                    </button>
                </div>

                <div className="report-content">
                    <div className="report-section">
                        <h2>{reportType === 'stock' ? t('reports.stockReport') : reportType === 'ledger' ? t('reports.ledgerReport') : t('reports.batchReport')}</h2>
                        <div className="report-table">
                            <p>{t('reports.noData')}</p>
                        </div>
                    </div>

                    <div className="report-actions">
                        <button className="btn-export">{t('reports.exportPDF')}</button>
                        <button className="btn-export">{t('reports.exportExcel')}</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReportsPage;
