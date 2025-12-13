
import React, { useState, useEffect } from 'react';
import { ShippingProvider } from '../../types';
import { getApiUrl } from '../../utils/apiHelper';
import { COLORS } from '../../constants';

interface ShippingIntegrationsProps {
    token: string | null;
}

// Configuration for supported providers
const PROVIDER_TEMPLATES = [
    {
        slug: 'shiprocket',
        name: 'Shiprocket',
        logo: 'https://cdn-icons-png.flaticon.com/512/9564/9564998.png', // Placeholder icon
        fields: ['email', 'password'],
        description: 'India\'s leading shipping automation platform.'
    },
    {
        slug: 'delhivery',
        name: 'Delhivery',
        logo: 'https://cdn-icons-png.flaticon.com/512/7542/7542994.png',
        fields: ['token'],
        description: 'Supply chain services and logistics.'
    },
    {
        slug: 'xpressbees',
        name: 'XpressBees',
        logo: 'https://cdn-icons-png.flaticon.com/512/2830/2830305.png',
        fields: ['username', 'password', 'apiKey'],
        description: 'Fastest growing express logistics service.'
    },
    {
        slug: 'bluedart',
        name: 'BlueDart',
        logo: 'https://cdn-icons-png.flaticon.com/512/726/726455.png',
        fields: ['apiKey', 'apiSecret', 'merchantId'],
        description: 'South Asia\'s premier express air and integrated transportation.'
    },
    {
        slug: 'pickrr',
        name: 'Pickrr',
        logo: 'https://cdn-icons-png.flaticon.com/512/9420/9420504.png',
        fields: ['token'],
        description: 'AI-driven shipping solution for ecommerce.'
    }
];

const ShippingIntegrations: React.FC<ShippingIntegrationsProps> = ({ token }) => {
    const [providers, setProviders] = useState<ShippingProvider[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeModal, setActiveModal] = useState<string | null>(null);
    const [editData, setEditData] = useState<Partial<ShippingProvider>>({});
    const [connectionLoading, setConnectionLoading] = useState(false);

    useEffect(() => {
        fetchProviders();
    }, [token]);

    const fetchProviders = async () => {
        try {
            const res = await fetch(getApiUrl('/api/shipping/providers'), {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setProviders(await res.json());
            }
        } catch (error) {
            console.error("Failed to fetch shipping providers:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleConnectClick = (slug: string) => {
        const existing = providers.find(p => p.slug === slug);
        const template = PROVIDER_TEMPLATES.find(p => p.slug === slug);
        
        if (existing) {
            setEditData(existing);
        } else {
            setEditData({
                slug,
                name: template?.name,
                isEnabled: true,
                credentials: {},
                settings: { autoShip: false }
            });
        }
        setActiveModal(slug);
    };

    const handleCredentialChange = (field: string, value: string) => {
        setEditData(prev => ({
            ...prev,
            credentials: { ...prev.credentials, [field]: value }
        }));
    };

    const handleTestConnection = async () => {
        setConnectionLoading(true);
        try {
            const res = await fetch(getApiUrl('/api/shipping/test-connection'), {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ slug: activeModal, credentials: editData.credentials })
            });
            const data = await res.json();
            alert(data.message || (data.success ? "Connection Successful!" : "Connection Failed"));
        } catch (error) {
            alert("Test connection failed. Check console.");
        } finally {
            setConnectionLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            const res = await fetch(getApiUrl('/api/shipping/providers'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(editData)
            });
            if (res.ok) {
                fetchProviders();
                setActiveModal(null);
                alert("Settings saved successfully!");
            }
        } catch (error) {
            console.error(error);
            alert("Failed to save settings.");
        }
    };

    const handleToggleActive = async (provider: ShippingProvider) => {
        // Optimistic toggle
        const updated = { ...provider, isEnabled: !provider.isEnabled };
        setProviders(prev => prev.map(p => p.slug === provider.slug ? updated : p));
        
        try {
            await fetch(getApiUrl('/api/shipping/providers'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(updated)
            });
        } catch (error) {
            console.error("Toggle failed", error);
            fetchProviders(); // Revert
        }
    };

    if (loading) return <div>Loading integrations...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Courier Partner Integrations</h2>
                    <p className="text-gray-500 text-sm mt-1">Connect your logistics accounts to sync order status and generate tracking IDs automatically.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {PROVIDER_TEMPLATES.map(template => {
                    const savedProvider = providers.find(p => p.slug === template.slug);
                    const isConnected = savedProvider?.isEnabled;

                    return (
                        <div key={template.slug} className={`bg-white rounded-xl shadow-sm border p-6 flex flex-col justify-between transition-all ${isConnected ? 'border-green-200 ring-1 ring-green-100' : 'border-gray-200'}`}>
                            <div>
                                <div className="flex justify-between items-start mb-4">
                                    <div className="w-14 h-14 bg-gray-50 rounded-lg p-2 flex items-center justify-center border border-gray-100">
                                        <img src={template.logo} alt={template.name} className="w-10 h-10 object-contain"/>
                                    </div>
                                    {isConnected ? (
                                        <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold flex items-center gap-1">
                                            <span className="w-2 h-2 bg-green-500 rounded-full"></span> Active
                                        </span>
                                    ) : (
                                        <span className="bg-gray-100 text-gray-500 px-2 py-1 rounded text-xs font-bold">Inactive</span>
                                    )}
                                </div>
                                <h3 className="font-bold text-lg text-gray-900">{template.name}</h3>
                                <p className="text-sm text-gray-500 mt-2 mb-4 h-10 line-clamp-2">{template.description}</p>
                            </div>
                            
                            <div className="flex items-center gap-3 border-t border-gray-100 pt-4">
                                <button 
                                    onClick={() => handleConnectClick(template.slug)}
                                    className={`flex-1 text-sm font-bold py-2 rounded-md transition-colors ${isConnected ? 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50' : 'bg-rose-600 text-white hover:bg-rose-700'}`}
                                >
                                    {isConnected ? 'Configure' : 'Connect'}
                                </button>
                                {isConnected && (
                                    <div className="flex items-center">
                                        <button 
                                            onClick={() => handleToggleActive(savedProvider!)}
                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${savedProvider?.isEnabled ? 'bg-green-500' : 'bg-gray-200'}`}
                                        >
                                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${savedProvider?.isEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Config Modal */}
            {activeModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl animate-fade-in-up">
                        <div className="p-6 border-b flex justify-between items-center">
                            <h3 className="font-bold text-xl text-gray-800">Connect {editData.name}</h3>
                            <button onClick={() => setActiveModal(null)} className="text-gray-400 hover:text-gray-600">&times;</button>
                        </div>
                        
                        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                            <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-800 border border-blue-100">
                                <strong>Setup Instructions:</strong><br/>
                                1. Login to your {editData.name} account.<br/>
                                2. Navigate to Settings {'>'} API / Integrations.<br/>
                                3. Copy the keys below.
                            </div>

                            <div className="space-y-4">
                                {PROVIDER_TEMPLATES.find(t => t.slug === activeModal)?.fields.map(field => (
                                    <div key={field}>
                                        <label className="block text-sm font-medium text-gray-700 capitalize mb-1">{field.replace(/([A-Z])/g, ' $1').trim()}</label>
                                        <input 
                                            type="password"
                                            value={(editData.credentials as any)?.[field] || ''}
                                            onChange={(e) => handleCredentialChange(field, e.target.value)}
                                            className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-rose-500 focus:border-rose-500"
                                            placeholder={`Enter ${field}`}
                                        />
                                    </div>
                                ))}
                            </div>

                            <div className="border-t pt-4">
                                <h4 className="font-bold text-sm text-gray-700 mb-3">Sync Settings</h4>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium">Test Mode (Sandbox)</p>
                                        <p className="text-xs text-gray-500">Use test credentials for debugging.</p>
                                    </div>
                                    <input 
                                        type="checkbox" 
                                        checked={editData.isTestMode || false} 
                                        onChange={e => setEditData({ ...editData, isTestMode: e.target.checked })}
                                        className="h-4 w-4 text-rose-600 rounded"
                                    />
                                </div>
                                <div className="flex items-center justify-between mt-4">
                                    <div>
                                        <p className="text-sm font-medium">Auto-Ship Orders</p>
                                        <p className="text-xs text-gray-500">Automatically push order when status marks 'Packed'.</p>
                                    </div>
                                    <input 
                                        type="checkbox" 
                                        checked={editData.settings?.autoShip || false} 
                                        onChange={e => setEditData({ ...editData, settings: { ...editData.settings, autoShip: e.target.checked } })}
                                        className="h-4 w-4 text-rose-600 rounded"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-gray-50 rounded-b-xl border-t flex justify-between items-center">
                            <button 
                                onClick={handleTestConnection}
                                disabled={connectionLoading}
                                className="text-blue-600 text-sm font-medium hover:underline"
                            >
                                {connectionLoading ? 'Testing...' : 'Test Connection'}
                            </button>
                            <div className="flex gap-3">
                                <button onClick={() => setActiveModal(null)} className="px-4 py-2 border bg-white rounded-md text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
                                <button 
                                    onClick={handleSave}
                                    className="px-6 py-2 bg-rose-600 text-white rounded-md text-sm font-bold hover:bg-rose-700 shadow-sm"
                                >
                                    Save & Connect
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ShippingIntegrations;
