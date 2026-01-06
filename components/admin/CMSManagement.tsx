
import React, { useState, useEffect } from 'react';
import SliderSettings from './SliderSettings';
import BlogEditor from './BlogEditor';
import PageEditor from './PageEditor';
import VideoSettings from './VideoSettings';
import TestimonialSettings from './TestimonialSettings';
import CollectionSettings from './CollectionSettings';
import HomepageEditor from './HomepageEditor';
import * as ReactRouterDom from 'react-router-dom';
const { useNavigate } = ReactRouterDom as any;

// Removed 'header' from CMSTab type
type CMSTab = 'page-builder' | 'pdp-builder' | 'collections' | 'blogs' | 'pages' | 'videos' | 'reviews' | 'slider';

interface CMSManagementProps {
    token: string | null;
    initialTab?: CMSTab;
}

const CMSManagement: React.FC<CMSManagementProps> = ({ token, initialTab }) => {
    const [activeTab, setActiveTab] = useState<CMSTab>(initialTab || 'page-builder');
    const navigate = useNavigate();

    useEffect(() => {
        if (initialTab) setActiveTab(initialTab);
    }, [initialTab]);

    const TabButton = ({ id, label }: { id: CMSTab, label: string }) => (
        <button 
            onClick={() => {
                if (id === 'pdp-builder') {
                    navigate('/app/content/pdp?productId=global');
                } else {
                    setActiveTab(id);
                }
            }}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === id ? 'border-rose-600 text-rose-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
            {label}
        </button>
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Content Management</h2>
            </div>

            <div className="border-b border-gray-200 overflow-x-auto">
                <div className="flex space-x-4 min-w-max">
                    <TabButton id="page-builder" label="Homepage Builder" />
                    <TabButton id="pdp-builder" label="Product Designer" />
                    <TabButton id="collections" label="Collections" />
                    <TabButton id="videos" label="Shop Videos" />
                    <TabButton id="slider" label="Banners" />
                    <TabButton id="reviews" label="Reviews" />
                    <TabButton id="blogs" label="Blogs" />
                    <TabButton id="pages" label="Legal" />
                </div>
            </div>

            <div className="pt-4">
                {activeTab === 'page-builder' && <HomepageEditor token={token} />}
                {activeTab === 'collections' && <CollectionSettings token={token} />}
                {activeTab === 'slider' && <SliderSettings token={token} />}
                {activeTab === 'videos' && <VideoSettings token={token} />}
                {activeTab === 'reviews' && <TestimonialSettings token={token} />}
                {activeTab === 'blogs' && <BlogEditor token={token} />}
                {activeTab === 'pages' && <PageEditor token={token} />}
            </div>
        </div>
    );
};

export default CMSManagement;
