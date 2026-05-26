type MetricCardProps = {
  label: string;
  value: string;
  state?: string;
};

export function MetricCard({ label, value, state = "Healthy" }: MetricCardProps) {
  return (
    <article className="metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
      <em>{state}</em>
    </article>
  );
}
