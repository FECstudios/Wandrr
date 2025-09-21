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
    
    // Always add lesson to completed list (whether correct or incorrect)
    if (lessonId && !user.completed_lessons?.includes(lessonId)) {
      updates.completed_lessons = [...(user.completed_lessons || []), lessonId];
    }
    
    return updateLocalUser(userId, updates);
    
  } catch (error) {
    console.error('Failed to submit local lesson:', error);
    return false;
  }
}

/**
 * Get today's lesson for local user (generate a varied one)
 */
export function getTodaysLocalLesson(userId) {
  if (!isClient() || !isLocalUser(userId)) return null;
  
  // Get user's completed lessons to avoid repetition
  const user = getLocalUser(userId);
  const completedLessons = user?.completed_lessons || [];
  
  // Comprehensive lesson pool with variety
  const allLessons = [
    // Japan - Greetings & Social
    {
      id: `local-lesson-japan-greetings-1`,
      country: "Japan",
      topic: "greetings",
      question: "What is the most common greeting in Japan?",
      type: "multiple_choice",
      options: ["Konnichiwa", "Ohayo", "Sayonara", "Arigato"],
      answer: "Konnichiwa",
      explanation: "Konnichiwa (こんにちは) is the most common greeting in Japan, used throughout the day.",
      xp: 15,
      difficulty: "beginner"
    },
    {
      id: `local-lesson-japan-greetings-2`,
      country: "Japan",
      topic: "greetings",
      question: "In Japanese culture, bowing is an important part of greetings.",
      type: "true_false",
      options: ["true", "false"],
      answer: "true",
      explanation: "Bowing (ojigi) is a fundamental aspect of Japanese culture and is used in greetings, showing respect, and many social interactions.",
      xp: 15,
      difficulty: "beginner"
    },
    
    // France - Dining & Social
    {
      id: `local-lesson-france-dining-1`,
      country: "France",
      topic: "dining",
      question: "In France, it's polite to keep your hands visible during meals.",
      type: "true_false",
      options: ["true", "false"],
      answer: "true",
      explanation: "In French dining etiquette, it's considered polite to keep your hands visible on the table, not in your lap.",
      xp: 15,
      difficulty: "beginner"
    },
    {
      id: `local-lesson-france-greetings-1`,
      country: "France",
      topic: "greetings",
      question: "What is the traditional French greeting between friends?",
      type: "multiple_choice",
      options: ["Handshake", "Air kisses (la bise)", "Bow", "Wave"],
      answer: "Air kisses (la bise)",
      explanation: "La bise (air kisses on the cheeks) is the traditional greeting between friends and family in France.",
      xp: 15,
      difficulty: "beginner"
    },
    
    // Italy - Dining & Social
    {
      id: `local-lesson-italy-dining-1`,
      country: "Italy",
      topic: "dining",
      question: "In Italy, it's common to drink cappuccino after dinner.",
      type: "true_false",
      options: ["true", "false"],
      answer: "false",
      explanation: "In Italy, cappuccino is typically enjoyed only in the morning. Drinking it after dinner is considered unusual.",
      xp: 15,
      difficulty: "beginner"
    },
    {
      id: `local-lesson-italy-social-1`,
      country: "Italy",
      topic: "social",
      question: "What is considered appropriate when entering an Italian home?",
      type: "multiple_choice",
      options: ["Keep shoes on", "Remove shoes", "Bring flowers", "Arrive early"],
      answer: "Bring flowers",
      explanation: "Bringing flowers or a small gift when visiting an Italian home is considered polite and respectful.",
      xp: 15,
      difficulty: "beginner"
    },
    
    // Germany - Business & Social
    {
      id: `local-lesson-germany-business-1`,
      country: "Germany",
      topic: "business",
      question: "What is the appropriate greeting in a German business setting?",
      type: "multiple_choice",
      options: ["Hallo", "Guten Tag", "Hey", "Servus"],
      answer: "Guten Tag",
      explanation: "Guten Tag is the most formal and appropriate greeting for German business settings.",
      xp: 15,
      difficulty: "beginner"
    },
    {
      id: `local-lesson-germany-social-1`,
      country: "Germany",
      topic: "social",
      question: "Punctuality is highly valued in German culture.",
      type: "true_false",
      options: ["true", "false"],
      answer: "true",
      explanation: "Germans place great importance on punctuality and being on time is considered a sign of respect.",
      xp: 15,
      difficulty: "beginner"
    },
    
    // Brazil - Social & Greetings
    {
      id: `local-lesson-brazil-social-1`,
      country: "Brazil",
      topic: "social",
      question: "Personal space in Brazilian culture is typically smaller than in North American culture.",
      type: "true_false",
      options: ["true", "false"],
      answer: "true",
      explanation: "Brazilians generally stand closer and have more physical contact during conversations compared to North Americans.",
      xp: 15,
      difficulty: "beginner"
    },
    {
      id: `local-lesson-brazil-greetings-1`,
      country: "Brazil",
      topic: "greetings",
      question: "How do Brazilians typically greet close friends?",
      type: "multiple_choice",
      options: ["Firm handshake", "Cheek kisses and hugs", "Bow", "Formal nod"],
      answer: "Cheek kisses and hugs",
      explanation: "Brazilians are warm and affectionate, typically greeting close friends with cheek kisses and hugs.",
      xp: 15,
      difficulty: "beginner"
    },
    
    // Spain - Dining & Social
    {
      id: `local-lesson-spain-dining-1`,
      country: "Spain",
      topic: "dining",
      question: "What time do Spaniards typically eat dinner?",
      type: "multiple_choice",
      options: ["6:00 PM", "7:00 PM", "9:00 PM", "11:00 PM"],
      answer: "9:00 PM",
      explanation: "In Spain, dinner is typically eaten much later than in other countries, usually around 9:00-10:00 PM.",
      xp: 15,
      difficulty: "beginner"
    },
    
    // UK - Social & Business
    {
      id: `local-lesson-uk-social-1`,
      country: "United Kingdom",
      topic: "social",
      question: "Queuing (waiting in line) is taken very seriously in British culture.",
      type: "true_false",
      options: ["true", "false"],
      answer: "true",
      explanation: "The British are famous for their orderly queuing culture, and cutting in line is considered very rude.",
      xp: 15,
      difficulty: "beginner"
    },
    
    // India - Social & Greetings  
    {
      id: `local-lesson-india-greetings-1`,
      country: "India",
      topic: "greetings",
      question: "What is the traditional Indian greeting gesture?",
      type: "multiple_choice",
      options: ["Handshake", "Namaste", "Bow", "Wave"],
      answer: "Namaste",
      explanation: "Namaste, performed by pressing palms together and bowing slightly, is the traditional Indian greeting.",
      xp: 15,
      difficulty: "beginner"
    }
  ];
  
  // Filter out completed lessons
  const availableLessons = allLessons.filter(lesson => 
    !completedLessons.includes(lesson.id)
  );
  
  // If all lessons completed, reset and start over
  if (availableLessons.length === 0) {
    console.log('[Local Lessons] All lessons completed, restarting cycle');
    return allLessons[Math.floor(Math.random() * allLessons.length)];
  }
  
  // Return a random available lesson
  const selectedLesson = availableLessons[Math.floor(Math.random() * availableLessons.length)];
  
  // Add timestamp and local flag
  return {
    ...selectedLesson,
    id: `${selectedLesson.id}-${Date.now()}`,
    isLocal: true
  };
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