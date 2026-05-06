import { Link } from "react-router-dom";
import { Instagram, Mail, Leaf } from "lucide-react";

const LOGO_URL =
  "https://customer-assets.emergentagent.com/job_0c6dacb0-b396-4364-8cbc-6314f49a613f/artifacts/uj5cttws_19877%20%282%29.png";

export default function Footer() {
  return (
    <footer
      className="bg-olevia-forest text-olevia-cream rounded-t-[3rem] mt-24"
      data-testid="site-footer"
    >
      <div className="olevia-container py-20 md:py-28">
        <div className="grid md:grid-cols-12 gap-12">
          <div className="md:col-span-5">
            <div className="flex items-center gap-4 mb-6">
              <div className="h-16 w-16 rounded-full bg-olevia-cream/95 flex items-center justify-center">
                <img src={LOGO_URL} alt="Olevia" className="h-14 w-14 object-contain" />
              </div>
              <div>
                <div className="font-serif text-4xl leading-none">Olevia</div>
                <div className="text-[11px] tracking-[0.28em] uppercase text-olevia-amber mt-2">
                  Balance Begins Here
                </div>
              </div>
            </div>
            <p className="text-olevia-cream/70 max-w-md leading-relaxed">
              Small-batch aromatherapy rituals — diffuser blends, roll-ons, therapeutic plants and
              cold-process soaps — formulated to soften modern nervous systems.
            </p>
          </div>

          <div className="md:col-span-3">
            <div className="olevia-overline mb-5" style={{ color: "#D4A373" }}>
              Explore
            </div>
            <ul className="space-y-3 text-olevia-cream/80">
              <li>
                <Link to="/" data-testid="footer-link-home" className="hover:text-olevia-amber transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/products" data-testid="footer-link-products" className="hover:text-olevia-amber transition-colors">
                  Shop
                </Link>
              </li>
              <li>
                <Link to="/blogs" data-testid="footer-link-blogs" className="hover:text-olevia-amber transition-colors">
                  Journal
                </Link>
              </li>
              <li>
                <Link to="/login" data-testid="footer-link-login" className="hover:text-olevia-amber transition-colors">
                  Sign In
                </Link>
              </li>
            </ul>
          </div>

          <div className="md:col-span-4">
            <div className="olevia-overline mb-5" style={{ color: "#D4A373" }}>
              Connect
            </div>
            <ul className="space-y-3 text-olevia-cream/80">
              <li className="flex items-center gap-3">
                <Mail size={14} className="text-olevia-amber" />
                <a
                  href="mailto:kartk.vani@gmail.com"
                  className="hover:text-olevia-amber transition-colors"
                  data-testid="footer-email"
                >
                  kartk.vani@gmail.com
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Instagram size={14} className="text-olevia-amber" />
                <span>@olevia.rituals</span>
              </li>
              <li className="flex items-center gap-3">
                <Leaf size={14} className="text-olevia-amber" />
                <span>Small-batch · Hand-blended</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-olevia-cream/15 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs tracking-wider text-olevia-cream/50">
          <div>© {new Date().getFullYear()} Olevia. Crafted slowly.</div>
          <div className="uppercase tracking-[0.25em]">Balance. Breath. Botanicals.</div>
        </div>
      </div>
    </footer>
  );
}
