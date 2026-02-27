import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { httpsCallable } from 'firebase/functions';
import { functions, db } from '../services/firebase';
import { collection, getDocs } from 'firebase/firestore';
import '../styles/AdminPage.css';

interface UserData {
    uid: string;
    email: string;
    role: string;
    allowedLocationIds: string[];
    disabled: boolean;
}

const AdminUsersPage: React.FC = () => {
    const { t } = useTranslation();
    const { isAdmin } = useAuth();
    const [users, setUsers] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        role: 'unit_operator',
        allowedLocationIds: [] as string[],
    });

    // Load users list (admin only)
    useEffect(() => {
        const run = async () => {
            if (!isAdmin) return;
            setLoading(true);
            setError('');
            try {
                const snap = await getDocs(collection(db, 'v3_users'));
                const list: UserData[] = [];
                snap.forEach((d) => {
                    const data: any = d.data();
                    list.push({
                        uid: d.id,
                        email: data.email || '',
                        role: data.role || 'user',
                        allowedLocationIds: Array.isArray(data.allowedLocationIds) ? data.allowedLocationIds : [],
                        disabled: !!data.disabled,
                    });
                });
                // sort by email for stable display
                list.sort((a, b) => (a.email > b.email ? 1 : -1));
                setUsers(list);
            } catch (e: any) {
                setError(e?.message || 'Failed to load users');
            } finally {
                setLoading(false);
            }
        };

        run();
    }, [isAdmin]);


    if (!isAdmin) {
        return <div>{t('errors.unauthorized')}</div>;
    }

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const createUser = httpsCallable(functions, 'admin_createUser');
            await createUser({
                email: formData.email,
                password: formData.password,
                role: formData.role,
                allowedLocationIds: formData.allowedLocationIds,
            });

            setFormData({
                email: '',
                password: '',
                role: 'unit_operator',
                allowedLocationIds: [],
            });
            setShowForm(false);
            // Refresh users list
        } catch (err: any) {
            setError(err.message || t('errors.functionError', { message: 'Failed to create user' }));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="admin-page">
            <h1>{t('admin.userManagement')}</h1>

            {error && <div className="error-message">{error}</div>}

            <button onClick={() => setShowForm(!showForm)} className="btn-primary">
                {showForm ? t('common.cancel') : t('admin.createUser')}
            </button>

            {showForm && (
                <form onSubmit={handleCreateUser} className="admin-form">
                    <div className="form-group">
                        <label>{t('common.email')}</label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                            disabled={loading}
                        />
                    </div>

                    <div className="form-group">
                        <label>{t('common.password')}</label>
                        <input
                            type="password"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            required
                            disabled={loading}
                        />
                    </div>

                    <div className="form-group">
                        <label>{t('admin.role')}</label>
                        <select
                            value={formData.role}
                            onChange={(e) =>
                                setFormData({ ...formData, role: e.target.value as any })
                            }
                            disabled={loading}
                        >
                            <option value="unit_operator">Unit Operator</option>
                            <option value="location_manager">Location Manager</option>
                            <option value="finance_officer">Finance Officer</option>
                            <option value="ceo">CEO</option>
                            <option value="admin">Admin</option>
                            <option value="investor">Investor</option>
                        </select>
                    </div>

                    <button type="submit" disabled={loading} className="btn-primary">
                        {loading ? t('common.loading') : t('common.save')}
                    </button>
                </form>
            )}

            <div className="users-list">
                <h2>{t('admin.users')}</h2>
                {users.length === 0 ? (
                    <p>{t('reports.noData')}</p>
                ) : (
                    <table>
                        <thead>
                            <tr>
                                <th>{t('common.email')}</th>
                                <th>{t('admin.role')}</th>
                                <th>{t('admin.status')}</th>
                                <th>{t('admin.actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user) => (
                                <tr key={user.uid}>
                                    <td>{user.email}</td>
                                    <td>{user.role}</td>
                                    <td>{user.disabled ? t('admin.inactive') : t('admin.active')}</td>
                                    <td>
                                        <button className="btn-small">{t('common.edit')}</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default AdminUsersPage;
