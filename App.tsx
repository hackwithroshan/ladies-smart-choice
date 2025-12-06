

import React, { useState, useEffect, Suspense, lazy } from 'react';
// FIX: The `react-router-dom` module is not resolving named exports correctly in this environment.
// Switching to a namespace import (`import * as ...`) and then destructuring is a more robust way to access the exports.
import * as ReactRouterDom from 'react-router-dom';
// FIX: The alias syntax for object destructuring is a colon `:`, not `as`. This resolves the parsing error.
const { BrowserRouter: Router, Routes, Route, Navigate, useLocation, useNavigate } = ReactRouterDom;
import { HelmetProvider } from 'react-helmet-async';
import { CartProvider } from './contexts/CartContext';
import { SiteDataProvider } from './contexts/SiteDataContext';
import { initFacebookPixel, trackEvent } from './utils/metaPixel';
import { trackUserEvent } from './utils/analytics';
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


// --- Custom Analytics Tracker ---
const AnalyticsTracker: React.FC = () => {
    const location = useLocation();
    // Using a ref to track if this is the initial load for this component instance
    const initialLoad = React.useRef(true);

    useEffect(() => {
        // We only want to track 'pageview' on subsequent navigations, not on the initial load,
        // because the PixelTracker's init function already handles the first PageView.
        if (initialLoad.current) {
            initialLoad.current = false;
            return;
        }
        trackUserEvent('pageview');
    }, [location]);
    
    return null;
};

// Component to handle Pixel initialization and route changes
const PixelTracker: React.FC = () => {
  const location = useLocation();

  // FIX: Use a global flag to ensure the Pixel initialization logic runs EXACTLY ONCE
  // per page load, regardless of any potential React re-renders or component remounts.
  // This is more robust than relying on React state for a one-time global setup.
  if (!(window as any)._pixelInitialized) {
    (window as any)._pixelInitialized = true; // Set the flag immediately
    
    fetch(getApiUrl('/api/settings/site'))
      .then(res => res.json())
      .then(settings => {
        if (settings && settings.facebookPixelId) {
          initFacebookPixel(settings.facebookPixelId);
        } else {
          console.warn(" M-Pixel: No Facebook Pixel ID found in site settings.");
        }
      })
      .catch(err => console.error(" M-Pixel: Failed to fetch Pixel ID from settings:", err));
  }

  // This effect will now only handle subsequent page views after the initial setup.
  useEffect(() => {
    // Check if the fbq object is available (it might be blocked by an ad blocker)
    if (window.fbq) {
      trackEvent('PageView');
    }
  }, [location]); // Dependency on location is correct for tracking navigation changes.

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

  // Centralized authentication success handler to fix login redirect bug
  const handleAuthSuccess = (data: { token: string; user: any }) => {
    setToken(data.token);
    setUser(data.user);
    
    // This is the fix: Navigate programmatically from the component that owns the state and router context.
    if (data.user?.isAdmin) {
      navigate('/admin');
    } else {
      navigate('/dashboard');
    }
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    // Use navigate for a smoother SPA experience instead of a hard refresh.
    navigate('/'); 
  };

  return (
    <>
      <PixelTracker />
      <AnalyticsTracker />
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