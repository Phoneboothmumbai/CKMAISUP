import React, { useState, useEffect, useRef, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AuthContext, apiClient } from "../App";
import { Button } from "../components/ui/button";
import { toast } from "sonner";
import { 
  Terminal, 
  ArrowLeft, 
  Send, 
  Bot, 
  User, 
  Cpu,
  CheckCircle2,
  AlertTriangle,
  Loader2
} from "lucide-react";

export default function ChatPage() {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [ticket, setTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    fetchData();
  }, [ticketId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchData = async () => {
    try {
      const [ticketRes, messagesRes] = await Promise.all([
        apiClient.get(`/tickets/${ticketId}`),
        apiClient.get(`/tickets/${ticketId}/messages`)
      ]);
      setTicket(ticketRes.data);
      setMessages(messagesRes.data);
    } catch (error) {
      toast.error("Failed to load chat");
      navigate(user?.role === "admin" ? "/admin" : "/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const sendMessage = async (e) => {
    e?.preventDefault();
    if (!newMessage.trim() || sending) return;

    const messageText = newMessage;
    setNewMessage("");
    setSending(true);

    // Optimistic update
    const tempMessage = {
      id: `temp-${Date.now()}`,
      role: "user",
      content: messageText,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempMessage]);

    try {
      const response = await apiClient.post(`/tickets/${ticketId}/messages`, {
        message: messageText
      });
      // Replace temp message and add AI response
      setMessages(prev => {
        const filtered = prev.filter(m => m.id !== tempMessage.id);
        return [...filtered, ...response.data];
      });
      // Refresh ticket status
      const ticketRes = await apiClient.get(`/tickets/${ticketId}`);
      setTicket(ticketRes.data);
    } catch (error) {
      toast.error("Failed to send message");
      setMessages(prev => prev.filter(m => m.id !== tempMessage.id));
      setNewMessage(messageText);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleQuickResponse = (response) => {
    setNewMessage(response);
    setTimeout(() => sendMessage(), 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isResolved = ticket?.status === "resolved";
  const isEscalated = ticket?.status === "escalated";
  const lastAiMessage = [...messages].reverse().find(m => m.role === "ai");
  const showQuickReplies = lastAiMessage && !isResolved && !isEscalated;

  return (
    <div className="min-h-screen bg-[#020617] flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-4">
          <div className="flex items-center h-16 gap-4">
            <button
              onClick={() => navigate(user?.role === "admin" ? "/admin/tickets" : "/dashboard")}
              className="text-slate-400 hover:text-white transition-colors"
              data-testid="back-btn"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-3 flex-1">
              <div className="w-9 h-9 bg-indigo-500 rounded-lg flex items-center justify-center">
                <Terminal className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-white font-medium font-['Outfit']">Support Chat</h1>
                <p className="text-xs text-slate-500">{ticket?.device_name || "No device selected"}</p>
              </div>
            </div>

            {/* Status Badge */}
            <div className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 ${
              isResolved ? "bg-emerald-500/10 text-emerald-400" :
              isEscalated ? "bg-amber-500/10 text-amber-400" :
              "bg-indigo-500/10 text-indigo-400"
            }`}>
              {isResolved ? <CheckCircle2 className="w-3 h-3" /> : 
               isEscalated ? <AlertTriangle className="w-3 h-3" /> :
               <Loader2 className="w-3 h-3 animate-spin" />}
              {ticket?.status?.replace('_', ' ')}
            </div>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
          {messages.map((message, index) => (
            <div
              key={message.id}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} animate-slide-up`}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {message.role === "system" ? (
                <div className="w-full text-center py-3">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800/50 rounded-full">
                    <Cpu className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs font-mono text-slate-400">{message.content}</span>
                  </div>
                  {message.command_result && (
                    <div className="terminal-output mt-2 text-left max-w-xl mx-auto">
                      {message.command_result}
                    </div>
                  )}
                </div>
              ) : (
                <div className={`flex items-start gap-3 max-w-[85%] ${message.role === "user" ? "flex-row-reverse" : ""}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.role === "user" ? "bg-slate-700" : "bg-indigo-500/20"
                  }`}>
                    {message.role === "user" ? (
                      <User className="w-4 h-4 text-slate-300" />
                    ) : (
                      <Bot className="w-4 h-4 text-indigo-400" />
                    )}
                  </div>
                  <div className={message.role === "user" ? "chat-user" : "chat-ai"}>
                    <p className="text-slate-100 whitespace-pre-wrap">{message.content}</p>
                    <p className="text-[10px] text-slate-500 mt-2 font-mono">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}
          
          {sending && (
            <div className="flex justify-start animate-slide-up">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-indigo-500/20">
                  <Bot className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="chat-ai">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Quick Replies */}
      {showQuickReplies && (
        <div className="border-t border-slate-800 bg-slate-900/50 backdrop-blur-xl px-4 py-3">
          <div className="max-w-3xl mx-auto flex gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickResponse("Yes")}
              className="bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
              data-testid="quick-yes-btn"
            >
              <CheckCircle2 className="w-4 h-4 mr-1.5" />
              Yes, it's working
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickResponse("No")}
              className="bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20"
              data-testid="quick-no-btn"
            >
              No, still not working
            </Button>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-slate-800 bg-slate-900/50 backdrop-blur-xl">
        <form onSubmit={sendMessage} className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex gap-3">
            <input
              ref={inputRef}
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={isResolved ? "This ticket has been resolved" : "Type your message..."}
              disabled={isResolved || sending}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-5 py-3.5 text-white placeholder:text-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 disabled:opacity-50"
              data-testid="message-input"
            />
            <Button
              type="submit"
              disabled={!newMessage.trim() || sending || isResolved}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 btn-primary-glow"
              data-testid="send-message-btn"
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
