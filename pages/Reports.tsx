import React, { useMemo, useState } from 'react';
import { Student, AttendanceRecord, StudentSummary } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Filter, FileSpreadsheet, ChevronDown, ArrowUpDown, ArrowUp, ArrowDown, History, ClipboardList, Search, User } from 'lucide-react';
import ClassSelectorModal from '../components/ClassSelectorModal';
import ConfirmationModal from '../components/ConfirmationModal';

interface ReportsProps {
  students: Student[];
  records: AttendanceRecord[];
  userRole: 'admin' | 'user';
}

type SortKey = 'name' | 'classGrade' | 'totalHadir' | 'totalTidak' | 'attendanceRate';
type SortDirection = 'asc' | 'desc';
type ReportTab = 'summary' | 'history';

const Reports: React.FC<ReportsProps> = ({ students, records, userRole }) => {
  const [activeTab, setActiveTab] = useState<ReportTab>('summary');
  const [timeframe, setTimeframe] = useState<'day' | 'week' | 'month'>('week');
  const [selectedClass, setSelectedClass] = useState<string>('Semua Kelas');
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [isExportConfirmOpen, setIsExportConfirmOpen] = useState(false);
  
  // History Search
  const [historySearch, setHistorySearch] = useState('');

  // Sorting State
  const [sortKey, setSortKey] = useState<SortKey>('totalTidak'); 
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // --- SUMMARY DATA LOGIC ---
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
        let valA: any;
        let valB: any;

        switch (sortKey) {
            case 'name':
                valA = a.student.name.toLowerCase();
                valB = b.student.name.toLowerCase();
                break;
            case 'classGrade':
                valA = a.student.classGrade.toLowerCase();
                valB = b.student.classGrade.toLowerCase();
                break;
             case 'totalHadir':
                valA = a.totalHadir;
                valB = b.totalHadir;
                break;
             case 'totalTidak':
                valA = a.totalTidak;
                valB = b.totalTidak;
                break;
             case 'attendanceRate':
                valA = a.attendanceRate;
                valB = b.attendanceRate;
                break;
             default:
                valA = a.student.name;
                valB = b.student.name;
        }

        if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
    });
  }, [students, records, timeframe, selectedClass, sortKey, sortDirection]);

  // --- HISTORY DATA LOGIC ---
  const historyLogs = useMemo(() => {
    // Clone and sort records by timestamp desc (newest first)
    // If no timestamp, fallback to date
    let logs = [...records].sort((a, b) => {
       const timeA = a.timestamp ? new Date(a.timestamp).getTime() : new Date(a.date).getTime();
       const timeB = b.timestamp ? new Date(b.timestamp).getTime() : new Date(b.date).getTime();
       return timeB - timeA;
    });

    // Filter by class (if not 'Semua Kelas')
    if (selectedClass !== 'Semua Kelas') {
        logs = logs.filter(r => {
            const s = students.find(std => std.id === r.studentId);
            return s && s.classGrade === selectedClass;
        });
    }

    // Filter by Search (User or Student Name)
    if (historySearch) {
        const lowerSearch = historySearch.toLowerCase();
        logs = logs.filter(r => {
             const s = students.find(std => std.id === r.studentId);
             const studentName = s ? s.name.toLowerCase() : '';
             const recordedBy = r.recordedBy ? r.recordedBy.toLowerCase() : '';
             return studentName.includes(lowerSearch) || recordedBy.includes(lowerSearch);
        });
    }

    // Map to include student detail
    return logs.map(r => {
        const s = students.find(std => std.id === r.studentId);
        return {
            ...r,
            studentName: s ? s.name : 'Siswa Dihapus',
            studentClass: s ? s.classGrade : '-'
        };
    });
  }, [records, students, selectedClass, historySearch]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      if (['totalHadir', 'totalTidak', 'attendanceRate'].includes(key)) {
        setSortDirection('desc');
      } else {
        setSortDirection('asc');
      }
    }
  };

  const SortIcon = ({ column }: { column: SortKey }) => {
    if (sortKey !== column) return <ArrowUpDown size={14} className="text-gray-300 ml-1 opacity-50 group-hover:opacity-100 transition-opacity" />;
    return sortDirection === 'asc' 
      ? <ArrowUp size={14} className="text-primary ml-1" /> 
      : <ArrowDown size={14} className="text-primary ml-1" />;
  };

  const executeExportReport = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    
    if (activeTab === 'summary') {
        let timeframeLabel = 'Mingguan';
        if (timeframe === 'day') timeframeLabel = 'Harian';
        if (timeframe === 'month') timeframeLabel = 'Bulanan';

        csvContent += `Laporan Rekapitulasi Absensi (${timeframeLabel})\n`;
        csvContent += `Kelas: ${selectedClass}\n`;
        csvContent += `Tanggal Ekspor: ${new Date().toLocaleDateString('id-ID')}\n\n`;
        csvContent += "No,Nama Siswa,Kelas,Total Hadir,Total Tidak,Persentase Kehadiran\n";

        summaries.forEach((summary, index) => {
            const row = `${index + 1},"${summary.student.name}",${summary.student.classGrade},${summary.totalHadir},${summary.totalTidak},${summary.attendanceRate}%`;
            csvContent += row + "\n";
        });
    } else {
        csvContent += `Laporan Riwayat Input Absensi\n`;
        csvContent += `Kelas: ${selectedClass}\n`;
        csvContent += `Tanggal Ekspor: ${new Date().toLocaleDateString('id-ID')}\n\n`;
        csvContent += "Waktu Input,Petugas,Nama Siswa,Kelas,Tanggal Absensi,Status\n";

        historyLogs.forEach((log) => {
            const timeStr = log.timestamp ? new Date(log.timestamp).toLocaleString('id-ID') : '-';
            const userStr = log.recordedBy || 'Sistem';
            const row = `"${timeStr}","${userStr}","${log.studentName}",${log.studentClass},${log.date},${log.status}`;
            csvContent += row + "\n";
        });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    const fileName = `laporan_${activeTab}_${selectedClass.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
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
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Laporan & Rekap</h2>
          <p className="text-xs sm:text-sm text-gray-500">Analisa kehadiran dan riwayat aktivitas user.</p>
        </div>
        
        {/* Controls Container */}
        <div className="flex flex-col gap-2 sm:gap-3 w-full xl:w-auto">
             {/* Tab Switcher */}
            <div className={`bg-white p-1 rounded-xl border border-slate-200 shadow-sm flex ${userRole !== 'admin' ? 'w-full xl:w-auto' : ''}`}>
                <button
                    onClick={() => setActiveTab('summary')}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 rounded-lg text-sm font-medium transition-all ${
                        activeTab === 'summary' ? 'bg-primary text-white shadow-sm' : 'text-gray-500 hover:bg-gray-50'
                    }`}
                >
                    <ClipboardList size={16} />
                    Rekapitulasi
                </button>
                {userRole === 'admin' && (
                  <button
                      onClick={() => setActiveTab('history')}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 rounded-lg text-sm font-medium transition-all ${
                          activeTab === 'history' ? 'bg-primary text-white shadow-sm' : 'text-gray-500 hover:bg-gray-50'
                      }`}
                  >
                      <History size={16} />
                      Riwayat Input
                  </button>
                )}
            </div>
        </div>
      </div>

      {/* FILTER BAR (Shared) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
         {/* Left Side: Export & Class Filter */}
         <div className="md:col-span-5 lg:col-span-4 flex gap-2">
             {userRole === 'admin' && (
               <button 
                onClick={() => setIsExportConfirmOpen(true)}
                className="bg-success hover:bg-emerald-600 text-white px-3 rounded-xl flex items-center justify-center gap-2 font-medium shadow-sm transition-colors"
                title="Download CSV"
              >
                <FileSpreadsheet size={18} />
              </button>
             )}

            <div className="relative flex-1">
               <button
                  onClick={() => setIsClassModalOpen(true)}
                  className="w-full flex items-center justify-between bg-white border border-slate-200 text-gray-700 py-2.5 px-4 rounded-xl hover:border-primary hover:text-primary transition-all shadow-sm group"
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <Filter size={16} className="text-gray-400 group-hover:text-primary flex-shrink-0" />
                    <span className="font-medium truncate">{selectedClass}</span>
                  </div>
                  <ChevronDown size={16} className="text-gray-400 group-hover:text-primary flex-shrink-0" />
              </button>
              <ClassSelectorModal 
                isOpen={isClassModalOpen} 
                onClose={() => setIsClassModalOpen(false)} 
                selectedClass={selectedClass} 
                onSelect={setSelectedClass} 
              />
            </div>
         </div>
         
         {/* Right Side: Specific Filters based on Active Tab */}
         <div className="md:col-span-7 lg:col-span-8">
            {activeTab === 'summary' ? (
                // Timeframe Toggle for Summary
                <div className="flex bg-white rounded-xl p-1 border border-slate-200 shadow-sm w-full h-full">
                    <button onClick={() => setTimeframe('day')} className={`flex-1 py-2.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${timeframe === 'day' ? 'bg-indigo-50 text-indigo-600 font-bold shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}>Harian</button>
                    <button onClick={() => setTimeframe('week')} className={`flex-1 py-2.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${timeframe === 'week' ? 'bg-indigo-50 text-indigo-600 font-bold shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}>Mingguan</button>
                    <button onClick={() => setTimeframe('month')} className={`flex-1 py-2.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${timeframe === 'month' ? 'bg-indigo-50 text-indigo-600 font-bold shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}>Bulanan</button>
                </div>
            ) : (
                // Search Input for History
                <div className="relative w-full h-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input 
                        type="text" 
                        placeholder="Cari petugas atau nama siswa..." 
                        value={historySearch}
                        onChange={(e) => setHistorySearch(e.target.value)}
                        className="w-full h-full py-2.5 pl-10 pr-4 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm shadow-sm"
                    />
                </div>
            )}
         </div>
      </div>

      {activeTab === 'summary' ? (
        /* --- VIEW 1: REKAPITULASI (EXISTING) --- */
        <div className="grid grid-cols-1 gap-4 sm:gap-6 animate-in fade-in slide-up duration-300">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-slate-100">
            <div className="p-3 sm:p-6 border-b border-slate-100 bg-white">
                <h3 className="font-bold text-gray-800 text-sm sm:text-base">
                Statistik {getTimeframeLabel()}
                </h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                    <th className="px-3 sm:px-6 py-3 text-center text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider w-12 sm:w-16">No</th>
                    <th 
                        className="px-3 sm:px-6 py-3 text-left text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 group select-none"
                        onClick={() => handleSort('name')}
                    >
                        <div className="flex items-center gap-1">Nama <SortIcon column="name" /></div>
                    </th>
                    <th className="hidden sm:table-cell px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 group select-none" onClick={() => handleSort('classGrade')}>
                        <div className="flex items-center gap-1">Kelas <SortIcon column="classGrade" /></div>
                    </th>
                    <th className="px-2 sm:px-6 py-3 text-center text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 group select-none" onClick={() => handleSort('totalHadir')}>
                        <div className="flex items-center justify-center gap-1">Hadir <SortIcon column="totalHadir" /></div>
                    </th>
                    <th className="px-2 sm:px-6 py-3 text-center text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 group select-none" onClick={() => handleSort('totalTidak')}>
                        <div className="flex items-center justify-center gap-1">Tidak <SortIcon column="totalTidak" /></div>
                    </th>
                    <th className="px-2 sm:px-6 py-3 text-center text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 group select-none" onClick={() => handleSort('attendanceRate')}>
                        <div className="flex items-center justify-center gap-1">% <SortIcon column="attendanceRate" /></div>
                    </th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                    {summaries.length > 0 ? (
                    summaries.map((summary, index) => (
                        <tr key={summary.student.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-center text-xs sm:text-sm text-gray-500 font-medium">{index + 1}</td>
                        <td className="px-3 sm:px-6 py-2 sm:py-4">
                            <span className="font-semibold text-xs sm:text-sm text-gray-800 block">{summary.student.name}</span>
                            <span className="sm:hidden text-[10px] text-gray-500 bg-gray-100 px-1 rounded inline-block">{summary.student.classGrade}</span>
                        </td>
                        <td className="hidden sm:table-cell px-6 py-3 text-sm text-gray-500">{summary.student.classGrade}</td>
                        <td className="px-2 sm:px-6 py-2 sm:py-4 text-center text-success font-bold text-xs sm:text-base">{summary.totalHadir}</td>
                        <td className="px-2 sm:px-6 py-2 sm:py-4 text-center">
                            <span className={`inline-block px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold ${summary.totalTidak > 0 ? 'bg-red-50 text-danger' : 'text-gray-400'}`}>
                            {summary.totalTidak}
                            </span>
                        </td>
                        <td className="px-2 sm:px-6 py-2 sm:py-4 text-center">
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2">
                            <div className="hidden sm:block w-16 bg-gray-200 rounded-full h-1.5 overflow-hidden">
                                <div className={`h-full rounded-full ${summary.attendanceRate > 80 ? 'bg-success' : summary.attendanceRate > 50 ? 'bg-warning' : 'bg-danger'}`} style={{ width: `${summary.attendanceRate}%` }} />
                            </div>
                            <span className="text-[10px] sm:text-xs font-medium text-gray-500">{summary.attendanceRate}%</span>
                            </div>
                        </td>
                        </tr>
                    ))
                    ) : (
                    <tr><td colSpan={6} className="px-6 py-8 text-center text-xs sm:text-sm text-gray-400">Belum ada data absensi.</td></tr>
                    )}
                </tbody>
                </table>
            </div>
            </div>

            {/* Aggregate Chart */}
            <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-slate-100">
            <h3 className="font-bold text-gray-800 mb-4 text-sm sm:text-base">Grafik Kehadiran {selectedClass}</h3>
            <div className="h-60 sm:h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                <BarChart data={summaries.slice(0, 15)} margin={{ top: 20, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="student.name" tick={false} axisLine={false} />
                    <YAxis axisLine={false} tickLine={false} style={{ fontSize: '10px' }} />
                    <Tooltip cursor={{ fill: '#F1F5F9' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Bar dataKey="totalHadir" name="Hadir" stackId="a" fill="#10B981" />
                    <Bar dataKey="totalTidak" name="Tidak Hadir" stackId="a" fill="#EF4444" radius={[4, 4, 0, 0]} />
                </BarChart>
                </ResponsiveContainer>
            </div>
            </div>
        </div>
      ) : (
        /* --- VIEW 2: RIWAYAT INPUT (NEW) --- */
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-slate-100 animate-in fade-in slide-up duration-300">
             <div className="p-3 sm:p-6 border-b border-slate-100 bg-white">
                <h3 className="font-bold text-gray-800 text-sm sm:text-base">
                   Log Aktivitas Pengguna
                </h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Waktu Input</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Petugas</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Siswa</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {historyLogs.length > 0 ? (
                            historyLogs.slice(0, 50).map((log, index) => ( // Limit display to last 50 for performance
                                <tr key={index} className="hover:bg-slate-50">
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <div className="flex flex-col">
                                            <span className="text-xs sm:text-sm font-medium text-gray-800">
                                                {log.timestamp 
                                                    ? new Date(log.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) 
                                                    : '-'}
                                            </span>
                                            <span className="text-[10px] text-gray-400">
                                                {log.timestamp 
                                                    ? new Date(log.timestamp).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) 
                                                    : log.date}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-500 flex items-center justify-center">
                                                <User size={12} />
                                            </div>
                                            <span className="text-xs sm:text-sm text-gray-700 font-medium">
                                                {log.recordedBy || 'Sistem'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <div className="flex flex-col">
                                            <span className="text-xs sm:text-sm font-medium text-gray-800">{log.studentName}</span>
                                            <span className="text-[10px] text-gray-400">{log.studentClass}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                                            log.status === 'Hadir' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                                        }`}>
                                            {log.status}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={4} className="px-6 py-8 text-center text-xs sm:text-sm text-gray-400">
                                    Tidak ada riwayat aktivitas ditemukan.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
                <p className="text-[10px] text-gray-400">Menampilkan 50 aktivitas terakhir</p>
            </div>
        </div>
      )}
      
      {/* Export Confirmation Modal */}
      <ConfirmationModal
        isOpen={isExportConfirmOpen}
        onClose={() => setIsExportConfirmOpen(false)}
        onConfirm={executeExportReport}
        title="Konfirmasi Export"
        message={`Apakah Anda yakin ingin mengunduh laporan ${activeTab === 'summary' ? 'rekapitulasi' : 'riwayat input'} dalam format CSV?`}
        confirmText="Ya, Download"
        variant="info"
      />
    </div>
  );
};

export default Reports;