import { useState } from "react";
import { useNavigate, Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login, user, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (loading) return null;
  if (user && user.role === "admin") return <Navigate to="/admin" replace />;

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setSubmitting(true);
    const res = await login(email, password);
    setSubmitting(false);
    if (res.ok) navigate("/admin");
    else setErr(res.error || "Unable to sign in.");
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-20" data-testid="login-page">
      <div className="olevia-container max-w-md">
        <Link to="/" className="olevia-overline mb-6 inline-block" data-testid="login-back-home">
          ← Olevia
        </Link>
        <h1 className="font-serif text-5xl text-olevia-forest leading-tight mb-3">
          Admin Sign-In
        </h1>
        <p className="text-olevia-muted leading-relaxed mb-10">
          Sign in to manage the Olevia journal. Customer accounts aren&apos;t needed to shop — simply inquire from any product.
        </p>

        <form onSubmit={onSubmit} className="space-y-6" data-testid="login-form">
          <label className="block">
            <span className="olevia-overline mb-2 block">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              data-testid="login-email-input"
              className="w-full bg-transparent border-b border-olevia-ink/30 rounded-none px-0 py-3 focus:outline-none focus:border-olevia-sage text-olevia-ink"
              placeholder="admin@olevia.com"
              autoComplete="email"
            />
          </label>
          <label className="block">
            <span className="olevia-overline mb-2 block">Password</span>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              data-testid="login-password-input"
              className="w-full bg-transparent border-b border-olevia-ink/30 rounded-none px-0 py-3 focus:outline-none focus:border-olevia-sage text-olevia-ink"
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </label>

          {err && (
            <div
              className="text-sm text-red-700 bg-red-100/60 border border-red-200 rounded-lg px-4 py-3"
              data-testid="login-error"
            >
              {err}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="btn-primary w-full disabled:opacity-60"
            data-testid="login-submit-btn"
          >
            {submitting ? "Signing in…" : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
