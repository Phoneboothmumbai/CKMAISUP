import React, { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import { AuthContext, apiClient } from "../App";
import { Button } from "../components/ui/button";
import { toast } from "sonner";
import { 
  Terminal, 
  FileText,
  Database,
  BarChart3,
  TicketIcon,
  LogOut,
  CheckCircle2,
  XCircle,
  Clock
} from "lucide-react";

export default function AuditLogs() {
  const { logout } = useContext(AuthContext);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const response = await apiClient.get("/audit-logs");
      setLogs(response.data);
    } catch (error) {
      toast.error("Failed to load audit logs");
    } finally {
      setLoading(false);
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
            <Link to="/admin" className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors">
              <BarChart3 className="w-5 h-5" />
              Dashboard
            </Link>
            <Link to="/admin/tickets" className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors">
              <TicketIcon className="w-5 h-5" />
              All Tickets
            </Link>
            <Link to="/admin/knowledge-base" className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors">
              <Database className="w-5 h-5" />
              Knowledge Base
            </Link>
            <Link to="/admin/audit-logs" className="flex items-center gap-3 px-4 py-3 rounded-lg bg-indigo-500/10 text-indigo-400 font-medium">
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
            <Link to="/admin/tickets" className="px-3 py-1.5 text-slate-400 hover:text-white rounded-full text-sm whitespace-nowrap">Tickets</Link>
            <Link to="/admin/knowledge-base" className="px-3 py-1.5 text-slate-400 hover:text-white rounded-full text-sm whitespace-nowrap">Knowledge Base</Link>
            <Link to="/admin/audit-logs" className="px-3 py-1.5 bg-indigo-500/10 text-indigo-400 rounded-full text-sm whitespace-nowrap">Audit Logs</Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="lg:ml-64 p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold text-white font-['Outfit'] mb-8">Audit Logs</h1>

          {logs.length === 0 ? (
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-12 text-center">
              <FileText className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">No audit logs yet</p>
              <p className="text-slate-500 text-sm mt-1">Command executions will appear here</p>
            </div>
          ) : (
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-slate-900 border-b border-slate-800 text-xs font-medium text-slate-400 uppercase tracking-wider">
                <div className="col-span-1">Status</div>
                <div className="col-span-3">Command</div>
                <div className="col-span-2">Device</div>
                <div className="col-span-3">Result</div>
                <div className="col-span-3">Timestamp</div>
              </div>

              {/* Table Body */}
              <div className="divide-y divide-slate-800">
                {logs.map((log) => (
                  <div key={log.id} className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-slate-800/30 transition-colors" data-testid={`audit-log-${log.id}`}>
                    <div className="col-span-1 flex items-center">
                      {log.success ? (
                        <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 bg-rose-500/10 rounded-lg flex items-center justify-center">
                          <XCircle className="w-4 h-4 text-rose-400" />
                        </div>
                      )}
                    </div>
                    <div className="col-span-3">
                      <code className="text-sm font-mono text-indigo-400 break-all">{log.command}</code>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm text-slate-300 truncate">{log.device_id.slice(0, 20)}...</p>
                    </div>
                    <div className="col-span-3">
                      <p className="text-sm text-slate-400 truncate">{log.result || "-"}</p>
                    </div>
                    <div className="col-span-3 flex items-center gap-2 text-slate-500">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm font-mono">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
