/**
 * ====================================================================
 * DASHBOARD HEADER COMPONENT
 * ====================================================================
 * 
 * Displays the dashboard title, subtitle, scan time, and framework filter.
 * 
 * Why separate this?
 * - Keeps the header logic isolated
 * - Easy to update styling/layout in one place
 * - Makes the main dashboard component cleaner
 * 
 * Props:
 * - scanTime: When the last compliance scan ran
 * - frameworks: List of available frameworks to filter by
 * - selectedFramework: Currently selected framework
 * - onFrameworkChange: Function to call when user changes the filter
 */

import React from 'react';
import { Shield, Filter } from 'lucide-react';

/**
 * TypeScript interface defining what props this component accepts.
 * Think of this as a contract - the component promises to accept these props.
 */
interface HeaderProps {
  scanTime: string;                          // ISO string like "2026-01-04T09:00:39Z"
  frameworks: string[];                      // Array of framework names ["SOC 2", "ISO 27001", ...]
  selectedFramework: string;                 // Currently selected framework (or "All")
  onFrameworkChange: (framework: string) => void;  // Callback function when selection changes
}

/**
 * Header Component
 * 
 * This is a "controlled component" - it doesn't manage its own state.
 * Instead, the parent component (ComplianceDashboard) tells it what to display
 * and what to do when the user interacts with it.
 * 
 * This pattern is called "lifting state up" in React.
 */
const Header: React.FC<HeaderProps> = ({ 
  scanTime, 
  frameworks, 
  selectedFramework, 
  onFrameworkChange 
}) => {
  
  /**
   * Handler for when the dropdown selection changes.
   * This extracts the value from the event and calls the parent's callback.
   * 
   * Why not call onFrameworkChange directly?
   * Because the onChange event passes an Event object, not just the value.
   * We need to extract e.target.value first.
   */
  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFrameworkChange(e.target.value);
  };
  
  return (
    // mb-8 = margin-bottom 8 (2rem = 32px)
    <div className="mb-8">
      {/* Flex container: items on left and right with space between */}
      <div className="flex items-center justify-between">
        
        {/* LEFT SIDE: Title and info */}
        <div>
          {/* 
            Main title with shield icon
            flex = flexbox layout
            items-center = vertically center items
            gap-3 = space between items (12px)
          */}
          <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
            {/* Shield icon from lucide-react */}
            <Shield className="w-10 h-10 text-blue-600" />
            GRC Compliance Dashboard
          </h1>
          
          {/* Subtitle */}
          <p className="text-gray-600 mt-2">
            Multi-Cloud Security Posture Management
          </p>
          
          {/* 
            Scan timestamp
            We convert the ISO string to a readable format
            toLocaleString() formats it based on user's locale (e.g., "1/4/2026, 9:00:39 AM")
          */}
          <p className="text-sm text-gray-500 mt-1">
            Last scan: {new Date(scanTime).toLocaleString()}
          </p>
        </div>
        
        
        {/* RIGHT SIDE: Framework Filter Dropdown */}
        <div className="flex items-center gap-3">
          {/* Filter icon */}
          <Filter className="w-5 h-5 text-gray-600" />
          
          {/* 
            Dropdown select element
            
            Tailwind classes explained:
            - px-4 py-2: padding horizontal 4 (1rem), vertical 2 (0.5rem)
            - border border-gray-300: 1px gray border
            - rounded-lg: large border radius (0.5rem)
            - focus:ring-2: on focus, show 2px ring
            - focus:ring-blue-500: ring color is blue
            - focus:border-transparent: remove default border on focus
          */}
          <select
            value={selectedFramework}        // Controlled input - value comes from props
            onChange={handleFilterChange}    // Call our handler when selection changes
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {/* Default option to show all frameworks */}
            <option value="All">All Frameworks</option>
            
            {/* 
              Loop through frameworks array and create an option for each
              
              .map() is JavaScript's way of transforming an array
              For each framework, we create an <option> element
              
              "key" prop is REQUIRED by React for list items
              It helps React efficiently update the DOM when the list changes
            */}
            {frameworks.map(fw => (
              <option key={fw} value={fw}>
                {fw}
              </option>
            ))}
          </select>
        </div>
        
      </div>
    </div>
  );
};

export default Header;