import { useState, useEffect } from 'react';

const LoadingBar = ({ message = 'Loading...', progress = null, showMessage = true }) => {
  return (
    <div className="w-full">
      {/* Top Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-2 z-50 bg-gray-100/80 backdrop-blur-sm overflow-hidden">
        {progress !== null ? (
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500 ease-out shadow-lg"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          ></div>
        ) : (
          <div className="absolute h-full w-1/3 bg-gradient-to-r from-transparent via-blue-500 to-transparent animate-indeterminate-progress"></div>
        )}
      </div>
      
      {/* Loading Message Card */}
      {showMessage && (
        <div className="flex flex-col items-center justify-center p-8 bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/60 animate-fade-in">
          <div className="flex items-center space-x-4 mb-5">
            <LoadingSpinner size="lg" />
            <span className="text-xl font-semibold text-gray-800">{message}</span>
          </div>
          {progress !== null && (
            <div className="w-full max-w-md">
              <div className="w-full bg-gray-100 rounded-full h-3 shadow-inner">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500 ease-out shadow-md"
                  style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                ></div>
              </div>
              <div className="flex justify-end text-sm font-medium text-gray-600 mt-2">
                <span>{Math.round(progress)}%</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const LoadingSpinner = ({ size = 'md', message = '', className = '' }) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6', 
    lg: 'h-8 w-8',
    xl: 'h-12 w-12'
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className={`animate-spin rounded-full border-b-2 border-blue-600 ${sizeClasses[size]}`}></div>
      {message && <span className="text-gray-700">{message}</span>}
    </div>
  );
};

const LoadingOverlay = ({ message = 'Loading...', progress = null }) => {
  return (
    <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl p-8 text-center max-w-sm mx-auto border border-gray-200/60">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <div className="text-lg font-medium text-gray-800">{message}</div>
          {progress !== null && (
            <div className="w-full">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Progress</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Hook for managing loading states with progress
const useLoadingProgress = (steps = []) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const startLoading = (stepMessages = steps) => {
    setCurrentStep(0);
    setProgress(0);
    setMessage(stepMessages[0] || 'Loading...');
    setIsLoading(true);
  };

  const nextStep = (stepMessages = steps) => {
    const newStep = currentStep + 1;
    const newProgress = (newStep / stepMessages.length) * 100;
    
    setCurrentStep(newStep);
    setProgress(newProgress);
    
    if (newStep < stepMessages.length) {
      setMessage(stepMessages[newStep]);
    } else {
      setMessage('Almost done...');
    }
  };

  const finishLoading = () => {
    setProgress(100);
    setMessage('Complete!');
    
    setTimeout(() => {
      setIsLoading(false);
      setCurrentStep(0);
      setProgress(0);
      setMessage('');
    }, 500);
  };

  const resetLoading = () => {
    setIsLoading(false);
    setCurrentStep(0);
    setProgress(0);
    setMessage('');
  };

  return {
    isLoading,
    progress,
    message,
    currentStep,
    startLoading,
    nextStep,
    finishLoading,
    resetLoading
  };
};

// Default export (backward compatibility)
export default function ProgressBar({ message, progress, showMessage }) {
  return <LoadingBar message={message} progress={progress} showMessage={showMessage} />;
}

// Named exports
export { LoadingBar, LoadingSpinner, LoadingOverlay, useLoadingProgress };
