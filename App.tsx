import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Login from './components/Login';
import {
  getStoredStudents,
  getStoredAttendance,
  saveStudent,
  updateStudent,
  saveAttendance,
  deleteStudentFromStorage,
  saveAcademicYear,
  saveSchoolName,
  deleteDataByClass,
  moveClassData,
  getStoredUsers,
  saveUserAccount,
  deleteUserAccount,
  apiLogin,
  apiLogout,
  apiCheckAuth,
  getSettings
} from './services/storage';
import { Student, AttendanceRecord, AttendanceStatus, UserAccount } from './types';
import { Menu, Loader2, AlertCircle, LogOut } from 'lucide-react';

const App: React.FC = () => {
  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userRole, setUserRole] = useState<'admin' | 'user'>('admin');
  const [authChecked, setAuthChecked] = useState(false);
  const [currentUserUsername, setCurrentUserUsername] = useState<string>('');

  // App State
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [students, setStudents] = useState<Student[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [academicYear, setAcademicYear] = useState('2024/2025');
  const [schoolName, setSchoolName] = useState('SMP Terpadu AKN Marzuqi');
  const [userAccounts, setUserAccounts] = useState<UserAccount[]>([]);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  // Loading & Error States
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check Auth on Mount via API session
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const result = await apiCheckAuth();
        if (result && result.user) {
          setIsAuthenticated(true);
          setUserRole(result.user.role);
          setCurrentUserUsername(result.user.username);
        }
      } catch {
        // Not authenticated
      }
      setAuthChecked(true);
    };
    checkAuth();
  }, []);

  // Load Data
  const loadData = async (silent: boolean = false) => {
    if (!isAuthenticated) return;

    if (!silent) setIsLoading(true);
    setError(null);

    try {
      if (!silent) await new Promise(resolve => setTimeout(resolve, 300));

      const [fetchedStudents, fetchedRecords, settings, users] = await Promise.all([
        getStoredStudents(),
        getStoredAttendance(),
        getSettings(),
        getStoredUsers().catch(() => []) // Users might fail for non-admin
      ]);
      setStudents(fetchedStudents);
      setRecords(fetchedRecords);
      setAcademicYear(settings.academic_year || '2024/2025');
      setSchoolName(settings.school_name || 'SMP Terpadu AKN Marzuqi');
      setUserAccounts(users);
    } catch (err) {
      console.error(err);
      if (!silent) setError("Gagal memuat data. Silakan refresh halaman.");
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadData(false);
    }
  }, [isAuthenticated]);

  // Auto Sync
  useEffect(() => {
    if (!isAuthenticated) return;
    const SYNC_INTERVAL = 5 * 60 * 1000;
    const intervalId = setInterval(() => {
      console.log('Auto-syncing data...');
      loadData(true);
    }, SYNC_INTERVAL);
    return () => clearInterval(intervalId);
  }, [isAuthenticated]);

  // Handlers
  const handleLogin = async (u: string, p: string, _remember: boolean): Promise<boolean> => {
    try {
      const result = await apiLogin(u, p);
      if (result.user) {
        setUserRole(result.user.role);
        setIsAuthenticated(true);
        setCurrentUserUsername(result.user.username);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const handleLogoutRequest = () => setIsLogoutModalOpen(true);
  const handleLogoutConfirm = async () => {
    try {
      await apiLogout();
    } catch {
      // Logout even if API call fails
    }
    setIsAuthenticated(false);
    setUserRole('admin');
    setCurrentUserUsername('');
    setStudents([]);
    setRecords([]);
    setIsLogoutModalOpen(false);
    setCurrentPage('dashboard');
  };

  const handleAddStudent = async (newStudent: Student) => {
    try {
      setStudents(prev => [...prev, newStudent]);
      await saveStudent(newStudent);
    } catch (err) {
      alert("Gagal menyimpan data.");
      loadData();
    }
  };

  const handleUpdateStudent = async (updatedStudent: Student) => {
    try {
      setStudents(prev => prev.map(s => s.id === updatedStudent.id ? updatedStudent : s));
      await updateStudent(updatedStudent);
    } catch (err) {
      alert("Gagal mengupdate data.");
      loadData();
    }
  };

  const handleDeleteStudent = async (studentId: string) => {
    try {
      setStudents(prev => prev.filter(s => s.id !== studentId));
      setRecords(prev => prev.filter(r => r.studentId !== studentId));
      await deleteStudentFromStorage(studentId);
    } catch (err) {
      alert("Gagal menghapus siswa.");
      loadData();
    }
  };

  const handleUpdateAttendance = async (studentId: string, status: AttendanceStatus, date: string) => {
    const newRecord: AttendanceRecord = {
      id: `${studentId}-${date}`,
      studentId,
      date,
      status,
      recordedBy: currentUserUsername,
      timestamp: new Date().toISOString()
    };
    try {
      setRecords(prev => {
        const filtered = prev.filter(r => r.id !== newRecord.id);
        return [...filtered, newRecord];
      });
      await saveAttendance(newRecord);
    } catch (err) {
      alert("Gagal menyimpan absensi.");
      loadData();
    }
  };

  const handleDataReload = async () => {
    setIsRefreshing(true);
    await loadData(true);
    setIsRefreshing(false);
  };

  // Settings Handlers
  const handleUpdateAcademicYear = async (year: string) => {
    await saveAcademicYear(year);
    setAcademicYear(year);
  };

  const handleUpdateSchoolName = async (name: string) => {
    await saveSchoolName(name);
    setSchoolName(name);
  };

  const handleDeleteClassData = async (classGrade: string) => {
    setIsLoading(true);
    await deleteDataByClass(classGrade);
    await loadData(false);
  };

  const handlePromoteClass = async (fromClass: string, toClass: string) => {
    setIsLoading(true);
    await moveClassData(fromClass, toClass);
    await loadData(false);
  };

  // User Management Handlers
  const handleSaveUser = async (user: UserAccount) => {
    try {
      await saveUserAccount(user);
      const updatedUsers = await getStoredUsers();
      setUserAccounts(updatedUsers);
      return true;
    } catch (e: any) {
      alert(e.message || "Gagal menyimpan user");
      return false;
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await deleteUserAccount(userId);
      const updatedUsers = await getStoredUsers();
      setUserAccounts(updatedUsers);
    } catch (e: any) {
      alert("Gagal menghapus user: " + e.message);
    }
  };

  // Render Logic
  if (!authChecked) return null;
  if (!isAuthenticated) return <Login onLogin={handleLogin} />;

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-[60vh] text-primary">
          <Loader2 className="w-12 h-12 animate-spin mb-4" />
          <p className="font-medium text-gray-500">Memuat Data...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-[60vh] text-danger text-center max-w-md mx-auto">
          <AlertCircle className="w-16 h-16 mb-4" />
          <h3 className="text-xl font-bold mb-2">Terjadi Kesalahan</h3>
          <p className="text-gray-500 mb-6">{error}</p>
          <button onClick={() => loadData(false)} className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-indigo-700">
            Coba Lagi
          </button>
        </div>
      );
    }

    switch (currentPage) {
      case 'dashboard':
        return (
          <Dashboard
            students={students}
            records={records}
            onRefresh={handleDataReload}
            isLoading={isRefreshing}
          />
        );
      case 'students':
        return (
          <Students
            students={students}
            records={records}
            onAddStudent={handleAddStudent}
            onUpdateStudent={handleUpdateStudent}
            onDeleteStudent={handleDeleteStudent}
            onUpdateAttendance={handleUpdateAttendance}
            userRole={userRole}
          />
        );
      case 'reports':
        return <Reports students={students} records={records} userRole={userRole} />;
      case 'settings':
        return (
          <Settings
            currentAcademicYear={academicYear}
            onUpdateAcademicYear={handleUpdateAcademicYear}
            currentSchoolName={schoolName}
            onUpdateSchoolName={handleUpdateSchoolName}
            onDeleteClassData={handleDeleteClassData}
            onPromoteClass={handlePromoteClass}
            userAccounts={userAccounts}
            onSaveUser={handleSaveUser}
            onDeleteUser={handleDeleteUser}
            currentUserUsername={currentUserUsername}
            userRole={userRole}
            onLogout={handleLogoutRequest}
          />
        );
      default:
        return <Dashboard students={students} records={records} onRefresh={handleDataReload} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] font-sans text-gray-900">
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <div className={`fixed md:relative z-40 transition-transform duration-300 transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <Sidebar
          currentPage={currentPage}
          onNavigate={(page) => {
            setCurrentPage(page);
            setIsMobileMenuOpen(false);
          }}
          academicYear={academicYear}
          schoolName={schoolName}
          userRole={userRole}
        />
      </div>

      <main className="flex-1 min-w-0 flex flex-col h-screen overflow-hidden">
        <header className="md:hidden bg-white border-b border-gray-100 p-4 flex items-center justify-between sticky top-0 z-20">
          <div className="font-bold text-lg text-primary flex items-center gap-2">
            AbsensiKu
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
          >
            <Menu size={24} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </div>
      </main>

      {isLogoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
            <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <LogOut size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Konfirmasi Keluar</h3>
            <p className="text-gray-500 mb-6">Apakah Anda yakin ingin keluar dari aplikasi?</p>
            <div className="flex gap-3">
              <button
                onClick={() => setIsLogoutModalOpen(false)}
                className="flex-1 px-4 py-2.5 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 font-medium transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleLogoutConfirm}
                className="flex-1 px-4 py-2.5 text-white bg-red-500 rounded-xl hover:bg-red-600 font-medium transition-colors shadow-lg shadow-red-200"
              >
                Ya, Keluar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;