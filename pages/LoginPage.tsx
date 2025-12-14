
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { COLORS } from '../constants';
import { TailGridsLogo } from '../components/Icons';
import { handleApiError, getFriendlyErrorMessage } from '../utils/errorHandler';
import ErrorMessage from '../components/ErrorMessage';
import { getApiUrl } from '../utils/apiHelper';

interface LoginProps {
  onAuthSuccess: (data: { token: string; user: any }) => void;
}

const LoginPage: React.FC<LoginProps> = ({ onAuthSuccess }) => {
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
      onAuthSuccess(data); // Let the parent component handle state and navigation

    } catch (err: any) {
      console.error("Login failed. Full error object:", err);
      const apiError = await handleApiError(err);
      console.error("Parsed API Error:", apiError);
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
          
          if (!res.ok) {
              throw res;
          }
          
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
      setOtpSentMessage('');

      try {
          const res = await fetch(getApiUrl('/api/auth/reset-password'), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: forgotEmail, otp, newPassword })
          });

          if (!res.ok) {
              throw res;
          }

          setForgotMessage('Password reset successfully! You can now login.');
          setTimeout(() => {
              setIsForgotModalOpen(false);
              setForgotStep(1);
              setForgotEmail('');
              setOtp('');
              setNewPassword('');
              setForgotMessage('');
              setOtpSentMessage('');
          }, 3000);
      } catch (err: any) {
          const apiError = await handleApiError(err);
          setForgotError(getFriendlyErrorMessage(apiError));
      } finally {
          setForgotLoading(false);
      }
  };

  const closeForgotModal = () => {
    setIsForgotModalOpen(false);
    // Add a delay to allow the closing animation to finish before resetting state
    setTimeout(() => {
        setForgotStep(1);
        setForgotEmail('');
        setOtp('');
        setNewPassword('');
        setForgotMessage('');
        setOtpSentMessage('');
        setForgotError(null);
    }, 300);
  };

  return (
    <div className="min-h-screen flex bg-white">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gray-900">
        <img 
          src="https://images.unsplash.com/photo-1618932260643-030a8327707c?q=80&w=1920&auto=format&fit=crop" 
          alt="Elegant Fashion" 
          className="absolute inset-0 w-full h-full object-cover opacity-70 transform hover:scale-105 transition-transform duration-1000"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-rose-900/10 to-transparent"></div>
        <div className="relative z-10 flex flex-col justify-end p-16 text-white h-full">
           <div className="mb-8">
             <h2 className="text-4xl font-bold font-serif mb-4 tracking-tight">Welcome Back</h2>
             <p className="text-lg text-rose-100 max-w-md leading-relaxed">
               Sign in to access your dashboard, manage your orders, and continue your shopping journey with exclusive perks.
             </p>
           </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-24 bg-white">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
             <Link to="/" className="inline-block">
               <TailGridsLogo />
             </Link>
             <h2 className="mt-6 text-3xl font-bold text-gray-900 font-serif tracking-tight">Sign in to your account</h2>
             <p className="mt-2 text-sm text-gray-500">
               Or{' '}
               <Link to="/register" className="font-medium text-rose-600 hover:text-rose-700">
                 create a new account
               </Link>
             </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-xs font-medium text-gray-700 uppercase tracking-wide mb-1">Email Address</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all"
                  placeholder="jane@example.com"
                />
              </div>

              <div>
                <div className="flex items-center justify-between">
                    <label htmlFor="password"className="block text-xs font-medium text-gray-700 uppercase tracking-wide mb-1">Password</label>
                    <button 
                        type="button"
                        onClick={() => { setIsForgotModalOpen(true); setForgotError(null); }}
                        className="text-xs text-rose-600 hover:text-rose-700 font-medium hover:underline focus:outline-none"
                    >
                        Forgot your password?
                    </button>
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all"
                  placeholder="Enter your password"
                />
              </div>
            </div>

            <ErrorMessage message={error} onClose={() => setError(null)} />

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-lg shadow-lg text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all transform hover:-translate-y-0.5"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
           <div className="text-center mt-6">
              <Link to="/" className="text-sm text-gray-500 hover:text-rose-600 transition-colors">
                &larr; Back to Store
              </Link>
            </div>
        </div>
      </div>
       {isForgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4 animate-fade-in">
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
                      <p className="text-sm text-gray-500 text-center">Enter your email to receive a password reset OTP.</p>
                      <div>
                        <input type="email" required placeholder="Your email address" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg"/>
                      </div>
                      <ErrorMessage message={forgotError} onClose={() => setForgotError(null)} />
                      <button type="submit" disabled={forgotLoading} className="w-full bg-rose-600 text-white p-3 rounded-lg font-bold hover:bg-rose-700 disabled:opacity-50">
                        {forgotLoading ? 'Sending...' : 'Send OTP'}
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={handleResetPassword} className="space-y-4">
                       <p className="text-sm text-gray-500 text-center">Enter the OTP from your email and create a new password.</p>
                       <div>
                         <label className="text-xs font-medium text-gray-600">OTP Code</label>
                         <input type="text" required placeholder="Enter 6-digit OTP" value={otp} onChange={e => setOtp(e.target.value)} className="mt-1 w-full p-3 border border-gray-300 rounded-lg"/>
                       </div>
                       <div>
                         <label className="text-xs font-medium text-gray-600">New Password</label>
                         <input type="password" required placeholder="Enter new password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="mt-1 w-full p-3 border border-gray-300 rounded-lg"/>
                       </div>
                       <ErrorMessage message={forgotError} onClose={() => setForgotError(null)} />
                       <button type="submit" disabled={forgotLoading} className="w-full bg-rose-600 text-white p-3 rounded-lg font-bold hover:bg-rose-700 disabled:opacity-50">
                        {forgotLoading ? 'Resetting...' : 'Reset Password'}
                      </button>
                    </form>
                  )}
                </>
              )}
            </div>
            <div className="bg-gray-50 p-4 text-center border-t">
                 <button onClick={closeForgotModal} className="text-sm text-gray-600 hover:underline">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginPage;
