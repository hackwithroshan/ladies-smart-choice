
import React, { useState } from 'react';
// Fix: Use namespace import and cast to any to resolve "no exported member" errors
import * as ReactRouterDom from 'react-router-dom';
const { Link } = ReactRouterDom as any;
import { TailGridsLogo } from '../components/Icons';
import { handleApiError, getFriendlyErrorMessage } from '../utils/errorHandler';
import ErrorMessage from '../components/ErrorMessage';
import { getApiUrl } from '../utils/apiHelper';
import { useSiteData } from '../contexts/SiteDataContext';

interface LoginProps {
  onAuthSuccess: (data: { token: string; user: any }) => void;
}

const LoginPage: React.FC<LoginProps> = ({ onAuthSuccess }) => {
  const { siteSettings } = useSiteData();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState(1);
  const [forgotEmail, setForgotEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState('');
  const [otpSentMessage, setOtpSentMessage] = useState('');
  const [forgotError, setForgotError] = useState<string | null>(null);

  const BrandName = siteSettings?.storeName || "Ayushree Ayurveda";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch(getApiUrl('/api/auth/login'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw response;
      }
      
      const data = await response.json();
      onAuthSuccess(data); 

    } catch (err: any) {
      const apiError = await handleApiError(err);
      setError(getFriendlyErrorMessage(apiError));
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
      e.preventDefault();
      setForgotLoading(true);
      setForgotError(null);
      setOtpSentMessage('');

      try {
          const res = await fetch(getApiUrl('/api/auth/forgot-password'), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: forgotEmail }) 
          });
          
          if (!res.ok) throw res;
          
          setForgotStep(2);
          setOtpSentMessage(`An OTP has been sent to ${forgotEmail}. Please check your inbox.`);
      } catch (err: any) {
          const apiError = await handleApiError(err);
          setForgotError(getFriendlyErrorMessage(apiError));
      } finally {
          setForgotLoading(false);
      }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
      e.preventDefault();
      setForgotLoading(true);
      setForgotError(null);

      try {
          const res = await fetch(getApiUrl('/api/auth/reset-password'), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: forgotEmail, otp, newPassword })
          });

          if (!res.ok) throw res;

          setForgotMessage('Password reset successfully! You can now login.');
          setTimeout(() => {
              setIsForgotModalOpen(false);
              setForgotStep(1);
          }, 3000);
      } catch (err: any) {
          const apiError = await handleApiError(err);
          setForgotError(getFriendlyErrorMessage(apiError));
      } finally {
          setForgotLoading(false);
      }
  };

  return (
    <div className="min-h-screen flex bg-white">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-brand-primary">
        <img 
          src="https://images.unsplash.com/photo-1618932260643-030a8327707c?q=80&w=1920&auto=format&fit=crop" 
          alt="Brand Aesthetic" 
          className="absolute inset-0 w-full h-full object-cover opacity-60 transform hover:scale-105 transition-transform duration-1000"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-primary via-brand-primary/10 to-transparent"></div>
        <div className="relative z-10 flex flex-col justify-end p-16 text-white h-full">
           <div className="mb-8">
             <h2 className="text-4xl font-bold font-brand mb-4 tracking-tight">Welcome Back</h2>
             <p className="text-lg text-white/80 max-w-md leading-relaxed">
               Sign in to your {BrandName} account to track your orders and access exclusive wellness guides.
             </p>
           </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-24 bg-white">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
             <Link to="/" className="inline-block">
               {siteSettings?.logoUrl ? <img src={siteSettings.logoUrl} className="h-10" alt={BrandName}/> : <TailGridsLogo />}
             </Link>
             <h2 className="mt-6 text-3xl font-bold text-gray-900 font-brand tracking-tight">Sign in to your account</h2>
             <p className="mt-2 text-sm text-gray-500">
               Or{' '}
               <Link to="/register" className="font-medium text-brand-accent hover:text-brand-primary">
                 create a new account
               </Link>
             </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-medium text-gray-700 uppercase mb-1">Email Address</label>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-accent outline-none" placeholder="your@email.com" />
              </div>
              <div>
                <div className="flex items-center justify-between">
                    <label className="block text-xs font-medium text-gray-700 uppercase mb-1">Password</label>
                    <button type="button" onClick={() => setIsForgotModalOpen(true)} className="text-xs text-brand-accent hover:underline">Forgot password?</button>
                </div>
                <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-accent outline-none" placeholder="••••••••" />
              </div>
            </div>

            <ErrorMessage message={error} onClose={() => setError(null)} />

            <button type="submit" disabled={loading} className="w-full bg-brand-primary text-white py-3.5 rounded-lg font-bold shadow-lg hover:opacity-90 disabled:opacity-70 transition-all transform hover:-translate-y-0.5 uppercase tracking-widest text-xs">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
           <div className="text-center mt-6">
              <Link to="/" className="text-sm text-gray-500 hover:text-brand-primary transition-colors">
                &larr; Back to Store
              </Link>
            </div>
        </div>
      </div>

       {isForgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-8">
              <h3 className="text-xl font-bold text-center mb-2">Reset Password</h3>
              {forgotMessage ? (
                <div className="text-center py-4">
                    <p className="text-green-700 bg-green-50 p-4 rounded-lg border border-green-200">{forgotMessage}</p>
                </div>
              ) : (
                <>
                  {otpSentMessage && <p className="text-center text-sm text-green-700 bg-green-50 p-3 rounded-lg border border-green-200 mb-4">{otpSentMessage}</p>}
                  {forgotStep === 1 ? (
                    <form onSubmit={handleSendOtp} className="space-y-4">
                      <input type="email" required placeholder="Your email address" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} className="w-full p-3 border rounded-lg"/>
                      <ErrorMessage message={forgotError} onClose={() => setForgotError(null)} />
                      <button type="submit" disabled={forgotLoading} className="w-full bg-brand-primary text-white p-3 rounded-lg font-bold hover:opacity-90">Send OTP</button>
                    </form>
                  ) : (
                    <form onSubmit={handleResetPassword} className="space-y-4">
                       <input type="text" required placeholder="6-digit OTP" value={otp} onChange={e => setOtp(e.target.value)} className="w-full p-3 border rounded-lg"/>
                       <input type="password" required placeholder="New Password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full p-3 border rounded-lg"/>
                       <ErrorMessage message={forgotError} onClose={() => setForgotError(null)} />
                       <button type="submit" disabled={forgotLoading} className="w-full bg-brand-primary text-white p-3 rounded-lg font-bold hover:opacity-90">Reset Password</button>
                    </form>
                  )}
                </>
              )}
            </div>
            <div className="bg-gray-50 p-4 text-center border-t">
                 <button onClick={() => setIsForgotModalOpen(false)} className="text-sm text-gray-600 hover:underline">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginPage;
