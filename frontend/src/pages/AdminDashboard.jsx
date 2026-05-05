import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { Pencil, Trash2, Plus, X } from "lucide-react";
import { api, formatApiError } from "../lib/api";
import { useAuth } from "../context/AuthContext";

const EMPTY = {
  title: "",
  excerpt: "",
  content: "",
  cover_image: "",
  category: "Wellness",
  author: "Olevia Editorial",
  read_time: "5 min read",
};

export default function AdminDashboard() {
  const { user, loading } = useAuth();
  const [blogs, setBlogs] = useState([]);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(null); // null | 'new' | blog object
  const [form, setForm] = useState(EMPTY);
  const [err, setErr] = useState("");

  const load = async () => {
    const r = await api.get("/blogs");
    setBlogs(r.data || []);
  };

  useEffect(() => {
    if (user && user.role === "admin") load();
  }, [user]);

  if (loading) return null;
  if (!user || user.role !== "admin") return <Navigate to="/login" replace />;

  const openNew = () => {
    setForm(EMPTY);
    setEditing("new");
    setErr("");
  };
  const openEdit = (b) => {
    setForm({
      title: b.title,
      excerpt: b.excerpt,
      content: b.content,
      cover_image: b.cover_image,
      category: b.category,
      author: b.author,
      read_time: b.read_time,
    });
    setEditing(b);
    setErr("");
  };
  const close = () => {
    setEditing(null);
    setForm(EMPTY);
    setErr("");
  };

  const save = async (e) => {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      if (editing === "new") {
        await api.post("/blogs", form);
      } else {
        await api.put(`/blogs/${editing.id}`, form);
      }
      await load();
      close();
    } catch (ex) {
      setErr(formatApiError(ex, "Could not save post."));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (b) => {
    if (!window.confirm(`Delete “${b.title}”? This cannot be undone.`)) return;
    try {
      await api.delete(`/blogs/${b.id}`);
      await load();
    } catch (ex) {
      alert(formatApiError(ex, "Could not delete."));
    }
  };

  return (
    <div className="pb-24" data-testid="admin-page">
      <section className="pt-16 pb-10 md:pt-24">
        <div className="olevia-container flex items-end justify-between flex-wrap gap-6">
          <div>
            <div className="olevia-overline mb-4">Admin · Journal</div>
            <h1 className="font-serif text-5xl md:text-6xl text-olevia-forest leading-[0.95]">
              Manage the journal.
            </h1>
            <p className="text-olevia-muted mt-4">Signed in as {user.email}</p>
          </div>
          <button
            type="button"
            className="btn-primary"
            onClick={openNew}
            data-testid="admin-new-post-btn"
          >
            <Plus size={16} /> New post
          </button>
        </div>
      </section>

      <section>
        <div className="olevia-container">
          <div className="bg-white border border-olevia-border rounded-2xl overflow-hidden" data-testid="admin-posts-table">
            <table className="w-full text-left">
              <thead className="bg-olevia-bone/60">
                <tr className="text-[10px] tracking-[0.22em] uppercase text-olevia-muted">
                  <th className="px-6 py-4">Title</th>
                  <th className="px-6 py-4 hidden md:table-cell">Category</th>
                  <th className="px-6 py-4 hidden lg:table-cell">Updated</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {blogs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-olevia-muted">
                      No posts yet.
                    </td>
                  </tr>
                ) : (
                  blogs.map((b) => (
                    <tr
                      key={b.id}
                      className="border-t border-olevia-border hover:bg-olevia-bone/30"
                      data-testid={`admin-row-${b.id}`}
                    >
                      <td className="px-6 py-5">
                        <div className="font-serif text-xl text-olevia-forest leading-snug">
                          {b.title}
                        </div>
                        <div className="text-xs text-olevia-muted mt-1">/{b.slug}</div>
                      </td>
                      <td className="px-6 py-5 hidden md:table-cell text-sm text-olevia-muted">
                        {b.category}
                      </td>
                      <td className="px-6 py-5 hidden lg:table-cell text-sm text-olevia-muted">
                        {new Date(b.updated_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="inline-flex gap-2">
                          <button
                            type="button"
                            onClick={() => openEdit(b)}
                            className="p-2 rounded-full hover:bg-olevia-bone text-olevia-ink"
                            data-testid={`admin-edit-${b.id}`}
                            aria-label="Edit"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => remove(b)}
                            className="p-2 rounded-full hover:bg-red-50 text-red-700"
                            data-testid={`admin-delete-${b.id}`}
                            aria-label="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {editing && (
        <div
          className="fixed inset-0 z-[70] bg-olevia-forest/60 backdrop-blur-sm flex items-start md:items-center justify-center p-0 md:p-6 overflow-y-auto"
          data-testid="admin-editor-modal"
          onClick={close}
        >
          <div
            className="relative w-full max-w-3xl bg-olevia-cream rounded-t-3xl md:rounded-3xl p-8 md:p-12 my-0 md:my-10"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={close}
              className="absolute top-5 right-5 p-2 text-olevia-ink hover:text-olevia-amber-dark"
              data-testid="admin-editor-close"
              aria-label="Close"
            >
              <X size={20} />
            </button>
            <div className="olevia-overline mb-3">
              {editing === "new" ? "New post" : "Edit post"}
            </div>
            <h2 className="font-serif text-4xl text-olevia-forest mb-8">
              {editing === "new" ? "A new note for the journal." : "Refine this note."}
            </h2>

            <form onSubmit={save} className="space-y-5" data-testid="admin-editor-form">
              <Field label="Title" testid="editor-title">
                <input
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  data-testid="editor-title-input"
                  className="input-line"
                />
              </Field>
              <Field label="Cover image URL" testid="editor-cover">
                <input
                  required
                  value={form.cover_image}
                  onChange={(e) => setForm({ ...form, cover_image: e.target.value })}
                  data-testid="editor-cover-input"
                  className="input-line"
                  placeholder="https://…"
                />
              </Field>
              <div className="grid md:grid-cols-3 gap-5">
                <Field label="Category" testid="editor-category">
                  <input
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    data-testid="editor-category-input"
                    className="input-line"
                  />
                </Field>
                <Field label="Author" testid="editor-author">
                  <input
                    value={form.author}
                    onChange={(e) => setForm({ ...form, author: e.target.value })}
                    data-testid="editor-author-input"
                    className="input-line"
                  />
                </Field>
                <Field label="Read time" testid="editor-readtime">
                  <input
                    value={form.read_time}
                    onChange={(e) => setForm({ ...form, read_time: e.target.value })}
                    data-testid="editor-readtime-input"
                    className="input-line"
                  />
                </Field>
              </div>
              <Field label="Excerpt" testid="editor-excerpt">
                <textarea
                  required
                  rows={2}
                  value={form.excerpt}
                  onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                  data-testid="editor-excerpt-input"
                  className="input-line resize-none"
                />
              </Field>
              <Field label="Content" testid="editor-content">
                <textarea
                  required
                  rows={10}
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  data-testid="editor-content-input"
                  className="input-line resize-y"
                />
              </Field>

              {err && (
                <div
                  className="text-sm text-red-700 bg-red-100/60 border border-red-200 rounded-lg px-4 py-3"
                  data-testid="editor-error"
                >
                  {err}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={busy}
                  className="btn-primary disabled:opacity-60"
                  data-testid="editor-submit"
                >
                  {busy ? "Saving…" : editing === "new" ? "Publish post" : "Save changes"}
                </button>
                <button
                  type="button"
                  onClick={close}
                  className="btn-secondary"
                  data-testid="editor-cancel"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`.input-line{width:100%;background:transparent;border:0;border-bottom:1px solid rgba(42,59,44,0.25);border-radius:0;padding:10px 0;outline:none;color:#2A3B2C;font-family:'Manrope',sans-serif;font-size:1rem;}
      .input-line:focus{border-bottom-color:#8F9E8B;}
      textarea.input-line{font-family:'Manrope',sans-serif;line-height:1.6;}`}</style>
    </div>
  );
}

function Field({ label, testid, children }) {
  return (
    <label className="block" data-testid={`field-${testid}`}>
      <span className="olevia-overline mb-2 block">{label}</span>
      {children}
    </label>
  );
}
