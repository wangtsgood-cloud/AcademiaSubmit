export type UserRole = 'student' | 'professor';

export interface User {
  id: string;
  studentId?: string; // Format: 32505030XX (for students)
  name: string;
  email: string;
  role: UserRole;
  department: string;
  isEmailVerified: boolean;
  verificationCode?: string;
  verificationCodeExpiresAt?: number;
  createdAt: string;
}

export type SubmissionStatus = 'submitted' | 'grading' | 'graded' | 'resubmit_required';

export interface Submission {
  id: string;
  studentId: string; // 32505030XX
  studentName: string;
  studentEmail: string;
  department: string;
  courseCode?: string;
  courseName: string;
  submittedAt: string;
  updatedAt: string;
  version: number;
  status: SubmissionStatus;
  fileName: string;
  fileSize: number;
  fileType: string;
  fileDataUrl?: string; // Base64 or Blob URL for file downloading
  textContent?: string; // Text representation/preview of report
  score: number | null; // Direct score 0-100
  gradeLetter?: string; // A+, A, A-, B+, B, C, F
  professorFeedback: string;
  gradedAt?: string;
  gradedBy?: string;
}

export interface VerificationEmailPayload {
  toEmail: string;
  studentId: string;
  studentName: string;
  code: string;
  expiresInMinutes: number;
  sentAt: string;
}

