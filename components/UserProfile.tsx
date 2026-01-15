
import React from 'react';
import { User } from '../types';

const UserProfile: React.FC<{ user: User | null }> = ({ user }) => {
  if (!user) return <div className="p-12 text-center animate-pulse text-zinc-400">Loading profile...</div>;

  return (
    <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-8">
      <h2 className="text-xl font-bold text-zinc-900 mb-8 border-b border-zinc-100 pb-4">Personal Details</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Full Name</label>
          <p className="text-base font-bold text-zinc-900">{user.name}</p>
        </div>
        
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Email Address</label>
          <p className="text-base font-bold text-zinc-900">{user.email}</p>
        </div>
        
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Customer Status</label>
          <div>
            <span className="inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-bold text-zinc-900 border border-zinc-200">
              Verified {user.role}
            </span>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Member Since</label>
          <p className="text-base font-bold text-zinc-900">{new Date(user.joinDate).toLocaleDateString()}</p>
        </div>
      </div>

      <div className="mt-12 pt-8 border-t border-zinc-100 flex justify-end">
          <button className="h-9 inline-flex items-center justify-center rounded-md border border-zinc-200 bg-white px-4 text-xs font-bold text-zinc-900 shadow-sm hover:bg-zinc-50 transition-colors">
              Request Data Export
          </button>
      </div>
    </div>
  );
};

export default UserProfile;
