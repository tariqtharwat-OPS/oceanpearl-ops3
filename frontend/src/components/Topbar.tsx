import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getCurrentLanguage, t } from '../i18n';
import { LogOut, User, Globe } from 'lucide-react';

interface TopbarProps {
    roleTitle: string;
}

const Topbar: React.FC<TopbarProps> = ({ roleTitle }) => {
    const { userProfile, signOut } = useAuth();
    const language = getCurrentLanguage();

    return (
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-10 w-full shadow-sm">
            <div className="flex items-center space-x-4">
                <h1 className="text-sm font-bold tracking-widest text-slate-800 uppercase flex items-center">
                    <Globe className="w-5 h-5 mr-2 text-blue-600" />
                    OPS3 <span className="mx-2 text-slate-300">/</span> {roleTitle}
                </h1>
            </div>

            <div className="flex items-center space-x-6 text-sm text-slate-600">
                <div className="flex items-center font-medium bg-slate-50 px-3 py-1.5 rounded-md border border-slate-100">
                    <User className="w-4 h-4 mr-2 text-slate-400" />
                    <span className="hidden sm:inline">{userProfile?.email || 'Loading...'}</span>
                </div>

                <button
                    onClick={signOut}
                    className="flex items-center text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-md transition-colors font-medium"
                >
                    <LogOut className="w-4 h-4 mr-2" />
                    {t('common_logout', language)}
                </button>
            </div>
        </header>
    );
};

export default Topbar;
