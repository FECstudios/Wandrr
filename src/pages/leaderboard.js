import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { jwtDecode } from 'jwt-decode';
import ProgressBar from '../components/ProgressBar';

export default function Leaderboard() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userId, setUserId] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth');
      return;
    }

    try {
      const decodedToken = jwtDecode(token);
      setUserId(decodedToken.userId);
    } catch (err) {
      console.error('Invalid token:', err);
      localStorage.removeItem('token');
      router.push('/auth');
      return;
    }
  }, [router]);

  useEffect(() => {
    if (!userId) return; // Wait for userId to be set from token

    async function fetchLeaderboard() {
      try {
        const res = await fetch('/api/leaderboard');
        if (!res.ok) throw new Error('Failed to fetch leaderboard');
        const data = await res.json();
        setUsers(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchLeaderboard();
  }, [userId]);

  if (!userId) {
    return <ProgressBar />;
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <Head>
        <title>Leaderboard - Wandrr</title>
      </Head>

      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary">Leaderboard</h1>
          <div className="flex items-center space-x-4">
            <Link href="/">
              <a className="text-primary hover:underline">Back to Lesson</a>
            </Link>
            <button 
              onClick={() => {
                localStorage.removeItem('token');
                router.push('/auth');
              }}
              className="text-sm text-gray-600 hover:text-gray-800"
            >Logout</button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4">
        {loading && <ProgressBar />}
        {error && <p className="text-red-500 text-center">{error}</p>}
        
        {!loading && !error && (
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <ul className="divide-y divide-gray-200">
              {users.map((user, index) => (
                <li key={user.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="text-lg font-bold text-gray-600 w-10">{index + 1}</span>
                    <span className="font-semibold text-gray-800">{user.username}</span>
                  </div>
                  <div className="text-lg font-bold text-primary">{user.xp} XP</div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>
    </div>
  );
}