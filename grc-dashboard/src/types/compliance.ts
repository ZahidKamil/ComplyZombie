// This file defines the STRUCTURE of our compliance data
// Think of it as a blueprint or schema

// ==================== CONTROL ====================
// A "control" is a single security check (e.g., "Is MFA enabled?")
export interface Control {
  control_id: string;           // Example: "IAM-001"
  control_name: string;          // Example: "MFA Enforcement"
  status: 'passed' | 'failed' | 'warning' | 'error';  // Only these 4 values allowed
  frameworks: string[];          // Example: ["SOC 2", "ISO 27001"]
  framework: string;             // Primary framework (backwards compatibility)
  details: string;               // Explanation of the result
  timestamp: string;             // When this was checked
  bucket?: string;               // Optional - only for S3 controls
  resource?: string;             // Optional - only for EC2/CloudTrail controls
}

// ==================== FRAMEWORK ====================
// Framework scores (e.g., "SOC 2 is 78% compliant")
export interface Framework {
  name: string;                  // Example: "SOC 2"
  score: number;                 // Example: 78.5
  total: number;                 // Total controls that apply to this framework
  passed: number;                // How many passed
  failed: number;                // How many failed
  warnings: number;              // How many warnings
}

// ==================== COMPLIANCE REPORT ====================
// The complete report structure from Lambda/S3
export interface ComplianceReport {
  scan_metadata: {
    scan_time: string;           // When the scan ran
    scanner_version: string;     // Example: "2.0"
    execution_id: string;        // Lambda execution ID
    aws_account: string;         // AWS account number
  };
  executive_summary: {
    overall_score: number;       // Example: 73.5
    total_checks: number;        // Example: 34
    passed: number;              // Example: 25
    failed: number;              // Example: 5
    warnings: number;            // Example: 4
    risk_level: 'LOW' | 'MEDIUM' | 'HIGH';  // Only these 3 values
  };
  framework_scores: Framework[]; // Array of framework scores
  critical_findings: CriticalFinding[];  // Array of critical issues
  detailed_controls: Control[];  // Array of all controls checked
}

// ==================== CRITICAL FINDING ====================
// High-priority security issues that need immediate attention
export interface CriticalFinding {
  severity: 'critical' |'high' | 'medium' | 'low';
  control_id: string;
  control_name: string;
  framework: string;
  details: string;
  resource: string;              // What AWS resource has the issue
  timestamp: string;
}