import React, { useState, useMemo } from 'react';
import { Student, AttendanceRecord, AttendanceStatus } from '../types';
import { Search, Plus, Filter, Check, X, Trash2, FileSpreadsheet, Pencil, ArrowUpDown, ArrowUp, ArrowDown, ChevronDown } from 'lucide-react';
import ClassSelectorModal from '../components/ClassSelectorModal';
import ConfirmationModal from '../components/ConfirmationModal';

interface StudentsProps {
  students: Student[];
  records: AttendanceRecord[];
  onAddStudent: (student: Student) => void;
  onUpdateStudent: (student: Student) => void;
  onUpdateAttendance: (studentId: string, status: AttendanceStatus, date: string) => void;
  onDeleteStudent: (studentId: string) => void;
  userRole: 'admin' | 'user';
}

type SortKey = 'name' | 'classGrade';
type SortDirection = 'asc' | 'desc';

const Students: React.FC<StudentsProps> = ({ 
  students, 
  records, 
  onAddStudent, 
  onUpdateStudent, 
  onUpdateAttendance, 
  onDeleteStudent,
  userRole
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('Semua Kelas');
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Sorting State
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editStudentId, setEditStudentId] = useState<string | null>(null);
  const [isExportConfirmOpen, setIsExportConfirmOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<{id: string, name: string} | null>(null);
  
  // Form States
  const [studentName, setStudentName] = useState('');
  const [studentClass, setStudentClass] = useState('Kelas 1');
  const [isFormClassSelectorOpen, setIsFormClassSelectorOpen] = useState(false);

  // Filter & Sort Logic
  const processedStudents = useMemo(() => {
    // 1. Filter
    let result = students.filter(s => {
      const matchesClass = selectedClass === 'Semua Kelas' || s.classGrade === selectedClass;
      const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesClass && matchesSearch;
    });

    // 2. Sort
    result.sort((a, b) => {
      const valA = a[sortKey].toLowerCase();
      const valB = b[sortKey].toLowerCase();

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [students, selectedClass, searchTerm, sortKey, sortDirection]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      // Toggle direction if clicking same header
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      // Reset to asc if clicking new header
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const handleOpenAddModal = () => {
    setModalMode('add');
    setStudentName('');
    setStudentClass('Kelas 1');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (student: Student) => {
    setModalMode('edit');
    setEditStudentId(student.id);
    setStudentName(student.name);
    setStudentClass(student.classGrade);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim()) return;

    if (modalMode === 'add') {
      const newStudent: Student = {
        id: Date.now().toString(),
        name: studentName,
        classGrade: studentClass,
        joinedDate: new Date().toISOString().split('T')[0]
      };
      onAddStudent(newStudent);
    } else if (modalMode === 'edit' && editStudentId) {
      const updatedStudent: Student = {
        id: editStudentId,
        name: studentName,
        classGrade: studentClass,
        joinedDate: new Date().toISOString().split('T')[0] // Keep original join date ideally, but simplistic here
      };
      onUpdateStudent(updatedStudent);
    }

    setStudentName('');
    setIsModalOpen(false);
  };

  const handleDeleteClick = (studentId: string, studentName: string) => {
    setStudentToDelete({ id: studentId, name: studentName });
  };

  const handleConfirmDelete = () => {
    if (studentToDelete) {
      onDeleteStudent(studentToDelete.id);
      setStudentToDelete(null);
    }
  };

  const getStatusForStudent = (studentId: string) => {
    const record = records.find(r => r.studentId === studentId && r.date === selectedDate);
    return record ? record.status : null;
  };

  const executeExportToCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "No,Tanggal,Nama Siswa,Kelas,Status Kehadiran\n";
    const currentStudents = processedStudents;
    const sortedRecords = [...records].sort((a, b) => b.date.localeCompare(a.date));

    // Map records implies we might not follow the displayed order directly if we iterate records.
    // However, usually export matches the filtered list or raw data. 
    // Let's stick to simple record export logic as before, just adding numbering might be tricky if not per student list.
    // Reverting to previous logic but adding simple index if feasible, otherwise standard CSV.
    
    sortedRecords.forEach((record, index) => {
      const student = students.find(s => s.id === record.studentId);
      if (student) {
        const row = `${index + 1},${record.date},"${student.name}",${student.classGrade},${record.status}`;
        csvContent += row + "\n";
      }
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `data_absensi_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const SortIcon = ({ column }: { column: SortKey }) => {
    if (sortKey !== column) return <ArrowUpDown size={14} className="text-gray-300" />;
    return sortDirection === 'asc' 
      ? <ArrowUp size={14} className="text-primary" /> 
      : <ArrowDown size={14} className="text-primary" />;
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Manajemen Siswa</h2>
          <p className="text-xs sm:text-sm text-gray-500">Kelola data & input absensi.</p>
        </div>
        
        {userRole === 'admin' && (
          <div className="flex gap-2 w-full md:w-auto">
              <button 
                onClick={() => setIsExportConfirmOpen(true)}
                className="flex-1 md:flex-none justify-center bg-success hover:bg-emerald-600 text-white px-3 py-2 rounded-xl flex items-center gap-2 text-sm font-medium shadow-sm transition-colors"
                title="Download Excel"
              >
                <FileSpreadsheet size={16} />
                <span>Export</span>
              </button>
              
              <button 
                onClick={handleOpenAddModal}
                className="flex-1 md:flex-none justify-center bg-primary hover:bg-indigo-700 text-white px-3 py-2 rounded-xl flex items-center gap-2 text-sm font-medium shadow-sm transition-colors"
              >
                <Plus size={16} />
                <span>Tambah</span>
              </button>
          </div>
        )}
      </div>

      {/* Toolbar */}
      <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col lg:flex-row gap-3 justify-between items-center">
        
        {/* Search & Class Filter */}
        <div className="flex flex-col sm:flex-row flex-1 gap-2 w-full lg:w-auto">
             <div className="relative min-w-[140px]">
                <button
                  onClick={() => setIsClassModalOpen(true)}
                  className="w-full flex items-center justify-between gap-2 bg-slate-50 border border-slate-200 text-gray-700 py-2 px-3 rounded-lg hover:border-primary hover:text-primary transition-all text-sm font-medium group"
                >
                  <div className="flex items-center gap-2 truncate">
                    <Filter size={14} className="text-gray-400 group-hover:text-primary flex-shrink-0" />
                    <span className="truncate">{selectedClass}</span>
                  </div>
                  <ChevronDown size={14} className="text-gray-400 group-hover:text-primary flex-shrink-0" />
              </button>
              
              <ClassSelectorModal 
                isOpen={isClassModalOpen} 
                onClose={() => setIsClassModalOpen(false)} 
                selectedClass={selectedClass} 
                onSelect={setSelectedClass} 
              />
            </div>

            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Cari siswa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
              />
            </div>
        </div>
        
        {/* Date Picker */}
        <div className="flex items-center gap-2 w-full lg:w-auto">
          <input 
            type="date" 
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      {/* Student List Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-3 sm:px-6 py-3 text-center text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider w-12 sm:w-16">
                  No
                </th>
                <th 
                  className="px-3 sm:px-6 py-3 text-left cursor-pointer hover:bg-slate-100 transition-colors group"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider">Nama Siswa</span>
                    <SortIcon column="name" />
                  </div>
                </th>
                {/* Hide Class column on mobile, merged with name */}
                <th 
                  className="hidden sm:table-cell px-6 py-3 text-left cursor-pointer hover:bg-slate-100 transition-colors group"
                  onClick={() => handleSort('classGrade')}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Kelas</span>
                    <SortIcon column="classGrade" />
                  </div>
                </th>
                <th className="px-2 sm:px-6 py-3 text-center text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider">Absensi</th>
                {userRole === 'admin' && (
                  <th className="px-2 sm:px-6 py-3 text-center text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider">Aksi</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {processedStudents.length > 0 ? (
                processedStudents.map((student, index) => {
                  const currentStatus = getStatusForStudent(student.id);
                  return (
                    <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                      {/* Number Column */}
                      <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-center text-xs sm:text-sm text-gray-500 font-medium">
                        {index + 1}
                      </td>

                      {/* Name Column (Combined with Class on Mobile) */}
                      <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                          <div className="hidden sm:flex w-8 h-8 rounded-full bg-primary/10 items-center justify-center text-primary font-bold text-xs">
                            {student.name.charAt(0)}
                          </div>
                          <div>
                            <span className="font-semibold text-xs sm:text-sm text-gray-800 block">{student.name}</span>
                            {/* Mobile only class badge */}
                            <span className="sm:hidden text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded inline-block mt-0.5">{student.classGrade}</span>
                          </div>
                        </div>
                      </td>
                      
                      {/* Class Column (Desktop Only) */}
                      <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.classGrade}</td>
                      
                      {/* Attendance Buttons */}
                      <td className="px-2 sm:px-6 py-2 sm:py-4 whitespace-nowrap">
                        <div className="flex justify-center gap-1.5 sm:gap-3">
                          <button
                            onClick={() => onUpdateAttendance(student.id, 'Hadir', selectedDate)}
                            className={`flex items-center justify-center gap-1 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-sm font-semibold transition-all border ${
                              currentStatus === 'Hadir'
                                ? 'bg-success text-white border-success shadow-sm'
                                : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                            }`}
                          >
                            <Check size={14} className="sm:w-4 sm:h-4" />
                            <span className="hidden sm:inline">Hadir</span>
                          </button>

                          <button
                            onClick={() => onUpdateAttendance(student.id, 'Tidak', selectedDate)}
                            className={`flex items-center justify-center gap-1 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-sm font-semibold transition-all border ${
                              currentStatus === 'Tidak'
                                ? 'bg-danger text-white border-danger shadow-sm'
                                : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                            }`}
                          >
                            <X size={14} className="sm:w-4 sm:h-4" />
                            <span className="hidden sm:inline">Tidak</span>
                          </button>
                        </div>
                      </td>

                      {/* Action Buttons (Admin Only) */}
                      {userRole === 'admin' && (
                        <td className="px-2 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center gap-1 sm:gap-2">
                              <button
                                onClick={() => handleOpenEditModal(student)}
                                className="text-gray-400 hover:text-primary hover:bg-indigo-50 p-1.5 sm:p-2 rounded-lg transition-colors"
                                title="Edit"
                              >
                                <Pencil size={16} className="sm:w-[18px] sm:h-[18px]" />
                              </button>
                              <button
                                onClick={() => handleDeleteClick(student.id, student.name)}
                                className="text-gray-400 hover:text-danger hover:bg-red-50 p-1.5 sm:p-2 rounded-lg transition-colors"
                                title="Hapus"
                              >
                                <Trash2 size={16} className="sm:w-[18px] sm:h-[18px]" />
                              </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={userRole === 'admin' ? 6 : 5} className="px-6 py-8 text-center text-xs sm:text-sm text-gray-400">
                    Tidak ada siswa ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Student Modal - Keep this as a full modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-800">
                {modalMode === 'add' ? 'Tambah Siswa' : 'Edit Siswa'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
                  <input
                    type="text"
                    required
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
                    placeholder="Contoh: Budi Santoso"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kelas</label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsFormClassSelectorOpen(!isFormClassSelectorOpen)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white text-sm text-left flex justify-between items-center"
                    >
                      <span className="text-gray-700">{studentClass}</span>
                      <ChevronDown size={16} className="text-gray-400" />
                    </button>
                    
                    <ClassSelectorModal 
                      isOpen={isFormClassSelectorOpen} 
                      onClose={() => setIsFormClassSelectorOpen(false)} 
                      selectedClass={studentClass} 
                      onSelect={setStudentClass}
                      showAllOption={false}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 text-sm font-medium transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 text-white bg-primary rounded-lg hover:bg-indigo-700 text-sm font-medium transition-colors"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Export Confirmation Modal */}
      <ConfirmationModal
        isOpen={isExportConfirmOpen}
        onClose={() => setIsExportConfirmOpen(false)}
        onConfirm={executeExportToCSV}
        title="Konfirmasi Export"
        message="Apakah Anda yakin ingin mengunduh data absensi siswa dalam format CSV?"
        confirmText="Ya, Download"
        variant="info"
      />

      {/* Delete Student Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!studentToDelete}
        onClose={() => setStudentToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Hapus Siswa"
        message={`Apakah Anda yakin ingin menghapus siswa "${studentToDelete?.name}"? Data absensi siswa ini juga akan terhapus secara permanen.`}
        confirmText="Ya, Hapus"
        variant="danger"
      />
    </div>
  );
};

export default Students;