/**
 * ====================================================================
 * ERROR BANNER COMPONENT
 * ====================================================================
 * 
 * Displays error messages with retry functionality.
 * 
 * Why separate this?
 * - Consistent error UI across the app
 * - Reusable for different types of errors
 * - Easy to add features like auto-dismiss or different severity levels
 */

import React from 'react';
import { AlertTriangle } from 'lucide-react';

/**
 * Props for the ErrorBanner component
 */
interface ErrorBannerProps {
  message: string;          // The error message to display
  onRetry?: () => void;     // Optional retry function (? = optional)
}

/**
 * ErrorBanner Component
 * 
 * Displays an error message with an optional retry button.
 * 
 * @param message - Error message to show
 * @param onRetry - Function to call when user clicks retry
 */
const ErrorBanner: React.FC<ErrorBannerProps> = ({ message, onRetry }) => {
  return (
    // Yellow background for warnings/errors
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
      {/* Flex layout: icon on left, content in middle, retry button on right */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          {/* Warning icon */}
          <AlertTriangle className="h-5 w-5 text-yellow-400 mr-3" />
          
          {/* Error message */}
          <p className="text-sm text-yellow-700">
            <strong>Warning:</strong> {message}
          </p>
        </div>
        
        {/* Retry button - only shows if onRetry function is provided */}
        {/* This is called "conditional rendering" - only render if condition is true */}
        {onRetry && (
          <button 
            onClick={onRetry}  // Call the retry function when clicked
            className="text-sm text-yellow-700 underline hover:text-yellow-900"
          >
            Retry
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorBanner;