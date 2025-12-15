
import React, { useState, useEffect, useRef } from 'react';
import { User } from '../../types';
import { getApiUrl } from '../../utils/apiHelper';

interface AdminHeaderProps {
  user: User;
  logout: () => void;
  toggleSidebar: () => void;
  openGlobalSearch: () => void;
  setCurrentView: (view: any) => void;
}

interface Notification {
    id: string;
    message: string;
    link: string;
    read: boolean;
    createdAt: string;
}

function timeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.round((now.getTime() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
}

const AdminHeader: React.FC<AdminHeaderProps> = ({ user, logout, toggleSidebar, openGlobalSearch, setCurrentView }) => {
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadMessages, setUnreadMessages] = useState(0);

    const profileRef = useRef<HTMLDivElement>(null);
    const notificationsRef = useRef<HTMLDivElement>(null);
    const token = localStorage.getItem('token');

    const unreadNotifs = notifications.filter(n => !n.read).length;

    // Polling for notifications and messages
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch Notifications
                const notifRes = await fetch(getApiUrl('/notifications'), { headers: { 'Authorization': `Bearer ${token}` } });
                if (notifRes.ok) setNotifications(await notifRes.json());
                
                // Fetch Contact Submissions to get unread count
                const msgRes = await fetch(getApiUrl('/contact'), { headers: { 'Authorization': `Bearer ${token}` } });
                if (msgRes.ok) {
                    const messages = await msgRes.json();
                    setUnreadMessages(messages.filter((m: any) => !m.read).length);
                }
            } catch (error) {
                console.error("Failed to fetch header data:", error);
            }
        };

        fetchData(); // Initial fetch
        const interval = setInterval(fetchData, 30000); // Poll every 30 seconds
        return () => clearInterval(interval);
    }, [token]);

    // Click outside handlers
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (profileRef.current && !profileRef.current.contains(event.target as Node)) setIsProfileOpen(false);
            if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) setIsNotificationsOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleMarkAllRead = async () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true }))); // Optimistic update
        try {
            await fetch(getApiUrl('/notifications/mark-read'), {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
        } catch (error) {
            console.error("Failed to mark notifications as read:", error);
        }
    };

    const getInitials = (name: string) => {
      if (!name) return 'A';
      const parts = name.split(' ').filter(Boolean);
      return parts.length > 1 ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() : name.substring(0, 2).toUpperCase();
    };

    return (
        <header className="bg-white shadow-sm p-4 flex justify-between items-center z-40 border-b flex-shrink-0 h-20">
            <div className="flex items-center gap-3">
                <button onClick={toggleSidebar} className="lg:hidden text-gray-500 p-2 rounded-full hover:bg-gray-100">
                     <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                </button>

                {/* Global Search Trigger - Responsive */}
                {/* Hidden on very small screens, expanded on desktop */}
                <div className="relative">
                    <button 
                        onClick={openGlobalSearch} 
                        className="hidden sm:flex items-center text-left text-sm text-gray-500 bg-gray-100 border border-gray-200 rounded-lg py-2 px-4 hover:bg-gray-200 transition-colors w-64 lg:w-96"
                    >
                        <svg className="w-5 h-5 mr-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        Search products, orders...
                        <span className="ml-auto text-xs border border-gray-300 rounded px-1.5 py-0.5 font-mono hidden md:inline">Ctrl K</span>
                    </button>
                    {/* Mobile Search Icon */}
                    <button onClick={openGlobalSearch} className="sm:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-full">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </button>
                </div>
            </div>

            <div className="flex items-center space-x-2 md:space-x-4">
                <a href="/" target="_blank" rel="noopener noreferrer" className="hidden md:flex text-sm text-blue-600 font-medium hover:underline items-center gap-1 p-2 rounded-md hover:bg-blue-50 transition-colors">
                    <span>View Store</span>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                </a>
                
                <div className="w-px h-6 bg-gray-200 hidden md:block"></div>

                {/* Icons */}
                <div className="flex items-center space-x-1">
                    {/* Messages */}
                     <button 
                        onClick={() => setCurrentView('contact-messages')}
                        className="relative p-2 text-gray-500 rounded-full hover:bg-gray-100 hover:text-gray-800 transition-colors"
                        title="Contact Messages"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                        {unreadMessages > 0 && <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-white text-[10px] font-bold">{unreadMessages}</span>}
                    </button>
                    
                    {/* Notifications */}
                    <div className="relative" ref={notificationsRef}>
                        <button onClick={() => setIsNotificationsOpen(prev => !prev)} className="relative p-2 text-gray-500 rounded-full hover:bg-gray-100 hover:text-gray-800 transition-colors" title="Notifications">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                            {unreadNotifs > 0 && <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-white text-[10px] font-bold">{unreadNotifs}</span>}
                        </button>
                        {isNotificationsOpen && (
                            <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-2xl border border-gray-200 z-50 animate-fade-in-up overflow-hidden">
                                <div className="p-3 flex justify-between items-center border-b">
                                    <h4 className="font-bold text-gray-800">Notifications</h4>
                                    {unreadNotifs > 0 && <button onClick={handleMarkAllRead} className="text-xs text-blue-600 font-medium hover:underline">Mark all as read</button>}
                                </div>
                                <div className="max-h-96 overflow-y-auto">
                                    {notifications.length === 0 ? <p className="text-sm text-gray-500 text-center py-8">No new notifications.</p> :
                                    notifications.map(notif => (
                                        <div key={notif.id} className={`p-3 border-b border-gray-100 last:border-0 hover:bg-gray-50 cursor-pointer ${!notif.read ? 'bg-blue-50' : 'bg-white'}`}>
                                            <p className="text-sm text-gray-700">{notif.message}</p>
                                            <p className="text-xs text-gray-400 mt-1">{timeAgo(notif.createdAt)}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Profile */}
                    <div className="relative" ref={profileRef}>
                        <button onClick={() => setIsProfileOpen(prev => !prev)} className="flex items-center space-x-2 p-1 rounded-full hover:bg-gray-100">
                            {user.avatarUrl ? (
                                <img src={user.avatarUrl} alt={user.name} className="w-8 h-8 rounded-full object-cover" />
                            ) : (
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-500 to-orange-600 flex items-center justify-center text-xs font-bold text-white">
                                    {getInitials(user.name)}
                                </div>
                            )}
                        </button>
                        {isProfileOpen && (
                            <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-2xl py-1 z-50 ring-1 ring-black ring-opacity-5 animate-fade-in-up">
                                <div className="px-4 py-3 border-b">
                                    <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
                                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                                </div>
                                <button onClick={() => { setCurrentView('admin-profile'); setIsProfileOpen(false); }} className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">My Profile</button>
                                <button onClick={() => { setCurrentView('settings'); setIsProfileOpen(false); }} className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Settings</button>
                                <div className="border-t my-1"></div>
                                <button onClick={() => { logout(); setIsProfileOpen(false); }} className="w-full text-left block px-4 py-2 text-sm text-red-600 hover:bg-red-50">Logout</button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default AdminHeader;
