import React from 'react';
import { NavLink } from 'react-router-dom';
import { getCurrentLanguage } from '../i18n';
// Use React.ComponentType to avoid runtime error with lucide-react's type-only LucideIcon export
export interface NavItem {
    label: string;
    path: string;
    icon: React.ComponentType<{ className?: string }>;
}

export interface SidebarProps {
    items: NavItem[];
}

const Sidebar: React.FC<SidebarProps> = ({ items }) => {
    const language = getCurrentLanguage();

    return (
        <aside className="w-64 bg-slate-900 text-slate-300 min-h-screen shadow-xl flex flex-col pt-6">
            <div className="px-6 pb-6 border-b border-slate-700/50 mb-4">
                {/* Industrial Logo space */}
                <div className="h-10 w-full bg-slate-800 rounded flex items-center justify-center font-bold tracking-widest text-slate-500 border border-slate-700/50">
                    OCEAN PEARL
                </div>
            </div>
            <nav className="flex-1 px-3 space-y-1">
                {items.map((item, idx) => (
                    <NavLink
                        key={idx}
                        to={item.path}
                        className={({ isActive }) =>
                            `flex items-center px-4 py-3 text-sm font-medium rounded-md transition-all duration-200 ${isActive
                                ? 'bg-blue-600 text-white shadow-md shadow-blue-900/50'
                                : 'hover:bg-slate-800 hover:text-white'
                            }`
                        }
                    >
                        <item.icon className="w-5 h-5 mr-3" />
                        {item.label}
                    </NavLink>
                ))}
            </nav>
            <div className="p-4 text-xs text-center text-slate-500 border-t border-slate-800">
                OPS3 OS v3.0.0
            </div>
        </aside>
    );
};

export default Sidebar;
