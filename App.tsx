


import React, { useState, useEffect, Suspense, lazy, useRef } from 'react';
// Fix: Use namespace import and cast to any to resolve "no exported member" errors in this environment
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

// --- Lazy Load Pages ---
const HomePage = lazy(() => import('./pages/HomePage'));
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const UserDashboardPage = lazy(() => import('./pages/UserDashboardPage'));
const ProductDetailsPage = lazy(() => import('./pages/ProductDetailsPage'));
const CartPage = lazy(() => import('./pages/CartPage'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
// Fix: Explicitly type DynamicPage to ensure it accepts the expected props when used in Route element, resolving property access errors on IntrinsicAttributes
const DynamicPage: React.ComponentType<{ user: any; logout: () => void }> = lazy(() => import('./pages/DynamicPage'));
const CollectionPage = lazy(() => import('./pages/CollectionPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const OrderTrackingPage = lazy(() => import('./pages/OrderTrackingPage'));
const WishlistPage = lazy(() => import('./pages/WishlistPage'));

const LoadingSpinner: React.FC = () => (
    <div className="flex justify-center items-center h-screen w-screen bg-gray-50">
        <div className="animate-spin rounded-full h-24 w-24 border-t-2 border-b-2 border-rose-600"></div>
    </div>
);

const MasterTracker: React.FC = () => {
    const location = useLocation();
    const { siteSettings, loading: siteDataLoading } = useSiteData();
    const warningLogged = useRef(false);

    useEffect(() => {
        if (siteDataLoading) return;
        if (!(window as any)._pixelInitialized) {
            if (siteSettings?.metaPixelId) {
                initFacebookPixel(siteSettings.metaPixelId);
                (window as any)._pixelInitialized = true;
            } else if (!warningLogged.current) {
                console.warn("M-Tracker: Meta Pixel ID not found in site settings.");
                warningLogged.current = true;
            }
        }
        if ((window as any)._pixelInitialized) {
            masterTracker('PageView');
        }
    }, [location, siteSettings, siteDataLoading]);

    return null;
};

const AppContent: React.FC = () => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [user, setUser] = useState<any>(JSON.parse(localStorage.getItem('user') || 'null'));
  const { siteSettings } = useSiteData();
  const navigate = useNavigate();

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
    if (data.user?.isAdmin) navigate('/admin');
    else navigate('/dashboard');
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    navigate('/'); 
  };

  // --- Maintenance Mode Logic ---
  const isMaintenance = siteSettings?.isMaintenanceMode && !user?.isAdmin;

  return (
    <>
      <MasterTracker />
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
              <Route path="/admin/*" element={user?.isAdmin ? <AdminDashboardPage user={user} logout={handleLogout} /> : <Navigate to="/" />} />
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
    </>
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
