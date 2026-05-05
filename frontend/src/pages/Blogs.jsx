import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { api } from "../lib/api";

export default function Blogs() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/blogs")
      .then((r) => setBlogs(r.data || []))
      .catch(() => setBlogs([]))
      .finally(() => setLoading(false));
  }, []);

  const [hero, ...rest] = blogs;

  return (
    <div className="pb-24" data-testid="blogs-page">
      <section className="pt-20 pb-10 md:pt-28">
        <div className="olevia-container">
          <div className="olevia-overline mb-5">The journal</div>
          <h1 className="font-serif text-5xl md:text-7xl text-olevia-forest leading-[0.95] max-w-4xl">
            Field notes on breath,
            <br />
            <em className="italic text-olevia-sage-dark">blends & botany.</em>
          </h1>
        </div>
      </section>

      {loading ? (
        <div className="olevia-container py-20 text-olevia-muted" data-testid="blogs-loading">
          Loading journal…
        </div>
      ) : blogs.length === 0 ? (
        <div className="olevia-container py-20 text-olevia-muted" data-testid="blogs-empty">
          No posts yet.
        </div>
      ) : (
        <>
          {/* Hero post */}
          {hero && (
            <section className="pb-16">
              <div className="olevia-container">
                <Link
                  to={`/blogs/${hero.slug}`}
                  className="grid md:grid-cols-12 gap-8 md:gap-12 group"
                  data-testid={`blog-hero-${hero.slug}`}
                >
                  <div className="md:col-span-7 relative aspect-[4/3] md:aspect-auto overflow-hidden rounded-3xl bg-olevia-bone">
                    <img
                      src={hero.cover_image}
                      alt={hero.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[1200ms]"
                    />
                  </div>
                  <div className="md:col-span-5 flex flex-col justify-center">
                    <div className="olevia-overline mb-4">
                      {hero.category} · {hero.read_time}
                    </div>
                    <h2 className="font-serif text-4xl md:text-5xl text-olevia-forest leading-tight mb-5 group-hover:text-olevia-sage-dark transition-colors">
                      {hero.title}
                    </h2>
                    <p className="text-lg text-olevia-muted leading-relaxed mb-6">{hero.excerpt}</p>
                    <div className="text-xs tracking-[0.22em] uppercase text-olevia-muted">
                      By {hero.author}
                    </div>
                  </div>
                </Link>
              </div>
            </section>
          )}

          {/* Grid */}
          {rest.length > 0 && (
            <section className="pt-6">
              <div className="olevia-container">
                <div
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10"
                  data-testid="blogs-grid"
                >
                  {rest.map((b, i) => (
                    <motion.article
                      key={b.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <Link
                        to={`/blogs/${b.slug}`}
                        className="editorial-card block group"
                        data-testid={`blog-card-${b.slug}`}
                      >
                        <div className="relative aspect-[4/3] overflow-hidden bg-olevia-bone">
                          <img
                            src={b.cover_image}
                            alt={b.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[1200ms]"
                          />
                        </div>
                        <div className="p-7">
                          <div className="olevia-overline mb-3">
                            {b.category} · {b.read_time}
                          </div>
                          <h3 className="font-serif text-2xl text-olevia-forest leading-snug mb-3">
                            {b.title}
                          </h3>
                          <p className="text-olevia-muted leading-relaxed text-[15px] line-clamp-3">
                            {b.excerpt}
                          </p>
                        </div>
                      </Link>
                    </motion.article>
                  ))}
                </div>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
