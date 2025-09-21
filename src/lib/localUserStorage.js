import { getStorageItem, setStorageItem, removeStorageItem, isClient } from './clientStorage';

// Local User Storage Utilities for offline functionality

/**
 * Check if current user is in local mode
 */
export function isLocalUser(userId) {
  return userId && userId.startsWith('local-user-');
}

/**
 * Store user data locally
 */
export function storeLocalUser(userData) {
  if (!isClient()) return false;
  
  try {
    const localUsers = getLocalUsers();
    localUsers[userData.id] = {
      ...userData,
      lastUpdated: new Date().toISOString()
    };
    setStorageItem('local_users', JSON.stringify(localUsers));
    return true;
  } catch (error) {
    console.error('Failed to store local user:', error);
    return false;
  }
}

/**
 * Get user data from local storage
 */
export function getLocalUser(userId) {
  if (!isClient() || !isLocalUser(userId)) return null;
  
  try {
    const localUsers = getLocalUsers();
    return localUsers[userId] || null;
  } catch (error) {
    console.error('Failed to get local user:', error);
    return null;
  }
}

/**
 * Update user data in local storage
 */
export function updateLocalUser(userId, updates) {
  if (!isClient() || !isLocalUser(userId)) return false;
  
  try {
    const localUsers = getLocalUsers();
    if (localUsers[userId]) {
      localUsers[userId] = {
        ...localUsers[userId],
        ...updates,
        lastUpdated: new Date().toISOString()
      };
      setStorageItem('local_users', JSON.stringify(localUsers));
      return true;
    }
    return false;
  } catch (error) {
    console.error('Failed to update local user:', error);
    return false;
  }
}

/**
 * Get all local users
 */
export function getLocalUsers() {
  if (!isClient()) return {};
  
  try {
    const stored = getStorageItem('local_users');
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error('Failed to parse local users:', error);
    return {};
  }
}

/**
 * Store lesson data locally for a user
 */
export function storeLocalLesson(userId, lessonData) {
  if (!isClient() || !isLocalUser(userId)) return false;
  
  try {
    const key = `local_lessons_${userId}`;
    const lessons = getLocalLessons(userId);
    lessons.push({
      ...lessonData,
      id: `lesson-${Date.now()}`,
      timestamp: new Date().toISOString()
    });
    
    // Keep only last 50 lessons to avoid storage bloat
    if (lessons.length > 50) {
      lessons.splice(0, lessons.length - 50);
    }
    
    setStorageItem(key, JSON.stringify(lessons));
    return true;
  } catch (error) {
    console.error('Failed to store local lesson:', error);
    return false;
  }
}

/**
 * Get lessons for a local user
 */
export function getLocalLessons(userId) {
  if (!isClient() || !isLocalUser(userId)) return [];
  
  try {
    const key = `local_lessons_${userId}`;
    const stored = getStorageItem(key);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to get local lessons:', error);
    return [];
  }
}

/**
 * Submit lesson result locally
 */
export function submitLocalLesson(userId, lessonId, answer, isCorrect, xpGained = 0) {
  if (!isClient() || !isLocalUser(userId)) return false;
  
  try {
    // Update user stats
    const user = getLocalUser(userId);
    if (!user) return false;
    
    const updates = {
      xp: (user.xp || 0) + xpGained,
      completed_lessons: [...(user.completed_lessons || []), lessonId]
    };
    
    // Update streak logic
    const today = new Date().toDateString();
    const lastLessonDate = user.lastLessonDate;
    
    if (lastLessonDate === today) {
      // Same day, maintain streak
    } else if (lastLessonDate) {
      const lastDate = new Date(lastLessonDate);
      const todayDate = new Date(today);
      const daysDiff = Math.floor((todayDate - lastDate) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === 1) {
        updates.streak = (user.streak || 0) + 1;
      } else if (daysDiff > 1) {
        updates.streak = 1; // Reset streak
      }
    } else {
      updates.streak = 1; // First lesson
    }
    
    updates.lastLessonDate = today;
    
    // Store mistake if incorrect
    if (!isCorrect && lessonId) {
      updates.mistakes = [...(user.mistakes || []), {
        lessonId,
        answer,
        timestamp: new Date().toISOString()
      }];
    }
    
    return updateLocalUser(userId, updates);
    
  } catch (error) {
    console.error('Failed to submit local lesson:', error);
    return false;
  }
}

/**
 * Get today's lesson for local user (generate a simple one)
 */
export function getTodaysLocalLesson(userId) {
  if (!isClient() || !isLocalUser(userId)) return null;
  
  // Simple local lesson generation
  const lessons = [
    {
      id: `local-lesson-${Date.now()}`,
      country: "Japan",
      topic: "greetings",
      question: "What is the most common greeting in Japan?",
      type: "multiple_choice",
      options: ["Konnichiwa", "Ohayo", "Sayonara", "Arigato"],
      answer: "Konnichiwa",
      explanation: "Konnichiwa (こんにちは) is the most common greeting in Japan, used throughout the day.",
      xp: 10,
      difficulty: "beginner",
      isLocal: true
    },
    {
      id: `local-lesson-${Date.now() + 1}`,
      country: "France",
      topic: "dining",
      question: "In France, it's polite to keep your hands visible during meals.",
      type: "true_false",
      options: ["true", "false"],
      answer: "true",
      explanation: "In French dining etiquette, it's considered polite to keep your hands visible on the table, not in your lap.",
      xp: 10,
      difficulty: "beginner",
      isLocal: true
    }
  ];
  
  // Return a random lesson
  return lessons[Math.floor(Math.random() * lessons.length)];
}

/**
 * Clear all local user data
 */
export function clearLocalUserData(userId = null) {
  if (!isClient()) return false;
  
  try {
    if (userId && isLocalUser(userId)) {
      // Clear specific user
      const localUsers = getLocalUsers();
      delete localUsers[userId];
      setStorageItem('local_users', JSON.stringify(localUsers));
      removeStorageItem(`local_lessons_${userId}`);
    } else {
      // Clear all local data
      removeStorageItem('local_users');
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('local_lessons_')) {
          removeStorageItem(key);
        }
      });
    }
    return true;
  } catch (error) {
    console.error('Failed to clear local user data:', error);
    return false;
  }
}