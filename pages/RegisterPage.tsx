
import React, { useState } from 'react';
import * as ReactRouterDom from 'react-router-dom';
const { Link } = ReactRouterDom as any;
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

  const BrandName = siteSettings?.storeName || "Ayushree";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch(getApiUrl('/api/auth/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
    <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-6">
      <Link to="/" className="flex items-center gap-2 mb-10">
          <div className="h-9 w-9 bg-zinc-900 rounded-lg flex items-center justify-center text-zinc-50 font-black text-xl italic">A</div>
          <span className="text-xl font-black tracking-tighter uppercase text-zinc-900">{BrandName}</span>
      </Link>

      <div className="w-full max-w-[400px] space-y-6">
          <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-8 space-y-6">
              <div className="space-y-1 text-center">
                  <h1 className="text-2xl font-bold tracking-tight">Create an account</h1>
                  <p className="text-sm text-zinc-500">Join our wellness community today</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Full Name</label>
                      <input 
                        type="text" 
                        required 
                        value={name} 
                        onChange={(e) => setName(e.target.value)} 
                        className="flex h-10 w-full rounded-md border border-zinc-200 bg-transparent px-3 py-2 text-sm shadow-sm transition-colors focus:outline-none focus:ring-1 focus:ring-zinc-950" 
                        placeholder="Jane Doe" 
                      />
                  </div>
                  <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Email Address</label>
                      <input 
                        type="email" 
                        required 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)} 
                        className="flex h-10 w-full rounded-md border border-zinc-200 bg-transparent px-3 py-2 text-sm shadow-sm transition-colors focus:outline-none focus:ring-1 focus:ring-zinc-950" 
                        placeholder="name@example.com" 
                      />
                  </div>
                  <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Password</label>
                      <input 
                        type="password" 
                        required 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        className="flex h-10 w-full rounded-md border border-zinc-200 bg-transparent px-3 py-2 text-sm shadow-sm transition-colors focus:outline-none focus:ring-1 focus:ring-zinc-950" 
                        placeholder="••••••••" 
                      />
                  </div>

                  <ErrorMessage message={error} />

                  <button 
                    type="submit" 
                    disabled={loading} 
                    className="w-full h-10 inline-flex items-center justify-center rounded-md bg-zinc-900 px-8 text-sm font-bold text-zinc-50 shadow transition-colors hover:bg-zinc-900/90 disabled:opacity-50"
                  >
                    {loading ? 'Creating Account...' : 'Sign Up'}
                  </button>
              </form>
          </div>

          <p className="text-center text-sm text-zinc-500">
              Already have an account?{' '}
              <Link to="/login" className="font-bold text-zinc-900 hover:underline underline-offset-4">Sign In</Link>
          </p>
      </div>
    </div>
  );
};

export default RegisterPage;
