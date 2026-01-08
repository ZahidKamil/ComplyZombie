/**
 * ====================================================================
 * CRITICAL FINDINGS COMPONENT
 * ====================================================================
 * 
 * Displays security findings grouped by severity with collapsible sections.
 * 
 * Features:
 * - Groups findings by severity (Critical, High, Medium, Low)
 * - Each severity is collapsible (click to expand/collapse)
 * - Critical section expanded by default
 * - Framework filtering (only shows findings for selected framework)
 * - Count badges show number of findings in each severity
 * - Empty state when no findings
 * 
 * Why this design?
 * - Long lists of findings can be overwhelming
 * - Collapsible sections let users focus on what matters
 * - Severity grouping prioritizes critical issues
 * - Framework filtering reduces noise
 * 
 * React Concepts Used:
 * - useState for managing collapsed/expanded state
 * - useMemo for expensive filtering computations
 * - Conditional rendering for empty states
 * - Array methods (filter, reduce) for data transformation
 */

import React, { useState, useMemo } from 'react';
import { AlertTriangle, CheckCircle, ChevronDown, ChevronRight } from 'lucide-react';
import type { CriticalFinding } from '../../types/compliance';

/**
 * Props for the CriticalFindings component
 */
interface CriticalFindingsProps {
  findings: CriticalFinding[];     // Array of all findings from the report
  selectedFramework: string;        // Currently selected framework filter
}

/**
 * Type definition for grouped findings.
 * We'll organize findings into an object with severity as keys.
 */
interface GroupedFindings {
  critical: CriticalFinding[];
  high: CriticalFinding[];
  medium: CriticalFinding[];
  low: CriticalFinding[];
}

/**
 * CriticalFindings Component
 * 
 * Displays security findings in collapsible severity groups.
 */
const CriticalFindings: React.FC<CriticalFindingsProps> = ({ 
  findings, 
  selectedFramework 
}) => {
  
  /**
   * State to track which sections are expanded.
   * Using an object where keys are severity levels.
   * 
   * Example: { critical: true, high: false, medium: false, low: false }
   * 
   * Why use an object instead of multiple useState calls?
   * - Easier to manage multiple booleans
   * - Can toggle individual sections
   * - Cleaner code
   */
  const [expandedSections, setExpandedSections] = useState<{
    critical: boolean;
    high: boolean;
    medium: boolean;
    low: boolean;
  }>({
    critical: true,   // Critical expanded by default
    high: false,
    medium: false,
    low: false
  });
  
  
  /**
   * Toggle a section's expanded/collapsed state.
   * 
   * @param severity - Which section to toggle
   * 
   * How it works:
   * 1. Takes current state
   * 2. Creates a new object with updated value
   * 3. Sets the new state
   * 
   * The spread operator (...) copies all existing values,
   * then we override just the one we want to change.
   */
  const toggleSection = (severity: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,                          // Copy all existing values
      [severity]: !prev[severity]       // Toggle just this one
    }));
  };
  
  
  /**
   * Filter findings by selected framework.
   * 
   * useMemo is a React hook that caches expensive computations.
   * It only recalculates when dependencies change (findings or selectedFramework).
   * 
   * Why useMemo?
   * - Filtering can be expensive with lots of findings
   * - Prevents unnecessary recalculations on every render
   * - Only recomputes when input data actually changes
   * 
   * Dependencies array [findings, selectedFramework]:
   * - When either changes, recalculate
   * - When neither changes, use cached result
   */
  const filteredFindings = useMemo(() => {
    // If "All" is selected, show everything
    if (selectedFramework === 'All') {
      return findings;
    }
    
    // Otherwise, only show findings for the selected framework
    // We check if the finding's framework matches the selected one
    return findings.filter(finding => 
      finding.framework === selectedFramework
    );
  }, [findings, selectedFramework]);  // Recalculate when these change
  
  
  /**
   * Group filtered findings by severity.
   * 
   * useMemo again for performance optimization.
   * 
   * We use reduce() to transform an array into an object.
   * Starting with empty arrays for each severity, we push
   * each finding into the appropriate array based on its severity.
   * 
   * reduce() is like a swiss army knife - it can build any data structure.
   */
  const groupedFindings = useMemo(() => {
    // Start with empty arrays for each severity
    const groups: GroupedFindings = {
      critical: [],
      high: [],
      medium: [],
      low: []
    };
    
    // Loop through filtered findings and group them
    filteredFindings.forEach(finding => {
      // Normalize severity to lowercase for consistency
      const severity = finding.severity.toLowerCase() as keyof GroupedFindings;
      
      // Add finding to the appropriate array
      // We check if the array exists first (defensive programming)
      if (groups[severity]) {
        groups[severity].push(finding);
      }
    });
    
    return groups;
  }, [filteredFindings]);  // Recalculate when filtered findings change
  
  
  /**
   * Helper function to get the color classes for severity badges.
   * 
   * @param severity - The severity level
   * @returns Object with Tailwind classes for background and text
   */
  const getSeverityColors = (severity: string) => {
    switch(severity) {
      case 'critical':
        return {
          bg: 'bg-purple-600',
          text: 'text-white',
          border: 'border-purple-200',
          bgLight: 'bg-purple-50'
        };
      case 'high':
        return {
          bg: 'bg-red-600',
          text: 'text-white',
          border: 'border-red-200',
          bgLight: 'bg-red-50'
        };
      case 'medium':
        return {
          bg: 'bg-orange-500',
          text: 'text-white',
          border: 'border-orange-200',
          bgLight: 'bg-orange-50'
        };
      case 'low':
        return {
          bg: 'bg-yellow-500',
          text: 'text-white',
          border: 'border-yellow-200',
          bgLight: 'bg-yellow-50'
        };
      default:
        return {
          bg: 'bg-gray-500',
          text: 'text-white',
          border: 'border-gray-200',
          bgLight: 'bg-gray-50'
        };
    }
  };
  
  
  /**
   * Renders a single collapsible section for a severity level.
   * 
   * @param severity - The severity level
   * @param label - Display label for the section
   * @param findingsArray - Array of findings for this severity
   */
  const renderSection = (
    severity: keyof GroupedFindings,
    label: string,
    findingsArray: CriticalFinding[]
  ) => {
    // Get color scheme for this severity
    const colors = getSeverityColors(severity);
    
    // Check if this section is expanded
    const isExpanded = expandedSections[severity];
    
    // Get count of findings in this section
    const count = findingsArray.length;
    
    return (
      <div key={severity} className="mb-4">
        {/* 
          Section Header - Clickable to expand/collapse
          
          Why a button?
          - Semantic HTML (clickable = button)
          - Accessibility (keyboard navigation, screen readers)
          - No need for onClick on div
        */}
        <button
          onClick={() => toggleSection(severity)}
          className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
        >
          {/* Left side: Icon, Label, Count */}
          <div className="flex items-center gap-3">
            {/* 
              Chevron icon - points down when expanded, right when collapsed
              Conditional rendering with ternary operator
            */}
            {isExpanded ? (
              <ChevronDown className="w-5 h-5 text-gray-600" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-600" />
            )}
            
            {/* Severity label */}
            <span className="font-semibold text-gray-900">{label}</span>
            
            {/* 
              Count badge
              Shows number of findings in this severity
              Different color for each severity level
            */}
            <span className={`px-2 py-1 rounded-full text-xs font-bold ${colors.bg} ${colors.text}`}>
              {count}
            </span>
          </div>
          
          {/* Right side: Status indicator */}
          {count === 0 ? (
            <CheckCircle className="w-5 h-5 text-green-600" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-orange-600" />
          )}
        </button>
        
        {/* 
          Section Content - Only rendered when expanded
          
          Conditional rendering with && operator:
          - If isExpanded is true, render the content
          - If isExpanded is false, render nothing
          
          This is more efficient than using display:none
          because React doesn't create the DOM elements at all
        */}
        {isExpanded && (
          <div className="mt-2 space-y-3">
            {/* 
              Empty state - shown when no findings in this section
              
              Another conditional: if count is 0, show message
            */}
            {count === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <p>No {label.toLowerCase()} findings! 🎉</p>
              </div>
            ) : (
              // Otherwise, map through findings and render each one
              findingsArray.map((finding, index) => (
                <div 
                  key={index} 
                  className={`border ${colors.border} rounded-lg p-4 ${colors.bgLight} hover:shadow-md transition-shadow`}
                >
                  {/* Finding header: severity badge and timestamp */}
                  <div className="flex items-start justify-between mb-2">
                    {/* Severity badge */}
                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${colors.bg} ${colors.text}`}>
                      {finding.severity}
                    </span>
                    
                    {/* Timestamp - formatted to readable date */}
                    <span className="text-xs text-gray-500">
                      {new Date(finding.timestamp).toLocaleString()}
                    </span>
                  </div>
                  
                  {/* Finding title */}
                  <h3 className="font-bold text-gray-900 mb-1">
                    {finding.control_name}
                  </h3>
                  
                  {/* Finding details/description */}
                  <p className="text-sm text-gray-700 mb-2">
                    {finding.details}
                  </p>
                  
                  {/* 
                    Metadata tags
                    Flex with wrap allows tags to flow to next line if needed
                  */}
                  <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                    {/* Control ID tag */}
                    <span className="bg-white px-2 py-1 rounded">
                      Control: {finding.control_id}
                    </span>
                    
                    {/* Framework tag */}
                    <span className="bg-white px-2 py-1 rounded">
                      Framework: {finding.framework}
                    </span>
                    
                    {/* Resource tag */}
                    <span className="bg-white px-2 py-1 rounded">
                      Resource: {finding.resource}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    );
  };
  
  
  /**
   * Main component render
   */
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Section header */}
      <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
        <AlertTriangle className="w-6 h-6 text-red-600" />
        Critical Findings
        {/* Show framework filter if active */}
        {selectedFramework !== 'All' && (
          <span className="text-sm font-normal text-gray-600 ml-2">
            (Filtered: {selectedFramework})
          </span>
        )}
      </h2>
      
      {/* 
        Render all severity sections
        We call renderSection for each severity level
      */}
      {renderSection('critical', 'Critical', groupedFindings.critical)}
      {renderSection('high', 'High', groupedFindings.high)}
      {renderSection('medium', 'Medium', groupedFindings.medium)}
      {renderSection('low', 'Low', groupedFindings.low)}
      
      {/* 
        Overall empty state - shown when NO findings at all
        Only shows if all groups are empty
      */}
      {filteredFindings.length === 0 && (
        <div className="text-center py-12">
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <p className="text-gray-600 text-lg mb-2">
            No findings for {selectedFramework}! 🎉
          </p>
          <p className="text-gray-500 text-sm">
            All controls are passing for this framework.
          </p>
        </div>
      )}
    </div>
  );
};

export default CriticalFindings;