import boto3
import json
from datetime import datetime

# Initialize CloudTrail client
cloudtrail = boto3.client('cloudtrail')
s3 = boto3.client('s3')

def check_cloudtrail_enabled():
    """Check if CloudTrail is enabled and logging"""
    print("\n📝 Checking CloudTrail Status...")
    print("-" * 60)
    
    results = []
    
    try:
        response = cloudtrail.describe_trails()
        trails = response['trailList']
        
        if len(trails) == 0:
            print("  ❌ No CloudTrail trails configured")
            results.append({
                'control_id': 'TRAIL-001',
                'control_name': 'CloudTrail Enabled',
                'status': 'failed',
                'frameworks': ['SOC 2', 'ISO 27001', 'NIST CSF', 'HIPAA', 'PCI-DSS'],
                'framework': 'SOC 2',
                'details': 'No CloudTrail trails exist - audit logging is disabled',
                'timestamp': datetime.now().isoformat()
            })
            return results
        
        print(f"  Found {len(trails)} CloudTrail trail(s)")
        
        # Check each trail
        for trail in trails:
            trail_name = trail['Name']
            trail_arn = trail['TrailARN']
            
            is_multi_region = trail.get('IsMultiRegionTrail', False)
            
            status = cloudtrail.get_trail_status(Name=trail_arn)
            is_logging = status.get('IsLogging', False)
            
            has_validation = trail.get('LogFileValidationEnabled', False)
            
            print(f"\n  Trail: {trail_name}")
            print(f"    - Multi-region: {is_multi_region}")
            print(f"    - Currently logging: {is_logging}")
            print(f"    - Log validation: {has_validation}")
            
            issues = []
            
            if not is_logging:
                issues.append("Trail is not logging")
            
            if not is_multi_region:
                issues.append("Not multi-region")
            
            if not has_validation:
                issues.append("Log file validation disabled")
            
            if len(issues) == 0:
                print(f"    ✅ Trail is properly configured")
                status_result = 'passed'
                details = 'CloudTrail is enabled and properly configured'
            elif not is_logging:
                print(f"    ❌ CRITICAL: {', '.join(issues)}")
                status_result = 'failed'
                details = f"Issues: {', '.join(issues)}"
            else:
                print(f"    ⚠️ WARNING: {', '.join(issues)}")
                status_result = 'warning'
                details = f"Issues: {', '.join(issues)}"
            
            results.append({
                'control_id': f'TRAIL-001-{trail_name}',
                'control_name': 'CloudTrail Configuration',
                'resource': trail_name,
                'status': status_result,
                'frameworks': ['SOC 2', 'ISO 27001', 'NIST CSF', 'HIPAA', 'PCI-DSS'],
                'framework': 'SOC 2',
                'details': details,
                'timestamp': datetime.now().isoformat()
            })
        
        return results
        
    except Exception as e:
        print(f"  ❌ Error checking CloudTrail: {str(e)}")
        return [{
            'control_id': 'TRAIL-001',
            'control_name': 'CloudTrail Enabled',
            'status': 'error',
            'frameworks': ['SOC 2', 'ISO 27001', 'NIST CSF'],
            'framework': 'SOC 2',
            'details': f'Error checking CloudTrail: {str(e)}',
            'timestamp': datetime.now().isoformat()
        }]


def run_cloudtrail_checks():
    """
    Main function to run CloudTrail compliance checks.
    """
    print("=" * 60)
    print("📝 AWS CLOUDTRAIL COMPLIANCE CHECKER")
    print("=" * 60)
    
    results = check_cloudtrail_enabled()
    
    # Calculate summary
    total_checks = len(results)
    passed = len([r for r in results if r['status'] == 'passed'])
    failed = len([r for r in results if r['status'] == 'failed'])
    warnings = len([r for r in results if r['status'] == 'warning'])
    
    print("\n" + "=" * 60)
    print("📊 SUMMARY")
    print("=" * 60)
    print(f"Total Checks: {total_checks}")
    print(f"✅ Passed: {passed}")
    print(f"❌ Failed: {failed}")
    print(f"⚠️ Warnings: {warnings}")
    
    if total_checks > 0:
        score = (passed / total_checks * 100)
        print(f"\nCloudTrail Compliance Score: {score:.0f}%")
    
    # Save report
    output = {
        'scan_time': datetime.now().isoformat(),
        'total_checks': total_checks,
        'passed': passed,
        'failed': failed,
        'warnings': warnings,
        'compliance_score': round(passed / total_checks * 100, 2) if total_checks > 0 else 0,
        'controls': results
    }
    
    try:
        import os
        if 'AWS_LAMBDA_FUNCTION_NAME' not in os.environ:
            with open('cloudtrail_compliance_report.json', 'w') as f:
                json.dump(output, f, indent=2)
            print("\n💾 Report saved to: cloudtrail_compliance_report.json")
    except Exception:
        pass
    
    return output


def main():
    """Main function for standalone execution."""
    run_cloudtrail_checks()

if __name__ == "__main__":
    main()