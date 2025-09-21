
export default function UserStats({ user }) {
  // Use hardcoded data if user prop is not provided or is empty
  const defaultUser = {
    xp: 120, // Example XP
    streak: 7, // Example streak
    completed_lessons: [1, 2, 3, 4, 5], // Example completed lessons
  };

  const currentUser = user || defaultUser; // Use provided user or default

  const xp = currentUser.xp || 0;
  const level = Math.floor(xp / 50);
  const progress = xp % 50;
  const streak = currentUser.streak || 0;
  const completedLessons = currentUser.completed_lessons?.length || 0;

  return (
    <div className="premium-card max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Your Progress</h2>
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-800">
            Level {level}
          </div>
          <div className="text-sm text-gray-600">{xp} XP</div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="text-center p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-gray-200/50 shadow-sm">
          <div className="text-2xl font-bold text-orange-600 mb-1">{streak}</div>
          <div className="text-sm font-medium text-gray-700">Day Streak</div>
        </div>
        <div className="text-center p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-gray-200/50 shadow-sm">
          <div className="text-2xl font-bold text-blue-600 mb-1">{completedLessons}</div>
          <div className="text-sm font-medium text-gray-700">Lessons</div>
        </div>
      </div>
      
      <div className="bg-gray-200/80 backdrop-blur-sm rounded-full h-3 shadow-inner">
        <div 
          className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-700 ease-out"
          style={{ width: `${(progress / 50) * 100}%` }}
        ></div>
      </div>
      <div className="text-sm text-gray-600 mt-2 text-center">
        {progress}/50 XP to next level
      </div>
    </div>
  );
}
