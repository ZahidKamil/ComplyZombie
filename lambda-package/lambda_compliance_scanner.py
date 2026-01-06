"""
Lambda entry point for GRC Compliance Scanner.
This imports all the checker modules and orchestrates the scan.
"""

import boto3
import json
from datetime import datetime

# Import all checker modules
from aws_iam_checker import run_iam_compliance_checks
from aws_s3_checker import run_s3_compliance_checks
from aws_ec2_checker import run_ec2_security_group_checks
from aws_cloudtrail_checker import run_cloudtrail_checks


def calculate_framework_scores(all_controls):
    """Calculate compliance scores per framework"""
    frameworks = {}
    
    for control in all_controls:
        # Get all frameworks this control applies to
        control_frameworks = control.get('frameworks', [control.get('framework', 'Unknown')])
        
        # If frameworks is not a list, make it one
        if isinstance(control_frameworks, str):
            control_frameworks = [control_frameworks]
        
        status = control.get('status', 'unknown')
        
        # Count this control for each framework it applies to
        for framework in control_frameworks:
            if framework not in frameworks:
                frameworks[framework] = {
                    'name': framework,
                    'total': 0,
                    'passed': 0,
                    'failed': 0,
                    'warnings': 0
                }
            
            frameworks[framework]['total'] += 1
            
            if status == 'passed':
                frameworks[framework]['passed'] += 1
            elif status == 'failed':
                frameworks[framework]['failed'] += 1
            elif status == 'warning':
                frameworks[framework]['warnings'] += 1
    
    # Calculate scores
    framework_list = []
    for framework in frameworks.values():
        if framework['total'] > 0:
            framework['score'] = round((framework['passed'] / framework['total']) * 100, 2)
        else:
            framework['score'] = 0
        framework_list.append(framework)
    
    # Sort by score descending
    framework_list.sort(key=lambda x: x['score'], reverse=True)
    
    return framework_list

def identify_critical_findings(all_controls):
    """Identify high-priority security issues"""
    critical_findings = []
    
    for control in all_controls:
        if control['status'] == 'failed':
            details_lower = control['details'].lower()
            
            # Determine severity based on keywords
            critical_keywords = [
                'public access',
                'no encryption',
                'root account',
                'no mfa',
                'password policy',
                '0.0.0.0/0',
                'cloudtrail'
            ]
            
            is_critical = any(keyword in details_lower for keyword in critical_keywords)
            
            critical_findings.append({
                'severity': 'high' if is_critical else 'medium',
                'control_id': control['control_id'],
                'control_name': control['control_name'],
                'framework': control['framework'],
                'details': control['details'],
                'resource': control.get('resource', control.get('bucket', 'N/A')),
                'timestamp': control['timestamp']
            })
    
    # Sort by severity
    critical_findings.sort(key=lambda x: 0 if x['severity'] == 'high' else 1)
    
    return critical_findings


def lambda_handler(event, context):
    """
    Main Lambda handler function.
    This gets invoked by EventBridge on schedule.
    
    Args:
        event: Event data from trigger (usually empty for scheduled events)
        context: Lambda context object
    
    Returns:
        dict: Response with statusCode and body
    """
    
    print("=" * 80)
    print("🛡️  AWS GRC COMPLIANCE SCANNER - Lambda Execution")
    print("=" * 80)
    print(f"Scan initiated at: {datetime.now().isoformat()}")
    request_id = getattr(context, 'request_id', 'local-test')
    print(f"Request ID: {request_id}")
    print("=" * 80)
    
    # Initialize S3 client for saving reports
    s3_client = boto3.client('s3')
    
    # Configuration - UPDATE THIS TO YOUR BUCKET NAME
    REPORT_BUCKET = 'grc-compliance-reports'  # <<< CHANGE THIS
    
    try:
        # Run all compliance checks
        print("\n[1/4] Running IAM Security Checks...")
        iam_report = run_iam_compliance_checks()
        
        print("\n[2/4] Running S3 Security Checks...")
        s3_report = run_s3_compliance_checks()
        
        print("\n[3/4] Running EC2 Security Group Checks...")
        ec2_report = run_ec2_security_group_checks()
        
        print("\n[4/4] Running CloudTrail Checks...")
        cloudtrail_report = run_cloudtrail_checks()
        
        # Combine all controls
        all_controls = []
        
        if iam_report:
            all_controls.extend(iam_report.get('controls', []))
        
        if s3_report:
            all_controls.extend(s3_report.get('controls', []))
        
        if ec2_report:
            all_controls.extend(ec2_report.get('controls', []))
        
        if cloudtrail_report:
            all_controls.extend(cloudtrail_report.get('controls', []))
        
        # Calculate statistics
        total_checks = len(all_controls)
        passed = len([c for c in all_controls if c['status'] == 'passed'])
        failed = len([c for c in all_controls if c['status'] == 'failed'])
        warnings = len([c for c in all_controls if c['status'] == 'warning'])
        
        overall_score = round((passed / total_checks * 100), 2) if total_checks > 0 else 0
        
        # Calculate framework scores
        framework_scores = calculate_framework_scores(all_controls)
        
        # Identify critical findings
        critical_findings = identify_critical_findings(all_controls)
        
        # Print summary to CloudWatch logs
        print("\n" + "=" * 80)
        print("📊 SCAN SUMMARY")
        print("=" * 80)
        print(f"Total Checks: {total_checks}")
        print(f"✅ Passed: {passed}")
        print(f"❌ Failed: {failed}")
        print(f"⚠️ Warnings: {warnings}")
        print(f"🎯 Overall Score: {overall_score}%")
        print(f"🚨 Critical Findings: {len(critical_findings)}")
        
        print("\n📋 Framework Scores:")
        for fw in framework_scores:
            print(f"  {fw['name']}: {fw['score']}% ({fw['passed']}/{fw['total']})")
        
        # Build comprehensive report
        comprehensive_report = {
            'scan_metadata': {
                'scan_time': datetime.now().isoformat(),
                'scanner_version': '2.0',
                'execution_id': request_id,
                'aws_account': boto3.client('sts').get_caller_identity()['Account'],
                'aws_region': context.invoked_function_arn.split(':')[3]
            },
            'executive_summary': {
                'overall_score': overall_score,
                'total_checks': total_checks,
                'passed': passed,
                'failed': failed,
                'warnings': warnings,
                'risk_level': 'LOW' if overall_score >= 80 else 'MEDIUM' if overall_score >= 60 else 'HIGH'
            },
            'framework_scores': framework_scores,
            'critical_findings': critical_findings,
            'detailed_controls': all_controls,
            'individual_reports': {
                'iam': iam_report,
                's3': s3_report,
                'ec2': ec2_report,
                'cloudtrail': cloudtrail_report
            }
        }
        
        # Save report to S3
        report_key = f'reports/compliance-{datetime.now().strftime("%Y%m%d-%H%M%S")}.json'
        
        s3_client.put_object(
            Bucket=REPORT_BUCKET,
            Key=report_key,
            Body=json.dumps(comprehensive_report, indent=2),
            ContentType='application/json',
            Metadata={
                'scan-time': datetime.now().isoformat(),
                'overall-score': str(overall_score),
                'critical-findings': str(len(critical_findings))
            }
        )
        
        print(f"\n✅ Report saved to: s3://{REPORT_BUCKET}/{report_key}")
        print("=" * 80)
        
        # Return success response
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Compliance scan completed successfully',
                'overall_score': overall_score,
                'total_checks': total_checks,
                'passed': passed,
                'failed': failed,
                'warnings': warnings,
                'critical_findings': len(critical_findings),
                'report_location': f's3://{REPORT_BUCKET}/{report_key}',
                'scan_time': datetime.now().isoformat()
            }, indent=2)
        }
        
    except Exception as e:
        # Log error
        print(f"\n❌ ERROR during compliance scan: {str(e)}")
        import traceback
        traceback.print_exc()
        
        # Return error response
        return {
            'statusCode': 500,
            'body': json.dumps({
                'message': 'Compliance scan failed',
                'error': str(e)
            })
        }


# For local testing (won't run in Lambda)
if __name__ == "__main__":
    # # Mock Lambda context for local testing
    # class MockContext:
    #     request_id = 'local-test-12345'
    #     invoked_function_arn = 'arn:aws:lambda:us-east-1:123456789012:function:test'
    
    # result = lambda_handler({}, MockContext())
    # print("\n" + "=" * 80)
    # print("LOCAL TEST RESULT:")
    # print("=" * 80)
    result = lambda_handler({}, {})
    print(json.dumps(result, indent=2))