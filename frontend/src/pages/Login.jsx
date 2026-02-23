import React, { useState, useContext } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../App";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Terminal, Shield, Zap } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await login(email, password);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#020617] flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 to-transparent" />
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1764258560300-2346b28b4e7c?w=1200')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="relative z-10 flex flex-col justify-center p-12">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-indigo-500 rounded-xl flex items-center justify-center">
              <Terminal className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-white font-['Outfit']">MeshSupport AI</span>
          </div>
          
          <h1 className="text-4xl font-bold text-white mb-4 font-['Outfit']">
            AI-Powered IT Support
          </h1>
          <p className="text-lg text-slate-300 mb-8">
            Automated troubleshooting powered by MeshCentral. 
            Just describe your problem and let AI fix it.
          </p>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-slate-300">
              <div className="w-10 h-10 bg-indigo-500/20 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-indigo-400" />
              </div>
              <span>Instant automated fixes</span>
            </div>
            <div className="flex items-center gap-3 text-slate-300">
              <div className="w-10 h-10 bg-indigo-500/20 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-indigo-400" />
              </div>
              <span>Safe, pre-approved commands only</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center">
              <Terminal className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white font-['Outfit']">MeshSupport AI</span>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 backdrop-blur-sm animate-fade-in">
            <h2 className="text-2xl font-semibold text-white mb-2 font-['Outfit']">Welcome back</h2>
            <p className="text-slate-400 mb-8">Sign in to access your support portal</p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-300">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  data-testid="login-email-input"
                  className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-500 h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-300">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  data-testid="login-password-input"
                  className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-500 h-12"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                data-testid="login-submit-btn"
                className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-medium btn-primary-glow"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>

            <p className="text-center text-slate-400 mt-6">
              Don't have an account?{" "}
              <Link to="/register" className="text-indigo-400 hover:text-indigo-300 font-medium" data-testid="register-link">
                Create one
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
