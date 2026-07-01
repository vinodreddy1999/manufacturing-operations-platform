import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export type ChartDatum = Record<string, string | number>;

const chartColors = ['#22d3ee', '#34d399', '#f59e0b', '#a78bfa', '#fb7185'];
const tooltipStyle = { background: '#0f172a', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12 };

export function LazyBarChartImpl({
  data,
  bars,
  height = 'h-72',
  xKey = 'name',
  showGrid = true,
  showLegend = false,
  margin,
}: {
  data: ChartDatum[];
  bars: string[];
  height?: string;
  xKey?: string;
  showGrid?: boolean;
  showLegend?: boolean;
  margin?: { left?: number; right?: number; top?: number; bottom?: number };
}) {
  return (
    <div className={height}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={margin}>
          {showGrid ? <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} /> : null}
          <XAxis dataKey={xKey} stroke="#94a3b8" tick={{ fontSize: 11 }} />
          <YAxis stroke="#94a3b8" />
          <Tooltip cursor={{ fill: 'rgba(255,255,255,0.04)' }} contentStyle={tooltipStyle} />
          {showLegend ? <Legend /> : null}
          {bars.map((bar, index) => (
            <Bar key={bar} dataKey={bar} fill={chartColors[index % chartColors.length]} radius={[6, 6, 0, 0]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function LazyLineChartImpl({
  data,
  lineKey = 'value',
  height = 'h-72',
  xKey = 'name',
}: {
  data: ChartDatum[];
  lineKey?: string;
  height?: string;
  xKey?: string;
}) {
  return (
    <div className={height}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid stroke="rgba(255,255,255,0.08)" />
          <XAxis dataKey={xKey} stroke="#94a3b8" />
          <YAxis stroke="#94a3b8" />
          <Tooltip contentStyle={tooltipStyle} />
          <Line type="monotone" dataKey={lineKey} stroke="#22d3ee" strokeWidth={3} dot={{ fill: '#22d3ee' }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function BusinessImpactChartImpl({ data, currency }: { data: ChartDatum[]; currency: string }) {
  return (
    <div className="h-[420px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ left: 10, right: 10, top: 15, bottom: 80 }}>
          <CartesianGrid stroke="rgba(148,163,184,.1)" vertical={false} />
          <XAxis dataKey="module" stroke="#64748b" tick={{ fontSize: 10 }} angle={-35} textAnchor="end" interval={0} />
          <YAxis yAxisId="left" stroke="#64748b" tick={{ fontSize: 10 }} />
          <YAxis yAxisId="right" orientation="right" stroke="#64748b" tick={{ fontSize: 10 }} />
          <Tooltip contentStyle={tooltipStyle} />
          <Legend />
          <Bar yAxisId="left" dataKey="savings" name={`Savings (${currency})`} fill="#22d3ee" radius={[6, 6, 0, 0]} />
          <Bar yAxisId="right" dataKey="improved" name="Improved" fill="#34d399" radius={[6, 6, 0, 0]} />
          <Bar yAxisId="right" dataKey="declined" name="Declined" fill="#fb7185" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
