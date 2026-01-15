
import React, { useState, useEffect } from 'react';
import { Campaign } from '../../types';
import { COLORS } from '../../constants';
import { getApiUrl } from '../../utils/apiHelper';

const Marketing: React.FC<{ token: string | null }> = ({ token }) => {
    const [activeTab, setActiveTab] = useState<'Campaigns' | 'Integrations'>('Campaigns');
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newCampaign, setNewCampaign] = useState({ name: '', type: 'Email' });

    // Meta Integration State
    const [metaSettings, setMetaSettings] = useState({
        metaPixelId: '',
        metaAccessToken: '',
        metaCatalogId: '',
        testEventCode: ''
    });
    const [savingMeta, setSavingMeta] = useState(false);

    const fetchCampaigns = async () => {
        try {
            const response = await fetch(getApiUrl('/api/campaigns'), {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to fetch');
            const data = await response.json();
            setCampaigns(data);
        } catch (error) {
            console.error("Error fetching campaigns", error);
        }
    };

    const fetchMetaSettings = async () => {
        try {
            const response = await fetch(getApiUrl('/api/settings/site'), {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setMetaSettings({
                    metaPixelId: data.metaPixelId || '',
                    metaAccessToken: data.metaAccessToken || '',
                    metaCatalogId: data.metaCatalogId || '',
                    testEventCode: ''
                });
            }
        } catch (error) {
            console.error("Error fetching meta settings", error);
        }
    };

    const handleSaveMeta = async () => {
        setSavingMeta(true);
        try {
            const response = await fetch(getApiUrl('/api/settings/site'), {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(metaSettings)
            });
            if (response.ok) {
                alert('Facebook & Instagram Settings Saved Successfully!');
            } else {
                alert('Failed to save settings.');
            }
        } catch (error) {
            console.error("Error saving meta settings", error);
        } finally {
            setSavingMeta(false);
        }
    };

    const handleTestEvent = async () => {
        if (!metaSettings.testEventCode) return alert('Please enter a Test Event Code.');
        try {
            const response = await fetch(getApiUrl('/api/integrations/facebook/test-event'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ testEventCode: metaSettings.testEventCode })
            });
            const res = await response.json();
            alert(res.message);
        } catch (error) {
            alert('Failed to send test event.');
        }
    };

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            await Promise.all([fetchCampaigns(), fetchMetaSettings()]);
            setLoading(false);
        };
        load();
    }, [token]);

    const handleCreate = async () => {
        try {
            const response = await fetch(getApiUrl('/api/campaigns'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(newCampaign)
            });
            if (response.ok) {
                setIsModalOpen(false);
                fetchCampaigns();
                setNewCampaign({ name: '', type: 'Email' });
            }
        } catch (error) {
            console.error('Error creating campaign', error);
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Marketing & Integrations</h2>
                    <p className="text-sm text-gray-500">Manage campaigns and connect with social platforms.</p>
                </div>
                <div className="flex space-x-2">
                    <button
                        onClick={() => setActiveTab('Campaigns')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'Campaigns' ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                        In-App Campaigns
                    </button>
                    <button
                        onClick={() => setActiveTab('Integrations')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'Integrations' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                        Facebook & Instagram
                    </button>
                </div>
            </div>

            {activeTab === 'Integrations' ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                            <svg className="w-6 h-6 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.04c-5.5 0-10 4.49-10 10.02 0 5 3.66 9.15 8.44 9.9v-7H7.9v-2.9h2.54V9.85c0-2.51 1.49-3.89 3.77-3.89 1.09 0 2.23.19 2.23.19v2.47h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.45 2.9h-2.33v7a10 10 0 0 0 8.44-9.9c0-5.53-4.5-10.02-10-10.02Z" /></svg>
                            Meta Pixel & CAPI Settings
                        </h3>
                        <p className="text-sm text-gray-500 mb-6">
                            Connect your website to Facebook and Instagram to track conversions and run dynamic ads.
                        </p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Meta Pixel ID</label>
                                <input
                                    type="text"
                                    className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="e.g. 1234567890"
                                    value={metaSettings.metaPixelId}
                                    onChange={e => setMetaSettings({ ...metaSettings, metaPixelId: e.target.value })}
                                />
                                <p className="text-xs text-gray-500 mt-1">Found in Events Manager &gt; Data Sources &gt; Settings</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Conversion API Access Token</label>
                                <textarea
                                    className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3 shadow-sm focus:ring-blue-500 focus:border-blue-500 text-xs font-mono"
                                    rows={3}
                                    placeholder="EAA..."
                                    value={metaSettings.metaAccessToken}
                                    onChange={e => setMetaSettings({ ...metaSettings, metaAccessToken: e.target.value })}
                                />
                                <p className="text-xs text-gray-500 mt-1">Generate this in Events Manager &gt; Settings &gt; Conversion API</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Catalog ID (Optional)</label>
                                <input
                                    type="text"
                                    className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Commerce Manager Catalog ID"
                                    value={metaSettings.metaCatalogId}
                                    onChange={e => setMetaSettings({ ...metaSettings, metaCatalogId: e.target.value })}
                                />
                            </div>

                            <div className="pt-4">
                                <button
                                    onClick={handleSaveMeta}
                                    disabled={savingMeta}
                                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                                >
                                    {savingMeta ? 'Saving Connection...' : 'Save Connection'}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <h3 className="text-lg font-bold text-gray-800 mb-4">Connection Status</h3>
                            <div className="flex items-center space-x-2 mb-4">
                                <span className={`h-3 w-3 rounded-full ${metaSettings.metaPixelId ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                <span className="text-sm font-medium text-gray-700">
                                    {metaSettings.metaPixelId ? 'Pixel Configured' : 'Pixel Not Configured'}
                                </span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <span className={`h-3 w-3 rounded-full ${metaSettings.metaAccessToken ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                <span className="text-sm font-medium text-gray-700">
                                    {metaSettings.metaAccessToken ? 'CAPI Token Found' : 'CAPI Token Missing'}
                                </span>
                            </div>

                            <div className="mt-6 border-t pt-4">
                                <h4 className="text-sm font-semibold text-gray-900 mb-2">Test Server Events</h4>
                                <div className="flex space-x-2">
                                    <input
                                        type="text"
                                        placeholder="Test Event Code (e.g. TEST1234)"
                                        className="flex-1 border border-gray-300 rounded-md py-2 px-3 text-sm"
                                        value={metaSettings.testEventCode}
                                        onChange={e => setMetaSettings({ ...metaSettings, testEventCode: e.target.value })}
                                    />
                                    <button
                                        onClick={handleTestEvent}
                                        className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 bg-white"
                                    >
                                        Send Test
                                    </button>
                                </div>
                                <p className="text-xs text-gray-500 mt-2">
                                    Check "Test Events" tab in Facebook Events Manager to see if the server event arrives.
                                </p>
                            </div>
                        </div>

                        <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                            <h4 className="text-sm font-bold text-blue-800 mb-2">Why Connect Both?</h4>
                            <p className="text-xs text-blue-700 mb-2">
                                <strong>Pixel (Browser):</strong> Tracks events in the user's browser. Vulnerable to ad blockers.
                            </p>
                            <p className="text-xs text-blue-700">
                                <strong>Conversion API (Server):</strong> Sends events directly from our server to Facebook. Immune to ad blockers and more reliable for purchase tracking.
                            </p>
                        </div>
                    </div>
                </div>
            ) : (
                <>
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold text-gray-800">Email & SMS Campaigns</h2>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="px-4 py-2 text-sm font-medium text-white rounded-md shadow-sm flex items-center"
                            style={{ backgroundColor: COLORS.accent }}
                        >
                            <span className="mr-2">+</span> Create Campaign
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg p-6 text-white shadow-md">
                            <h3 className="text-lg font-semibold">Email Credits</h3>
                            <p className="text-3xl font-bold mt-2">12,450</p>
                            <p className="text-sm opacity-80 mt-1">Remaining out of 20,000</p>
                        </div>
                        <div className="bg-gradient-to-r from-green-500 to-teal-500 rounded-lg p-6 text-white shadow-md">
                            <h3 className="text-lg font-semibold">SMS Credits</h3>
                            <p className="text-3xl font-bold mt-2">850</p>
                            <p className="text-sm opacity-80 mt-1">Auto-recharge enabled</p>
                        </div>
                        <div className="bg-white rounded-lg p-6 shadow-md border border-gray-200 flex flex-col justify-center items-center text-center">
                            <h3 className="text-gray-600 font-medium">AI Content Generator</h3>
                            <button className="mt-3 text-indigo-600 font-semibold text-sm border border-indigo-600 px-4 py-2 rounded-full hover:bg-indigo-50">Try AI Assistant</button>
                        </div>
                    </div>

                    <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
                        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                            <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wider">Recent Campaigns</h3>
                        </div>
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-white">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Campaign Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Performance</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {campaigns.length === 0 ? (
                                    <tr><td colSpan={4} className="text-center py-4 text-gray-500">No campaigns found.</td></tr>
                                ) : (
                                    campaigns.map(campaign => (
                                        <tr key={campaign.id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{campaign.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{campaign.type}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${campaign.status === 'Sent' ? 'bg-green-100 text-green-800' :
                                                        campaign.status === 'Scheduled' ? 'bg-blue-100 text-blue-800' :
                                                            'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    {campaign.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {campaign.status === 'Sent' ? (
                                                    <div className="flex space-x-4">
                                                        <div><span className="font-bold">{campaign.openRate}%</span> Open</div>
                                                        <div><span className="font-bold">{campaign.clickRate}%</span> Click</div>
                                                    </div>
                                                ) : '-'}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {isModalOpen && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
                            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg">
                                <h3 className="text-lg font-bold mb-4">Create New Campaign</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Campaign Name</label>
                                        <input
                                            type="text"
                                            className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3"
                                            value={newCampaign.name}
                                            onChange={e => setNewCampaign({ ...newCampaign, name: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Channel</label>
                                        <select
                                            className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3"
                                            value={newCampaign.type}
                                            onChange={e => setNewCampaign({ ...newCampaign, type: e.target.value })}
                                        >
                                            <option value="Email">Email Broadcast</option>
                                            <option value="SMS">SMS Blast</option>
                                            <option value="WhatsApp">WhatsApp Message</option>
                                            <option value="Push">Mobile Push Notification</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="mt-6 flex justify-end space-x-3">
                                    <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm bg-gray-200 rounded-md">Cancel</button>
                                    <button onClick={handleCreate} className="px-4 py-2 text-sm text-white rounded-md" style={{ backgroundColor: COLORS.accent }}>Draft Campaign</button>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

export default Marketing;
