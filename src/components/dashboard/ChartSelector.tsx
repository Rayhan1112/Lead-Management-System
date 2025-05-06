
import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { chartData } from '@/lib/mockData';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ChartSelectorProps {
  className?: string;
}

export const ChartSelector: React.FC<ChartSelectorProps> = ({ className }) => {
  const [chartType, setChartType] = useState('bar');
  const [dataType, setDataType] = useState('leads');
  const [timeRange, setTimeRange] = useState('monthly');

  const COLORS = ['#9b87f5', '#1EAEDB', '#7E69AB', '#33C3F0', '#F97316'];

  const getChartData = () => {
    return chartData[dataType as keyof typeof chartData][timeRange as 'monthly' | 'yearly'];
  };

  return (
    <div className={`neuro p-6 ${className}`}>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
        <h2 className="text-lg font-semibold">Analytics Overview</h2>
        <div className="flex flex-wrap gap-2">
          <Select
            defaultValue="leads"
            onValueChange={(value) => setDataType(value)}
          >
            <SelectTrigger className="w-[120px] neuro-inset focus:shadow-none text-sm">
              <SelectValue placeholder="Data Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="leads">Leads</SelectItem>
              <SelectItem value="meetings">Meetings</SelectItem>
              <SelectItem value="deals">Deals</SelectItem>
            </SelectContent>
          </Select>

          <Select
            defaultValue="monthly"
            onValueChange={(value) => setTimeRange(value)}
          >
            <SelectTrigger className="w-[120px] neuro-inset focus:shadow-none text-sm">
              <SelectValue placeholder="Time Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">6 Months</SelectItem>
              <SelectItem value="yearly">1 Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="bar" onValueChange={(value) => setChartType(value)}>
        <TabsList className="mb-6">
          <TabsTrigger value="bar">Bar Chart</TabsTrigger>
          <TabsTrigger value="line">Line Chart</TabsTrigger>
          <TabsTrigger value="pie">Pie Chart</TabsTrigger>
        </TabsList>

        <TabsContent value="bar" className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={getChartData()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#9b87f5" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </TabsContent>

        <TabsContent value="line" className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={getChartData()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#9b87f5"
                activeDot={{ r: 8 }}
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </TabsContent>

        <TabsContent value="pie" className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={getChartData()}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={100}
                fill="#8884d8"
                dataKey="count"
                nameKey="month"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {getChartData().map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </TabsContent>
      </Tabs>
    </div>
  );
};
