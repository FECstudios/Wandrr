import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { jwtDecode } from 'jwt-decode';
import UserStats from '../components/UserStats';
import LessonCard from '../components/LessonCard';
import ProgressBar from '../components/ProgressBar';

// --- Reusable UI Components ---

const ErrorAlert = ({ message, onClose }) => (
  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative shadow-md my-4 animate-fade-in" role="alert">
    <span className="block sm:inline">{message}</span>
    <button onClick={onClose} className="absolute top-0 bottom-0 right-0 px-4 py-3">
      <svg className="fill-current h-6 w-6 text-red-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><title>Close</title><path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/></svg>
    </button>
  </div>
);

const CustomLessonGenerator = ({ onGenerate, isGenerating, customTopic, setCustomTopic }) => (
  <div className="mt-4 p-6 bg-white rounded-2xl shadow-lg border border-gray-200 animate-fade-in-fast">
    <h3 className="text-xl font-bold text-gray-800 mb-2">Generate a Custom Lesson</h3>
    <p className="text-sm text-gray-500 mb-4">What do you want to learn about? Enter a topic and country, e.g., "Tipping in the USA" or "French pastries".</p>
    <div className="flex flex-col sm:flex-row gap-2">
      <input 
        type="text"
        value={customTopic}
        onChange={(e) => setCustomTopic(e.target.value)}
        placeholder="Enter a topic..."
        className="flex-grow px-4 py-2 border-gray-300 rounded-lg shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
      />
      <button 
        onClick={onGenerate}
        disabled={isGenerating}
        className="px-6 py-2 bg-green-500 text-white font-semibold rounded-lg shadow-md hover:bg-green-600 disabled:bg-gray-400 transition-all duration-200"
      >
        {isGenerating ? 'Generating...' : 'Generate'}
      </button>
    </div>
  </div>
);

const CompletionCard = ({ onGenerateClick, message, title }) => (
  <div className="text-center text-gray-600 mt-10 p-8 bg-white rounded-2xl shadow-lg border border-gray-200 animate-fade-in">
      <h3 className="text-2xl font-bold text-primary mb-2">{title}</h3>
      <p className="mb-6">{message}</p>
      <button 
        onClick={onGenerateClick}
        className="px-6 py-3 bg-primary text-white font-semibold rounded-lg shadow-md hover:bg-green-600 transition-all duration-200 transform hover:scale-105"
      >
        Learn Something New
      </button>
  </div>
);

const LevelUpModal = ({ newLevel, onClose }) => (
  <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 animate-fade-in-fast">
    <div className="bg-white rounded-2xl shadow-2xl p-8 text-center max-w-sm mx-auto transform scale-100 animate-pop-in">
      <h2 className="text-4xl font-bold text-yellow-500 mb-4">LEVEL UP!</h2>
      <p className="text-xl text-gray-700 mb-2">You've reached</p>
      <p className="text-6xl font-bold text-primary mb-6">Level {newLevel}</p>
      <button 
        onClick={onClose}
        className="px-8 py-3 bg-primary text-white font-semibold rounded-lg shadow-md hover:bg-green-600 transition-all duration-200 transform hover:scale-105"
      >
        Keep Going!
      </button>
    </div>
  </div>
);

// --- Main Page Component ---

export default function Home() {
  const [user, setUser] = useState(null);
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userId, setUserId] = useState(null);
  const router = useRouter();

  const [showCustom, setShowCustom] = useState(false);
  const [customTopic, setCustomTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [customLessonCompleted, setCustomLessonCompleted] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [newLevel, setNewLevel] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) router.push('/auth');
    else {
      try {
        const decodedToken = jwtDecode(token);
        setUserId(decodedToken.userId);
      } catch (err) {
        localStorage.removeItem('token');
        router.push('/auth');
      }
    }
  }, [router]);

  useEffect(() => {
    if (!userId) return;
    async function fetchData() {
      setLoading(true);
      try {
        const userRes = await fetch(`/api/user/${userId}`);
        if (!userRes.ok) throw new Error('Failed to fetch user');
        const userData = await userRes.json();
        setUser(userData);
        const lessonRes = await fetch(`/api/lesson/today/${userId}`);
        if (!lessonRes.ok) throw new Error('Failed to fetch lesson');
        setLesson(await lessonRes.json());
      } catch (err) { setError(err.message); } 
      finally { setLoading(false); }
    }
    fetchData();
  }, [userId]);

  const handleLessonSubmit = async (answer, isCorrect) => {
    if (!lesson || !user) return;
    try {
      const oldLevel = Math.floor((user.xp || 0) / 50);

      const response = await fetch('/api/lesson/submit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user, lesson, answer }) });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Submit failed: ${response.status} ${errorText}`);
      }
      const result = await response.json();
      
      if (result.updatedUser) {
        setUser(result.updatedUser);
        const newLevel = Math.floor((result.updatedUser.xp || 0) / 50);
        if (newLevel > oldLevel) {
          setNewLevel(newLevel);
          setShowLevelUp(true);
        }
      }

      setTimeout(async () => {
        if (lesson.isCustom) {
          setLesson(null);
          setCustomLessonCompleted(true);
        } else {
          setLoading(true);
          try {
            const lessonRes = await fetch(`/api/lesson/today/${userId}`);
            if (!lessonRes.ok) throw new Error('Failed to fetch next lesson');
            setLesson(await lessonRes.json());
          } catch (err) { setError(err.message); } 
          finally { setLoading(false); }
        }
      }, 2000);
    } catch (error) { setError(`Failed to submit lesson: ${error.message}`); }
  };

  const handleCustomGenerate = async () => {
    if (!customTopic.trim() || !user) return setError('Please enter a topic.');
    setIsGenerating(true);
    setError(null);
    setCustomLessonCompleted(false);
    try {
      const response = await fetch('/api/lesson/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: customTopic, user }) });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate lesson.');
      }
      setLesson(await response.json());
      setShowCustom(false);
    } catch (err) { setError(err.message); } 
    finally { setIsGenerating(false); }
  };

  if (!userId) return <ProgressBar />;

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      <Head>
        <title>Wandrr - Travel Smarter</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary">Wandrr</h1>
          <button onClick={() => { localStorage.removeItem('token'); router.push('/auth'); }} className="text-sm text-gray-600 hover:text-gray-800">Logout</button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 sm:px-6 lg:px-8 py-8">
        {error && <ErrorAlert message={error} onClose={() => setError(null)} />}
        {user && <UserStats user={user} />}
        
        <div className="mt-8">
          {loading && <ProgressBar />}
          {!loading && lesson && (
            <LessonCard 
              lesson={lesson} 
              onSubmit={handleLessonSubmit} 
              onNextCustom={handleCustomGenerate}
              customTopic={customTopic}
            />
          )}
          {!loading && !lesson && (
            customLessonCompleted ? (
              <CompletionCard 
                title="Lesson Complete!" 
                message="Ready for another challenge? Generate a new lesson on any topic you can imagine."
                onGenerateClick={() => setShowCustom(true)}
              />
            ) : (
              <CompletionCard 
                title="All Done For Today!" 
                message="You've completed your daily lessons. Come back tomorrow for more, or generate a custom lesson now."
                onGenerateClick={() => setShowCustom(true)}
              />
            )
          )}
        </div>

        {showCustom && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20 p-4">
            <CustomLessonGenerator 
              onGenerate={handleCustomGenerate} 
              isGenerating={isGenerating} 
              customTopic={customTopic} 
              setCustomTopic={setCustomTopic} 
            />
            <button onClick={() => setShowCustom(false)} className="absolute top-4 right-4 text-white text-4xl font-thin">&times;</button>
          </div>
        )}

        {!showCustom && !showLevelUp && (
            <button 
              onClick={() => setShowCustom(true)}
              className="fixed bottom-8 right-8 w-16 h-16 bg-primary text-white rounded-full shadow-2xl flex items-center justify-center text-4xl font-thin transform hover:scale-110 transition-transform duration-200 z-10"
              aria-label="Generate Custom Lesson"
            >
              +
            </button>
        )}

        {showLevelUp && <LevelUpModal newLevel={newLevel} onClose={() => setShowLevelUp(false)} />}
      </main>
    </div>
  );
}