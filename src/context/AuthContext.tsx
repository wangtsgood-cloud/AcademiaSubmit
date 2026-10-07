import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, VerificationEmailPayload } from '../types';
import {
  getStoredUsers,
  saveStoredUsers,
  getCurrentUserId,
  setCurrentUserId,
  isValidStudentId,
  INITIAL_PROFESSOR,
} from '../utils/storage';

interface AuthContextType {
  currentUser: User | null;
  users: User[];
  pendingEmailPayload: VerificationEmailPayload | null;
  isVerificationModalOpen: boolean;
  activeVerificationUser: User | null;
  login: (identifier: string) => { success: boolean; message: string; requiresVerification?: boolean };
  registerStudent: (params: {
    studentId: string;
    name: string;
    email: string;
    department: string;
  }) => { success: boolean; message: string };
  verifyEmailCode: (code: string) => { success: boolean; message: string };
  resendVerificationCode: () => { success: boolean; message: string };
  logout: () => void;
  switchUser: (userId: string) => void;
  openVerificationModal: (user?: User) => void;
  closeVerificationModal: () => void;
  dismissEmailNotification: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUserState] = useState<User | null>(null);
  const [pendingEmailPayload, setPendingEmailPayload] = useState<VerificationEmailPayload | null>(null);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [activeVerificationUser, setActiveVerificationUser] = useState<User | null>(null);

  // Initialize
  useEffect(() => {
    const loadedUsers = getStoredUsers();
    setUsers(loadedUsers);

    const storedId = getCurrentUserId();
    const found = loadedUsers.find((u) => u.id === storedId) || loadedUsers.find((u) => u.role === 'professor') || loadedUsers[0];
    if (found) {
      setCurrentUserState(found);
      setCurrentUserId(found.id);
    }
  }, []);

  const switchUser = (userId: string) => {
    const target = users.find((u) => u.id === userId);
    if (target) {
      setCurrentUserState(target);
      setCurrentUserId(target.id);
    }
  };

  const login = (identifier: string): { success: boolean; message: string; requiresVerification?: boolean } => {
    const cleaned = identifier.trim().toLowerCase();
    const user = users.find(
      (u) =>
        (u.studentId && u.studentId.toLowerCase() === cleaned) ||
        u.email.toLowerCase() === cleaned
    );

    if (!user) {
      return { success: false, message: '查無此帳號，請確認學號(32505030XX)或電子郵件是否正確。' };
    }

    if (!user.isEmailVerified) {
      setActiveVerificationUser(user);
      setIsVerificationModalOpen(true);
      return {
        success: false,
        message: '此學號尚未完成電子郵件安全驗證，請先驗證信箱以確保身分安全。',
        requiresVerification: true,
      };
    }

    setCurrentUserState(user);
    setCurrentUserId(user.id);
    return { success: true, message: `歡迎回來，${user.name}！` };
  };

  const registerStudent = (params: {
    studentId: string;
    name: string;
    email: string;
    department: string;
  }): { success: boolean; message: string } => {
    const trimmedId = params.studentId.trim();
    if (!isValidStudentId(trimmedId)) {
      return {
        success: false,
        message: '學號格式不符規定！學生帳號必須為 10 碼學號：32505030XX (如 3250503008)。',
      };
    }

    // Check duplicate
    const existing = users.find(
      (u) => u.studentId === trimmedId || u.email.toLowerCase() === params.email.trim().toLowerCase()
    );
    if (existing) {
      return {
        success: false,
        message: `學號 ${trimmedId} 或信箱 ${params.email} 已被註冊，請直接登入或進行信箱驗證。`,
      };
    }

    // Generate 6-digit verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const now = new Date();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

    const newUser: User = {
      id: `user_stu_${trimmedId}`,
      studentId: trimmedId,
      name: params.name.trim(),
      email: params.email.trim(),
      role: 'student',
      department: params.department.trim() || '資訊工程學系',
      isEmailVerified: false,
      verificationCode: code,
      verificationCodeExpiresAt: expiresAt,
      createdAt: now.toISOString(),
    };

    const updated = [...users, newUser];
    setUsers(updated);
    saveStoredUsers(updated);

    // Mock sending email notification payload
    const emailPayload: VerificationEmailPayload = {
      toEmail: newUser.email,
      studentId: newUser.studentId!,
      studentName: newUser.name,
      code,
      expiresInMinutes: 5,
      sentAt: now.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    };

    setPendingEmailPayload(emailPayload);
    setActiveVerificationUser(newUser);
    setIsVerificationModalOpen(true);

    return {
      success: true,
      message: '學生帳號建立成功！安全驗證碼已發送至您的電子郵件信箱。',
    };
  };

  const verifyEmailCode = (code: string): { success: boolean; message: string } => {
    if (!activeVerificationUser) {
      return { success: false, message: '無正在進行驗證之帳號。' };
    }

    const trimmed = code.trim();
    if (activeVerificationUser.verificationCode !== trimmed) {
      return { success: false, message: '驗證碼錯誤，請重新核對信件中的 6 位數安全代碼。' };
    }

    if (
      activeVerificationUser.verificationCodeExpiresAt &&
      Date.now() > activeVerificationUser.verificationCodeExpiresAt
    ) {
      return { success: false, message: '驗證碼已過期，請點擊「重新發送驗證碼」。' };
    }

    // Mark verified
    const updatedUsers = users.map((u) => {
      if (u.id === activeVerificationUser.id) {
        return {
          ...u,
          isEmailVerified: true,
          verificationCode: undefined,
          verificationCodeExpiresAt: undefined,
        };
      }
      return u;
    });

    setUsers(updatedUsers);
    saveStoredUsers(updatedUsers);

    const verifiedUser = updatedUsers.find((u) => u.id === activeVerificationUser.id);
    if (verifiedUser) {
      setCurrentUserState(verifiedUser);
      setCurrentUserId(verifiedUser.id);
      setActiveVerificationUser(null);
      setIsVerificationModalOpen(false);
      setPendingEmailPayload(null);
    }

    return { success: true, message: '電子郵件身分安全性驗證成功！已自動登入系統。' };
  };

  const resendVerificationCode = (): { success: boolean; message: string } => {
    if (!activeVerificationUser) {
      return { success: false, message: '無正在進行驗證之帳號。' };
    }

    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000;
    const now = new Date();

    const updatedUsers = users.map((u) => {
      if (u.id === activeVerificationUser.id) {
        return {
          ...u,
          verificationCode: newCode,
          verificationCodeExpiresAt: expiresAt,
        };
      }
      return u;
    });

    setUsers(updatedUsers);
    saveStoredUsers(updatedUsers);

    const refreshedUser = updatedUsers.find((u) => u.id === activeVerificationUser.id);
    if (refreshedUser) {
      setActiveVerificationUser(refreshedUser);
    }

    const emailPayload: VerificationEmailPayload = {
      toEmail: activeVerificationUser.email,
      studentId: activeVerificationUser.studentId || '',
      studentName: activeVerificationUser.name,
      code: newCode,
      expiresInMinutes: 5,
      sentAt: now.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    };

    setPendingEmailPayload(emailPayload);
    return { success: true, message: '已重新產生並寄送全新安全驗證碼至您的信箱！' };
  };

  const logout = () => {
    // Default fallback to Professor or null
    setCurrentUserState(null);
  };

  const openVerificationModal = (user?: User) => {
    if (user) {
      setActiveVerificationUser(user);
    } else if (currentUser && !currentUser.isEmailVerified) {
      setActiveVerificationUser(currentUser);
    }
    setIsVerificationModalOpen(true);
  };

  const closeVerificationModal = () => {
    setIsVerificationModalOpen(false);
  };

  const dismissEmailNotification = () => {
    setPendingEmailPayload(null);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        users,
        pendingEmailPayload,
        isVerificationModalOpen,
        activeVerificationUser,
        login,
        registerStudent,
        verifyEmailCode,
        resendVerificationCode,
        logout,
        switchUser,
        openVerificationModal,
        closeVerificationModal,
        dismissEmailNotification,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
