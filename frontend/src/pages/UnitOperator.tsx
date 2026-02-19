
// Mock components for the new Unit Operator flow
interface UnitWrapperProps {
    children: React.ReactNode;
    title: string;
}

const UnitWrapper = ({ children, title }: UnitWrapperProps) => (
    <div style={{ padding: '0rem' }}>
        <div style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>{title}</h2>
        </div>
        <div style={{ background: 'white', borderRadius: '0.75rem', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)', padding: '1.5rem', border: '1px solid #e2e8f0' }}>
            {children}
        </div>
    </div>
);

export const UnitLayout = ({ children, userProfile, language, navigate }: any) => {
    return (
        <div style={{ display: 'flex', minHeight: 'calc(100vh - 80px)' }}>
            {/* Sidebar */}
            <div style={{ width: '260px', background: 'white', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Unit Operator</div>
                    <div style={{ marginTop: '0.5rem', fontWeight: 700, color: '#0f172a' }}>{userProfile.allowedUnitIds[0] || 'No Unit'}</div>
                </div>
                <nav style={{ padding: '1rem' }}>
                    <SidebarLink label="Dashboard" onClick={() => navigate('/unit/dashboard')} active={window.location.pathname.includes('dashboard')} />
                    <div style={{ margin: '1rem 0 0.5rem 0.75rem', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8' }}>INBOUND</div>
                    <SidebarLink label="Receiving Invoice" onClick={() => navigate('/unit/receiving')} active={window.location.pathname.includes('receiving')} />

                    <div style={{ margin: '1rem 0 0.5rem 0.75rem', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8' }}>PROCESSING</div>
                    <SidebarLink label="Processing (Multi)" onClick={() => navigate('/unit/processing')} active={window.location.pathname.includes('processing')} />
                    <SidebarLink label="Waste / Shrink" onClick={() => navigate('/unit/waste')} active={window.location.pathname.includes('waste')} />

                    <div style={{ margin: '1rem 0 0.5rem 0.75rem', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8' }}>OUTBOUND</div>
                    <SidebarLink label="Transfer Out" onClick={() => navigate('/unit/transfer')} active={window.location.pathname.includes('transfer')} />
                    <SidebarLink label="Sales Invoice" onClick={() => navigate('/unit/sales')} active={window.location.pathname.includes('sales')} />

                    <div style={{ margin: '1rem 0 0.5rem 0.75rem', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8' }}>FINANCE</div>
                    <SidebarLink label="Expense Voucher" onClick={() => navigate('/unit/expenses')} active={window.location.pathname.includes('expenses')} />
                    <SidebarLink label="Payments" onClick={() => navigate('/unit/payments')} active={window.location.pathname.includes('payments')} />
                </nav>
            </div>

            {/* Main Content */}
            <div style={{ flex: 1, padding: '2rem', background: '#f8fafc' }}>
                {children}
            </div>
        </div>
    );
};

const SidebarLink = ({ label, onClick, active }: any) => (
    <div
        onClick={onClick}
        style={{
            padding: '0.75rem 1rem',
            marginBottom: '0.25rem',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            background: active ? '#eff6ff' : 'transparent',
            color: active ? '#2563eb' : '#475569',
            fontWeight: active ? 600 : 500,
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center'
        }}
    >
        {label}
    </div>
);

// --- PLACEHOLDER PAGES ---
export const UnitDashboard = () => <UnitWrapper title="Unit Dashboard"><div>Dashboard metrics and recent documents list will go here.</div></UnitWrapper>;
export const UnitReceiving = () => <UnitWrapper title="Receiving Invoice"><div>Draft to Post Receiving Invoice form.</div></UnitWrapper>;
export const UnitProcessing = () => <UnitWrapper title="Processing (Multi-Output)"><div>Input Batch to Multiple Output SKUs (Co-Products).</div></UnitWrapper>;
export const UnitWaste = () => <UnitWrapper title="Waste / Shrink"><div>Record explicit waste events.</div></UnitWrapper>;
export const UnitTransfer = () => <UnitWrapper title="Transfer Out"><div>Move inventory to another unit/location.</div></UnitWrapper>;
export const UnitSales = () => <UnitWrapper title="Sales Invoice"><div>Draft to Post Sales Invoice.</div></UnitWrapper>;
export const UnitExpenses = () => <UnitWrapper title="Expense Voucher"><div>Record operational expenses attached to this unit.</div></UnitWrapper>;
export const UnitPayments = () => <UnitWrapper title="Payments"><div>Settle AP/AR invoices.</div></UnitWrapper>;
