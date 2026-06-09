import { motion } from "framer-motion";
import { ArrowRight, CalendarClock, Megaphone, ServerCog } from "lucide-react";
import { Link } from "react-router-dom";
import { assets, brand } from "../assets";
import { Logo } from "../components/Logo";

const slides = [
  { title: "1차 수강신청", text: "2025.08.18 09:00부터 전공과목 신청이 시작됩니다.", icon: CalendarClock },
  { title: "장바구니 확인", text: "관심과목 목록은 수강신청 전날 17:00까지 수정 가능합니다.", icon: Megaphone },
  { title: "시스템 점검", text: "08.17 22:00부터 23:30까지 수강신청 시스템 점검이 예정되어 있습니다.", icon: ServerCog },
  { title: "정정기간 안내", text: "수강정정은 09.02 10:00부터 09.04 16:00까지 진행됩니다.", icon: CalendarClock },
];

export function Landing() {
  return (
    <main className="landing">
      <header className="landing-nav">
        <Logo />
      </header>
      <section className="hero" style={{ backgroundImage: `url(${assets.hero})` }}>
        <div className="hero-overlay" />
        <motion.div className="hero-content" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
          <p className="eyebrow">Production-like University Infrastructure</p>
          <h1>
            역사와 전통이 살아 숨쉬는 곳,
            <span>{brand.ko}</span>
          </h1>
          <h2>{brand.platform}</h2>
          <p className="hero-copy">
            A production-like course registration platform built with load-balanced infrastructure,
            Kubernetes deployment, CI/CD, DNS routing, and monitoring.
          </p>
          <div className="hero-actions">
            <Link to="/login" className="primary-btn">2025 2학기 수강신청 <ArrowRight size={18} /></Link>
            <Link to="/register" className="ghost-btn">홈페이지 바로가기</Link>
          </div>
        </motion.div>
      </section>
      <section className="carousel-band" aria-label="Infrastructure highlights">
        <div className="carousel-track">
          {[...slides, ...slides].map(({ title, text, icon: Icon }, index) => (
            <article className="slide-card" key={`${title}-${index}`}>
              <Icon size={20} />
              <strong>{title}</strong>
              <span>{text}</span>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
