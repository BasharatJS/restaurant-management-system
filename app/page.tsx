'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';

const features = [
  { icon: '🍽️', title: 'Table Management', desc: 'Real-time table status. Available, occupied, reserved — manage your floor effortlessly.' },
  { icon: '📋', title: 'Smart Order System', desc: 'Take orders, send to kitchen instantly. Waiter, admin, kitchen — all in sync.' },
  { icon: '👨‍🍳', title: 'Kitchen Display', desc: 'Live kitchen display shows pending orders. Cook faster, serve better.' },
  { icon: '🧾', title: 'GST Billing', desc: 'Auto-calculate CGST/SGST per item. Print professional invoices in seconds.' },
  { icon: '📊', title: 'Reports & Analytics', desc: 'Daily revenue, popular items, expense tracking. Know your numbers always.' },
  { icon: '👥', title: 'Multi-Role Staff', desc: 'Separate dashboards for Admin, Waiter, Kitchen. Everyone sees exactly what they need.' },
];

const steps = [
  { num: '01', title: 'Sign Up Free', desc: 'Enter your restaurant name and create your account. Ready in under 2 minutes.' },
  { num: '02', title: '7-Day Free Trial', desc: 'Full access to all features. Add menu, staff, tables and start taking orders today.' },
  { num: '03', title: 'Subscribe & Grow', desc: 'Love it? Subscribe for ₹999/month or ₹9,999/year. Your data is always safe.' },
];

const faqs = [
  { q: 'Is my restaurant data safe?', a: 'Absolutely. Every restaurant gets completely isolated data. Staff from other restaurants cannot see your data at all.' },
  { q: 'Can I manage multiple staff roles?', a: 'Yes! Admin can add Waiters and Kitchen staff. Each role sees only what they need — waiters see tables & orders, kitchen sees order queue.' },
  { q: 'What payment methods does Razorpay support?', a: 'UPI, Credit/Debit Cards, Net Banking, Wallets — all major Indian payment methods are supported.' },
  { q: 'Can I cancel anytime?', a: 'Yes. Cancel anytime from your settings. Your data remains accessible until the subscription period ends.' },
  { q: 'Does it work on phones and tablets?', a: 'Yes! TableFlow is fully responsive. Use it on any device — desktop, tablet, or mobile.' },
  { q: 'How does GST billing work?', a: 'You set GST rate per menu item (5%, 12%, 18%). CGST and SGST are auto-calculated on every bill.' },
];

function AnimatedCounter({ value, suffix, label }: { value: number; suffix: string; label: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        const duration = 2000;
        const steps = 60;
        const increment = value / steps;
        let current = 0;
        const timer = setInterval(() => {
          current += increment;
          if (current >= value) { setCount(value); clearInterval(timer); }
          else setCount(Math.floor(current));
        }, duration / steps);
      }
    });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [value]);

  return (
    <div ref={ref} className="text-center">
      <div className="text-4xl font-black text-indigo-600">{count}{suffix}</div>
      <div className="text-sm text-gray-500 mt-1 font-medium">{label}</div>
    </div>
  );
}

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        @keyframes fadeUp { from { opacity:0; transform:translateY(30px); } to { opacity:1; transform:translateY(0); } }
        @keyframes float { 0%,100% { transform:translateY(0px); } 50% { transform:translateY(-10px); } }
        @keyframes gradientShift { 0%,100% { background-position:0% 50%; } 50% { background-position:100% 50%; } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
        .fade-up { animation: fadeUp 0.7s ease forwards; }
        .fade-up-2 { animation: fadeUp 0.7s ease 0.15s forwards; opacity:0; }
        .fade-up-3 { animation: fadeUp 0.7s ease 0.3s forwards; opacity:0; }
        .float { animation: float 3s ease-in-out infinite; }
        .gradient-text {
          background: linear-gradient(135deg, #6366f1, #8b5cf6, #06b6d4);
          background-size: 200% 200%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: gradientShift 4s ease infinite;
        }
        .hero-bg {
          background: linear-gradient(135deg, #eef2ff 0%, #f0f9ff 50%, #faf5ff 100%);
        }
        .card-hover { transition: all 0.3s ease; }
        .card-hover:hover { transform: translateY(-6px); box-shadow: 0 20px 40px rgba(99,102,241,0.15); }
        .btn-primary {
          background: linear-gradient(135deg, #6366f1, #4f46e5);
          transition: all 0.2s ease;
        }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 10px 25px rgba(99,102,241,0.4); }
        .pulse-dot { animation: pulse 2s ease-in-out infinite; }
      `}</style>

      {/* Navbar */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100' : 'bg-transparent'}`}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 10h18M3 6h18M3 14h12M3 18h8" />
              </svg>
            </div>
            <span className="text-xl font-black text-gray-900">Table<span className="text-indigo-600">Flow</span></span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
            <a href="#features" className="hover:text-indigo-600 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-indigo-600 transition-colors">How It Works</a>
            <a href="#pricing" className="hover:text-indigo-600 transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-indigo-600 transition-colors">FAQ</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-semibold text-gray-700 hover:text-indigo-600 transition-colors px-4 py-2">Sign In</Link>
            <Link href="/signup" className="btn-primary text-sm font-bold text-white px-5 py-2.5 rounded-xl shadow-md">Start Free Trial</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-24 px-6 hero-bg relative overflow-hidden">
        <div className="absolute top-20 right-0 w-72 h-72 bg-indigo-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-200/30 rounded-full blur-3xl" />
        <div className="max-w-5xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 text-sm font-semibold px-4 py-2 rounded-full mb-8 border border-indigo-100 fade-up">
            <span className="w-2 h-2 bg-green-500 rounded-full pulse-dot" />
            7-Day Free Trial — No Credit Card Required
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-gray-900 leading-tight mb-6 fade-up-2">
            Restaurant POS That<br />
            <span className="gradient-text">Just Works</span> 🍽️
          </h1>
          <p className="text-xl text-gray-500 max-w-3xl mx-auto mb-10 leading-relaxed fade-up-3">
            Complete restaurant management — orders, kitchen display, tables, billing, staff, inventory, reports. Built for Indian restaurants. Starts in minutes.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 fade-up-3">
            <Link href="/signup" className="btn-primary w-full sm:w-auto text-white font-bold text-lg px-10 py-5 rounded-2xl shadow-xl">
              🚀 Start Free Trial — 7 Days Free
            </Link>
            <Link href="/login" className="w-full sm:w-auto border-2 border-gray-200 text-gray-700 font-bold text-lg px-10 py-5 rounded-2xl hover:border-indigo-300 hover:text-indigo-600 transition-all">
              Already have an account? →
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-8 max-w-md mx-auto fade-up-3">
            <AnimatedCounter value={7} suffix=" Days" label="Free Trial" />
            <AnimatedCounter value={999} suffix="₹" label="Per Month" />
            <AnimatedCounter value={100} suffix="%" label="Data Isolated" />
          </div>
        </div>
      </section>

      {/* App Preview */}
      <section className="py-20 px-6 bg-gray-950">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-indigo-400 text-sm font-bold uppercase tracking-widest mb-4">Live Dashboard Preview</p>
          <h2 className="text-3xl font-black text-white mb-12">Everything you need, beautifully organized</h2>
          <div className="bg-gray-900 rounded-2xl border border-gray-800 shadow-2xl overflow-hidden text-left">
            <div className="bg-indigo-600 px-6 py-3 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-white/30" /><div className="w-3 h-3 rounded-full bg-white/30" /><div className="w-3 h-3 rounded-full bg-white/30" />
              <span className="ml-4 text-white/70 text-xs font-medium">TableFlow — Admin Dashboard</span>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                  { label: "Today's Revenue", value: '₹18,450', icon: '💰', color: 'bg-green-500/10 border-green-500/20 text-green-400' },
                  { label: "Today's Orders", value: '47', icon: '📋', color: 'bg-blue-500/10 border-blue-500/20 text-blue-400' },
                  { label: 'Active Tables', value: '8/12', icon: '🍽️', color: 'bg-orange-500/10 border-orange-500/20 text-orange-400' },
                  { label: 'Kitchen Queue', value: '5', icon: '👨‍🍳', color: 'bg-purple-500/10 border-purple-500/20 text-purple-400' },
                ].map((stat, i) => (
                  <div key={i} className={`border rounded-xl p-4 ${stat.color}`}>
                    <div className="text-2xl mb-1">{stat.icon}</div>
                    <div className="text-xl font-black">{stat.value}</div>
                    <div className="text-xs opacity-70">{stat.label}</div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                  <h4 className="text-white text-sm font-bold mb-3">Recent Orders</h4>
                  {[
                    { id: '#T05', item: 'Chicken Biryani ×2, Naan ×4', status: 'Preparing', color: 'text-yellow-400' },
                    { id: '#T03', item: 'Paneer Butter Masala ×1', status: 'Ready', color: 'text-green-400' },
                    { id: '#T07', item: 'Mutton Rogan Josh ×3', status: 'Served', color: 'text-blue-400' },
                  ].map((order, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-gray-700 last:border-0">
                      <div><span className="text-gray-400 text-xs">{order.id}</span><p className="text-white text-sm">{order.item}</p></div>
                      <span className={`text-xs font-bold ${order.color}`}>{order.status}</span>
                    </div>
                  ))}
                </div>
                <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                  <h4 className="text-white text-sm font-bold mb-3">Revenue This Week</h4>
                  <div className="flex items-end gap-2 h-24">
                    {[45, 72, 58, 90, 68, 85, 100].map((h, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <div className="w-full rounded-t-md bg-gradient-to-t from-indigo-600 to-indigo-400" style={{ height: `${h}%` }} />
                        <span className="text-gray-500 text-xs">{['M','T','W','T','F','S','S'][i]}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-indigo-600 text-sm font-bold uppercase tracking-widest mb-3">Features</p>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">Everything your restaurant needs</h2>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto">From first order of the day to your monthly profit report — we've got it covered.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <div key={i} className="card-hover group p-8 rounded-2xl border-2 border-gray-100 hover:border-indigo-200 bg-white">
                <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-3xl mb-6 group-hover:bg-indigo-100 transition-colors">{feature.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-500 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-24 px-6 bg-gradient-to-br from-indigo-50 to-purple-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-indigo-600 text-sm font-bold uppercase tracking-widest mb-3">How It Works</p>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">Start in 3 simple steps</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-10 left-1/3 right-1/3 h-0.5 bg-indigo-200" />
            {steps.map((step, i) => (
              <div key={i} className="text-center relative">
                <div className="w-20 h-20 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center text-3xl font-black text-white mx-auto mb-6 shadow-xl shadow-indigo-200">{step.num}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                <p className="text-gray-500 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-indigo-600 text-sm font-bold uppercase tracking-widest mb-3">Pricing</p>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">Simple, transparent pricing</h2>
            <p className="text-xl text-gray-500">Start free for 7 days. No credit card needed.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {/* Monthly */}
            <div className="card-hover relative rounded-3xl p-8 border-2 border-gray-200 bg-white shadow-lg text-gray-900">
              <div className="text-center mb-8">
                <h3 className="text-xl font-bold mb-4 text-gray-500">Monthly Plan</h3>
                <div className="flex items-end justify-center gap-1">
                  <span className="text-2xl font-bold text-gray-500">₹</span>
                  <span className="text-6xl font-black">999</span>
                </div>
                <p className="mt-2 text-sm text-gray-500">per month, billed monthly</p>
              </div>
              <ul className="space-y-3 mb-8">
                {['Unlimited Orders', 'Full Dashboard Access', 'Admin + Waiter + Kitchen Roles', 'GST Billing & Invoices', 'Inventory Management', 'Sales Reports & Charts', 'WhatsApp Support'].map((f, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">✓</span>
                    <span className="text-sm text-gray-600">{f}</span>
                  </li>
                ))}
              </ul>
              <Link href="/signup" className="block w-full text-center py-4 rounded-2xl font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-all shadow-md">Start Free Trial</Link>
            </div>
            {/* Annual */}
            <div className="card-hover relative rounded-3xl p-8 border-2 border-indigo-400 bg-gradient-to-b from-indigo-600 to-purple-700 shadow-2xl shadow-indigo-200 text-white">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span className="bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg">🔥 Best Value — Save ₹2,989</span>
              </div>
              <div className="text-center mb-8">
                <h3 className="text-xl font-bold mb-4 text-indigo-100">Annual Plan</h3>
                <p className="text-lg line-through mb-1 text-indigo-200">₹11,988</p>
                <div className="flex items-end justify-center gap-1">
                  <span className="text-2xl font-bold text-indigo-100">₹</span>
                  <span className="text-6xl font-black">9,999</span>
                </div>
                <p className="mt-2 text-sm text-indigo-100">per year — 2 months FREE</p>
              </div>
              <ul className="space-y-3 mb-8">
                {['Everything in Monthly', '2 Months FREE', 'Priority Support', 'Early Access to New Features', 'Advanced Analytics', 'Custom Restaurant Branding on Bills', 'Dedicated Account Manager'].map((f, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-white/20 text-white flex items-center justify-center text-xs font-bold">✓</span>
                    <span className="text-sm text-indigo-50">{f}</span>
                  </li>
                ))}
              </ul>
              <Link href="/signup" className="block w-full text-center py-4 rounded-2xl font-bold bg-white text-indigo-700 hover:bg-indigo-50 transition-all shadow-lg">Start Free Trial</Link>
            </div>
          </div>
          <p className="text-center text-gray-400 text-sm mt-8">All plans include 7-day free trial. Cancel anytime. Your data is always yours.</p>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 px-6 bg-gray-50">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-indigo-600 text-sm font-bold uppercase tracking-widest mb-3">FAQ</p>
            <h2 className="text-4xl font-black text-gray-900 mb-4">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full px-6 py-5 text-left flex items-center justify-between">
                  <span className="font-bold text-gray-900">{faq.q}</span>
                  <span className={`text-indigo-600 text-xl font-bold transition-transform duration-200 ${openFaq === i ? 'rotate-45' : ''}`}>+</span>
                </button>
                {openFaq === i && <div className="px-6 pb-5 text-gray-500 leading-relaxed border-t border-gray-100 pt-4">{faq.a}</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-6 bg-gradient-to-br from-indigo-600 to-purple-700 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.1),transparent)]" />
        <div className="max-w-3xl mx-auto text-center relative">
          <div className="text-6xl mb-6 float">🍽️</div>
          <h2 className="text-4xl md:text-5xl font-black text-white mb-6">Ready to modernize your restaurant?</h2>
          <p className="text-xl text-indigo-100 mb-10">Join restaurant owners who are saving time and growing profits with TableFlow.</p>
          <Link href="/signup" className="inline-block bg-white text-indigo-700 font-black text-xl px-12 py-6 rounded-2xl shadow-2xl hover:scale-105 transition-all duration-200">
            🚀 Start Your Free 7-Day Trial
          </Link>
          <p className="text-indigo-200 text-sm mt-6">No credit card required • Cancel anytime • Setup in 2 minutes</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-950 text-gray-400 py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 10h18M3 6h18M3 14h12M3 18h8" /></svg>
              </div>
              <span className="text-white font-black text-xl">Table<span className="text-indigo-400">Flow</span></span>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <Link href="/login" className="hover:text-indigo-400 transition-colors">Sign In</Link>
              <Link href="/signup" className="hover:text-indigo-400 transition-colors">Sign Up</Link>
              <a href="#pricing" className="hover:text-indigo-400 transition-colors">Pricing</a>
              <a href="#faq" className="hover:text-indigo-400 transition-colors">FAQ</a>
            </div>
            <div className="text-sm">Built with ❤️ by <a href="https://www.codewithbasharat.com" target="_blank" rel="noreferrer" className="text-indigo-400 hover:text-indigo-300 font-semibold">CodeWithBasharat</a></div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-xs text-gray-600">© {new Date().getFullYear()} TableFlow. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}
