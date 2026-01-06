import boto3
import json
from datetime import datetime

# Initialize AWS IAM client
# boto3 automatically uses your AWS credentials from `aws configure`
iam = boto3.client('iam')

def check_mfa_enabled():
    """Check if MFA is enabled on root account"""
    try:
        summary = iam.get_account_summary()
        mfa_devices = summary['SummaryMap'].get('AccountMFAEnabled', 0)
        
        if mfa_devices > 0:
            return {
                'control_id': 'IAM-001',
                'control_name': 'MFA Enforcement',
                'status': 'passed',
                'frameworks': ['SOC 2', 'ISO 27001', 'NIST CSF', 'PCI-DSS'],
                'framework': 'SOC 2',  # Primary framework (backwards compatibility)
                'details': 'Root account has MFA enabled',
                'timestamp': datetime.now().isoformat()
            }
        else:
            return {
                'control_id': 'IAM-001',
                'control_name': 'MFA Enforcement',
                'status': 'failed',
                'frameworks': ['SOC 2', 'ISO 27001', 'NIST CSF', 'PCI-DSS'],
                'framework': 'SOC 2',
                'details': 'Root account does not have MFA enabled - HIGH RISK',
                'timestamp': datetime.now().isoformat()
            }
    except Exception as e:
        return None


def check_root_account_usage():
    """Check if the root account has been used recently"""
    print("\n🔍 Checking Root Account Usage...")
    
    try:
        try:
            iam.generate_credential_report()
        except:
            pass
        
        response = iam.get_credential_report()
        
        import csv
        import io
        report = response['Content'].decode('utf-8')
        reader = csv.DictReader(io.StringIO(report))
        
        for row in reader:
            if row['user'] == '<root_account>':
                password_last_used = row['password_last_used']
                
                if password_last_used == 'N/A' or password_last_used == 'no_information':
                    print("✅ PASS: Root account has not been used recently")
                    return {
                        'control_id': 'IAM-002',
                        'control_name': 'Root Account Usage',
                        'status': 'passed',
                        'frameworks': ['SOC 2', 'ISO 27001', 'NIST CSF'],
                        'framework': 'SOC 2',
                        'details': 'Root account shows no recent usage',
                        'timestamp': datetime.now().isoformat()
                    }
                else:
                    print(f"⚠️ WARNING: Root account last used: {password_last_used}")
                    return {
                        'control_id': 'IAM-002',
                        'control_name': 'Root Account Usage',
                        'status': 'warning',
                        'frameworks': ['SOC 2', 'ISO 27001', 'NIST CSF'],
                        'framework': 'SOC 2',
                        'details': f'Root account was used on {password_last_used}',
                        'timestamp': datetime.now().isoformat()
                    }
        
        return None
        
    except Exception as e:
        print(f"⚠️ ERROR: {str(e)}")
        return None

def check_users_with_console_access():
    """List all IAM users and check if they have console access without MFA"""
    print("\n🔍 Checking IAM Users Console Access...")
    
    try:
        users = iam.list_users()
        
        risky_users = []
        
        for user in users['Users']:
            username = user['UserName']
            
            try:
                iam.get_login_profile(UserName=username)
                has_console = True
            except iam.exceptions.NoSuchEntityException:
                has_console = False
            
            if has_console:
                mfa_devices = iam.list_mfa_devices(UserName=username)
                has_mfa = len(mfa_devices['MFADevices']) > 0
                
                if not has_mfa:
                    risky_users.append(username)
                    print(f"⚠️ User '{username}' has console access without MFA")
        
        if len(risky_users) == 0:
            print("✅ PASS: All console users have MFA enabled")
            return {
                'control_id': 'IAM-003',
                'control_name': 'User MFA Enforcement',
                'status': 'passed',
                'frameworks': ['SOC 2', 'ISO 27001', 'NIST CSF', 'PCI-DSS'],
                'framework': 'ISO 27001',
                'details': 'All IAM users with console access have MFA',
                'timestamp': datetime.now().isoformat()
            }
        else:
            print(f"❌ FAIL: {len(risky_users)} users have console access without MFA")
            return {
                'control_id': 'IAM-003',
                'control_name': 'User MFA Enforcement',
                'status': 'failed',
                'frameworks': ['SOC 2', 'ISO 27001', 'NIST CSF', 'PCI-DSS'],
                'framework': 'ISO 27001',
                'details': f'{len(risky_users)} users without MFA: {", ".join(risky_users)}',
                'timestamp': datetime.now().isoformat()
            }
            
    except Exception as e:
        print(f"⚠️ ERROR: {str(e)}")
        return None

def check_password_policy():
    """Check if account has a strong password policy configured"""
    print("\n🔍 Checking Password Policy...")
    
    try:
        policy = iam.get_account_password_policy()
        
        pwd = policy['PasswordPolicy']
        
        issues = []
        
        if pwd.get('MinimumPasswordLength', 0) < 14:
            issues.append("Password length < 14 characters")
        
        if not pwd.get('RequireUppercaseCharacters', False):
            issues.append("Uppercase characters not required")
            
        if not pwd.get('RequireLowercaseCharacters', False):
            issues.append("Lowercase characters not required")
            
        if not pwd.get('RequireNumbers', False):
            issues.append("Numbers not required")
            
        if not pwd.get('RequireSymbols', False):
            issues.append("Symbols not required")
        
        if len(issues) == 0:
            print("✅ PASS: Strong password policy is configured")
            return {
                'control_id': 'IAM-004',
                'control_name': 'Password Policy',
                'status': 'passed',
                'frameworks': ['SOC 2', 'ISO 27001', 'NIST CSF', 'PCI-DSS', 'HIPAA'],
                'framework': 'NIST CSF',
                'details': 'Password policy meets security standards',
                'timestamp': datetime.now().isoformat()
            }
        else:
            print(f"⚠️ WARNING: Password policy has weaknesses")
            return {
                'control_id': 'IAM-004',
                'control_name': 'Password Policy',
                'status': 'warning',
                'frameworks': ['SOC 2', 'ISO 27001', 'NIST CSF', 'PCI-DSS', 'HIPAA'],
                'framework': 'NIST CSF',
                'details': f'Issues: {", ".join(issues)}',
                'timestamp': datetime.now().isoformat()
            }
            
    except iam.exceptions.NoSuchEntityException:
        print("❌ FAIL: No password policy configured")
        return {
            'control_id': 'IAM-004',
            'control_name': 'Password Policy',
            'status': 'failed',
            'frameworks': ['SOC 2', 'ISO 27001', 'NIST CSF', 'PCI-DSS', 'HIPAA'],
            'framework': 'NIST CSF',
            'details': 'No account password policy exists',
            'timestamp': datetime.now().isoformat()
        }
    except Exception as e:
        print(f"⚠️ ERROR: {str(e)}")
        return None


def run_iam_compliance_checks():
    """
    Main function to run all IAM compliance checks and return results.
    """
    print("=" * 60)
    print("🛡️  AWS IAM COMPLIANCE CHECKER")
    print("=" * 60)
    
    # Run all checks
    results = []
    
    result = check_mfa_enabled()
    if result:
        results.append(result)
    
    result = check_root_account_usage()
    if result:
        results.append(result)
    
    result = check_users_with_console_access()
    if result:
        results.append(result)
    
    result = check_password_policy()
    if result:
        results.append(result)
    
    # Calculate summary statistics
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
    print(f"\nCompliance Score: {(passed / total_checks * 100):.0f}%")
    
    # Save results to JSON file
    output = {
        'scan_time': datetime.now().isoformat(),
        'total_checks': total_checks,
        'passed': passed,
        'failed': failed,
        'warnings': warnings,
        'compliance_score': round(passed / total_checks * 100, 2),
        'controls': results
    }
    
    try:
        import os
        # Check if we're in Lambda by looking for AWS_LAMBDA_FUNCTION_NAME env var
        if 'AWS_LAMBDA_FUNCTION_NAME' not in os.environ:
            # Running locally - save file
            with open('iam_compliance_report.json', 'w') as f:
                json.dump(output, f, indent=2)
            print("\n💾 Report saved to: iam_compliance_report.json")
    except Exception as e:
        # If file write fails, that's okay - just skip it
        pass
    
    return output


def main():
    """Main function for standalone execution."""
    run_iam_compliance_checks()

# Run the script
if __name__ == "__main__":
    main()