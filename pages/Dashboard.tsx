import React, { useMemo, useState } from 'react';
import { Student, AttendanceRecord } from '../types';
import { AVAILABLE_CLASSES } from '../constants';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Users, UserCheck, UserX, AlertCircle, Filter } from 'lucide-react';

interface DashboardProps {
  students: Student[];
  records: AttendanceRecord[];
}

const COLORS = {
  Hadir: '#10B981', // Success
  Tidak: '#EF4444', // Danger
};

const Dashboard: React.FC<DashboardProps> = ({ students, records }) => {
  const [selectedClass, setSelectedClass] = useState<string>('Semua Kelas');
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
    'Belum Absen': '#CBD5E1'
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

  const StatCard = ({ title, value, icon: Icon, color, bg }: any) => (
    <div className="bg-white p-3 sm:p-6 rounded-xl sm:rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between h-full relative overflow-hidden">
      <div className="flex items-start justify-between mb-2">
         <div className={`p-1.5 sm:p-3 rounded-lg sm:rounded-xl ${bg}`}>
          <Icon className={`w-4 h-4 sm:w-6 sm:h-6 ${color}`} />
        </div>
      </div>
      <div>
        <h3 className="text-xl sm:text-3xl font-bold text-gray-800 leading-tight">{value}</h3>
        <p className="text-[10px] sm:text-sm font-medium text-gray-500 leading-tight mt-1">{title}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Dashboard Overview</h2>
          <p className="text-sm text-gray-500">Ringkasan kehadiran hari ini, {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        
        {/* Class Filter */}
        <div className="relative w-full md:w-auto">
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full appearance-none bg-white border border-slate-200 text-gray-700 py-2.5 pl-4 pr-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium shadow-sm cursor-pointer"
            >
              <option value="Semua Kelas">Semua Kelas</option>
              {AVAILABLE_CLASSES.map(cls => (
                <option key={cls} value={cls}>{cls}</option>
              ))}
            </select>
            <Filter className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* Top Stats Cards - Grid changed to 2 columns on mobile */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <StatCard title="Total Siswa" value={filteredStudents.length} icon={Users} color="text-primary" bg="bg-primary/10" />
        <StatCard title="Hadir" value={todayStats.hadir} icon={UserCheck} color="text-success" bg="bg-success/10" />
        <StatCard title="Tidak Hadir" value={todayStats.tidak} icon={UserX} color="text-danger" bg="bg-danger/10" />
        <StatCard title="Belum Absen" value={todayStats.notMarked} icon={AlertCircle} color="text-gray-500" bg="bg-gray-100" />
      </div>

      {/* Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Daily Distribution */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 lg:col-span-1">
          <h3 className="font-semibold text-gray-800 mb-4">Status Hari Ini</h3>
          <div className="h-64 w-full">
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
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={(pieColors as any)[entry.name]} />
                  ))}
                </Pie>
                <RechartsTooltip />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Weekly Trend */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 lg:col-span-2">
          <h3 className="font-semibold text-gray-800 mb-4">Tren 7 Hari Terakhir ({selectedClass})</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B' }} />
                <RechartsTooltip 
                  cursor={{ fill: '#F1F5F9' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="Hadir" fill={COLORS.Hadir} radius={[4, 4, 0, 0]} barSize={30} />
                <Bar dataKey="Tidak" fill={COLORS.Tidak} radius={[4, 4, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;