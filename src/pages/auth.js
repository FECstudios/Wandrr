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
  const [loadingMessage, setLoadingMessage] = useState('');
  const router = useRouter();

  // Humorous loading messages
  const loadingMessages = [
    "Calculating the square root of π...",
    "Overthinking democracy...",
    "Teaching penguins to dance...",
    "Convincing cats to follow instructions...",
    "Debugging the Matrix...",
    "Translating ancient memes...",
    "Negotiating with WiFi signals...",
    "Explaining TikTok to millennials...",
    "Herding digital sheep...",
    "Untangling headphone cables...",
    "Asking Google why it's so slow...",
    "Teaching AI to be humble...",
    "Converting coffee to code...",
    "Synchronizing with the universe...",
    "Bribing the loading bar...",
    "Consulting the cloud gods...",
    "Deciphering developer documentation...",
    "Waiting for the internet to catch up...",
    "Optimizing quantum flux capacitors...",
    "Reticulating splines..."
  ];

  // Cycle through loading messages
  const startLoadingMessages = () => {
    let messageIndex = 0;
    setLoadingMessage(loadingMessages[messageIndex]);
    
    const interval = setInterval(() => {
      messageIndex = (messageIndex + 1) % loadingMessages.length;
      setLoadingMessage(loadingMessages[messageIndex]);
    }, 2000); // Change message every 2 seconds
    
    return interval;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);
    
    // Start cycling through humorous loading messages
    const messageInterval = startLoadingMessages();

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
        
        // Show different message for local mode
        if (data.isLocalMode) {
          alert('Welcome! You\'re now in local mode. Your progress will be saved in your browser.');
        }
        
        router.push('/'); // Redirect to home page
      } else {
        // Show success message and add a brief delay before enabling login
        alert(`${data.message} Please wait a moment before logging in.`);
        
        // Add a delay to allow for database propagation before switching to login
        setTimeout(() => {
          setIsLogin(true); // Switch to login form after successful signup
        }, 1500); // 1.5 second delay
      }
    } catch (err) {
      setError(err.message);
    } finally {
      clearInterval(messageInterval); // Stop cycling messages
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  return (
    <div className="min-h-screen premium-background flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <Head>
        <title>{isLogin ? 'Login' : 'Sign Up'} - Wandrr</title>
      </Head>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg mb-6">
            <div className="text-3xl text-white">🌍</div>
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Wandrr</h1>
          <p className="text-gray-600 text-lg">Master Global Cultures</p>
        </div>
        <h2 className="text-center text-2xl font-bold text-gray-800 mb-2">
          {isLogin ? 'Welcome Back' : 'Start Your Journey'}
        </h2>
        <p className="text-center text-gray-600">
          {isLogin ? 'Continue your cultural exploration' : 'Discover customs from around the world'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white/95 backdrop-blur-xl py-8 px-6 shadow-xl rounded-2xl border border-gray-200/60">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email address
              </label>
              <div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 transition-all duration-200"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 transition-all duration-200"
                  placeholder="Enter your password"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl">
                <p className="text-sm text-center">{error}</p>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isLoading || !email || !password}
                className="w-full flex justify-center py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl shadow-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] disabled:transform-none"
              >
                {isLoading ? (
                  <div className="flex flex-col items-center space-y-2">
                    <div className="flex items-center space-x-2">
                      <LoadingSpinner size="sm" />
                      <span>{isLogin ? 'Signing in...' : 'Creating account...'}</span>
                    </div>
                    {loadingMessage && (
                      <span className="text-xs text-blue-200 italic animate-pulse">
                        {loadingMessage}
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="flex items-center space-x-2">
                    <span>{isLogin ? '🚀 Sign In' : '✨ Create Account'}</span>
                  </span>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-white text-gray-500">
                  Or
                </span>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={() => setIsLogin(!isLogin)}
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
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
