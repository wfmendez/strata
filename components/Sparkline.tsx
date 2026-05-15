"use client";

import { ResponsiveContainer, LineChart, Line, YAxis, Tooltip } from "recharts";

export function Sparkline({ data }: { data: string }) {
  let parsed: { t: number; v: number }[] = [];
  try {
    parsed = JSON.parse(data);
  } catch {
    return null;
  }
  if (!parsed.length) return null;
  return (
    <div className="mt-3 h-20 px-5">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={parsed} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
          <YAxis hide domain={["dataMin - 1", "dataMax + 1"]} />
          <Tooltip
            contentStyle={{
              background: "#0E1422",
              border: "1px solid #1E2A42",
              borderRadius: 8,
              fontSize: 11,
            }}
            labelStyle={{ color: "#8892A4" }}
            formatter={(v) => [`${v}%`, "Yield"]}
          />
          <Line type="monotone" dataKey="v" stroke="#A855F7" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
