
import React, { useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import UserSidebar from '../components/UserSidebar';
import UserProfile from '../components/UserProfile';
import UserOrderHistory from '../components/UserOrderHistory';
import { User } from '../types';

type UserDashboardView = 'profile' | 'orders';

interface UserDashboardPageProps {
  user: User;
  logout: () => void;
}

const UserDashboardPage: React.FC<UserDashboardPageProps> = ({ user, logout }) => {
  const [currentView, setCurrentView] = useState<UserDashboardView>('profile');
  const token = localStorage.getItem('token');

  const renderContent = () => {
    switch (currentView) {
      case 'profile':
        return <UserProfile user={user} />;
      case 'orders':
        return <UserOrderHistory token={token} />;
      default:
        return <UserProfile user={user} />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50/50">
      <Header user={user} logout={logout} />
      
      <main className="flex-grow container mx-auto px-4 py-12 lg:py-20">
        <div className="max-w-[1200px] mx-auto space-y-10">
            <div className="space-y-0.5">
                <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Account</h1>
                <p className="text-zinc-500">Manage your profile, orders, and wellness journey.</p>
            </div>

            <div className="flex flex-col md:flex-row gap-12 items-start">
                <UserSidebar currentView={currentView} setCurrentView={setCurrentView} />
                <div className="flex-1 w-full animate-in fade-in slide-in-from-bottom-2">
                    {renderContent()}
                </div>
            </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default UserDashboardPage;
