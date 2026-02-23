import React, { useMemo, useState } from 'react';
import { Student, AttendanceRecord } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Users, UserCheck, UserX, AlertCircle, Filter, RefreshCw, ChevronDown, Loader2, X, Search } from 'lucide-react';
import ClassSelectorModal from '../components/ClassSelectorModal';

interface DashboardProps {
  students: Student[];
  records: AttendanceRecord[];
  onRefresh: () => void;
  isLoading?: boolean;
}

type DetailType = 'Hadir' | 'Tidak' | 'Belum Absen' | null;

const COLORS = {
  Hadir: '#10B981', // Success
  Tidak: '#EF4444', // Danger
  'Belum Absen': '#94A3B8' // Slate 400
};

const Dashboard: React.FC<DashboardProps> = ({ students, records, onRefresh, isLoading = false }) => {
  const [selectedClass, setSelectedClass] = useState<string>('Semua Kelas');
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [activeDetail, setActiveDetail] = useState<DetailType>(null);
  const [detailSearch, setDetailSearch] = useState('');
  
  const todayStr = new Date().toISOString().split('T')[0];

  // Filter students based on class selection
  const filteredStudents = useMemo(() => {
    return selectedClass === 'Semua Kelas' 
      ? students 
      : students.filter(s => s.classGrade === selectedClass);
  }, [students, selectedClass]);

  // Stats for TODAY
  const todayStats = useMemo(() => {
    // Get records only for filtered students
    const studentIds = filteredStudents.map(s => s.id);
    const todayRecords = records.filter(r => r.date === todayStr && studentIds.includes(r.studentId));
    
    const stats = {
      hadir: todayRecords.filter(r => r.status === 'Hadir').length,
      tidak: todayRecords.filter(r => r.status === 'Tidak').length,
    };
    const totalMarked = todayRecords.length;
    const notMarked = filteredStudents.length - totalMarked;
    return { ...stats, notMarked };
  }, [records, filteredStudents, todayStr]);

  // Data for Pie Chart
  const pieData = [
    { name: 'Hadir', value: todayStats.hadir },
    { name: 'Tidak', value: todayStats.tidak },
    { name: 'Belum Absen', value: todayStats.notMarked },
  ].filter(d => d.value > 0);

  const pieColors = {
    'Hadir': COLORS.Hadir,
    'Tidak': COLORS.Tidak,
    'Belum Absen': COLORS['Belum Absen']
  };

  // Weekly Trend Data
  const weeklyData = useMemo(() => {
    const data: any[] = [];
    const studentIds = filteredStudents.map(s => s.id);

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dStr = d.toISOString().split('T')[0];
      const dayLabel = d.toLocaleDateString('id-ID', { weekday: 'short' });
      
      const daysRecords = records.filter(r => r.date === dStr && studentIds.includes(r.studentId));
      data.push({
        name: dayLabel,
        Hadir: daysRecords.filter(r => r.status === 'Hadir').length,
        Tidak: daysRecords.filter(r => r.status === 'Tidak').length,
      });
    }
    return data;
  }, [records, filteredStudents]);

  // Logic to get students for the modal list
  const getDetailStudents = () => {
    if (!activeDetail) return [];

    const studentIds = filteredStudents.map(s => s.id);
    const todayRecords = records.filter(r => r.date === todayStr && studentIds.includes(r.studentId));

    let resultStudents: Student[] = [];

    if (activeDetail === 'Hadir') {
      const presentIds = todayRecords.filter(r => r.status === 'Hadir').map(r => r.studentId);
      resultStudents = filteredStudents.filter(s => presentIds.includes(s.id));
    } else if (activeDetail === 'Tidak') {
      const absentIds = todayRecords.filter(r => r.status === 'Tidak').map(r => r.studentId);
      resultStudents = filteredStudents.filter(s => absentIds.includes(s.id));
    } else if (activeDetail === 'Belum Absen') {
      const markedIds = todayRecords.map(r => r.studentId);
      resultStudents = filteredStudents.filter(s => !markedIds.includes(s.id));
    }

    // Apply search filter inside modal
    if (detailSearch) {
      return resultStudents.filter(s => s.name.toLowerCase().includes(detailSearch.toLowerCase()));
    }
    return resultStudents;
  };

  const StatCard = ({ title, value, icon: Icon, color, bg, onClick }: any) => (
    <div 
      onClick={onClick}
      className={`bg-white p-3 sm:p-6 rounded-xl sm:rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between h-full relative overflow-hidden transition-all duration-300 hover:shadow-md hover:translate-y-[-2px] ${onClick ? 'cursor-pointer group' : ''}`}
    >
      <div className="flex items-start justify-between mb-2">
         <div className={`p-1.5 sm:p-3 rounded-lg sm:rounded-xl ${bg} transition-transform group-hover:scale-110`}>
          <Icon className={`w-4 h-4 sm:w-6 sm:h-6 ${color}`} />
        </div>
      </div>
      <div>
        {isLoading ? (
          <div className="h-8 w-16 bg-slate-200 rounded-lg animate-pulse mb-1"></div>
        ) : (
          <h3 className="text-xl sm:text-3xl font-bold text-gray-800 leading-tight animate-in fade-in slide-up duration-500">{value}</h3>
        )}
        <p className="text-[10px] sm:text-sm font-medium text-gray-500 leading-tight mt-1">{title}</p>
        
        {onClick && (
            <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity text-xs text-primary font-medium bg-primary/5 px-2 py-1 rounded-md">
                Lihat Detail
            </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Dashboard Overview</h2>
          <p className="text-sm text-gray-500">Ringkasan kehadiran hari ini, {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        
        {/* Class Filter & Refresh */}
        <div className="flex gap-2 w-full md:w-auto">
            <button 
              onClick={onRefresh}
              disabled={isLoading}
              className={`bg-white border border-slate-200 text-gray-500 hover:text-primary hover:border-primary hover:bg-slate-50 p-2.5 rounded-xl transition-all shadow-sm ${isLoading ? 'cursor-not-allowed opacity-80' : ''}`}
              title="Refresh Data dari Server"
            >
               {isLoading ? (
                 <Loader2 size={20} className="animate-spin text-primary" />
               ) : (
                 <RefreshCw size={20} />
               )}
            </button>

            <div className="relative flex-1 md:flex-none md:min-w-[180px]">
              <div className="relative">
                <button
                  onClick={() => setIsClassModalOpen(true)}
                  className="w-full flex items-center justify-between gap-3 bg-white border border-slate-200 text-gray-700 py-2.5 px-4 rounded-xl hover:border-primary hover:text-primary transition-all shadow-sm group"
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
        </div>
      </div>

      {/* Top Stats Cards - Clickable */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        {/* Total Siswa not clickable for specific detail yet, unless needed */}
        <StatCard 
            title="Total Siswa" 
            value={filteredStudents.length} 
            icon={Users} 
            color="text-primary" 
            bg="bg-primary/10" 
        />
        <StatCard 
            title="Hadir" 
            value={todayStats.hadir} 
            icon={UserCheck} 
            color="text-success" 
            bg="bg-success/10" 
            onClick={() => {
                setActiveDetail('Hadir');
                setDetailSearch('');
            }}
        />
        <StatCard 
            title="Tidak Hadir" 
            value={todayStats.tidak} 
            icon={UserX} 
            color="text-danger" 
            bg="bg-danger/10" 
            onClick={() => {
                setActiveDetail('Tidak');
                setDetailSearch('');
            }}
        />
        <StatCard 
            title="Belum Absen" 
            value={todayStats.notMarked} 
            icon={AlertCircle} 
            color="text-gray-500" 
            bg="bg-gray-100" 
            onClick={() => {
                setActiveDetail('Belum Absen');
                setDetailSearch('');
            }}
        />
      </div>

      {/* Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Daily Distribution */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 lg:col-span-1 transition-all hover:shadow-md">
          <h3 className="font-semibold text-gray-800 mb-4">Status Hari Ini</h3>
          <div className="h-64 w-full">
            {isLoading ? (
              <div className="w-full h-full flex items-center justify-center bg-slate-50 rounded-xl animate-pulse">
                <div className="w-32 h-32 rounded-full border-4 border-slate-200"></div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    animationDuration={1000}
                    animationBegin={0}
                    onClick={(data) => {
                        if (data && data.name) {
                            setActiveDetail(data.name as DetailType);
                            setDetailSearch('');
                        }
                    }}
                    className="cursor-pointer focus:outline-none"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={(pieColors as any)[entry.name]} className="hover:opacity-80 transition-opacity" />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Weekly Trend */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 lg:col-span-2 transition-all hover:shadow-md">
          <h3 className="font-semibold text-gray-800 mb-4">Tren 7 Hari Terakhir ({selectedClass})</h3>
          <div className="h-64 w-full">
            {isLoading ? (
              <div className="w-full h-full flex items-end justify-between bg-slate-50 rounded-xl animate-pulse px-6 py-4 gap-4">
                 {[...Array(7)].map((_, i) => (
                    <div key={i} className="w-full bg-slate-200 rounded-t-lg" style={{ height: `${Math.random() * 60 + 20}%` }}></div>
                 ))}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B' }} />
                  <RechartsTooltip 
                    cursor={{ fill: '#F1F5F9' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="Hadir" fill={COLORS.Hadir} radius={[4, 4, 0, 0]} barSize={30} animationDuration={1000} />
                  <Bar dataKey="Tidak" fill={COLORS.Tidak} radius={[4, 4, 0, 0]} barSize={30} animationDuration={1000} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {activeDetail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-md flex flex-col max-h-[85vh]">
                  {/* Modal Header */}
                  <div className="p-5 border-b border-gray-100 flex justify-between items-center">
                      <div>
                          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                            {activeDetail === 'Hadir' && <UserCheck className="text-success" size={20} />}
                            {activeDetail === 'Tidak' && <UserX className="text-danger" size={20} />}
                            {activeDetail === 'Belum Absen' && <AlertCircle className="text-gray-400" size={20} />}
                            Siswa {activeDetail === 'Tidak' ? 'Tidak Hadir' : activeDetail}
                          </h3>
                          <p className="text-xs text-gray-500 mt-0.5">
                              {selectedClass} • {new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}
                          </p>
                      </div>
                      <button 
                        onClick={() => setActiveDetail(null)}
                        className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
                      >
                          <X size={20} />
                      </button>
                  </div>

                  {/* Search inside Modal */}
                  <div className="p-4 bg-gray-50/50 border-b border-gray-100">
                      <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                          <input
                            type="text"
                            placeholder="Cari nama siswa..."
                            value={detailSearch}
                            onChange={(e) => setDetailSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                          />
                      </div>
                  </div>

                  {/* List Content */}
                  <div className="overflow-y-auto p-2 flex-1">
                      {getDetailStudents().length > 0 ? (
                          <div className="space-y-1">
                              {getDetailStudents().map((student, index) => (
                                  <div key={student.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl transition-colors">
                                      {/* Nomor Urut */}
                                      <span className="text-gray-400 font-medium text-sm w-6 text-center">{index + 1}</span>
                                      
                                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0
                                          ${activeDetail === 'Hadir' ? 'bg-success/10 text-success' : 
                                            activeDetail === 'Tidak' ? 'bg-danger/10 text-danger' : 
                                            'bg-gray-100 text-gray-500'}
                                      `}>
                                          {student.name.charAt(0)}
                                      </div>
                                      <div>
                                          <p className="font-semibold text-gray-800 text-sm">{student.name}</p>
                                          <p className="text-xs text-gray-500">{student.classGrade}</p>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      ) : (
                          <div className="flex flex-col items-center justify-center py-12 text-center text-gray-400">
                              <Users size={32} className="mb-2 opacity-50" />
                              <p className="text-sm">Tidak ada siswa ditemukan.</p>
                          </div>
                      )}
                  </div>
                  
                  {/* Footer Stats */}
                  <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
                      <p className="text-xs text-center text-gray-500 font-medium">
                          Total: {getDetailStudents().length} Siswa
                      </p>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Dashboard;