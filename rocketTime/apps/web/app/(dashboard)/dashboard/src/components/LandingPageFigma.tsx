import { useState, useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { useNavigate } from "react-router";
import { useUser } from "../context/UserContext";

const gradientText = {
  background: "linear-gradient(90deg, #f97316, #a855f7)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  backgroundClip: "text",
};

const ctaBtnStyle: CSSProperties = {
  background: "linear-gradient(90deg, #f97316, #ef4444)",
  color: "#fff",
  border: "none",
  borderRadius: "9999px",
  padding: "14px 32px",
  fontWeight: 700,
  fontSize: "1rem",
  cursor: "pointer",
  fontFamily: "inherit",
};

const outlineBtnStyle: CSSProperties = {
  background: "transparent",
  color: "#111",
  border: "1.5px solid #d1d5db",
  borderRadius: "9999px",
  padding: "14px 32px",
  fontWeight: 600,
  fontSize: "1rem",
  cursor: "pointer",
  fontFamily: "inherit",
};

const featureIcons: Record<string, { bg: string; emoji: string }> = {
  "Coin-Based Rewards": { bg: "linear-gradient(135deg,#f97316,#fbbf24)", emoji: "🔗" },
  "Goal Tracking": { bg: "linear-gradient(135deg,#a855f7,#ec4899)", emoji: "🎯" },
  "Advanced Analytics": { bg: "linear-gradient(135deg,#f97316,#ef4444)", emoji: "📈" },
  "AI Coach": { bg: "linear-gradient(135deg,#6366f1,#a855f7)", emoji: "💡" },
  "Time Logging": { bg: "linear-gradient(135deg,#10b981,#06b6d4)", emoji: "⏰" },
  "Streaks & Habits": { bg: "linear-gradient(135deg,#ec4899,#f43f5e)", emoji: "🏆" },
};

const features = [
  {
    title: "Coin-Based Rewards",
    desc: "Earn coins for productive activities, track your time value, and see your efforts rewarded with a gamified currency system.",
  },
  {
    title: "Goal Tracking",
    desc: "Set meaningful goals, link your time entries directly to them, and watch your progress grow as you invest hours wisely.",
  },
  {
    title: "Advanced Analytics",
    desc: "Visualize your time investment with beautiful charts, track weekly trends, and understand where your hours really go.",
  },
  {
    title: "AI Coach",
    desc: "Get personalized recommendations about time being wasted and discover better ways to fulfill your goals with AI-powered insights.",
  },
  {
    title: "Time Logging",
    desc: "Easily log activities with customizable categories. Every hour tracked contributes to your coin balance and goal progress.",
  },
  {
    title: "Streaks & Habits",
    desc: "Build consistency with daily streaks, maintain momentum with visual tracking, and celebrate your productive habits.",
  },
];

const steps = [
  {
    num: 1,
    title: "Set Your Goals",
    desc: "Define what you want to achieve and set target hours for each goal.",
    color: "linear-gradient(135deg,#a855f7,#ec4899)",
  },
  {
    num: 2,
    title: "Log Your Time",
    desc: "Track activities as you complete them, link them to goals, and earn coins.",
    color: "linear-gradient(135deg,#f97316,#ef4444)",
  },
  {
    num: 3,
    title: "Track & Optimize",
    desc: "Review analytics, get AI recommendations, and optimize your time investment.",
    color: "linear-gradient(135deg,#f97316,#fbbf24)",
  },
];

const stats = [
  { value: "+50", label: "Coins/Hour", sub: "Productive Time", color: "#a855f7" },
  { value: "+20", label: "Coins/Hour", sub: "Entertainment", color: "#a855f7" },
  { value: "-30", label: "Coins/Hour", sub: "Wasted Time", color: "#6b7280" },
];

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true); },
      { threshold }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

function FadeIn({ children, delay = 0, style = {} }: { children: ReactNode; delay?: number; style?: CSSProperties }) {
  const { ref, inView } = useInView();
  return (
    <div
      ref={ref}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? "translateY(0)" : "translateY(28px)",
        transition: `opacity 0.65s ease ${delay}s, transform 0.65s ease ${delay}s`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useUser();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      style={{
        fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
        minHeight: "100vh",
        background: "linear-gradient(160deg, #f3f0ff 0%, #fff7ed 40%, #fefce8 100%)",
        color: "#111",
        overflowX: "hidden",
      }}
    >
      {/* Google Font */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'DM Sans', sans-serif; }
        button:hover { opacity: 0.88; transition: opacity 0.2s; }
      `}</style>

      {/* NAV */}
      <nav
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          background: scrolled ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.7)",
          backdropFilter: "blur(12px)",
          borderBottom: scrolled ? "1px solid #e5e7eb" : "1px solid transparent",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 40px",
          height: 60,
          transition: "all 0.3s",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, fontWeight: 700, fontSize: "1.1rem" }}>
          <img src="/logo.png" alt="CoinTime logo" style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover" }} />
          CoinTime
        </div>
        <div style={{ display: "flex", gap: 24, alignItems: "center", fontSize: "0.9rem", color: "#6b7280" }}>
          <span style={{ cursor: "pointer" }}>Features</span>
          <span style={{ cursor: "pointer" }}>How It Works</span>
          <span style={{ cursor: "pointer" }}>Pricing</span>
        </div>
        <button
          onClick={() => navigate("/auth")}
          style={{
            background: "#111",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            padding: "9px 22px",
            fontWeight: 700,
            fontSize: "0.9rem",
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          Get Started
        </button>
      </nav>

      {/* HERO */}
      <section
        style={{
          maxWidth: 820,
          margin: "0 auto",
          padding: "90px 24px 60px",
          textAlign: "center",
        }}
      >
        <FadeIn>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "linear-gradient(90deg,#a855f7,#f97316)",
              color: "#fff",
              borderRadius: "9999px",
              padding: "6px 18px",
              fontSize: "0.85rem",
              fontWeight: 600,
              marginBottom: 28,
            }}
          >
            Treat Time as Money
          </div>
        </FadeIn>
        <FadeIn delay={0.1}>
          <h1
            style={{
              fontSize: "clamp(2.4rem, 6vw, 4rem)",
              fontWeight: 800,
              lineHeight: 1.13,
              letterSpacing: "-0.02em",
              marginBottom: 22,
            }}
          >
            Turn Your Time Into{" "}
            <span style={gradientText}>Valuable Coins</span>
          </h1>
        </FadeIn>
        <FadeIn delay={0.2}>
          <p
            style={{
              color: "#6b7280",
              fontSize: "1.05rem",
              maxWidth: 580,
              margin: "0 auto 36px",
              lineHeight: 1.7,
            }}
          >
            A gamified goal-setting and time management dashboard that rewards productive
            activities, tracks your progress, and helps you achieve your dreams with an
            AI-powered coach.
          </p>
        </FadeIn>
        <FadeIn delay={0.3}>
          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <button style={ctaBtnStyle} onClick={() => navigate("/auth")}>Start Earning Coins</button>
            <button style={outlineBtnStyle} onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}>Learn More</button>
          </div>
        </FadeIn>

        {/* Stats */}
        <FadeIn delay={0.4}>
          <div
            style={{
              display: "flex",
              gap: 16,
              justifyContent: "center",
              marginTop: 56,
              flexWrap: "wrap",
            }}
          >
            {stats.map((s, i) => (
              <div
                key={i}
                style={{
                  background: "#fff",
                  borderRadius: 16,
                  padding: "24px 36px",
                  minWidth: 160,
                  textAlign: "center",
                  boxShadow: "0 2px 16px rgba(0,0,0,0.06)",
                  border: "1px solid #f3f4f6",
                }}
              >
                <div style={{ fontSize: "2rem", fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: "0.8rem", color: "#6b7280", marginTop: 4 }}>{s.label}</div>
                <div style={{ fontSize: "0.78rem", color: "#9ca3af" }}>{s.sub}</div>
              </div>
            ))}
          </div>
        </FadeIn>
      </section>

      {/* FEATURES */}
      <section style={{ maxWidth: 1100, margin: "0 auto", padding: "80px 24px" }}>
        <FadeIn>
          <h2 style={{ textAlign: "center", fontSize: "2rem", fontWeight: 800, marginBottom: 8 }}>
            Powerful Features to Maximize Your Time
          </h2>
          <p style={{ textAlign: "center", color: "#6b7280", marginBottom: 48 }}>
            Everything you need to track, analyze, and optimize how you spend your most valuable resource.
          </p>
        </FadeIn>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: 20,
          }}
        >
          {features.map((f, i) => (
            <FadeIn key={f.title} delay={i * 0.08}>
              <div
                style={{
                  background: "#fff",
                  borderRadius: 18,
                  padding: "28px 28px 24px",
                  boxShadow: "0 2px 16px rgba(0,0,0,0.05)",
                  border: "1px solid #f3f4f6",
                  height: "100%",
                  transition: "box-shadow 0.2s, transform 0.2s",
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 32px rgba(0,0,0,0.10)";
                  (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)";
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLDivElement).style.boxShadow = "0 2px 16px rgba(0,0,0,0.05)";
                  (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
                }}
              >
                <div
                  style={{
                    borderRadius: 14,
                    background: featureIcons[f.title].bg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "10px 16px",
                    marginBottom: 16,
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: "0.95rem",
                  }}
                >
                  {f.title}
                </div>
                <div style={{ color: "#6b7280", fontSize: "0.9rem", lineHeight: 1.65 }}>{f.desc}</div>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ maxWidth: 900, margin: "0 auto", padding: "40px 24px 80px", textAlign: "center" }}>
        <FadeIn>
          <h2 style={{ fontSize: "2rem", fontWeight: 800, marginBottom: 8 }}>How It Works</h2>
          <p style={{ color: "#6b7280", marginBottom: 56 }}>Get started in three simple steps</p>
        </FadeIn>
        <div
          style={{
            display: "flex",
            gap: 32,
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          {steps.map((s, i) => (
            <FadeIn key={s.num} delay={i * 0.12} style={{ flex: "1 1 220px", maxWidth: 260 }}>
              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: "50%",
                    background: s.color,
                    color: "#fff",
                    fontSize: "1.4rem",
                    fontWeight: 800,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 20px",
                  }}
                >
                  {s.num}
                </div>
                <div style={{ fontWeight: 700, fontSize: "1.05rem", marginBottom: 10 }}>{s.title}</div>
                <div style={{ color: "#6b7280", fontSize: "0.9rem", lineHeight: 1.65 }}>{s.desc}</div>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* CTA BANNER */}
      <section style={{ maxWidth: 900, margin: "0 auto 80px", padding: "0 24px" }}>
        <FadeIn>
          <div
            style={{
              background: "linear-gradient(135deg,#a855f7 0%,#f97316 60%,#ef4444 100%)",
              borderRadius: 24,
              padding: "60px 40px",
              textAlign: "center",
              color: "#fff",
            }}
          >
            <h2 style={{ fontSize: "2rem", fontWeight: 800, marginBottom: 16 }}>
              Ready to Value Your Time?
            </h2>
            <p style={{ maxWidth: 560, margin: "0 auto 32px", opacity: 0.92, lineHeight: 1.7, fontSize: "1rem" }}>
              Join CoinTime today and start turning your hours into achievements. Track your progress,
              earn rewards, and achieve your goals with our gamified time management system.
            </p>
            <button
              onClick={() => navigate("/auth")}
              style={{
                background: "rgba(255,255,255,0.95)",
                color: "#a855f7",
                border: "none",
                borderRadius: "9999px",
                padding: "14px 36px",
                fontWeight: 700,
                fontSize: "1rem",
                cursor: "pointer",
                fontFamily: "inherit",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              🔗 Start Your Journey
            </button>
          </div>
        </FadeIn>
      </section>

      {/* FOOTER */}
      <footer
        style={{
          borderTop: "1px solid #e5e7eb",
          padding: "18px 40px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: "0.83rem",
          color: "#6b7280",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 600, color: "#111" }}>
          <img src="/logo.png" alt="CoinTime logo" style={{ width: 26, height: 26, borderRadius: "50%", objectFit: "cover" }} />
          CoinTime Dashboard
        </div>
        <span>© 2026 CoinTime. Treat your time like money.</span>
        <div
          style={{
            width: 32, height: 32, borderRadius: "50%", background: "#111",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontSize: "0.9rem", cursor: "pointer",
          }}
        >
          ?
        </div>
      </footer>
    </div>
  );
}
