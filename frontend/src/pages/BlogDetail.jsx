import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { api } from "../lib/api";

export default function BlogDetail() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    api.get(`/blogs/${slug}`)
      .then((r) => setPost(r.data))
      .catch(() => setError("Post not found."))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="olevia-container py-32 text-olevia-muted" data-testid="blog-detail-loading">
        Loading…
      </div>
    );
  }
  if (error || !post) {
    return (
      <div className="olevia-container py-32" data-testid="blog-detail-notfound">
        <div className="olevia-overline mb-4">Not found</div>
        <h1 className="font-serif text-5xl text-olevia-forest mb-8">
          This post has wandered off.
        </h1>
        <Link to="/blogs" className="btn-secondary" data-testid="blog-detail-back">
          <ArrowLeft size={14} /> Back to the Journal
        </Link>
      </div>
    );
  }

  return (
    <article className="pb-24" data-testid="blog-detail">
      <header className="pt-12 pb-14 md:pt-20">
        <div className="olevia-container max-w-4xl">
          <Link to="/blogs" className="btn-ghost mb-10" data-testid="blog-detail-back-link">
            <ArrowLeft size={14} /> All posts
          </Link>
          <div className="olevia-overline mb-5">
            {post.category} · {post.read_time}
          </div>
          <h1 className="font-serif text-4xl md:text-6xl text-olevia-forest leading-[1.05] mb-8">
            {post.title}
          </h1>
          <div className="text-sm tracking-[0.22em] uppercase text-olevia-muted">
            By {post.author}
          </div>
        </div>
      </header>

      <div className="olevia-container max-w-5xl mb-16">
        <div className="rounded-3xl overflow-hidden aspect-[16/9] bg-olevia-bone">
          <img src={post.cover_image} alt={post.title} className="w-full h-full object-cover" />
        </div>
      </div>

      <div className="olevia-container max-w-3xl">
        <div className="prose-like text-lg text-olevia-ink leading-[1.85] whitespace-pre-line font-light" data-testid="blog-detail-content">
          {post.content}
        </div>
      </div>
    </article>
  );
}
