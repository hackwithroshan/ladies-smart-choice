
import React, { useEffect, useState } from 'react';
import * as ReactRouterDom from 'react-router-dom';
const { useSearchParams, useNavigate } = ReactRouterDom as any;
import { CheckCircle2, Loader2, ArrowRight } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { getApiUrl } from '../utils/apiHelper';
import { useSiteData } from '../contexts/SiteDataContext';

interface ThankYouPageProps {
  user: any;
  logout: () => void;
  onAuthSuccess: (data: { token: string; user: any }) => void;
}

const ThankYouPage: React.FC<ThankYouPageProps> = ({ user, logout, onAuthSuccess }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { siteSettings } = useSiteData();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
  const email = searchParams.get('email');
  const phone = searchParams.get('phone');
  const orderId = searchParams.get('orderId');

  const BrandName = siteSettings?.storeName || "Ladies Smart Choice";

  useEffect(() => {
    // Automatic Login Logic
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
            // Small delay for UX so they can read the page
            setTimeout(() => {
              onAuthSuccess(data);
            }, 3000);
          }
        } catch (err) {
          console.error("Auto-login failed", err);
        } finally {
          // We don't set logging in to false here to keep the loader visible until redirect
        }
      }
    };

    autoLogin();
  }, [email, phone, user, onAuthSuccess]);

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      <Header user={user} logout={logout} />
      
      <main className="flex-grow container mx-auto px-4 py-20 flex flex-col items-center">
        <div className="w-full max-w-2xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-100 rounded-full mb-4">
              <CheckCircle2 className="w-10 h-10 text-emerald-600" />
            </div>
            <h1 className="text-4xl font-black italic uppercase tracking-tighter text-zinc-900">Order Successful!</h1>
            <p className="text-zinc-500 font-medium">Thank you for choosing {BrandName}. Your journey to wellness starts now.</p>
          </div>

          <Card className="border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-white">
            <CardHeader className="bg-zinc-900 text-white p-8 text-center">
              <CardTitle className="text-xl font-black uppercase italic tracking-widest">Account Access Details</CardTitle>
              <CardDescription className="text-zinc-400 font-bold uppercase text-[10px] tracking-widest">We have created an account for your future orders</CardDescription>
            </CardHeader>
            <CardContent className="p-10 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 bg-zinc-50 rounded-2xl border border-zinc-100 space-y-2">
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Username / Email ID</p>
                  <p className="text-sm font-black text-zinc-900">{email || 'Your provided email'}</p>
                </div>
                <div className="p-6 bg-zinc-50 rounded-2xl border border-zinc-100 space-y-2">
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Your Password</p>
                  <p className="text-sm font-black text-zinc-900">{phone || 'Your mobile number'}</p>
                </div>
              </div>

              <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-2xl flex items-start gap-4">
                <div className="p-2 bg-emerald-500 rounded-lg text-white">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-black text-emerald-900 uppercase">Automatic Authentication Active</p>
                  <p className="text-[11px] text-emerald-700 leading-relaxed font-medium">
                    Please wait while we securely log you into your dashboard at {BrandName}. You can use your <strong>Phone Number</strong> as your password for future logins.
                  </p>
                </div>
              </div>

              <div className="pt-6 border-t border-zinc-100 flex flex-col items-center gap-4">
                {isLoggingIn ? (
                  <div className="flex items-center gap-3 text-[#16423C] font-black uppercase text-[11px] tracking-widest">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Synchronizing Dashboard...
                  </div>
                ) : (
                  <Button 
                    onClick={() => navigate('/dashboard')}
                    className="w-full h-14 bg-[#16423C] text-white rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-xl group"
                  >
                    Go to Dashboard <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
          
          <p className="text-center text-[10px] text-zinc-400 font-bold uppercase tracking-[0.3em]">Order ID: #{orderId?.substring(0, 8) || 'N/A'}</p>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ThankYouPage;
