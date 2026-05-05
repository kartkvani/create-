import Navbar from "./Navbar";
import Footer from "./Footer";

export default function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-olevia-cream">
      <Navbar />
      <main className="flex-1 pt-20" data-testid="page-main">
        {children}
      </main>
      <Footer />
    </div>
  );
}
