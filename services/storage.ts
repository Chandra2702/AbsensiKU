import { Student, AttendanceRecord, UserAccount } from '../types';
import { INITIAL_STUDENTS, generateMockAttendance } from '../constants';

// LOCAL STORAGE KEYS
const LOCAL_STUDENTS_KEY = 'absensi_students';
const LOCAL_ATTENDANCE_KEY = 'absensi_records';
const LOCAL_USERS_KEY = 'absensi_users'; 
const SERVER_URL_KEY = 'absensi_server_url';
const ACADEMIC_YEAR_KEY = 'absensi_academic_year';
const SCHOOL_NAME_KEY = 'absensi_school_name';

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
  return localStorage.getItem(SERVER_URL_KEY) || 'api.php';
};

export const setServerUrl = (url: string) => {
  localStorage.setItem(SERVER_URL_KEY, url);
};

export const getAcademicYear = (): string => {
  return localStorage.getItem(ACADEMIC_YEAR_KEY) || '2024/2025';
};

export const saveAcademicYear = (year: string) => {
  localStorage.setItem(ACADEMIC_YEAR_KEY, year);
};

export const getSchoolName = (): string => {
  return localStorage.getItem(SCHOOL_NAME_KEY) || 'SMP Terpadu AKN Marzuqi';
};

export const saveSchoolName = (name: string) => {
  localStorage.setItem(SCHOOL_NAME_KEY, name);
};

// --- SERVER SYNC LOGIC ---

// 1. Helper untuk URL Absensi (api.php?db=absensi)
const getAbsensiEndpoint = (baseUrl: string) => {
  const separator = baseUrl.includes('?') ? '&' : '?';
  return `${baseUrl}${separator}db=absensi`;
};

// 2. Helper untuk URL User (api_users.php)
const getUserEndpoint = (baseUrl: string) => {
  // Jika URL yang disetting mengandung 'api.php', ganti dengan 'api_users.php'
  if (baseUrl.includes('api.php')) {
    return baseUrl.replace('api.php', 'api_users.php');
  }
  // Fallback default jika user hanya memasukkan nama file atau path lain
  return 'api_users.php';
};

// Push Data Absensi (Students & Attendance) -> api.php?db=absensi
const pushAbsensiData = async () => {
  const url = getServerUrl();
  if (!url) return;

  const students = loadLocal<Student[]>(LOCAL_STUDENTS_KEY, []);
  const attendance = loadLocal<AttendanceRecord[]>(LOCAL_ATTENDANCE_KEY, []);
  
  const payload = { students, attendance };

  try {
    await fetch(getAbsensiEndpoint(url), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch (error) {
    console.error("Gagal sinkronisasi data absensi ke server:", error);
  }
};

// Push Data User (Accounts) -> api_users.php
const pushUserData = async () => {
  const url = getServerUrl();
  if (!url) return;

  const users = loadLocal<UserAccount[]>(LOCAL_USERS_KEY, []);
  const payload = { users };

  try {
    // Menggunakan endpoint khusus user
    const userEndpoint = getUserEndpoint(url);
    
    await fetch(userEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch (error) {
    console.error("Gagal sinkronisasi data akun ke server:", error);
  }
};

export const pullFromServer = async (): Promise<boolean> => {
  const url = getServerUrl();
  if (!url) return false;

  try {
    // Fetch both databases in parallel using different endpoints
    const [absensiRes, accountRes] = await Promise.all([
      fetch(getAbsensiEndpoint(url)), // api.php?db=absensi
      fetch(getUserEndpoint(url))     // api_users.php
    ]);

    // Process Absensi Data
    if (absensiRes.ok) {
        const absensiData = await absensiRes.json();
        if (absensiData.students && Array.isArray(absensiData.students)) {
            saveLocal(LOCAL_STUDENTS_KEY, absensiData.students);
        }
        if (absensiData.attendance && Array.isArray(absensiData.attendance)) {
            saveLocal(LOCAL_ATTENDANCE_KEY, absensiData.attendance);
        }
    }

    // Process Account Data
    if (accountRes.ok) {
        const accountData = await accountRes.json();
        if (accountData.users && Array.isArray(accountData.users)) {
            saveLocal(LOCAL_USERS_KEY, accountData.users);
        }
    }

    return true;
  } catch (error) {
    console.warn("Server sync failed (using local data):", error);
    return false;
  }
};

// --- USER MANAGEMENT SERVICES ---

export const getStoredUsers = (): UserAccount[] => {
  return loadLocal<UserAccount[]>(LOCAL_USERS_KEY, []);
};

export const initializeDefaultUsers = () => {
  const users = getStoredUsers();
  if (users.length === 0) {
    const defaults: UserAccount[] = [
      { id: '1', username: 'admin', password: 'admin123', role: 'admin' },
      { id: '2', username: 'user', password: 'user123', role: 'user' }
    ];
    saveLocal(LOCAL_USERS_KEY, defaults);
    // Note: We typically pull first, so no auto-push here unless needed explicitly
  }
};

export const saveUserAccount = async (user: UserAccount): Promise<void> => {
  const users = getStoredUsers();
  // Check if update or new
  const existingIndex = users.findIndex(u => u.id === user.id);
  
  if (existingIndex >= 0) {
    users[existingIndex] = user;
  } else {
    // Check duplicate username for new users
    if (users.some(u => u.username === user.username)) {
      throw new Error('Username sudah digunakan');
    }
    users.push(user);
  }
  saveLocal(LOCAL_USERS_KEY, users);
  await pushUserData(); // SYNC TO api_users.php
};

export const deleteUserAccount = async (userId: string): Promise<void> => {
  // PROTECTION: Admin Utama (ID 1) tidak boleh dihapus
  if (userId === '1') {
    throw new Error('Admin Utama tidak dapat dihapus. Anda hanya dapat mengubah password atau username-nya.');
  }

  const users = getStoredUsers();
  const newUsers = users.filter(u => u.id !== userId);
  saveLocal(LOCAL_USERS_KEY, newUsers);
  await pushUserData(); // SYNC TO api_users.php
};

// --- MAIN SERVICES ---

export const getStoredStudents = async (): Promise<Student[]> => {
  await pullFromServer();
  return loadLocal<Student[]>(LOCAL_STUDENTS_KEY, []);
};

export const saveStudent = async (student: Student): Promise<Student> => {
  const students = loadLocal<Student[]>(LOCAL_STUDENTS_KEY, []);
  students.push(student);
  saveLocal(LOCAL_STUDENTS_KEY, students);
  await pushAbsensiData(); // SYNC TO api.php
  return student;
};

export const updateStudent = async (updatedStudent: Student): Promise<Student> => {
  const students = loadLocal<Student[]>(LOCAL_STUDENTS_KEY, []);
  const index = students.findIndex(s => s.id === updatedStudent.id);
  
  if (index !== -1) {
    students[index] = updatedStudent;
    saveLocal(LOCAL_STUDENTS_KEY, students);
    await pushAbsensiData(); // SYNC TO api.php
  }
  return updatedStudent;
};

export const deleteStudentFromStorage = async (studentId: string): Promise<void> => {
  const students = loadLocal<Student[]>(LOCAL_STUDENTS_KEY, []);
  const newStudents = students.filter(s => s.id !== studentId);
  saveLocal(LOCAL_STUDENTS_KEY, newStudents);

  const records = loadLocal<AttendanceRecord[]>(LOCAL_ATTENDANCE_KEY, []);
  const newRecords = records.filter(r => r.studentId !== studentId);
  saveLocal(LOCAL_ATTENDANCE_KEY, newRecords);
  
  await pushAbsensiData(); // SYNC TO api.php
  return;
};

// Bulk Delete by Class
export const deleteDataByClass = async (classGrade: string): Promise<void> => {
  // 1. Get Students not in that class
  const students = loadLocal<Student[]>(LOCAL_STUDENTS_KEY, []);
  const studentsToKeep = students.filter(s => s.classGrade !== classGrade);
  const studentsToDelete = students.filter(s => s.classGrade === classGrade);
  const idsToDelete = studentsToDelete.map(s => s.id);

  // 2. Get Records not belonging to those students
  const records = loadLocal<AttendanceRecord[]>(LOCAL_ATTENDANCE_KEY, []);
  const recordsToKeep = records.filter(r => !idsToDelete.includes(r.studentId));

  // 3. Save
  saveLocal(LOCAL_STUDENTS_KEY, studentsToKeep);
  saveLocal(LOCAL_ATTENDANCE_KEY, recordsToKeep);

  await pushAbsensiData(); // SYNC TO api.php
};

// Bulk Move Class (Promotion)
export const moveClassData = async (fromClass: string, toClass: string): Promise<void> => {
  const students = loadLocal<Student[]>(LOCAL_STUDENTS_KEY, []);
  
  // Update classGrade for matching students
  const updatedStudents = students.map(student => {
    if (student.classGrade === fromClass) {
      return { ...student, classGrade: toClass };
    }
    return student;
  });

  saveLocal(LOCAL_STUDENTS_KEY, updatedStudents);
  await pushAbsensiData(); // SYNC TO api.php
};

export const getStoredAttendance = async (): Promise<AttendanceRecord[]> => {
  return loadLocal<AttendanceRecord[]>(LOCAL_ATTENDANCE_KEY, []);
};

export const saveAttendance = async (record: AttendanceRecord): Promise<AttendanceRecord> => {
  const records = loadLocal<AttendanceRecord[]>(LOCAL_ATTENDANCE_KEY, []);
  const index = records.findIndex(r => r.id === record.id);
  if (index >= 0) {
    records[index] = record;
  } else {
    records.push(record);
  }
  saveLocal(LOCAL_ATTENDANCE_KEY, records);
  await pushAbsensiData(); // SYNC TO api.php
  return record;
};

// --- DATA MANAGEMENT ---

export const exportData = () => {
  const students = loadLocal(LOCAL_STUDENTS_KEY, []);
  const attendance = loadLocal(LOCAL_ATTENDANCE_KEY, []);
  const users = loadLocal(LOCAL_USERS_KEY, []); 
  
  const data = { 
    timestamp: new Date().toISOString(), 
    students, 
    attendance,
    users 
  };
  return JSON.stringify(data, null, 2);
};

export const importData = (jsonString: string): boolean => {
  try {
    const data = JSON.parse(jsonString);
    if (data.students && Array.isArray(data.students)) saveLocal(LOCAL_STUDENTS_KEY, data.students);
    if (data.attendance && Array.isArray(data.attendance)) saveLocal(LOCAL_ATTENDANCE_KEY, data.attendance);
    if (data.users && Array.isArray(data.users)) saveLocal(LOCAL_USERS_KEY, data.users); 
    
    // Push both datasets
    pushAbsensiData();
    pushUserData();
    
    return true;
  } catch (e) {
    return false;
  }
};

export const clearAllData = () => {
  localStorage.removeItem(LOCAL_STUDENTS_KEY);
  localStorage.removeItem(LOCAL_ATTENDANCE_KEY);
  localStorage.removeItem(LOCAL_USERS_KEY); 
  
  // Push empty states
  pushAbsensiData();
  pushUserData();
};