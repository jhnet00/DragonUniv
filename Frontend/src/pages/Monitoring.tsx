import { useEffect, useMemo, useState } from "react";
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

type RiskLevel = "low" | "medium" | "high" | "unknown";
type MetricSource = "Prometheus" | "Node Exporter" | "Loading";

type LiveMetric = {
  key: string;
  label: string;
  unit: string;
  max: number;
  value: number | null;
  description: string;
  detail: string;
  query: string;
  source: MetricSource;
  risk: RiskLevel;
};

type PrometheusTarget = {
  scrapeUrl: string;
  health: "up" | "down" | "unknown";
  scrapePool: string;
  lastScrape: string;
  lastError: string;
  labels: Record<string, string>;
};

type PrometheusTargetResponse = {
  status: string;
  data?: {
    activeTargets?: Array<{
      scrapeUrl: string;
      health: "up" | "down" | "unknown";
      scrapePool: string;
      lastScrape: string;
      lastError: string;
      labels: Record<string, string>;
    }>;
  };
};

type PrometheusQueryResponse = {
  status: string;
  data?: {
    result?: Array<{ value?: [number, string] }>;
  };
};

const metricDefinitions = [
  {
    key: "load",
    label: "Load Average",
    unit: "",
    max: 2,
    description: "최근 1분 시스템 부하",
    query: "node_load1",
  },
  {
    key: "memory",
    label: "Memory Usage",
    unit: "%",
    max: 100,
    description: "사용 중인 메모리 비율",
    query: "100 * (1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes))",
  },
  {
    key: "disk",
    label: "Root Disk Used",
    unit: "%",
    max: 100,
    description: "루트 파일시스템 사용률",
    query: '100 * (1 - (node_filesystem_avail_bytes{mountpoint="/"} / node_filesystem_size_bytes{mountpoint="/"}))',
  },
  {
    key: "uptime",
    label: "Uptime",
    unit: "h",
    max: 168,
    description: "노드가 재시작 없이 동작한 시간",
    query: "(time() - node_boot_time_seconds) / 3600",
  },
  {
    key: "rx",
    label: "Network RX Total",
    unit: "MB",
    max: 1024,
    description: "수신 누적 트래픽",
    query: 'sum(node_network_receive_bytes_total{device!~"lo|veth.*|docker.*|flannel.*|cni.*"}) / 1024 / 1024',
  },
  {
    key: "tx",
    label: "Network TX Total",
    unit: "MB",
    max: 1024,
    description: "송신 누적 트래픽",
    query: 'sum(node_network_transmit_bytes_total{device!~"lo|veth.*|docker.*|flannel.*|cni.*"}) / 1024 / 1024',
  },
  {
    key: "running",
    label: "Running Procs",
    unit: "",
    max: 20,
    description: "현재 실행 대기 중인 프로세스",
    query: "node_procs_running",
  },
  {
    key: "blocked",
    label: "Blocked Procs",
    unit: "",
    max: 5,
    description: "I/O 등으로 block된 프로세스",
    query: "node_procs_blocked",
  },
] as const;

const initialMetrics: LiveMetric[] = metricDefinitions.map((metric) => ({
  ...metric,
  value: null,
  detail: metric.query,
  source: "Loading",
  risk: "unknown",
}));

const riskLabels: Record<RiskLevel, string> = {
  low: "정상",
  medium: "주의",
  high: "위험",
  unknown: "확인 중",
};

function readMetric(metrics: string, name: string, labelIncludes?: string[]) {
  const line = metrics
    .split("\n")
    .find((entry) => entry.startsWith(name) && labelIncludes?.every((label) => entry.includes(label)) !== false);
  const parts = line?.trim().split(/\s+/);
  const rawValue = parts?.[parts.length - 1];
  return rawValue ? Number(rawValue) : null;
}

function sumMetric(metrics: string, name: string, excludePattern: RegExp) {
  return metrics
    .split("\n")
    .filter((entry) => entry.startsWith(name) && !excludePattern.test(entry))
    .reduce((sum, entry) => {
      const parts = entry.trim().split(/\s+/);
      const rawValue = parts[parts.length - 1];
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
  if (metricKey === "rx" || metricKey === "tx") {
    if (value >= 1024) return "high";
    if (value >= 512) return "medium";
    return "low";
  }
  return "low";
}

function withRisk(metric: Omit<LiveMetric, "risk">): LiveMetric {
  return { ...metric, risk: riskFor(metric.key, metric.value) };
}

async function fetchPrometheusTargets(): Promise<PrometheusTarget[]> {
  const response = await fetch("/prometheus/api/v1/targets");
  if (!response.ok) throw new Error(`prometheus targets failed: ${response.status}`);
  const payload = (await response.json()) as PrometheusTargetResponse;
  if (payload.status !== "success") throw new Error("prometheus targets response is not success");
  return payload.data?.activeTargets ?? [];
}

async function queryPrometheusValue(query: string) {
  const response = await fetch(`/prometheus/api/v1/query?query=${encodeURIComponent(query)}`);
  if (!response.ok) throw new Error(`prometheus query failed: ${response.status}`);
  const payload = (await response.json()) as PrometheusQueryResponse;
  const rawValue = payload.data?.result?.[0]?.value?.[1];
  return rawValue ? Number(rawValue) : null;
}

async function fetchPrometheusMetrics(): Promise<LiveMetric[]> {
  const values = await Promise.all(metricDefinitions.map((metric) => queryPrometheusValue(metric.query)));
  if (values.every((value) => value === null || Number.isNaN(value))) {
    throw new Error("Prometheus query returned no node metrics");
  }

  return metricDefinitions.map((metric, index) =>
    withRisk({
      ...metric,
      value: values[index],
      detail: "Prometheus Query API",
      source: "Prometheus",
    }),
  );
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

  const fallbackValues: Record<string, number | null> = {
    load,
    memory: memoryTotal && memoryAvailable ? (1 - memoryAvailable / memoryTotal) * 100 : null,
    disk: diskSize && diskAvailable ? (1 - diskAvailable / diskSize) * 100 : null,
    uptime: bootTime ? (Date.now() / 1000 - bootTime) / 3600 : null,
    rx: rxMb,
    tx: txMb,
    running,
    blocked,
  };

  return metricDefinitions.map((metric) =>
    withRisk({
      ...metric,
      value: fallbackValues[metric.key],
      detail: metric.key === "memory"
        ? `${formatBytes(memoryTotal)} total / ${formatBytes(memoryAvailable)} available`
        : metric.key === "disk"
          ? `${formatBytes(diskSize)} size / ${formatBytes(diskAvailable)} available`
          : "Node Exporter metric sample",
      source: "Node Exporter",
    }),
  );
}

function formatBytes(value: number | null) {
  if (!value || Number.isNaN(value)) return "n/a";
  const gb = value / 1024 / 1024 / 1024;
  if (gb >= 1) return `${gb.toFixed(1)} GB`;
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}

function formatMetricValue(value: number | null, unit: string) {
  if (value === null || Number.isNaN(value)) return "No data";
  const digits = unit === "%" || unit === "MB" ? 1 : 2;
  return `${value.toFixed(digits)}${unit ? ` ${unit}` : ""}`;
}

function targetName(target: PrometheusTarget) {
  return target.labels.instance || target.scrapeUrl.replace(/^https?:\/\//, "");
}

function targetJob(target: PrometheusTarget) {
  return target.labels.job || target.scrapePool || "unknown";
}

export function Monitoring() {
  const [liveMetrics, setLiveMetrics] = useState<LiveMetric[]>(initialMetrics);
  const [targets, setTargets] = useState<PrometheusTarget[]>([]);
  const [metricSource, setMetricSource] = useState<MetricSource>("Loading");
  const [lastUpdated, setLastUpdated] = useState("Loading");
  const [loadError, setLoadError] = useState("");
  const [prometheusError, setPrometheusError] = useState("");

  const targetSummary = useMemo(() => {
    const up = targets.filter((target) => target.health === "up").length;
    const down = targets.filter((target) => target.health !== "up").length;
    return { up, down, total: targets.length };
  }, [targets]);

  const riskSummary = liveMetrics.reduce<Record<RiskLevel, number>>(
    (summary, metric) => ({ ...summary, [metric.risk]: summary[metric.risk] + 1 }),
    { low: 0, medium: 0, high: 0, unknown: 0 },
  );
  const overallRisk = riskSummary.high > 0 ? "high" : riskSummary.medium > 0 ? "medium" : riskSummary.unknown > 0 ? "unknown" : "low";
  const notableMetrics = liveMetrics.filter((metric) => metric.risk === "high" || metric.risk === "medium");
  const reportMessage = overallRisk === "high"
    ? "즉시 확인이 필요한 지표가 있다. 리소스 사용률과 target 상태를 우선 점검한다."
    : overallRisk === "medium"
      ? "일부 지표가 주의 구간에 있다. 배포 직후 트래픽 변화와 메모리 사용률을 같이 본다."
      : overallRisk === "unknown"
        ? "수집 중인 지표가 일부 비어 있다. Prometheus target과 exporter 응답 상태를 확인한다."
        : "현재 주요 인프라 지표는 안정 범위다. k3s 노드와 모니터링 VM target이 정상 응답 중인지 계속 감시한다.";

  useEffect(() => {
    let mounted = true;

    async function loadMetrics() {
      try {
        const prometheusTargets = await fetchPrometheusTargets();
        if (!mounted) return;
        setTargets(prometheusTargets);
        setPrometheusError("");
      } catch (error) {
        if (!mounted) return;
        setPrometheusError(error instanceof Error ? error.message : "prometheus targets failed");
      }

      try {
        const metrics = await fetchPrometheusMetrics();
        if (!mounted) return;
        setLiveMetrics(metrics);
        setMetricSource("Prometheus");
        setLastUpdated(new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
        setLoadError("");
      } catch {
        try {
          const metrics = await fetchNodeExporterMetrics();
          if (!mounted) return;
          setLiveMetrics(metrics);
          setMetricSource("Node Exporter");
          setLastUpdated(new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
          setLoadError("");
        } catch (exporterError) {
          if (!mounted) return;
          setMetricSource("Loading");
          setLoadError(exporterError instanceof Error ? exporterError.message : "monitoring metrics failed");
        }
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
            <a key={link.href} className="ghost-btn" href={link.href} target="_blank" rel="noreferrer" title={link.meta}>
              <ExternalLink size={16} />
              {link.label}
            </a>
          ))}
        </div>
      </div>

      <div className="admin-metrics">
        <MetricCard label="Overall Risk" value={overallRisk.toUpperCase()} state={`${riskSummary.high}/${riskSummary.medium}/${riskSummary.low}`} />
        <MetricCard label="Prometheus Targets" value={`${targetSummary.up}/${targetSummary.total}`} state={targetSummary.down > 0 ? `${targetSummary.down} DOWN` : "SCRAPING"} />
        <MetricCard label="Data Path" value={metricSource === "Prometheus" ? "Prometheus" : "Prom + Exporter"} state="LIVE" />
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

      <div className={`ai-report-card risk-${overallRisk}`}>
        <div>
          <p className="eyebrow">AI Report</p>
          <h2>{riskLabels[overallRisk]} 상태로 판단됨</h2>
          <p>{reportMessage}</p>
        </div>
        <div className="ai-risk-chips">
          <span><CheckCircle2 size={16} /> 정상 {riskSummary.low}</span>
          <span><AlertTriangle size={16} /> 주의 {riskSummary.medium}</span>
          <span><AlertTriangle size={16} /> 위험 {riskSummary.high}</span>
        </div>
        <div className="ai-report-list">
          {(notableMetrics.length > 0 ? notableMetrics : liveMetrics.slice(0, 3)).map((metric) => (
            <span key={metric.key}>
              <strong>{metric.label}</strong>
              {riskLabels[metric.risk]} · {formatMetricValue(metric.value, metric.unit)}
            </span>
          ))}
        </div>
      </div>

      <div className="live-metrics-grid">
        {liveMetrics.map((metric) => {
          const percentage = metric.value === null ? 0 : Math.max(0, Math.min(100, (metric.value / metric.max) * 100));
          return (
            <article className={`live-metric-card risk-${metric.risk}`} key={metric.key}>
              <div className="live-metric-top">
                <span className={`risk-pill ${metric.risk}`}>{riskLabels[metric.risk]}</span>
                <span>{metric.source}</span>
              </div>
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
                <span><strong>Metric</strong>{metric.detail}</span>
                <span><strong>Threshold max</strong>{metric.max}{metric.unit}</span>
              </div>
            </article>
          );
        })}
      </div>

      <div className="monitoring-layout">
        <article className="glass-panel">
          <h2><Database size={20} /> Prometheus Scrape</h2>
          <p>Prometheus API로 scrape target 상태를 조회하고, 가능한 경우 PromQL query 결과를 그대로 표시한다.</p>
          <div className="monitoring-facts">
            <span><strong>Endpoint</strong>192.168.232.135:9090</span>
            <span><strong>Targets</strong>{targetSummary.up} up / {targetSummary.down} down</span>
            <span><strong>Query</strong>/api/v1/query</span>
          </div>
        </article>

        <article className="glass-panel">
          <h2><MonitorCog size={20} /> 운영 판단</h2>
          <p>게이지, 임계치, 상세 PromQL을 함께 보여서 장애 징후를 빠르게 확인한다.</p>
          <div className="monitoring-facts">
            <span><strong>Primary</strong>Prometheus</span>
            <span><strong>Fallback</strong>node-exporter direct</span>
            <span><strong>Target Node</strong>dragon-k3s</span>
          </div>
        </article>
      </div>

      {(prometheusError || loadError) && (
        <div className="monitoring-error">
          {prometheusError && <span>Prometheus target check: {prometheusError}</span>}
          {loadError && <span>Metric query: {loadError}</span>}
        </div>
      )}

      <div className="prometheus-targets">
        <div className="section-title-row">
          <h2>Prometheus Targets</h2>
          <span>{targetSummary.total || "No"} active target</span>
        </div>
        <div className="target-list">
          {targets.length === 0 ? (
            <article className="target-row empty">
              <strong>No target data</strong>
              <span>Prometheus scrape 설정을 확인해야 한다.</span>
            </article>
          ) : (
            targets.map((target) => (
              <article className="target-row" key={`${target.scrapePool}-${target.scrapeUrl}`}>
                <span className={`target-health ${target.health}`}>{target.health}</span>
                <div>
                  <strong>{targetName(target)}</strong>
                  <span>{targetJob(target)} · {target.scrapeUrl}</span>
                </div>
                <em>{target.lastError || "scrape ok"}</em>
              </article>
            ))
          )}
        </div>
      </div>

      <div className="monitoring-pipeline">
        <article><Server /><strong>dragon-k3s</strong><span>application runtime</span></article>
        <article><Activity /><strong>node-exporter</strong><span>host metrics :9100</span></article>
        <article><Database /><strong>Prometheus</strong><span>scrape + PromQL</span></article>
        <article><BarChart3 /><strong>Admin UI</strong><span>status + risk view</span></article>
      </div>
    </section>
  );
}
