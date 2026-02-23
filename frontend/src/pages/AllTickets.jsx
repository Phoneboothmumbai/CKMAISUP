import React, { useState, useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext, apiClient } from "../App";
import { Button } from "../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { toast } from "sonner";
import { 
  Terminal, 
  FileText,
  Database,
  BarChart3,
  TicketIcon,
  LogOut,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ChevronRight,
  Filter
} from "lucide-react";

export default function AllTickets() {
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const response = await apiClient.get("/tickets");
      setTickets(response.data);
    } catch (error) {
      toast.error("Failed to load tickets");
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "resolved":
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case "escalated":
        return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      default:
        return <Clock className="w-4 h-4 text-indigo-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "resolved":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "escalated":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "in_progress":
        return "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";
      default:
        return "bg-slate-500/10 text-slate-400 border-slate-500/20";
    }
  };

  const filteredTickets = statusFilter === "all" 
    ? tickets 
    : tickets.filter(t => t.status === statusFilter);

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
            <Link to="/admin" className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors">
              <BarChart3 className="w-5 h-5" />
              Dashboard
            </Link>
            <Link to="/admin/tickets" className="flex items-center gap-3 px-4 py-3 rounded-lg bg-indigo-500/10 text-indigo-400 font-medium">
              <TicketIcon className="w-5 h-5" />
              All Tickets
            </Link>
            <Link to="/admin/knowledge-base" className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors">
              <Database className="w-5 h-5" />
              Knowledge Base
            </Link>
            <Link to="/admin/audit-logs" className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors">
              <FileText className="w-5 h-5" />
              Audit Logs
            </Link>
          </nav>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-slate-800">
          <Button variant="outline" size="sm" onClick={logout} className="w-full border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800">
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
            <Link to="/admin" className="px-3 py-1.5 text-slate-400 hover:text-white rounded-full text-sm whitespace-nowrap">Dashboard</Link>
            <Link to="/admin/tickets" className="px-3 py-1.5 bg-indigo-500/10 text-indigo-400 rounded-full text-sm whitespace-nowrap">Tickets</Link>
            <Link to="/admin/knowledge-base" className="px-3 py-1.5 text-slate-400 hover:text-white rounded-full text-sm whitespace-nowrap">Knowledge Base</Link>
            <Link to="/admin/audit-logs" className="px-3 py-1.5 text-slate-400 hover:text-white rounded-full text-sm whitespace-nowrap">Audit Logs</Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="lg:ml-64 p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-bold text-white font-['Outfit']">All Tickets</h1>
            
            <div className="flex items-center gap-3">
              <Filter className="w-4 h-4 text-slate-400" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-slate-900 border-slate-800 text-white w-40" data-testid="status-filter">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800">
                  <SelectItem value="all" className="text-white hover:bg-slate-800">All Tickets</SelectItem>
                  <SelectItem value="open" className="text-white hover:bg-slate-800">Open</SelectItem>
                  <SelectItem value="in_progress" className="text-white hover:bg-slate-800">In Progress</SelectItem>
                  <SelectItem value="resolved" className="text-white hover:bg-slate-800">Resolved</SelectItem>
                  <SelectItem value="escalated" className="text-white hover:bg-slate-800">Escalated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {filteredTickets.length === 0 ? (
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-12 text-center">
              <TicketIcon className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">No tickets found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTickets.map((ticket) => (
                <button
                  key={ticket.id}
                  onClick={() => navigate(`/admin/chat/${ticket.id}`)}
                  className="w-full bg-slate-900/50 border border-slate-800 rounded-xl p-5 text-left hover:border-indigo-500/50 transition-all group"
                  data-testid={`ticket-${ticket.id}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {getStatusIcon(ticket.status)}
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(ticket.status)}`}>
                            {ticket.status.replace('_', ' ')}
                          </span>
                          <span className="text-xs text-slate-500 font-mono">ID: {ticket.id.slice(0, 8)}</span>
                        </div>
                        <p className="text-sm text-white">{ticket.device_name || "No device selected"}</p>
                        <p className="text-xs text-slate-500 mt-1 font-mono">
                          Created: {new Date(ticket.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-indigo-400 transition-colors" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
