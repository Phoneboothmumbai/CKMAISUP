import requests
import sys
import json
from datetime import datetime

class APITester:
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

    def run_test(self, name, method, endpoint, expected_status, data=None, token=None, description=""):
        """Run a single API test"""
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
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)

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
                    error_detail = response.json().get('detail', 'Unknown error')
                except:
                    error_detail = response.text[:200] if response.text else 'No response content'
                print(f"   Error: {error_detail}")
                self.failed_tests.append({"test": name, "expected": expected_status, "got": response.status_code, "error": error_detail})
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Connection Error: {str(e)}")
            self.failed_tests.append({"test": name, "expected": expected_status, "got": "Connection Error", "error": str(e)})
            return False, {}

    def test_health_check(self):
        """Test basic API health"""
        return self.run_test(
            "Health Check",
            "GET",
            "",
            200,
            description="Checking if API is accessible"
        )

    def test_customer_registration(self):
        """Test customer registration"""
        timestamp = datetime.now().strftime('%H%M%S')
        customer_data = {
            "name": f"Test Customer {timestamp}",
            "email": f"customer{timestamp}@test.com",
            "password": "TestPass123!",
            "role": "customer"
        }
        
        success, response = self.run_test(
            "Customer Registration",
            "POST",
            "auth/register",
            200,
            data=customer_data,
            description="Creating a new customer account"
        )
        
        if success and 'token' in response:
            self.token = response['token']
            self.customer_user_id = response['user']['id']
            print(f"   🔑 Customer token acquired, User ID: {self.customer_user_id}")
        
        return success

    def test_admin_registration(self):
        """Test admin registration"""
        timestamp = datetime.now().strftime('%H%M%S')
        admin_data = {
            "name": f"Test Admin {timestamp}",
            "email": f"admin{timestamp}@test.com",
            "password": "AdminPass123!",
            "role": "admin"
        }
        
        success, response = self.run_test(
            "Admin Registration",
            "POST",
            "auth/register",
            200,
            data=admin_data,
            description="Creating a new admin account"
        )
        
        if success and 'token' in response:
            self.admin_token = response['token']
            self.admin_user_id = response['user']['id']
            print(f"   🔑 Admin token acquired, User ID: {self.admin_user_id}")
        
        return success

    def test_customer_login(self):
        """Test customer login with existing credentials"""
        if not self.customer_user_id:
            print("❌ Skipping - No customer created")
            return False
            
        # Try to login again (won't work since we don't store the email, but let's test auth/me instead)
        success, response = self.run_test(
            "Customer Auth Check",
            "GET",
            "auth/me",
            200,
            token=self.token,
            description="Verifying customer authentication"
        )
        return success

    def test_admin_login(self):
        """Test admin authentication"""
        if not self.admin_user_id:
            print("❌ Skipping - No admin created")
            return False
            
        success, response = self.run_test(
            "Admin Auth Check",
            "GET",
            "auth/me",
            200,
            token=self.admin_token,
            description="Verifying admin authentication"
        )
        return success

    def test_knowledge_base_crud(self):
        """Test knowledge base CRUD operations (Admin only)"""
        if not self.admin_token:
            print("❌ Skipping KB tests - No admin token")
            return False

        # Test GET knowledge base
        self.run_test(
            "Get Knowledge Base",
            "GET",
            "knowledge-base",
            200,
            token=self.admin_token,
            description="Fetching knowledge base entries"
        )

        # Test CREATE knowledge base entry
        kb_data = {
            "category": "Network",
            "problem_keywords": ["internet", "wifi", "connection"],
            "description": "Test network troubleshooting entry",
            "commands": [
                {
                    "name": "Flush DNS",
                    "command": "Clear-DnsClientCache",
                    "description": "Clears the DNS resolver cache"
                }
            ],
            "requires_reboot": False,
            "risk_level": "low"
        }
        
        success, response = self.run_test(
            "Create Knowledge Entry",
            "POST",
            "knowledge-base",
            200,
            data=kb_data,
            token=self.admin_token,
            description="Creating a new knowledge base entry"
        )
        
        if success and 'id' in response:
            self.test_kb_entry_id = response['id']
            print(f"   📝 KB Entry created with ID: {self.test_kb_entry_id}")

            # Test UPDATE knowledge base entry
            update_data = kb_data.copy()
            update_data['description'] = "Updated test network troubleshooting entry"
            
            self.run_test(
                "Update Knowledge Entry",
                "PUT",
                f"knowledge-base/{self.test_kb_entry_id}",
                200,
                data=update_data,
                token=self.admin_token,
                description="Updating the knowledge base entry"
            )

            # Test DELETE knowledge base entry
            self.run_test(
                "Delete Knowledge Entry",
                "DELETE",
                f"knowledge-base/{self.test_kb_entry_id}",
                200,
                token=self.admin_token,
                description="Deleting the knowledge base entry"
            )

        return success

    def test_devices_endpoint(self):
        """Test devices endpoint"""
        if not self.token:
            print("❌ Skipping - No customer token")
            return False
            
        return self.run_test(
            "Get Devices",
            "GET",
            "devices",
            200,
            token=self.token,
            description="Fetching available devices from MeshCentral"
        )

    def test_ticket_creation(self):
        """Test ticket creation and chat"""
        if not self.token:
            print("❌ Skipping - No customer token")
            return False

        ticket_data = {
            "device_id": None,
            "initial_message": "My computer is running very slowly, can you help?"
        }
        
        success, response = self.run_test(
            "Create Ticket",
            "POST",
            "tickets",
            200,
            data=ticket_data,
            token=self.token,
            description="Creating a new support ticket"
        )
        
        if success and 'id' in response:
            self.test_ticket_id = response['id']
            print(f"   🎫 Ticket created with ID: {self.test_ticket_id}")
            
            # Test getting the ticket
            self.run_test(
                "Get Ticket",
                "GET",
                f"tickets/{self.test_ticket_id}",
                200,
                token=self.token,
                description="Fetching ticket details"
            )
            
            # Test getting ticket messages
            self.run_test(
                "Get Ticket Messages",
                "GET",
                f"tickets/{self.test_ticket_id}/messages",
                200,
                token=self.token,
                description="Fetching ticket chat messages"
            )
            
            # Test sending a message
            message_data = {"message": "Yes, it's been slow for a few days now"}
            self.run_test(
                "Send Chat Message",
                "POST",
                f"tickets/{self.test_ticket_id}/messages",
                200,
                data=message_data,
                token=self.token,
                description="Sending a chat message"
            )

        return success

    def test_admin_features(self):
        """Test admin-only features"""
        if not self.admin_token:
            print("❌ Skipping admin tests - No admin token")
            return False

        # Test stats endpoint
        self.run_test(
            "Get Admin Stats",
            "GET",
            "stats",
            200,
            token=self.admin_token,
            description="Fetching admin dashboard statistics"
        )

        # Test audit logs
        self.run_test(
            "Get Audit Logs",
            "GET",
            "audit-logs",
            200,
            token=self.admin_token,
            description="Fetching audit logs"
        )

        # Test all tickets (admin view)
        self.run_test(
            "Get All Tickets (Admin)",
            "GET",
            "tickets",
            200,
            token=self.admin_token,
            description="Fetching all tickets as admin"
        )

        return True

    def test_unauthorized_access(self):
        """Test that endpoints properly reject unauthorized access"""
        print("\n🔒 Testing Authorization...")
        
        # Test accessing admin endpoint without token
        self.run_test(
            "Unauthorized Admin Stats",
            "GET",
            "stats",
            401,
            description="Ensuring stats endpoint requires authentication"
        )
        
        # Test accessing admin endpoint with customer token
        if self.token:
            self.run_test(
                "Customer Access Admin Stats",
                "GET",
                "stats",
                403,
                token=self.token,
                description="Ensuring customer cannot access admin endpoints"
            )

        return True

def main():
    print("🚀 Starting MeshSupport AI API Testing\n")
    print("=" * 50)
    
    tester = APITester()
    
    # Test sequence
    test_functions = [
        ("Basic Connectivity", tester.test_health_check),
        ("User Registration", lambda: tester.test_customer_registration() and tester.test_admin_registration()),
        ("Authentication", lambda: tester.test_customer_login() and tester.test_admin_login()),
        ("Authorization Controls", tester.test_unauthorized_access),
        ("Knowledge Base CRUD", tester.test_knowledge_base_crud),
        ("Device Management", tester.test_devices_endpoint),
        ("Ticket System", tester.test_ticket_creation),
        ("Admin Features", tester.test_admin_features),
    ]
    
    for category_name, test_func in test_functions:
        print(f"\n" + "=" * 50)
        print(f"📋 {category_name}")
        print("=" * 50)
        try:
            test_func()
        except Exception as e:
            print(f"❌ Category failed with exception: {e}")
    
    # Print summary
    print("\n" + "=" * 50)
    print("📊 TEST SUMMARY")
    print("=" * 50)
    print(f"Tests run: {tester.tests_run}")
    print(f"Tests passed: {tester.tests_passed}")
    print(f"Tests failed: {tester.tests_run - tester.tests_passed}")
    print(f"Success rate: {(tester.tests_passed/tester.tests_run*100):.1f}%" if tester.tests_run > 0 else "No tests run")
    
    if tester.failed_tests:
        print(f"\n❌ Failed Tests:")
        for i, failure in enumerate(tester.failed_tests, 1):
            print(f"{i}. {failure['test']}: Expected {failure['expected']}, got {failure['got']}")
            print(f"   Error: {failure['error']}")
    
    # Return appropriate exit code
    if tester.tests_run == 0:
        return 1
    
    success_rate = tester.tests_passed / tester.tests_run
    return 0 if success_rate >= 0.8 else 1  # 80% success threshold

if __name__ == "__main__":
    sys.exit(main())