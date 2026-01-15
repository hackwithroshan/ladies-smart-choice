
import React from 'react';

type UserDashboardView = 'profile' | 'orders';

interface UserSidebarProps {
  currentView: UserDashboardView;
  setCurrentView: (view: UserDashboardView) => void;
}

const UserSidebar: React.FC<UserSidebarProps> = ({ currentView, setCurrentView }) => {
  const navItems: { view: UserDashboardView; label: string }[] = [
    { view: 'profile', label: 'My Profile' },
    { view: 'orders', label: 'Order History' },
  ];

  return (
    <aside className="w-full md:w-64 shrink-0 overflow-hidden">
      <nav className="flex md:flex-col gap-1 overflow-x-auto scrollbar-hide pb-2 md:pb-0">
        {navItems.map(item => (
          <button
            key={item.view}
            onClick={(e) => {
              e.preventDefault();
              setCurrentView(item.view);
            }}
            className={`whitespace-nowrap px-4 py-2.5 text-sm font-medium rounded-md transition-colors text-left flex items-center ${
              currentView === item.view
                ? 'bg-white shadow-sm ring-1 ring-zinc-200 text-zinc-950'
                : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'
            }`}
          >
            {item.label}
          </button>
        ))}
      </nav>
    </aside>
  );
};

export default UserSidebar;
