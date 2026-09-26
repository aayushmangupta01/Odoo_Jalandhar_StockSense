import { Boxes, ShieldCheck } from 'lucide-react';
import './auth.css';

function AuthLayout({ children, title, description, step }) {
  return (
    <main className="auth-screen">
      <aside className="auth-story" aria-label="StockSense">
        <div className="auth-brand">
          <span className="auth-brand__mark"><Boxes size={20} strokeWidth={2.2} /></span>
          <span>StockSense</span>
          <span className="auth-brand__edition">INVENTORY OS</span>
        </div>

        <div className="auth-story__content">
          <span className="auth-kicker">INVENTORY, IN CLEAR VIEW</span>
          <h1>Keep every moving part in sync.</h1>
          <p>One calm place to follow stock, movement, and the work behind every number.</p>
          <div className="auth-story__visual" aria-hidden="true">
            <div className="auth-grid-lines" />
            <div className="auth-visual__header"><span>WAREHOUSE OVERVIEW</span><span>LIVE</span></div>
            <div className="auth-visual__bars"><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /></div>
            <div className="auth-visual__footer"><span><b /> STOCK MOVEMENTS</span><strong>TRACEABLE BY DESIGN</strong></div>
          </div>
        </div>

        <div className="auth-story__footer">
          <ShieldCheck size={15} /> <span>Secure access to your inventory workspace</span>
        </div>
      </aside>

      <section className="auth-panel">
        <div className="auth-panel__topline">
          <span>STOCKSENSE ACCOUNT</span>
          {step && <span className="auth-step">{step}</span>}
        </div>
        <div className="auth-card">
          <header className="auth-card__header">
            <h2>{title}</h2>
            <p>{description}</p>
          </header>
          {children}
        </div>
        <footer className="auth-panel__footer">© 2026 StockSense <span>·</span> Inventory operations, made clear.</footer>
      </section>
    </main>
  );
}

export default AuthLayout;