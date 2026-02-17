import { SimulationResult } from "@/services/api";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Users, Skull, DollarSign, TrendingUp } from "lucide-react";

interface ResultsPanelProps {
  result: SimulationResult | null;
}

const StatCard = ({
  icon: Icon,
  label,
  value,
  variant = "default",
}: {
  icon: typeof Users;
  label: string;
  value: string;
  variant?: "default" | "destructive" | "accent";
}) => {
  const colorClass =
    variant === "destructive"
      ? "text-destructive"
      : variant === "accent"
      ? "text-accent"
      : "text-primary";

  return (
    <div className="panel-gradient rounded-lg border border-border p-3 space-y-1">
      <div className="flex items-center gap-2">
        <Icon className={`h-3.5 w-3.5 ${colorClass}`} />
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono">
          {label}
        </span>
      </div>
      <p className={`text-lg font-mono font-bold ${colorClass}`}>{value}</p>
    </div>
  );
};

const ResultsPanel = ({ result }: ResultsPanelProps) => {
  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-6 text-center">
        <TrendingUp className="h-10 w-10 mb-3 opacity-30" />
        <p className="text-sm font-mono">Run a simulation to see results</p>
        <p className="text-xs mt-1 opacity-60">Select a district and configure parameters</p>
      </div>
    );
  }

  const formatNumber = (n: number) => n.toLocaleString("en-IN");
  const formatCurrency = (n: number) => {
    if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)} Cr`;
    if (n >= 100000) return `₹${(n / 100000).toFixed(1)} L`;
    return `₹${formatNumber(n)}`;
  };

  return (
    <div className="flex flex-col gap-4 h-full overflow-y-auto p-4">
      <h2 className="text-sm font-mono font-semibold tracking-wide uppercase text-foreground flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-primary" />
        Results
      </h2>

      <div className="grid grid-cols-1 gap-3">
        <StatCard
          icon={Users}
          label="Affected Population"
          value={formatNumber(result.affected_population)}
        />
        <StatCard
          icon={Skull}
          label="Fatalities"
          value={formatNumber(result.fatalities)}
          variant="destructive"
        />
        <StatCard
          icon={DollarSign}
          label="Economic Loss"
          value={formatCurrency(result.economic_loss)}
          variant="accent"
        />
      </div>

      {/* Chart */}
      <div className="panel-gradient rounded-lg border border-border p-3 flex-1 min-h-[220px]">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono mb-2">
          Impact Over Time
        </p>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={result.time_series}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 25% 18%)" />
            <XAxis
              dataKey="hour"
              tick={{ fill: "hsl(215 15% 55%)", fontSize: 11 }}
              tickFormatter={(v) => `${v}h`}
              stroke="hsl(222 25% 18%)"
            />
            <YAxis
              tick={{ fill: "hsl(215 15% 55%)", fontSize: 11 }}
              stroke="hsl(222 25% 18%)"
              tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
            />
            <Tooltip
              contentStyle={{
                background: "hsl(222 40% 10%)",
                border: "1px solid hsl(222 25% 18%)",
                borderRadius: "8px",
                color: "hsl(200 20% 90%)",
                fontSize: 12,
              }}
              labelFormatter={(v) => `Hour ${v}`}
            />
            <Legend
              wrapperStyle={{ fontSize: 11, fontFamily: "JetBrains Mono" }}
            />
            <Line
              type="monotone"
              dataKey="no_resources"
              stroke="hsl(0 75% 55%)"
              strokeWidth={2}
              dot={{ fill: "hsl(0 75% 55%)", r: 3 }}
              name="Without Resources"
            />
            <Line
              type="monotone"
              dataKey="with_resources"
              stroke="hsl(185 80% 50%)"
              strokeWidth={2}
              dot={{ fill: "hsl(185 80% 50%)", r: 3 }}
              name="With Resources"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ResultsPanel;
