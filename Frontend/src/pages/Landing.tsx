import { motion } from "framer-motion";
import { Activity, ArrowRight, Gauge, Server } from "lucide-react";
import { Link } from "react-router-dom";
import { assets, brand } from "../assets";
import { Logo } from "../components/Logo";

const slides = [
  { title: "Load Balanced", text: "Nginx Ingress · active-active routing", icon: Server },
  { title: "Kubernetes Ready", text: "k3s cluster deployment with health checks", icon: Gauge },
  { title: "Observable", text: "Grafana metrics · API latency · DB status", icon: Activity },
];

export function Landing() {
  return (
    <main className="landing">
      <header className="landing-nav">
        <Logo />
        <span>{brand.host}</span>
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

