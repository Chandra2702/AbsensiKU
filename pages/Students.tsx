import React, { useState } from 'react';
import { Student, AttendanceRecord, AttendanceStatus } from '../types';
import { AVAILABLE_CLASSES } from '../constants';
import { Search, Plus, Filter, Check, X, Trash2 } from 'lucide-react';

interface StudentsProps {
  students: Student[];
  records: AttendanceRecord[];
  onAddStudent: (student: Student) => void;
  onUpdateAttendance: (studentId: string, status: AttendanceStatus, date: string) => void;
  onDeleteStudent: (studentId: string) => void;
}

const Students: React.FC<StudentsProps> = ({ students, records, onAddStudent, onUpdateAttendance, onDeleteStudent }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('Kelas 1');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentClass, setNewStudentClass] = useState('Kelas 1');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Filter students based on search AND class
  const filteredStudents = students.filter(s => 
    s.classGrade === selectedClass &&
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim()) return;

    const newStudent: Student = {
      id: Date.now().toString(),
      name: newStudentName,
      classGrade: newStudentClass,
      joinedDate: new Date().toISOString().split('T')[0]
    };

    onAddStudent(newStudent);
    setNewStudentName('');
    setIsAddModalOpen(false);
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

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Manajemen Siswa & Absensi</h2>
          <p className="text-gray-500">Kelola data siswa dan input kehadiran harian.</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-primary hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 font-medium shadow-md shadow-indigo-200 transition-colors"
        >
          <Plus size={18} />
          Tambah Siswa
        </button>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col lg:flex-row gap-4 justify-between items-center">
        
        {/* Search & Class Filter */}
        <div className="flex flex-1 gap-3 w-full lg:w-auto">
             <div className="relative min-w-[140px]">
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full appearance-none bg-slate-50 border border-slate-200 text-gray-700 py-2 pl-4 pr-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium cursor-pointer"
                >
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
                placeholder="Cari nama siswa..."
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
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-primary"
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
                          {/* Hadir Button */}
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

                          {/* Tidak Button */}
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
                        <button
                          onClick={() => handleDeleteClick(student.id, student.name)}
                          className="text-gray-400 hover:text-danger hover:bg-red-50 p-2 rounded-lg transition-colors"
                          title="Hapus Siswa"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-400">
                    Tidak ada siswa ditemukan di {selectedClass}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Student Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 m-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800">Tambah Siswa Baru</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleAddSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
                  <input
                    type="text"
                    required
                    value={newStudentName}
                    onChange={(e) => setNewStudentName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    placeholder="Contoh: Budi Santoso"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kelas</label>
                  <select 
                    value={newStudentClass}
                    onChange={(e) => setNewStudentClass(e.target.value)}
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
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 text-white bg-primary rounded-lg hover:bg-indigo-700 font-medium transition-colors"
                >
                  Simpan
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