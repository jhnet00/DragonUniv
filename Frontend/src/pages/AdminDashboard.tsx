import { Link } from "react-router-dom";
import { MetricCard } from "../components/MetricCard";

const metrics = [
  ["Total users", "4,812", "Synced"],
  ["Active sessions", "1,284", "High traffic"],
  ["Requests / min", "18,420", "Balanced"],
  ["API status", "200 OK", "Healthy"],
  ["DB status", "MariaDB", "Connected"],
  ["k3s cluster", "3 nodes", "Ready"],
  ["Nginx Ingress", "Active", "Healthy"],
  ["Jenkins deploy", "#128 passed", "Latest"],
  ["Docker image", "web:2025.08", "Stable"],
];

export function AdminDashboard() {
  return (
    <section className="page-stack">
      <div className="page-head compact">
        <div><p className="eyebrow">Infrastructure Control Plane</p><h1>관리자 대시보드</h1></div>
        <Link to="/admin/courses" className="primary-btn">강의 관리</Link>
      </div>
      <div className="admin-metrics">
        {metrics.map(([label, value, state]) => <MetricCard key={label} label={label} value={value} state={state} />)}
      </div>
      <div className="two-col">
        <article className="glass-panel"><h2>Recent admin logs</h2><p>15:21 course seats updated · admin</p><p>15:08 student session revoked · staff</p><p>14:55 backup policy checked · cron</p></article>
        <article className="glass-panel timeline"><h2>Recent deployment timeline</h2><p>Git push → Jenkins build → Docker image → k3s rollout → Ingress health check</p></article>
      </div>
    </section>
  );
}

