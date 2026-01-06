import React, { useState, useEffect } from 'react';
import { Shield, AlertTriangle, CheckCircle, TrendingUp, Filter } from 'lucide-react';
import type { ComplianceReport, Framework, Control } from '../types/compliance';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { fetchLatestReport, getMockReport } from '../services/s3Service';

const ComplianceDashboard: React.FC = () => {
  
  // STATE MANAGEMENT
  const [report, setReport] = useState<ComplianceReport | null>(null);
  const [selectedFramework, setSelectedFramework] = useState<string>('All');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [usingMockData, setUsingMockData] = useState<boolean>(false);
  
  
  // LOAD DATA FROM S3
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      setUsingMockData(false);
      
      console.log('🚀 Loading compliance data from S3...');
      
      const realData = await fetchLatestReport();
      
      setReport(realData);
      setLoading(false);
      
      console.log('✅ Dashboard loaded with REAL S3 data!');
      
    } catch (err) {
      console.error('⚠️ Failed to load S3 data:', err);
      
      setError('Could not load data from S3. Using mock data instead.');
      setUsingMockData(true);
      
      // Fallback to mock data
      setTimeout(() => {
        console.log('📝 Loading mock data as fallback...');
        const mockData = getMockReport();
        setReport(mockData);
        setLoading(false);
      }, 500);
    }
  };
  
  
  useEffect(() => {
    loadData();
  }, []);
  
  
  // FILTER CONTROLS BY FRAMEWORK
  const getFilteredControls = (): Control[] => {
    if (!report) return [];
    
    if (selectedFramework === 'All') {
      return report.detailed_controls;
    }
    
    return report.detailed_controls.filter(control => 
      control.frameworks.includes(selectedFramework)
    );
  };
  
  
  // HELPER FUNCTIONS
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
  
  
  // LOADING STATE
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-blue-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600 text-lg">Loading compliance data from S3...</p>
        </div>
      </div>
    );
  }
  
  
  // ERROR STATE
  if (!report) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <p className="text-gray-600 text-lg mb-4">Failed to load compliance data</p>
          <button 
            onClick={loadData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
  
  
  // MAIN DASHBOARD UI
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* DATA SOURCE INDICATOR */}
        {usingMockData && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-yellow-400 mr-3" />
                <p className="text-sm text-yellow-700">
                  <strong>Mock Data:</strong> Could not load from S3. Displaying sample data.
                </p>
              </div>
              <button 
                onClick={loadData}
                className="text-sm text-yellow-700 underline hover:text-yellow-900"
              >
                Retry S3
              </button>
            </div>
          </div>
        )}
        
        {!usingMockData && (
          <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-400 mr-3" />
              <p className="text-sm text-green-700">
                <strong>Live Data:</strong> Loaded from S3 • Scan Time: {new Date(report.scan_metadata.scan_time).toLocaleString()}
              </p>
            </div>
          </div>
        )}
        
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
            
            {/* FRAMEWORK FILTER */}
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
        
        
        {/* EXECUTIVE SUMMARY CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          
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
        
        
        {/* FRAMEWORK SCORES */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Framework Compliance Scores</h2>
          
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
        
        
        {/* TWO COLUMNS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* CRITICAL FINDINGS */}
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
          
          
          {/* CONTROL STATUS */}
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