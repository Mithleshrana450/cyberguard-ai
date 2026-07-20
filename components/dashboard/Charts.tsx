"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";
import { Panel } from "@/components/ui";
import { trafficSeries, categoryBreakdown } from "@/lib/data";

const tooltipStyle = {
  background: "#10151f",
  border: "1px solid #232b3d",
  borderRadius: 8,
  fontSize: 12,
  fontFamily: "IBM Plex Mono, monospace",
  color: "#e7ecf3",
};

export function TrafficChart() {
  return (
    <Panel className="p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-sm font-semibold">
          Events vs. blocked — 24h
        </h3>
        <span className="font-mono text-[11px] text-text-dim">live</span>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={trafficSeries}>
          <defs>
            <linearGradient id="events" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4fe3c1" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#4fe3c1" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="blocked" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ff5c7a" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#ff5c7a" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#232b3d" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="t"
            tick={{ fill: "#8996ac", fontSize: 11, fontFamily: "IBM Plex Mono" }}
            axisLine={{ stroke: "#232b3d" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "#8996ac", fontSize: 11, fontFamily: "IBM Plex Mono" }}
            axisLine={false}
            tickLine={false}
            width={30}
          />
          <Tooltip contentStyle={tooltipStyle} />
          <Area
            type="monotone"
            dataKey="events"
            stroke="#4fe3c1"
            fill="url(#events)"
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="blocked"
            stroke="#ff5c7a"
            fill="url(#blocked)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </Panel>
  );
}

export function CategoryChart() {
  return (
    <Panel className="p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-sm font-semibold">
          Threats by category
        </h3>
        <span className="font-mono text-[11px] text-text-dim">7d</span>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={categoryBreakdown} layout="vertical" margin={{ left: 8 }}>
          <CartesianGrid stroke="#232b3d" strokeDasharray="3 3" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fill: "#8996ac", fontSize: 11, fontFamily: "IBM Plex Mono" }}
            axisLine={{ stroke: "#232b3d" }}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fill: "#8996ac", fontSize: 11, fontFamily: "IBM Plex Mono" }}
            axisLine={false}
            tickLine={false}
            width={120}
          />
          <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "#1a2130" }} />
          <Bar dataKey="value" fill="#4fe3c1" radius={[0, 4, 4, 0]} barSize={18} />
        </BarChart>
      </ResponsiveContainer>
    </Panel>
  );
}
