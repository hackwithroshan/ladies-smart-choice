
import React, { useState } from 'react';
import * as ReactRouterDom from 'react-router-dom';
const { Link } = ReactRouterDom;
import { COLORS } from '../constants';
import { TailGridsLogo } from '../components/Icons';
import { handleApiError, getFriendlyErrorMessage } from '../utils/errorHandler';
import ErrorMessage from '../components/ErrorMessage';
import { getApiUrl } from '../utils/apiHelper';

interface RegisterProps {
  onAuthSuccess: (data: { token: string; user: any }) => void;
}

const RegisterPage: React.FC<RegisterProps> = ({ onAuthSuccess }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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

      if (!response.ok) {
        throw response;
      }
      
      const data = await response.json();
      onAuthSuccess(data); // Let the parent component handle state and navigation

    } catch (err: any) {
       console.error("Registration failed. Full error object:", err);
       const apiError = await handleApiError(err);
       console.error("Parsed API Error:", apiError);
       setError(getFriendlyErrorMessage(apiError));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-rose-900">
        <img 
          src="https://images.unsplash.com/photo-1496747611176-843222e1e57c?q=80&w=1920&auto=format&fit=crop" 
          alt="Fashion Community" 
          className="absolute inset-0 w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-rose-900/30 to-transparent"></div>
        <div className="relative z-10 flex flex-col justify-end p-16 text-white h-full">
           <div className="mb-8">
             <h2 className="text-4xl font-bold font-serif mb-4 tracking-tight">Join Our Community</h2>
             <p className="text-lg text-rose-100 max-w-md leading-relaxed">
               Sign up to unlock exclusive offers, early access to new arrivals, and a seamless shopping experience tailored just for you.
             </p>
           </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-24 bg-white">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
             <div className="lg:hidden flex justify-center mb-6">
               <TailGridsLogo />
             </div>
             <h2 className="text-3xl font-bold text-gray-900 font-serif tracking-tight">Create Account</h2>
             <p className="mt-2 text-sm text-gray-500">
               Start your fashion journey with Ladies Smart Choice.
             </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-5">
              <div>
                <label htmlFor="name" className="block text-xs font-medium text-gray-700 uppercase tracking-wide mb-1">Full Name</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all"
                  placeholder="Jane Doe"
                />
              </div>

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
                <label htmlFor="password"className="block text-xs font-medium text-gray-700 uppercase tracking-wide mb-1">Password</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all"
                  placeholder="Create a strong password"
                />
                <p className="mt-2 text-xs text-gray-400">Must be at least 6 characters.</p>
              </div>
            </div>

            <ErrorMessage message={error} onClose={() => setError(null)} />

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-lg shadow-lg text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all transform hover:-translate-y-0.5"
            >
              {loading ? 'Creating Account...' : 'Sign Up'}
            </button>
            
            <div className="text-center mt-6 space-y-2">
                <p className="text-sm text-gray-600">
                    Already have an account?{' '}
                    <Link to="/login" className="text-rose-600 hover:text-rose-700 font-bold hover:underline">
                        Sign in here
                    </Link>
                </p>
                <p>
                    <Link to="/" className="text-xs text-gray-500 hover:text-rose-600 transition-colors">
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
