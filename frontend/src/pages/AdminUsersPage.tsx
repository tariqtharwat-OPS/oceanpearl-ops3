import React, { useState, useEffect, useRef } from 'react';
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
    allowedUnitIds: string[];
    disabled: boolean;
}

const AdminUsersPage: React.FC = () => {
    const { isAdmin } = useAuth();
    const [users, setUsers] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showForm, setShowForm] = useState(false);
    const roleRef = useRef<HTMLSelectElement>(null);

    // Refs for uncontrolled inputs (CDP browser automation compatible)
    const emailRef = useRef<HTMLInputElement>(null);
    const passwordRef = useRef<HTMLInputElement>(null);
    const locationIdsRef = useRef<HTMLInputElement>(null);
    const unitIdsRef = useRef<HTMLInputElement>(null);

    const loadUsers = async () => {
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
                    allowedUnitIds: Array.isArray(data.allowedUnitIds) ? data.allowedUnitIds : [],
                    disabled: !!data.disabled,
                });
            });
            list.sort((a, b) => (a.email > b.email ? 1 : -1));
            setUsers(list);
        } catch (e: any) {
            setError(e?.message || 'Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUsers();
    }, [isAdmin]);

    if (!isAdmin) {
        return <div style={{padding:'24px',color:'red'}}>Unauthorized — Admin access required</div>;
    }

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        const email = emailRef.current?.value?.trim() || '';
        const password = passwordRef.current?.value || '';
        const role = roleRef.current?.value || 'unit_operator';
        const locationIdsRaw = locationIdsRef.current?.value?.trim() || '';
        const unitIdsRaw = unitIdsRef.current?.value?.trim() || '';

        const allowedLocationIds = locationIdsRaw ? locationIdsRaw.split(',').map(s => s.trim()).filter(Boolean) : [];
        const allowedUnitIds = unitIdsRaw ? unitIdsRaw.split(',').map(s => s.trim()).filter(Boolean) : [];

        if (!email || !password) {
            setError('Email and password are required');
            setLoading(false);
            return;
        }

        try {
            const createUser = httpsCallable(functions, 'admin_createUser');
            const result: any = await createUser({
                email,
                password,
                role,
                allowedLocationIds,
                allowedUnitIds,
            });

            if (emailRef.current) emailRef.current.value = '';
            if (passwordRef.current) passwordRef.current.value = '';
            if (locationIdsRef.current) locationIdsRef.current.value = '';
            if (unitIdsRef.current) unitIdsRef.current.value = '';
            if (roleRef.current) roleRef.current.value = 'unit_operator';
            setShowForm(false);
            setSuccess(`User created: ${email} (uid: ${result?.data?.uid || 'ok'})`);
            await loadUsers();
        } catch (err: any) {
            setError(err.message || 'Failed to create user');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{padding:'24px',maxWidth:'900px'}}>
            <h1 style={{fontSize:'24px',fontWeight:'700',color:'#1e3a5f',marginBottom:'16px'}}>User Management</h1>

            {error && (
                <div id="admin-error" style={{color:'red',padding:'10px',marginBottom:'12px',border:'1px solid red',borderRadius:'4px',background:'#fff5f5'}}>
                    {error}
                </div>
            )}
            {success && (
                <div id="admin-success" style={{color:'#155724',padding:'10px',marginBottom:'12px',border:'1px solid #c3e6cb',borderRadius:'4px',background:'#d4edda'}}>
                    {success}
                </div>
            )}

            <button
                id="btn-toggle-create-user"
                onClick={() => { setShowForm(!showForm); setError(''); setSuccess(''); }}
                style={{marginBottom:'20px',padding:'10px 20px',background:'#1e3a5f',color:'white',border:'none',borderRadius:'6px',cursor:'pointer',fontWeight:'600'}}
            >
                {showForm ? 'Cancel' : '+ Create New User'}
            </button>

            {showForm && (
                <form id="create-user-form" onSubmit={handleCreateUser} style={{background:'#f8f9fa',padding:'20px',borderRadius:'8px',marginBottom:'28px',maxWidth:'480px',border:'1px solid #dee2e6'}}>
                    <h3 style={{marginBottom:'16px',color:'#1e3a5f'}}>New User</h3>

                    <div style={{marginBottom:'12px'}}>
                        <label style={{display:'block',marginBottom:'4px',fontWeight:'600',fontSize:'14px'}}>Email</label>
                        <input
                            id="new-user-email"
                            type="email"
                            ref={emailRef}
                            defaultValue=""
                            required
                            disabled={loading}
                            style={{width:'100%',padding:'8px 10px',border:'1px solid #ccc',borderRadius:'4px',fontSize:'14px'}}
                        />
                    </div>

                    <div style={{marginBottom:'12px'}}>
                        <label style={{display:'block',marginBottom:'4px',fontWeight:'600',fontSize:'14px'}}>Password</label>
                        <input
                            id="new-user-password"
                            type="text"
                            ref={passwordRef}
                            defaultValue=""
                            required
                            disabled={loading}
                            style={{width:'100%',padding:'8px 10px',border:'1px solid #ccc',borderRadius:'4px',fontSize:'14px'}}
                        />
                    </div>

                    <div style={{marginBottom:'12px'}}>
                        <label style={{display:'block',marginBottom:'4px',fontWeight:'600',fontSize:'14px'}}>Role</label>
                        <select
                            id="new-user-role"
                            ref={roleRef}
                            defaultValue="unit_operator"
                            disabled={loading}
                            style={{width:'100%',padding:'8px 10px',border:'1px solid #ccc',borderRadius:'4px',fontSize:'14px'}}
                        >
                            <option value="unit_operator">Unit Operator</option>
                            <option value="hub_operator">Hub Operator</option>
                            <option value="factory_operator">Factory Operator</option>
                            <option value="boat_operator">Boat Operator</option>
                            <option value="location_manager">Location Manager</option>
                            <option value="finance_officer">Finance Officer</option>
                            <option value="ceo">CEO</option>
                            <option value="admin">Admin</option>
                            <option value="investor">Investor</option>
                        </select>
                    </div>

                    <div style={{marginBottom:'12px'}}>
                        <label style={{display:'block',marginBottom:'4px',fontWeight:'600',fontSize:'14px'}}>
                            Allowed Location IDs <span style={{fontWeight:'normal',fontSize:'12px',color:'#666'}}>(comma-separated, optional)</span>
                        </label>
                        <input
                            id="new-user-locations"
                            type="text"
                            ref={locationIdsRef}
                            defaultValue=""
                            placeholder="e.g. LOC-HUB-01, LOC-FACTORY-01"
                            disabled={loading}
                            style={{width:'100%',padding:'8px 10px',border:'1px solid #ccc',borderRadius:'4px',fontSize:'14px'}}
                        />
                    </div>

                    <div style={{marginBottom:'20px'}}>
                        <label style={{display:'block',marginBottom:'4px',fontWeight:'600',fontSize:'14px'}}>
                            Allowed Unit IDs <span style={{fontWeight:'normal',fontSize:'12px',color:'#666'}}>(comma-separated, optional)</span>
                        </label>
                        <input
                            id="new-user-units"
                            type="text"
                            ref={unitIdsRef}
                            defaultValue=""
                            placeholder="e.g. UNIT-BOAT-01, UNIT-HUB-01"
                            disabled={loading}
                            style={{width:'100%',padding:'8px 10px',border:'1px solid #ccc',borderRadius:'4px',fontSize:'14px'}}
                        />
                    </div>

                    <button
                        id="btn-submit-create-user"
                        type="submit"
                        disabled={loading}
                        style={{padding:'10px 28px',background:'#28a745',color:'white',border:'none',borderRadius:'6px',cursor:'pointer',fontWeight:'600',fontSize:'14px'}}
                    >
                        {loading ? 'Creating...' : 'Create User'}
                    </button>
                </form>
            )}

            <div>
                <h2 style={{fontSize:'18px',fontWeight:'600',color:'#1e3a5f',marginBottom:'12px'}}>
                    System Users ({users.length})
                </h2>
                {loading && !showForm ? (
                    <p style={{color:'#666'}}>Loading users...</p>
                ) : users.length === 0 ? (
                    <p style={{color:'#666'}}>No users found.</p>
                ) : (
                    <table style={{width:'100%',borderCollapse:'collapse',background:'white',borderRadius:'8px',overflow:'hidden',boxShadow:'0 1px 3px rgba(0,0,0,0.1)'}}>
                        <thead style={{background:'#1e3a5f',color:'white'}}>
                            <tr>
                                <th style={{padding:'10px 14px',textAlign:'left',fontSize:'13px'}}>Email</th>
                                <th style={{padding:'10px 14px',textAlign:'left',fontSize:'13px'}}>Role</th>
                                <th style={{padding:'10px 14px',textAlign:'left',fontSize:'13px'}}>Locations</th>
                                <th style={{padding:'10px 14px',textAlign:'left',fontSize:'13px'}}>Units</th>
                                <th style={{padding:'10px 14px',textAlign:'left',fontSize:'13px'}}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user, idx) => (
                                <tr key={user.uid} style={{background: idx % 2 === 0 ? 'white' : '#f8f9fa',borderBottom:'1px solid #eee'}}>
                                    <td style={{padding:'10px 14px',fontSize:'13px'}}>{user.email}</td>
                                    <td style={{padding:'10px 14px'}}>
                                        <span style={{background:'#e8f0fe',color:'#1e3a5f',padding:'2px 10px',borderRadius:'12px',fontSize:'12px',fontWeight:'600'}}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td style={{padding:'10px 14px',fontSize:'12px',color:'#666'}}>{user.allowedLocationIds.join(', ') || '—'}</td>
                                    <td style={{padding:'10px 14px',fontSize:'12px',color:'#666'}}>{user.allowedUnitIds.join(', ') || '—'}</td>
                                    <td style={{padding:'10px 14px'}}>
                                        <span style={{color: user.disabled ? '#dc3545' : '#28a745', fontWeight:'600',fontSize:'13px'}}>
                                            {user.disabled ? 'Inactive' : 'Active'}
                                        </span>
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
