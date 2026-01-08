/**
 * ====================================================================
 * SUMMARY CARDS COMPONENT
 * ====================================================================
 * 
 * Displays 4 metric cards showing key compliance statistics:
 * 1. Overall Score - The aggregate compliance percentage
 * 2. Passed Controls - Number of controls that passed
 * 3. Failed Controls - Number of controls that failed (need immediate action)
 * 4. Warnings - Number of controls with warnings (need attention)
 * 
 * Why separate this?
 * - Keeps the card layout logic isolated
 * - Easy to reorder, add, or remove cards
 * - Makes testing easier (can test cards independently)
 * - Improves code readability in main dashboard
 * 
 * Design Pattern: "Presentational Component"
 * - Receives data via props
 * - Doesn't fetch data or manage state
 * - Just displays what it's told to display
 */

import React from 'react';
import { TrendingUp, CheckCircle, AlertTriangle } from 'lucide-react';

/**
 * TypeScript interface for the executive summary data.
 * This matches the structure from our Lambda reports.
 */
interface ExecutiveSummary {
  overall_score: number;      // e.g., 73.5
  total_checks: number;       // e.g., 34
  passed: number;             // e.g., 25
  failed: number;             // e.g., 5
  warnings: number;           // e.g., 4
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH';  // Only these 3 values allowed
}

/**
 * Props this component accepts
 */
interface SummaryCardsProps {
  summary: ExecutiveSummary;
}

/**
 * SummaryCards Component
 * 
 * Displays a responsive grid of 4 metric cards.
 * On mobile (1 column), on medium screens and up (4 columns).
 * 
 * @param summary - The executive summary data from the compliance report
 */
const SummaryCards: React.FC<SummaryCardsProps> = ({ summary }) => {
  
  /**
   * Helper function to determine the color for the risk level text.
   * 
   * @param level - The risk level (LOW, MEDIUM, or HIGH)
   * @returns Tailwind class for text color
   * 
   * Why a function?
   * - Keeps the JSX cleaner
   * - Reusable if we need it elsewhere
   * - Easy to test
   */
  const getRiskColor = (level: string): string => {
    switch(level) {
      case 'LOW': 
        return 'text-green-600';
      case 'MEDIUM': 
        return 'text-yellow-600';
      case 'HIGH': 
        return 'text-red-600';
      default: 
        return 'text-gray-600';
    }
  };
  
  return (
    // Grid container
    // grid-cols-1: 1 column on mobile (default)
    // md:grid-cols-4: 4 columns on medium screens and up (768px+)
    // gap-6: 1.5rem (24px) space between grid items
    // mb-8: 2rem (32px) margin bottom
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      
      {/* ============================================================
          CARD 1: OVERALL SCORE
          ============================================================ */}
      <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-600">
        {/* 
          Flex container for icon and text
          items-center: vertically center items
          justify-between: space items to edges
        */}
        <div className="flex items-center justify-between">
          <div>
            {/* Label */}
            <p className="text-sm text-gray-600 mb-1">Overall Score</p>
            
            {/* 
              Main metric
              toFixed(1) formats the number to 1 decimal place
              e.g., 73.456 becomes "73.5"
            */}
            <p className="text-4xl font-bold text-blue-600">
              {summary.overall_score.toFixed(1)}%
            </p>
          </div>
          
          {/* Icon on the right */}
          <TrendingUp className="w-8 h-8 text-blue-600" />
        </div>
        
        {/* 
          Risk level indicator
          Uses our helper function to determine text color
          Template literal (backticks) lets us combine strings and expressions
        */}
        <p className={`text-sm font-medium mt-2 ${getRiskColor(summary.risk_level)}`}>
          Risk Level: {summary.risk_level}
        </p>
      </div>
      
      
      {/* ============================================================
          CARD 2: PASSED CONTROLS
          ============================================================ */}
      <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-600">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-1">Passed</p>
            
            {/* Number of passed controls */}
            <p className="text-4xl font-bold text-green-600">
              {summary.passed}
            </p>
          </div>
          
          {/* Checkmark icon */}
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        
        {/* Context: show total checks */}
        <p className="text-sm text-gray-600 mt-2">
          of {summary.total_checks} controls
        </p>
      </div>
      
      
      {/* ============================================================
          CARD 3: FAILED CONTROLS
          ============================================================ */}
      <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-red-600">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-1">Failed</p>
            
            {/* Number of failed controls */}
            <p className="text-4xl font-bold text-red-600">
              {summary.failed}
            </p>
          </div>
          
          {/* Alert triangle icon */}
          <AlertTriangle className="w-8 h-8 text-red-600" />
        </div>
        
        {/* Context message */}
        <p className="text-sm text-gray-600 mt-2">
          Require immediate action
        </p>
      </div>
      
      
      {/* ============================================================
          CARD 4: WARNINGS
          ============================================================ */}
      <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-yellow-600">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-1">Warnings</p>
            
            {/* Number of warnings */}
            <p className="text-4xl font-bold text-yellow-600">
              {summary.warnings}
            </p>
          </div>
          
          {/* Alert triangle icon (yellow) */}
          <AlertTriangle className="w-8 h-8 text-yellow-600" />
        </div>
        
        {/* Context message */}
        <p className="text-sm text-gray-600 mt-2">
          Need attention
        </p>
      </div>
      
    </div>
  );
};

export default SummaryCards;