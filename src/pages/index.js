import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { jwtDecode } from 'jwt-decode';
import useSound from 'use-sound';
import UserStats from '../components/UserStats';
import LessonCard from '../components/LessonCard';
import { LoadingBar, LoadingSpinner, LoadingOverlay, useLoadingProgress } from '../components/ProgressBar';
import { fetchUserWithCache, setCachedUser, clearUserCache } from '../lib/userCache';
import { getStorageItem, setStorageItem, removeStorageItem, isClient } from '../lib/clientStorage';
import { isLocalUser, getLocalUser, updateLocalUser, submitLocalLesson, getTodaysLocalLesson } from '../lib/localUserStorage';
import Button from '../components/Button';

// --- Reusable UI Components ---

const ErrorAlert = ({ message, onClose }) => (
  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative shadow-md my-4 animate-fade-in" role="alert">
    <span className="block sm:inline">{message}</span>
    <Button onClick={onClose} className="absolute top-0 bottom-0 right-0 px-4 py-3">
      <svg className="fill-current h-6 w-6 text-red-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" aria-label="Close"><path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/></svg>
    </Button>
  </div>
);

const CustomLessonGenerator = ({ onGenerate, isGenerating, customTopic, setCustomTopic }) => (
  <div className="mt-4 p-6 bg-background rounded-2xl shadow-lg border border-foreground/10 animate-fade-in-fast">
    <h3 className="text-xl font-bold text-foreground mb-2">Generate a Custom Lesson</h3>
    <p className="text-sm text-foreground/60 mb-4">What do you want to learn about? Enter a topic and country, e.g., "Tipping in the USA" or "French pastries".</p>
    <div className="flex flex-col sm:flex-row gap-2">
      <input 
        type="text"
        value={customTopic}
        onChange={(e) => setCustomTopic(e.target.value)}
        placeholder="Enter a topic..."
        disabled={isGenerating}
        className="flex-grow px-4 py-2 bg-background border-foreground/10 rounded-lg shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
      />
      <Button 
        onClick={onGenerate}
        disabled={isGenerating || !customTopic.trim()}
        className="px-6 py-2 bg-green-500 text-white font-semibold rounded-lg shadow-md hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200 flex items-center space-x-2"
      >
        {isGenerating ? (
          <>
            <LoadingSpinner size="sm" />
            <span>Generating...</span>
          </>
        ) : (
          <span>Generate</span>
        )}
      </Button>
    </div>
    {isGenerating && (
      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <LoadingSpinner size="sm" message="Creating your personalized lesson..." />
      </div>
    )}
  </div>
);

const CompletionCard = ({ onGenerateClick, message, title }) => (
  <div className="text-center text-foreground/80 mt-10 p-8 bg-background rounded-2xl shadow-lg border border-foreground/10 animate-fade-in">
      <h3 className="text-2xl font-bold text-primary mb-2">{title}</h3>
      <p className="mb-6">{message}</p>
      <Button 
        onClick={onGenerateClick}
        className="px-6 py-3 bg-primary text-white font-semibold rounded-lg shadow-md hover:bg-green-600 transition-all duration-200 transform hover:scale-105"
      >
        Learn Something New
      </Button>
  </div>
);

const LevelUpModal = ({ newLevel, onClose }) => (
  <div className="premium-modal-overlay">
    <div className="premium-modal-card text-center max-w-md">
      <div className="text-6xl mb-6">🎉</div>
      <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
        LEVEL UP!
      </h2>
      <p className="text-lg text-gray-600 mb-2">Congratulations! You've reached</p>
      <p className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-8">
        Level {newLevel}
      </p>
      <button
        onClick={onClose}
        className="premium-button-primary w-full"
      >
        <span>🚀</span>
        <span>Keep Going!</span>
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
  const [loadingMessage, setLoadingMessage] = useState('Loading...');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTokenChecked, setIsTokenChecked] = useState(false); // Track if token check is complete
  const [playLevelUp] = useSound('/audio/levelup.mp3');
  const [playCorrect] = useSound('/audio/correct.mp3');
  const [playIncorrect] = useSound('/audio/incorrect.mp3');

  // Initialize loading progress hook
  const loadingSteps = [
    'Authenticating user...',
    'Fetching user profile...',
    'Loading today\'s lesson...',
    'Preparing content...'
  ];
  
  const {
    isLoading: progressLoading,
    progress,
    message: progressMessage,
    startLoading,
    nextStep,
    finishLoading,
    resetLoading
  } = useLoadingProgress(loadingSteps);

  useEffect(() => {
    // Only check token on client side to avoid SSR issues
    if (!isClient()) return;
    
    const token = getStorageItem('token');
    if (!token) {
      router.push('/auth');
    } else {
      try {
        setLoadingMessage('Verifying authentication...');
        const decodedToken = jwtDecode(token);
        setUserId(decodedToken.userId);
      } catch (err) {
        console.error('Invalid token:', err);
        removeStorageItem('token');
        router.push('/auth');
      }
    }
    setIsTokenChecked(true);
  }, [router]);

  useEffect(() => {
    if (!userId || !isTokenChecked) return;
    
    async function fetchData() {
      startLoading(loadingSteps);
      setLoading(true);
      setError(null);
      
      try {
        // Step 1: Fetch user profile (with caching)
        nextStep(loadingSteps);
        const userData = await fetchUserWithCache(userId, true);
        setUser(userData);
        
        // Step 2: Fetch today's lesson
        nextStep(loadingSteps);
        let lessonData;
        
        if (isLocalUser(userId)) {
          // Handle local user lessons
          console.log('[Local Mode] Generating local lesson');
          lessonData = getTodaysLocalLesson(userId);
          if (!lessonData) {
            // Fallback lesson for local users
            lessonData = {
              id: `local-lesson-${Date.now()}`,
              country: "Welcome",
              topic: "getting_started",
              question: "Welcome to Wandrr! Are you ready to learn about cultures around the world?",
              type: "true_false",
              options: ["true", "false"],
              answer: "true",
              explanation: "Great! You're now in local mode. Your progress will be saved in your browser.",
              xp: 10,
              difficulty: "beginner",
              isLocal: true
            };
          }
        } else {
          // Handle remote user lessons
          const lessonRes = await fetch(`/api/lesson/today/${userId}`);
          if (!lessonRes.ok) {
            if (lessonRes.status === 503) {
              throw new Error('Lesson service is temporarily busy. Please try again in a moment.');
            }
            throw new Error('Failed to fetch today\'s lesson');
          }
          lessonData = await lessonRes.json();
        }
        
        setLesson(lessonData);
        
        // Step 3: Finalize
        nextStep(loadingSteps);
        await new Promise(resolve => setTimeout(resolve, 300)); // Brief pause for UX
        
        finishLoading();
      } catch (err) {
        setError(err.message);
        resetLoading();
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [userId, isTokenChecked]);

  const handleLessonSubmit = async (answer, isCorrect) => {
    if (!lesson || !user) {
      console.error('Missing lesson or user data:', { lesson: !!lesson, user: !!user });
      setError('Missing lesson or user data. Please refresh the page.');
      return;
    }

    // Skip shovId validation for local users
    if (!isLocalUser(userId) && !lesson.shovId) {
      console.error('Lesson missing shovId:', lesson);
      setError('Lesson data is incomplete. Please refresh the page.');
      return;
    }

    if (answer === undefined || answer === null || answer === '') {
      console.error('Answer is missing or empty:', { answer, type: typeof answer });
      setError('Please select an answer before submitting.');
      return;
    }

    if (isCorrect) {
      playCorrect();
    } else {
      playIncorrect();
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const oldLevel = Math.floor((user.xp || 0) / 50);

      let result;
      
      if (isLocalUser(userId)) {
        // Handle local user submission
        console.log('[Local Mode] Processing lesson submission locally');
        const xpGained = isCorrect ? 15 : 5;
        
        // Update local user data
        const success = submitLocalLesson(userId, lesson.id, answer, isCorrect, xpGained);
        if (!success) {
          throw new Error('Failed to save progress locally');
        }
        
        // Get updated user data
        const updatedUser = getLocalUser(userId);
        setUser(updatedUser);
        
        result = {
          message: isCorrect ? 'Correct! Well done!' : 'Not quite right, but keep learning!',
          xpGained,
          updatedUser,
          localMode: true
        };
        
        const newLevel = Math.floor((updatedUser.xp || 0) / 50);
        if (newLevel > oldLevel) {
          setNewLevel(newLevel);
          setShowLevelUp(true);
          playLevelUp();
        }
        
      } else {
        // Handle remote user submission
        const response = await fetch('/api/lesson/submit', { 
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' }, 
          body: JSON.stringify({ user, lesson, answer }) 
        });
        
        if (!response.ok) {
          if (response.status === 503) {
            throw new Error('Service is temporarily busy. Your answer will be saved when service is available.');
          }
          const errorText = await response.text();
          throw new Error(`Submit failed: ${response.status} ${errorText}`);
        }
        
        result = await response.json();
        
        if (result.updatedUser) {
          // Update local state and cache with fresh user data
          setUser(result.updatedUser);
          setCachedUser(userId, result.updatedUser); // Update cache
          
          const newLevel = Math.floor((result.updatedUser.xp || 0) / 50);
          if (newLevel > oldLevel) {
            setNewLevel(newLevel);
            setShowLevelUp(true);
            playLevelUp();
          }
        }
      }

      // Show brief success message then load next content
      setTimeout(async () => {
        if (lesson.isCustom) {
          setLesson(null);
          setCustomLessonCompleted(true);
        } else {
          setLoadingMessage('Loading next lesson...');
          setLoading(true);
          try {
            let nextLessonData;
            
            if (isLocalUser(userId)) {
              // Generate next local lesson
              nextLessonData = getTodaysLocalLesson(userId);
            } else {
              // Fetch next remote lesson
              const lessonRes = await fetch(`/api/lesson/today/${userId}`);
              if (!lessonRes.ok) {
                if (lessonRes.status === 503) {
                  throw new Error('Service is temporarily busy. Please try again in a moment.');
                }
                throw new Error('Failed to fetch next lesson');
              }
              nextLessonData = await lessonRes.json();
            }
            
            setLesson(nextLessonData);
          } catch (err) { 
            setError(err.message); 
          } finally { 
            setLoading(false); 
          }
        }
      }, 2000);
    } catch (error) { 
      setError(`Failed to submit lesson: ${error.message}`); 
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCustomGenerate = async () => {
    if (!customTopic.trim() || !user) return setError('Please enter a topic.');
    
    setIsGenerating(true);
    setError(null);
    setCustomLessonCompleted(false);
    
    try {
      const response = await fetch('/api/lesson/generate', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ prompt: customTopic, user }) 
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 503) {
          throw new Error('AI service is temporarily busy. Please try again in a moment.');
        }
        throw new Error(errorData.message || 'Failed to generate lesson.');
      }
      
      const lessonData = await response.json();
      setLesson(lessonData);
      setShowCustom(false);
      setCustomTopic(''); // Clear the input
    } catch (err) { 
      setError(err.message); 
    } finally { 
      setIsGenerating(false); 
    }
  };

  if (!isTokenChecked) {
    return (
      <div className="min-h-screen wandrr-pattern flex items-center justify-center">
        <div className="glass-card rounded-2xl p-8">
          <LoadingBar message="Initializing application..." showMessage={true} />
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
    <div className="min-h-screen premium-background font-sans">
      <Head>
        <title>Wandrr - Master Global Cultures</title>
        <link rel="icon" href="/favicon.ico" />
        <meta name="description" content="Learn cultural customs and etiquette from around the world through AI-powered lessons" />
      </Head>

      <header className="premium-glass-header sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 py-6 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="premium-logo-container">
              <div className="text-4xl floating">🌍</div>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800 tracking-tight">Wandrr</h1>
              <p className="text-gray-600 text-sm font-medium">Master Global Cultures</p>
            </div>
          </div>
          <div className="flex items-center space-x-6">
            {isLocalUser(userId) && (
              <div className="hidden md:flex items-center text-orange-600 text-sm bg-orange-50 px-3 py-1 rounded-full border border-orange-200">
                <div className="w-2 h-2 bg-orange-500 rounded-full mr-2 animate-pulse"></div>
                <span className="font-medium">Local Mode</span>
              </div>
            )}
            <div className="hidden md:flex items-center text-gray-600 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
              <span>Learning in progress</span>
            </div>
            <Button 
              onClick={() => { 
                clearUserCache(userId);
                removeStorageItem('token'); 
                router.push('/auth'); 
              }} 
              className="premium-button-secondary"
            >
              <span>👋</span>
              <span>Sign Out</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-800 mb-4">Your Cultural Journey</h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">Discover customs, traditions, and etiquette from around the world through interactive lessons</p>
        </div>
        
        {error && (
          <div className="premium-error-card mb-8">
            <div className="flex items-center space-x-3">
              <div className="text-2xl">⚠️</div>
              <div>
                <h3 className="font-semibold text-red-800">Oops! Something went wrong</h3>
                <p className="text-red-600">{error}</p>
              </div>
            </div>
            <button 
              onClick={() => setError(null)}
              className="ml-auto text-red-400 hover:text-red-600 transition-colors"
            >
              ✕
            </button>
          </div>
        )}
        
        {user && (
          <div className="premium-stats-grid mb-12">
            <UserStats user={user} />
          </div>
        )}
        <div className="lesson-container">
          {(loading || progressLoading) && (
            <div className="premium-loading-card">
              <LoadingBar 
                message={progressLoading ? progressMessage : loadingMessage} 
                progress={progressLoading ? progress : null}
                showMessage={true} 
              />
            </div>
          )}
          
          {!loading && !progressLoading && lesson && (
            <>
              <LessonCard 
                lesson={lesson} 
                onSubmit={handleLessonSubmit} 
                onNextCustom={handleCustomGenerate}
                customTopic={customTopic}
                disabled={isSubmitting}
              />
              {isSubmitting && (
                <div className="premium-submitting-indicator">
                  <LoadingSpinner size="sm" message="Processing your answer..." className="justify-center text-gray-600" />
                </div>
              )}
            </>
          )}
          
          {!loading && !progressLoading && !lesson && (
            <div className="premium-completion-section">
              {customLessonCompleted ? (
                <div className="premium-completion-card">
                  <div className="text-6xl mb-6">🎉</div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-4">Lesson Complete!</h3>
                  <p className="text-gray-600 mb-8">Ready for another challenge? Generate a new lesson on any topic you can imagine.</p>
                  <button 
                    onClick={() => setShowCustom(true)}
                    className="premium-button-primary"
                  >
                    🎆 Create New Lesson
                  </button>
                </div>
              ) : (
                <div className="premium-completion-card">
                  <div className="text-6xl mb-6">✨</div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-4">All Done For Today!</h3>
                  <p className="text-gray-600 mb-8">You've completed your daily lessons. Come back tomorrow for more, or generate a custom lesson now.</p>
                  <button 
                    onClick={() => setShowCustom(true)}
                    className="premium-button-primary"
                  >
                    🚀 Explore More Topics
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {showCustom && (
          <div className="premium-modal-overlay">
            <div className="premium-modal-card">
              <button 
                onClick={() => setShowCustom(false)} 
                disabled={isGenerating}
                className="premium-close-button"
              >
                ✕
              </button>
              <div className="text-center">
                <div className="text-5xl mb-6">🎆</div>
                <h3 className="text-2xl font-bold text-gray-800 mb-4">Create Custom Lesson</h3>
                <p className="text-gray-600 mb-8">What cultural topic would you like to explore?</p>
                
                <div className="space-y-4">
                  <input
                    type="text"
                    value={customTopic}
                    onChange={(e) => setCustomTopic(e.target.value)}
                    placeholder="e.g., Japanese tea ceremony, French dining etiquette..."
                    className="premium-input"
                    disabled={isGenerating}
                  />
                  <button
                    onClick={handleCustomGenerate}
                    disabled={!customTopic.trim() || isGenerating}
                    className="premium-button-primary w-full"
                  >
                    {isGenerating ? (
                      <>
                        <LoadingSpinner size="sm" />
                        <span>Creating your lesson...</span>
                      </>
                    ) : (
                      <>
                        <span>✨</span>
                        <span>Generate Lesson</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {!showCustom && !showLevelUp && (
          <button 
            onClick={() => setShowCustom(true)}
            className="premium-fab"
            aria-label="Create Custom Lesson"
          >
            <div className="premium-fab-icon">✨</div>
            <div className="premium-fab-text">Custom</div>
          </button>
        )}

        {showLevelUp && <LevelUpModal newLevel={newLevel} onClose={() => setShowLevelUp(false)} />}
      </main>
    </div>
  );
}