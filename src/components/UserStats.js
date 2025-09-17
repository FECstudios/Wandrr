
export default function UserStats({ user }) {
  const xp = user.xp || 0;
  const level = Math.floor(xp / 50);
  const progress = xp % 50;
  const streak = user.streak || 0;
  const completedLessons = user.completed_lessons?.length || 0;

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800">Your Progress</h2>
        <div className="text-right">
          <div className="text-2xl font-bold text-primary">Level {level}</div>
          <div className="text-sm text-gray-600">{xp} XP</div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center p-3 bg-orange-50 rounded-lg">
          <div className="text-2xl font-bold text-orange-600">{streak}</div>
          <div className="text-sm text-gray-600">Day Streak</div>
        </div>
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{completedLessons}</div>
          <div className="text-sm text-gray-600">Lessons</div>
        </div>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-3">
        <div 
          className="bg-primary h-3 rounded-full transition-all duration-300"
          style={{ width: `${(progress / 50) * 100}%` }}
        ></div>
      </div>
      <div className="text-xs text-gray-600 mt-1">{progress}/50 XP to next level</div>
    </div>
  );
}
