import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { jwtDecode } from 'jwt-decode';
import { LoadingBar, LoadingSpinner } from '../components/ProgressBar';
import { getStorageItem, removeStorageItem, isClient } from '../lib/clientStorage';

export default function Leaderboard() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userId, setUserId] = useState(null);
  const [isTokenChecked, setIsTokenChecked] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Only check token on client side to avoid SSR issues
    if (!isClient()) return;
    
    const token = getStorageItem('token');
    if (!token) {
      router.push('/auth');
      return;
    }

    try {
      const decodedToken = jwtDecode(token);
      setUserId(decodedToken.userId);
    } catch (err) {
      console.error('Invalid token:', err);
      removeStorageItem('token');
      router.push('/auth');
      return;
    }
    
    setIsTokenChecked(true);
  }, [router]);

  useEffect(() => {
    if (!userId || !isTokenChecked) return; // Wait for userId to be set from token

    async function fetchLeaderboard() {
      setLoading(true);
      setError(null);
      
      try {
        const res = await fetch('/api/leaderboard');
        if (!res.ok) {
          if (res.status === 503) {
            throw new Error('Service is temporarily busy. Please try again in a moment.');
          }
          throw new Error('Failed to fetch leaderboard');
        }
        const data = await res.json();
        setUsers(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    fetchLeaderboard();
  }, [userId, isTokenChecked]);

  if (!isTokenChecked) {
    return (
      <div className="min-h-screen wandrr-pattern flex items-center justify-center">
        <div className="glass-card rounded-2xl p-8">
          <LoadingBar message="Initializing..." showMessage={true} />
        </div>
      </div>
    );
  }
  
  if (!userId) {
    return (
      <div className="min-h-screen wandrr-pattern flex items-center justify-center">
        <div className="glass-card rounded-2xl p-8">
          <LoadingBar message="Redirecting to login..." showMessage={true} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen wandrr-pattern font-sans">
      <Head>
        <title>Leaderboard - Wandrr</title>
      </Head>

      <header className="glass-card shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="text-2xl floating">🏆</div>
            <h1 className="text-2xl font-bold text-white drop-shadow-lg">Leaderboard</h1>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/">
              <a className="text-white/90 hover:text-white transition-colors glass-card px-3 py-2 rounded-lg border-0">
                🏠 Back to Lesson
              </a>
            </Link>
            <button 
              onClick={() => {
                removeStorageItem('token');
                router.push('/auth');
              }}
              className="text-sm text-white/90 hover:text-white glass-card px-3 py-2 rounded-lg border-0"
            >👋 Logout</button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4">
        {loading && (
          <LoadingBar 
            message="Fetching leaderboard rankings..." 
            showMessage={true} 
          />
        )}
        
        {error && (
          <div className="glass-card border border-red-400/50 text-red-100 px-6 py-4 rounded-xl text-center">
            <p>{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-3 px-4 py-2 bg-red-500/30 text-white rounded-lg hover:bg-red-500/50 transition-colors glass-card border-0"
            >
              Try Again
            </button>
          </div>
        )}
        
        {!loading && !error && users.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🌎</div>
            <p className="text-white/80 text-lg drop-shadow">No travelers found on the leaderboard yet.</p>
            <p className="text-white/70 text-sm mt-2">Be the first to start your cultural journey!</p>
          </div>
        )}
        
        {!loading && !error && users.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="bg-primary text-white px-6 py-4">
              <h2 className="text-xl font-bold">Top Wandrrs</h2>
              <p className="text-green-100">See how you rank against other travelers!</p>
            </div>
            <ul className="divide-y divide-gray-200">
              {users.map((user, index) => {
                const isCurrentUser = user.id === userId;
                const rankColor = index === 0 ? 'text-yellow-500' : index === 1 ? 'text-gray-400' : index === 2 ? 'text-yellow-600' : 'text-gray-600';
                const rankIcon = index === 0 ? '👑' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';
                
                return (
                  <li 
                    key={user.id} 
                    className={`p-4 flex items-center justify-between transition-colors ${
                      isCurrentUser ? 'bg-green-50 border-l-4 border-primary' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <span className={`text-lg font-bold w-8 text-center ${rankColor}`}>
                          {index < 3 ? rankIcon : `#${index + 1}`}
                        </span>
                      </div>
                      <div>
                        <span className={`font-semibold ${
                          isCurrentUser ? 'text-primary' : 'text-gray-800'
                        }`}>
                          {user.username}
                          {isCurrentUser && <span className="ml-2 text-sm text-primary">(You)</span>}
                        </span>
                        {user.streak > 0 && (
                          <div className="text-sm text-gray-500">
                            🔥 {user.streak} day streak
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-primary">{user.xp || 0} XP</div>
                      <div className="text-sm text-gray-500">Level {Math.floor((user.xp || 0) / 50)}</div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </main>
    </div>
  );
}