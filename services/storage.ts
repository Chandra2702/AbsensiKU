import { Student, AttendanceRecord, UserAccount } from '../types';

// --- API HELPER ---

const API_BASE = '/api';

const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include', // Send session cookie
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(errorData.error || `HTTP ${res.status}`);
  }

  return res.json();
};

// --- AUTH ---

export const apiLogin = async (username: string, password: string): Promise<{ user: { id: string; username: string; role: 'admin' | 'user' } }> => {
  return apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
};

export const apiLogout = async (): Promise<void> => {
  await apiFetch('/auth/logout', { method: 'POST' });
};

export const apiCheckAuth = async (): Promise<{ user: { id: string; username: string; role: 'admin' | 'user' } } | null> => {
  try {
    return await apiFetch('/auth/me');
  } catch {
    return null;
  }
};

// --- STUDENTS ---

export const getStoredStudents = async (): Promise<Student[]> => {
  return apiFetch('/students');
};

export const saveStudent = async (student: Student): Promise<Student> => {
  return apiFetch('/students', {
    method: 'POST',
    body: JSON.stringify(student),
  });
};

export const updateStudent = async (student: Student): Promise<Student> => {
  return apiFetch(`/students/${student.id}`, {
    method: 'PUT',
    body: JSON.stringify(student),
  });
};

export const deleteStudentFromStorage = async (studentId: string): Promise<void> => {
  await apiFetch(`/students/${studentId}`, { method: 'DELETE' });
};

export const deleteDataByClass = async (classGrade: string): Promise<void> => {
  await apiFetch(`/students/class/${encodeURIComponent(classGrade)}`, { method: 'DELETE' });
};

export const moveClassData = async (fromClass: string, toClass: string): Promise<void> => {
  await apiFetch('/students/class/promote', {
    method: 'PUT',
    body: JSON.stringify({ fromClass, toClass }),
  });
};

// --- ATTENDANCE ---

export const getStoredAttendance = async (): Promise<AttendanceRecord[]> => {
  return apiFetch('/attendance');
};

export const saveAttendance = async (record: AttendanceRecord): Promise<AttendanceRecord> => {
  return apiFetch('/attendance', {
    method: 'POST',
    body: JSON.stringify(record),
  });
};

// --- USERS ---

export const getStoredUsers = async (): Promise<UserAccount[]> => {
  return apiFetch('/users');
};

export const saveUserAccount = async (user: UserAccount): Promise<void> => {
  // Check if update (has existing id from list) or create
  const users = await getStoredUsers();
  const existing = users.find(u => u.id === user.id);

  if (existing) {
    await apiFetch(`/users/${user.id}`, {
      method: 'PUT',
      body: JSON.stringify(user),
    });
  } else {
    await apiFetch('/users', {
      method: 'POST',
      body: JSON.stringify(user),
    });
  }
};

export const deleteUserAccount = async (userId: string): Promise<void> => {
  await apiFetch(`/users/${userId}`, { method: 'DELETE' });
};

// --- SETTINGS ---

export const getSettings = async (): Promise<{ academic_year: string; school_name: string }> => {
  return apiFetch('/settings');
};

export const saveSettings = async (settings: { academic_year?: string; school_name?: string }): Promise<void> => {
  await apiFetch('/settings', {
    method: 'PUT',
    body: JSON.stringify(settings),
  });
};

// Aliases for backward compatibility with App.tsx naming
export const getAcademicYear = async (): Promise<string> => {
  const settings = await getSettings();
  return settings.academic_year || '2024/2025';
};

export const saveAcademicYear = async (year: string): Promise<void> => {
  await saveSettings({ academic_year: year });
};

export const getSchoolName = async (): Promise<string> => {
  const settings = await getSettings();
  return settings.school_name || 'SMP Terpadu AKN Marzuqi';
};

export const saveSchoolName = async (name: string): Promise<void> => {
  await saveSettings({ school_name: name });
};

// --- DATA MANAGEMENT ---

export const exportData = async (): Promise<string> => {
  const [students, attendance, users] = await Promise.all([
    getStoredStudents(),
    getStoredAttendance(),
    getStoredUsers(),
  ]);

  const data = {
    timestamp: new Date().toISOString(),
    students,
    attendance,
    users,
  };
  return JSON.stringify(data, null, 2);
};

export const importData = async (jsonString: string): Promise<boolean> => {
  try {
    const data = JSON.parse(jsonString);

    // Import students
    if (data.students && Array.isArray(data.students)) {
      for (const student of data.students) {
        try {
          await saveStudent(student);
        } catch {
          await updateStudent(student);
        }
      }
    }

    // Import attendance
    if (data.attendance && Array.isArray(data.attendance)) {
      for (const record of data.attendance) {
        await saveAttendance(record);
      }
    }

    return true;
  } catch (e) {
    return false;
  }
};

// No-op functions kept for compatibility (not needed with backend)
export const initializeDefaultUsers = () => { };
export const setServerUrl = (_url: string) => { };
export const getServerUrl = (): string => API_BASE;
export const clearAllData = async () => { };