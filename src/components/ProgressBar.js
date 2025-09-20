import { useState, useEffect } from 'react';

const LoadingBar = ({ message = 'Loading...', progress = null, showMessage = true }) => {
  return (
    <div className="w-full">
      {/* Top Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 z-50">
        <div className="absolute w-full h-full bg-blue-100"></div>
        {progress !== null ? (
          <div 
            className="absolute h-full bg-primary transition-all duration-300 ease-out"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          ></div>
        ) : (
          <div className="absolute h-full bg-primary animate-indeterminate-progress"></div>
        )}
      </div>
      
      {/* Loading Message Card */}
      {showMessage && (
        <div className="flex flex-col items-center justify-center p-8 bg-white rounded-2xl shadow-lg border border-gray-200 animate-pulse">
          <div className="flex items-center space-x-3 mb-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="text-lg font-medium text-gray-700">{message}</span>
          </div>
          {progress !== null && (
            <div className="w-full max-w-xs">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Progress</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                ></div>
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
      <div className={`animate-spin rounded-full border-b-2 border-primary ${sizeClasses[size]}`}></div>
      {message && <span className="text-gray-600">{message}</span>}
    </div>
  );
};

const LoadingOverlay = ({ message = 'Loading...', progress = null }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 text-center max-w-sm mx-auto">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <div className="text-lg font-medium text-gray-700">{message}</div>
          {progress !== null && (
            <div className="w-full">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Progress</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-primary h-3 rounded-full transition-all duration-300 ease-out"
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
