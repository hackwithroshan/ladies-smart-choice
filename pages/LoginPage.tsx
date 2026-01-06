
import React, { useState } from 'react';
import * as ReactRouterDom from 'react-router-dom';
const { Link } = ReactRouterDom as any;
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

  const BrandName = siteSettings?.storeName || "Ayushree";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch(getApiUrl('/api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) throw response;
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
      try {
          const res = await fetch(getApiUrl('/api/auth/forgot-password'), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: forgotEmail }) 
          });
          if (!res.ok) throw res;
          setForgotStep(2);
          setOtpSentMessage(`An OTP has been sent to ${forgotEmail}.`);
      } catch (err: any) {
          const apiError = await handleApiError(err);
          setForgotError(getFriendlyErrorMessage(apiError));
      } finally {
          setForgotLoading(false);
      }
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-6">
      <Link to="/" className="flex items-center gap-2 mb-10">
          <div className="h-9 w-9 bg-zinc-900 rounded-lg flex items-center justify-center text-zinc-50 font-black text-xl italic">A</div>
          <span className="text-xl font-black tracking-tighter uppercase text-zinc-900">{BrandName}</span>
      </Link>

      <div className="w-full max-w-[400px] space-y-6">
          <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-8 space-y-6">
              <div className="space-y-1 text-center">
                  <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
                  <p className="text-sm text-zinc-500">Sign in to access your account</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Email Address</label>
                      <input 
                        type="email" 
                        required 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)} 
                        className="flex h-10 w-full rounded-md border border-zinc-200 bg-transparent px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-950" 
                        placeholder="name@example.com" 
                      />
                  </div>
                  <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Password</label>
                          <button type="button" onClick={() => setIsForgotModalOpen(true)} className="text-xs text-zinc-500 hover:text-zinc-900 underline underline-offset-4">Forgot?</button>
                      </div>
                      <input 
                        type="password" 
                        required 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        className="flex h-10 w-full rounded-md border border-zinc-200 bg-transparent px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-950" 
                        placeholder="••••••••" 
                      />
                  </div>

                  <ErrorMessage message={error} />

                  <button 
                    type="submit" 
                    disabled={loading} 
                    className="w-full h-10 inline-flex items-center justify-center rounded-md bg-zinc-900 px-8 text-sm font-bold text-zinc-50 shadow transition-colors hover:bg-zinc-900/90 disabled:opacity-50"
                  >
                    {loading ? 'Authenticating...' : 'Sign In'}
                  </button>
              </form>
          </div>

          <p className="text-center text-sm text-zinc-500">
              Don't have an account?{' '}
              <Link to="/register" className="font-bold text-zinc-900 hover:underline underline-offset-4">Create one</Link>
          </p>
      </div>

      {isForgotModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/20 backdrop-blur-sm p-4">
              <div className="bg-white rounded-xl shadow-xl border border-zinc-200 w-full max-w-[400px] overflow-hidden">
                  <div className="p-8 space-y-6">
                      <div className="space-y-1">
                          <h3 className="text-xl font-bold tracking-tight">Reset Password</h3>
                          <p className="text-xs text-zinc-500">We'll send a code to your email if it exists.</p>
                      </div>

                      {forgotMessage ? (
                          <div className="bg-zinc-50 border border-zinc-200 p-4 rounded-md text-sm text-center text-zinc-900 font-medium">
                              {forgotMessage}
                          </div>
                      ) : (
                          <form onSubmit={forgotStep === 1 ? handleSendOtp : handleSendOtp} className="space-y-4">
                              {forgotStep === 1 ? (
                                  <input type="email" required placeholder="name@example.com" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} className="flex h-10 w-full rounded-md border border-zinc-200 bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-zinc-950" />
                              ) : (
                                  <div className="space-y-3">
                                      <input type="text" required placeholder="6-digit Code" value={otp} onChange={e => setOtp(e.target.value)} className="flex h-10 w-full rounded-md border border-zinc-200 bg-transparent px-3 py-2 text-sm shadow-sm" />
                                      <input type="password" required placeholder="New Password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="flex h-10 w-full rounded-md border border-zinc-200 bg-transparent px-3 py-2 text-sm shadow-sm" />
                                  </div>
                              )}
                              <ErrorMessage message={forgotError} />
                              <button type="submit" disabled={forgotLoading} className="w-full h-10 bg-zinc-900 text-zinc-50 rounded-md font-bold text-sm hover:bg-zinc-900/90 disabled:opacity-50">
                                  {forgotLoading ? 'Processing...' : forgotStep === 1 ? 'Send OTP' : 'Update Password'}
                              </button>
                          </form>
                      )}
                  </div>
                  <div className="p-4 bg-zinc-50 border-t border-zinc-100 text-center">
                      <button onClick={() => setIsForgotModalOpen(false)} className="text-xs font-bold text-zinc-500 hover:text-zinc-900">Cancel</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default LoginPage;
