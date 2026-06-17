import { useEffect, useState } from "react";
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

type PrometheusResult = {
  status: string;
  data?: {
    result?: Array<{ value?: [number, string] }>;
  };
};

type LiveMetric = {
  key: string;
  label: string;
  query: string;
  unit: string;
  max: number;
  value: number | null;
};

const metricQueries: Omit<LiveMetric, "value">[] = [
  {
    key: "cpu",
    label: "CPU Usage",
    unit: "%",
    max: 100,
    query: '100 - (avg(rate(node_cpu_seconds_total{instance="192.168.232.133:9100",mode="idle"}[5m])) * 100)',
  },
  {
    key: "memory",
    label: "Memory Usage",
    unit: "%",
    max: 100,
    query: '(1 - node_memory_MemAvailable_bytes{instance="192.168.232.133:9100"} / node_memory_MemTotal_bytes{instance="192.168.232.133:9100"}) * 100',
  },
  {
    key: "disk",
    label: "Root Disk Used",
    unit: "%",
    max: 100,
    query: '100 - (100 * node_filesystem_avail_bytes{instance="192.168.232.133:9100",mountpoint="/",fstype!~"tmpfs|overlay"} / node_filesystem_size_bytes{instance="192.168.232.133:9100",mountpoint="/",fstype!~"tmpfs|overlay"})',
  },
  {
    key: "load",
    label: "Load Average",
    unit: "",
    max: 2,
    query: 'node_load1{instance="192.168.232.133:9100"}',
  },
  {
    key: "rx",
    label: "Network RX",
    unit: "KB/s",
    max: 1024,
    query: 'sum(rate(node_network_receive_bytes_total{instance="192.168.232.133:9100",device!~"lo|veth.*|docker.*|flannel.*|cni.*"}[5m])) / 1024',
  },
  {
    key: "tx",
    label: "Network TX",
    unit: "KB/s",
    max: 1024,
    query: 'sum(rate(node_network_transmit_bytes_total{instance="192.168.232.133:9100",device!~"lo|veth.*|docker.*|flannel.*|cni.*"}[5m])) / 1024',
  },
];

async function fetchPrometheusValue(query: string) {
  const response = await fetch(`/prometheus/api/v1/query?query=${encodeURIComponent(query)}`);
  if (!response.ok) throw new Error(`Prometheus query failed: ${response.status}`);
  const payload = (await response.json()) as PrometheusResult;
  const rawValue = payload.data?.result?.[0]?.value?.[1];
  return rawValue ? Number(rawValue) : null;
}

function formatMetricValue(value: number | null, unit: string) {
  if (value === null || Number.isNaN(value)) return "No data";
  const digits = unit === "%" || unit === "KB/s" ? 1 : 2;
  return `${value.toFixed(digits)}${unit ? ` ${unit}` : ""}`;
}

export function Monitoring() {
  const [liveMetrics, setLiveMetrics] = useState<LiveMetric[]>(
    metricQueries.map((metric) => ({ ...metric, value: null })),
  );
  const [lastUpdated, setLastUpdated] = useState("Loading");
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadMetrics() {
      try {
        const values = await Promise.all(metricQueries.map((metric) => fetchPrometheusValue(metric.query)));
        if (!mounted) return;
        setLiveMetrics(metricQueries.map((metric, index) => ({ ...metric, value: values[index] })));
        setLastUpdated(new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
        setLoadError("");
      } catch (error) {
        if (!mounted) return;
        setLoadError(error instanceof Error ? error.message : "Prometheus query failed");
      }
    }

    void loadMetrics();
    const timer = window.setInterval(() => void loadMetrics(), 15000);

    return () => {
      mounted = false;
      window.clearInterval(timer);
    };
  }, []);

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
          <h2><BarChart3 size={20} /> Live Metrics</h2>
          <p>Prometheus API를 통해 dragon-k3s node-exporter 값을 직접 표시한다.</p>
          <div className="monitoring-facts">
            <span><strong>Job</strong>node-exporter</span>
            <span><strong>Instance</strong>192.168.232.133:9100</span>
            <span><strong>Updated</strong>{lastUpdated}</span>
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

      {loadError && <p className="monitoring-error">{loadError}</p>}

      <div className="live-metrics-grid">
        {liveMetrics.map((metric) => {
          const percentage = metric.value === null ? 0 : Math.max(0, Math.min(100, (metric.value / metric.max) * 100));
          return (
            <article className="live-metric-card" key={metric.key}>
              <div className="live-metric-head">
                <span>{metric.label}</span>
                <strong>{formatMetricValue(metric.value, metric.unit)}</strong>
              </div>
              <div className="metric-bar" aria-label={`${metric.label} meter`}>
                <span style={{ width: `${percentage}%` }} />
              </div>
              <code>{metric.query}</code>
            </article>
          );
        })}
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
