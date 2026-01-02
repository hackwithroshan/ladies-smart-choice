
import React, { useState, useEffect, Suspense, lazy, useRef } from 'react';
import * as ReactRouterDom from 'react-router-dom';
const { BrowserRouter: Router, Routes, Route, Navigate, useLocation, useNavigate } = ReactRouterDom as any;
import { HelmetProvider } from 'react-helmet-async';
import { CartProvider } from './contexts/CartContext';
import { WishlistProvider } from './contexts/WishlistContext';
import { SiteDataProvider, useSiteData } from './contexts/SiteDataContext';
import { ToastProvider } from './contexts/ToastContext';
import { initFacebookPixel } from './utils/metaPixel';
import { masterTracker } from './utils/tracking';
import { getApiUrl } from './utils/apiHelper';
import ErrorBoundary from './components/ErrorBoundary';
import SmartPopup from './components/SmartPopup';
import WhatsAppWidget from './components/WhatsAppWidget';
import MaintenancePage from './pages/MaintenancePage';

type PageWithUserProps = { user: any; logout: () => void };

const HomePage: React.ComponentType<PageWithUserProps> = lazy(() => import('./pages/HomePage'));
const AdminDashboardPage: React.ComponentType<PageWithUserProps> = lazy(() => import('./pages/AdminDashboardPage'));
const LoginPage: React.ComponentType<{ onAuthSuccess: (data: { token: string; user: any }) => void }> = lazy(() => import('./pages/LoginPage'));
const RegisterPage: React.ComponentType<{ onAuthSuccess: (data: { token: string; user: any }) => void }> = lazy(() => import('./pages/RegisterPage'));
const UserDashboardPage: React.ComponentType<PageWithUserProps> = lazy(() => import('./pages/UserDashboardPage'));
const ProductDetailsPage: React.ComponentType<PageWithUserProps> = lazy(() => import('./pages/ProductDetailsPage'));
const CartPage: React.ComponentType<PageWithUserProps> = lazy(() => import('./pages/CartPage'));
const CheckoutPage: React.ComponentType<PageWithUserProps> = lazy(() => import('./pages/CheckoutPage'));
const DynamicPage: React.ComponentType<PageWithUserProps> = lazy(() => import('./pages/DynamicPage'));
const CollectionPage: React.ComponentType<PageWithUserProps> = lazy(() => import('./pages/CollectionPage'));
const ContactPage: React.ComponentType<PageWithUserProps> = lazy(() => import('./pages/ContactPage'));
const OrderTrackingPage: React.ComponentType<PageWithUserProps> = lazy(() => import('./pages/OrderTrackingPage'));
const WishlistPage: React.ComponentType<PageWithUserProps> = lazy(() => import('./pages/WishlistPage'));

const LoadingSpinner: React.FC = () => (
    <div className="flex justify-center items-center h-screen w-screen bg-gray-50">
        <div className="animate-spin rounded-full h-24 w-24 border-t-2 border-b-2 border-[#16423C]"></div>
    </div>
);

const AppContent: React.FC = () => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [user, setUser] = useState<any>(JSON.parse(localStorage.getItem('user') || 'null'));
  const { siteSettings } = useSiteData();
  const navigate = useNavigate();
  const location = useLocation();

  // Detect Subdomain
  const hostname = window.location.hostname;
  const isDashboardSubdomain = hostname.startsWith('dashboard.') || location.pathname.startsWith('/app');

  useEffect(() => {
    if (token && user) {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }, [token, user]);

  const handleAuthSuccess = (data: { token: string; user: any }) => {
    setToken(data.token);
    setUser(data.user);
    if (data.user?.isAdmin) {
        // If on main domain, redirect to dashboard subdomain if possible, else use /app
        if (!hostname.startsWith('dashboard.')) {
            window.location.href = `${window.location.protocol}//dashboard.${hostname.replace('www.', '')}/app/dashboard`;
        } else {
            navigate('/app/dashboard');
        }
    } else {
        navigate('/dashboard');
    }
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    navigate('/'); 
  };

  const isMaintenance = siteSettings?.isMaintenanceMode && !user?.isAdmin;

  // --- SUBDOMAIN DASHBOARD ROUTING ---
  if (isDashboardSubdomain) {
      return (
          <Suspense fallback={<LoadingSpinner />}>
              <Routes>
                  {/* Redirect root of dashboard to /app/dashboard */}
                  <Route path="/" element={<Navigate to="/app/dashboard" replace />} />
                  <Route path="/app/*" element={user?.isAdmin ? <AdminDashboardPage user={user} logout={handleLogout} /> : <Navigate to="/login" />} />
                  <Route path="/login" element={<LoginPage onAuthSuccess={handleAuthSuccess} />} />
                  <Route path="*" element={<Navigate to="/app/dashboard" replace />} />
              </Routes>
          </Suspense>
      );
  }

  // --- MAIN STORE ROUTING ---
  return (
    <div className="min-h-screen bg-gray-50">
      <Suspense fallback={<LoadingSpinner />}>
        {isMaintenance ? (
           <Routes>
              <Route path="/login" element={<LoginPage onAuthSuccess={handleAuthSuccess} />} />
              <Route path="*" element={<MaintenancePage />} />
           </Routes>
        ) : (
          <Routes>
            <Route path="/" element={<HomePage user={user} logout={handleLogout} />} />
            <Route path="/login" element={!user ? <LoginPage onAuthSuccess={handleAuthSuccess} /> : <Navigate to="/" />} />
            <Route path="/register" element={!user ? <RegisterPage onAuthSuccess={handleAuthSuccess} /> : <Navigate to="/" />} />
            <Route path="/dashboard" element={user ? <UserDashboardPage user={user} logout={handleLogout} /> : <Navigate to="/login" />} />
            <Route path="/product/:slug" element={<ProductDetailsPage user={user} logout={handleLogout} />} />
            <Route path="/collections/:id" element={<CollectionPage user={user} logout={handleLogout} />} />
            <Route path="/pages/:slug" element={<DynamicPage user={user} logout={handleLogout} />} />
            <Route path="/cart" element={<CartPage user={user} logout={handleLogout} />} />
            <Route path="/wishlist" element={<WishlistPage user={user} logout={handleLogout} />} />
            <Route path="/checkout" element={<CheckoutPage user={user} logout={handleLogout} />} />
            <Route path="/contact" element={<ContactPage user={user} logout={handleLogout} />} />
            <Route path="/track-order" element={<OrderTrackingPage user={user} logout={handleLogout} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        )}
      </Suspense>
      
      {!user?.isAdmin && !isMaintenance && (
        <>
          <SmartPopup />
          <WhatsAppWidget />
        </>
      )}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <HelmetProvider>
      <CartProvider>
        <WishlistProvider>
          <SiteDataProvider>
            <ToastProvider>
                <Router>
                  <ErrorBoundary>
                    <AppContent />
                  </ErrorBoundary>
                </Router>
            </ToastProvider>
          </SiteDataProvider>
        </WishlistProvider>
      </CartProvider>
    </HelmetProvider>
  );
};

export default App;
