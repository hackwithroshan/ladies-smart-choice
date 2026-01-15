
import React, { useState, useEffect, Suspense, lazy } from 'react';
import * as ReactRouterDom from 'react-router-dom';
const { BrowserRouter: Router, Routes, Route, Navigate, useLocation, useNavigate } = ReactRouterDom as any;
import { HelmetProvider } from 'react-helmet-async';
import { CartProvider } from './contexts/CartContext';
import { WishlistProvider } from './contexts/WishlistContext';
import { SiteDataProvider, useSiteData } from './contexts/SiteDataContext';
import { ToastProvider } from './contexts/ToastContext';
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
const ThankYouPage: React.ComponentType<{}> = lazy(() => import('./pages/ThankYouPage'));

const LoadingSpinner: React.FC = () => (
  <div className="flex justify-center items-center h-screen w-screen bg-white">
    <div className="animate-spin rounded-full h-10 w-10 border-4 border-zinc-200 border-t-zinc-900 border-solid"></div>
  </div>
);

const AppContent: React.FC = () => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [user, setUser] = useState<any>(JSON.parse(localStorage.getItem('user') || 'null'));
  const { siteSettings } = useSiteData();
  const navigate = useNavigate();
  const location = useLocation();

  // Analytics Tracking
  useEffect(() => {
    const trackPageView = async () => {
      // Don't track Admin Dashboard usage
      if (location.pathname.startsWith('/app')) return;

      try {
        // Manage Session
        let sessionId = sessionStorage.getItem('sessionId');
        if (!sessionId) {
          sessionId = crypto.randomUUID();
          sessionStorage.setItem('sessionId', sessionId);
        }

        // Parse UTM
        const params = new URLSearchParams(location.search);
        const utm = {
          source: params.get('utm_source'),
          medium: params.get('utm_medium'),
          campaign: params.get('utm_campaign')
        };

        const apiUrl = window.location.hostname === 'localhost' ? 'http://localhost:5000' : '';

        await fetch(`${apiUrl}/api/analytics/track`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventType: 'PageView',
            path: location.pathname,
            sessionId,
            referrer: document.referrer,
            utm
          })
        });
      } catch (e) {
        console.error("Tracking failed", e);
      }
    };

    // access siteSettings to check tracking enabled? assuming monitoring always ON for admin stats
    trackPageView();
  }, [location]);

  useEffect(() => {
    if (token && user) {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }, [token, user]);

  // Update Favicon & Title
  useEffect(() => {
    if (siteSettings?.faviconUrl) {
      const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement || document.createElement('link');
      link.type = 'image/x-icon';
      link.rel = 'shortcut icon';
      link.href = siteSettings.faviconUrl;
      document.getElementsByTagName('head')[0].appendChild(link);
    }
    if (siteSettings?.storeName) {
      document.title = siteSettings.storeName;
    }
  }, [siteSettings]);

  const handleAuthSuccess = (data: { token: string; user: any }) => {
    setToken(data.token);
    setUser(data.user);
    if (data.user?.isAdmin) navigate('/app/dashboard');
    else navigate('/dashboard');
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    navigate('/login');
  };

  if (siteSettings?.isMaintenanceMode && !user?.isAdmin) {
    return <MaintenancePage />;
  }

  return (
    <div className="min-h-screen selection:bg-zinc-900 selection:text-zinc-50">
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          {/* Public Storefront */}
          <Route path="/" element={<HomePage user={user} logout={handleLogout} />} />
          <Route path="/product/:slug" element={<ProductDetailsPage user={user} logout={handleLogout} />} />
          <Route path="/collections/:id" element={<CollectionPage user={user} logout={handleLogout} />} />
          <Route path="/pages/:slug" element={<DynamicPage user={user} logout={handleLogout} />} />
          <Route path="/cart" element={<CartPage user={user} logout={handleLogout} />} />
          <Route path="/wishlist" element={<WishlistPage user={user} logout={handleLogout} />} />
          <Route path="/checkout" element={<CheckoutPage user={user} logout={handleLogout} />} />
          <Route path="/contact" element={<ContactPage user={user} logout={handleLogout} />} />
          <Route path="/track-order" element={<OrderTrackingPage user={user} logout={handleLogout} />} />
          <Route path="/thank-you" element={<ThankYouPage />} />

          {/* Auth */}
          <Route path="/login" element={!user ? <LoginPage onAuthSuccess={handleAuthSuccess} /> : <Navigate to="/" />} />
          <Route path="/register" element={!user ? <RegisterPage onAuthSuccess={handleAuthSuccess} /> : <Navigate to="/" />} />

          {/* Private Dashboards */}
          <Route path="/dashboard" element={user ? <UserDashboardPage user={user} logout={handleLogout} /> : <Navigate to="/login" />} />
          <Route path="/app/*" element={user?.isAdmin ? <AdminDashboardPage user={user} logout={handleLogout} /> : <Navigate to="/login" />} />

          {/* Catch All */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      {!location.pathname.startsWith('/app') && <><SmartPopup /><WhatsAppWidget /></>}
    </div>
  );
};

const App: React.FC = () => (
  <HelmetProvider>
    <CartProvider>
      <WishlistProvider>
        <SiteDataProvider>
          <ToastProvider>
            <Router>
              <ErrorBoundary><AppContent /></ErrorBoundary>
            </Router>
          </ToastProvider>
        </SiteDataProvider>
      </WishlistProvider>
    </CartProvider>
  </HelmetProvider>
);

export default App;
