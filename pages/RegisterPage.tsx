
import React, { useState } from 'react';
// Fix: Use namespace import and cast to any to resolve "no exported member" errors
import * as ReactRouterDom from 'react-router-dom';
const { Link } = ReactRouterDom as any;
import { TailGridsLogo } from '../components/Icons';
import { handleApiError, getFriendlyErrorMessage } from '../utils/errorHandler';
import ErrorMessage from '../components/ErrorMessage';
import { getApiUrl } from '../utils/apiHelper';
import { useSiteData } from '../contexts/SiteDataContext';

interface RegisterProps {
  onAuthSuccess: (data: { token: string; user: any }) => void;
}

const RegisterPage: React.FC<RegisterProps> = ({ onAuthSuccess }) => {
  const { siteSettings } = useSiteData();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const BrandName = siteSettings?.storeName || "Ayushree Ayurveda";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch(getApiUrl('/api/auth/register'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
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

  return (
    <div className="min-h-screen flex bg-white">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-brand-primary">
        <img 
          src="https://images.unsplash.com/photo-1496747611176-843222e1e57c?q=80&w=1920&auto=format&fit=crop" 
          alt="Brand Community" 
          className="absolute inset-0 w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-primary via-brand-primary/30 to-transparent"></div>
        <div className="relative z-10 flex flex-col justify-end p-16 text-white h-full">
           <div className="mb-8">
             <h2 className="text-4xl font-bold font-brand mb-4 tracking-tight">Join Our Community</h2>
             <p className="text-lg text-white/80 max-w-md leading-relaxed">
               Start your journey with {BrandName}. Create an account to unlock early access to herbal launches and ethical wellness deals.
             </p>
           </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-24 bg-white">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
             <div className="lg:hidden flex justify-center mb-6">
                {siteSettings?.logoUrl ? <img src={siteSettings.logoUrl} className="h-10" alt={BrandName}/> : <TailGridsLogo />}
             </div>
             <h2 className="text-3xl font-bold text-gray-900 font-brand tracking-tight">Create Account</h2>
             <p className="mt-2 text-sm text-gray-500">
               Welcome to {BrandName}.
             </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-medium text-gray-700 uppercase mb-1">Full Name</label>
                <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-accent outline-none" placeholder="Jane Doe" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 uppercase mb-1">Email Address</label>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-accent outline-none" placeholder="your@email.com" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 uppercase mb-1">Password</label>
                <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-accent outline-none" placeholder="••••••••" />
              </div>
            </div>

            <ErrorMessage message={error} onClose={() => setError(null)} />

            <button type="submit" disabled={loading} className="w-full bg-brand-primary text-white py-3.5 rounded-lg font-bold shadow-lg hover:opacity-90 disabled:opacity-70 transition-all uppercase tracking-widest text-xs">
              {loading ? 'Creating Account...' : 'Sign Up'}
            </button>
            
            <div className="text-center mt-6 space-y-2">
                <p className="text-sm text-gray-600">
                    Already have an account?{' '}
                    <Link to="/login" className="text-brand-accent font-bold hover:underline">
                        Sign in here
                    </Link>
                </p>
                <p>
                    <Link to="/" className="text-xs text-gray-500 hover:text-brand-primary transition-colors">
                        &larr; Back to Store
                    </Link>
                </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
