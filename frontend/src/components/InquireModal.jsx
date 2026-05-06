import { useState, useEffect } from "react";
import { X, MessageCircle, Mail, Send, Check } from "lucide-react";
import { api, formatApiError } from "../lib/api";

export default function InquireModal({ product, open, onClose }) {
  const [view, setView] = useState("form"); // form | success
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open && product) {
      setView("form");
      setForm((f) => ({
        ...f,
        message: f.message || `Hi Olevia, I'd love to learn more about "${product.name}". Is it in stock, and do you ship to my area?`,
      }));
      setErr("");
    }
    if (!open) {
      setTimeout(() => {
        setView("form");
        setForm({ name: "", email: "", message: "" });
      }, 200);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, product?.id]);

  if (!open || !product) return null;

  const whatsappMsg = `Hi Olevia! I'd love to learn more about "${product.name}". Is it currently in stock?`;
  const waLink = `https://wa.me/?text=${encodeURIComponent(whatsappMsg)}`;

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      await api.post("/inquiries", {
        name: form.name.trim(),
        email: form.email.trim(),
        message: form.message.trim(),
        product_id: product.id,
        product_name: product.name,
      });
      setView("success");
    } catch (ex) {
      setErr(formatApiError(ex, "Could not send inquiry. Please try again."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end md:items-center justify-center bg-olevia-forest/60 backdrop-blur-sm p-0 md:p-6 overflow-y-auto"
      data-testid="inquire-modal"
      onClick={onClose}
    >
      <div
        className="relative w-full md:max-w-lg bg-olevia-cream rounded-t-3xl md:rounded-3xl p-8 md:p-10 shadow-2xl my-0 md:my-6"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-olevia-ink hover:text-olevia-amber-dark transition-colors"
          data-testid="inquire-modal-close"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        {view === "form" ? (
          <>
            <div className="olevia-overline mb-3">Inquire</div>
            <h3 className="font-serif text-3xl md:text-4xl text-olevia-forest leading-tight mb-3">
              {product.name}
            </h3>
            <p className="text-olevia-muted leading-relaxed mb-7 text-[15px]">
              Tell us a little about you — we typically respond within 24 hours.
            </p>

            <form onSubmit={submit} className="space-y-5" data-testid="inquire-form">
              <label className="block">
                <span className="olevia-overline mb-2 block">Your name</span>
                <input
                  required
                  minLength={2}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  data-testid="inquire-name-input"
                  className="w-full bg-transparent border-b border-olevia-ink/25 rounded-none px-0 py-2.5 focus:outline-none focus:border-olevia-sage text-olevia-ink"
                  placeholder="Ayla K."
                  autoComplete="name"
                />
              </label>
              <label className="block">
                <span className="olevia-overline mb-2 block">Your email</span>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  data-testid="inquire-email-input"
                  className="w-full bg-transparent border-b border-olevia-ink/25 rounded-none px-0 py-2.5 focus:outline-none focus:border-olevia-sage text-olevia-ink"
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </label>
              <label className="block">
                <span className="olevia-overline mb-2 block">Message</span>
                <textarea
                  required
                  rows={4}
                  minLength={5}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  data-testid="inquire-message-input"
                  className="w-full bg-transparent border-b border-olevia-ink/25 rounded-none px-0 py-2.5 focus:outline-none focus:border-olevia-sage text-olevia-ink resize-none"
                />
              </label>

              {err && (
                <div
                  className="text-sm text-red-700 bg-red-100/60 border border-red-200 rounded-lg px-4 py-3"
                  data-testid="inquire-error"
                >
                  {err}
                </div>
              )}

              <button
                type="submit"
                disabled={busy}
                className="btn-primary w-full disabled:opacity-60"
                data-testid="inquire-submit"
              >
                {busy ? (
                  "Sending…"
                ) : (
                  <>
                    <Send size={15} /> Send inquiry
                  </>
                )}
              </button>

              <div className="relative pt-4 pb-1">
                <div className="absolute inset-x-0 top-1/2 border-t border-olevia-border/70" />
                <div className="relative mx-auto bg-olevia-cream w-max px-3 text-[10px] tracking-[0.25em] uppercase text-olevia-muted">
                  or reach us directly
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-3">
                <a
                  href={waLink}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-secondary flex-1 justify-center"
                  data-testid="inquire-whatsapp"
                >
                  <MessageCircle size={15} /> WhatsApp
                </a>
                <a
                  href={`mailto:kartk.vani@gmail.com?subject=${encodeURIComponent("Inquiry: " + product.name)}`}
                  className="btn-secondary flex-1 justify-center"
                  data-testid="inquire-email-link"
                >
                  <Mail size={15} /> Email
                </a>
              </div>
            </form>
          </>
        ) : (
          <div className="py-6 text-center" data-testid="inquire-success">
            <div className="mx-auto h-14 w-14 rounded-full bg-olevia-sage/20 text-olevia-sage-dark flex items-center justify-center mb-6">
              <Check size={28} strokeWidth={1.6} />
            </div>
            <div className="olevia-overline mb-3">Received</div>
            <h3 className="font-serif text-3xl md:text-4xl text-olevia-forest leading-tight mb-3">
              Thank you, {form.name.split(" ")[0] || "friend"}.
            </h3>
            <p className="text-olevia-muted leading-relaxed mb-8">
              Your inquiry about <em>{product.name}</em> is on its way. We&apos;ll reply within 24
              hours at <span className="text-olevia-forest">{form.email}</span>.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="btn-primary"
              data-testid="inquire-success-close"
            >
              Continue browsing
            </button>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-olevia-border text-xs text-olevia-muted tracking-wide">
          Typically responds within 24 hours · Small-batch, hand-poured
        </div>
      </div>
    </div>
  );
}
