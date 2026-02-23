import React, { useState, useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext, apiClient } from "../App";
import { Button } from "../components/ui/button";
import { toast } from "sonner";
import { 
  Terminal, 
  TicketIcon, 
  Database, 
  FileText, 
  LogOut,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Users,
  Cpu,
  BarChart3,
  Monitor
} from "lucide-react";

export default function AdminDashboard() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentTickets, setRecentTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, ticketsRes] = await Promise.all([
        apiClient.get("/stats"),
        apiClient.get("/tickets")
      ]);
      setStats(statsRes.data);
      setRecentTickets(ticketsRes.data.slice(0, 5));
    } catch (error) {
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "resolved":
        return "text-emerald-400";
      case "escalated":
        return "text-amber-400";
      case "in_progress":
        return "text-indigo-400";
      default:
        return "text-slate-400";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617]">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-slate-900/50 border-r border-slate-800 backdrop-blur-xl z-40 hidden lg:block">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center">
              <Terminal className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-lg font-semibold text-white font-['Outfit'] block">MeshSupport</span>
              <span className="text-xs text-slate-500">Admin Panel</span>
            </div>
          </div>

          <nav className="space-y-1">
            <Link
              to="/admin"
              className="flex items-center gap-3 px-4 py-3 rounded-lg bg-indigo-500/10 text-indigo-400 font-medium"
              data-testid="nav-dashboard"
            >
              <BarChart3 className="w-5 h-5" />
              Dashboard
            </Link>
            <Link
              to="/admin/tickets"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors"
              data-testid="nav-tickets"
            >
              <TicketIcon className="w-5 h-5" />
              All Tickets
            </Link>
            <Link
              to="/admin/devices"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors"
              data-testid="nav-devices"
            >
              <Monitor className="w-5 h-5" />
              Devices
            </Link>
            <Link
              to="/admin/knowledge-base"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors"
              data-testid="nav-knowledge-base"
            >
              <Database className="w-5 h-5" />
              Knowledge Base
            </Link>
            <Link
              to="/admin/audit-logs"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors"
              data-testid="nav-audit-logs"
            >
              <FileText className="w-5 h-5" />
              Audit Logs
            </Link>
          </nav>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-slate-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 bg-slate-700 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-white">{user?.name?.charAt(0)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={logout}
            className="w-full border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800"
            data-testid="logout-btn"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden border-b border-slate-800 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-30">
        <div className="px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-indigo-500 rounded-lg flex items-center justify-center">
                <Terminal className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-semibold text-white font-['Outfit']">Admin</span>
            </div>
            <Button variant="ghost" size="sm" onClick={logout} className="text-slate-400">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex gap-2 pb-4 overflow-x-auto">
            <Link to="/admin" className="px-3 py-1.5 bg-indigo-500/10 text-indigo-400 rounded-full text-sm whitespace-nowrap">Dashboard</Link>
            <Link to="/admin/tickets" className="px-3 py-1.5 text-slate-400 hover:text-white rounded-full text-sm whitespace-nowrap">Tickets</Link>
            <Link to="/admin/knowledge-base" className="px-3 py-1.5 text-slate-400 hover:text-white rounded-full text-sm whitespace-nowrap">Knowledge Base</Link>
            <Link to="/admin/audit-logs" className="px-3 py-1.5 text-slate-400 hover:text-white rounded-full text-sm whitespace-nowrap">Audit Logs</Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="lg:ml-64 p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold text-white font-['Outfit'] mb-8">Dashboard Overview</h1>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-indigo-500/10 rounded-lg flex items-center justify-center">
                  <TicketIcon className="w-5 h-5 text-indigo-400" />
                </div>
              </div>
              <p className="text-2xl font-bold text-white">{stats?.total_tickets || 0}</p>
              <p className="text-sm text-slate-500">Total Tickets</p>
            </div>

            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                </div>
              </div>
              <p className="text-2xl font-bold text-white">{stats?.resolved_tickets || 0}</p>
              <p className="text-sm text-slate-500">Resolved</p>
            </div>

            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-amber-500/10 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                </div>
              </div>
              <p className="text-2xl font-bold text-white">{stats?.escalated_tickets || 0}</p>
              <p className="text-sm text-slate-500">Escalated</p>
            </div>

            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-cyan-500/10 rounded-lg flex items-center justify-center">
                  <Cpu className="w-5 h-5 text-cyan-400" />
                </div>
              </div>
              <p className="text-2xl font-bold text-white">{stats?.total_commands || 0}</p>
              <p className="text-sm text-slate-500">Commands Run</p>
            </div>
          </div>

          {/* Secondary Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Open Tickets</p>
                  <p className="text-xl font-bold text-white">{stats?.open_tickets || 0}</p>
                </div>
                <Clock className="w-8 h-8 text-slate-600" />
              </div>
            </div>

            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Total Users</p>
                  <p className="text-xl font-bold text-white">{stats?.total_users || 0}</p>
                </div>
                <Users className="w-8 h-8 text-slate-600" />
              </div>
            </div>

            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Knowledge Base</p>
                  <p className="text-xl font-bold text-white">{stats?.kb_entries || 0}</p>
                </div>
                <Database className="w-8 h-8 text-slate-600" />
              </div>
            </div>
          </div>

          {/* Recent Tickets */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white font-['Outfit']">Recent Tickets</h2>
              <Link to="/admin/tickets" className="text-sm text-indigo-400 hover:text-indigo-300">
                View all
              </Link>
            </div>
            
            {recentTickets.length === 0 ? (
              <div className="p-12 text-center">
                <TicketIcon className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">No tickets yet</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-800">
                {recentTickets.map((ticket) => (
                  <button
                    key={ticket.id}
                    onClick={() => navigate(`/admin/chat/${ticket.id}`)}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-800/30 transition-colors text-left"
                    data-testid={`ticket-row-${ticket.id}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-2 h-2 rounded-full ${
                        ticket.status === "resolved" ? "bg-emerald-400" :
                        ticket.status === "escalated" ? "bg-amber-400" :
                        ticket.status === "in_progress" ? "bg-indigo-400" :
                        "bg-slate-400"
                      }`} />
                      <div>
                        <p className="text-sm text-white">{ticket.device_name || "No device"}</p>
                        <p className="text-xs text-slate-500">ID: {ticket.id.slice(0, 8)}...</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-medium capitalize ${getStatusColor(ticket.status)}`}>
                        {ticket.status.replace('_', ' ')}
                      </p>
                      <p className="text-xs text-slate-500">
                        {new Date(ticket.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
