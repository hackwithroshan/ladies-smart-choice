
import React, { useState } from 'react';
import HeaderSettingsComponent from './HeaderSettings';

type SettingsTab = 'header' | 'site' | 'tax' | 'shipping' | 'pixels';

const Settings: React.FC<{token: string | null}> = ({token}) => {
    const [activeTab, setActiveTab] = useState<SettingsTab>('header');

    const TabButton: React.FC<{ id: SettingsTab; label: string }> = ({ id, label }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === id 
                ? 'bg-gray-800 text-white shadow-sm' 
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-transparent'
            }`}
        >
            {label}
        </button>
    );

    const renderContent = () => {
        switch (activeTab) {
            case 'header':
                return <HeaderSettingsComponent token={token} />;
            case 'pixels':
                return (
                    <div className="bg-white p-6 rounded-lg shadow-md max-w-3xl">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">Tracking & Pixels</h3>
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Facebook Pixel ID</label>
                                <div className="mt-1 flex rounded-md shadow-sm">
                                    <input type="text" className="flex-1 min-w-0 block w-full px-3 py-2 rounded-md border border-gray-300 focus:ring-orange-500 focus:border-orange-500 sm:text-sm" placeholder="xxxxxxxxxxxxxxx" />
                                </div>
                                <p className="mt-1 text-xs text-gray-500">We automatically inject the PageView and Purchase events.</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Google Analytics 4 Measurement ID</label>
                                <div className="mt-1 flex rounded-md shadow-sm">
                                    <input type="text" className="flex-1 min-w-0 block w-full px-3 py-2 rounded-md border border-gray-300 focus:ring-orange-500 focus:border-orange-500 sm:text-sm" placeholder="G-XXXXXXXXXX" />
                                </div>
                            </div>
                             <button className="px-4 py-2 text-sm font-medium text-white bg-gray-800 rounded-md">Save Pixel Settings</button>
                        </div>
                    </div>
                );
            case 'tax':
                 return (
                    <div className="bg-white p-6 rounded-lg shadow-md max-w-3xl">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">Tax & GST Configuration</h3>
                        <div className="space-y-4">
                            <div className="flex items-center">
                                <input type="checkbox" className="h-4 w-4 text-orange-600 border-gray-300 rounded"/>
                                <label className="ml-2 block text-sm text-gray-900">All prices include tax</label>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Default Tax Rate (%)</label>
                                <input type="number" className="mt-1 w-32 px-3 py-2 border border-gray-300 rounded-md"/>
                            </div>
                             <button className="px-4 py-2 text-sm font-medium text-white bg-gray-800 rounded-md">Save Tax Settings</button>
                        </div>
                    </div>
                 );
            case 'shipping':
                 return (
                    <div className="bg-white p-6 rounded-lg shadow-md max-w-3xl">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">Shipping Zones</h3>
                        <div className="space-y-4">
                            <div className="border p-4 rounded-md flex justify-between items-center">
                                <div>
                                    <h4 className="font-medium">Domestic (Standard)</h4>
                                    <p className="text-sm text-gray-500">5-7 Business Days</p>
                                </div>
                                <span className="font-bold">$15.00</span>
                            </div>
                             <div className="border p-4 rounded-md flex justify-between items-center">
                                <div>
                                    <h4 className="font-medium">International (Express)</h4>
                                    <p className="text-sm text-gray-500">2-4 Business Days</p>
                                </div>
                                <span className="font-bold">$45.00</span>
                            </div>
                            <button className="text-sm text-blue-600 font-medium">+ Add Shipping Zone</button>
                        </div>
                    </div>
                 );
            default:
                 return <div className="p-4">Select a setting category</div>;
        }
    };

    return (
        <div className="space-y-6">
             <h2 className="text-2xl font-bold text-gray-800">Store Settings</h2>
             <div className="flex space-x-2 bg-gray-100 p-1 rounded-lg w-fit">
                <TabButton id="header" label="Header & Menu" />
                <TabButton id="tax" label="Taxes" />
                <TabButton id="shipping" label="Shipping" />
                <TabButton id="pixels" label="Tracking Pixels" />
             </div>
             <div>
                 {renderContent()}
             </div>
        </div>
    );
}

export default Settings;