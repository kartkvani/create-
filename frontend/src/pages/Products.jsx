import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { api } from "../lib/api";
import InquireModal from "../components/InquireModal";

const CATEGORIES = [
  { key: "all", label: "All" },
  { key: "diffuser_blends", label: "Diffuser Blends" },
  { key: "roll_ons", label: "Roll-ons & Pain" },
  { key: "plants", label: "Therapeutic Plants" },
  { key: "soaps", label: "Soaps" },
];

export default function Products() {
  const [products, setProducts] = useState([]);
  const [active, setActive] = useState("all");
  const [loading, setLoading] = useState(true);
  const [inquire, setInquire] = useState(null);

  useEffect(() => {
    setLoading(true);
    api.get("/products").then((r) => setProducts(r.data || []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(
    () => (active === "all" ? products : products.filter((p) => p.category === active)),
    [products, active]
  );

  return (
    <div className="pb-24" data-testid="products-page">
      {/* Editorial header */}
      <section className="pt-20 pb-16 md:pt-28 md:pb-20">
        <div className="olevia-container">
          <div className="olevia-overline mb-5">The apothecary</div>
          <h1 className="font-serif text-5xl md:text-7xl text-olevia-forest leading-[0.95] max-w-4xl">
            Rituals in small bottles,
            <br />
            <em className="italic text-olevia-sage-dark">made slowly on purpose.</em>
          </h1>
          <p className="mt-8 max-w-2xl text-lg text-olevia-muted leading-relaxed">
            Every Olevia product is hand-blended in batches of 40 or fewer. Tap any piece to inquire;
            we&apos;ll confirm stock, batch date, and walk you through the ritual.
          </p>
        </div>
      </section>

      {/* Filters */}
      <div className="sticky top-20 z-30 bg-olevia-cream/90 backdrop-blur-xl border-y border-olevia-border">
        <div className="olevia-container py-4 flex gap-2 md:gap-3 overflow-x-auto">
          {CATEGORIES.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => setActive(c.key)}
              data-testid={`filter-${c.key}`}
              className={`whitespace-nowrap px-5 py-2 rounded-full text-xs tracking-[0.18em] uppercase font-semibold transition-all ${
                active === c.key
                  ? "bg-olevia-forest text-olevia-cream"
                  : "text-olevia-muted hover:text-olevia-forest border border-transparent hover:border-olevia-border"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <section className="pt-12">
        <div className="olevia-container">
          {loading ? (
            <div className="text-olevia-muted py-20 text-center" data-testid="products-loading">
              Preparing the apothecary…
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-olevia-muted py-20 text-center" data-testid="products-empty">
              No products in this category yet.
            </div>
          ) : (
            <div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8"
              data-testid="products-grid"
            >
              {filtered.map((p, i) => (
                <motion.article
                  key={p.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: i * 0.04, ease: [0.22, 1, 0.36, 1] }}
                  className="editorial-card flex flex-col group"
                  data-testid={`product-card-${p.id}`}
                >
                  <div className="relative aspect-[4/5] overflow-hidden bg-olevia-bone">
                    <img
                      src={p.image}
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[1200ms]"
                    />
                    <div className="absolute top-4 left-4 bg-olevia-cream/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-[10px] tracking-[0.2em] uppercase font-semibold text-olevia-sage-dark">
                      {p.category.replace("_", " ")}
                    </div>
                  </div>
                  <div className="p-7 flex flex-col flex-1">
                    <div className="font-serif text-2xl text-olevia-forest leading-snug mb-2">
                      {p.name}
                    </div>
                    <p className="text-olevia-muted leading-relaxed text-[15px] mb-5 flex-1">
                      {p.description}
                    </p>
                    <ul className="mb-6 space-y-1.5">
                      {p.benefits.slice(0, 3).map((b) => (
                        <li
                          key={b}
                          className="text-xs text-olevia-sage-dark flex items-start gap-2 before:content-['·'] before:text-olevia-amber-dark before:text-xl before:leading-none"
                        >
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-olevia-border">
                      <div className="font-serif text-2xl text-olevia-forest">
                        ${p.price.toFixed(0)}
                      </div>
                      <button
                        type="button"
                        onClick={() => setInquire(p)}
                        className="btn-primary text-xs px-5 py-2.5"
                        data-testid={`product-inquire-${p.id}`}
                      >
                        Inquire
                      </button>
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          )}
        </div>
      </section>

      <InquireModal product={inquire} open={!!inquire} onClose={() => setInquire(null)} />
    </div>
  );
}
