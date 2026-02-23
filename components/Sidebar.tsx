import React from 'react';
import { LayoutDashboard, Users, PieChart, GraduationCap, Settings } from 'lucide-react';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  academicYear: string;
  schoolName: string;
  userRole?: 'admin' | 'user';
}

const Sidebar: React.FC<SidebarProps> = ({ 
  currentPage, 
  onNavigate, 
  academicYear, 
  schoolName,
  userRole = 'admin' 
}) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'students', label: 'Daftar Siswa', icon: Users },
    { id: 'reports', label: 'Laporan & Rekap', icon: PieChart },
    { id: 'settings', label: 'Pengaturan', icon: Settings }, // Restricted removed
  ];

  return (
    <div className="w-64 bg-white h-screen shadow-lg flex flex-col">
      <div className="p-6 border-b border-gray-100 flex items-center gap-3">
        <div className="bg-primary/10 p-2 rounded-lg">
          <GraduationCap className="text-primary w-6 h-6" />
        </div>
        <div className="flex flex-col">
          <h1 className="text-xl font-bold text-gray-800 tracking-tight leading-none">AbsensiKu</h1>
          <span className="text-[10px] uppercase font-bold text-gray-400 mt-1 tracking-widest">{userRole}</span>
        </div>
      </div>
      
      <div className="flex-1 flex flex-col p-4">
        <nav className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isActive 
                    ? 'bg-primary text-white shadow-primary/30 shadow-md' 
                    : 'text-gray-500 hover:bg-gray-50 hover:text-primary'
                }`}
              >
                <Icon size={20} className={isActive ? 'text-white' : 'text-gray-400 group-hover:text-primary'} />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Spacer to center the school info vertically in the remaining space */}
        <div className="flex-1 flex flex-col justify-center">
           <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 w-full">
              <p className="text-sm font-bold text-gray-800 mb-0.5 break-words">{schoolName}</p>
              <p className="text-xs text-gray-500 font-medium">Tahun Ajaran {academicYear}</p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;