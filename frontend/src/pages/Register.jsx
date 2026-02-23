import React, { useState, useContext } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../App";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Terminal } from "lucide-react";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("customer");
  const [loading, setLoading] = useState(false);
  const { register } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await register(name, email, password, role);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center">
            <Terminal className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-white font-['Outfit']">MeshSupport AI</span>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 backdrop-blur-sm animate-fade-in">
          <h2 className="text-2xl font-semibold text-white mb-2 font-['Outfit']">Create Account</h2>
          <p className="text-slate-400 mb-8">Get started with AI-powered IT support</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-slate-300">Full Name</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                required
                data-testid="register-name-input"
                className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-500 h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-300">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                data-testid="register-email-input"
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
                placeholder="Create a strong password"
                required
                minLength={6}
                data-testid="register-password-input"
                className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-500 h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role" className="text-slate-300">Account Type</Label>
              <Select value={role} onValueChange={setRole} data-testid="register-role-select">
                <SelectTrigger className="bg-slate-950 border-slate-800 text-white h-12">
                  <SelectValue placeholder="Select account type" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800">
                  <SelectItem value="customer" className="text-white hover:bg-slate-800">Customer</SelectItem>
                  <SelectItem value="admin" className="text-white hover:bg-slate-800">Administrator</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              type="submit"
              disabled={loading}
              data-testid="register-submit-btn"
              className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-medium btn-primary-glow mt-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                "Create Account"
              )}
            </Button>
          </form>

          <p className="text-center text-slate-400 mt-6">
            Already have an account?{" "}
            <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium" data-testid="login-link">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
