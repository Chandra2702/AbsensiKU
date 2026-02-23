import React, { useState, useRef, useEffect } from 'react';
import { AVAILABLE_CLASSES } from '../constants';
import { 
  Save, Trash2, Calendar, UserCheck, 
  ArrowRight, ChevronLeft, ChevronRight, Building2, Users, Plus, X, 
  Shield, LogOut, CircleUser, ChevronDown, Loader2
} from 'lucide-react';
import ClassSelectorModal from '../components/ClassSelectorModal';
import ConfirmationModal from '../components/ConfirmationModal';
import SuccessModal from '../components/SuccessModal';
import { UserAccount } from '../types';

interface SettingsProps {
  currentAcademicYear: string;
  onUpdateAcademicYear: (year: string) => void;
  currentSchoolName: string;
  onUpdateSchoolName: (name: string) => void;
  onDeleteClassData: (classGrade: string) => void;
  onPromoteClass: (fromClass: string, toClass: string) => void;
  userAccounts: UserAccount[];
  onSaveUser: (user: UserAccount) => Promise<boolean>; // Updated to Promise
  onDeleteUser: (userId: string) => Promise<void>; // Updated to Promise
  currentUserUsername: string;
  userRole: 'admin' | 'user';
  onLogout: () => void;
}

const Settings: React.FC<SettingsProps> = ({ 
  currentAcademicYear, 
  onUpdateAcademicYear,
  currentSchoolName,
  onUpdateSchoolName,
  onDeleteClassData,
  onPromoteClass,
  userAccounts,
  onSaveUser,
  onDeleteUser,
  currentUserUsername,
  userRole,
  onLogout
}) => {
  // --- UI STATES ---
  const [activeModal, setActiveModal] = useState<'school' | 'year' | 'users' | 'promote' | 'deleteClass' | null>(null);
  
  // --- FORM STATES ---
  const [schoolNameInput, setSchoolNameInput] = useState(currentSchoolName);
  const [yearInput, setYearInput] = useState(currentAcademicYear);
  
  // Year Picker Logic
  const [isYearPickerOpen, setIsYearPickerOpen] = useState(false);
  const [pickerPageYear, setPickerPageYear] = useState(new Date().getFullYear());

  // Promotion States
  const [promoteSource, setPromoteSource] = useState(AVAILABLE_CLASSES[0]);
  const [promoteTarget, setPromoteTarget] = useState(AVAILABLE_CLASSES[1] || AVAILABLE_CLASSES[0]);
  const [isPromoteSourceOpen, setIsPromoteSourceOpen] = useState(false);
  const [isPromoteTargetOpen, setIsPromoteTargetOpen] = useState(false);

  // Delete Class State
  const [classToDelete, setClassToDelete] = useState(AVAILABLE_CLASSES[0]);
  const [isDeleteClassSelectorOpen, setIsDeleteClassSelectorOpen] = useState(false);

  // User Mgmt States
  const [isUserFormOpen, setIsUserFormOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [newUserUsername, setNewUserUsername] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'user'>('user');
  const [isUserSaving, setIsUserSaving] = useState(false);

  // Feedback States
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    variant: 'danger' | 'warning' | 'info';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    variant: 'info',
    onConfirm: () => {}
  });

  // --- ACCESS CONTROL LOGIC ---
  // Determine if the current logged-in user is the MAIN ADMIN (ID '1')
  const currentUserObj = userAccounts.find(u => u.username === currentUserUsername);
  const isMainAdmin = currentUserObj?.id === '1';

  // --- HANDLERS ---

  const handleSaveSchool = () => {
    if (!schoolNameInput.trim()) return alert("Nama sekolah wajib diisi");
    onUpdateSchoolName(schoolNameInput);
    setActiveModal(null);
    setSuccessMessage("Identitas sekolah berhasil diperbarui");
  };

  const handleSaveYear = () => {
    if (!yearInput.trim()) return alert("Tahun ajaran wajib diisi");
    onUpdateAcademicYear(yearInput);
    setActiveModal(null);
    setSuccessMessage("Tahun ajaran berhasil diperbarui");
  };

  const generateYears = (centerYear: number) => {
    const start = centerYear - 6;
    return Array.from({ length: 12 }, (_, i) => start + i);
  };

  const triggerPromote = () => {
    if (promoteSource === promoteTarget) return alert("Kelas asal dan tujuan tidak boleh sama");
    setConfirmConfig({
      isOpen: true,
      title: "Konfirmasi Kenaikan Kelas",
      message: `Pindahkan semua siswa dari ${promoteSource} ke ${promoteTarget}?`,
      variant: 'warning',
      onConfirm: () => {
        onPromoteClass(promoteSource, promoteTarget);
        setActiveModal(null);
        setTimeout(() => setSuccessMessage(`Siswa berhasil dipindahkan ke ${promoteTarget}`), 300);
      }
    });
  };

  const triggerDeleteClass = () => {
    setConfirmConfig({
      isOpen: true,
      title: "Hapus Data Kelas",
      message: `Yakin ingin menghapus SEMUA DATA siswa dan absensi di ${classToDelete}? Tindakan ini permanen.`,
      variant: 'danger',
      onConfirm: () => {
        onDeleteClassData(classToDelete);
        setActiveModal(null);
        setTimeout(() => setSuccessMessage(`Data ${classToDelete} berhasil dihapus`), 300);
      }
    });
  };

  // User Mgmt Logic
  const openUserForm = (user?: UserAccount) => {
    if (user) {
      setEditingUserId(user.id);
      setNewUserUsername(user.username);
      setNewUserPassword(user.password);
      setNewUserRole(user.role);
    } else {
      setEditingUserId(null);
      setNewUserUsername('');
      setNewUserPassword('');
      // If not main admin, force role to be user when creating
      setNewUserRole(isMainAdmin ? 'user' : 'user');
    }
    setIsUserFormOpen(true);
  };

  const saveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserUsername || !newUserPassword) return alert("Lengkapi data");
    
    // Security check: Sub-admins cannot create/promote other admins
    if (!isMainAdmin && newUserRole === 'admin') {
         // Allow if editing self (updating password), but role must remain admin
         if (editingUserId !== currentUserObj?.id) {
             alert("Anda tidak memiliki izin untuk membuat atau mengubah role Admin.");
             return;
         }
    }

    setIsUserSaving(true);
    const user: UserAccount = {
      id: editingUserId || Date.now().toString(),
      username: newUserUsername,
      password: newUserPassword,
      role: newUserRole
    };

    const success = await onSaveUser(user);
    setIsUserSaving(false);
    
    if (success) {
      setIsUserFormOpen(false);
    }
  };

  const confirmDeleteUser = (id: string) => {
    setConfirmConfig({
      isOpen: true,
      title: "Hapus Pengguna",
      message: "Yakin ingin menghapus pengguna ini? Akses login akan hilang.",
      variant: 'danger',
      onConfirm: async () => {
        await onDeleteUser(id);
      }
    });
  };

  // --- HELPER FOR PERMISSIONS ---
  const canEditUser = (targetUser: UserAccount) => {
      // 1. Main Admin (ID 1) can edit everyone
      if (isMainAdmin) return true;

      // 2. Sub Admin restrictions:
      // Can edit SELF
      if (targetUser.id === currentUserObj?.id) return true;
      // Cannot edit Main Admin
      if (targetUser.id === '1') return false;
      // Cannot edit other Admins
      if (targetUser.role === 'admin') return false;
      // Can edit standard Users
      return true;
  };

  const canDeleteUser = (targetUser: UserAccount) => {
      // 1. Cannot delete self (handled by UI logic usually, but robust check here)
      if (targetUser.id === currentUserObj?.id) return false;
      
      // 2. Main Admin can delete everyone (except ID 1 check usually in storage)
      if (isMainAdmin) {
          return targetUser.id !== '1';
      }

      // 3. Sub Admin restrictions:
      // Cannot delete Main Admin
      if (targetUser.id === '1') return false;
      // Cannot delete other Admins
      if (targetUser.role === 'admin') return false;
      // Can delete standard Users
      return true;
  };

  // --- SUB-COMPONENTS ---

  const SettingRow = ({ 
    icon: Icon, 
    colorClass, 
    label, 
    value, 
    onClick, 
    isDestructive = false 
  }: any) => (
    <button 
      onClick={onClick}
      className="w-full flex items-center justify-between p-4 bg-white hover:bg-gray-50 transition-colors group first:rounded-t-xl last:rounded-b-xl border-b border-gray-100 last:border-0"
    >
      <div className="flex items-center gap-4">
        <div className={`p-2 rounded-lg ${colorClass} bg-opacity-10`}>
          <Icon size={20} className={colorClass.replace('bg-', 'text-')} />
        </div>
        <div className="text-left">
          <p className={`font-medium ${isDestructive ? 'text-red-600' : 'text-gray-800'}`}>{label}</p>
          {value && <p className="text-xs text-gray-500 mt-0.5 truncate max-w-[200px] sm:max-w-xs">{value}</p>}
        </div>
      </div>
      <ChevronRight size={18} className="text-gray-300 group-hover:text-primary transition-colors" />
    </button>
  );

  const GroupTitle = ({ title }: { title: string }) => (
    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider px-4 mb-2 mt-6">{title}</h3>
  );

  return (
    <div className="max-w-2xl mx-auto pb-10">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Pengaturan</h2>
        <p className="text-gray-500 text-sm">Kelola preferensi aplikasi dan akun.</p>
      </div>

      {/* --- MENU LIST --- */}
      
      {userRole === 'admin' && (
        <>
          <GroupTitle title="Umum" />
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <SettingRow 
              icon={Building2} 
              colorClass="bg-blue-500 text-blue-500"
              label="Identitas Sekolah" 
              value={currentSchoolName}
              onClick={() => {
                setSchoolNameInput(currentSchoolName);
                setActiveModal('school');
              }}
            />
            <SettingRow 
              icon={Calendar} 
              colorClass="bg-purple-500 text-purple-500"
              label="Tahun Ajaran" 
              value={currentAcademicYear}
              onClick={() => {
                setYearInput(currentAcademicYear);
                setActiveModal('year');
              }}
            />
          </div>

          <GroupTitle title="Akun & Keamanan" />
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <SettingRow 
              icon={Users} 
              colorClass="bg-indigo-500 text-indigo-500"
              label="Manajemen Pengguna" 
              value={`${userAccounts.length} Akun Terdaftar`}
              onClick={() => setActiveModal('users')}
            />
          </div>

          <GroupTitle title="Manajemen Data" />
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <SettingRow 
              icon={UserCheck} 
              colorClass="bg-emerald-500 text-emerald-500"
              label="Kenaikan Kelas" 
              value="Pindahkan siswa ke tingkat lanjut"
              onClick={() => setActiveModal('promote')}
            />
            <SettingRow 
              icon={Trash2} 
              colorClass="bg-red-500 text-red-500"
              label="Hapus Data Kelas" 
              value="Bersihkan data siswa & absensi"
              isDestructive
              onClick={() => setActiveModal('deleteClass')}
            />
          </div>
        </>
      )}

      {/* Logout Section - Visible for Everyone */}
      <GroupTitle title="Sesi & Profil" />
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
         <div className="p-4 border-b border-gray-100 flex items-center gap-4">
             <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <CircleUser size={24} />
             </div>
             <div>
                <p className="font-bold text-gray-800">{currentUserUsername}</p>
                <p className="text-xs text-gray-500 capitalize">{userRole}</p>
             </div>
         </div>
         <SettingRow 
          icon={LogOut} 
          colorClass="bg-red-100 text-red-500"
          label="Keluar Aplikasi" 
          value="Akhiri sesi login saat ini"
          isDestructive
          onClick={onLogout}
        />
      </div>

      <div className="mt-8 text-center">
        <p className="text-xs text-gray-400">AbsensiKu v1.0 &copy; 2025</p>
        <p className="text-xs text-gray-300 mt-1">by Indah Lutfiyah</p>
      </div>

      {/* --- MODALS (Only render content if Admin, but structure exists) --- */}

      {/* 1. School Name Modal */}
      {activeModal === 'school' && userRole === 'admin' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-gray-800">Edit Identitas Sekolah</h3>
              <button onClick={() => setActiveModal(null)}><X size={20} className="text-gray-400" /></button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Nama Sekolah</label>
                <input 
                  type="text" 
                  value={schoolNameInput}
                  onChange={(e) => setSchoolNameInput(e.target.value)}
                  className="w-full mt-1 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                  autoFocus
                />
              </div>
              <button onClick={handleSaveSchool} className="w-full bg-primary text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors">
                Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Academic Year Modal */}
      {activeModal === 'year' && userRole === 'admin' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-gray-800">Tahun Ajaran Aktif</h3>
              <button onClick={() => setActiveModal(null)}><X size={20} className="text-gray-400" /></button>
            </div>
            <div className="p-4 space-y-4">
               {/* Custom Picker inside Modal */}
               <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                  <div className="flex justify-between items-center mb-4">
                    <button onClick={() => setPickerPageYear(p => p - 12)} className="p-1 hover:bg-white rounded-full"><ChevronLeft size={20} /></button>
                    <span className="font-semibold text-gray-700">{pickerPageYear - 6} - {pickerPageYear + 5}</span>
                    <button onClick={() => setPickerPageYear(p => p + 12)} className="p-1 hover:bg-white rounded-full"><ChevronRight size={20} /></button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {generateYears(pickerPageYear).map(year => {
                      const val = `${year}/${year + 1}`;
                      const isSelected = yearInput === val;
                      return (
                        <button
                          key={year}
                          onClick={() => setYearInput(val)}
                          className={`py-2 text-sm rounded-lg font-medium ${isSelected ? 'bg-primary text-white shadow' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
                        >
                          {year}
                        </button>
                      );
                    })}
                  </div>
               </div>
               
               <div className="text-center">
                 <p className="text-sm text-gray-500">Terpilih: <span className="font-bold text-primary">{yearInput}</span></p>
               </div>

              <button onClick={handleSaveYear} className="w-full bg-primary text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors">
                Terapkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. User Management Modal (Fullscreen-ish) */}
      {activeModal === 'users' && userRole === 'admin' && (
        <div className="fixed inset-0 z-50 bg-white sm:bg-black/50 sm:flex sm:items-center sm:justify-center animate-in slide-in-from-bottom-10 sm:animate-in sm:zoom-in-95">
          <div className="bg-white w-full h-full sm:h-auto sm:max-h-[80vh] sm:max-w-md sm:rounded-2xl shadow-xl flex flex-col">
             <div className="p-4 border-b border-gray-100 flex items-center gap-3">
                <button onClick={() => setActiveModal(null)} className="p-2 -ml-2 hover:bg-gray-100 rounded-full">
                  <ChevronLeft size={24} className="text-gray-600" />
                </button>
                <h3 className="font-bold text-lg text-gray-800">Manajemen Pengguna</h3>
             </div>
             
             <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                <div className="space-y-3">
                  {userAccounts.map(user => (
                    <div key={user.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                      <div className="flex items-center gap-3">
                         <div className={`w-10 h-10 rounded-full flex items-center justify-center ${user.role === 'admin' ? 'bg-indigo-100 text-indigo-600' : 'bg-orange-100 text-orange-600'}`}>
                            {user.role === 'admin' ? <Shield size={20} /> : <Users size={20} />}
                         </div>
                         <div>
                            <p className="font-bold text-gray-800 flex items-center gap-2">
                                {user.username}
                                {user.id === '1' && (
                                    <span className="text-[10px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded border border-indigo-100">Utama</span>
                                )}
                            </p>
                            <p className="text-xs text-gray-500 capitalize">{user.role} {user.username === currentUserUsername && '(Anda)'}</p>
                         </div>
                      </div>
                      <div className="flex items-center gap-1">
                         {canEditUser(user) && (
                           <button 
                             onClick={() => openUserForm(user)}
                             className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"
                           >
                             Edit
                           </button>
                         )}
                         {canDeleteUser(user) && (
                           <button 
                             onClick={() => confirmDeleteUser(user.id)}
                             className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                           >
                             <Trash2 size={18} />
                           </button>
                         )}
                      </div>
                    </div>
                  ))}
                </div>
             </div>

             <div className="p-4 border-t border-gray-100 bg-white">
                <button 
                  onClick={() => openUserForm()}
                  className="w-full flex items-center justify-center gap-2 bg-primary text-white py-3 rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200"
                >
                  <Plus size={20} />
                  Tambah User Baru
                </button>
             </div>
          </div>
        </div>
      )}

      {/* 4. Promote Class Modal */}
      {activeModal === 'promote' && userRole === 'admin' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
           <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95">
             <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-blue-50">
               <div className="flex items-center gap-2 text-blue-800">
                  <UserCheck size={20} />
                  <h3 className="font-bold">Kenaikan Kelas</h3>
               </div>
               <button onClick={() => setActiveModal(null)}><X size={20} className="text-blue-400" /></button>
             </div>
             <div className="p-6">
                <p className="text-sm text-gray-500 mb-6 text-center">Pindahkan semua siswa secara massal ke tingkat berikutnya.</p>
                
                <div className="flex items-center justify-between gap-2 mb-6 relative">
                   <div className="flex-1 relative">
                      <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Dari</label>
                      <button onClick={() => setIsPromoteSourceOpen(true)} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium flex justify-between items-center">
                        {promoteSource} <ChevronDown size={14} />
                      </button>
                      <ClassSelectorModal 
                        isOpen={isPromoteSourceOpen}
                        onClose={() => setIsPromoteSourceOpen(false)}
                        selectedClass={promoteSource}
                        onSelect={setPromoteSource}
                        showAllOption={false}
                      />
                   </div>
                   <div className="pt-4 text-gray-300"><ArrowRight size={20} /></div>
                   <div className="flex-1 relative">
                      <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Ke</label>
                      <button onClick={() => setIsPromoteTargetOpen(true)} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium flex justify-between items-center">
                        {promoteTarget} <ChevronDown size={14} />
                      </button>
                      <ClassSelectorModal 
                        isOpen={isPromoteTargetOpen}
                        onClose={() => setIsPromoteTargetOpen(false)}
                        selectedClass={promoteTarget}
                        onSelect={setPromoteTarget}
                        showAllOption={false}
                      />
                   </div>
                </div>

                <button onClick={triggerPromote} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200">
                  Proses Pemindahan
                </button>
             </div>
           </div>
        </div>
      )}

      {/* 5. Delete Class Modal */}
      {activeModal === 'deleteClass' && userRole === 'admin' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
           <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95">
             <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-red-50">
               <div className="flex items-center gap-2 text-red-800">
                  <Trash2 size={20} />
                  <h3 className="font-bold">Hapus Data Kelas</h3>
               </div>
               <button onClick={() => setActiveModal(null)}><X size={20} className="text-red-400" /></button>
             </div>
             <div className="p-6">
                <div className="bg-red-50 p-3 rounded-lg text-xs text-red-600 mb-4 leading-relaxed">
                   <strong>Perhatian:</strong> Semua data siswa dan riwayat absensi pada kelas yang dipilih akan dihapus permanen.
                </div>
                
                <div className="mb-6 relative">
                   <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Pilih Kelas</label>
                   <button onClick={() => setIsDeleteClassSelectorOpen(true)} className="w-full p-3 bg-white border border-gray-200 rounded-xl text-left font-medium flex justify-between items-center">
                      {classToDelete} <ChevronDown size={16} />
                   </button>
                   <ClassSelectorModal 
                     isOpen={isDeleteClassSelectorOpen}
                     onClose={() => setIsDeleteClassSelectorOpen(false)}
                     selectedClass={classToDelete}
                     onSelect={setClassToDelete}
                     showAllOption={false}
                   />
                </div>

                <button onClick={triggerDeleteClass} className="w-full bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700 shadow-lg shadow-red-200">
                  Hapus Data Permanen
                </button>
             </div>
           </div>
        </div>
      )}

      {/* 6. User Form Popup */}
      {isUserFormOpen && userRole === 'admin' && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
           <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl p-6 animate-in zoom-in-95">
              <h3 className="text-lg font-bold text-gray-800 mb-4">{editingUserId ? 'Edit User' : 'Tambah User'}</h3>
              <form onSubmit={saveUser} className="space-y-4">
                 <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">Username</label>
                    <input type="text" value={newUserUsername} onChange={e => setNewUserUsername(e.target.value)} className="w-full mt-1 p-2.5 border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none" placeholder="cth: admin" />
                 </div>
                 <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">Password</label>
                    <input type="text" value={newUserPassword} onChange={e => setNewUserPassword(e.target.value)} className="w-full mt-1 p-2.5 border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none" placeholder="******" />
                 </div>
                 
                 {/* Role Selection - Only Show if Main Admin */}
                 {isMainAdmin ? (
                   <div>
                      <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Hak Akses</label>
                      <div className="flex bg-gray-100 p-1 rounded-lg">
                         <button type="button" onClick={() => setNewUserRole('admin')} className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${newUserRole === 'admin' ? 'bg-white shadow text-primary' : 'text-gray-500'}`}>Admin</button>
                         <button type="button" onClick={() => setNewUserRole('user')} className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${newUserRole === 'user' ? 'bg-white shadow text-primary' : 'text-gray-500'}`}>User</button>
                      </div>
                   </div>
                 ) : (
                    <div className="p-3 bg-blue-50 text-blue-700 text-xs rounded-lg border border-blue-100">
                        <span className="font-bold block mb-1">Informasi</span>
                        Akun yang dibuat otomatis memiliki role <strong>User</strong>.
                    </div>
                 )}

                 <div className="flex gap-2 pt-2">
                    <button type="button" onClick={() => setIsUserFormOpen(false)} className="flex-1 py-2.5 bg-gray-100 text-gray-600 font-bold rounded-xl">Batal</button>
                    <button 
                      type="submit" 
                      disabled={isUserSaving}
                      className="flex-1 py-2.5 bg-primary text-white font-bold rounded-xl disabled:opacity-70 flex items-center justify-center gap-2"
                    >
                      {isUserSaving && <Loader2 size={16} className="animate-spin" />}
                      Simpan
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {/* Confirmation & Success Dialogs */}
      <ConfirmationModal
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmConfig.onConfirm}
        title={confirmConfig.title}
        message={confirmConfig.message}
        variant={confirmConfig.variant}
        confirmText="Ya, Lanjutkan"
      />

      <SuccessModal 
        isOpen={!!successMessage}
        onClose={() => setSuccessMessage(null)}
        message={successMessage || ''}
      />
    </div>
  );
};

export default Settings;