import React, { useState } from 'react';
import { Student, AttendanceRecord, AttendanceStatus } from '../types';
import { AVAILABLE_CLASSES } from '../constants';
import { Search, Plus, Filter, Check, X, Trash2, Download, FileSpreadsheet, Pencil } from 'lucide-react';

interface StudentsProps {
  students: Student[];
  records: AttendanceRecord[];
  onAddStudent: (student: Student) => void;
  onUpdateStudent: (student: Student) => void;
  onUpdateAttendance: (studentId: string, status: AttendanceStatus, date: string) => void;
  onDeleteStudent: (studentId: string) => void;
}

const Students: React.FC<StudentsProps> = ({ 
  students, 
  records, 
  onAddStudent, 
  onUpdateStudent, 
  onUpdateAttendance, 
  onDeleteStudent 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('Semua Kelas');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editStudentId, setEditStudentId] = useState<string | null>(null);
  
  // Form States
  const [studentName, setStudentName] = useState('');
  const [studentClass, setStudentClass] = useState('Kelas 1');

  // Filter students based on search AND class
  const filteredStudents = students.filter(s => {
    const matchesClass = selectedClass === 'Semua Kelas' || s.classGrade === selectedClass;
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesClass && matchesSearch;
  });

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
    if (window.confirm(`Apakah Anda yakin ingin menghapus siswa "${studentName}"? Data absensi siswa ini juga akan terhapus.`)) {
      onDeleteStudent(studentId);
    }
  };

  const getStatusForStudent = (studentId: string) => {
    const record = records.find(r => r.studentId === studentId && r.date === selectedDate);
    return record ? record.status : null;
  };

  const handleExportToCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Tanggal,Nama Siswa,Kelas,Status Kehadiran\n";

    const sortedRecords = [...records].sort((a, b) => b.date.localeCompare(a.date));

    sortedRecords.forEach(record => {
      const student = students.find(s => s.id === record.studentId);
      if (student) {
        const row = `${record.date},"${student.name}",${student.classGrade},${record.status}`;
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

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Manajemen Siswa & Absensi</h2>
          <p className="text-gray-500">Kelola data siswa dan input kehadiran harian.</p>
        </div>
        
        <div className="flex gap-2">
            <button 
              onClick={handleExportToCSV}
              className="bg-success hover:bg-emerald-600 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 font-medium shadow-md shadow-emerald-200 transition-colors"
              title="Download format Excel/Google Sheets"
            >
              <FileSpreadsheet size={18} />
              <span className="hidden sm:inline">Export Data</span>
            </button>
            
            <button 
              onClick={handleOpenAddModal}
              className="bg-primary hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 font-medium shadow-md shadow-indigo-200 transition-colors"
            >
              <Plus size={18} />
              <span className="hidden sm:inline">Tambah Siswa</span>
              <span className="sm:hidden">Tambah</span>
            </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col lg:flex-row gap-4 justify-between items-center">
        
        {/* Search & Class Filter */}
        <div className="flex flex-col sm:flex-row flex-1 gap-3 w-full lg:w-auto">
             <div className="relative min-w-[160px]">
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full appearance-none bg-slate-50 border border-slate-200 text-gray-700 py-2 pl-4 pr-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium cursor-pointer"
                >
                  <option value="Semua Kelas">Semua Kelas</option>
                  {AVAILABLE_CLASSES.map(cls => (
                    <option key={cls} value={cls}>{cls}</option>
                  ))}
                </select>
                <Filter className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Cari nama siswa (Semua Kelas)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
        </div>
        
        {/* Date Picker */}
        <div className="flex items-center gap-2 w-full lg:w-auto">
          <label className="text-sm font-medium text-gray-600 whitespace-nowrap">Tanggal Absen:</label>
          <input 
            type="date" 
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      {/* Student List Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Nama Siswa</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Kelas</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Absensi ({selectedDate})</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student) => {
                  const currentStatus = getStatusForStudent(student.id);
                  return (
                    <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                            {student.name.charAt(0)}
                          </div>
                          <span className="font-medium text-gray-800">{student.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.classGrade}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex justify-center gap-3">
                          <button
                            onClick={() => onUpdateAttendance(student.id, 'Hadir', selectedDate)}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all border ${
                              currentStatus === 'Hadir'
                                ? 'bg-success text-white border-success shadow-md shadow-success/20'
                                : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50 hover:border-success/50 hover:text-success'
                            }`}
                          >
                            <Check size={16} />
                            Hadir
                          </button>

                          <button
                            onClick={() => onUpdateAttendance(student.id, 'Tidak', selectedDate)}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all border ${
                              currentStatus === 'Tidak'
                                ? 'bg-danger text-white border-danger shadow-md shadow-danger/20'
                                : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50 hover:border-danger/50 hover:text-danger'
                            }`}
                          >
                            <X size={16} />
                            Tidak
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleOpenEditModal(student)}
                              className="text-gray-400 hover:text-primary hover:bg-indigo-50 p-2 rounded-lg transition-colors"
                              title="Edit Siswa"
                            >
                              <Pencil size={18} />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(student.id, student.name)}
                              className="text-gray-400 hover:text-danger hover:bg-red-50 p-2 rounded-lg transition-colors"
                              title="Hapus Siswa"
                            >
                              <Trash2 size={18} />
                            </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-400">
                    Tidak ada siswa ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Student Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 m-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800">
                {modalMode === 'add' ? 'Tambah Siswa Baru' : 'Edit Data Siswa'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    placeholder="Contoh: Budi Santoso"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kelas</label>
                  <select 
                    value={studentClass}
                    onChange={(e) => setStudentClass(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white"
                  >
                    {AVAILABLE_CLASSES.map(cls => (
                      <option key={cls} value={cls}>{cls}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 text-white bg-primary rounded-lg hover:bg-indigo-700 font-medium transition-colors"
                >
                  {modalMode === 'add' ? 'Simpan' : 'Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Students;