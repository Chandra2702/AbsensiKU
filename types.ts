export type AttendanceStatus = 'Hadir' | 'Tidak';

export interface Student {
  id: string;
  name: string;
  classGrade: string; // "Kelas 1", "Kelas 2", "Kelas 3"
  joinedDate: string;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  date: string; // ISO Date String YYYY-MM-DD
  status: AttendanceStatus;
}

export interface DailyStats {
  date: string;
  hadir: number;
  tidak: number;
}

export interface StudentSummary {
  student: Student;
  totalHadir: number;
  totalTidak: number;
  attendanceRate: number;
}