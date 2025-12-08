import { Student, AttendanceRecord } from './types';

export const INITIAL_STUDENTS: Student[] = [
  { id: '1', name: 'Ahmad Rizky', classGrade: 'Kelas 1', joinedDate: '2023-07-15' },
  { id: '2', name: 'Budi Santoso', classGrade: 'Kelas 1', joinedDate: '2023-07-15' },
  { id: '3', name: 'Citra Dewi', classGrade: 'Kelas 2', joinedDate: '2023-07-15' },
  { id: '4', name: 'Dimas Anggara', classGrade: 'Kelas 2', joinedDate: '2023-07-15' },
  { id: '5', name: 'Eka Putri', classGrade: 'Kelas 3', joinedDate: '2023-07-15' },
  { id: '6', name: 'Fajar Nugraha', classGrade: 'Kelas 3', joinedDate: '2023-07-15' },
];

export const AVAILABLE_CLASSES = ['Kelas 1', 'Kelas 2', 'Kelas 3'];

// Generate some dummy history for the past 5 days
export const generateMockAttendance = (students: Student[]): AttendanceRecord[] => {
  const records: AttendanceRecord[] = [];
  const today = new Date();
  
  for (let i = 0; i < 5; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    students.forEach(student => {
      // Random status logic for demo purposes
      const rand = Math.random();
      let status: 'Hadir' | 'Tidak' = 'Hadir';
      
      // 15% chance of being absent
      if (rand > 0.85) status = 'Tidak';

      records.push({
        id: `${student.id}-${dateStr}`,
        studentId: student.id,
        date: dateStr,
        status: status
      });
    });
  }
  return records;
};