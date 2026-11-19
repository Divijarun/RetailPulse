import React from 'react';
import { fmt, CHART_COLOURS } from '../utils.js';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar,
  PieChart, Pie, Cell,
  CartesianGrid, XAxis, YAxis, Tooltip,
} from 'recharts';

/** Custom recharts tooltip */
export function TFTooltip({ active, payload, label, moneyFormat = true }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="tf-tooltip">
      <div className="tf-tooltip-title">{label}</div>
      {payload.map(item => (
        <div key={item.dataKey} className="tf-tooltip-row">
          <span className="tf-tooltip-dot" style={{ background: item.color }} />
          <span>{item.name}</span>
          <span className="tf-tooltip-val">
            {moneyFormat ? fmt.money(item.value) : item.value}
          </span>
        </div>
      ))}
    </div>
  );
}

/** Revenue + Profit area chart */
export function RevenueTrendChart({ data, height = 220 }) {
  if (!data?.length) return <EmptyChart />;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#7770ef" stopOpacity={0.25} />
            <stop offset="100%" stopColor="#7770ef" stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id="gProf" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#20a77d" stopOpacity={0.2} />
            <stop offset="100%" stopColor="#20a77d" stopOpacity={0.01} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="#e9ebf2" strokeDasharray="3 6" vertical={false} />
        <XAxis dataKey="month" tick={{ fill: '#858ca0', fontSize: 11 }} axisLine={false} tickLine={false} dy={8} />
        <YAxis tickFormatter={fmt.compact} tick={{ fill: '#858ca0', fontSize: 10 }} axisLine={false} tickLine={false} width={58} />
        <Tooltip content={<TFTooltip />} />
        <Area type="monotone" dataKey="revenue" name="Revenue"      stroke="#7770ef" strokeWidth={2.5} fill="url(#gRev)"  activeDot={{ r: 4, strokeWidth: 0, fill: '#7770ef' }} />
        <Area type="monotone" dataKey="profit"  name="Gross Profit" stroke="#20a77d" strokeWidth={2.5} fill="url(#gProf)" activeDot={{ r: 4, strokeWidth: 0, fill: '#20a77d' }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

/** Category donut chart */
export function CategoryDonutChart({ data, height = 180 }) {
  if (!data?.length) return <EmptyChart />;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie data={data} dataKey="revenue" nameKey="name"
          cx="50%" cy="50%" innerRadius={52} outerRadius={76}
          paddingAngle={3} stroke="#ffffff" strokeWidth={2}
        >
          {data.map((item, i) => (
            <Cell key={item.name} fill={CHART_COLOURS[i % CHART_COLOURS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={v => fmt.money(v)} contentStyle={{ background: '#ffffff', border: '1px solid #e9ebf2', borderRadius: 8, fontSize: 12, boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

/** Regional bar chart */
export function RegionBarChart({ data, height = 200 }) {
  if (!data?.length) return <EmptyChart />;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
        <CartesianGrid stroke="#e9ebf2" strokeDasharray="3 6" vertical={false} />
        <XAxis dataKey="region" tick={{ fill: '#858ca0', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tickFormatter={fmt.compact} tick={{ fill: '#858ca0', fontSize: 10 }} axisLine={false} tickLine={false} width={58} />
        <Tooltip content={<TFTooltip />} />
        <Bar dataKey="revenue" name="Revenue"      fill="#7770ef" radius={[4,4,0,0]} />
        <Bar dataKey="profit"  name="Gross Profit" fill="#20a77d" radius={[4,4,0,0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Profit bar chart (products) */
export function ProfitBarChart({ data, height = 200 }) {
  if (!data?.length) return <EmptyChart />;
  const limited = data.slice(0, 8);
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={limited} layout="vertical" margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid stroke="#e9ebf2" strokeDasharray="3 6" horizontal={false} />
        <XAxis type="number" tickFormatter={fmt.compact} tick={{ fill: '#858ca0', fontSize: 10 }} axisLine={false} tickLine={false} />
        <YAxis type="category" dataKey="product" tick={{ fill: '#858ca0', fontSize: 10 }} axisLine={false} tickLine={false} width={110} />
        <Tooltip content={<TFTooltip />} />
        <Bar dataKey="profit" name="Gross Profit" radius={[0,4,4,0]}>
          {limited.map((e, i) => (
            <Cell key={e.product} fill={e.profit < 0 ? '#ef4444' : CHART_COLOURS[i % CHART_COLOURS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function EmptyChart() {
  return (
    <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#858ca0', fontSize: 12 }}>
      No data for current filters
    </div>
  );
}
