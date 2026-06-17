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

type LiveMetric = {
  key: string;
  label: string;
  unit: string;
  max: number;
  value: number | null;
};

const initialMetrics: LiveMetric[] = [
  { key: "load", label: "Load Average", unit: "", max: 2, value: null },
  { key: "memory", label: "Memory Usage", unit: "%", max: 100, value: null },
  { key: "disk", label: "Root Disk Used", unit: "%", max: 100, value: null },
  { key: "rx", label: "Network RX Total", unit: "MB", max: 1024, value: null },
  { key: "tx", label: "Network TX Total", unit: "MB", max: 1024, value: null },
];

function readMetric(metrics: string, name: string, labelIncludes?: string[]) {
  const line = metrics
    .split("\n")
    .find((entry) => entry.startsWith(name) && labelIncludes?.every((label) => entry.includes(label)) !== false);
  const rawValue = line?.trim().split(/\s+/).at(-1);
  return rawValue ? Number(rawValue) : null;
}

function sumMetric(metrics: string, name: string, excludePattern: RegExp) {
  return metrics
    .split("\n")
    .filter((entry) => entry.startsWith(name) && !excludePattern.test(entry))
    .reduce((sum, entry) => {
      const rawValue = entry.trim().split(/\s+/).at(-1);
      return sum + (rawValue ? Number(rawValue) : 0);
    }, 0);
}

async function fetchNodeExporterMetrics(): Promise<LiveMetric[]> {
  const response = await fetch("/node-exporter/metrics");
  if (!response.ok) throw new Error(`node-exporter fetch failed: ${response.status}`);
  const metrics = await response.text();

  const load = readMetric(metrics, "node_load1");
  const memoryTotal = readMetric(metrics, "node_memory_MemTotal_bytes");
  const memoryAvailable = readMetric(metrics, "node_memory_MemAvailable_bytes");
  const diskSize = readMetric(metrics, "node_filesystem_size_bytes", ['mountpoint="/"']);
  const diskAvailable = readMetric(metrics, "node_filesystem_avail_bytes", ['mountpoint="/"']);
  const networkExclude = /device="(lo|veth[^"]*|docker[^"]*|flannel[^"]*|cni[^"]*)"/;
  const rxMb = sumMetric(metrics, "node_network_receive_bytes_total", networkExclude) / 1024 / 1024;
  const txMb = sumMetric(metrics, "node_network_transmit_bytes_total", networkExclude) / 1024 / 1024;

  return [
    { key: "load", label: "Load Average", unit: "", max: 2, value: load },
    {
      key: "memory",
      label: "Memory Usage",
      unit: "%",
      max: 100,
      value: memoryTotal && memoryAvailable ? (1 - memoryAvailable / memoryTotal) * 100 : null,
    },
    {
      key: "disk",
      label: "Root Disk Used",
      unit: "%",
      max: 100,
      value: diskSize && diskAvailable ? (1 - diskAvailable / diskSize) * 100 : null,
    },
    { key: "rx", label: "Network RX Total", unit: "MB", max: 1024, value: rxMb },
    { key: "tx", label: "Network TX Total", unit: "MB", max: 1024, value: txMb },
  ];
}

function formatMetricValue(value: number | null, unit: string) {
  if (value === null || Number.isNaN(value)) return "No data";
  const digits = unit === "%" || unit === "KB/s" ? 1 : 2;
  return `${value.toFixed(digits)}${unit ? ` ${unit}` : ""}`;
}

export function Monitoring() {
  const [liveMetrics, setLiveMetrics] = useState<LiveMetric[]>(initialMetrics);
  const [lastUpdated, setLastUpdated] = useState("Loading");
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadMetrics() {
      try {
        const metrics = await fetchNodeExporterMetrics();
        if (!mounted) return;
        setLiveMetrics(metrics);
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
          <p>dragon-k3s node-exporter 원천 지표를 직접 읽어 현재 상태를 표시한다.</p>
          <div className="monitoring-facts">
            <span><strong>Job</strong>node-exporter</span>
            <span><strong>Source</strong>192.168.232.133:9100</span>
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
