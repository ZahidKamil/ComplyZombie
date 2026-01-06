import type { ComplianceReport } from '../types/compliance';

/**
 * Service to fetch compliance reports from S3
 * 
 * Your S3 bucket structure:
 * s3://your-bucket-name/
 *   └── reports/
 *       ├── compliance-20260103-120000.json
 *       ├── compliance-20260102-090000.json
 *       └── ...
 */

// Configuration
const S3_BUCKET_NAME = 'grc-compliance-reports'; // UPDATE THIS
const S3_REGION = 'us-east-1'; // UPDATE THIS if different

/**
 * Constructs the public S3 URL for a report
 * Note: This assumes your S3 bucket has public read access
 * If private, we'll need to use AWS SDK with credentials
 */
function getS3Url(key: string): string {
  return `https://${S3_BUCKET_NAME}.s3.${S3_REGION}.amazonaws.com/${key}`;
}

/**
 * Fetch the latest compliance report from S3
 * 
 * For now, we'll use a fixed filename.
 * Later we can add: list all reports, get latest, etc.
 */
export async function fetchLatestReport(): Promise<ComplianceReport> {
  try {
    // Option 1: If you know the exact filename
    const reportKey = 'reports/compliance-20260104-090039.json'; // UPDATE WITH YOUR ACTUAL FILENAME
    
    const url = getS3Url(reportKey);
    
    console.log('Fetching report from:', url);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch report: ${response.status} ${response.statusText}`);
    }
    
    const data: ComplianceReport = await response.json();
    
    console.log('✅ Successfully loaded report from S3');
    console.log('📊 Overall Score:', data.executive_summary.overall_score + '%');
    console.log('📅 Scan Time:', new Date(data.scan_metadata.scan_time).toLocaleString());
    
    
    return data;
    
  } catch (error) {
    console.error('Error fetching S3 report:', error);
    throw error;
  }
}

/**
 * Alternative: Fetch a specific report by timestamp
 */
export async function fetchReportByTimestamp(timestamp: string): Promise<ComplianceReport> {
  const reportKey = `reports/compliance-${timestamp}.json`;
  const url = getS3Url(reportKey);
  
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Report not found: ${timestamp}`);
  }
  
  return await response.json();
}

/**
 * Mock data as fallback (for development)
 */
export function getMockReport(): ComplianceReport {
  return {
    scan_metadata: {
      scan_time: new Date().toISOString(),
      scanner_version: '2.0',
      execution_id: 'mock-execution-123',
      aws_account: '123456789012'
    },
    executive_summary: {
      overall_score: 73.5,
      total_checks: 34,
      passed: 25,
      failed: 5,
      warnings: 4,
      risk_level: 'MEDIUM'
    },
    framework_scores: [
      { name: 'SOC 2', score: 78, total: 20, passed: 15, failed: 3, warnings: 2 },
      { name: 'ISO 27001', score: 72, total: 25, passed: 18, failed: 5, warnings: 2 },
      { name: 'NIST CSF', score: 70, total: 23, passed: 16, failed: 5, warnings: 2 },
      { name: 'PCI-DSS', score: 80, total: 15, passed: 12, failed: 2, warnings: 1 },
      { name: 'HIPAA', score: 75, total: 12, passed: 9, failed: 2, warnings: 1 }
    ],
    critical_findings: [
      {
        severity: 'high',
        control_id: 'S3-002-data-bucket',
        control_name: 'Public Access Block',
        framework: 'SOC 2',
        details: 'Bucket allows public access',
        resource: 'data-bucket',
        timestamp: new Date().toISOString()
      }
    ],
    detailed_controls: [
      {
        control_id: 'IAM-001',
        control_name: 'MFA Enforcement',
        status: 'passed',
        frameworks: ['SOC 2', 'ISO 27001', 'NIST CSF'],
        framework: 'SOC 2',
        details: 'Root account has MFA enabled',
        timestamp: new Date().toISOString()
      }
    ]
  };
}