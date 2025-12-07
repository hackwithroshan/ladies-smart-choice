

import React, { useState, useEffect, Suspense, lazy } from 'react';
import * as ReactRouterDom from 'react-router-dom';
const { BrowserRouter: Router, Routes, Route, Navigate, useLocation, useNavigate } = ReactRouterDom;
import { HelmetProvider } from 'react-helmet-async';
import { CartProvider } from './contexts/CartContext';
import { SiteDataProvider, useSiteData } from './contexts/SiteDataContext';
import { initFacebookPixel } from './utils/metaPixel';
import { masterTracker } from './utils/tracking';
import { getApiUrl } from './utils/apiHelper';
import ErrorBoundary from './components/ErrorBoundary';

// --- Lazy Load Pages for Code Splitting & Performance ---
const HomePage = lazy(() => import('./pages/HomePage'));
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const UserDashboardPage = lazy(() => import('./pages/UserDashboardPage'));
const ProductDetailsPage = lazy(() => import('./pages/ProductDetailsPage'));
const CartPage = lazy(() => import('./pages/CartPage'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const DynamicPage = lazy(() => import('./pages/DynamicPage'));
const CollectionPage = lazy(() => import('./pages/CollectionPage'));

// --- Loading Spinner for Suspense Fallback ---
const LoadingSpinner: React.FC = () => (
    <div className="flex justify-center items-center h-screen w-screen bg-gray-50">
        <div className="animate-spin rounded-full h-24 w-24 border-t-2 border-b-2 border-rose-600"></div>
    </div>
);

// --- Master Tracking Component for Meta Pixel & CAPI ---
const MasterTracker: React.FC = () => {
    const location = useLocation();
    const initialLoad = React.useRef(true);
    const { siteSettings, loading: siteDataLoading } = useSiteData();

    // 1. Initialize Pixel exactly once when siteSettings are loaded from the context
    useEffect(() => {
        // Prevent initialization if it's already done, or if the main site data is still loading
        if ((window as any)._pixelInitialized || siteDataLoading) {
            return;
        }

        if (siteSettings && siteSettings.metaPixelId) {
            (window as any)._pixelInitialized = true;
            initFacebookPixel(siteSettings.metaPixelId);
        } else {
            // This is now the single source of truth for the pixel ID warning.
            console.warn("M-Tracker: Meta Pixel ID not found in site settings from the database. Pixel not initialized.");
        }
    }, [siteSettings, siteDataLoading]); // Depend on settings and loading state from the main context

    // 2. Track subsequent PageView events on route changes
    useEffect(() => {
        // On initial load, the initFacebookPixel function handles the first PageView.
        // This effect only tracks navigation changes after the initial load.
        if (initialLoad.current) {
            initialLoad.current = false;
            return;
        }

        // Use the master tracker for all subsequent page views
        masterTracker('PageView');

    }, [location]);

    return null;
};

// This new component contains all the logic and routes, allowing it to use the `useNavigate` hook.
const AppContent: React.FC = () => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [user, setUser] = useState<any>(JSON.parse(localStorage.getItem('user') || 'null'));
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
    
    if (data.user?.isAdmin) {
      navigate('/admin');
    } else {
      navigate('/dashboard');
    }
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    navigate('/'); 
  };

  return (
    <>
      <MasterTracker />
      <div className="min-h-screen bg-gray-50">
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            <Route path="/" element={<HomePage user={user} logout={handleLogout} />} />
            <Route 
              path="/login" 
              element={!user ? <LoginPage onAuthSuccess={handleAuthSuccess} /> : <Navigate to="/" />} 
            />
            <Route 
              path="/register" 
              element={!user ? <RegisterPage onAuthSuccess={handleAuthSuccess} /> : <Navigate to="/" />} 
            />
            <Route 
              path="/admin/*" 
              element={user?.isAdmin ? <AdminDashboardPage user={user} logout={handleLogout} /> : <Navigate to="/" />} 
            />
            <Route 
              path="/dashboard" 
              element={user ? <UserDashboardPage user={user} logout={handleLogout} /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/product/:slug" 
              element={<ProductDetailsPage user={user} logout={handleLogout} />} 
            />
            <Route 
              path="/collections/:id" 
              element={<CollectionPage user={user} logout={handleLogout} />} 
            />
            <Route path="/pages/:slug" element={<DynamicPage user={user} logout={handleLogout} />} />
            <Route path="/cart" element={<CartPage user={user} logout={handleLogout} />} />
            <Route 
              path="/checkout" 
              element={<CheckoutPage user={user} logout={handleLogout} />} 
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </div>
    </>
  );
};


const App: React.FC = () => {
  return (
    <HelmetProvider>
      <CartProvider>
        <SiteDataProvider>
          <Router>
            <ErrorBoundary>
              <AppContent />
            </ErrorBoundary>
          </Router>
        </SiteDataProvider>
      </CartProvider>
    </HelmetProvider>
  );
};

export default App;