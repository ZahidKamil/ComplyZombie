import boto3
import json
from datetime import datetime

# Initialize AWS S3 client
s3 = boto3.client('s3')

def check_bucket_encryption(bucket_name):
    """
    Check if S3 bucket has default encryption enabled.
    This is required for most compliance frameworks (SOC 2, ISO 27001, HIPAA).
    """
    try:
        # Try to get bucket encryption configuration
        s3.get_bucket_encryption(Bucket=bucket_name)
        return True, "Encryption enabled"
    except s3.exceptions.ClientError as e:
        error_code = e.response['Error']['Code']
        if error_code == 'ServerSideEncryptionConfigurationNotFoundError':
            return False, "No encryption configured"
        else:
            return None, f"Error checking encryption: {error_code}"


def check_bucket_public_access(bucket_name):
    """
    Check if S3 bucket has public access blocked.
    Public buckets are a MAJOR security risk (data breaches!).
    """
    try:
        # Get the public access block configuration
        response = s3.get_public_access_block(Bucket=bucket_name)
        config = response['PublicAccessBlockConfiguration']
        
        # All four settings should be True for maximum security
        all_blocked = (
            config.get('BlockPublicAcls', False) and
            config.get('IgnorePublicAcls', False) and
            config.get('BlockPublicPolicy', False) and
            config.get('RestrictPublicBuckets', False)
        )
        
        if all_blocked:
            return True, "All public access blocked"
        else:
            issues = []
            if not config.get('BlockPublicAcls'): issues.append("BlockPublicAcls=False")
            if not config.get('IgnorePublicAcls'): issues.append("IgnorePublicAcls=False")
            if not config.get('BlockPublicPolicy'): issues.append("BlockPublicPolicy=False")
            if not config.get('RestrictPublicBuckets'): issues.append("RestrictPublicBuckets=False")
            return False, f"Issues: {', '.join(issues)}"
            
    except s3.exceptions.ClientError as e:
        error_code = e.response['Error']['Code']
        if error_code == 'NoSuchPublicAccessBlockConfiguration':
            return False, "No public access block configured (RISK!)"
        else:
            return None, f"Error: {error_code}"


def check_bucket_versioning(bucket_name):
    """
    Check if S3 bucket has versioning enabled.
    Versioning helps with data recovery and is often required for compliance.
    """
    try:
        response = s3.get_bucket_versioning(Bucket=bucket_name)
        status = response.get('Status', 'Disabled')
        
        if status == 'Enabled':
            return True, "Versioning enabled"
        else:
            return False, f"Versioning is {status}"
            
    except Exception as e:
        return None, f"Error: {str(e)}"


def check_bucket_logging(bucket_name):
    """
    Check if S3 bucket has access logging enabled.
    Logging is required for audit trails in most compliance frameworks.
    """
    try:
        response = s3.get_bucket_logging(Bucket=bucket_name)
        
        if 'LoggingEnabled' in response:
            target = response['LoggingEnabled'].get('TargetBucket', 'unknown')
            return True, f"Logging to {target}"
        else:
            return False, "No logging configured"
            
    except Exception as e:
        return None, f"Error: {str(e)}"


def check_single_bucket(bucket_name):
    """Run all security checks on a single bucket"""
    print(f"\n🪣 Checking bucket: {bucket_name}")
    print("-" * 60)
    
    results = []
    
    # Check encryption
    encrypted, enc_details = check_bucket_encryption(bucket_name)
    if encrypted is True:
        print(f"  ✅ Encryption: {enc_details}")
        status = 'passed'
    elif encrypted is False:
        print(f"  ❌ Encryption: {enc_details}")
        status = 'failed'
    else:
        print(f"  ⚠️ Encryption: {enc_details}")
        status = 'error'
    
    results.append({
        'control_id': f'S3-001-{bucket_name}',
        'control_name': 'Bucket Encryption',
        'bucket': bucket_name,
        'status': status,
        'frameworks': ['SOC 2', 'ISO 27001', 'HIPAA', 'PCI-DSS'],
        'framework': 'ISO 27001',  # Backwards compatibility
        'details': enc_details,
        'timestamp': datetime.now().isoformat()
    })
    
    # Check public access
    blocked, block_details = check_bucket_public_access(bucket_name)
    if blocked is True:
        print(f"  ✅ Public Access: {block_details}")
        status = 'passed'
    elif blocked is False:
        print(f"  ❌ Public Access: {block_details}")
        status = 'failed'
    else:
        print(f"  ⚠️ Public Access: {block_details}")
        status = 'error'
    
    results.append({
        'control_id': f'S3-002-{bucket_name}',
        'control_name': 'Public Access Block',
        'bucket': bucket_name,
        'status': status,
        'frameworks': ['SOC 2', 'ISO 27001', 'NIST CSF', 'HIPAA'],
        'framework': 'SOC 2',
        'details': block_details,
        'timestamp': datetime.now().isoformat()
    })
    
    # Check versioning
    versioned, ver_details = check_bucket_versioning(bucket_name)
    if versioned is True:
        print(f"  ✅ Versioning: {ver_details}")
        status = 'passed'
    elif versioned is False:
        print(f"  ⚠️ Versioning: {ver_details}")
        status = 'warning'
    else:
        print(f"  ⚠️ Versioning: {ver_details}")
        status = 'error'
    
    results.append({
        'control_id': f'S3-003-{bucket_name}',
        'control_name': 'Bucket Versioning',
        'bucket': bucket_name,
        'status': status,
        'frameworks': ['NIST CSF', 'ISO 27001'],
        'framework': 'NIST CSF',
        'details': ver_details,
        'timestamp': datetime.now().isoformat()
    })
    
    # Check logging
    logged, log_details = check_bucket_logging(bucket_name)
    if logged is True:
        print(f"  ✅ Logging: {log_details}")
        status = 'passed'
    elif logged is False:
        print(f"  ⚠️ Logging: {log_details}")
        status = 'warning'
    else:
        print(f"  ⚠️ Logging: {log_details}")
        status = 'error'
    
    results.append({
        'control_id': f'S3-004-{bucket_name}',
        'control_name': 'Access Logging',
        'bucket': bucket_name,
        'status': status,
        'frameworks': ['SOC 2', 'ISO 27001', 'NIST CSF'],
        'framework': 'SOC 2',
        'details': log_details,
        'timestamp': datetime.now().isoformat()
    })
    
    return results

def run_s3_compliance_checks():
    """
    Main function to check all S3 buckets in the account.
    """
    print("=" * 60)
    print("🪣  AWS S3 COMPLIANCE CHECKER")
    print("=" * 60)
    
    try:
        # List all S3 buckets in the account
        response = s3.list_buckets()
        buckets = response['Buckets']
        
        print(f"\nFound {len(buckets)} bucket(s) in your account")
        
        if len(buckets) == 0:
            print("\nNo S3 buckets found. Create some buckets to test this scanner!")
            return
        
        all_results = []
        
        # Check each bucket
        for bucket in buckets:
            bucket_name = bucket['Name']
            bucket_results = check_single_bucket(bucket_name)
            all_results.extend(bucket_results)
        
        # Calculate summary statistics
        total_checks = len(all_results)
        passed = len([r for r in all_results if r['status'] == 'passed'])
        failed = len([r for r in all_results if r['status'] == 'failed'])
        warnings = len([r for r in all_results if r['status'] == 'warning'])
        errors = len([r for r in all_results if r['status'] == 'error'])
        
        print("\n" + "=" * 60)
        print("📊 SUMMARY")
        print("=" * 60)
        print(f"Total Buckets Scanned: {len(buckets)}")
        print(f"Total Checks: {total_checks}")
        print(f"✅ Passed: {passed}")
        print(f"❌ Failed: {failed}")
        print(f"⚠️ Warnings: {warnings}")
        print(f"⚠️ Errors: {errors}")
        
        if total_checks > 0:
            compliance_score = (passed / total_checks * 100)
            print(f"\nS3 Compliance Score: {compliance_score:.0f}%")
        
        # Save results to JSON file
        output = {
            'scan_time': datetime.now().isoformat(),
            'total_buckets': len(buckets),
            'total_checks': total_checks,
            'passed': passed,
            'failed': failed,
            'warnings': warnings,
            'errors': errors,
            'compliance_score': round(passed / total_checks * 100, 2) if total_checks > 0 else 0,
            'controls': all_results
        }
        
        # ONLY save to file if NOT running in Lambda
        try:
            import os
            if 'AWS_LAMBDA_FUNCTION_NAME' not in os.environ:
                with open('s3_compliance_report.json', 'w') as f:
                    json.dump(output, f, indent=2)
                print("\n💾 Report saved to: s3_compliance_report.json")
        except Exception:
            pass
        
    except Exception as e:
        print(f"\n❌ Error scanning S3 buckets: {str(e)}")
        return None

def main():
    """Main function for standalone execution."""
    run_s3_compliance_checks()

# Run the script
if __name__ == "__main__":
    main()