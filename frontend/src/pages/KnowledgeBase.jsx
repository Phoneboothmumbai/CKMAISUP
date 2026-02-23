import React, { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import { AuthContext, apiClient } from "../App";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { toast } from "sonner";
import { 
  Terminal, 
  Plus, 
  Pencil, 
  Trash2,
  Database,
  BarChart3,
  TicketIcon,
  FileText,
  LogOut,
  X,
  AlertTriangle
} from "lucide-react";

const CATEGORIES = [
  "Network",
  "Email/Outlook",
  "Performance",
  "Printing",
  "Disk/Storage",
  "Windows",
  "Software",
  "Security",
  "Hardware",
  "Other"
];

const RISK_LEVELS = [
  { value: "low", label: "Low Risk", color: "text-emerald-400" },
  { value: "medium", label: "Medium Risk", color: "text-amber-400" },
  { value: "high", label: "High Risk", color: "text-rose-400" }
];

export default function KnowledgeBase() {
  const { user, logout } = useContext(AuthContext);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [formData, setFormData] = useState({
    category: "",
    problem_keywords: "",
    description: "",
    commands: [{ name: "", command: "", description: "" }],
    requires_reboot: false,
    risk_level: "low"
  });

  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    try {
      const response = await apiClient.get("/knowledge-base");
      setEntries(response.data);
    } catch (error) {
      toast.error("Failed to load knowledge base");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      category: "",
      problem_keywords: "",
      description: "",
      commands: [{ name: "", command: "", description: "" }],
      requires_reboot: false,
      risk_level: "low"
    });
    setEditingEntry(null);
  };

  const openEditForm = (entry) => {
    setFormData({
      category: entry.category,
      problem_keywords: entry.problem_keywords.join(", "),
      description: entry.description,
      commands: entry.commands,
      requires_reboot: entry.requires_reboot,
      risk_level: entry.risk_level
    });
    setEditingEntry(entry);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const payload = {
      category: formData.category,
      problem_keywords: formData.problem_keywords.split(",").map(k => k.trim()).filter(Boolean),
      description: formData.description,
      commands: formData.commands.filter(c => c.command.trim()),
      requires_reboot: formData.requires_reboot,
      risk_level: formData.risk_level
    };

    try {
      if (editingEntry) {
        await apiClient.put(`/knowledge-base/${editingEntry.id}`, payload);
        toast.success("Entry updated successfully");
      } else {
        await apiClient.post("/knowledge-base", payload);
        toast.success("Entry created successfully");
      }
      setShowForm(false);
      resetForm();
      fetchEntries();
    } catch (error) {
      toast.error("Failed to save entry");
    }
  };

  const deleteEntry = async (id) => {
    if (!window.confirm("Are you sure you want to delete this entry?")) return;
    
    try {
      await apiClient.delete(`/knowledge-base/${id}`);
      toast.success("Entry deleted");
      fetchEntries();
    } catch (error) {
      toast.error("Failed to delete entry");
    }
  };

  const addCommand = () => {
    setFormData({
      ...formData,
      commands: [...formData.commands, { name: "", command: "", description: "" }]
    });
  };

  const removeCommand = (index) => {
    setFormData({
      ...formData,
      commands: formData.commands.filter((_, i) => i !== index)
    });
  };

  const updateCommand = (index, field, value) => {
    const newCommands = [...formData.commands];
    newCommands[index][field] = value;
    setFormData({ ...formData, commands: newCommands });
  };

  const getRiskBadge = (level) => {
    const risk = RISK_LEVELS.find(r => r.value === level);
    return (
      <span className={`text-xs font-medium ${risk?.color || "text-slate-400"}`}>
        {risk?.label || level}
      </span>
    );
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
            <Link to="/admin/knowledge-base" className="flex items-center gap-3 px-4 py-3 rounded-lg bg-indigo-500/10 text-indigo-400 font-medium">
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
            <Link to="/admin/tickets" className="px-3 py-1.5 text-slate-400 hover:text-white rounded-full text-sm whitespace-nowrap">Tickets</Link>
            <Link to="/admin/knowledge-base" className="px-3 py-1.5 bg-indigo-500/10 text-indigo-400 rounded-full text-sm whitespace-nowrap">Knowledge Base</Link>
            <Link to="/admin/audit-logs" className="px-3 py-1.5 text-slate-400 hover:text-white rounded-full text-sm whitespace-nowrap">Audit Logs</Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="lg:ml-64 p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-bold text-white font-['Outfit']">Knowledge Base</h1>
            <Dialog open={showForm} onOpenChange={(open) => { setShowForm(open); if (!open) resetForm(); }}>
              <DialogTrigger asChild>
                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white btn-primary-glow" data-testid="add-entry-btn">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Entry
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-xl font-semibold font-['Outfit']">
                    {editingEntry ? "Edit Entry" : "Add Knowledge Base Entry"}
                  </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-slate-300">Category</Label>
                      <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                        <SelectTrigger className="bg-slate-950 border-slate-800 text-white h-11" data-testid="category-select">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-slate-800">
                          {CATEGORIES.map((cat) => (
                            <SelectItem key={cat} value={cat} className="text-white hover:bg-slate-800">{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-slate-300">Risk Level</Label>
                      <Select value={formData.risk_level} onValueChange={(v) => setFormData({ ...formData, risk_level: v })}>
                        <SelectTrigger className="bg-slate-950 border-slate-800 text-white h-11" data-testid="risk-select">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-slate-800">
                          {RISK_LEVELS.map((risk) => (
                            <SelectItem key={risk.value} value={risk.value} className={`${risk.color} hover:bg-slate-800`}>
                              {risk.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-300">Problem Keywords (comma separated)</Label>
                    <Input
                      value={formData.problem_keywords}
                      onChange={(e) => setFormData({ ...formData, problem_keywords: e.target.value })}
                      placeholder="internet not working, wifi down, no connection"
                      className="bg-slate-950 border-slate-800 text-white h-11"
                      data-testid="keywords-input"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-300">Description</Label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Describe what this solution fixes..."
                      className="w-full h-20 bg-slate-950 border border-slate-800 rounded-lg p-3 text-white placeholder:text-slate-500 resize-none"
                      data-testid="description-input"
                    />
                  </div>

                  {/* Commands */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-slate-300">PowerShell Commands</Label>
                      <Button type="button" variant="ghost" size="sm" onClick={addCommand} className="text-indigo-400 hover:text-indigo-300">
                        <Plus className="w-4 h-4 mr-1" />
                        Add Command
                      </Button>
                    </div>

                    {formData.commands.map((cmd, index) => (
                      <div key={index} className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <span className="text-xs text-slate-500 font-mono">Command #{index + 1}</span>
                          {formData.commands.length > 1 && (
                            <button type="button" onClick={() => removeCommand(index)} className="text-slate-500 hover:text-rose-400">
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        <Input
                          value={cmd.name}
                          onChange={(e) => updateCommand(index, "name", e.target.value)}
                          placeholder="Command name (e.g., Flush DNS)"
                          className="bg-slate-900 border-slate-700 text-white h-10"
                          data-testid={`cmd-name-${index}`}
                        />
                        <Input
                          value={cmd.command}
                          onChange={(e) => updateCommand(index, "command", e.target.value)}
                          placeholder="Clear-DnsClientCache"
                          className="bg-slate-900 border-slate-700 text-white font-mono text-sm h-10"
                          data-testid={`cmd-command-${index}`}
                        />
                        <Input
                          value={cmd.description}
                          onChange={(e) => updateCommand(index, "description", e.target.value)}
                          placeholder="What this command does..."
                          className="bg-slate-900 border-slate-700 text-white h-10"
                          data-testid={`cmd-desc-${index}`}
                        />
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="requires_reboot"
                      checked={formData.requires_reboot}
                      onChange={(e) => setFormData({ ...formData, requires_reboot: e.target.checked })}
                      className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-indigo-500"
                      data-testid="requires-reboot-checkbox"
                    />
                    <Label htmlFor="requires_reboot" className="text-slate-300 cursor-pointer">Requires system reboot</Label>
                  </div>

                  <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white h-12 btn-primary-glow" data-testid="save-entry-btn">
                    {editingEntry ? "Update Entry" : "Create Entry"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Entries List */}
          {entries.length === 0 ? (
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-12 text-center">
              <Database className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">No knowledge base entries yet</p>
              <p className="text-slate-500 text-sm mt-1">Add approved PowerShell commands for the AI to use</p>
            </div>
          ) : (
            <div className="space-y-4">
              {entries.map((entry) => (
                <div key={entry.id} className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 hover:border-slate-700 transition-colors" data-testid={`kb-entry-${entry.id}`}>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="px-2.5 py-1 bg-indigo-500/10 text-indigo-400 rounded-lg text-xs font-medium">{entry.category}</span>
                        {getRiskBadge(entry.risk_level)}
                        {entry.requires_reboot && (
                          <span className="flex items-center gap-1 text-xs text-amber-400">
                            <AlertTriangle className="w-3 h-3" />
                            Requires Reboot
                          </span>
                        )}
                      </div>
                      <p className="text-white">{entry.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => openEditForm(entry)} className="text-slate-400 hover:text-white" data-testid={`edit-${entry.id}`}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => deleteEntry(entry.id)} className="text-slate-400 hover:text-rose-400" data-testid={`delete-${entry.id}`}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {entry.problem_keywords.map((keyword, i) => (
                      <span key={i} className="px-2 py-1 bg-slate-800 text-slate-400 rounded text-xs">{keyword}</span>
                    ))}
                  </div>

                  <div className="space-y-2">
                    {entry.commands.map((cmd, i) => (
                      <div key={i} className="bg-slate-950 border border-slate-800 rounded-lg p-3">
                        <p className="text-sm text-slate-300 mb-1">{cmd.name}</p>
                        <code className="text-xs font-mono text-indigo-400 block">{cmd.command}</code>
                        {cmd.description && <p className="text-xs text-slate-500 mt-1">{cmd.description}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
