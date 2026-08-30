import { useState } from "react";
import { Link } from "react-router-dom";
import { api, formatApiError } from "@/lib/api";
import { LOGO_URL } from "@/components/Logo";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2, Mail, CheckCircle2 } from "lucide-react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [resetLink, setResetLink] = useState(null);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const { data } = await api.post("/auth/forgot-password", { email });
      setDone(true);
      setResetLink(data.simulated_reset_link);
    } catch (err) {
      setError(formatApiError(err.response?.data?.detail));
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f6f8fb] p-6">
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-sm p-8 animate-fade-up">
        <div className="flex items-center gap-2 mb-6">
          <div className="h-10 w-10 rounded-lg bg-[#0a2540] flex items-center justify-center"><img src={LOGO_URL} className="h-7 w-7" alt="logo" /></div>
          <span className="font-display font-extrabold text-xl text-[#0a2540]">MyMentor</span>
        </div>

        {!done ? (
          <>
            <h2 className="font-display font-bold text-2xl text-[#0a2540]">Forgot Password?</h2>
            <p className="text-slate-500 mt-1 text-sm">Enter your email and we'll send you a reset link.</p>
            <form onSubmit={submit} className="mt-6 space-y-4">
              {error && <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{error}</div>}
              <div className="space-y-1.5">
                <Label htmlFor="fp-email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input id="fp-email" data-testid="forgot-email-input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" className="pl-9 h-11 focus-visible:ring-[#1e5bff]" />
                </div>
              </div>
              <button data-testid="send-reset-link-button" type="submit" disabled={loading} className="w-full h-11 rounded-lg bg-[#1e5bff] text-white font-semibold hover:bg-[#154cdb] transition-colors duration-200 flex items-center justify-center disabled:opacity-60">
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Send Reset Link"}
              </button>
            </form>
          </>
        ) : (
          <div data-testid="forgot-success">
            <div className="flex items-center gap-2 text-emerald-600 mb-2"><CheckCircle2 className="h-6 w-6" /><h2 className="font-display font-bold text-xl text-[#0a2540]">Check your email</h2></div>
            <p className="text-slate-500 text-sm">If an account exists for that email, a reset link has been sent.</p>
            {resetLink && (
              <div className="mt-4 rounded-lg bg-slate-50 border border-slate-200 p-3 text-xs">
                <p className="font-semibold text-slate-600 mb-1">Email simulated — use this link:</p>
                <Link data-testid="simulated-reset-link" to={resetLink} className="text-[#1e5bff] hover:underline break-all">{resetLink}</Link>
              </div>
            )}
          </div>
        )}

        <Link to="/login" className="mt-6 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-[#1e5bff] transition-colors duration-200">
          <ArrowLeft className="h-4 w-4" /> Return to Login
        </Link>
      </div>
    </div>
  );
}
