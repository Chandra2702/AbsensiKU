import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import Reports from './pages/Reports';
import { getStoredStudents, getStoredAttendance, saveStudent, saveAttendance, deleteStudentFromStorage } from './services/storage';
import { Student, AttendanceRecord, AttendanceStatus } from './types';
import { Menu } from 'lucide-react';

const App: React.FC = () => {
  // State
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [students, setStudents] = useState<Student[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Load Initial Data
  useEffect(() => {
    setStudents(getStoredStudents());
    setRecords(getStoredAttendance());
  }, []);

  // Handlers
  const handleAddStudent = (newStudent: Student) => {
    const updated = saveStudent(newStudent);
    setStudents(updated);
  };

  const handleDeleteStudent = (studentId: string) => {
    const updatedStudents = deleteStudentFromStorage(studentId);
    setStudents(updatedStudents);
    // Refresh records as well since we deleted related attendance
    setRecords(getStoredAttendance());
  };

  const handleUpdateAttendance = (studentId: string, status: AttendanceStatus, date: string) => {
    const newRecord: AttendanceRecord = {
      id: `${studentId}-${date}`,
      studentId,
      date,
      status
    };
    const updated = saveAttendance(newRecord);
    setRecords(updated);
  };

  // Render Page Content
  const renderContent = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard students={students} records={records} />;
      case 'students':
        return (
          <Students 
            students={students} 
            records={records} 
            onAddStudent={handleAddStudent}
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

      {/* Sidebar (Responsive wrapper) */}
      <div className={`fixed md:relative z-40 transition-transform duration-300 transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <Sidebar currentPage={currentPage} onNavigate={(page) => {
          setCurrentPage(page);
          setIsMobileMenuOpen(false);
        }} />
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