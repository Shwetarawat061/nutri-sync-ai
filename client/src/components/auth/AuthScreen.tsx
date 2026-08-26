import React, { useState } from "react";
import { ArrowRight, LockKeyhole, Mail, User, AlertCircle, Eye, EyeOff } from "lucide-react";
import { NutriSyncLogo } from "../brand/NutriSyncLogo";
import { UserProfile } from "../../types";
import { api } from "../../api";

interface AuthScreenProps {
  onAuthenticated: (user: UserProfile, token: string, isNewAccount?: boolean) => void;
  onBack?: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthenticated, onBack }) => {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const result = mode === "login"
        ? await api.login({ email, password })
        : await api.register({ name, email, password });
      localStorage.setItem("nutrisync_auth_token", result.token);
      localStorage.setItem("user_email", result.user.email);
      const isNew = Boolean(
        result.isNewUser ||
        mode === "register" ||
        result.user.is_new_user ||
        !result.user.gender ||
        result.user.gender === "unspecified"
      );
      onAuthenticated(result.user, result.token, isNew);
    } catch (err: any) {
      setError(err.message || "Authentication failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
        <div className="flex items-center gap-3 mb-7">
          <NutriSyncLogo variant="icon" size="md" />
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white">Welcome to NutriSync</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">Your private metabolic workspace</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 mb-6">
          {(["login", "register"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => { setMode(tab); setError(null); }}
              className={`py-2 rounded-lg text-xs font-bold capitalize cursor-pointer transition ${mode === tab ? "bg-white dark:bg-slate-700 text-emerald-600 shadow-sm" : "text-slate-500"}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-300 text-xs font-semibold flex gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={submit} className="space-y-4">
          {mode === "register" && (
            <label className="block">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Full name</span>
              <span className="relative block mt-1">
                <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input required value={name} onChange={(e) => setName(e.target.value)} className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm" />
              </span>
            </label>
          )}
          <label className="block">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Email</span>
            <span className="relative block mt-1">
              <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm" />
            </span>
          </label>
          <label className="block">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Password</span>
            <span className="relative block mt-1">
              <LockKeyhole className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input type={showPassword ? "text" : "password"} required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm" />
              <button
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                className="absolute right-2 top-1.5 p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                aria-label={showPassword ? "Hide password" : "Show password"}
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </span>
            {mode === "register" && <span className="text-[10px] text-slate-400 mt-1 block">Use at least 8 characters.</span>}
          </label>
          <button disabled={busy} className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-bold flex items-center justify-center gap-2 cursor-pointer">
            {busy ? "Please wait..." : mode === "login" ? "Log in securely" : "Create account"}
            {!busy && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        {onBack && <button type="button" onClick={onBack} className="w-full mt-4 text-xs font-semibold text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer">Back to overview</button>}
      </div>
    </div>
  );
};
