import React from 'react';
import { FileText, TrendingUp, Users, Activity, Download, Calendar, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { motion } from 'motion/react';

export default function Reports() {
  const stats = [
    { label: 'Total Assessments', value: '1,284', change: '+12%', trend: 'up', icon: FileText, color: 'text-blue-600 bg-blue-50' },
    { label: 'High Risk Patients', value: '156', change: '-4%', trend: 'down', icon: Activity, color: 'text-red-600 bg-red-50' },
    { label: 'Avg. Risk Score', value: '32%', change: '+2%', trend: 'up', icon: TrendingUp, color: 'text-amber-600 bg-amber-50' },
    { label: 'Active Clinicians', value: '24', change: '0%', trend: 'neutral', icon: Users, color: 'text-emerald-600 bg-emerald-50' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Clinical Reports</h2>
          <p className="text-slate-500">Aggregate insights and statistics for your practice</p>
        </div>
        <div className="flex items-center gap-3">
          <div 
            onClick={() => alert('Date range selection will be available soon.')}
            className="bg-white border border-slate-200 rounded-xl px-4 py-2 flex items-center gap-2 text-sm text-slate-600 cursor-pointer hover:bg-slate-50"
          >
            <Calendar className="w-4 h-4" />
            Last 30 Days
          </div>
          <button 
            onClick={() => alert('Generating PDF report...')}
            className="bg-emerald-600 text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-100 flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download PDF
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`${stat.color} p-3 rounded-2xl`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div className={`flex items-center gap-1 text-xs font-bold ${
                stat.trend === 'up' ? 'text-emerald-600' : stat.trend === 'down' ? 'text-red-600' : 'text-slate-400'
              }`}>
                {stat.trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : stat.trend === 'down' ? <ArrowDownRight className="w-3 h-3" /> : null}
                {stat.change}
              </div>
            </div>
            <h3 className="text-3xl font-black text-slate-900 tracking-tight">{stat.value}</h3>
            <p className="text-sm text-slate-500 mt-1">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Risk Distribution</h3>
          <div className="space-y-6">
            {[
              { label: 'Low Risk', count: 842, color: 'bg-emerald-500', percent: 65 },
              { label: 'Moderate Risk', count: 286, color: 'bg-amber-500', percent: 22 },
              { label: 'High Risk', count: 156, color: 'bg-red-500', percent: 13 },
            ].map((item, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-bold text-slate-700">{item.label}</span>
                  <span className="text-slate-500">{item.count} patients ({item.percent}%)</span>
                </div>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${item.percent}%` }}
                    transition={{ duration: 1, delay: 0.5 }}
                    className={`h-full rounded-full ${item.color}`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-emerald-900 p-8 rounded-[2.5rem] text-white shadow-xl shadow-emerald-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-800 rounded-full -mr-24 -mt-24 opacity-50" />
          <div className="relative z-10">
            <h3 className="text-lg font-bold mb-4">AI Insights Summary</h3>
            <p className="text-emerald-100 text-sm leading-relaxed mb-6">
              Based on the last 30 days of data, there is a 15% increase in high-risk assessments 
              among patients aged 45-60. Early intervention protocols have been triggered for 
              82% of these cases.
            </p>
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-emerald-800/50 rounded-2xl border border-emerald-700/50">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-sm font-medium">Screening efficiency improved by 24%</span>
              </div>
              <div className="flex items-center gap-3 p-4 bg-emerald-800/50 rounded-2xl border border-emerald-700/50">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-sm font-medium">HbA1c monitoring frequency increased</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
