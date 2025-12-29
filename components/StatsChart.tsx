
import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { ClassificationResult } from '../types';

interface StatsChartProps {
  data: ClassificationResult[];
  color: string;
}

const StatsChart: React.FC<StatsChartProps> = ({ data, color }) => {
  // Transform data for chart
  const chartData = data.map(item => ({
    name: item.className,
    confidence: item.confidence * 100
  }));

  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 30, left: 40, bottom: 0 }}>
          <XAxis type="number" hide domain={[0, 100]} />
          <YAxis 
            dataKey="name" 
            type="category" 
            width={80} 
            tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip 
            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-slate-900 border border-white/10 p-2 rounded-lg text-xs shadow-xl">
                    <p className="font-bold text-white">{payload[0].payload.name}</p>
                    <p className="text-sky-400">Confidence: {payload[0].value?.toFixed(1)}%</p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar dataKey="confidence" radius={[0, 4, 4, 0]} barSize={20}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={color} fillOpacity={index === 0 ? 1 : 0.4} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default StatsChart;
