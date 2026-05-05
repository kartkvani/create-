import { Link, NavLink, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Menu, X, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const LOGO_URL =
  "https://customer-assets.emergentagent.com/job_0c6dacb0-b396-4364-8cbc-6314f49a613f/artifacts/uj5cttws_19877%20%282%29.png";

const links = [
  { to: "/", label: "Home" },
  { to: "/products", label: "Shop" },
  { to: "/blogs", label: "Journal" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navClass = `fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
    scrolled
      ? "backdrop-blur-xl bg-olevia-cream/80 border-b border-olevia-border/60"
      : "bg-transparent"
  }`;

  return (
    <header className={navClass} data-testid="site-navbar">
      <div className="olevia-container flex items-center justify-between h-20">
        <Link to="/" className="flex items-center gap-3" data-testid="nav-logo-link">
          <img
            src={LOGO_URL}
            alt="Olevia"
            className="h-12 w-12 object-contain"
            data-testid="nav-logo-image"
          />
          <div className="leading-tight hidden sm:block">
            <div className="font-serif text-2xl text-olevia-forest tracking-wide">Olevia</div>
            <div className="text-[10px] tracking-[0.25em] uppercase text-olevia-amber-dark">
              Balance Begins Here
            </div>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-10">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === "/"}
              data-testid={`nav-link-${l.label.toLowerCase()}`}
              className={({ isActive }) =>
                `text-xs tracking-[0.22em] uppercase font-semibold transition-colors ${
                  isActive ? "text-olevia-amber-dark" : "text-olevia-ink hover:text-olevia-amber-dark"
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
          {user && user.role === "admin" && (
            <NavLink
              to="/admin"
              data-testid="nav-link-admin"
              className={({ isActive }) =>
                `text-xs tracking-[0.22em] uppercase font-semibold transition-colors ${
                  isActive ? "text-olevia-amber-dark" : "text-olevia-ink hover:text-olevia-amber-dark"
                }`
              }
            >
              Admin
            </NavLink>
          )}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          {user && user.role === "admin" ? (
            <button
              type="button"
              onClick={() => {
                logout();
                navigate("/");
              }}
              data-testid="nav-logout-btn"
              className="btn-ghost"
            >
              <LogOut size={14} /> Logout
            </button>
          ) : (
            <Link to="/login" data-testid="nav-login-btn" className="btn-ghost">
              Sign In
            </Link>
          )}
          <Link to="/products" data-testid="nav-shop-cta" className="btn-primary">
            Shop Rituals
          </Link>
        </div>

        <button
          type="button"
          className="md:hidden p-2 text-olevia-ink"
          onClick={() => setOpen(true)}
          data-testid="mobile-menu-open"
          aria-label="Open menu"
        >
          <Menu size={24} />
        </button>
      </div>

      {open && (
        <div
          className="md:hidden fixed inset-0 bg-olevia-cream z-50 animate-fade-up"
          data-testid="mobile-menu"
        >
          <div className="olevia-container flex items-center justify-between h-20">
            <Link to="/" onClick={() => setOpen(false)} className="flex items-center gap-3">
              <img src={LOGO_URL} alt="Olevia" className="h-10 w-10 object-contain" />
              <span className="font-serif text-2xl text-olevia-forest">Olevia</span>
            </Link>
            <button
              type="button"
              className="p-2 text-olevia-ink"
              onClick={() => setOpen(false)}
              data-testid="mobile-menu-close"
              aria-label="Close menu"
            >
              <X size={24} />
            </button>
          </div>
          <div className="olevia-container mt-10 flex flex-col gap-6">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === "/"}
                onClick={() => setOpen(false)}
                data-testid={`mobile-nav-${l.label.toLowerCase()}`}
                className="font-serif text-5xl text-olevia-forest"
              >
                {l.label}
              </NavLink>
            ))}
            {user && user.role === "admin" && (
              <NavLink
                to="/admin"
                onClick={() => setOpen(false)}
                data-testid="mobile-nav-admin"
                className="font-serif text-5xl text-olevia-forest"
              >
                Admin
              </NavLink>
            )}
            <div className="pt-8 border-t border-olevia-border mt-6 flex gap-4">
              {user && user.role === "admin" ? (
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setOpen(false);
                    navigate("/");
                  }}
                  className="btn-secondary"
                  data-testid="mobile-logout-btn"
                >
                  Logout
                </button>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setOpen(false)}
                  className="btn-secondary"
                  data-testid="mobile-login-btn"
                >
                  Sign In
                </Link>
              )}
              <Link
                to="/products"
                onClick={() => setOpen(false)}
                className="btn-primary"
                data-testid="mobile-shop-cta"
              >
                Shop Rituals
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
