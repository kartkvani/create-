import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { ArrowUpRight, Leaf, Wind, Moon, Brain, HeartPulse, Sparkles } from "lucide-react";
import { api } from "../lib/api";

const HERO_BG =
  "https://images.pexels.com/photos/7704483/pexels-photo-7704483.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=900&w=1400";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: i * 0.08 },
  }),
};

const BENEFITS = [
  {
    icon: Moon,
    title: "Sleep",
    blurb: "Lavender, vetiver and chamomile quiet the nervous system before bed.",
    span: "md:col-span-5 md:row-span-2",
    accent: "bg-olevia-bone",
  },
  {
    icon: Brain,
    title: "Focus",
    blurb: "Rosemary and peppermint sharpen attention on long-work days.",
    span: "md:col-span-4",
    accent: "bg-white",
  },
  {
    icon: Wind,
    title: "Breath",
    blurb: "Eucalyptus and frankincense open the chest and lengthen the exhale.",
    span: "md:col-span-3",
    accent: "bg-white",
  },
  {
    icon: HeartPulse,
    title: "Pain",
    blurb: "Arnica, ginger and wintergreen in roll-ons soften tight muscles.",
    span: "md:col-span-4",
    accent: "bg-olevia-bone",
  },
  {
    icon: Sparkles,
    title: "Mood",
    blurb: "Bergamot and ylang ylang lift heavy afternoons without over-stimulation.",
    span: "md:col-span-3",
    accent: "bg-white",
  },
];

const TIMELINE = [
  { year: "2500 BCE", title: "Ancient Egypt", body: "Priests burn frankincense and myrrh in rituals; infused oils appear in embalming and daily baths." },
  { year: "1500 BCE", title: "Vedic India", body: "Ayurveda integrates aromatic oils as a core healing modality alongside herbs and massage." },
  { year: "400 BCE", title: "Hippocrates, Greece", body: "“The way to health is to have an aromatic bath and scented massage every day.”" },
  { year: "1025 CE", title: "Ibn Sina, Persia", body: "Refines steam distillation — the first recognizable essential oils appear in medical texts." },
  { year: "1937", title: "Gattefossé, France", body: "Coins the term ‘aromathérapie’ after healing a burn with lavender oil." },
  { year: "Today", title: "Olevia", body: "Small-batch blends grounded in tradition and current peer-reviewed research." },
];

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [latestBlogs, setLatestBlogs] = useState([]);

  useEffect(() => {
    api.get("/products").then((r) => {
      setFeatured((r.data || []).filter((p) => p.featured).slice(0, 4));
    }).catch(() => {});
    api.get("/blogs").then((r) => setLatestBlogs((r.data || []).slice(0, 3))).catch(() => {});
  }, []);

  return (
    <div data-testid="home-page">
      {/* HERO */}
      <section className="relative min-h-[92vh] flex items-center overflow-hidden grain-overlay">
        <div className="absolute inset-0 z-0">
          <img src={HERO_BG} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-olevia-cream via-olevia-cream/85 to-olevia-cream/20" />
        </div>
        <div className="olevia-container relative z-10 pt-20 pb-24 max-w-5xl">
          <motion.div initial="hidden" animate="show" variants={fadeUp} custom={0}>
            <div className="olevia-overline mb-6">Est. in quiet rituals</div>
          </motion.div>
          <motion.h1
            initial="hidden"
            animate="show"
            variants={fadeUp}
            custom={1}
            className="font-serif text-5xl md:text-7xl lg:text-8xl leading-[0.95] text-olevia-forest tracking-tight text-balance"
          >
            A quieter nervous system,
            <br />
            <em className="italic text-olevia-sage-dark">one breath at a time.</em>
          </motion.h1>
          <motion.p
            initial="hidden"
            animate="show"
            variants={fadeUp}
            custom={2}
            className="mt-8 max-w-xl text-lg md:text-xl text-olevia-muted leading-relaxed"
          >
            Olevia is a small-batch aromatherapy house crafting diffuser blends, roll-ons,
            therapeutic plants and cold-process soaps — grounded in 4,500 years of botanical
            medicine and today&apos;s research.
          </motion.p>
          <motion.div
            initial="hidden"
            animate="show"
            variants={fadeUp}
            custom={3}
            className="mt-10 flex flex-wrap gap-4"
          >
            <Link to="/products" className="btn-primary" data-testid="hero-shop-btn">
              Explore the Rituals <ArrowUpRight size={16} />
            </Link>
            <Link to="/blogs" className="btn-secondary" data-testid="hero-journal-btn">
              Read the Journal
            </Link>
          </motion.div>

          <motion.div
            initial="hidden"
            animate="show"
            variants={fadeUp}
            custom={4}
            className="mt-20 flex flex-wrap gap-x-12 gap-y-4 text-xs tracking-[0.22em] uppercase text-olevia-muted"
          >
            <span>· Hand-blended</span>
            <span>· Therapeutic-grade</span>
            <span>· Small-batch</span>
            <span>· Plant-first</span>
          </motion.div>
        </div>
      </section>

      {/* WHAT IS AROMATHERAPY */}
      <section className="olevia-section" data-testid="section-what-is">
        <div className="olevia-container grid md:grid-cols-12 gap-12 md:gap-20 items-center">
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="md:col-span-5"
          >
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1679060170179-c384186c87ad"
                alt="Therapeutic plant close up"
                className="rounded-3xl w-full aspect-[4/5] object-cover"
              />
              <div className="absolute -bottom-6 -right-6 bg-olevia-amber text-olevia-forest px-6 py-4 rounded-2xl shadow-lg hidden md:block">
                <div className="font-serif text-2xl leading-none">4,500+</div>
                <div className="text-[10px] tracking-[0.25em] uppercase mt-1">Years of practice</div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="md:col-span-7"
          >
            <div className="olevia-overline mb-5">What is aromatherapy</div>
            <h2 className="font-serif text-4xl md:text-5xl text-olevia-forest leading-tight mb-6">
              Plant-made chemistry, guided by the breath.
            </h2>
            <p className="text-lg text-olevia-muted leading-relaxed mb-5">
              Aromatherapy uses volatile compounds distilled from flowers, roots, resins and leaves
              to gently influence the nervous system. Scent reaches the amygdala and hippocampus in
              under a second — which is why a single inhalation can shift a mood before the mind catches up.
            </p>
            <p className="text-lg text-olevia-muted leading-relaxed">
              We don&apos;t chase fads. Each Olevia blend pairs a tradition — Egyptian resins,
              Ayurvedic tonics, Gattefossé&apos;s French apothecary — with modern dilution science
              and a ritual that can fit into an already-full day.
            </p>
          </motion.div>
        </div>
      </section>

      {/* HOW AROMATHERAPY HEALS — BENTO */}
      <section className="olevia-section bg-olevia-bone/40" data-testid="section-benefits">
        <div className="olevia-container">
          <div className="max-w-2xl mb-16">
            <div className="olevia-overline mb-5">How aromatherapy heals</div>
            <h2 className="font-serif text-4xl md:text-5xl text-olevia-forest leading-tight">
              Five pathways from leaf to limbic system.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {BENEFITS.map((b, i) => (
              <motion.div
                key={b.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.7, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                className={`${b.span} ${b.accent} rounded-2xl border border-olevia-border p-8 md:p-10 flex flex-col justify-between min-h-[220px] hover:-translate-y-1 transition-transform duration-500`}
                data-testid={`benefit-card-${b.title.toLowerCase()}`}
              >
                <b.icon size={28} className="text-olevia-amber-dark" strokeWidth={1.4} />
                <div className="mt-10">
                  <div className="font-serif text-3xl text-olevia-forest mb-2">{b.title}</div>
                  <p className="text-olevia-muted leading-relaxed text-[15px]">{b.blurb}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* HISTORY TIMELINE */}
      <section className="olevia-section" data-testid="section-history">
        <div className="olevia-container">
          <div className="max-w-2xl mb-20">
            <div className="olevia-overline mb-5">A brief history</div>
            <h2 className="font-serif text-4xl md:text-5xl text-olevia-forest leading-tight">
              Aromatherapy began when we began burning resin to pray.
            </h2>
          </div>

          <div className="relative">
            <div className="absolute left-3 md:left-1/2 top-0 bottom-0 w-px bg-olevia-border -translate-x-px" />
            <div className="space-y-14 md:space-y-24">
              {TIMELINE.map((t, i) => {
                const left = i % 2 === 0;
                return (
                  <motion.div
                    key={t.year}
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-80px" }}
                    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                    className={`relative grid md:grid-cols-2 gap-8 items-start`}
                    data-testid={`timeline-item-${i}`}
                  >
                    <div className="absolute left-3 md:left-1/2 top-2 h-3 w-3 rounded-full bg-olevia-amber -translate-x-1/2 ring-4 ring-olevia-cream" />
                    <div className={`${left ? "md:text-right md:pr-16" : "md:col-start-2 md:pl-16"} pl-10 md:pl-0`}>
                      <div className="font-serif text-4xl md:text-5xl text-olevia-sage-dark mb-1">
                        {t.year}
                      </div>
                      <div className="olevia-overline">{t.title}</div>
                    </div>
                    <div className={`${left ? "md:col-start-2 md:pl-16" : "md:row-start-1 md:pr-16 md:text-right"} pl-10 md:pl-0`}>
                      <p className="text-lg text-olevia-muted leading-relaxed max-w-md md:inline-block">
                        {t.body}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* FEATURED PRODUCTS */}
      {featured.length > 0 && (
        <section className="olevia-section bg-olevia-bone/30" data-testid="section-featured">
          <div className="olevia-container">
            <div className="flex items-end justify-between mb-14">
              <div className="max-w-xl">
                <div className="olevia-overline mb-5">The rituals</div>
                <h2 className="font-serif text-4xl md:text-5xl text-olevia-forest leading-tight">
                  Quietly powerful, slowly made.
                </h2>
              </div>
              <Link to="/products" className="btn-ghost hidden md:inline-flex" data-testid="featured-see-all">
                See all <ArrowUpRight size={14} />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
              {featured.map((p) => (
                <Link
                  to="/products"
                  key={p.id}
                  className="editorial-card group"
                  data-testid={`featured-product-${p.id}`}
                >
                  <div className="relative aspect-[4/5] overflow-hidden bg-olevia-bone">
                    <img
                      src={p.image}
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[1200ms]"
                    />
                  </div>
                  <div className="p-6">
                    <div className="olevia-overline mb-2">{p.category.replace("_", " ")}</div>
                    <div className="font-serif text-2xl text-olevia-forest leading-tight mb-2">
                      {p.name}
                    </div>
                    <div className="text-sm text-olevia-muted">${p.price.toFixed(0)}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* LATEST FROM JOURNAL */}
      {latestBlogs.length > 0 && (
        <section className="olevia-section" data-testid="section-journal">
          <div className="olevia-container">
            <div className="flex items-end justify-between mb-14">
              <div className="max-w-xl">
                <div className="olevia-overline mb-5">From the journal</div>
                <h2 className="font-serif text-4xl md:text-5xl text-olevia-forest leading-tight">
                  Field notes on breath, blends & botany.
                </h2>
              </div>
              <Link to="/blogs" className="btn-ghost hidden md:inline-flex" data-testid="journal-see-all">
                Read more <ArrowUpRight size={14} />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {latestBlogs.map((b) => (
                <Link
                  key={b.id}
                  to={`/blogs/${b.slug}`}
                  className="editorial-card group"
                  data-testid={`journal-card-${b.slug}`}
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-olevia-bone">
                    <img
                      src={b.cover_image}
                      alt={b.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[1200ms]"
                    />
                  </div>
                  <div className="p-7">
                    <div className="olevia-overline mb-3">{b.category} · {b.read_time}</div>
                    <div className="font-serif text-2xl text-olevia-forest leading-snug mb-3">
                      {b.title}
                    </div>
                    <p className="text-olevia-muted leading-relaxed text-[15px] line-clamp-3">
                      {b.excerpt}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FINAL CTA */}
      <section className="pb-24 md:pb-32" data-testid="section-cta">
        <div className="olevia-container">
          <div className="bg-olevia-sage/20 border border-olevia-sage/30 rounded-3xl p-10 md:p-20 text-center grain-overlay">
            <Leaf size={32} className="mx-auto text-olevia-sage-dark mb-6" strokeWidth={1.3} />
            <h3 className="font-serif text-4xl md:text-6xl text-olevia-forest leading-tight max-w-3xl mx-auto">
              Balance is not a destination.
              <br />
              <em className="italic text-olevia-sage-dark">It begins here.</em>
            </h3>
            <div className="mt-10 flex justify-center">
              <Link to="/products" className="btn-primary" data-testid="cta-shop-btn">
                Start your ritual <ArrowUpRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
