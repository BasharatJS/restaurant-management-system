'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';

// ── Color tokens ──────────────────────────────────────────────
// Primary: Amber Gold  #f59e0b
// Dark BG: Deep Navy   #0a0f1e
// Accent:  Warm White  #f8fafc
// Card BG: #111827

const FEATURES = [
  { icon: '🧾', title: 'Smart Order Management', desc: 'Take orders from table, takeaway, or delivery. Real-time kitchen sync with zero confusion.' },
  { icon: '🍳', title: 'Kitchen Display System', desc: 'Live KDS for your kitchen staff. Orders appear instantly, colour-coded by urgency.' },
  { icon: '🪑', title: 'Table & Floor Management', desc: 'Visual floor plan, table status, occupancy tracking and instant order assignment.' },
  { icon: '💳', title: 'GST Billing & Invoices', desc: 'Auto-calculated CGST/SGST, thermal-print-ready bills, WhatsApp sharing in one tap.' },
  { icon: '📦', title: 'Inventory Control', desc: 'Track stock levels, get low-stock alerts and manage suppliers from one place.' },
  { icon: '📊', title: 'Revenue Reports', desc: 'Daily, weekly, monthly sales reports with charts. Know your best sellers instantly.' },
  { icon: '👥', title: 'Multi-Role Staff Access', desc: 'Separate logins for Admin, Waiter and Kitchen. Each role sees only what they need.' },
  { icon: '🔒', title: '100% Data Isolated', desc: "Every restaurant's data is completely private. Multi-tenant SaaS with Firestore security." },
];

const STEPS = [
  { num: '01', title: 'Sign Up Free', desc: 'Create your restaurant account in under 2 minutes. No credit card required.' },
  { num: '02', title: 'Set Up Your Menu', desc: 'Add menu items, categories, GST rates and your restaurant profile.' },
  { num: '03', title: 'Go Live', desc: 'Share staff logins. Start taking orders. Your team is ready in minutes.' },
];

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [activeMenu, setActiveMenu] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: '#0a0f1e', color: '#f8fafc', overflowX: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .amber { color: #f59e0b; }
        .btn-amber {
          background: linear-gradient(135deg, #f59e0b, #d97706);
          color: #0a0f1e;
          font-weight: 800;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-amber:hover { transform: translateY(-2px); box-shadow: 0 8px 30px rgba(245,158,11,0.4); }
        .btn-outline {
          background: transparent;
          color: #f8fafc;
          font-weight: 700;
          border: 2px solid rgba(248,250,252,0.2);
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-outline:hover { border-color: #f59e0b; color: #f59e0b; }
        .card-dark { background: #111827; border: 1px solid rgba(255,255,255,0.07); border-radius: 16px; }
        .card-dark:hover { border-color: rgba(245,158,11,0.3); transform: translateY(-4px); transition: all 0.25s; }
        .glow { box-shadow: 0 0 60px rgba(245,158,11,0.15); }
        @keyframes fadeUp { from { opacity:0; transform:translateY(30px); } to { opacity:1; transform:translateY(0); } }
        .fade-up { animation: fadeUp 0.7s ease both; }
        @keyframes pulse-slow { 0%,100%{opacity:1} 50%{opacity:0.6} }
        .pulse-slow { animation: pulse-slow 3s infinite; }
      `}</style>

      {/* ── NAVBAR ─────────────────────────────────────────── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: scrolled ? 'rgba(10,15,30,0.95)' : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(245,158,11,0.15)' : 'none',
        transition: 'all 0.3s',
        padding: '0 5%',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 68,
      }}>
        {/* Logo */}
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
          <span style={{ fontSize: 22, fontWeight: 900, color: '#f8fafc', letterSpacing: '-0.5px' }}>
            Table<span style={{ color: '#f59e0b' }}>Flow</span>
          </span>
          <span style={{ fontSize: 10, color: '#6b7280', fontWeight: 500 }}>by CodeWithBasharat</span>
        </Link>

        {/* Nav links */}
        <div style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
          {['Features', 'How It Works', 'Pricing'].map(l => (
            <a key={l} href={`#${l.toLowerCase().replace(/ /g, '-')}`}
              style={{ color: '#9ca3af', fontSize: 14, fontWeight: 600, textDecoration: 'none', transition: 'color 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#f59e0b')}
              onMouseLeave={e => (e.currentTarget.style.color = '#9ca3af')}
            >{l}</a>
          ))}
          <Link href="/login" style={{ color: '#9ca3af', fontSize: 14, fontWeight: 600, textDecoration: 'none' }}
            onMouseEnter={(e: any) => (e.currentTarget.style.color = '#f8fafc')}
            onMouseLeave={(e: any) => (e.currentTarget.style.color = '#9ca3af')}
          >Sign In</Link>
          <Link href="/signup" className="btn-amber"
            style={{ padding: '10px 22px', borderRadius: 10, fontSize: 14, fontWeight: 800, textDecoration: 'none', display: 'inline-block' }}
          >Start Free Trial</Link>
        </div>
      </nav>

      {/* ── HERO ──────────────────────────────────────────── */}
      <section style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '120px 5% 80px', position: 'relative' }}>
        {/* Background glow */}
        <div style={{ position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%,-50%)', width: 600, height: 600, background: 'radial-gradient(circle, rgba(245,158,11,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div className="fade-up" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 100, padding: '6px 16px', marginBottom: 28 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} className="pulse-slow" />
          <span style={{ fontSize: 13, fontWeight: 600, color: '#f59e0b' }}>7-Day Free Trial — No Credit Card Required</span>
        </div>

        <h1 className="fade-up" style={{ fontSize: 'clamp(40px, 6vw, 76px)', fontWeight: 900, lineHeight: 1.1, marginBottom: 24, maxWidth: 900, letterSpacing: '-2px' }}>
          The Restaurant POS<br />
          <span style={{ background: 'linear-gradient(135deg, #f59e0b, #fbbf24)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Built for Indian Restaurants</span>
        </h1>

        <p className="fade-up" style={{ fontSize: 18, color: '#9ca3af', maxWidth: 600, lineHeight: 1.7, marginBottom: 40 }}>
          Complete restaurant management — orders, kitchen display, GST billing, inventory & reports. Multi-tenant SaaS. Starts in minutes.
        </p>

        <div className="fade-up" style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 60 }}>
          <Link href="/signup" className="btn-amber" style={{ padding: '16px 36px', borderRadius: 14, fontSize: 16, fontWeight: 800, textDecoration: 'none', display: 'inline-block' }}>
            🚀 Start Free Trial — 7 Days Free
          </Link>
          <Link href="/login" className="btn-outline" style={{ padding: '16px 36px', borderRadius: 14, fontSize: 16, textDecoration: 'none', display: 'inline-block' }}>
            Already have an account? →
          </Link>
        </div>

        {/* Stats row */}
        <div className="fade-up" style={{ display: 'flex', gap: 48, flexWrap: 'wrap', justifyContent: 'center' }}>
          {[['7 Days', 'Free Trial'], ['₹999', 'Per Month'], ['100%', 'Data Isolated'], ['3 Roles', 'Admin / Waiter / Kitchen']].map(([val, label]) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 900, color: '#f59e0b' }}>{val}</div>
              <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 600, marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Dashboard mockup */}
        <div style={{ marginTop: 72, width: '100%', maxWidth: 900, borderRadius: 20, overflow: 'hidden', border: '1px solid rgba(245,158,11,0.2)', boxShadow: '0 40px 80px rgba(0,0,0,0.5)', background: '#111827' }} className="glow">
          <div style={{ background: '#0f172a', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#ef4444' }} />
            <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#f59e0b' }} />
            <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#22c55e' }} />
            <span style={{ color: '#4b5563', fontSize: 12, marginLeft: 8 }}>TableFlow — Admin Dashboard</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, padding: 20 }}>
            {[['💰', '₹18,450', "Today's Revenue", '#f59e0b'], ['🧾', '47', "Today's Orders", '#10b981'], ['🪑', '8/12', 'Active Tables', '#f59e0b'], ['👨‍🍳', '5', 'Kitchen Queue', '#8b5cf6']].map(([icon, val, label, color]) => (
              <div key={label} style={{ background: '#1f2937', borderRadius: 12, padding: '16px 14px', borderLeft: `3px solid ${color}` }}>
                <div style={{ fontSize: 22 }}>{icon}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color, marginTop: 6 }}>{val}</div>
                <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ──────────────────────────────────────── */}
      <section id="features" style={{ padding: '96px 5%', background: '#080d1a' }}>
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#f59e0b', letterSpacing: 3, textTransform: 'uppercase' }}>Everything You Need</span>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 900, marginTop: 12, letterSpacing: '-1px' }}>
            Built for every <span style={{ background: 'linear-gradient(135deg, #f59e0b, #fbbf24)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>corner</span><br />
            of your <span style={{ background: 'linear-gradient(135deg, #f59e0b, #fbbf24)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>restaurant</span>
          </h2>
          <p style={{ color: '#6b7280', marginTop: 16, fontSize: 16, maxWidth: 500, margin: '16px auto 0' }}>From the front desk to the kitchen — TableFlow connects every part of your operation.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20, maxWidth: 1100, margin: '0 auto' }}>
          {FEATURES.map(f => (
            <div key={f.title} className="card-dark" style={{ padding: '28px 24px', cursor: 'default' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>{f.icon}</div>
              <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 8, color: '#f8fafc' }}>{f.title}</h3>
              <p style={{ fontSize: 13.5, color: '#6b7280', lineHeight: 1.65 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────── */}
      <section id="how-it-works" style={{ padding: '96px 5%', background: '#0a0f1e' }}>
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#f59e0b', letterSpacing: 3, textTransform: 'uppercase' }}>Simple Setup</span>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 900, marginTop: 12, letterSpacing: '-1px' }}>
            Up and running<br />
            in under <span style={{ background: 'linear-gradient(135deg, #f59e0b, #fbbf24)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>10 minutes</span>
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 32, maxWidth: 900, margin: '0 auto' }}>
          {STEPS.map((s, i) => (
            <div key={s.num} style={{ textAlign: 'center', padding: '32px 24px', position: 'relative' }}>
              <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(245,158,11,0.15)', border: '2px solid rgba(245,158,11,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 18, fontWeight: 900, color: '#f59e0b' }}>{s.num}</div>
              <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 10 }}>{s.title}</h3>
              <p style={{ color: '#6b7280', fontSize: 14, lineHeight: 1.65 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── PRICING ───────────────────────────────────────── */}
      <section id="pricing" style={{ padding: '96px 5%', background: '#080d1a' }}>
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#f59e0b', letterSpacing: 3, textTransform: 'uppercase' }}>Pricing</span>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 900, marginTop: 12, letterSpacing: '-1px' }}>
            Simple, <span style={{ background: 'linear-gradient(135deg, #f59e0b, #fbbf24)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>transparent</span> pricing
          </h2>
          <p style={{ color: '#6b7280', marginTop: 12, fontSize: 16 }}>Start free for 7 days. No credit card needed.</p>
        </div>

        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 800, margin: '0 auto' }}>
          {/* Monthly */}
          <div className="card-dark" style={{ flex: '1 1 300px', maxWidth: 360, padding: '36px 32px' }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#9ca3af', marginBottom: 6 }}>Monthly Plan</h3>
            <div style={{ fontSize: 52, fontWeight: 900, color: '#f8fafc', margin: '12px 0 4px' }}>₹999</div>
            <p style={{ color: '#6b7280', fontSize: 13, marginBottom: 28 }}>per month, billed monthly</p>
            <ul style={{ listStyle: 'none', marginBottom: 32, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {['Unlimited Orders', 'Full Dashboard Access', 'Admin + Waiter + Kitchen Roles', 'GST Billing & Invoices', 'Inventory Management', 'Sales Reports & Charts', 'WhatsApp Support'].map(f => (
                <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: '#d1d5db' }}>
                  <span style={{ color: '#f59e0b', fontWeight: 900 }}>✓</span>{f}
                </li>
              ))}
            </ul>
            <Link href="/signup" className="btn-outline" style={{ display: 'block', textAlign: 'center', padding: '14px', borderRadius: 12, fontSize: 15, fontWeight: 800, textDecoration: 'none' }}>
              Start Free Trial
            </Link>
          </div>

          {/* Annual — highlighted */}
          <div style={{ flex: '1 1 300px', maxWidth: 360, padding: '36px 32px', background: 'linear-gradient(145deg, #1c1305, #1a1000)', border: '2px solid #f59e0b', borderRadius: 20, position: 'relative', boxShadow: '0 20px 60px rgba(245,158,11,0.2)' }}>
            {/* Badge */}
            <div style={{ position: 'absolute', top: -16, left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: '#0a0f1e', padding: '6px 20px', borderRadius: 100, fontSize: 12, fontWeight: 900, whiteSpace: 'nowrap' }}>
              🏆 Best Value — Save ₹2,989
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#f59e0b', marginBottom: 6, marginTop: 10 }}>Annual Plan</h3>
            <div style={{ fontSize: 14, color: '#6b7280', textDecoration: 'line-through', marginBottom: 2 }}>₹11,988</div>
            <div style={{ fontSize: 52, fontWeight: 900, color: '#f8fafc', margin: '4px 0' }}>₹9,999</div>
            <p style={{ color: '#f59e0b', fontSize: 13, fontWeight: 700, marginBottom: 28 }}>per year — 2 months FREE</p>
            <ul style={{ listStyle: 'none', marginBottom: 32, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {['Everything in Monthly', '2 Months FREE', 'Priority Support', 'Early Access to New Features', 'Advanced Analytics', 'Custom Restaurant Branding on Bills', 'Dedicated Account Manager'].map(f => (
                <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: '#d1d5db' }}>
                  <span style={{ color: '#f59e0b', fontWeight: 900 }}>✓</span>{f}
                </li>
              ))}
            </ul>
            <Link href="/signup" className="btn-amber" style={{ display: 'block', textAlign: 'center', padding: '14px', borderRadius: 12, fontSize: 15, fontWeight: 800, textDecoration: 'none' }}>
              Start Free Trial
            </Link>
          </div>
        </div>

        <p style={{ textAlign: 'center', color: '#4b5563', fontSize: 13, marginTop: 28 }}>
          All plans include 7-day free trial. Cancel anytime. Your data is always yours.
        </p>
      </section>

      {/* ── CTA BANNER ────────────────────────────────────── */}
      <section style={{ padding: '80px 5%', background: 'linear-gradient(135deg, #1a0e00, #0a0f1e)', textAlign: 'center', borderTop: '1px solid rgba(245,158,11,0.15)' }}>
        <h2 style={{ fontSize: 'clamp(26px, 4vw, 48px)', fontWeight: 900, marginBottom: 16, letterSpacing: '-1px' }}>
          Ready to grow your restaurant?
        </h2>
        <p style={{ color: '#6b7280', fontSize: 16, marginBottom: 32, maxWidth: 500, margin: '0 auto 32px' }}>
          Join hundreds of restaurants already using TableFlow. Start your 7-day free trial today.
        </p>
        <Link href="/signup" className="btn-amber" style={{ padding: '18px 48px', borderRadius: 14, fontSize: 18, fontWeight: 900, textDecoration: 'none', display: 'inline-block' }}>
          🚀 Start Free — No Credit Card
        </Link>
      </section>

      {/* ── FOOTER ────────────────────────────────────────── */}
      <footer style={{ background: '#070b16', borderTop: '1px solid rgba(255,255,255,0.05)', padding: '40px 5%', display: 'flex', flexWrap: 'wrap', gap: 24, justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 900, color: '#f8fafc', letterSpacing: '-0.5px' }}>
            Table<span style={{ color: '#f59e0b' }}>Flow</span>
          </div>
          <div style={{ fontSize: 11, color: '#4b5563', marginTop: 3, fontWeight: 500 }}>Developed by CodeWithBasharat</div>
          <p style={{ color: '#4b5563', fontSize: 12, marginTop: 6 }}>© {new Date().getFullYear()} TableFlow. All rights reserved.</p>
        </div>
        <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap' }}>
          {[['Features', '#features'], ['Pricing', '#pricing'], ['Sign In', '/login'], ['Start Free Trial', '/signup']].map(([label, href]) => (
            <a key={label} href={href} style={{ color: '#6b7280', fontSize: 13, fontWeight: 600, textDecoration: 'none', transition: 'color 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#f59e0b')}
              onMouseLeave={e => (e.currentTarget.style.color = '#6b7280')}
            >{label}</a>
          ))}
        </div>
      </footer>
    </div>
  );
}
