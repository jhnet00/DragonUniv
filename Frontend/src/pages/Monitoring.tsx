import { useEffect, useState } from "react";
import { Activity, AlertTriangle, BarChart3, CheckCircle2, Database, ExternalLink, MonitorCog, Server } from "lucide-react";
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
  description: string;
  detail: string;
  risk: RiskLevel;
};

type RiskLevel = "low" | "medium" | "high" | "unknown";

const initialMetrics: LiveMetric[] = [
  { key: "load", label: "Load Average", unit: "", max: 2, value: null, description: "최근 1분 시스템 부하", detail: "node_load1", risk: "unknown" },
  { key: "memory", label: "Memory Usage", unit: "%", max: 100, value: null, description: "사용 중인 메모리 비율", detail: "MemTotal / MemAvailable", risk: "unknown" },
  { key: "disk", label: "Root Disk Used", unit: "%", max: 100, value: null, description: "루트 파일시스템 사용률", detail: "mountpoint=/", risk: "unknown" },
  { key: "uptime", label: "Uptime", unit: "h", max: 168, value: null, description: "노드가 재시작 없이 동작한 시간", detail: "node_boot_time_seconds", risk: "unknown" },
  { key: "rx", label: "Network RX Total", unit: "MB", max: 1024, value: null, description: "수신 누적 트래픽", detail: "loopback/CNI 계열 제외", risk: "unknown" },
  { key: "tx", label: "Network TX Total", unit: "MB", max: 1024, value: null, description: "송신 누적 트래픽", detail: "loopback/CNI 계열 제외", risk: "unknown" },
  { key: "running", label: "Running Procs", unit: "", max: 20, value: null, description: "현재 실행 대기 중인 프로세스", detail: "node_procs_running", risk: "unknown" },
  { key: "blocked", label: "Blocked Procs", unit: "", max: 5, value: null, description: "I/O 등으로 block된 프로세스", detail: "node_procs_blocked", risk: "unknown" },
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

function riskFor(metricKey: string, value: number | null) {
  if (value === null || Number.isNaN(value)) return "unknown";
  if (metricKey === "memory" || metricKey === "disk") {
    if (value >= 85) return "high";
    if (value >= 70) return "medium";
    return "low";
  }
  if (metricKey === "load") {
    if (value >= 2) return "high";
    if (value >= 1) return "medium";
    return "low";
  }
  if (metricKey === "blocked") {
    if (value >= 3) return "high";
    if (value >= 1) return "medium";
    return "low";
  }
  if (metricKey === "running") {
    if (value >= 15) return "high";
    if (value >= 8) return "medium";
    return "low";
  }
  return "low";
}

function withRisk(metric: Omit<LiveMetric, "risk">): LiveMetric {
  return { ...metric, risk: riskFor(metric.key, metric.value) };
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
  const bootTime = readMetric(metrics, "node_boot_time_seconds");
  const running = readMetric(metrics, "node_procs_running");
  const blocked = readMetric(metrics, "node_procs_blocked");
  const networkExclude = /device="(lo|veth[^"]*|docker[^"]*|flannel[^"]*|cni[^"]*)"/;
  const rxMb = sumMetric(metrics, "node_network_receive_bytes_total", networkExclude) / 1024 / 1024;
  const txMb = sumMetric(metrics, "node_network_transmit_bytes_total", networkExclude) / 1024 / 1024;

  return [
    withRisk({ key: "load", label: "Load Average", unit: "", max: 2, value: load, description: "최근 1분 시스템 부하", detail: "node_load1" }),
    withRisk({
      key: "memory",
      label: "Memory Usage",
      unit: "%",
      max: 100,
      value: memoryTotal && memoryAvailable ? (1 - memoryAvailable / memoryTotal) * 100 : null,
      description: "사용 중인 메모리 비율",
      detail: `${formatBytes(memoryTotal)} total / ${formatBytes(memoryAvailable)} available`,
    }),
    withRisk({
      key: "disk",
      label: "Root Disk Used",
      unit: "%",
      max: 100,
      value: diskSize && diskAvailable ? (1 - diskAvailable / diskSize) * 100 : null,
      description: "루트 파일시스템 사용률",
      detail: `${formatBytes(diskSize)} size / ${formatBytes(diskAvailable)} available`,
    }),
    withRisk({
      key: "uptime",
      label: "Uptime",
      unit: "h",
      max: 168,
      value: bootTime ? (Date.now() / 1000 - bootTime) / 3600 : null,
      description: "노드가 재시작 없이 동작한 시간",
      detail: "높을수록 안정적으로 유지 중",
    }),
    withRisk({ key: "rx", label: "Network RX Total", unit: "MB", max: 1024, value: rxMb, description: "수신 누적 트래픽", detail: "loopback/CNI 계열 제외" }),
    withRisk({ key: "tx", label: "Network TX Total", unit: "MB", max: 1024, value: txMb, description: "송신 누적 트래픽", detail: "loopback/CNI 계열 제외" }),
    withRisk({ key: "running", label: "Running Procs", unit: "", max: 20, value: running, description: "현재 실행 대기 중인 프로세스", detail: "node_procs_running" }),
    withRisk({ key: "blocked", label: "Blocked Procs", unit: "", max: 5, value: blocked, description: "I/O 등으로 block된 프로세스", detail: "node_procs_blocked" }),
  ];
}

function formatBytes(value: number | null) {
  if (!value || Number.isNaN(value)) return "n/a";
  const gb = value / 1024 / 1024 / 1024;
  if (gb >= 1) return `${gb.toFixed(1)} GB`;
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
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
  const riskSummary = liveMetrics.reduce<Record<RiskLevel, number>>(
    (summary, metric) => ({ ...summary, [metric.risk]: summary[metric.risk] + 1 }),
    { low: 0, medium: 0, high: 0, unknown: 0 },
  );
  const overallRisk = riskSummary.high > 0 ? "high" : riskSummary.medium > 0 ? "medium" : riskSummary.unknown > 0 ? "unknown" : "low";

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
        <MetricCard label="Overall Risk" value={overallRisk.toUpperCase()} state={`${riskSummary.high}/${riskSummary.medium}/${riskSummary.low}`} />
        <MetricCard label="Node Exporter" value=":9100" state="LIVE" />
        <MetricCard label="Prometheus" value=":9090" state="READY" />
        <MetricCard label="Refresh" value="15s" state={lastUpdated} />
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

      <div className="risk-strip">
        <article className="risk-card low"><CheckCircle2 /><span>Low</span><strong>{riskSummary.low}</strong></article>
        <article className="risk-card medium"><AlertTriangle /><span>Medium</span><strong>{riskSummary.medium}</strong></article>
        <article className="risk-card high"><AlertTriangle /><span>High</span><strong>{riskSummary.high}</strong></article>
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
          <h2><MonitorCog size={20} /> Readiness Check</h2>
          <p>Prometheus와 Grafana는 운영 도구로 유지하고, 이 화면은 시연 안정성을 위해 exporter 원천값을 직접 표시한다.</p>
          <div className="monitoring-facts">
            <span><strong>Exporter</strong>192.168.232.133:9100</span>
            <span><strong>Target</strong>dragon-k3s</span>
          </div>
        </article>
      </div>

      {loadError && <p className="monitoring-error">{loadError}</p>}

      <div className="live-metrics-grid">
        {liveMetrics.map((metric) => {
          const percentage = metric.value === null ? 0 : Math.max(0, Math.min(100, (metric.value / metric.max) * 100));
          return (
            <details className={`live-metric-card risk-${metric.risk}`} key={metric.key}>
              <summary>
                <span className={`risk-pill ${metric.risk}`}>{metric.risk}</span>
                <span>자세히</span>
              </summary>
              <div className="live-metric-head">
                <span>{metric.label}</span>
                <strong>{formatMetricValue(metric.value, metric.unit)}</strong>
              </div>
              <div className="gauge-wrap">
                <div className="gauge" style={{ background: `conic-gradient(var(--gold) ${percentage * 3.6}deg, rgba(255,255,255,.08) 0deg)` }}>
                  <strong>{metric.value === null ? "n/a" : `${Math.round(percentage)}%`}</strong>
                </div>
                <div>
                  <p>{metric.description}</p>
                  <div className="metric-bar" aria-label={`${metric.label} meter`}>
                    <span style={{ width: `${percentage}%` }} />
                  </div>
                </div>
              </div>
              <div className="metric-detail">
                <span><strong>Source</strong>{metric.detail}</span>
                <span><strong>Threshold</strong>{metric.max}{metric.unit}</span>
              </div>
            </details>
          );
        })}
      </div>

      <div className="monitoring-pipeline">
        <article><Server /><strong>dragon-k3s</strong><span>runtime node</span></article>
        <article><Activity /><strong>node-exporter</strong><span>raw metrics</span></article>
        <article><Database /><strong>Prometheus</strong><span>storage/query</span></article>
        <article><BarChart3 /><strong>Admin UI</strong><span>live status</span></article>
      </div>
    </section>
  );
}
