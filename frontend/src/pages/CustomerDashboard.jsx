import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
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
  MessageSquare, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  LogOut,
  Monitor,
  Wifi,
  WifiOff,
  ChevronRight
} from "lucide-react";

export default function CustomerDashboard() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [newTicketMessage, setNewTicketMessage] = useState("");
  const [selectedDevice, setSelectedDevice] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [ticketsRes, devicesRes] = await Promise.all([
        apiClient.get("/tickets"),
        apiClient.get("/devices")
      ]);
      setTickets(ticketsRes.data);
      setDevices(devicesRes.data);
    } catch (error) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const createTicket = async () => {
    if (!newTicketMessage.trim()) {
      toast.error("Please describe your problem");
      return;
    }

    setCreating(true);
    try {
      const response = await apiClient.post("/tickets", {
        device_id: selectedDevice || null,
        initial_message: newTicketMessage
      });
      toast.success("Support ticket created!");
      setShowNewTicket(false);
      setNewTicketMessage("");
      setSelectedDevice("");
      navigate(`/chat/${response.data.id}`);
    } catch (error) {
      toast.error("Failed to create ticket");
    } finally {
      setCreating(false);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617]">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-indigo-500 rounded-lg flex items-center justify-center">
                <Terminal className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-semibold text-white font-['Outfit']">MeshSupport AI</span>
            </div>
            
            <div className="flex items-center gap-4">
              <span className="text-slate-400 text-sm hidden sm:block">{user?.name}</span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={logout}
                data-testid="logout-btn"
                className="text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white font-['Outfit'] mb-2">
            Hi, {user?.name?.split(' ')[0]}!
          </h1>
          <p className="text-slate-400">How can we help you today?</p>
        </div>

        {/* New Ticket Button */}
        <Dialog open={showNewTicket} onOpenChange={setShowNewTicket}>
          <DialogTrigger asChild>
            <Button 
              className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white h-14 px-8 text-lg font-medium btn-primary-glow mb-8"
              data-testid="new-ticket-btn"
            >
              <Plus className="w-5 h-5 mr-2" />
              I need help with something
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold font-['Outfit']">What's the problem?</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6 mt-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Select your computer (optional)</Label>
                <Select value={selectedDevice} onValueChange={setSelectedDevice}>
                  <SelectTrigger className="bg-slate-950 border-slate-800 text-white h-12" data-testid="device-select">
                    <SelectValue placeholder="Choose a device..." />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800">
                    {devices.map((device) => (
                      <SelectItem 
                        key={device.id} 
                        value={device.id}
                        className="text-white hover:bg-slate-800"
                      >
                        <div className="flex items-center gap-2">
                          <Monitor className="w-4 h-4" />
                          <span>{device.name}</span>
                          {device.online ? (
                            <Wifi className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <WifiOff className="w-3 h-3 text-slate-500" />
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Describe what's wrong</Label>
                <textarea
                  value={newTicketMessage}
                  onChange={(e) => setNewTicketMessage(e.target.value)}
                  placeholder="Example: My internet is not working, or Outlook won't open..."
                  className="w-full h-32 bg-slate-950 border border-slate-800 rounded-lg p-4 text-white placeholder:text-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 resize-none"
                  data-testid="problem-description-input"
                />
              </div>

              <Button
                onClick={createTicket}
                disabled={creating || !newTicketMessage.trim()}
                className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-medium btn-primary-glow"
                data-testid="submit-ticket-btn"
              >
                {creating ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  "Get Help"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Tickets List */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white font-['Outfit']">Your Support History</h2>
          
          {tickets.length === 0 ? (
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-12 text-center">
              <MessageSquare className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">No support tickets yet</p>
              <p className="text-slate-500 text-sm mt-1">Click the button above when you need help</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tickets.map((ticket) => (
                <button
                  key={ticket.id}
                  onClick={() => navigate(`/chat/${ticket.id}`)}
                  className="w-full bg-slate-900/50 border border-slate-800 rounded-xl p-5 text-left hover:border-indigo-500/50 transition-all group"
                  data-testid={`ticket-${ticket.id}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {getStatusIcon(ticket.status)}
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(ticket.status)}`}>
                          {ticket.status.replace('_', ' ')}
                        </span>
                      </div>
                      {ticket.device_name && (
                        <p className="text-sm text-slate-400 flex items-center gap-2">
                          <Monitor className="w-4 h-4" />
                          {ticket.device_name}
                        </p>
                      )}
                      <p className="text-xs text-slate-500 mt-2 font-mono">
                        {new Date(ticket.created_at).toLocaleDateString()} at {new Date(ticket.created_at).toLocaleTimeString()}
                      </p>
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
