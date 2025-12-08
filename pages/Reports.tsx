import React, { useMemo, useState } from 'react';
import { Student, AttendanceRecord, StudentSummary } from '../types';
import { AVAILABLE_CLASSES } from '../constants';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Filter, FileSpreadsheet } from 'lucide-react';

interface ReportsProps {
  students: Student[];
  records: AttendanceRecord[];
}

const Reports: React.FC<ReportsProps> = ({ students, records }) => {
  const [timeframe, setTimeframe] = useState<'day' | 'week' | 'month'>('week');
  const [selectedClass, setSelectedClass] = useState<string>('Semua Kelas');

  const summaries: StudentSummary[] = useMemo(() => {
    // 1. Filter students by class
    const filteredStudents = selectedClass === 'Semua Kelas'
      ? students
      : students.filter(s => s.classGrade === selectedClass);

    // 2. Calculate dates
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    
    // Calculate past date for ranges
    const cutoffDate = new Date(now);
    if (timeframe === 'week') {
      cutoffDate.setDate(now.getDate() - 7);
    } else if (timeframe === 'month') {
      cutoffDate.setDate(now.getDate() - 30);
    }
    const cutoffStr = cutoffDate.toISOString().split('T')[0];

    return filteredStudents.map(student => {
      // 3. Filter records for student based on timeframe
      const studentRecords = records.filter(r => {
        if (r.studentId !== student.id) return false;
        
        if (timeframe === 'day') {
          // Exact match for today
          return r.date === todayStr;
        } else {
          // Range match for week/month
          return r.date >= cutoffStr;
        }
      });
      
      const totalHadir = studentRecords.filter(r => r.status === 'Hadir').length;
      const totalTidak = studentRecords.filter(r => r.status === 'Tidak').length;
      
      // For daily, usually totalEntries is 1 or 0. For range, it's cumulative.
      const totalEntries = studentRecords.length;
      
      // Calculate rate. Prevent division by zero.
      let attendanceRate = 0;
      if (totalEntries > 0) {
        attendanceRate = Math.round((totalHadir / totalEntries) * 100);
      } else if (timeframe === 'day') {
        // If daily and no record, it's 0% (Belum Absen)
        attendanceRate = 0;
      }

      return {
        student,
        totalHadir,
        totalTidak,
        attendanceRate
      };
    }).sort((a, b) => {
        // Sort logic: 
        // If daily: Sort by name (easier to check list)
        // If weekly/monthly: Sort by most absent (to identify issues)
        if (timeframe === 'day') {
            return a.student.name.localeCompare(b.student.name);
        }
        return b.totalTidak - a.totalTidak;
    });
  }, [students, records, timeframe, selectedClass]);

  const handleExportReport = () => {
    let timeframeLabel = 'Mingguan';
    if (timeframe === 'day') timeframeLabel = 'Harian';
    if (timeframe === 'month') timeframeLabel = 'Bulanan';

    let csvContent = "data:text/csv;charset=utf-8,";
    // Header Laporan
    csvContent += `Laporan Rekapitulasi Absensi (${timeframeLabel})\n`;
    csvContent += `Kelas: ${selectedClass}\n`;
    csvContent += `Tanggal Ekspor: ${new Date().toLocaleDateString('id-ID')}\n\n`;
    
    // Header Tabel
    csvContent += "Nama Siswa,Kelas,Total Hadir,Total Tidak,Persentase Kehadiran\n";

    summaries.forEach(summary => {
      const row = `"${summary.student.name}",${summary.student.classGrade},${summary.totalHadir},${summary.totalTidak},${summary.attendanceRate}%`;
      csvContent += row + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    const fileName = `laporan_rekap_${timeframe}_${selectedClass.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getTimeframeLabel = () => {
      if (timeframe === 'day') return 'Hari Ini';
      if (timeframe === 'week') return '7 Hari Terakhir';
      return '30 Hari Terakhir';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Laporan & Rekapitulasi</h2>
          <p className="text-gray-500">Analisa kehadiran siswa ({getTimeframeLabel()}).</p>
        </div>
        
        {/* Controls Container */}
        <div className="flex flex-col gap-3 w-full xl:w-auto">
            
            {/* Row 1: Export & Class Filter (Side by side on mobile) */}
            <div className="grid grid-cols-2 gap-3">
                 <button 
                  onClick={handleExportReport}
                  className="bg-success hover:bg-emerald-600 text-white px-2 sm:px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 font-medium shadow-sm transition-colors w-full"
                  title="Download format Excel/Google Sheets"
                >
                  <FileSpreadsheet size={18} />
                  <span className="text-xs sm:text-base whitespace-nowrap">Export CSV</span>
                </button>

                 <div className="relative w-full">
                    <select
                      value={selectedClass}
                      onChange={(e) => setSelectedClass(e.target.value)}
                      className="w-full appearance-none bg-white border border-slate-200 text-gray-700 py-2.5 pl-4 pr-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium shadow-sm cursor-pointer text-xs sm:text-base"
                    >
                      <option value="Semua Kelas">Semua Kelas</option>
                      {AVAILABLE_CLASSES.map(cls => (
                        <option key={cls} value={cls}>{cls}</option>
                      ))}
                    </select>
                    <Filter className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
            </div>

            {/* Row 2: Timeframe Toggles */}
            <div className="flex bg-white rounded-xl p-1 border border-slate-200 shadow-sm w-full">
               <button
                onClick={() => setTimeframe('day')}
                className={`flex-1 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                  timeframe === 'day' ? 'bg-primary text-white shadow-sm' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                Harian
              </button>
              <button
                onClick={() => setTimeframe('week')}
                className={`flex-1 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                  timeframe === 'week' ? 'bg-primary text-white shadow-sm' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                Mingguan
              </button>
              <button
                onClick={() => setTimeframe('month')}
                className={`flex-1 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                  timeframe === 'month' ? 'bg-primary text-white shadow-sm' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                Bulanan
              </button>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Summary Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-bold text-gray-800">
              Rekapitulasi Siswa ({getTimeframeLabel()})
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Nama Siswa</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Kelas</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase">Total Hadir</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-red-500 uppercase">Total Tidak</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase">% Kehadiran</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {summaries.length > 0 ? (
                  summaries.map((summary) => (
                    <tr key={summary.student.id} className="hover:bg-slate-50/50">
                      <td className="px-6 py-4 font-medium text-gray-800">{summary.student.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{summary.student.classGrade}</td>
                      <td className="px-6 py-4 text-center text-success font-medium">{summary.totalHadir}</td>
                      <td className="px-6 py-4 text-center">
                         <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${summary.totalTidak > 0 ? 'bg-red-50 text-danger' : 'text-gray-400'}`}>
                           {summary.totalTidak}
                         </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-1.5 overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${summary.attendanceRate > 80 ? 'bg-success' : summary.attendanceRate > 50 ? 'bg-warning' : 'bg-danger'}`} 
                              style={{ width: `${summary.attendanceRate}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-gray-500">{summary.attendanceRate}%</span>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                      Belum ada data absensi untuk kriteria ini.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Aggregate Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="font-bold text-gray-800 mb-6">Grafik Kehadiran {selectedClass}</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={summaries.slice(0, 15)} // Limit to top 15 for chart readability
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="student.name" tick={false} axisLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip 
                   cursor={{ fill: '#F1F5F9' }}
                   contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend />
                <Bar dataKey="totalHadir" name="Hadir" stackId="a" fill="#10B981" />
                <Bar dataKey="totalTidak" name="Tidak Hadir" stackId="a" fill="#EF4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;