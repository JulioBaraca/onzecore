"use client";

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface CategoryBarDatum {
  label: string;
  value: number;
  color: string;
}

export interface CategoryBarChartProps {
  title: string;
  description?: string;
  data: CategoryBarDatum[];
  emptyLabel: string;
  valueSuffix?: string;
  layout?: "horizontal" | "vertical";
}

export function CategoryBarChart({
  title,
  description,
  data,
  emptyLabel,
  valueSuffix = "",
  layout = "horizontal",
}: CategoryBarChartProps) {
  const isVertical = layout === "vertical";
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {description && <p className="mb-3 text-xs text-slate-500">{description}</p>}
        {data.length === 0 ? (
          <p className="text-sm text-slate-400">{emptyLabel}</p>
        ) : (
          <div className="w-full" style={{ height: Math.max(160, data.length * 44) }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                layout={isVertical ? "vertical" : "horizontal"}
                margin={{ top: 8, right: 24, left: isVertical ? 8 : -16, bottom: 0 }}
                barCategoryGap="30%"
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={!isVertical} vertical={isVertical} />
                {isVertical ? (
                  <>
                    <XAxis
                      type="number"
                      tick={{ fontSize: 11, fill: "#64748b" }}
                      tickLine={false}
                      axisLine={{ stroke: "#e2e8f0" }}
                      unit={valueSuffix}
                    />
                    <YAxis
                      type="category"
                      dataKey="label"
                      tick={{ fontSize: 12, fill: "#334155" }}
                      tickLine={false}
                      axisLine={false}
                      width={110}
                    />
                  </>
                ) : (
                  <>
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 12, fill: "#334155" }}
                      tickLine={false}
                      axisLine={{ stroke: "#e2e8f0" }}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "#64748b" }}
                      tickLine={false}
                      axisLine={false}
                      width={valueSuffix ? 44 : 32}
                      unit={valueSuffix}
                      allowDecimals={false}
                    />
                  </>
                )}
                <Tooltip
                  contentStyle={{ borderRadius: 8, borderColor: "#e2e8f0", fontSize: 12 }}
                  cursor={{ fill: "#f1f5f9" }}
                  formatter={(value) => {
                    const n = typeof value === "number" ? value : Number(value);
                    return [`${n.toFixed(n % 1 === 0 ? 0 : 1)}${valueSuffix}`, ""];
                  }}
                />
                <Bar
                  dataKey="value"
                  radius={isVertical ? [0, 4, 4, 0] : [4, 4, 0, 0]}
                  maxBarSize={32}
                  isAnimationActive={false}
                >
                  {data.map((d, i) => (
                    <Cell key={i} fill={d.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
