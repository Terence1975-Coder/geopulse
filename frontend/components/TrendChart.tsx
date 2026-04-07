"use client";

type TrendPoint = {
  label: string;
  value: number;
};

type TrendChartProps = {
  title: string;
  subtitle?: string;
  points: TrendPoint[];
};

function buildPolyline(points: TrendPoint[], width: number, height: number) {
  if (!points.length) return "";

  const max = Math.max(...points.map((p) => p.value), 100);
  const min = Math.min(...points.map((p) => p.value), 0);
  const range = Math.max(max - min, 1);

  return points
    .map((point, index) => {
      const x = (index / Math.max(points.length - 1, 1)) * width;
      const y = height - ((point.value - min) / range) * height;
      return `${x},${y}`;
    })
    .join(" ");
}

export default function TrendChart({ title, subtitle, points }: TrendChartProps) {
  const width = 520;
  const height = 170;
  const polyline = buildPolyline(points, width, height);

  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <h3>{title}</h3>
          {subtitle ? <p className="muted">{subtitle}</p> : null}
        </div>
      </div>

      {points.length === 0 ? (
        <div className="empty-state compact">
          <div>No trend data yet.</div>
          <span>Create and analyze events to build GeoPulse history.</span>
        </div>
      ) : (
        <>
          <div className="chart-wrap">
            <svg viewBox={`0 0 ${width} ${height}`} className="trend-svg" preserveAspectRatio="none">
              <polyline fill="none" strokeWidth="3" points={polyline} />
            </svg>
          </div>

          <div className="chart-labels">
            {points.map((point) => (
              <div key={point.label} className="chart-label-item">
                <span>{point.label.slice(5)}</span>
                <strong>{point.value}</strong>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
