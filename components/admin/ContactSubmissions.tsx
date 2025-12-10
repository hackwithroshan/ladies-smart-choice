
import React, { useState, useEffect } from 'react';
import { getApiUrl } from '../../utils/apiHelper';

interface Submission {
    id: string;
    name: string;
    email: string;
    subject: string;
    message: string;
    read: boolean;
    createdAt: string;
}

const ContactSubmissions: React.FC<{ token: string | null }> = ({ token }) => {
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);

    const fetchSubmissions = async () => {
        setLoading(true);
        try {
            const res = await fetch(getApiUrl('/contact'), {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error("Failed to fetch submissions");
            const data = await res.json();
            setSubmissions(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSubmissions();
    }, [token]);

    const handleToggleRead = async (submission: Submission) => {
        try {
            const res = await fetch(getApiUrl(`/contact/${submission.id}`), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ read: !submission.read })
            });
            if (res.ok) {
                const updated = await res.json();
                setSubmissions(prev => prev.map(s => s.id === updated.id ? updated : s));
                if (selectedSubmission?.id === updated.id) {
                    setSelectedSubmission(updated);
                }
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Delete this message forever?")) return;
        try {
            await fetch(getApiUrl(`/contact/${id}`), {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setSubmissions(prev => prev.filter(s => s.id !== id));
            setSelectedSubmission(null);
        } catch (err) {
            console.error(err);
        }
    };
    
    if (loading) return <div>Loading messages...</div>;
    if (error) return <div>Error: {error}</div>;

    const unreadCount = submissions.filter(s => !s.read).length;

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">
                Contact Form Submissions ({unreadCount} unread)
            </h2>
            <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">From</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {submissions.map(sub => (
                            <tr key={sub.id} onClick={() => setSelectedSubmission(sub)} className={`cursor-pointer transition-colors ${sub.read ? 'bg-white hover:bg-gray-50' : 'bg-blue-50 hover:bg-blue-100 font-semibold'}`}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">{sub.name}</div>
                                    <div className={`text-xs ${sub.read ? 'text-gray-500' : 'text-blue-600'}`}>{sub.email}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{sub.subject}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(sub.createdAt).toLocaleString()}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button onClick={(e) => { e.stopPropagation(); setSelectedSubmission(sub); }} className="text-blue-600 hover:text-blue-900">View</button>
                                </td>
                            </tr>
                        ))}
                         {submissions.length === 0 && (
                            <tr><td colSpan={4} className="text-center py-10 text-gray-500">No submissions yet.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {selectedSubmission && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden">
                        <div className="p-6 border-b">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-800">{selectedSubmission.subject}</h3>
                                    <p className="text-sm text-gray-600">From: {selectedSubmission.name} &lt;{selectedSubmission.email}&gt;</p>
                                    <p className="text-xs text-gray-400 mt-1">{new Date(selectedSubmission.createdAt).toLocaleString()}</p>
                                </div>
                                <button onClick={() => setSelectedSubmission(null)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
                            </div>
                        </div>
                        <div className="p-6 max-h-80 overflow-y-auto bg-gray-50">
                            <p className="text-gray-700 whitespace-pre-wrap">{selectedSubmission.message}</p>
                        </div>
                        <div className="p-4 bg-gray-100 border-t flex justify-between items-center">
                            <button onClick={() => handleDelete(selectedSubmission.id)} className="text-sm text-red-600 hover:text-red-800">Delete Message</button>
                            <div className="flex gap-2">
                                <button onClick={() => handleToggleRead(selectedSubmission)} className="text-sm px-4 py-2 border rounded-md bg-white hover:bg-gray-50">{selectedSubmission.read ? 'Mark as Unread' : 'Mark as Read'}</button>
                                <a href={`mailto:${selectedSubmission.email}?subject=Re: ${selectedSubmission.subject}`} className="text-sm px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Reply via Email</a>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ContactSubmissions;
