
import React, { useState, useEffect } from 'react';
import { getApiUrl } from '../../utils/apiHelper';

interface AbandonedLead {
    _id: string;
    email: string;
    phone: string;
    name: string;
    total: number;
    status: string;
    createdAt: string;
}

const AbandonedLeads: React.FC<{ token: string | null }> = ({ token }) => {
    const [leads, setLeads] = useState<AbandonedLead[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLeads = async () => {
            try {
                const res = await fetch(getApiUrl('/api/orders/abandoned'), {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) setLeads(await res.json());
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        };
        fetchLeads();
    }, [token]);

    if (loading) return <div className="p-8 text-center">Loading Leads...</div>;

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b">
                <h3 className="text-xl font-bold text-gray-900">Abandoned Checkouts (Webhooks)</h3>
                <p className="text-xs text-gray-500 mt-1">Customers who dropped off during payment via Razorpay Magic/Standard.</p>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400">Customer</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400">Contact</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400">Value</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400">Date</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {leads.length > 0 ? leads.map(lead => (
                            <tr key={lead._id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 text-sm font-bold text-gray-800">{lead.name}</td>
                                <td className="px-6 py-4 text-sm text-gray-500">
                                    <p>{lead.email}</p>
                                    <p className="text-[10px] font-bold text-brand-accent">{lead.phone}</p>
                                </td>
                                <td className="px-6 py-4 text-sm font-black text-gray-900">₹{lead.total}</td>
                                <td className="px-6 py-4 text-sm text-gray-400">{new Date(lead.createdAt).toLocaleString()}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase ${lead.status === 'Recovered' ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'}`}>
                                        {lead.status}
                                    </span>
                                </td>
                            </tr>
                        )) : (
                            <tr><td colSpan={5} className="px-6 py-20 text-center text-gray-400 italic">No leads captured yet. Ensure your webhook is connected.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AbandonedLeads;
