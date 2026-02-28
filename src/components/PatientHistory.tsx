import React, { useEffect, useState } from 'react';
import { History, Search, Calendar, ChevronRight, Filter, Download } from 'lucide-react';
import { motion } from 'motion/react';

export default function PatientHistory() {
  const [history, setHistory] = useState<any[]>([]);

  const handleExportCSV = () => {
    if (history.length === 0) return;
    
    const headers = ['Date', 'Patient ID', 'Risk Score', 'Category', 'BMI', 'Glucose'];
    const rows = history.map(item => [
      item.date,
      item.name,
      `${item.risk}%`,
      item.category,
      item.bmi,
      `${item.glucose} mg/dL`
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `preventai_patient_history_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    const saved = localStorage.getItem('preventai_history');
    if (saved) {
      setHistory(JSON.parse(saved));
    } else {
      // Mock data if empty
      const mock = [
        { id: 1, date: '2026-02-25', name: 'Patient #8291', risk: 68, category: 'High', bmi: 29.4, glucose: 145 },
        { id: 2, date: '2026-02-24', name: 'Patient #7721', risk: 12, category: 'Low', bmi: 22.1, glucose: 92 },
        { id: 3, date: '2026-02-22', name: 'Patient #9012', risk: 45, category: 'Moderate', bmi: 26.8, glucose: 118 },
      ];
      setHistory(mock);
    }
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Patient History</h2>
          <p className="text-slate-500">View and manage previous risk assessments</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => alert('Filtering options will be available soon.')}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            <Filter className="w-4 h-4" />
            Filter
          </button>
          <button 
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-100"
          >
            <Download className="w-4 h-4" />
            Export All
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by patient ID or date..."
              className="w-full bg-white border border-slate-200 rounded-xl pl-11 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Patient ID</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Risk Score</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Category</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">BMI</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Glucose</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {history.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Calendar className="w-4 h-4 text-slate-300" />
                      {item.date}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-900 text-sm">{item.name}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${
                            item.risk > 60 ? 'bg-red-500' : item.risk > 30 ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${item.risk}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold text-slate-700">{item.risk}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                      item.category === 'High' ? 'bg-red-50 text-red-600 border-red-100' :
                      item.category === 'Moderate' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                      'bg-emerald-50 text-emerald-600 border-emerald-100'
                    }`}>
                      {item.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">{item.bmi}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">{item.glucose} mg/dL</td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => alert(`Viewing details for ${item.name}`)}
                      className="p-2 text-slate-300 hover:text-emerald-600 transition-colors"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
