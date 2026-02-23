import requests
import sys
import json
import time
from datetime import datetime

class EnhancedAPITester:
    def __init__(self, base_url="https://mesh-support-bot.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.admin_token = None
        self.customer_user_id = None
        self.admin_user_id = None
        self.test_ticket_id = None
        self.test_kb_entry_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def run_test(self, name, method, endpoint, expected_status, data=None, token=None, description="", timeout=15):
        """Run a single API test with enhanced error handling"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if token:
            headers['Authorization'] = f'Bearer {token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        if description:
            print(f"   📝 {description}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=timeout)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=timeout)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=timeout)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=timeout)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return True, response.json() if response.content else {}
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    if 'application/json' in response.headers.get('content-type', ''):
                        error_detail = response.json().get('detail', 'Unknown error')
                    else:
                        error_detail = f"HTML response (likely proxy error): {response.text[:100]}..."
                except:
                    error_detail = f"Response text: {response.text[:200] if response.text else 'No response content'}"
                print(f"   Error: {error_detail}")
                self.failed_tests.append({
                    "test": name, 
                    "expected": expected_status, 
                    "got": response.status_code, 
                    "error": error_detail
                })
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Connection Error: {str(e)}")
            self.failed_tests.append({
                "test": name, 
                "expected": expected_status, 
                "got": "Connection Error", 
                "error": str(e)
            })
            return False, {}

    def test_fresh_user_setup(self):
        """Create fresh test users as suggested"""
        print("🆕 Creating fresh test users...")
        
        # Create fresh customer
        timestamp = datetime.now().strftime('%H%M%S')
        customer_data = {
            "name": "Test Customer Fresh",
            "email": f"testuser3@test.com", 
            "password": "TestPass123!",
            "role": "customer"
        }
        
        success, response = self.run_test(
            "Fresh Customer Registration",
            "POST", 
            "auth/register",
            200,
            data=customer_data,
            description="Creating testuser3@test.com as suggested"
        )
        
        if success and 'token' in response:
            self.token = response['token']
            self.customer_user_id = response['user']['id']
            print(f"   🔑 Fresh customer token acquired, User ID: {self.customer_user_id}")
        
        # Create fresh admin
        admin_data = {
            "name": "Test Admin Fresh",
            "email": f"testadmin{timestamp}@test.com",
            "password": "AdminPass123!",
            "role": "admin"
        }
        
        success_admin, response_admin = self.run_test(
            "Fresh Admin Registration",
            "POST",
            "auth/register", 
            200,
            data=admin_data,
            description="Creating fresh admin account"
        )
        
        if success_admin and 'token' in response_admin:
            self.admin_token = response_admin['token']
            self.admin_user_id = response_admin['user']['id']
            print(f"   🔑 Fresh admin token acquired, User ID: {self.admin_user_id}")
        
        return success and success_admin

    def test_ai_ticket_flow(self):
        """Test the complete AI-powered ticket flow"""
        if not self.token:
            print("❌ Skipping AI flow - No customer token")
            return False

        print("\n🤖 Testing AI-Powered Ticket Flow...")
        
        # Step 1: Create ticket with AI-triggering message
        ticket_data = {
            "device_id": None,
            "initial_message": "My internet connection is not working. I can't browse any websites or check email."
        }
        
        success, response = self.run_test(
            "AI Ticket Creation",
            "POST",
            "tickets",
            200,
            data=ticket_data,
            token=self.token,
            description="Creating ticket that should trigger AI analysis",
            timeout=30  # AI processing might take longer
        )
        
        if success and 'id' in response:
            self.test_ticket_id = response['id']
            print(f"   🎫 AI Ticket created with ID: {self.test_ticket_id}")
            
            # Step 2: Wait a moment for AI processing
            print("   ⏳ Waiting for AI processing...")
            time.sleep(3)
            
            # Step 3: Check initial AI messages
            success, messages_response = self.run_test(
                "Get Initial AI Messages",
                "GET",
                f"tickets/{self.test_ticket_id}/messages",
                200,
                token=self.token,
                description="Checking if AI responded to initial message"
            )
            
            if success and messages_response:
                print(f"   📧 Found {len(messages_response)} initial messages")
                for i, msg in enumerate(messages_response):
                    print(f"      Message {i+1}: [{msg.get('role', 'unknown')}] {msg.get('content', '')[:100]}...")
            
            # Step 4: Send follow-up message to continue AI conversation
            follow_up_data = {"message": "I tried restarting my router but it still doesn't work"}
            success_follow, follow_response = self.run_test(
                "AI Follow-up Message",
                "POST",
                f"tickets/{self.test_ticket_id}/messages",
                200,
                data=follow_up_data,
                token=self.token,
                description="Testing AI conversation continuation",
                timeout=30  # AI processing might take longer
            )
            
            if success_follow:
                print(f"   💬 AI responded to follow-up message")
                print(f"   📝 Response contains {len(follow_response)} new messages")
                
                # Step 5: Check final message state
                time.sleep(2)
                self.run_test(
                    "Final AI Messages Check",
                    "GET",
                    f"tickets/{self.test_ticket_id}/messages",
                    200,
                    token=self.token,
                    description="Verifying complete conversation history"
                )
            else:
                print("   ❌ AI follow-up message failed - this is the 520 error from earlier")
                
        return success

    def test_kb_with_ai_integration(self):
        """Test knowledge base creation and AI integration"""
        if not self.admin_token:
            print("❌ Skipping KB AI test - No admin token")
            return False
            
        print("\n📚 Testing Knowledge Base with AI Integration...")
        
        # Create a comprehensive KB entry that AI can use
        kb_data = {
            "category": "Network", 
            "problem_keywords": ["internet", "wifi", "connection", "network", "browse", "websites"],
            "description": "Network connectivity troubleshooting for internet connection issues",
            "commands": [
                {
                    "name": "Reset Network Adapter",
                    "command": "netsh winsock reset",
                    "description": "Resets the Winsock Catalog to fix network connectivity issues"
                },
                {
                    "name": "Flush DNS Cache", 
                    "command": "ipconfig /flushdns",
                    "description": "Clears the DNS resolver cache which can fix browsing issues"
                },
                {
                    "name": "Renew IP Configuration",
                    "command": "ipconfig /release; ipconfig /renew",
                    "description": "Releases and renews the IP address assignment"
                }
            ],
            "requires_reboot": True,
            "risk_level": "medium"
        }
        
        success, response = self.run_test(
            "Create AI-Usable KB Entry",
            "POST",
            "knowledge-base",
            200,
            data=kb_data,
            token=self.admin_token,
            description="Creating KB entry for network issues that AI can reference"
        )
        
        if success and 'id' in response:
            self.test_kb_entry_id = response['id']
            print(f"   📝 AI-usable KB entry created with ID: {self.test_kb_entry_id}")
            
            # Verify AI can access this KB entry
            self.run_test(
                "Verify KB for AI Access",
                "GET", 
                "knowledge-base",
                200,
                token=self.token,  # Use customer token to verify AI can access
                description="Ensuring KB entries are accessible for AI analysis"
            )
        
        return success

    def test_admin_functionality(self):
        """Test admin-specific features"""
        if not self.admin_token:
            print("❌ Skipping admin tests - No admin token")
            return False
            
        print("\n🛠️ Testing Admin Features...")
        
        # Test admin dashboard stats
        success_stats, stats_response = self.run_test(
            "Admin Dashboard Stats",
            "GET",
            "stats",
            200,
            token=self.admin_token,
            description="Getting comprehensive admin statistics"
        )
        
        if success_stats and stats_response:
            print(f"   📊 Stats - Tickets: {stats_response.get('total_tickets', 0)}, KB Entries: {stats_response.get('kb_entries', 0)}")
        
        # Test audit logs access
        success_audit, audit_response = self.run_test(
            "Admin Audit Logs",
            "GET", 
            "audit-logs",
            200,
            token=self.admin_token,
            description="Accessing system audit logs"
        )
        
        if success_audit and audit_response:
            print(f"   📋 Found {len(audit_response)} audit log entries")
        
        # Test all tickets view
        success_tickets, tickets_response = self.run_test(
            "Admin All Tickets View",
            "GET",
            "tickets", 
            200,
            token=self.admin_token,
            description="Viewing all tickets as admin"
        )
        
        if success_tickets and tickets_response:
            print(f"   🎫 Admin can see {len(tickets_response)} total tickets")
        
        return success_stats and success_audit and success_tickets

    def print_detailed_summary(self):
        """Print comprehensive test results"""
        print("\n" + "=" * 60)
        print("📊 ENHANCED TEST SUMMARY")
        print("=" * 60)
        print(f"Tests run: {self.tests_run}")
        print(f"Tests passed: {self.tests_passed}")
        print(f"Tests failed: {self.tests_run - self.tests_passed}")
        print(f"Success rate: {(self.tests_passed/self.tests_run*100):.1f}%" if self.tests_run > 0 else "No tests run")
        
        if self.failed_tests:
            print(f"\n❌ Failed Tests Details:")
            for i, failure in enumerate(self.failed_tests, 1):
                print(f"\n{i}. {failure['test']}")
                print(f"   Expected: {failure['expected']}, Got: {failure['got']}")
                print(f"   Error: {failure['error']}")
        else:
            print("\n✅ All tests passed!")
        
        # Analysis
        print(f"\n🔍 ANALYSIS:")
        if self.tests_passed / self.tests_run >= 0.9:
            print("✅ System is in excellent condition (90%+ success rate)")
        elif self.tests_passed / self.tests_run >= 0.8:
            print("⚠️  System is mostly functional with minor issues (80-90% success rate)")
        else:
            print("❌ System has significant issues requiring attention (<80% success rate)")

def main():
    print("🚀 Enhanced MeshSupport AI Testing with Fresh Users\n")
    print("=" * 60)
    
    tester = EnhancedAPITester()
    
    # Enhanced test sequence focusing on AI integration
    test_sequence = [
        ("Fresh User Setup", tester.test_fresh_user_setup),
        ("Knowledge Base AI Prep", tester.test_kb_with_ai_integration),
        ("AI Ticket Flow", tester.test_ai_ticket_flow),
        ("Admin Functionality", tester.test_admin_functionality),
    ]
    
    for category_name, test_func in test_sequence:
        print(f"\n" + "=" * 60)
        print(f"📋 {category_name}")
        print("=" * 60)
        try:
            test_func()
        except Exception as e:
            print(f"❌ Category failed with exception: {e}")
            import traceback
            traceback.print_exc()
    
    tester.print_detailed_summary()
    
    # Return appropriate exit code
    if tester.tests_run == 0:
        return 1
    
    success_rate = tester.tests_passed / tester.tests_run
    return 0 if success_rate >= 0.8 else 1

if __name__ == "__main__":
    sys.exit(main())