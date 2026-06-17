import { Link } from "react-router-dom";
import { Activity, ArrowRight, Gauge, Server } from "lucide-react";
import { MetricCard } from "../components/MetricCard";

const metrics = [
  ["Overall risk", "LOW", "0 high"],
  ["k3s runtime", "UP", "192.168.232.133"],
  ["Monitoring VM", "READY", "192.168.232.135"],
  ["Node exporter", ":9100", "Live"],
  ["Prometheus", ":9090", "Query ready"],
  ["Grafana", ":3000", "Dashboard ready"],
  ["CI/CD", "Jenkins", "Rollout configured"],
  ["Ingress", "Traefik", "sugang.drg"],
];

const operations = [
  { label: "Runtime node", value: "dragon-k3s", detail: "Frontend / Backend / MariaDB / Traefik" },
  { label: "Metrics source", value: "node-exporter", detail: "Admin UI reads live exporter metrics" },
  { label: "Observability", value: "Prometheus + Grafana", detail: "External tools remain available for deep dive" },
];

export function AdminDashboard() {
  return (
    <section className="page-stack">
      <div className="page-head compact">
        <div><p className="eyebrow">Infrastructure Control Plane</p><h1>관리자 대시보드</h1></div>
        <div className="monitoring-actions">
          <Link to="/admin/monitoring" className="primary-btn"><Activity size={17} /> 모니터링 상세</Link>
          <Link to="/admin/courses" className="ghost-btn">강의 관리</Link>
        </div>
      </div>
      <div className="admin-metrics">
        {metrics.map(([label, value, state]) => <MetricCard key={label} label={label} value={value} state={state} />)}
      </div>
      <div className="admin-overview">
        <article className="overview-main">
          <div>
            <p className="eyebrow">Live Operations</p>
            <h2>운영 상태 요약</h2>
            <p>주요 인프라 상태는 정상 범위이며, 상세 수치와 위험도는 시스템 모니터링 화면에서 확인한다.</p>
          </div>
          <Link to="/admin/monitoring" className="overview-link">
            실시간 지표 보기 <ArrowRight size={18} />
          </Link>
        </article>
        <div className="overview-list">
          {operations.map((item) => (
            <article key={item.label}>
              <Gauge size={18} />
              <span>{item.label}</span>
              <strong>{item.value}</strong>
              <p>{item.detail}</p>
            </article>
          ))}
        </div>
      </div>
      <div className="two-col">
        <article className="glass-panel"><h2><Server size={20} /> VM Topology</h2><p>dragon-k3s · 192.168.232.133 · runtime</p><p>dragon-monitoring · 192.168.232.135 · Prometheus/Grafana</p><p>CI/CD VM · Jenkins deployment runner</p></article>
        <article className="glass-panel timeline"><h2>Deployment Flow</h2><p>GitHub Actions → Docker Hub image → Jenkins rollout → k3s Deployment → Traefik Ingress</p></article>
      </div>
    </section>
  );
}
