// import ComplianceDashboard from './components/ComplianceDashboard'

// function App() {
//   return <ComplianceDashboard />
// }

// export default App

// import LoadingSpinner from './components/common/LoadingSpinner'
// import ErrorBanner from './components/common/ErrorBanner'

// function App() {
//   return (
//     <div>
//       {/* Test LoadingSpinner */}
//       {/* <LoadingSpinner message="Testing loading spinner..." /> */}
      
//       {/* Test ErrorBanner */}
//       {<ErrorBanner 
//         message="This is a test error message" 
//         onRetry={() => alert('Retry clicked!')}
//       />}
//     </div>
//   )
// }

// export default App
import { useState } from 'react'
import Header from './components/dashboard/Header'
import SummaryCards from './components/dashboard/SummaryCards'
import CriticalFindings from './components/dashboard/CriticalFindings'

function App() {
  const [selectedFramework, setSelectedFramework] = useState('All');
  
  const frameworks = ['SOC 2', 'ISO 27001', 'NIST CSF'];
  const scanTime = new Date().toISOString();
  
  const summary = {
    overall_score: 73.5,
    total_checks: 34,
    passed: 25,
    failed: 5,
    warnings: 4,
    risk_level: 'MEDIUM' as const
  };
  
  // Mock critical findings with different severities
  const findings = [
    {
      severity: 'critical' as const,
      control_id: 'IAM-001',
      control_name: 'Root Account Access',
      framework: 'SOC 2',
      details: 'Root account accessed without MFA - CRITICAL SECURITY RISK',
      resource: 'AWS Root Account',
      timestamp: new Date().toISOString()
    },
    {
      severity: 'high' as const,
      control_id: 'S3-002',
      control_name: 'Public S3 Bucket',
      framework: 'SOC 2',
      details: 'S3 bucket "data-prod" allows public access',
      resource: 'data-prod',
      timestamp: new Date().toISOString()
    },
    {
      severity: 'high' as const,
      control_id: 'EC2-001',
      control_name: 'Open Security Group',
      framework: 'ISO 27001',
      details: 'Security group allows SSH from 0.0.0.0/0',
      resource: 'sg-12345678',
      timestamp: new Date().toISOString()
    },
    {
      severity: 'medium' as const,
      control_id: 'IAM-004',
      control_name: 'Password Policy',
      framework: 'NIST CSF',
      details: 'Password minimum length is less than 14 characters',
      resource: 'Account Password Policy',
      timestamp: new Date().toISOString()
    },
    {
      severity: 'low' as const,
      control_id: 'S3-003',
      control_name: 'Bucket Versioning',
      framework: 'SOC 2',
      details: 'S3 bucket does not have versioning enabled',
      resource: 'logs-bucket',
      timestamp: new Date().toISOString()
    }
  ];
  
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <Header
          scanTime={scanTime}
          frameworks={frameworks}
          selectedFramework={selectedFramework}
          onFrameworkChange={setSelectedFramework}
        />
        
        <SummaryCards summary={summary} />
        
        <CriticalFindings 
          findings={findings}
          selectedFramework={selectedFramework}
        />
      </div>
    </div>
  )
}

export default App