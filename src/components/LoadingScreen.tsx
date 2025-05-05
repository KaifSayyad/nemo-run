import React from 'react';

interface LoadingScreenProps {
  isLoading: boolean;
  progress?: number;
  message?: string;
  children: React.ReactNode;
}

/**
 * LoadingScreen component to show loading state
 */
const LoadingScreen: React.FC<LoadingScreenProps> = ({
  isLoading,
  progress = -1,
  message = 'Loading...',
  children
}) => {
  if (!isLoading) {
    return <>{children}</>;
  }

  return (
    <div className="loading-screen">
      <div className="loading-content">
        <h2 className="loading-title">Nemo Run</h2>
        <div className="loading-spinner"></div>
        <p className="loading-message">{message}</p>
        
        {progress >= 0 && (
          <div className="loading-progress-container">
            <div
              className="loading-progress-bar"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progress}
            ></div>
            <span className="loading-progress-text">{Math.round(progress)}%</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoadingScreen;

