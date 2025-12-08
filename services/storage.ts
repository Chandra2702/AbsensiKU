import { Student, AttendanceRecord } from '../types';
import { INITIAL_STUDENTS, generateMockAttendance } from '../constants';

// LOCAL STORAGE KEYS
const LOCAL_STUDENTS_KEY = 'absensi_students';
const LOCAL_ATTENDANCE_KEY = 'absensi_records';
const SERVER_URL_KEY = 'absensi_server_url';

// --- HELPERS ---

const loadLocal = <T>(key: string, defaultVal: T): T => {
  const stored = localStorage.getItem(key);
  if (!stored) return defaultVal;
  try {
    return JSON.parse(stored);
  } catch {
    return defaultVal;
  }
};

const saveLocal = (key: string, data: any) => {
  localStorage.setItem(key, JSON.stringify(data));
};

export const getServerUrl = (): string => {
  // Default ke 'api.php' relatif terhadap root domain jika belum diset manual
  return localStorage.getItem(SERVER_URL_KEY) || 'api.php';
};

export const setServerUrl = (url: string) => {
  localStorage.setItem(SERVER_URL_KEY, url);
};

// --- SERVER SYNC LOGIC ---

// Helper to push all local data to server
const pushToServer = async () => {
  const url = getServerUrl();
  if (!url) return;

  const students = loadLocal<Student[]>(LOCAL_STUDENTS_KEY, []);
  const attendance = loadLocal<AttendanceRecord[]>(LOCAL_ATTENDANCE_KEY, []);

  const payload = { students, attendance };

  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch (error) {
    console.error("Gagal sinkronisasi ke server:", error);
    // Silent fail, local data is still preserved
  }
};

// Helper to pull data from server
export const pullFromServer = async (): Promise<boolean> => {
  const url = getServerUrl();
  if (!url) return false;

  try {
    const response = await fetch(url);
    
    // Jika response bukan JSON (misal 404 halaman HTML), anggap gagal
    const contentType = response.headers.get("content-type");
    if (!response.ok || !contentType || !contentType.includes("application/json")) {
      throw new Error("Server response not OK or not JSON");
    }
    
    const data = await response.json();
    
    if (data.students && Array.isArray(data.students)) {
      saveLocal(LOCAL_STUDENTS_KEY, data.students);
    }
    if (data.attendance && Array.isArray(data.attendance)) {
      saveLocal(LOCAL_ATTENDANCE_KEY, data.attendance);
    }
    return true;
  } catch (error) {
    console.warn("Server sync failed (using local data):", error);
    return false;
  }
};

// --- MAIN SERVICES ---

// Fetch all students (Try server first, then local)
export const getStoredStudents = async (): Promise<Student[]> => {
  await pullFromServer(); // Try to sync before returning
  
  const students = loadLocal<Student[]>(LOCAL_STUDENTS_KEY, []);
  if (students.length === 0) {
    // Jika data kosong, jangan load mock data secara otomatis jika kita mengharapkan data dari server
    // Biarkan kosong agar user bisa mulai input atau restore
    return [];
  }
  return students;
};

// Save a new student
export const saveStudent = async (student: Student): Promise<Student> => {
  const students = loadLocal<Student[]>(LOCAL_STUDENTS_KEY, []);
  students.push(student);
  saveLocal(LOCAL_STUDENTS_KEY, students);
  
  await pushToServer(); // Sync
  return student;
};

// Update student
export const updateStudent = async (updatedStudent: Student): Promise<Student> => {
  const students = loadLocal<Student[]>(LOCAL_STUDENTS_KEY, []);
  const index = students.findIndex(s => s.id === updatedStudent.id);
  
  if (index !== -1) {
    students[index] = updatedStudent;
    saveLocal(LOCAL_STUDENTS_KEY, students);
    await pushToServer(); // Sync
  }
  return updatedStudent;
};

// Delete student
export const deleteStudentFromStorage = async (studentId: string): Promise<void> => {
  const students = loadLocal<Student[]>(LOCAL_STUDENTS_KEY, []);
  const newStudents = students.filter(s => s.id !== studentId);
  saveLocal(LOCAL_STUDENTS_KEY, newStudents);

  // Delete associated records locally
  const records = loadLocal<AttendanceRecord[]>(LOCAL_ATTENDANCE_KEY, []);
  const newRecords = records.filter(r => r.studentId !== studentId);
  saveLocal(LOCAL_ATTENDANCE_KEY, newRecords);
  
  await pushToServer(); // Sync
  return;
};

// Fetch all attendance
export const getStoredAttendance = async (): Promise<AttendanceRecord[]> => {
  // pullFromServer is already called in getStoredStudents usually, but good to ensure
  // We rely on the initial load sync.
  
  const records = loadLocal<AttendanceRecord[]>(LOCAL_ATTENDANCE_KEY, []);
  return records;
};

// Save attendance
export const saveAttendance = async (record: AttendanceRecord): Promise<AttendanceRecord> => {
  const records = loadLocal<AttendanceRecord[]>(LOCAL_ATTENDANCE_KEY, []);
  const index = records.findIndex(r => r.id === record.id);
  if (index >= 0) {
    records[index] = record;
  } else {
    records.push(record);
  }
  saveLocal(LOCAL_ATTENDANCE_KEY, records);
  
  await pushToServer(); // Sync
  return record;
};

// --- DATA MANAGEMENT (BACKUP/RESTORE) ---

export const exportData = () => {
  const students = loadLocal(LOCAL_STUDENTS_KEY, []);
  const attendance = loadLocal(LOCAL_ATTENDANCE_KEY, []);
  
  const data = {
    timestamp: new Date().toISOString(),
    students,
    attendance
  };
  
  return JSON.stringify(data, null, 2);
};

export const importData = (jsonString: string): boolean => {
  try {
    const data = JSON.parse(jsonString);
    if (data.students && Array.isArray(data.students)) {
      saveLocal(LOCAL_STUDENTS_KEY, data.students);
    }
    if (data.attendance && Array.isArray(data.attendance)) {
      saveLocal(LOCAL_ATTENDANCE_KEY, data.attendance);
    }
    pushToServer(); // Sync imported data to server
    return true;
  } catch (e) {
    console.error("Invalid JSON data", e);
    return false;
  }
};

export const clearAllData = () => {
  localStorage.removeItem(LOCAL_STUDENTS_KEY);
  localStorage.removeItem(LOCAL_ATTENDANCE_KEY);
  pushToServer(); // Sync clear to server (be careful!)
};