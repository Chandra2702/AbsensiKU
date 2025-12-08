import { Student, AttendanceRecord } from '../types';
import { INITIAL_STUDENTS, generateMockAttendance } from '../constants';

const STUDENTS_KEY = 'absensiku_students';
const ATTENDANCE_KEY = 'absensiku_attendance';

export const getStoredStudents = (): Student[] => {
  const stored = localStorage.getItem(STUDENTS_KEY);
  if (stored) {
    return JSON.parse(stored);
  }
  // Initialize with mock data if empty
  localStorage.setItem(STUDENTS_KEY, JSON.stringify(INITIAL_STUDENTS));
  return INITIAL_STUDENTS;
};

export const saveStudent = (student: Student): Student[] => {
  const current = getStoredStudents();
  const updated = [...current, student];
  localStorage.setItem(STUDENTS_KEY, JSON.stringify(updated));
  return updated;
};

// New function to delete student
export const deleteStudentFromStorage = (studentId: string): Student[] => {
  const currentStudents = getStoredStudents();
  const updatedStudents = currentStudents.filter(s => s.id !== studentId);
  localStorage.setItem(STUDENTS_KEY, JSON.stringify(updatedStudents));

  // Also cleanup their attendance records
  const currentAttendance = getStoredAttendance();
  const updatedAttendance = currentAttendance.filter(r => r.studentId !== studentId);
  localStorage.setItem(ATTENDANCE_KEY, JSON.stringify(updatedAttendance));

  return updatedStudents;
};

export const getStoredAttendance = (): AttendanceRecord[] => {
  const stored = localStorage.getItem(ATTENDANCE_KEY);
  if (stored) {
    return JSON.parse(stored);
  }
  // Initialize with mock history
  const initialData = generateMockAttendance(INITIAL_STUDENTS);
  localStorage.setItem(ATTENDANCE_KEY, JSON.stringify(initialData));
  return initialData;
};

export const saveAttendance = (record: AttendanceRecord): AttendanceRecord[] => {
  const current = getStoredAttendance();
  // Remove existing record for same student and same date if exists (update logic)
  const filtered = current.filter(r => !(r.studentId === record.studentId && r.date === record.date));
  const updated = [...filtered, record];
  localStorage.setItem(ATTENDANCE_KEY, JSON.stringify(updated));
  return updated;
};

export const deleteAttendance = (studentId: string, date: string): AttendanceRecord[] => {
    const current = getStoredAttendance();
    const updated = current.filter(r => !(r.studentId === studentId && r.date === date));
    localStorage.setItem(ATTENDANCE_KEY, JSON.stringify(updated));
    return updated;
}