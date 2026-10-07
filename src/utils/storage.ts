import { Submission, User } from '../types';

export const STUDENT_ID_REGEX = /^32505030\d{2}$/;

export function isValidStudentId(id: string): boolean {
  return STUDENT_ID_REGEX.test(id.trim());
}

export function calculateGradeLetter(score: number): string {
  if (score >= 95) return 'A+';
  if (score >= 90) return 'A';
  if (score >= 85) return 'A-';
  if (score >= 80) return 'B+';
  if (score >= 75) return 'B';
  if (score >= 70) return 'B-';
  if (score >= 65) return 'C+';
  if (score >= 60) return 'C';
  return 'F';
}

const STORAGE_USERS_KEY = 'academiasubmit_users_v2';
const STORAGE_SUBMISSIONS_KEY = 'academiasubmit_submissions_v2';
const STORAGE_CURRENT_USER_ID = 'academiasubmit_current_user_id_v2';

export const INITIAL_PROFESSOR: User = {
  id: 'user_prof_001',
  name: '王德順 教授 (Prof. Te-Shun Wang)',
  email: 'wangtsgood@gmail.com',
  role: 'professor',
  department: '影像醫學系',
  isEmailVerified: true,
  createdAt: '2026-09-01T08:00:00Z',
};

export const INITIAL_STUDENTS: User[] = [];

export const INITIAL_SUBMISSIONS: Submission[] = [];

export function getStoredUsers(): User[] {
  try {
    const raw = localStorage.getItem(STORAGE_USERS_KEY);
    if (!raw) {
      const initial = [INITIAL_PROFESSOR];
      localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(initial));
      return initial;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      const initial = [INITIAL_PROFESSOR];
      localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(initial));
      return initial;
    }
    // Ensure professor name is updated
    return parsed.map((u: User) => (u.role === 'professor' ? { ...u, name: '王德順 教授 (Prof. Te-Shun Wang)', department: '影像醫學系' } : u));
  } catch {
    return [INITIAL_PROFESSOR];
  }
}

export function saveStoredUsers(users: User[]): void {
  localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));
}

export function getStoredSubmissions(): Submission[] {
  try {
    const raw = localStorage.getItem(STORAGE_SUBMISSIONS_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_SUBMISSIONS_KEY, JSON.stringify([]));
      return [];
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveStoredSubmissions(submissions: Submission[]): void {
  localStorage.setItem(STORAGE_SUBMISSIONS_KEY, JSON.stringify(submissions));
}

export function getCurrentUserId(): string {
  return localStorage.getItem(STORAGE_CURRENT_USER_ID) || INITIAL_PROFESSOR.id;
}

export function setCurrentUserId(userId: string): void {
  localStorage.setItem(STORAGE_CURRENT_USER_ID, userId);
}

