import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { formatApiError } from "@/lib/api";
import { LOGO_URL } from "@/components/Logo";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Lock, Mail, ShieldCheck } from "lucide-react";

export default function Login() {
  const { login, user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/dashboard" replace />;
const submit = async (e) => {
  e.preventDefault();

  setError("");
  setLoading(true);

  try {
    const result = await login(email, password, remember);

    console.log("LOGIN SUCCESS:", result);
    console.log("USER AFTER LOGIN:", result.user);
    console.log("NAVIGATION WILL HAPPEN THROUGH <Navigate>");
  } catch (err) {
    console.error("LOGIN ERROR:", err);

    setError(
      formatApiError(err.response?.data?.detail) ||
        err.message ||
        "Login failed."
    );
  } finally {
    setLoading(false);
  }
};
  return (
    <div className="min-h-screen flex">
      {/* Left brand panel */}
      <div className="hidden lg:flex w-1/2 bg-[#0a2540] relative overflow-hidden flex-col justify-between p-12">
        <div className="absolute inset-0 opacity-20" style={{ background: "radial-gradient(600px circle at 20% 20%, #1e5bff, transparent), radial-gradient(500px circle at 80% 80%, #17b6c7, transparent)" }} />
        <div className="relative flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-white flex items-center justify-center">
            <img src={LOGO_URL} alt="MyMentor" className="h-8 w-8 object-contain" />
          </div>
          <span className="font-display font-extrabold text-2xl text-white">MyMentor</span>
        </div>
        <div className="relative">
          <h1 className="font-display font-extrabold text-4xl text-white leading-tight">Recruitment Intelligence Workspace</h1>
          <p className="text-slate-300 mt-4 text-base max-w-md">Create jobs, discover and match candidates, run interviews, and measure hiring performance — all in one enterprise portal.</p>
          <div className="mt-8 flex items-center gap-2 text-slate-400 text-sm">
            <ShieldCheck className="h-4 w-4 text-[#22c55e]" /> Secure, organization-isolated data & role-based access
          </div>
        </div>
        <div className="relative text-slate-400 text-xs">© {new Date().getFullYear()} MyMentor. All rights reserved.</div>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-white">
        <div className="w-full max-w-sm animate-fade-up">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="h-10 w-10 rounded-lg bg-[#0a2540] flex items-center justify-center"><img src={LOGO_URL} className="h-7 w-7" alt="logo" /></div>
            <span className="font-display font-extrabold text-xl text-[#0a2540]">MyMentor</span>
          </div>
          <h2 className="font-display font-extrabold text-3xl text-[#0a2540]">Welcome Back</h2>
          <p className="text-slate-500 mt-1">Sign in to your Organization Portal</p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            {error && <div data-testid="login-error" role="alert" className="error rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{error}</div>}
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input id="email" data-testid="login-email-input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" className="pl-9 h-11 focus-visible:ring-[#1e5bff]" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input id="password" data-testid="login-password-input" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="pl-9 h-11 focus-visible:ring-[#1e5bff]" />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                <Checkbox data-testid="remember-me-checkbox" checked={remember} onCheckedChange={setRemember} /> Remember me
              </label>
              <Link to="/forgot-password" data-testid="forgot-password-link" className="text-sm font-medium text-[#1e5bff] hover:underline">Forgot Password?</Link>
            </div>
            <button data-testid="login-submit-button" type="submit" disabled={loading} className="w-full h-11 rounded-lg bg-[#1e5bff] text-white font-semibold hover:bg-[#154cdb] transition-colors duration-200 flex items-center justify-center disabled:opacity-60">
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Login"}
            </button>
          </form>

          <div className="mt-6 rounded-lg bg-slate-50 border border-slate-200 p-3 text-xs text-slate-500">
            <p className="font-semibold text-slate-600 mb-1">Demo admin</p>
            rajeshkumar@suveragroups.com / Admin@12345
          </div>
        </div>
      </div>
    </div>
  );
}
