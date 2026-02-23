
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
  date: string; // ISO Date String YYYY-MM-DD (Tanggal Absensi)
  status: AttendanceStatus;
  recordedBy?: string; // Username penginput
  timestamp?: string; // Waktu spesifik penginputan (ISO String lengkap)
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

export interface UserAccount {
  id: string;
  username: string;
  password: string; // Stored as plain text for this demo/frontend-only app
  role: 'admin' | 'user';
}
