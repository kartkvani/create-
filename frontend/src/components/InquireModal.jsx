import { useState } from "react";
import { X, MessageCircle, Mail } from "lucide-react";

export default function InquireModal({ product, open, onClose }) {
  const [copied, setCopied] = useState(false);
  if (!open || !product) return null;

  const message = `Hi Olevia! I'd love to learn more about "${product.name}" (${product.category.replace("_", " ")}). Is it currently in stock?`;
  const waLink = `https://wa.me/?text=${encodeURIComponent(message)}`;
  const mailLink = `mailto:hello@olevia.com?subject=${encodeURIComponent(
    "Inquiry: " + product.name
  )}&body=${encodeURIComponent(message)}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end md:items-center justify-center bg-olevia-forest/60 backdrop-blur-sm p-0 md:p-6"
      data-testid="inquire-modal"
      onClick={onClose}
    >
      <div
        className="relative w-full md:max-w-lg bg-olevia-cream rounded-t-3xl md:rounded-3xl p-8 md:p-10 shadow-2xl"
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

        <div className="olevia-overline mb-3">Inquire</div>
        <h3 className="font-serif text-3xl md:text-4xl text-olevia-forest leading-tight mb-4">
          {product.name}
        </h3>
        <p className="text-olevia-muted leading-relaxed mb-8">
          Our rituals are hand-blended in small batches. Reach out and we&apos;ll confirm
          availability, batch date, and arrange gentle delivery.
        </p>

        <div className="flex flex-col gap-3">
          <a
            href={waLink}
            target="_blank"
            rel="noreferrer"
            className="btn-primary w-full"
            data-testid="inquire-whatsapp"
          >
            <MessageCircle size={16} /> Inquire via WhatsApp
          </a>
          <a
            href={mailLink}
            className="btn-secondary w-full"
            data-testid="inquire-email"
          >
            <Mail size={16} /> Inquire via Email
          </a>
          <button
            type="button"
            onClick={copy}
            className="btn-ghost justify-center w-full pt-2"
            data-testid="inquire-copy"
          >
            {copied ? "Message copied ✓" : "Copy inquiry message"}
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-olevia-border text-xs text-olevia-muted tracking-wide">
          Typically responds within 24 hours · Small-batch, hand-poured
        </div>
      </div>
    </div>
  );
}
