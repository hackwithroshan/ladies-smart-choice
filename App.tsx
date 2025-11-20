
import React, { useState, useEffect } from 'react';
import HomePage from './pages/HomePage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import UserDashboardPage from './pages/UserDashboardPage';
import ProductDetailsPage from './pages/ProductDetailsPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import { CartProvider } from './contexts/CartContext';

type View = 'login' | 'register' | 'home' | 'admin' | 'user-dashboard' | 'product-details' | 'cart' | 'checkout';

const App: React.FC = () => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [user, setUser] = useState<any>(JSON.parse(localStorage.getItem('user') || 'null'));
  const [view, setView] = useState<View>('home');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  
  useEffect(() => {
    if (token && user) {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      // Keep user on their current dashboard if they are already there
      const currentViewIsDashboard = view === 'admin' || view === 'user-dashboard';
      if (!currentViewIsDashboard && view === 'login') {
        setView('home');
      }
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (view !== 'register' && view !== 'login' && view !== 'home' && view !== 'product-details' && view !== 'cart' && view !== 'checkout') {
        setView('home');
      }
    }
  }, [token, user]);

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    setView('home');
  };

  const renderContent = () => {
    switch (view) {
      case 'login':
        return <LoginPage setToken={setToken} setUser={setUser} setView={setView} />;
      case 'register':
        return <RegisterPage setToken={setToken} setUser={setUser} setView={setView} />;
      case 'admin':
        return <AdminDashboardPage user={user} logout={handleLogout} setView={setView} />;
      case 'user-dashboard':
        return <UserDashboardPage user={user} logout={handleLogout} setView={setView} />;
      case 'product-details':
        return selectedProductId ? 
          <ProductDetailsPage 
            productId={selectedProductId} 
            user={user} 
            logout={handleLogout} 
            setView={setView} 
          /> : <HomePage user={user} logout={handleLogout} setView={setView} setSelectedProductId={setSelectedProductId} />;
      case 'cart':
        return <CartPage user={user} logout={handleLogout} setView={setView} />;
      case 'checkout':
        return <CheckoutPage user={user} logout={handleLogout} setView={setView} />;
      case 'home':
      default:
        return <HomePage user={user} logout={handleLogout} setView={setView} setSelectedProductId={setSelectedProductId} />;
    }
  };

  return (
    <CartProvider>
      <div className="min-h-screen bg-gray-50">
        {renderContent()}
      </div>
    </CartProvider>
  );
};

export default App;
