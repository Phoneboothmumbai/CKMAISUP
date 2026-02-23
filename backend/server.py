from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone
import jwt
import bcrypt
import httpx
import asyncio
import json

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Config
JWT_SECRET = os.environ.get('JWT_SECRET', 'meshsupport-ai-secret-key-2024')
JWT_ALGORITHM = 'HS256'

# MeshCentral Config
MESHCENTRAL_URL = os.environ.get('MESHCENTRAL_URL', '')
MESHCENTRAL_USERNAME = os.environ.get('MESHCENTRAL_USERNAME', '')
MESHCENTRAL_PASSWORD = os.environ.get('MESHCENTRAL_PASSWORD', '')

# Create the main app
app = FastAPI(title="MeshSupport AI")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

security = HTTPBearer(auto_error=False)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============== MODELS ==============

class UserCreate(BaseModel):
    email: str
    password: str
    name: str
    role: str = "customer"  # customer or admin

class UserLogin(BaseModel):
    email: str
    password: str

class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    name: str
    role: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class KnowledgeBaseEntry(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    category: str
    problem_keywords: List[str]
    description: str
    commands: List[Dict[str, str]]  # [{"name": "cmd_name", "command": "actual command", "description": "what it does"}]
    requires_reboot: bool = False
    risk_level: str = "low"  # low, medium, high
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class KnowledgeBaseCreate(BaseModel):
    category: str
    problem_keywords: List[str]
    description: str
    commands: List[Dict[str, str]]
    requires_reboot: bool = False
    risk_level: str = "low"

class TicketCreate(BaseModel):
    device_id: Optional[str] = None
    initial_message: str

class Ticket(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    device_id: Optional[str] = None
    device_name: Optional[str] = None
    status: str = "open"  # open, in_progress, resolved, escalated
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ChatMessage(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    ticket_id: str
    role: str  # user, ai, system
    content: str
    command_executed: Optional[str] = None
    command_result: Optional[str] = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SendMessage(BaseModel):
    message: str

class AuditLog(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    ticket_id: str
    user_id: str
    device_id: str
    command: str
    result: str
    success: bool
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# ============== AUTH HELPERS ==============

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())

def create_token(user_id: str, role: str) -> str:
    payload = {
        'user_id': user_id,
        'role': role,
        'exp': datetime.now(timezone.utc).timestamp() + 86400 * 7  # 7 days
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user = await db.users.find_one({"id": payload['user_id']}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def require_admin(user: dict = Depends(get_current_user)):
    if user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

# ============== MESHCENTRAL SERVICE ==============

class MeshCentralService:
    def __init__(self):
        self.base_url = MESHCENTRAL_URL.rstrip('/')
        self.username = MESHCENTRAL_USERNAME
        self.password = MESHCENTRAL_PASSWORD
        self.auth_cookie = None
        self.logged_in = False
        
    async def login(self) -> bool:
        """Authenticate with MeshCentral using token credentials"""
        try:
            async with httpx.AsyncClient(verify=False, timeout=30.0) as client:
                # Try form-based login (MeshCentral standard)
                response = await client.post(
                    f"{self.base_url}/",
                    data={
                        "action": "login",
                        "username": self.username,
                        "password": self.password
                    },
                    follow_redirects=True
                )
                if response.status_code == 200 and 'login' not in response.text.lower()[:500]:
                    self.auth_cookie = response.cookies
                    self.logged_in = True
                    logger.info("MeshCentral login successful")
                    return True
                    
                # Alternative: Basic auth header for API
                logger.warning("Form login may have failed, will try basic auth on requests")
                self.logged_in = True  # Try anyway with basic auth
                return True
        except Exception as e:
            logger.error(f"MeshCentral connection error: {e}")
            return False
    
    def _get_auth_headers(self) -> Dict[str, str]:
        """Get authentication headers"""
        import base64
        credentials = base64.b64encode(f"{self.username}:{self.password}".encode()).decode()
        return {"Authorization": f"Basic {credentials}"}
    
    async def get_devices(self) -> List[Dict]:
        """Get all devices from MeshCentral using the meshctrl-like API"""
        try:
            if not self.logged_in:
                await self.login()
            
            async with httpx.AsyncClient(verify=False, timeout=30.0) as client:
                # MeshCentral uses POST to /meshagents with action parameter
                kwargs = {"headers": self._get_auth_headers()}
                if self.auth_cookie:
                    kwargs["cookies"] = self.auth_cookie
                
                # Try different API endpoints that MeshCentral might support
                endpoints_to_try = [
                    (f"{self.base_url}/meshagents?user={self.username}", "GET"),
                    (f"{self.base_url}/api/meshes", "GET"),
                    (f"{self.base_url}/nodes", "GET"),
                ]
                
                for url, method in endpoints_to_try:
                    try:
                        if method == "GET":
                            response = await client.get(url, **kwargs)
                        else:
                            response = await client.post(url, **kwargs)
                        
                        if response.status_code == 200:
                            try:
                                data = response.json()
                                devices = []
                                if isinstance(data, dict):
                                    for mesh_id, mesh_data in data.items():
                                        if isinstance(mesh_data, dict):
                                            for node_id, node_data in mesh_data.items():
                                                if isinstance(node_data, dict):
                                                    devices.append({
                                                        "id": str(node_id),
                                                        "name": str(node_data.get("name", "Unknown")),
                                                        "mesh_id": str(mesh_id),
                                                        "online": bool(node_data.get("conn", 0) > 0),
                                                        "os": str(node_data.get("osdesc", "Unknown")),
                                                        "ip": str(node_data.get("ip", ""))
                                                    })
                                elif isinstance(data, list):
                                    for item in data:
                                        if isinstance(item, dict):
                                            devices.append({
                                                "id": str(item.get("_id", item.get("id", ""))),
                                                "name": str(item.get("name", "Unknown")),
                                                "mesh_id": str(item.get("meshid", "")),
                                                "online": bool(item.get("conn", item.get("online", 0)) > 0),
                                                "os": str(item.get("osdesc", item.get("os", "Unknown"))),
                                                "ip": str(item.get("ip", ""))
                                            })
                                if devices:
                                    return devices
                            except Exception as json_err:
                                logger.debug(f"Failed to parse response from {url}: {json_err}")
                                continue
                    except Exception as req_err:
                        logger.debug(f"Request to {url} failed: {req_err}")
                        continue
                
                logger.warning(f"MeshCentral: Could not fetch devices from any endpoint")
                return []
        except Exception as e:
            logger.error(f"Error getting devices: {e}")
            return []
    
    async def run_command(self, node_id: str, command: str, powershell: bool = True) -> Dict:
        """Execute a command on a remote device"""
        try:
            if not self.logged_in:
                await self.login()
            
            async with httpx.AsyncClient(verify=False, timeout=60.0) as client:
                kwargs = {"headers": self._get_auth_headers()}
                if self.auth_cookie:
                    kwargs["cookies"] = self.auth_cookie
                
                # Use MeshCentral's command API
                response = await client.post(
                    f"{self.base_url}/api/devices",
                    json={
                        "action": "runcommands",
                        "nodeids": [node_id],
                        "type": 2 if powershell else 1,  # 1=cmd, 2=powershell
                        "cmds": command,
                        "runAsUser": 0
                    },
                    **kwargs
                )
                
                if response.status_code == 200:
                    return {"success": True, "result": "Command sent to device"}
                else:
                    return {"success": False, "result": f"MeshCentral returned status {response.status_code}"}
        except Exception as e:
            logger.error(f"Error running command: {e}")
            return {"success": False, "result": str(e)}

mesh_service = MeshCentralService()

# ============== AI SERVICE ==============

class AIService:
    def __init__(self):
        self.api_key = os.environ.get('EMERGENT_LLM_KEY', '')
    
    async def analyze_problem(self, user_message: str, knowledge_base: List[Dict], chat_history: List[Dict]) -> Dict:
        """Analyze user problem and find matching commands from knowledge base"""
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        
        # Build context from knowledge base
        kb_context = "Available solutions (ONLY use commands from this list):\n\n"
        for entry in knowledge_base:
            kb_context += f"Category: {entry['category']}\n"
            kb_context += f"Keywords: {', '.join(entry['problem_keywords'])}\n"
            kb_context += f"Description: {entry['description']}\n"
            kb_context += f"Commands: {json.dumps(entry['commands'])}\n"
            kb_context += f"Risk Level: {entry['risk_level']}\n"
            kb_context += f"Requires Reboot: {entry['requires_reboot']}\n\n"
        
        # Build chat history context
        history_context = ""
        for msg in chat_history[-10:]:  # Last 10 messages
            history_context += f"{msg['role'].upper()}: {msg['content']}\n"
        
        system_message = f"""You are an AI IT support assistant. Your job is to help non-technical users fix their computer problems.

CRITICAL RULES:
1. You can ONLY execute commands from the knowledge base below. NEVER suggest or run any other commands.
2. Users are non-technical - use simple, friendly language. No technical jargon.
3. Ask simple Yes/No questions to understand if the fix worked.
4. If no matching solution exists, respond with "ESCALATE" to involve a human technician.

{kb_context}

Your response must be in this JSON format:
{{
    "message": "Your friendly message to the user",
    "action": "execute|ask|escalate|resolved",
    "command_id": "id of command to execute (if action is execute)",
    "command": "the actual command to run (if action is execute)"
}}

- "execute": Run a command from knowledge base
- "ask": Ask user a simple Yes/No question
- "escalate": Problem needs human help
- "resolved": Issue is fixed"""

        try:
            chat = LlmChat(
                api_key=self.api_key,
                session_id=str(uuid.uuid4()),
                system_message=system_message
            ).with_model("openai", "gpt-5.2")
            
            user_msg = UserMessage(text=f"Chat History:\n{history_context}\n\nCurrent message: {user_message}")
            response = await chat.send_message(user_msg)
            
            # Parse JSON response
            try:
                # Try to extract JSON from response
                if "```json" in response:
                    json_str = response.split("```json")[1].split("```")[0]
                elif "```" in response:
                    json_str = response.split("```")[1].split("```")[0]
                else:
                    json_str = response
                
                result = json.loads(json_str.strip())
                return result
            except json.JSONDecodeError:
                return {
                    "message": response,
                    "action": "ask",
                    "command_id": None,
                    "command": None
                }
        except Exception as e:
            logger.error(f"AI analysis error: {e}")
            return {
                "message": "I'm having trouble understanding. Let me connect you with a technician.",
                "action": "escalate",
                "command_id": None,
                "command": None
            }

ai_service = AIService()

# ============== AUTH ROUTES ==============

@api_router.post("/auth/register")
async def register(user_data: UserCreate):
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user = User(
        email=user_data.email,
        name=user_data.name,
        role=user_data.role
    )
    
    user_dict = user.model_dump()
    user_dict['password_hash'] = hash_password(user_data.password)
    user_dict['created_at'] = user_dict['created_at'].isoformat()
    
    await db.users.insert_one(user_dict)
    # MongoDB adds _id, but we don't need it for the response
    
    token = create_token(user.id, user.role)
    return {"token": token, "user": {"id": user.id, "email": user.email, "name": user.name, "role": user.role}}

@api_router.post("/auth/login")
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user or not verify_password(credentials.password, user['password_hash']):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_token(user['id'], user['role'])
    return {"token": token, "user": {"id": user['id'], "email": user['email'], "name": user['name'], "role": user['role']}}

@api_router.get("/auth/me")
async def get_me(user: dict = Depends(get_current_user)):
    return {"id": user['id'], "email": user['email'], "name": user['name'], "role": user['role']}

# ============== KNOWLEDGE BASE ROUTES ==============

@api_router.get("/knowledge-base")
async def get_knowledge_base(user: dict = Depends(get_current_user)):
    entries = await db.knowledge_base.find({}, {"_id": 0}).to_list(1000)
    return entries

@api_router.post("/knowledge-base")
async def create_knowledge_entry(entry_data: KnowledgeBaseCreate, user: dict = Depends(require_admin)):
    entry = KnowledgeBaseEntry(**entry_data.model_dump())
    entry_dict = entry.model_dump()
    entry_dict['created_at'] = entry_dict['created_at'].isoformat()
    entry_dict['updated_at'] = entry_dict['updated_at'].isoformat()
    
    await db.knowledge_base.insert_one(entry_dict)
    # Remove MongoDB's _id before returning
    entry_dict.pop('_id', None)
    return entry_dict

@api_router.put("/knowledge-base/{entry_id}")
async def update_knowledge_entry(entry_id: str, entry_data: KnowledgeBaseCreate, user: dict = Depends(require_admin)):
    update_dict = entry_data.model_dump()
    update_dict['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    result = await db.knowledge_base.update_one(
        {"id": entry_id},
        {"$set": update_dict}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Entry not found")
    
    return {"success": True}

@api_router.delete("/knowledge-base/{entry_id}")
async def delete_knowledge_entry(entry_id: str, user: dict = Depends(require_admin)):
    result = await db.knowledge_base.delete_one({"id": entry_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Entry not found")
    return {"success": True}

# ============== DEVICES ROUTES ==============

@api_router.get("/devices")
async def get_devices(user: dict = Depends(get_current_user)):
    devices = await mesh_service.get_devices()
    return devices

@api_router.post("/devices/{device_id}/test")
async def test_device_connection(device_id: str, user: dict = Depends(get_current_user)):
    result = await mesh_service.run_command(device_id, "whoami", powershell=True)
    return result

# ============== TICKETS ROUTES ==============

@api_router.get("/tickets")
async def get_tickets(user: dict = Depends(get_current_user)):
    if user['role'] == 'admin':
        tickets = await db.tickets.find({}, {"_id": 0}).to_list(1000)
    else:
        tickets = await db.tickets.find({"user_id": user['id']}, {"_id": 0}).to_list(100)
    
    # Sort by created_at descending
    tickets.sort(key=lambda x: x.get('created_at', ''), reverse=True)
    return tickets

@api_router.post("/tickets")
async def create_ticket(ticket_data: TicketCreate, user: dict = Depends(get_current_user)):
    ticket = Ticket(
        user_id=user['id'],
        device_id=ticket_data.device_id
    )
    
    # Get device name if device_id provided
    if ticket_data.device_id:
        devices = await mesh_service.get_devices()
        for device in devices:
            if device['id'] == ticket_data.device_id:
                ticket.device_name = device['name']
                break
    
    ticket_dict = ticket.model_dump()
    ticket_dict['created_at'] = ticket_dict['created_at'].isoformat()
    ticket_dict['updated_at'] = ticket_dict['updated_at'].isoformat()
    
    await db.tickets.insert_one(ticket_dict)
    
    # Create initial user message
    if ticket_data.initial_message:
        message = ChatMessage(
            ticket_id=ticket.id,
            role="user",
            content=ticket_data.initial_message
        )
        msg_dict = message.model_dump()
        msg_dict['timestamp'] = msg_dict['timestamp'].isoformat()
        await db.chat_messages.insert_one(msg_dict)
        
        # Get AI response
        knowledge_base = await db.knowledge_base.find({}, {"_id": 0}).to_list(1000)
        ai_response = await ai_service.analyze_problem(
            ticket_data.initial_message,
            knowledge_base,
            [{"role": "user", "content": ticket_data.initial_message}]
        )
        
        # Create AI message
        ai_message = ChatMessage(
            ticket_id=ticket.id,
            role="ai",
            content=ai_response.get('message', 'I understand you need help. Let me look into this.')
        )
        ai_msg_dict = ai_message.model_dump()
        ai_msg_dict['timestamp'] = ai_msg_dict['timestamp'].isoformat()
        await db.chat_messages.insert_one(ai_msg_dict)
        
        # Execute command if needed
        if ai_response.get('action') == 'execute' and ai_response.get('command') and ticket_data.device_id:
            command = ai_response['command']
            result = await mesh_service.run_command(ticket_data.device_id, command)
            
            # Log audit
            audit = AuditLog(
                ticket_id=ticket.id,
                user_id=user['id'],
                device_id=ticket_data.device_id,
                command=command,
                result=result.get('result', ''),
                success=result.get('success', False)
            )
            audit_dict = audit.model_dump()
            audit_dict['timestamp'] = audit_dict['timestamp'].isoformat()
            await db.audit_logs.insert_one(audit_dict)
            
            # Create system message for command execution
            system_message = ChatMessage(
                ticket_id=ticket.id,
                role="system",
                content=f"Command executed: {command}",
                command_executed=command,
                command_result=result.get('result', '')
            )
            sys_msg_dict = system_message.model_dump()
            sys_msg_dict['timestamp'] = sys_msg_dict['timestamp'].isoformat()
            await db.chat_messages.insert_one(sys_msg_dict)
    
    # Remove MongoDB's _id before returning
    ticket_dict.pop('_id', None)
    return ticket_dict

@api_router.get("/tickets/{ticket_id}")
async def get_ticket(ticket_id: str, user: dict = Depends(get_current_user)):
    ticket = await db.tickets.find_one({"id": ticket_id}, {"_id": 0})
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    if user['role'] != 'admin' and ticket['user_id'] != user['id']:
        raise HTTPException(status_code=403, detail="Access denied")
    
    return ticket

@api_router.get("/tickets/{ticket_id}/messages")
async def get_ticket_messages(ticket_id: str, user: dict = Depends(get_current_user)):
    ticket = await db.tickets.find_one({"id": ticket_id}, {"_id": 0})
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    if user['role'] != 'admin' and ticket['user_id'] != user['id']:
        raise HTTPException(status_code=403, detail="Access denied")
    
    messages = await db.chat_messages.find({"ticket_id": ticket_id}, {"_id": 0}).to_list(1000)
    messages.sort(key=lambda x: x.get('timestamp', ''))
    return messages

@api_router.post("/tickets/{ticket_id}/messages")
async def send_message(ticket_id: str, msg_data: SendMessage, user: dict = Depends(get_current_user)):
    ticket = await db.tickets.find_one({"id": ticket_id}, {"_id": 0})
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    if user['role'] != 'admin' and ticket['user_id'] != user['id']:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Save user message
    user_message = ChatMessage(
        ticket_id=ticket_id,
        role="user",
        content=msg_data.message
    )
    user_msg_dict = user_message.model_dump()
    user_msg_dict['timestamp'] = user_msg_dict['timestamp'].isoformat()
    await db.chat_messages.insert_one(user_msg_dict)
    # Remove _id added by MongoDB
    user_msg_dict.pop('_id', None)
    
    # Get chat history
    messages = await db.chat_messages.find({"ticket_id": ticket_id}, {"_id": 0}).to_list(100)
    chat_history = [{"role": m['role'], "content": m['content']} for m in messages]
    
    # Get AI response
    knowledge_base = await db.knowledge_base.find({}, {"_id": 0}).to_list(1000)
    ai_response = await ai_service.analyze_problem(
        msg_data.message,
        knowledge_base,
        chat_history
    )
    
    response_messages = [user_msg_dict]
    
    # Create AI message
    ai_message = ChatMessage(
        ticket_id=ticket_id,
        role="ai",
        content=ai_response.get('message', 'Let me help you with that.')
    )
    ai_msg_dict = ai_message.model_dump()
    ai_msg_dict['timestamp'] = ai_msg_dict['timestamp'].isoformat()
    await db.chat_messages.insert_one(ai_msg_dict)
    ai_msg_dict.pop('_id', None)
    response_messages.append(ai_msg_dict)
    
    # Execute command if needed
    if ai_response.get('action') == 'execute' and ai_response.get('command') and ticket.get('device_id'):
        command = ai_response['command']
        result = await mesh_service.run_command(ticket['device_id'], command)
        
        # Log audit
        audit = AuditLog(
            ticket_id=ticket_id,
            user_id=user['id'],
            device_id=ticket['device_id'],
            command=command,
            result=result.get('result', ''),
            success=result.get('success', False)
        )
        audit_dict = audit.model_dump()
        audit_dict['timestamp'] = audit_dict['timestamp'].isoformat()
        await db.audit_logs.insert_one(audit_dict)
        
        # Create system message for command execution
        system_message = ChatMessage(
            ticket_id=ticket_id,
            role="system",
            content=f"Executed: {command}",
            command_executed=command,
            command_result=result.get('result', '')
        )
        sys_msg_dict = system_message.model_dump()
        sys_msg_dict['timestamp'] = sys_msg_dict['timestamp'].isoformat()
        await db.chat_messages.insert_one(sys_msg_dict)
        sys_msg_dict.pop('_id', None)
        response_messages.append(sys_msg_dict)
    
    # Update ticket status based on AI action
    if ai_response.get('action') == 'escalate':
        await db.tickets.update_one({"id": ticket_id}, {"$set": {"status": "escalated", "updated_at": datetime.now(timezone.utc).isoformat()}})
    elif ai_response.get('action') == 'resolved':
        await db.tickets.update_one({"id": ticket_id}, {"$set": {"status": "resolved", "updated_at": datetime.now(timezone.utc).isoformat()}})
    else:
        await db.tickets.update_one({"id": ticket_id}, {"$set": {"status": "in_progress", "updated_at": datetime.now(timezone.utc).isoformat()}})
    
    return response_messages

@api_router.patch("/tickets/{ticket_id}/status")
async def update_ticket_status(ticket_id: str, status: str, user: dict = Depends(get_current_user)):
    if status not in ["open", "in_progress", "resolved", "escalated"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    result = await db.tickets.update_one(
        {"id": ticket_id},
        {"$set": {"status": status, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    return {"success": True}

# ============== AUDIT LOGS ROUTES ==============

@api_router.get("/audit-logs")
async def get_audit_logs(user: dict = Depends(require_admin)):
    logs = await db.audit_logs.find({}, {"_id": 0}).to_list(1000)
    logs.sort(key=lambda x: x.get('timestamp', ''), reverse=True)
    return logs

@api_router.get("/audit-logs/ticket/{ticket_id}")
async def get_ticket_audit_logs(ticket_id: str, user: dict = Depends(get_current_user)):
    logs = await db.audit_logs.find({"ticket_id": ticket_id}, {"_id": 0}).to_list(100)
    logs.sort(key=lambda x: x.get('timestamp', ''))
    return logs

# ============== STATS ROUTES ==============

@api_router.get("/stats")
async def get_stats(user: dict = Depends(require_admin)):
    total_tickets = await db.tickets.count_documents({})
    open_tickets = await db.tickets.count_documents({"status": "open"})
    resolved_tickets = await db.tickets.count_documents({"status": "resolved"})
    escalated_tickets = await db.tickets.count_documents({"status": "escalated"})
    total_commands = await db.audit_logs.count_documents({})
    successful_commands = await db.audit_logs.count_documents({"success": True})
    total_users = await db.users.count_documents({})
    kb_entries = await db.knowledge_base.count_documents({})
    
    return {
        "total_tickets": total_tickets,
        "open_tickets": open_tickets,
        "resolved_tickets": resolved_tickets,
        "escalated_tickets": escalated_tickets,
        "total_commands": total_commands,
        "successful_commands": successful_commands,
        "total_users": total_users,
        "kb_entries": kb_entries
    }

# ============== HEALTH CHECK ==============

@api_router.get("/")
async def root():
    return {"message": "MeshSupport AI API", "status": "running"}

@api_router.get("/health")
async def health():
    return {"status": "healthy", "meshcentral_url": MESHCENTRAL_URL}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    # Create indexes
    await db.users.create_index("email", unique=True)
    await db.users.create_index("id", unique=True)
    await db.tickets.create_index("id", unique=True)
    await db.tickets.create_index("user_id")
    await db.knowledge_base.create_index("id", unique=True)
    await db.chat_messages.create_index("ticket_id")
    await db.audit_logs.create_index("ticket_id")
    logger.info("Database indexes created")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
