import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { getStorageItem, setStorageItem } from '../lib/clientStorage';

const OnboardingStep = ({ step, totalSteps, title, children, onNext, onPrev, nextLabel = 'Continue', isLastStep = false, canContinue = true }) => (
  <div className="premium-modal-card max-w-2xl mx-auto">
    <div className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm text-gray-500 font-medium">Step {step} of {totalSteps}</div>
        <div className="flex space-x-2">
          {Array.from({ length: totalSteps }, (_, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                i < step ? 'bg-blue-500' : i === step - 1 ? 'bg-blue-400' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
      </div>
      <h2 className="text-3xl font-bold text-gray-800 mb-2">{title}</h2>
    </div>
    
    <div className="mb-8">
      {children}
    </div>
    
    <div className="flex justify-between items-center">
      {step > 1 ? (
        <button onClick={onPrev} className="premium-button-secondary">
          <span>←</span>
          <span>Back</span>
        </button>
      ) : (
        <div />
      )}
      <button 
        onClick={onNext} 
        disabled={!canContinue}
        className="premium-button-primary"
      >
        <span>{isLastStep ? '🚀' : '→'}</span>
        <span>{nextLabel}</span>
      </button>
    </div>
  </div>
);

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(1);
  const [userName, setUserName] = useState('');
  const [selectedInterests, setSelectedInterests] = useState([]);
  const router = useRouter();

  useEffect(() => {
    // Check if user is already logged in
    const token = getStorageItem('token');
    if (!token) {
      router.push('/auth');
      return;
    }

    // Check if onboarding is already completed
    const onboardingCompleted = getStorageItem('onboarding_completed');
    if (onboardingCompleted) {
      router.push('/');
      return;
    }
  }, [router]);

  const interests = [
    { id: 'dining', name: 'Dining Etiquette', icon: '🍽️', description: 'Table manners and food customs' },
    { id: 'greetings', name: 'Greetings & Communication', icon: '👋', description: 'How people greet and communicate' },
    { id: 'business', name: 'Business Culture', icon: '💼', description: 'Professional customs and practices' },
    { id: 'traditions', name: 'Traditions & Festivals', icon: '🎉', description: 'Cultural celebrations and rituals' },
    { id: 'social', name: 'Social Customs', icon: '🤝', description: 'Daily social interactions' },
    { id: 'gift_giving', name: 'Gift Giving', icon: '🎁', description: 'Present customs and etiquette' }
  ];

  const handleInterestToggle = (interestId) => {
    setSelectedInterests(prev => 
      prev.includes(interestId) 
        ? prev.filter(id => id !== interestId)
        : [...prev, interestId]
    );
  };

  const handleComplete = () => {
    // Save onboarding preferences
    setStorageItem('user_name', userName);
    setStorageItem('user_interests', JSON.stringify(selectedInterests));
    setStorageItem('onboarding_completed', 'true');
    
    // Redirect to main app
    router.push('/');
  };

  const nextStep = () => setCurrentStep(prev => prev + 1);
  const prevStep = () => setCurrentStep(prev => prev - 1);

  return (
    <div className="min-h-screen premium-background">
      <Head>
        <title>Welcome to Wandrr - Cultural Learning Platform</title>
        <meta name="description" content="Get started with Wandrr and begin your cultural learning journey" />
      </Head>

      <div className="min-h-screen flex items-center justify-center px-6 py-12">
        {currentStep === 1 && (
          <OnboardingStep
            step={1}
            totalSteps={4}
            title="Welcome to Wandrr!"
            onNext={nextStep}
            nextLabel="Get Started"
          >
            <div className="text-center">
              <div className="text-8xl mb-8 floating">🌍</div>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Discover cultures from around the world through interactive lessons. 
                Learn customs, traditions, and etiquette that will make you a confident global citizen.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="premium-feature-card">
                  <div className="text-3xl mb-3">📚</div>
                  <h3 className="font-semibold text-gray-800 mb-2">Interactive Lessons</h3>
                  <p className="text-sm text-gray-600">Learn through engaging questions and real scenarios</p>
                </div>
                <div className="premium-feature-card">
                  <div className="text-3xl mb-3">🎯</div>
                  <h3 className="font-semibold text-gray-800 mb-2">Personalized Learning</h3>
                  <p className="text-sm text-gray-600">Content tailored to your interests and level</p>
                </div>
                <div className="premium-feature-card">
                  <div className="text-3xl mb-3">🏆</div>
                  <h3 className="font-semibold text-gray-800 mb-2">Track Progress</h3>
                  <p className="text-sm text-gray-600">Earn XP and level up as you learn</p>
                </div>
              </div>
            </div>
          </OnboardingStep>
        )}

        {currentStep === 2 && (
          <OnboardingStep
            step={2}
            totalSteps={4}
            title="What should we call you?"
            onNext={nextStep}
            onPrev={prevStep}
            canContinue={userName.trim().length > 0}
          >
            <div className="text-center">
              <div className="text-6xl mb-8">👋</div>
              <p className="text-lg text-gray-600 mb-8">
                We'd love to personalize your learning experience. What name would you like us to use?
              </p>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Enter your name..."
                className="premium-input text-center text-xl"
                autoFocus
              />
              <p className="text-sm text-gray-500 mt-4">
                Don't worry, this is just for personalizing your experience
              </p>
            </div>
          </OnboardingStep>
        )}

        {currentStep === 3 && (
          <OnboardingStep
            step={3}
            totalSteps={4}
            title="What interests you most?"
            onNext={nextStep}
            onPrev={prevStep}
            canContinue={selectedInterests.length > 0}
          >
            <div>
              <p className="text-lg text-gray-600 mb-8 text-center">
                Select the cultural topics you'd like to explore. We'll personalize your lessons based on your interests.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {interests.map((interest) => (
                  <button
                    key={interest.id}
                    onClick={() => handleInterestToggle(interest.id)}
                    className={`premium-interest-card ${
                      selectedInterests.includes(interest.id) ? 'selected' : ''
                    }`}
                  >
                    <div className="text-3xl mb-3">{interest.icon}</div>
                    <h3 className="font-semibold text-gray-800 mb-2">{interest.name}</h3>
                    <p className="text-sm text-gray-600">{interest.description}</p>
                    {selectedInterests.includes(interest.id) && (
                      <div className="absolute top-3 right-3 text-blue-500">
                        ✓
                      </div>
                    )}
                  </button>
                ))}
              </div>
              <p className="text-sm text-gray-500 mt-6 text-center">
                Selected {selectedInterests.length} topic{selectedInterests.length !== 1 ? 's' : ''}
              </p>
            </div>
          </OnboardingStep>
        )}

        {currentStep === 4 && (
          <OnboardingStep
            step={4}
            totalSteps={4}
            title={`You're all set, ${userName}!`}
            onNext={handleComplete}
            onPrev={prevStep}
            nextLabel="Start Learning"
            isLastStep={true}
          >
            <div className="text-center">
              <div className="text-8xl mb-8">🎉</div>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Perfect! We've personalized your experience based on your interests in{' '}
                <span className="font-semibold text-blue-600">
                  {selectedInterests.map(id => interests.find(i => i.id === id)?.name).join(', ')}
                </span>.
              </p>
              <div className="premium-summary-card mb-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">What's next?</h3>
                <div className="space-y-3 text-left">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold">1</div>
                    <span className="text-gray-600">Start with your first cultural lesson</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold">2</div>
                    <span className="text-gray-600">Earn XP and level up as you learn</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold">3</div>
                    <span className="text-gray-600">Generate custom lessons on any topic</span>
                  </div>
                </div>
              </div>
              <p className="text-gray-500">
                Ready to become a cultural expert? Let's begin your journey!
              </p>
            </div>
          </OnboardingStep>
        )}
      </div>
    </div>
  );
}