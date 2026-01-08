/**
 * ====================================================================
 * LOADING SPINNER COMPONENT
 * ====================================================================
 * 
 * A reusable loading indicator shown while data is being fetched.
 * 
 * Why separate this?
 * - Keeps loading UI consistent across the app
 * - Easy to update loading animation in one place
 * - Can be reused in other components
 */

import React from 'react';
import { Shield } from 'lucide-react';

/**
 * Props (properties) this component accepts
 * Props are like function parameters for components
 */
interface LoadingSpinnerProps {
  message?: string;  // Optional custom message (? makes it optional)
}

/**
 * LoadingSpinner Component
 * 
 * @param message - Custom loading message (defaults to "Loading...")
 */
const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ message = "Loading compliance data from S3..." }) => {
  return (
    // Flexbox centering: min-h-screen makes it full height, flex centers content
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        {/* Shield icon with pulse animation (animate-pulse is a Tailwind utility) */}
        <Shield className="w-16 h-16 text-blue-600 mx-auto mb-4 animate-pulse" />
        
        {/* Loading message */}
        <p className="text-gray-600 text-lg">{message}</p>
      </div>
    </div>
  );
};

export default LoadingSpinner;