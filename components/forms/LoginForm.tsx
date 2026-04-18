"use client";
import { useState } from "react";
import { signIn } from "@/lib/actions/auth";
import { Loader2, Eye, EyeOff } from "lucide-react";

export default function LoginForm() {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [showPwd, setShowPwd] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true); setError("");
    const fd = new FormData(e.currentTarget);
    const result = await signIn(fd.get("email") as string, fd.get("password") as string);
    if (result?.error) { setError(result.error); setLoading(false); }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label">Email</label>
        <input name="email" type="email" required autoComplete="email"
          placeholder="nombre@armglobal.com" className="input" />
      </div>
      <div>
        <label className="label">Contraseña</label>
        <div className="relative">
          <input name="password" type={showPwd ? "text" : "password"} required
            autoComplete="current-password" placeholder="••••••••" className="input pr-10" />
          <button type="button" onClick={() => setShowPwd(v => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            {showPwd ? <EyeOff size={14}/> : <Eye size={14}/>}
          </button>
        </div>
      </div>
      {error && (
        <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-100">
          {error}
        </p>
      )}
      <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-2.5">
        {loading ? <><Loader2 size={14} className="animate-spin"/>Ingresando...</> : "Ingresar"}
      </button>
    </form>
  );
}
