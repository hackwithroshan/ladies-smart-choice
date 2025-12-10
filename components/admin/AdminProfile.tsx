
import React, { useState } from 'react';
import { User } from '../../types';
import MediaPicker from './MediaPicker';
import { getApiUrl } from '../../utils/apiHelper';
import ErrorMessage from '../ErrorMessage';

interface AdminProfileProps {
    user: User;
    token: string | null;
    onUpdateUser: (user: User) => void;
}

const AdminProfile: React.FC<AdminProfileProps> = ({ user, token, onUpdateUser }) => {
    const [profile, setProfile] = useState({ name: user.name, email: user.email, avatarUrl: user.avatarUrl || '' });
    const [password, setPassword] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    
    const [profileLoading, setProfileLoading] = useState(false);
    const [passwordLoading, setPasswordLoading] = useState(false);
    
    const [profileFeedback, setProfileFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    const [passwordFeedback, setPasswordFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setProfile({ ...profile, [e.target.name]: e.target.value });
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPassword({ ...password, [e.target.name]: e.target.value });
    };

    const handleProfileSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setProfileLoading(true);
        setProfileFeedback(null);
        try {
            const res = await fetch(getApiUrl('/users/profile'), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(profile)
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Failed to update profile.');
            }
            const updatedUser = await res.json();
            onUpdateUser(updatedUser); // Update parent state
            setProfileFeedback({ type: 'success', message: 'Profile updated successfully!' });
        } catch (err: any) {
            setProfileFeedback({ type: 'error', message: err.message });
        } finally {
            setProfileLoading(false);
        }
    };

    const handlePasswordSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordLoading(true);
        setPasswordFeedback(null);
        if (password.newPassword !== password.confirmPassword) {
            setPasswordFeedback({ type: 'error', message: 'New passwords do not match.' });
            setPasswordLoading(false);
            return;
        }
        if (password.newPassword.length < 6) {
             setPasswordFeedback({ type: 'error', message: 'New password must be at least 6 characters long.' });
             setPasswordLoading(false);
             return;
        }

        try {
            const res = await fetch(getApiUrl('/users/change-password'), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ currentPassword: password.currentPassword, newPassword: password.newPassword })
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || 'Failed to change password.');
            }
            setPasswordFeedback({ type: 'success', message: data.message });
            setPassword({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err: any) {
            setPasswordFeedback({ type: 'error', message: err.message });
        } finally {
            setPasswordLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <h2 className="text-2xl font-bold text-gray-800">My Profile</h2>
            
            {/* Profile Details Form */}
            <form onSubmit={handleProfileSave} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-bold text-gray-800 mb-6 border-b pb-4">Personal Information</h3>
                {profileFeedback && (
                    profileFeedback.type === 'success' ? (
                        <div className="mb-4 p-3 bg-green-50 text-green-700 border border-green-200 rounded-md text-sm">{profileFeedback.message}</div>
                    ) : (
                        <ErrorMessage message={profileFeedback.message} onClose={() => setProfileFeedback(null)} />
                    )
                )}
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                        <div className="md:col-span-2 space-y-6">
                             <div>
                                <label className="block text-sm font-medium text-gray-700">Full Name</label>
                                <input type="text" name="name" value={profile.name} onChange={handleProfileChange} className="mt-1 w-full border border-gray-300 p-2 rounded-md" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Email Address</label>
                                <input type="email" name="email" value={profile.email} onChange={handleProfileChange} className="mt-1 w-full border border-gray-300 p-2 rounded-md" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Profile Picture</label>
                            <MediaPicker value={profile.avatarUrl} onChange={(url) => setProfile({ ...profile, avatarUrl: url })} type="image" />
                        </div>
                    </div>
                </div>
                <div className="mt-6 pt-4 border-t text-right">
                    <button type="submit" disabled={profileLoading} className="bg-gray-800 text-white px-5 py-2 rounded-md text-sm font-medium hover:bg-black disabled:opacity-50">
                        {profileLoading ? 'Saving...' : 'Save Profile'}
                    </button>
                </div>
            </form>

            {/* Change Password Form */}
            <form onSubmit={handlePasswordSave} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-bold text-gray-800 mb-6 border-b pb-4">Change Password</h3>
                 {passwordFeedback && (
                    passwordFeedback.type === 'success' ? (
                        <div className="mb-4 p-3 bg-green-50 text-green-700 border border-green-200 rounded-md text-sm">{passwordFeedback.message}</div>
                    ) : (
                        <ErrorMessage message={passwordFeedback.message} onClose={() => setPasswordFeedback(null)} />
                    )
                )}
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Current Password</label>
                        <input type="password" name="currentPassword" value={password.currentPassword} onChange={handlePasswordChange} required className="mt-1 w-full border border-gray-300 p-2 rounded-md" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">New Password</label>
                        <input type="password" name="newPassword" value={password.newPassword} onChange={handlePasswordChange} required className="mt-1 w-full border border-gray-300 p-2 rounded-md" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Confirm New Password</label>
                        <input type="password" name="confirmPassword" value={password.confirmPassword} onChange={handlePasswordChange} required className="mt-1 w-full border border-gray-300 p-2 rounded-md" />
                    </div>
                </div>
                 <div className="mt-6 pt-4 border-t text-right">
                    <button type="submit" disabled={passwordLoading} className="bg-rose-600 text-white px-5 py-2 rounded-md text-sm font-medium hover:bg-rose-700 disabled:opacity-50">
                        {passwordLoading ? 'Updating...' : 'Update Password'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AdminProfile;
