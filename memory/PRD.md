# MeshSupport AI - Product Requirements Document

## Original Problem Statement
Build an AI-powered IT support system integrated with MeshCentral. Customers submit tickets describing their issues (e.g., "Outlook is broken", "Internet not working"). AI analyzes the ticket and automatically runs pre-approved PowerShell commands on the customer's computer via MeshCentral. Features include:
- Customer ticket submission for non-technical users
- AI chat-based troubleshooting with simple Yes/No questions
- Knowledge base of approved PowerShell commands (admin manageable)
- Command execution via MeshCentral API
- Audit logging of all actions
- Admin panel to manage commands and view tickets

## User Personas
1. **Customer (Non-Technical User)**: Needs simple interface to describe problems and receive automated help
2. **Administrator**: Manages knowledge base, monitors tickets, reviews audit logs

## Core Requirements
- User authentication (customer/admin roles)
- Ticket creation and management
- AI-powered problem analysis using GPT-5.2
- Knowledge base CRUD operations
- MeshCentral integration for remote command execution
- Audit logging for all command executions

## What's Been Implemented (Feb 23, 2026)

### Backend (FastAPI)
- ✅ User registration/login with JWT authentication
- ✅ Knowledge base CRUD (create, read, update, delete)
- ✅ Ticket creation with AI analysis
- ✅ Chat messaging with AI responses
- ✅ MeshCentral integration (authentication, device listing)
- ✅ Audit logging system
- ✅ Admin stats dashboard API

### Frontend (React)
- ✅ Login/Register pages with role selection
- ✅ Customer dashboard with ticket history
- ✅ Admin dashboard with stats overview
- ✅ Knowledge base management page
- ✅ Chat interface with AI responses
- ✅ Audit logs viewer
- ✅ All tickets list with filtering
- ✅ Dark theme UI with professional design

### Integrations
- ✅ GPT-5.2 via Emergent LLM key for AI analysis
- ✅ MeshCentral API integration (basic auth)
- ✅ MongoDB for data storage

## Prioritized Backlog

### P0 (Critical)
- None (core functionality implemented)

### P1 (High Priority)
- [ ] MeshCentral WebSocket for real-time command output
- [ ] Add more knowledge base entries with common IT solutions
- [ ] Implement command approval workflow for high-risk commands

### P2 (Medium Priority)
- [ ] File transfer between devices feature
- [ ] Outlook/Email configuration helpers
- [ ] System health monitoring dashboard
- [ ] Ticket assignment to technicians
- [ ] Email notifications for ticket updates

### P3 (Low Priority)
- [ ] Reports and analytics
- [ ] Multi-language support
- [ ] Mobile-responsive improvements
- [ ] Integration with external ticketing systems

## Tech Stack
- **Backend**: FastAPI, Python 3.11, Motor (MongoDB async)
- **Frontend**: React 19, TailwindCSS, Shadcn/UI
- **AI**: OpenAI GPT-5.2 via Emergent Integrations
- **Database**: MongoDB
- **Remote Management**: MeshCentral API

## MeshCentral Credentials (Stored in .env)
- URL: https://remote.thegoodmen.in/
- Token-based authentication configured
