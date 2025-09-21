import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import Button from './Button';

const correctMessages = [
  "Great job!",
  "You're on a roll!",
  "Awesome!",
  "Keep it up!",
  "Fantastic!",
  "You're a natural!",
  "Woot woot!",
  "Amazing!",
  "Spectacular!",
];

export default function LessonCard({ lesson, onSubmit, onNextCustom, customTopic }) {
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [positiveMessage, setPositiveMessage] = useState('');
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Handle hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  // Determine if using white theme (default to white based on user preference)
  const isWhiteTheme = mounted ? (theme === 'light' || theme === undefined) : true;

  useEffect(() => {
    setSelectedAnswer('');
    setShowResult(false);
    setIsCorrect(false);
    setPositiveMessage('');
  }, [lesson]);

  const handleSubmit = () => {
    if (!lesson) return;
    const correct = String(selectedAnswer) === String(lesson.answer);
    setIsCorrect(correct);
    setShowResult(true);
    onSubmit(selectedAnswer, correct);

    if (correct) {
      const randomMessage = correctMessages[Math.floor(Math.random() * correctMessages.length)];
      setPositiveMessage(randomMessage);
    }
  };

  if (showResult) {
    return (
      <div className="premium-card max-w-2xl mx-auto p-8">
        <div className={`text-center p-8 rounded-2xl mb-8 ${
          isCorrect 
            ? 'bg-gradient-to-br from-emerald-50 to-green-100 border-2 border-emerald-200' 
            : 'bg-gradient-to-br from-red-50 to-rose-100 border-2 border-red-200'
        }`}>
          <div className="text-6xl mb-4">
            {isCorrect ? '🎉' : '🤔'}
          </div>
          <h3 className={`text-3xl font-bold mb-4 ${
            isCorrect ? 'text-emerald-800' : 'text-red-800'
          }`}>
            {isCorrect ? 'Outstanding!' : 'Not quite right'}
          </h3>
          
          {isCorrect && (
            <p className="text-xl font-semibold text-emerald-700 mb-4 animate-bounce">
              {positiveMessage}
            </p>
          )}

          <p className="text-lg text-gray-700 leading-relaxed mb-4">{lesson.explanation}</p>
          {isCorrect && (
            <div className="inline-flex items-center space-x-2 bg-emerald-500 text-white px-4 py-2 rounded-full">
              <span>✨</span>
              <span className="font-semibold">+{lesson.xp} XP earned!</span>
            </div>
          )}
        </div>

        {lesson.isCustom && (
          <button
            onClick={onNextCustom}
            className="premium-button-primary w-full"
          >
            <span>🚀</span>
            <span>Continue with "{customTopic}"</span>
          </button>
        )}
      </div>
    );
  }

  if (!lesson) {
    return null;
  }

  return (
    <div className={`${
      isWhiteTheme 
        ? 'bg-white/95 border border-gray-200/60 text-gray-800 shadow-xl' 
        : 'bg-white/10 border border-white/20 text-white shadow-2xl'
    } backdrop-blur-xl rounded-2xl p-8 max-w-lg mx-auto w-full animate-fade-in`}>
      <div className="mb-6">
        <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full ${
          isWhiteTheme 
            ? 'bg-gray-50/80 border border-gray-200/50 backdrop-blur-sm'
            : 'bg-white/10 border border-white/30 backdrop-blur-sm'
        }`}>
          <span className="text-lg">🌎</span>
          <span className={`text-sm font-medium ${
            isWhiteTheme ? 'text-gray-700' : 'text-white/90'
          }`}>{lesson.country}</span>
          <span className={isWhiteTheme ? 'text-gray-400' : 'text-white/60'}>•</span>
          <span className={`text-sm font-medium ${
            isWhiteTheme ? 'text-gray-700' : 'text-white/90'
          }`}>{lesson.topic}</span>
        </div>
      </div>
      
      <h2 className={`text-xl font-bold mb-6 leading-relaxed ${
        isWhiteTheme ? 'text-gray-800' : 'text-white'
      }`}>{lesson.question}</h2>
      
      {lesson.type === 'multiple_choice' && (
        <div className="space-y-3 mb-8">
          {lesson.options.map((option, index) => (
            <Button 
              key={index}
              onClick={() => setSelectedAnswer(option)}
              className={`w-full p-4 rounded-xl text-left transition-all duration-200 ${
                selectedAnswer === option 
                  ? `${
                    isWhiteTheme 
                      ? 'bg-blue-600 border-2 border-blue-600 text-white shadow-lg transform scale-[1.02]'
                      : 'bg-white/40 border-2 border-white/80 text-white shadow-xl transform scale-[1.02]'
                  }` 
                  : `${
                    isWhiteTheme 
                      ? 'bg-white/90 border border-gray-300 text-gray-800 hover:bg-gray-50 hover:border-gray-400 hover:shadow-md backdrop-blur-sm'
                      : 'bg-white/10 border border-white/20 text-white/90 hover:bg-white/20 hover:border-white/40 backdrop-blur-sm'
                  }`
              }`}>
              <div className="flex items-center space-x-3">
                <div className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                  selectedAnswer === option 
                    ? `${
                      isWhiteTheme 
                        ? 'bg-white border-white shadow-lg'
                        : 'bg-white border-white shadow-lg'
                    }` 
                    : `${
                      isWhiteTheme 
                        ? 'border-gray-500 bg-white'
                        : 'border-white/40'
                    }`
                }`}>
                  {selectedAnswer === option && (
                    <div className={`w-2 h-2 rounded-full m-0.5 ${
                      isWhiteTheme ? 'bg-blue-600' : 'bg-purple-600'
                    }`}></div>
                  )}
                </div>
                <span className={`font-medium ${
                  isWhiteTheme ? 'text-gray-700' : 'text-white/80'
                }`}>{String.fromCharCode(65 + index)}.</span>
                <span className={selectedAnswer === option ? 'font-semibold' : ''}>{option}</span>
              </div>
            </Button>
          ))}
        </div>
      )}
      
      {lesson.type === 'true_false' && (
        <div className="space-y-3 mb-8">
          {['true', 'false'].map((option, index) => (
            <Button 
              key={option}
              onClick={() => setSelectedAnswer(option)}
              className={`w-full p-4 rounded-xl text-left capitalize transition-all duration-200 ${
                selectedAnswer === option 
                  ? `${
                    isWhiteTheme
                      ? 'bg-blue-600 border-2 border-blue-600 text-white shadow-lg transform scale-[1.02]'
                      : 'bg-white/40 border-2 border-white/80 text-white shadow-xl transform scale-[1.02]'
                  }`
                  : `${
                    isWhiteTheme
                      ? 'bg-white/90 border border-gray-300 text-gray-800 hover:bg-gray-50 hover:border-gray-400 hover:shadow-md backdrop-blur-sm'
                      : 'bg-white/10 border border-white/20 text-white/90 hover:bg-white/20 hover:border-white/40 backdrop-blur-sm'
                  }`
              }`}>
              <div className="flex items-center space-x-3">
                <div className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                  selectedAnswer === option 
                    ? `${
                      isWhiteTheme
                        ? 'bg-white border-white shadow-lg'
                        : 'bg-white border-white shadow-lg'
                    }`
                    : `${
                      isWhiteTheme
                        ? 'border-gray-500 bg-white'
                        : 'border-white/40'
                    }`
                }`}>
                  {selectedAnswer === option && (
                    <div className={`w-2 h-2 rounded-full m-0.5 ${
                      isWhiteTheme ? 'bg-blue-600' : 'bg-purple-600'
                    }`}></div>
                  )}
                </div>
                <span className="text-2xl">{option === 'true' ? '✓' : '✗'}</span>
                <span className={selectedAnswer === option ? 'font-semibold' : ''}>{option}</span>
              </div>
            </Button>
          ))}
        </div>
      )}
      
      <Button
        onClick={handleSubmit}
        disabled={!selectedAnswer}
        className={`w-full py-4 px-6 rounded-xl font-semibold transition-all duration-200 ${
          !selectedAnswer 
            ? `${
              isWhiteTheme
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                : 'bg-white/20 text-white/50 cursor-not-allowed border border-white/20'
            }`
            : `${
              isWhiteTheme
                ? 'bg-blue-600 text-white border border-blue-600 hover:bg-blue-700 hover:shadow-lg transform hover:scale-[1.02]'
                : 'bg-white/30 text-white border border-white/40 hover:bg-white/40 hover:shadow-lg transform hover:scale-[1.02]'
            }`
        }`}
      >
        {!selectedAnswer ? 'Select an answer' : '🚀 Submit Answer'}
      </Button>
    </div>
  );
}