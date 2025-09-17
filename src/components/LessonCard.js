import { useState, useEffect } from 'react';

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
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto animate-fade-in">
        <div className={`text-center p-4 rounded-lg mb-4 ${isCorrect ? 'bg-green-100' : 'bg-red-100'}`}>
          <h3 className={`text-xl font-bold ${isCorrect ? 'text-green-800' : 'text-red-800'}`}>
            {isCorrect ? '🎉 Correct!' : '❌ Not quite'}
          </h3>
          
          {isCorrect && (
            <p className="text-lg font-semibold text-green-700 mt-2 animate-bounce">
              {positiveMessage}
            </p>
          )}

          <p className="mt-2 text-gray-700">{lesson.explanation}</p>
          {isCorrect && <p className="text-sm text-green-600 mt-2">+{lesson.xp} XP earned!</p>}
        </div>

        {lesson.isCustom && (
          <button
            onClick={onNextCustom}
            className="w-full bg-blue-500 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-600"
          >
            Next lesson on "{customTopic}"
          </button>
        )}
      </div>
    );
  }

  if (!lesson) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto animate-fade-in">
      <div className="mb-4">
        <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
          {lesson.country} • {lesson.topic}
        </span>
      </div>
      
      <h2 className="text-xl font-bold mb-4 text-gray-800">{lesson.question}</h2>
      
      {lesson.type === 'multiple_choice' && (
        <div className="space-y-2 mb-6">
          {lesson.options.map((option, index) => (
            <label key={index} className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
              <input
                type="radio"
                name={`answer-${lesson.id}`}
                value={option}
                checked={selectedAnswer === option}
                onChange={(e) => setSelectedAnswer(e.target.value)}
                className="mr-3 text-primary"
              />
              <span className="text-gray-700">{option}</span>
            </label>
          ))}
        </div>
      )}
      
      {lesson.type === 'true_false' && (
        <div className="space-y-2 mb-6">
          {['true', 'false'].map((option) => (
            <label key={option} className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
              <input
                type="radio"
                name={`answer-${lesson.id}`}
                value={option}
                checked={selectedAnswer === option}
                onChange={(e) => setSelectedAnswer(e.target.value)}
                className="mr-3 text-primary"
              />
              <span className="text-gray-700 capitalize">{option}</span>
            </label>
          ))}
        </div>
      )}
      
      <button
        onClick={handleSubmit}
        disabled={!selectedAnswer}
        className="w-full bg-primary text-white py-3 px-4 rounded-lg font-semibold hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
      >
        Submit Answer
      </button>
    </div>
  );
}