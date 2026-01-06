// ==================== IMPORTS ====================
import React, { useState, useEffect } from 'react';
// useState: Manages data that can change (like loading state, selected framework)
// useEffect: Runs code when component loads (like fetching data)

import { Shield, AlertTriangle, CheckCircle, TrendingUp, Filter } from 'lucide-react';
// Icons we'll use in the UI

import type { ComplianceReport, Framework, Control } from '../types/compliance';
// Import our TypeScript types - now TypeScript knows the data structure!

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
// Chart library for visualizing framework scores

import { fetchLatestReport, getMockReport } from '../services/s3Service';
// ==================== COMPONENT DEFINITION ====================
// React.FC means "React Functional Component"
// This is the modern way to write React components (hooks-based)
const ComplianceDashboard: React.FC = () => {
  
  // ==================== STATE MANAGEMENT ====================
  // "State" is data that can change and triggers re-renders
  
  // Store the full compliance report
  // useState<Type> tells TypeScript what type this state will be
  // | null means "it could be null initially"
  const [report, setReport] = useState<ComplianceReport | null>(null);
  
  // Track which framework filter is selected (default: "All")
  const [selectedFramework, setSelectedFramework] = useState<string>('All');
  
  // Track if we're loading data
  const [loading, setLoading] = useState<boolean>(true);
  
  //error handling
  const [error, setError] = useState<string | null>(null);
  
  // ==================== LOAD DATA ON MOUNT ====================
  // useEffect with empty array [] runs ONCE when component first renders
  // Think of it like a constructor or "componentDidMount" in class components
  // useEffect(() => {
  //   loadMockData();
  // }, []);

  useEffect(() => {
  loadData();
}, []);
  
  const loadData = async () => {
    try {
      // Try to fetch real data from S3
      console.log('Attempting to load real S3 data...');
      const realData = await fetchLatestReport();
      setReport(realData);
      setLoading(false);
      console.log('✅ Loaded real data from S3!');
    } catch (error) {
      console.warn('⚠️ Could not load S3 data, using mock data instead');
      console.error('Error details:', error);
      
      // Fallback to mock data if S3 fails
      setTimeout(() => {
        const mockData = getMockReport();
        setReport(mockData);
        setLoading(false);
        console.log('✅ Loaded mock data');
      }, 500);
    }
  };

  // ==================== MOCK DATA FUNCTION ====================
  // This simulates fetching data from an API
  // Later we'll replace this with real S3/API calls
  const loadMockData = () => {
    // Simulate network delay (like a real API call)
    setTimeout(() => {
      // Create a mock report that matches our ComplianceReport type
      const mockReport: ComplianceReport = {
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
            details: 'Bucket allows public access - data breach risk!',
            resource: 'data-bucket',
            timestamp: new Date().toISOString()
          },
          {
            severity: 'high',
            control_id: 'EC2-SG-001-web-sg',
            control_name: 'Security Group Rules',
            framework: 'SOC 2',
            details: 'Allows SSH from anywhere (0.0.0.0/0 on port 22)',
            resource: 'web-sg (sg-12345678)',
            timestamp: new Date().toISOString()
          }
        ],
        detailed_controls: [
          {
            control_id: 'IAM-001',
            control_name: 'MFA Enforcement',
            status: 'passed',
            frameworks: ['SOC 2', 'ISO 27001', 'NIST CSF', 'PCI-DSS'],
            framework: 'SOC 2',
            details: 'Root account has MFA enabled',
            timestamp: new Date().toISOString()
          },
          {
            control_id: 'IAM-004',
            control_name: 'Password Policy',
            status: 'warning',
            frameworks: ['SOC 2', 'ISO 27001', 'NIST CSF', 'HIPAA'],
            framework: 'NIST CSF',
            details: 'Password length < 14 characters',
            timestamp: new Date().toISOString()
          },
          {
            control_id: 'S3-001-prod-data',
            control_name: 'Bucket Encryption',
            status: 'failed',
            frameworks: ['SOC 2', 'ISO 27001', 'HIPAA', 'PCI-DSS'],
            framework: 'ISO 27001',
            details: 'No encryption configured',
            timestamp: new Date().toISOString(),
            bucket: 'prod-data'
          },
          {
            control_id: 'S3-002-data-bucket',
            control_name: 'Public Access Block',
            status: 'failed',
            frameworks: ['SOC 2', 'ISO 27001', 'NIST CSF'],
            framework: 'SOC 2',
            details: 'Public access not fully blocked',
            timestamp: new Date().toISOString(),
            bucket: 'data-bucket'
          },
          {
            control_id: 'EC2-SG-001-web-sg',
            control_name: 'Security Group Inbound Rules',
            status: 'failed',
            frameworks: ['SOC 2', 'ISO 27001', 'NIST CSF'],
            framework: 'SOC 2',
            details: 'Allows access from 0.0.0.0/0 on port 22',
            timestamp: new Date().toISOString(),
            resource: 'web-sg (sg-12345678)'
          },
          {
            control_id: 'TRAIL-001-main',
            control_name: 'CloudTrail Configuration',
            status: 'passed',
            frameworks: ['SOC 2', 'ISO 27001', 'NIST CSF', 'HIPAA'],
            framework: 'SOC 2',
            details: 'CloudTrail is enabled and properly configured',
            timestamp: new Date().toISOString(),
            resource: 'main-trail'
          }
        ]
      };
      
      // Update state with the mock data
      setReport(mockReport);
      setLoading(false);  // Stop showing loading spinner
    }, 1000);  // 1 second delay to simulate API call
  };
  
  
  // ==================== FILTER FUNCTION ====================
  // Returns controls filtered by selected framework
  const getFilteredControls = (): Control[] => {
    if (!report) return [];  // Safety check - if no report, return empty array
    
    if (selectedFramework === 'All') {
      return report.detailed_controls;  // Show all controls
    }
    
    // Filter controls that include the selected framework
    return report.detailed_controls.filter(control => 
      control.frameworks.includes(selectedFramework)
    );
  };
  
  
  // ==================== HELPER FUNCTIONS ====================
  // These are pure functions that just transform data for display
  
  const getRiskColor = (level: string): string => {
    switch(level) {
      case 'LOW': return 'text-green-600';
      case 'MEDIUM': return 'text-yellow-600';
      case 'HIGH': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };
  
  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'passed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'failed':
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-gray-600" />;
    }
  };
  
  const getStatusBadgeColor = (status: string): string => {
    switch(status) {
      case 'passed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  
  // ==================== CONDITIONAL RENDERING ====================
  // Show different UI based on state
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-blue-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600 text-lg">Loading compliance data...</p>
        </div>
      </div>
    );
  }
  
  if (!report) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Failed to load compliance data</p>
        </div>
      </div>
    );
  }
  
  
  // ==================== MAIN UI ====================
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
                <Shield className="w-10 h-10 text-blue-600" />
                GRC Compliance Dashboard
              </h1>
              <p className="text-gray-600 mt-2">
                Multi-Cloud Security Posture Management
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Last scan: {new Date(report.scan_metadata.scan_time).toLocaleString()}
              </p>
            </div>
            
            {/* FRAMEWORK FILTER DROPDOWN */}
            <div className="flex items-center gap-3">
              <Filter className="w-5 h-5 text-gray-600" />
              <select
                value={selectedFramework}
                onChange={(e) => setSelectedFramework(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="All">All Frameworks</option>
                {report.framework_scores.map(fw => (
                  <option key={fw.name} value={fw.name}>{fw.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
        
        
        {/* EXECUTIVE SUMMARY CARDS - 4 cards in a row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          
          {/* Card 1: Overall Score */}
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Overall Score</p>
                <p className="text-4xl font-bold text-blue-600">
                  {report.executive_summary.overall_score.toFixed(1)}%
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-600" />
            </div>
            <p className={`text-sm font-medium mt-2 ${getRiskColor(report.executive_summary.risk_level)}`}>
              Risk Level: {report.executive_summary.risk_level}
            </p>
          </div>
          
          {/* Card 2: Passed Controls */}
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Passed</p>
                <p className="text-4xl font-bold text-green-600">
                  {report.executive_summary.passed}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-sm text-gray-600 mt-2">
              of {report.executive_summary.total_checks} controls
            </p>
          </div>
          
          {/* Card 3: Failed Controls */}
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-red-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Failed</p>
                <p className="text-4xl font-bold text-red-600">
                  {report.executive_summary.failed}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Require immediate action
            </p>
          </div>
          
          {/* Card 4: Warnings */}
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-yellow-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Warnings</p>
                <p className="text-4xl font-bold text-yellow-600">
                  {report.executive_summary.warnings}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-yellow-600" />
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Need attention
            </p>
          </div>
          
        </div>
        
        
        {/* FRAMEWORK SCORES SECTION */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Framework Compliance Scores</h2>
          
          {/* Bar Chart */}
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={report.framework_scores}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Legend />
              <Bar dataKey="score" fill="#3b82f6" name="Compliance Score (%)" />
            </BarChart>
          </ResponsiveContainer>
          
          {/* Framework Details Table */}
          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Framework</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Passed</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Failed</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Warnings</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {report.framework_scores.map((framework) => (
                  <tr key={framework.name} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                      {framework.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`font-bold ${
                        framework.score >= 80 ? 'text-green-600' : 
                        framework.score >= 60 ? 'text-yellow-600' : 
                        'text-red-600'
                      }`}>
                        {framework.score.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-green-600 font-medium">
                      {framework.passed}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-red-600 font-medium">
                      {framework.failed}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-yellow-600 font-medium">
                      {framework.warnings}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                      {framework.total}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        
        {/* TWO COLUMN LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* LEFT COLUMN: Critical Findings */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-red-600" />
              Critical Findings
            </h2>
            
            <div className="space-y-4">
              {report.critical_findings.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-2" />
                  <p className="text-gray-500">No critical findings! 🎉</p>
                  <p className="text-sm text-gray-400 mt-1">All critical controls are passing</p>
                </div>
              ) : (
                report.critical_findings.map((finding, index) => (
                  <div key={index} className="border border-red-200 rounded-lg p-4 bg-red-50 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-2">
                      <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                        finding.severity === 'high' ? 'bg-red-600 text-white' : 
                        finding.severity === 'medium' ? 'bg-orange-500 text-white' :
                        'bg-yellow-500 text-white'
                      }`}>
                        {finding.severity}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(finding.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <h3 className="font-bold text-gray-900 mb-1">{finding.control_name}</h3>
                    <p className="text-sm text-gray-700 mb-2">{finding.details}</p>
                    <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                      <span className="bg-white px-2 py-1 rounded">Control: {finding.control_id}</span>
                      <span className="bg-white px-2 py-1 rounded">Framework: {finding.framework}</span>
                      <span className="bg-white px-2 py-1 rounded">Resource: {finding.resource}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          
          
          {/* RIGHT COLUMN: Control Status List */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Control Status
              {selectedFramework !== 'All' && (
                <span className="text-sm font-normal text-gray-600 ml-2">
                  (Filtered: {selectedFramework})
                </span>
              )}
            </h2>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {getFilteredControls().map((control, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-3">
                    {getStatusIcon(control.status)}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-gray-900">{control.control_name}</h3>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadgeColor(control.status)}`}>
                          {control.status.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{control.details}</p>
                      <div className="flex flex-wrap gap-1">
                        {control.frameworks.map(fw => (
                          <span key={fw} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                            {fw}
                          </span>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 mt-2">ID: {control.control_id}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
        </div>
        
      </div>
    </div>
  );
};

export default ComplianceDashboard;