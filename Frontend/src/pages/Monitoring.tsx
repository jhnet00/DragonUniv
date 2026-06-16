import { Activity, BarChart3, Database, ExternalLink, GitBranch, MonitorCog, Network, Server } from "lucide-react";
import { MetricCard } from "../components/MetricCard";

const monitoringLinks = [
  { label: "Grafana", href: "http://192.168.232.135:3000", meta: "dashboard 1860" },
  { label: "Prometheus", href: "http://192.168.232.135:9090", meta: "targets / query" },
  { label: "Targets", href: "http://192.168.232.135:9090/targets", meta: "scrape status" },
];

const nodes = [
  { name: "dragon-k3s", role: "k3s runtime", ip: "192.168.232.133", endpoint: ":9100", state: "UP" },
  { name: "dragon-monitoring", role: "Prometheus / Grafana", ip: "192.168.232.135", endpoint: ":9090 / :3000 / :9100", state: "UP" },
];

const grafanaPanels = [
  {
    title: "k3s CPU Basic",
    src: "http://192.168.232.135:3000/d-solo/rYdddlPWk/node-exporter-full?orgId=1&from=now-1h&to=now&timezone=browser&var-ds_prometheus=efpa9ay6wsef4a&var-job=node-exporter&var-nodename=dragon-monitoring&var-node=192.168.232.133:9100&refresh=1m&panelId=panel-77",
  },
];

export function Monitoring() {
  return (
    <section className="page-stack">
      <div className="page-head compact">
        <div>
          <p className="eyebrow">Infrastructure Status</p>
          <h1>시스템 상태 / 모니터링</h1>
        </div>
        <div className="monitoring-actions">
          {monitoringLinks.map((link) => (
            <a key={link.href} className="ghost-btn" href={link.href} target="_blank" rel="noreferrer">
              <ExternalLink size={16} />
              {link.label}
            </a>
          ))}
        </div>
      </div>
      <div className="admin-metrics">
        <MetricCard label="Prometheus" value=":9090" state="UP" />
        <MetricCard label="Grafana" value=":3000" state="UP" />
        <MetricCard label="k3s exporter" value=":9100" state="UP" />
        <MetricCard label="Dashboard" value="1860" state="node-exporter" />
      </div>

      <div className="monitoring-grid">
        {nodes.map((node) => (
          <article className="monitor-node-card" key={node.name}>
            <div>
              <span className="label-chip good">{node.state}</span>
              <h2>{node.name}</h2>
              <p>{node.role}</p>
            </div>
            <dl>
              <div><dt>IP</dt><dd>{node.ip}</dd></div>
              <div><dt>Endpoint</dt><dd>{node.endpoint}</dd></div>
            </dl>
          </article>
        ))}
      </div>

      <div className="monitoring-layout">
        <article className="glass-panel">
          <h2><BarChart3 size={20} /> Grafana Dashboard</h2>
          <p>Node Exporter Full dashboard 기준으로 k3s VM의 CPU, Memory, Disk, Network 지표를 확인한다.</p>
          <div className="monitoring-facts">
            <span><strong>Job</strong>node-exporter</span>
            <span><strong>Instance</strong>192.168.232.133:9100</span>
            <span><strong>Datasource</strong>Prometheus</span>
          </div>
        </article>

        <article className="glass-panel">
          <h2><MonitorCog size={20} /> Prometheus Query</h2>
          <p>k3s VM scrape 상태는 PromQL `up` 값으로 확인한다.</p>
          <code className="query-chip">up&#123;instance="192.168.232.133:9100"&#125;</code>
          <div className="monitoring-facts">
            <span><strong>Expected</strong>value = 1</span>
            <span><strong>Target</strong>dragon-k3s</span>
          </div>
        </article>
      </div>

      <div className="grafana-panel-grid">
        {grafanaPanels.map((panel) => (
          <article className="grafana-panel-card" key={panel.title}>
            <div className="grafana-panel-head">
              <h2>{panel.title}</h2>
              <a href={panel.src} target="_blank" rel="noreferrer" aria-label={`${panel.title} Grafana panel`}>
                <ExternalLink size={16} />
              </a>
            </div>
            <iframe title={panel.title} src={panel.src} loading="lazy" />
          </article>
        ))}
      </div>

      <div className="diagram monitoring-flow">
        <div><Server /> dragon-k3s</div><span />
        <div><Activity /> node-exporter</div><span />
        <div><Database /> Prometheus</div><span />
        <div><BarChart3 /> Grafana</div>
      </div>

      <div className="diagram monitoring-flow secondary">
        <div><Network /> sugang.drg</div><span />
        <div><GitBranch /> Traefik</div><span />
        <div><Server /> Backend Pods</div><span />
        <div><Activity /> Load Test</div>
      </div>
    </section>
  );
}
