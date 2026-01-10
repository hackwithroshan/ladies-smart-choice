
import React, { useEffect, useState, useRef } from 'react';
import * as ReactRouterDom from 'react-router-dom';
const { useSearchParams, useNavigate } = ReactRouterDom as any;
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { getApiUrl } from '../utils/apiHelper';
import { useSiteData } from '../contexts/SiteDataContext';
import { NavArrowIcon, Activity } from '../components/Icons';
import { masterTracker } from '../utils/tracking';

const ThankYouPage: React.FC<{ user: any; logout: () => void; onAuthSuccess: (data: any) => void }> = ({ user, logout, onAuthSuccess }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { siteSettings } = useSiteData();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const hasTracked = useRef(false);
  
  const email = searchParams.get('email');
  const phone = searchParams.get('phone');
  const orderId = searchParams.get('orderId');

  useEffect(() => {
    if (!hasTracked.current && orderId) {
        masterTracker('Purchase', {
            content_name: 'Store Purchase',
            content_ids: [String(orderId)],
            value: 0,
            currency: 'INR'
        });
        hasTracked.current = true;
    }

    const autoLogin = async () => {
      if (email && phone && !user) {
        setIsLoggingIn(true);
        try {
          const response = await fetch(getApiUrl('auth/login'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password: phone }),
          });
          if (response.ok) {
            const data = await response.json();
            setTimeout(() => onAuthSuccess(data), 2000);
          }
        } catch (err) { console.error(err); } 
        finally { setIsLoggingIn(false); }
      }
    };
    autoLogin();
  }, [email, phone, user, onAuthSuccess, orderId]);

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      <Header user={user} logout={logout} />
      <main className="flex-grow container mx-auto px-4 py-20 flex flex-col items-center">
        <div className="w-full max-w-2xl space-y-8 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-100 rounded-full mb-4">
             <svg className="w-10 h-10 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path d="M5 13l4 4L19 7" /></svg>
          </div>
          <h1 className="text-4xl font-black italic uppercase tracking-tighter">Order Success!</h1>
          <Card className="border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-white text-left">
            <CardHeader className="bg-zinc-900 text-white p-8 text-center">
              <CardTitle className="text-xl font-black uppercase italic">Dashboard Access</CardTitle>
            </CardHeader>
            <CardContent className="p-10 space-y-6">
              <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-2xl flex items-start gap-4">
                <Activity className="w-5 h-5 text-emerald-600 mt-1" />
                <p className="text-xs text-emerald-700 font-bold leading-relaxed">
                  {isLoggingIn ? "Synchronizing your profile..." : "Order details sent to your email. You can use your phone number as a password to login later."}
                </p>
              </div>
              <Button onClick={() => navigate('/dashboard')} className="w-full h-14 bg-zinc-900 rounded-2xl font-black uppercase text-[11px] tracking-widest">
                Go to Dashboard <NavArrowIcon className="ml-2 w-4 h-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ThankYouPage;
