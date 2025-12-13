
import React, { useState, useEffect, Suspense, lazy, useRef } from 'react';
import * as ReactRouterDom from 'react-router-dom';
// FIX: Property 'as' does not exist on type 'typeof import(...)'. This indicates an issue with aliasing during destructuring from a namespace import.
// This also caused a downstream error where `Router` was incorrectly typed, expecting props like `location` and `navigator`.
// We will separate the alias assignment to ensure `Router` correctly points to `BrowserRouter`.
const { Routes, Route, Navigate, useLocation, useNavigate } = ReactRouterDom;
const Router = ReactRouterDom.BrowserRouter;
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
const ContactPage = lazy(() => import('./pages/ContactPage'));
const OrderTrackingPage = lazy(() => import('./pages/OrderTrackingPage'));

// --- Loading Spinner for Suspense Fallback ---
const LoadingSpinner: React.FC = () => (
    <div className="flex justify-center items-center h-screen w-screen bg-gray-50">
        <div className="animate-spin rounded-full h-24 w-24 border-t-2 border-b-2 border-rose-600"></div>
    </div>
);

// --- Master Tracking Component for Meta Pixel & CAPI ---
const MasterTracker: React.FC = () => {
    const location = useLocation();
    const { siteSettings, loading: siteDataLoading } = useSiteData();
    const warningLogged = useRef(false);

    useEffect(() => {
        // Don't do anything until site settings (with Pixel ID) are loaded.
        if (siteDataLoading) {
            return;
        }

        // 1. Initialize Pixel if it hasn't been initialized and we have a valid ID.
        if (!(window as any)._pixelInitialized) {
            if (siteSettings?.metaPixelId) {
                initFacebookPixel(siteSettings.metaPixelId);
                (window as any)._pixelInitialized = true; // Mark as initialized
            } else if (!warningLogged.current) {
                // Log the warning only once to avoid console spam on every navigation.
                console.warn("M-Tracker: Meta Pixel ID not found in site settings. Pixel not initialized.");
                warningLogged.current = true;
            }
        }
        
        // 2. If the pixel is ready, track the PageView for the current location.
        // This will fire for the initial load and all subsequent route changes.
        if ((window as any)._pixelInitialized) {
            masterTracker('PageView');
        }

    }, [location, siteSettings, siteDataLoading]); // Re-run on location change or when settings finish loading.

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
            <Route path="/contact" element={<ContactPage user={user} logout={handleLogout} />} />
            {/* New Tracking Route */}
            <Route path="/track-order" element={<OrderTrackingPage user={user} logout={handleLogout} />} />
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
