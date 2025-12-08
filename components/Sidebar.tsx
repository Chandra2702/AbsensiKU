import React from 'react';
import { LayoutDashboard, Users, PieChart, GraduationCap, LogOut } from 'lucide-react';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  onLogout?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentPage, onNavigate, onLogout }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'students', label: 'Daftar Siswa', icon: Users },
    { id: 'reports', label: 'Laporan & Rekap', icon: PieChart },
  ];

  return (
    <div className="w-64 bg-white h-screen shadow-lg flex flex-col">
      <div className="p-6 border-b border-gray-100 flex items-center gap-3">
        <div className="bg-primary/10 p-2 rounded-lg">
          <GraduationCap className="text-primary w-6 h-6" />
        </div>
        <h1 className="text-xl font-bold text-gray-800 tracking-tight">AbsensiKu</h1>
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
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

      <div className="p-4 border-t border-gray-100 space-y-4">
        {onLogout && (
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-500 hover:bg-red-50 hover:text-red-500 transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium">Keluar</span>
          </button>
        )}

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
          <p className="text-sm font-bold text-gray-800 mb-0.5">SMP Terpadu AKN Marzuqi</p>
          <p className="text-xs text-gray-500 font-medium">Tahun Ajaran 2024/2025</p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;