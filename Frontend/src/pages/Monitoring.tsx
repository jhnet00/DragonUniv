import { Activity, Database, GitBranch, Server } from "lucide-react";
import { MetricCard } from "../components/MetricCard";

export function Monitoring() {
  return (
    <section className="page-stack">
      <div className="page-head compact"><div><p className="eyebrow">Infrastructure Status</p><h1>시스템 상태 / 모니터링</h1></div></div>
      <div className="admin-metrics">
        <MetricCard label="API Gateway" value="42ms" />
        <MetricCard label="MariaDB" value="18 conn" />
        <MetricCard label="Backup cron" value="03:00 KST" state="Scheduled" />
        <MetricCard label="Error rate" value="0.04%" />
      </div>
      <div className="diagram">
        <div><Server /> Client</div><span />
        <div><Activity /> Nginx LB</div><span />
        <div><GitBranch /> k3s Pods</div><span />
        <div><Database /> MariaDB</div>
      </div>
    </section>
  );
}

