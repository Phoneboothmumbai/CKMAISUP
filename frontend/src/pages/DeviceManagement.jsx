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
  Monitor,
  Cpu,
  HelpCircle,
  Copy,
  ExternalLink
} from "lucide-react";

export default function DeviceManagement() {
  const { logout } = useContext(AuthContext);
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingDevice, setEditingDevice] = useState(null);
  const [formData, setFormData] = useState({
    node_id: "",
    name: "",
    description: "",
    owner_email: "",
    os: "Windows"
  });

  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    try {
      const response = await apiClient.get("/devices");
      setDevices(response.data);
    } catch (error) {
      toast.error("Failed to load devices");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      node_id: "",
      name: "",
      description: "",
      owner_email: "",
      os: "Windows"
    });
    setEditingDevice(null);
  };

  const openEditForm = (device) => {
    setFormData({
      node_id: device.id,
      name: device.name,
      description: device.description || "",
      owner_email: device.owner_email || "",
      os: device.os || "Windows"
    });
    setEditingDevice(device);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.node_id.trim() || !formData.name.trim()) {
      toast.error("Node ID and Name are required");
      return;
    }

    try {
      if (editingDevice) {
        await apiClient.put(`/devices/${editingDevice.db_id}`, formData);
        toast.success("Device updated successfully");
      } else {
        await apiClient.post("/devices", formData);
        toast.success("Device registered successfully");
      }
      setShowForm(false);
      resetForm();
      fetchDevices();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to save device");
    }
  };

  const deleteDevice = async (dbId) => {
    if (!window.confirm("Are you sure you want to remove this device?")) return;
    
    try {
      await apiClient.delete(`/devices/${dbId}`);
      toast.success("Device removed");
      fetchDevices();
    } catch (error) {
      toast.error("Failed to remove device");
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
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
            <Link to="/admin/devices" className="flex items-center gap-3 px-4 py-3 rounded-lg bg-indigo-500/10 text-indigo-400 font-medium">
              <Monitor className="w-5 h-5" />
              Devices
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
            <Link to="/admin/tickets" className="px-3 py-1.5 text-slate-400 hover:text-white rounded-full text-sm whitespace-nowrap">Tickets</Link>
            <Link to="/admin/devices" className="px-3 py-1.5 bg-indigo-500/10 text-indigo-400 rounded-full text-sm whitespace-nowrap">Devices</Link>
            <Link to="/admin/knowledge-base" className="px-3 py-1.5 text-slate-400 hover:text-white rounded-full text-sm whitespace-nowrap">Knowledge Base</Link>
            <Link to="/admin/audit-logs" className="px-3 py-1.5 text-slate-400 hover:text-white rounded-full text-sm whitespace-nowrap">Audit Logs</Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="lg:ml-64 p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-white font-['Outfit']">Device Management</h1>
              <p className="text-slate-400 text-sm mt-1">Register devices from MeshCentral for AI support</p>
            </div>
            <Dialog open={showForm} onOpenChange={(open) => { setShowForm(open); if (!open) resetForm(); }}>
              <DialogTrigger asChild>
                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white btn-primary-glow" data-testid="add-device-btn">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Device
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-lg">
                <DialogHeader>
                  <DialogTitle className="text-xl font-semibold font-['Outfit']">
                    {editingDevice ? "Edit Device" : "Register New Device"}
                  </DialogTitle>
                </DialogHeader>

                {/* Help Section */}
                <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-4 mb-4">
                  <div className="flex items-start gap-3">
                    <HelpCircle className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="text-indigo-300 font-medium mb-2">How to find the Node ID:</p>
                      <ol className="text-slate-400 space-y-1 list-decimal list-inside">
                        <li>Login to your MeshCentral server</li>
                        <li>Click on the device you want to add</li>
                        <li>Look at the URL - the Node ID is after <code className="text-indigo-400">node/</code></li>
                        <li>Or click "Device Info" and copy the Node ID</li>
                      </ol>
                      <a 
                        href="https://remote.thegoodmen.in/" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 mt-2"
                      >
                        Open MeshCentral <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <Label className="text-slate-300">Node ID (from MeshCentral) *</Label>
                    <Input
                      value={formData.node_id}
                      onChange={(e) => setFormData({ ...formData, node_id: e.target.value })}
                      placeholder="e.g., node//xxxxxxxxxxxxxxxx"
                      required
                      disabled={!!editingDevice}
                      className="bg-slate-950 border-slate-800 text-white font-mono text-sm h-11"
                      data-testid="device-nodeid-input"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-300">Device Name *</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., John's Laptop, Office PC 1"
                      required
                      className="bg-slate-950 border-slate-800 text-white h-11"
                      data-testid="device-name-input"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-300">Description</Label>
                    <Input
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="e.g., Marketing department, Dell XPS 15"
                      className="bg-slate-950 border-slate-800 text-white h-11"
                      data-testid="device-desc-input"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-300">Owner Email (optional)</Label>
                    <Input
                      value={formData.owner_email}
                      onChange={(e) => setFormData({ ...formData, owner_email: e.target.value })}
                      placeholder="e.g., john@company.com"
                      type="email"
                      className="bg-slate-950 border-slate-800 text-white h-11"
                      data-testid="device-email-input"
                    />
                    <p className="text-xs text-slate-500">If set, only this user can select this device</p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-300">Operating System</Label>
                    <Select value={formData.os} onValueChange={(v) => setFormData({ ...formData, os: v })}>
                      <SelectTrigger className="bg-slate-950 border-slate-800 text-white h-11" data-testid="device-os-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-800">
                        <SelectItem value="Windows" className="text-white hover:bg-slate-800">Windows</SelectItem>
                        <SelectItem value="macOS" className="text-white hover:bg-slate-800">macOS</SelectItem>
                        <SelectItem value="Linux" className="text-white hover:bg-slate-800">Linux</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white h-12 btn-primary-glow" data-testid="save-device-btn">
                    {editingDevice ? "Update Device" : "Register Device"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Devices List */}
          {devices.length === 0 ? (
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-12 text-center">
              <Monitor className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">No devices registered yet</p>
              <p className="text-slate-500 text-sm mt-1">Add devices from MeshCentral so customers can select them when creating tickets</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {devices.map((device) => (
                <div key={device.db_id || device.id} className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-colors" data-testid={`device-${device.db_id}`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-500/10 rounded-lg flex items-center justify-center">
                        <Cpu className="w-5 h-5 text-indigo-400" />
                      </div>
                      <div>
                        <h3 className="text-white font-medium">{device.name}</h3>
                        <p className="text-xs text-slate-500">{device.os}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEditForm(device)} className="text-slate-400 hover:text-white" data-testid={`edit-device-${device.db_id}`}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => deleteDevice(device.db_id)} className="text-slate-400 hover:text-rose-400" data-testid={`delete-device-${device.db_id}`}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {device.description && (
                    <p className="text-sm text-slate-400 mb-3">{device.description}</p>
                  )}

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">Node ID:</span>
                      <button 
                        onClick={() => copyToClipboard(device.id)}
                        className="text-xs font-mono text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                      >
                        {device.id.slice(0, 20)}...
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                    {device.owner_email && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500">Owner:</span>
                        <span className="text-xs text-slate-400">{device.owner_email}</span>
                      </div>
                    )}
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
