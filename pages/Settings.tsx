import React, { useState } from 'react';
import { AVAILABLE_CLASSES } from '../constants';
import {
  Building2, Calendar, Users, Shield, Trash2,
  UserCheck, Plus, X, LogOut, CircleUser, Save, Loader2, ArrowRight
} from 'lucide-react';
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
  onSaveUser: (user: UserAccount) => Promise<boolean>;
  onDeleteUser: (userId: string) => Promise<void>;
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
  // --- FORM STATES ---
  const [schoolNameInput, setSchoolNameInput] = useState(currentSchoolName);
  const [yearInput, setYearInput] = useState(currentAcademicYear);
  const [isSavingSchool, setIsSavingSchool] = useState(false);
  const [isSavingYear, setIsSavingYear] = useState(false);

  // Promotion States
  const [promoteSource, setPromoteSource] = useState(AVAILABLE_CLASSES[0]);
  const [promoteTarget, setPromoteTarget] = useState(AVAILABLE_CLASSES[1] || AVAILABLE_CLASSES[0]);

  // Delete Class State
  const [classToDelete, setClassToDelete] = useState(AVAILABLE_CLASSES[0]);

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
    onConfirm: () => { }
  });

  // --- ACCESS CONTROL LOGIC ---
  const currentUserObj = userAccounts.find(u => u.username === currentUserUsername);
  const isMainAdmin = currentUserObj?.id === '1';

  // --- HANDLERS ---
  const handleSaveSchool = () => {
    if (!schoolNameInput.trim()) return alert("Nama sekolah wajib diisi");
    setIsSavingSchool(true);
    onUpdateSchoolName(schoolNameInput);
    setTimeout(() => {
      setIsSavingSchool(false);
      setSuccessMessage("Identitas sekolah berhasil diperbarui");
    }, 400);
  };

  const handleSaveYear = () => {
    setIsSavingYear(true);
    onUpdateAcademicYear(yearInput);
    setTimeout(() => {
      setIsSavingYear(false);
      setSuccessMessage("Tahun ajaran berhasil diperbarui");
    }, 400);
  };

  // Generate around current year
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 6 }, (_, i) => {
    const y = currentYear - 2 + i;
    return `${y}/${y + 1}`;
  });
  if (!yearOptions.includes(yearInput)) {
    yearOptions.push(yearInput);
  }

  const triggerPromote = () => {
    if (promoteSource === promoteTarget) return alert("Kelas asal dan tujuan tidak boleh sama");
    setConfirmConfig({
      isOpen: true,
      title: "Konfirmasi Kenaikan Kelas",
      message: `Pindahkan semua siswa dari ${promoteSource} ke ${promoteTarget}?`,
      variant: 'warning',
      onConfirm: () => {
        onPromoteClass(promoteSource, promoteTarget);
        setConfirmConfig({ ...confirmConfig, isOpen: false });
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
        setConfirmConfig({ ...confirmConfig, isOpen: false });
        setTimeout(() => setSuccessMessage(`Data ${classToDelete} berhasil dihapus`), 300);
      }
    });
  };

  // User Mgmt Logic
  const openUserForm = (user?: UserAccount) => {
    if (user) {
      setEditingUserId(user.id);
      setNewUserUsername(user.username);
      setNewUserPassword(""); // Kosongkan password saat edit, unless user wants to change
      setNewUserRole(user.role);
    } else {
      setEditingUserId(null);
      setNewUserUsername('');
      setNewUserPassword('');
      setNewUserRole(isMainAdmin ? 'user' : 'user');
    }
    setIsUserFormOpen(true);
  };

  const cancelUserForm = () => {
    setIsUserFormOpen(false);
    setEditingUserId(null);
  };

  const saveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserUsername) return alert("Username wajib diisi");
    if (!editingUserId && !newUserPassword) return alert("Password wajib diisi untuk pengguna baru");

    if (!isMainAdmin && newUserRole === 'admin') {
      if (editingUserId !== currentUserObj?.id) {
        alert("Anda tidak memiliki izin untuk membuat atau mengubah role Admin.");
        return;
      }
    }

    setIsUserSaving(true);
    const user: UserAccount = {
      id: editingUserId || Date.now().toString(),
      username: newUserUsername,
      password: newUserPassword, // Will be ignored by backend if empty during UPDATE
      role: newUserRole
    };

    const success = await onSaveUser(user);
    setIsUserSaving(false);

    if (success) {
      setIsUserFormOpen(false);
      setSuccessMessage(editingUserId ? "Pengguna berhasil diubah" : "Pengguna berhasil ditambahkan");
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
        setConfirmConfig({ ...confirmConfig, isOpen: false });
      }
    });
  };

  // --- HELPER FOR PERMISSIONS ---
  const canEditUser = (targetUser: UserAccount) => {
    if (isMainAdmin) return true;
    if (targetUser.id === currentUserObj?.id) return true;
    if (targetUser.id === '1') return false;
    if (targetUser.role === 'admin') return false;
    return true;
  };

  const canDeleteUser = (targetUser: UserAccount) => {
    if (targetUser.id === currentUserObj?.id) return false;
    if (isMainAdmin) return targetUser.id !== '1';
    if (targetUser.id === '1') return false;
    if (targetUser.role === 'admin') return false;
    return true;
  };

  // --- UI COMPONENTS ---
  const SectionTitle = ({ title, desc }: { title: string, desc?: string }) => (
    <div className="mb-4">
      <h3 className="text-lg font-bold text-gray-800">{title}</h3>
      {desc && <p className="text-sm text-gray-500">{desc}</p>}
    </div>
  );

  const PillButton: React.FC<{
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
  }> = ({ active, onClick, children }) => (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium rounded-full transition-all border ${active
        ? 'bg-primary text-white border-primary shadow-md shadow-primary/20'
        : 'bg-white text-gray-600 border-gray-200 hover:border-primary/50 hover:bg-indigo-50'
        }`}
    >
      {children}
    </button>
  );

  return (
    <div className="max-w-4xl mx-auto pb-10 space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Pengaturan</h2>
        <p className="text-gray-500 text-sm mt-1">Kelola preferensi aplikasi, pengguna, dan profil Anda langsung di halaman ini.</p>
      </div>

      {userRole === 'admin' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* IDENTITAS SEKOLAH CARD */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><Building2 size={24} /></div>
              <h3 className="font-bold text-gray-800 text-lg">Identitas Sekolah</h3>
            </div>
            <div className="flex-1">
              <label className="text-xs font-bold text-gray-500 uppercase block mb-2">Nama Sekolah</label>
              <input
                type="text"
                value={schoolNameInput}
                onChange={(e) => setSchoolNameInput(e.target.value)}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                placeholder="Masukkan nama sekolah"
              />
            </div>
            <button
              onClick={handleSaveSchool}
              disabled={isSavingSchool || schoolNameInput === currentSchoolName}
              className="mt-4 w-full bg-primary text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSavingSchool ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              Simpan Identitas
            </button>
          </div>

          {/* TAHUN AJARAN CARD */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-100 text-purple-600 rounded-lg"><Calendar size={24} /></div>
              <h3 className="font-bold text-gray-800 text-lg">Tahun Ajaran Aktif</h3>
            </div>
            <div className="flex-1">
              <label className="text-xs font-bold text-gray-500 uppercase block mb-3">Pilih Tahun Ajaran</label>
              <div className="flex flex-wrap gap-2">
                {yearOptions.map(year => (
                  <PillButton
                    key={year}
                    active={yearInput === year}
                    onClick={() => setYearInput(year)}
                  >
                    {year}
                  </PillButton>
                ))}
              </div>
            </div>
            <button
              onClick={handleSaveYear}
              disabled={isSavingYear || yearInput === currentAcademicYear}
              className="mt-4 w-full bg-primary text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSavingYear ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              Terapkan Tahun Ajaran
            </button>
          </div>

          {/* MANAJEMEN PENGGUNA CARD */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 lg:col-span-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg"><Users size={24} /></div>
                <div>
                  <h3 className="font-bold text-gray-800 text-lg">Manajemen Pengguna</h3>
                  <p className="text-xs text-gray-500">Kelola staf dan admin aplikasi</p>
                </div>
              </div>
              {!isUserFormOpen && (
                <button
                  onClick={() => openUserForm()}
                  className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-4 py-2 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
                >
                  <Plus size={18} /> Tambah User
                </button>
              )}
            </div>

            {/* Inline User Form */}
            {isUserFormOpen && (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 mb-6 animate-in slide-in-from-top-2">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-bold text-gray-800">{editingUserId ? 'Edit Pengguna' : 'Tambah Pengguna Baru'}</h4>
                  <button onClick={cancelUserForm} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
                </div>
                <form onSubmit={saveUser} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Username</label>
                    <input type="text" value={newUserUsername} onChange={e => setNewUserUsername(e.target.value)} className="w-full p-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none" placeholder="cth: admin" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Password {editingUserId && '(Kosongkan jika tidak diubah)'}</label>
                    <input type="text" value={newUserPassword} onChange={e => setNewUserPassword(e.target.value)} className="w-full p-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none" placeholder="******" />
                  </div>
                  {isMainAdmin && (
                    <div className="md:col-span-2 mt-1">
                      <label className="text-xs font-bold text-gray-500 uppercase block mb-2">Hak Akses (Role)</label>
                      <div className="flex gap-3">
                        <PillButton active={newUserRole === 'admin'} onClick={() => setNewUserRole('admin')}>Admin</PillButton>
                        <PillButton active={newUserRole === 'user'} onClick={() => setNewUserRole('user')}>User / Staf</PillButton>
                      </div>
                    </div>
                  )}
                  <div className="md:col-span-2 pt-2 flex justify-end gap-3">
                    <button type="button" onClick={cancelUserForm} className="px-5 py-2 text-gray-600 font-medium hover:bg-gray-200 rounded-lg transition-colors">Batal</button>
                    <button type="submit" disabled={isUserSaving} className="px-6 py-2 bg-primary text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-2">
                      {isUserSaving && <Loader2 size={16} className="animate-spin" />} Simpan
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* User List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {userAccounts.map(user => (
                <div key={user.id} className="border border-gray-100 rounded-xl p-4 flex items-center justify-between hover:border-gray-200 hover:shadow-sm transition-all bg-white">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${user.role === 'admin' ? 'bg-indigo-100 text-indigo-600' : 'bg-orange-100 text-orange-600'}`}>
                      {user.role === 'admin' ? <Shield size={18} /> : <CircleUser size={18} />}
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
                  <div className="flex gap-1">
                    {canEditUser(user) && (
                      <button onClick={() => openUserForm(user)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-sm font-medium">Edit</button>
                    )}
                    {canDeleteUser(user) && (
                      <button onClick={() => confirmDeleteUser(user.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={18} /></button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* MANAJEMEN DATA (KENAIKAN KELAS & HAPUS) */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg"><UserCheck size={24} /></div>
                <div>
                  <h3 className="font-bold text-gray-800 text-lg">Kenaikan Kelas</h3>
                  <p className="text-xs text-gray-500">Pindahkan siswa ke tingkat lanjut</p>
                </div>
              </div>
              <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100 mb-4">
                <label className="text-[10px] font-bold text-emerald-800 uppercase block mb-2">Dari Kelas Awal</label>
                <div className="flex flex-wrap gap-2 mb-4">
                  {AVAILABLE_CLASSES.map(cls => (
                    <PillButton key={`src-${cls}`} active={promoteSource === cls} onClick={() => setPromoteSource(cls)}>{cls}</PillButton>
                  ))}
                </div>

                <div className="flex items-center gap-2 mb-4 text-emerald-600">
                  <ArrowRight size={18} /> <span className="text-xs font-bold uppercase">Ke Kelas Tujuan</span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_CLASSES.map(cls => (
                    <PillButton key={`tgt-${cls}`} active={promoteTarget === cls} onClick={() => setPromoteTarget(cls)}>{cls}</PillButton>
                  ))}
                  <PillButton active={promoteTarget === 'Lulus'} onClick={() => setPromoteTarget('Lulus')}>Lulus</PillButton>
                </div>
              </div>
            </div>
            <button onClick={triggerPromote} className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 transition-colors">
              Proses Pemindahan Status
            </button>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-100 text-red-600 rounded-lg"><Trash2 size={24} /></div>
                <div>
                  <h3 className="font-bold text-gray-800 text-lg">Hapus Data Kelas</h3>
                  <p className="text-xs text-gray-500">Bersihkan data siswa di akhir tahun</p>
                </div>
              </div>
              <div className="bg-red-50 rounded-xl p-4 border border-red-100 text-sm text-red-800 mb-4">
                Tindakan ini akan <strong>menghapus permanen</strong> data profil siswa dan riwayat absensi untuk kelas yang Anda pilih di bawah ini.
              </div>
              <label className="text-[10px] font-bold text-gray-500 uppercase block mb-3">Pilih Kelas yang mau Dihapus</label>
              <div className="flex flex-wrap gap-2 mb-6">
                {AVAILABLE_CLASSES.map(cls => (
                  <PillButton key={`del-${cls}`} active={classToDelete === cls} onClick={() => setClassToDelete(cls)}>{cls}</PillButton>
                ))}
                <PillButton active={classToDelete === 'Lulus'} onClick={() => setClassToDelete('Lulus')}>Lulus</PillButton>
              </div>
            </div>
            <button onClick={triggerDeleteClass} className="w-full bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-200/50">
              Hapus Data Kelas Permanen
            </button>
          </div>

        </div>
      )}

      {/* Sesi & Profil (Muncul untuk semua role) */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4 text-left w-full sm:w-auto">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary border-2 border-primary/20">
            <CircleUser size={30} />
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-widest mb-0.5">Sesi Login Aktif</p>
            <p className="font-bold text-gray-800 text-lg">{currentUserUsername}</p>
            <span className="inline-block mt-1 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-semibold rounded uppercase">{userRole}</span>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="w-full sm:w-auto px-6 py-3 bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-100 hover:text-red-700 transition-colors flex items-center justify-center gap-2"
        >
          <LogOut size={18} />
          Keluar Aplikasi
        </button>
      </div>

      <div className="text-center pt-4">
        <p className="text-xs text-gray-400">AbsensiKu v1.0 &copy; 2025</p>
        <p className="text-xs text-gray-300 mt-1">by Indah Lutfiyah</p>
      </div>

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