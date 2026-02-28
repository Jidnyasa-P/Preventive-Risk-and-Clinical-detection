import React, { useState } from 'react';
import { FileText, TrendingUp, Users, Activity, Calendar, ArrowUpRight, ArrowDownRight, FileDown } from 'lucide-react';
import { motion } from 'motion/react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  LineChart, Line, PieChart, Pie, Legend, AreaChart, Area,
} from 'recharts';
import { exportAggregateReportPDF } from '../services/pdfExport';

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6'];

const riskDistData = [
  { name: 'Low Risk', value: 842, fill: '#10b981' },
  { name: 'Moderate', value: 286, fill: '#f59e0b' },
  { name: 'High Risk', value: 156, fill: '#ef4444' },
];

const monthlyData = [
  { month: 'Aug', assessments: 980, highRisk: 128 },
  { month: 'Sep', assessments: 1050, highRisk: 140 },
  { month: 'Oct', assessments: 1120, highRisk: 148 },
  { month: 'Nov', assessments: 1200, highRisk: 152 },
  { month: 'Dec', assessments: 1240, highRisk: 155 },
  { month: 'Jan', assessments: 1284, highRisk: 156 },
];

const ageGroupData = [
  { group: '18–29', low: 78, moderate: 12, high: 4 },
  { group: '30–39', low: 65, moderate: 22, high: 8 },
  { group: '40–49', low: 52, moderate: 30, high: 18 },
  { group: '50–59', low: 40, moderate: 35, high: 28 },
  { group: '60+', low: 30, moderate: 38, high: 35 },
];

const riskFactorData = [
  { factor: 'HbA1c Level', importance: 82 },
  { factor: 'Blood Glucose', importance: 74 },
  { factor: 'BMI', importance: 68 },
  { factor: 'Age', importance: 55 },
  { factor: 'Hypertension', importance: 42 },
];

export default function Reports() {
  const [isExporting, setIsExporting] = useState(false);
  const stats = [
    { label: 'Total Assessments', value: '1,284', change: '+12%', trend: 'up', icon: FileText, color: 'text-blue-600 bg-blue-50' },
    { label: 'High Risk Patients', value: '156', change: '-4%', trend: 'down', icon: Activity, color: 'text-red-600 bg-red-50' },
    { label: 'Avg. Risk Score', value: '32%', change: '+2%', trend: 'up', icon: TrendingUp, color: 'text-amber-600 bg-amber-50' },
    { label: 'Active Clinicians', value: '24', change: '0%', trend: 'neutral', icon: Users, color: 'text-emerald-600 bg-emerald-50' },
  ];

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      await exportAggregateReportPDF();
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Clinical Reports</h2>
          <p className="text-slate-500">Aggregate insights and statistics for your practice</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white border border-slate-200 rounded-xl px-4 py-2 flex items-center gap-2 text-sm text-slate-600">
            <Calendar className="w-4 h-4" />
            Last 30 Days
          </div>
          <button
            onClick={handleExportPDF}
            disabled={isExporting}
            className="bg-emerald-600 text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-100 flex items-center gap-2 disabled:opacity-60"
          >
            {isExporting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <FileDown className="w-4 h-4" />
            )}
            {isExporting ? 'Exporting...' : 'Export PDF Report'}
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className={`${stat.color} p-3 rounded-2xl`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div className={`flex items-center gap-1 text-xs font-bold ${stat.trend === 'up' ? 'text-emerald-600' : stat.trend === 'down' ? 'text-red-600' : 'text-slate-400'}`}>
                {stat.trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : stat.trend === 'down' ? <ArrowDownRight className="w-3 h-3" /> : null}
                {stat.change}
              </div>
            </div>
            <h3 className="text-3xl font-black text-slate-900 tracking-tight">{stat.value}</h3>
            <p className="text-sm text-slate-500 mt-1">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Row 1: Monthly Trend + Pie */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-1">Monthly Assessment Trend</h3>
          <p className="text-xs text-slate-400 mb-4">Total assessments and high-risk identifications over 6 months</p>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={monthlyData}>
              <defs>
                <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="highGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0/0.1)', fontSize: '12px' }} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px', paddingTop: '12px' }} />
              <Area type="monotone" dataKey="assessments" stroke="#10b981" strokeWidth={2.5} fill="url(#totalGrad)" name="Total Assessments" dot={{ r: 4, fill: '#10b981' }} />
              <Area type="monotone" dataKey="highRisk" stroke="#ef4444" strokeWidth={2} fill="url(#highGrad)" name="High Risk Cases" dot={{ r: 3, fill: '#ef4444' }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-1">Risk Distribution</h3>
          <p className="text-xs text-slate-400 mb-2">All assessed patients this period</p>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={riskDistData} cx="50%" cy="45%" innerRadius={55} outerRadius={80} dataKey="value" strokeWidth={0} paddingAngle={3}>
                {riskDistData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Pie>
              <Tooltip formatter={(v: any, name: any) => [`${v} patients`, name]} contentStyle={{ borderRadius: '12px', border: 'none', fontSize: '12px' }} />
              <Legend iconType="circle" iconSize={9} wrapperStyle={{ fontSize: '11px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 2: Age Groups + Risk Factors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-1">Risk by Age Group</h3>
          <p className="text-xs text-slate-400 mb-4">Percentage distribution across age brackets</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={ageGroupData} margin={{ left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="group" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} unit="%" />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', fontSize: '12px' }} formatter={(v: any) => [`${v}%`]} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px', paddingTop: '12px' }} />
              <Bar dataKey="low" stackId="a" fill="#10b981" name="Low Risk" radius={[0, 0, 0, 0]} />
              <Bar dataKey="moderate" stackId="a" fill="#f59e0b" name="Moderate" />
              <Bar dataKey="high" stackId="a" fill="#ef4444" name="High Risk" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-1">Top Risk Factors (Population)</h3>
          <p className="text-xs text-slate-400 mb-4">Average SHAP feature importance across all assessments</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={riskFactorData} layout="vertical" margin={{ left: 0, right: 30 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
              <XAxis type="number" hide domain={[0, 100]} />
              <YAxis dataKey="factor" type="category" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} width={100} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', fontSize: '12px' }} formatter={(v: any) => [`${v}%`, 'Avg Importance']} />
              <Bar dataKey="importance" radius={[0, 6, 6, 0]} barSize={20} name="Avg Importance (%)">
                {riskFactorData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* AI Insights */}
      <div className="bg-emerald-900 p-8 rounded-3xl text-white shadow-xl shadow-emerald-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-800 rounded-full -mr-24 -mt-24 opacity-50" />
        <div className="relative z-10">
          <h3 className="text-lg font-bold mb-4">AI Insights Summary</h3>
          <p className="text-emerald-100 text-sm leading-relaxed mb-6">
            Based on the last 30 days of data, there is a 15% increase in high-risk assessments
            among patients aged 45–60. Early intervention protocols have been triggered for 82% of these cases.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              'Screening efficiency improved by 24% vs. previous period',
              'HbA1c monitoring frequency increased following new protocol',
              'Average assessment time reduced to 3.2 minutes',
              'BMI remains the strongest modifiable risk factor (avg 34.2%)',
            ].map((insight, i) => (
              <div key={i} className="flex items-center gap-3 p-4 bg-emerald-800/50 rounded-2xl border border-emerald-700/50">
                <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                <span className="text-sm font-medium text-emerald-50">{insight}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
