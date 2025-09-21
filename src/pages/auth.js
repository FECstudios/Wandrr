import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { LoadingSpinner } from '../components/ProgressBar';
import { setStorageItem } from '../lib/clientStorage';

export default function AuthPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isLogin, setIsLogin] = useState(true); // true for login, false for signup
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup';

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 503) {
          throw new Error('Service is temporarily busy. Please try again in a moment.');
        }
        throw new Error(data.message || 'Something went wrong.');
      }

      if (isLogin) {
        setStorageItem('token', data.token);
        router.push('/'); // Redirect to home page
      } else {
        alert(data.message); // Show success message for signup
        setIsLogin(true); // Switch to login form after successful signup
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen wandrr-pattern flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <Head>
        <title>{isLogin ? 'Login' : 'Sign Up'} - Wandrr</title>
      </Head>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center mb-6">
          <div className="text-6xl floating mb-4">🌍</div>
          <h1 className="text-4xl font-bold text-white drop-shadow-lg mb-2">Wandrr</h1>
          <p className="text-white/90 drop-shadow">Discover cultures, one lesson at a time</p>
        </div>
        <h2 className="text-center text-2xl font-bold text-white drop-shadow-lg">
          {isLogin ? 'Welcome back, traveler!' : 'Start your cultural journey'}
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="glass-card py-8 px-6 shadow-2xl rounded-2xl">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white/90">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-4 py-3 border border-white/20 rounded-lg shadow-sm placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 bg-white/10 backdrop-blur text-white sm:text-sm"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white/90">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-4 py-3 border border-white/20 rounded-lg shadow-sm placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 bg-white/10 backdrop-blur text-white sm:text-sm"
                  placeholder="Enter your password"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-400/50 text-red-100 px-4 py-3 rounded-lg backdrop-blur">
                <p className="text-sm text-center">{error}</p>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isLoading || !email || !password}
                className="w-full flex justify-center py-3 px-4 border border-white/30 rounded-lg shadow-lg text-sm font-medium text-white bg-white/20 hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-transparent disabled:bg-white/10 disabled:cursor-not-allowed transition-all duration-200 backdrop-blur"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <LoadingSpinner size="sm" />
                    <span>{isLogin ? 'Signing in...' : 'Creating account...'}</span>
                  </div>
                ) : (
                  <span className="flex items-center space-x-2">
                    <span>{isLogin ? '🚀 Sign in' : '✨ Sign up'}</span>
                  </span>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/30" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-transparent text-white/80">
                  Or
                </span>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={() => setIsLogin(!isLogin)}
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 border border-white/20 rounded-lg shadow-lg text-sm font-medium text-white/90 bg-white/10 hover:bg-white/20 disabled:bg-white/5 disabled:cursor-not-allowed transition-all duration-200 backdrop-blur"
              >
                {isLogin ? '🌟 Create an account' : '🏠 Already have an account? Sign in'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
