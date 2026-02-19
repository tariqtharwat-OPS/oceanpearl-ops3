import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { firestoreService, Location, Place } from '../services/firestoreService';
import '../styles/LocationPage.css';

const LocationPage: React.FC = () => {
    const { t } = useTranslation();
    const { userProfile } = useAuth();
    const [locations, setLocations] = useState<Location[]>([]);
    const [selectedLocation, setSelectedLocation] = useState<string>('');
    const [places, setPlaces] = useState<Place[]>([]);
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
            // Filter locations based on user permissions
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

    useEffect(() => {
        if (selectedLocation) {
            loadPlaces();
        }
    }, [selectedLocation]);

    const loadPlaces = async () => {
        setLoading(true);
        setError('');
        try {
            const placesData = await firestoreService.getPlaces(selectedLocation);
            setPlaces(placesData);
        } catch (err: any) {
            setError(err.message || t('errors.serverError'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="location-page">
            <h1>{t('location.title')}</h1>

            {error && <div className="error-message">{error}</div>}

            <div className="location-selector">
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

            {selectedLocation && (
                <div className="location-content">
                    <div className="section">
                        <h2>{t('location.places')}</h2>
                        {loading ? (
                            <p>{t('common.loading')}</p>
                        ) : places.length === 0 ? (
                            <p>{t('reports.noData')}</p>
                        ) : (
                            <div className="places-grid">
                                {places.map((place) => (
                                    <div key={place.id} className="place-card">
                                        <h3>{place.name}</h3>
                                        <p className="place-id">{place.id}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="section">
                        <h2>{t('location.inventory')}</h2>
                        <div className="action-buttons">
                            <button className="btn-action">{t('location.receiveItems')}</button>
                            <button className="btn-action">{t('location.moveStock')}</button>
                            <button className="btn-action">{t('location.processItems')}</button>
                            <button className="btn-action">{t('location.shipItems')}</button>
                            <button className="btn-action">{t('location.adjustStock')}</button>
                        </div>
                    </div>

                    <div className="section">
                        <h2>{t('location.reports')}</h2>
                        <div className="action-buttons">
                            <button className="btn-action">{t('reports.stockReport')}</button>
                            <button className="btn-action">{t('reports.ledgerReport')}</button>
                            <button className="btn-action">{t('reports.batchReport')}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LocationPage;
