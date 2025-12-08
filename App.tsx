import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import Reports from './pages/Reports';
import Login from './components/Login'; // Import Login Component
import { getStoredStudents, getStoredAttendance, saveStudent, updateStudent, saveAttendance, deleteStudentFromStorage } from './services/storage';
import { Student, AttendanceRecord, AttendanceStatus } from './types';
import { Menu, Loader2, AlertCircle } from 'lucide-react';

const App: React.FC = () => {
  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authChecked, setAuthChecked] = useState(false);

  // App State
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [students, setStudents] = useState<Student[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Loading & Error States
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check Auth on Mount
  useEffect(() => {
    // Check both local storage (persistent) and session storage (session only)
    const storedAuthLocal = localStorage.getItem('absensiku_auth');
    const storedAuthSession = sessionStorage.getItem('absensiku_auth');
    
    if (storedAuthLocal === 'true' || storedAuthSession === 'true') {
      setIsAuthenticated(true);
    }
    setAuthChecked(true);
  }, []);

  // Load Initial Data
  const loadData = async () => {
    if (!isAuthenticated) return;
    
    setIsLoading(true);
    setError(null);
    try {
      // Small delay to simulate loading for UX
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const [fetchedStudents, fetchedRecords] = await Promise.all([
        getStoredStudents(),
        getStoredAttendance()
      ]);
      setStudents(fetchedStudents);
      setRecords(fetchedRecords);
    } catch (err) {
      console.error(err);
      setError("Gagal memuat data. Silakan refresh halaman.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated]);

  // Auth Handlers
  const handleLogin = (u: string, p: string, remember: boolean): boolean => {
    // HARDCODED CREDENTIALS
    // In a real app, check against a server or encrypted storage
    if (u === 'admin' && p === 'admin123') {
      if (remember) {
        localStorage.setItem('absensiku_auth', 'true');
      } else {
        sessionStorage.setItem('absensiku_auth', 'true');
      }
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  const handleLogout = () => {
    if (window.confirm('Apakah Anda yakin ingin keluar?')) {
      localStorage.removeItem('absensiku_auth');
      sessionStorage.removeItem('absensiku_auth');
      setIsAuthenticated(false);
      setStudents([]);
      setRecords([]);
    }
  };

  // Data Handlers
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
      status
    };

    try {
      setRecords(prev => {
        const filtered = prev.filter(r => r.id !== newRecord.id);
        return [...filtered, newRecord];
      });
      await saveAttendance(newRecord);
    } catch (err) {
      console.error(err);
      alert("Gagal menyimpan absensi.");
      loadData();
    }
  };
  
  const handleDataReload = () => {
    loadData();
  };

  // 1. Initial Auth Check Loading
  if (!authChecked) {
    return null; // Or a splash screen
  }

  // 2. Not Authenticated -> Show Login
  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  // Render Page Content
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
          <button onClick={loadData} className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-indigo-700">
            Coba Lagi
          </button>
        </div>
      );
    }

    switch (currentPage) {
      case 'dashboard':
        return <Dashboard students={students} records={records} />;
      case 'students':
        return (
          <Students 
            students={students} 
            records={records} 
            onAddStudent={handleAddStudent}
            onUpdateStudent={handleUpdateStudent}
            onDeleteStudent={handleDeleteStudent}
            onUpdateAttendance={handleUpdateAttendance}
          />
        );
      case 'reports':
        return <Reports students={students} records={records} />;
      default:
        return <Dashboard students={students} records={records} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] font-sans text-gray-900">
      
      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed md:relative z-40 transition-transform duration-300 transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <Sidebar 
          currentPage={currentPage} 
          onNavigate={(page) => {
            setCurrentPage(page);
            setIsMobileMenuOpen(false);
          }} 
          onLogout={handleLogout}
        />
      </div>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 flex flex-col h-screen overflow-hidden">
        
        {/* Mobile Header */}
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

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;