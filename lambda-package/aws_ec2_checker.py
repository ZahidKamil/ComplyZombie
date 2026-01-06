import boto3
import json
from datetime import datetime

# Initialize EC2 client
ec2 = boto3.client('ec2')

def check_security_group_rules(sg_id, sg_name, rules, rule_type):
    """
    Check if security group has overly permissive rules (0.0.0.0/0 or ::/0).
    These are security risks - they allow access from ANYWHERE on the internet.
    """
    risky_rules = []
    
    for rule in rules:
        # Check if rule allows access from anywhere (0.0.0.0/0 for IPv4 or ::/0 for IPv6)
        ip_ranges = rule.get('IpRanges', [])
        ipv6_ranges = rule.get('Ipv6Ranges', [])
        
        for ip_range in ip_ranges:
            if ip_range.get('CidrIp') == '0.0.0.0/0':
                from_port = rule.get('FromPort', 'All')
                to_port = rule.get('ToPort', 'All')
                protocol = rule.get('IpProtocol', 'All')
                
                risky_rules.append({
                    'type': rule_type,
                    'protocol': protocol,
                    'port_range': f"{from_port}-{to_port}",
                    'source': '0.0.0.0/0 (anywhere)'
                })
        
        for ipv6_range in ipv6_ranges:
            if ipv6_range.get('CidrIpv6') == '::/0':
                from_port = rule.get('FromPort', 'All')
                to_port = rule.get('ToPort', 'All')
                protocol = rule.get('IpProtocol', 'All')
                
                risky_rules.append({
                    'type': rule_type,
                    'protocol': protocol,
                    'port_range': f"{from_port}-{to_port}",
                    'source': '::/0 (anywhere IPv6)'
                })
    
    return risky_rules


def check_single_security_group(sg):
    """Analyze a single security group for security issues"""
    sg_id = sg['GroupId']
    sg_name = sg['GroupName']
    
    print(f"\n🔒 Checking Security Group: {sg_name} ({sg_id})")
    print("-" * 60)
    
    results = []
    
    # Check inbound rules
    inbound_rules = sg.get('IpPermissions', [])
    risky_inbound = check_security_group_rules(sg_id, sg_name, inbound_rules, 'inbound')
    
    # Check outbound rules
    outbound_rules = sg.get('IpPermissionsEgress', [])
    risky_outbound = check_security_group_rules(sg_id, sg_name, outbound_rules, 'outbound')
    
    # Evaluate inbound rules
    if len(risky_inbound) == 0:
        print(f"  ✅ Inbound Rules: No overly permissive rules")
        inbound_status = 'passed'
        inbound_details = 'No rules allow access from 0.0.0.0/0'
    else:
        print(f"  ❌ Inbound Rules: {len(risky_inbound)} overly permissive rule(s)")
        for rule in risky_inbound:
            print(f"     - {rule['type']} {rule['protocol']} port {rule['port_range']} from {rule['source']}")
        inbound_status = 'failed'
        inbound_details = f"{len(risky_inbound)} rules allow access from anywhere: {', '.join([r['port_range'] for r in risky_inbound])}"
    
    results.append({
        'control_id': f'EC2-SG-001-{sg_id}',
        'control_name': 'Security Group Inbound Rules',
        'resource': f"{sg_name} ({sg_id})",
        'status': inbound_status,
        'frameworks': ['SOC 2', 'ISO 27001', 'NIST CSF', 'PCI-DSS'],
        'framework': 'SOC 2',
        'details': inbound_details,
        'timestamp': datetime.now().isoformat()
    })
    
    # Evaluate outbound rules
    if len(risky_outbound) == 0:
        print(f"  ✅ Outbound Rules: Properly restricted")
        outbound_status = 'passed'
        outbound_details = 'Outbound traffic is controlled'
    else:
        print(f"  ⚠️ Outbound Rules: {len(risky_outbound)} allow all destinations")
        outbound_status = 'warning'
        outbound_details = f"{len(risky_outbound)} rules allow traffic to anywhere"
    
    results.append({
        'control_id': f'EC2-SG-002-{sg_id}',
        'control_name': 'Security Group Outbound Rules',
        'resource': f"{sg_name} ({sg_id})",
        'status': outbound_status,
        'frameworks': ['NIST CSF', 'ISO 27001'],
        'framework': 'NIST CSF',
        'details': outbound_details,
        'timestamp': datetime.now().isoformat()
    })
    
    return results


def run_ec2_security_group_checks():
    """
    Main function to check all EC2 security groups.
    """
    print("=" * 60)
    print("🔒 AWS EC2 SECURITY GROUP CHECKER")
    print("=" * 60)
    
    try:
        # Get all security groups in the account
        response = ec2.describe_security_groups()
        security_groups = response['SecurityGroups']
        
        print(f"\nFound {len(security_groups)} security group(s)")
        
        if len(security_groups) == 0:
            print("\nNo security groups found.")
            return None
        
        all_results = []
        
        # Check each security group
        for sg in security_groups:
            sg_results = check_single_security_group(sg)
            all_results.extend(sg_results)
        
        # Calculate summary
        total_checks = len(all_results)
        passed = len([r for r in all_results if r['status'] == 'passed'])
        failed = len([r for r in all_results if r['status'] == 'failed'])
        warnings = len([r for r in all_results if r['status'] == 'warning'])
        
        print("\n" + "=" * 60)
        print("📊 SUMMARY")
        print("=" * 60)
        print(f"Total Security Groups: {len(security_groups)}")
        print(f"Total Checks: {total_checks}")
        print(f"✅ Passed: {passed}")
        print(f"❌ Failed: {failed}")
        print(f"⚠️ Warnings: {warnings}")
        
        if total_checks > 0:
            score = (passed / total_checks * 100)
            print(f"\nEC2 Security Group Score: {score:.0f}%")
        
        # Save report
        output = {
            'scan_time': datetime.now().isoformat(),
            'total_security_groups': len(security_groups),
            'total_checks': total_checks,
            'passed': passed,
            'failed': failed,
            'warnings': warnings,
            'compliance_score': round(passed / total_checks * 100, 2) if total_checks > 0 else 0,
            'controls': all_results
        }
        
        try:
            import os
            if 'AWS_LAMBDA_FUNCTION_NAME' not in os.environ:
                with open('ec2_compliance_report.json', 'w') as f:
                    json.dump(output, f, indent=2)
                print("\n💾 Report saved to: ec2_compliance_report.json")
        except Exception:
            pass
        
        return output
        
    except Exception as e:
        print(f"\n❌ Error checking security groups: {str(e)}")
        return None


def main():
    """Main function for standalone execution."""
    run_ec2_security_group_checks()

if __name__ == "__main__":
    main()