import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { isValidStudentId } from '../utils/storage';
import { UserCheck, ShieldAlert, GraduationCap, School, Check, UserPlus, LogIn } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  defaultMode = 'login',
}) => {
  const { login, registerStudent, users } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>(defaultMode);

  // Registration state
  const [studentId, setStudentId] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('影像醫學系 二年級');

  // Login state
  const [loginIdentifier, setLoginIdentifier] = useState('');

  // Messages
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleStudentIdChange = (val: string) => {
    const cleaned = val.trim();
    setStudentId(cleaned);
    if (cleaned.length > 0 && !isValidStudentId(cleaned)) {
      if (cleaned.length !== 10) {
        setErrorMsg('學號長度必須為 10 碼，格式：32505030XX (如 3250503018)');
      } else if (!cleaned.startsWith('32505030')) {
        setErrorMsg('學號前綴必須為「32505030」，後接兩位數字代碼 (32505030XX)');
      } else {
        setErrorMsg('學號格式必須為 32505030XX');
      }
    } else {
      setErrorMsg('');
      if (cleaned.length === 10 && !email) {
        // Auto-fill suggested school email
        setEmail(`${cleaned}@univ.edu.tw`);
      }
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!isValidStudentId(studentId)) {
      setErrorMsg('學號必須符合規定的格式：32505030XX (例如 3250503008)');
      return;
    }
    if (!name.trim()) {
      setErrorMsg('請輸入學生真實姓名');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('請輸入有效電子郵件信箱以接收安全驗證碼');
      return;
    }

    const res = registerStudent({
      studentId,
      name,
      email,
      department,
    });

    if (res.success) {
      setSuccessMsg(res.message);
      onClose();
    } else {
      setErrorMsg(res.message);
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!loginIdentifier.trim()) {
      setErrorMsg('請輸入學號(32505030XX)或電子郵件');
      return;
    }

    const res = login(loginIdentifier);
    if (res.success) {
      onClose();
    } else {
      setErrorMsg(res.message);
      if (res.requiresVerification) {
        onClose();
      }
    }
  };

  const handleQuickSelectDemo = (identifier: string) => {
    setLoginIdentifier(identifier);
    const res = login(identifier);
    if (res.success) {
      onClose();
    } else {
      setErrorMsg(res.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header Tabs */}
        <div className="px-6 pt-5 pb-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-1 p-1 bg-slate-200/80 rounded-lg">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMsg('');
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                mode === 'login'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              帳號登入
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setErrorMsg('');
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                mode === 'register'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              學生註冊 (學號 32505030XX)
            </button>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-sm font-medium p-1"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {errorMsg && (
            <div className="flex items-start gap-2 text-xs text-rose-700 bg-rose-50 border border-rose-200 p-3 rounded-lg">
              <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 p-3 rounded-lg">
              <Check className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {mode === 'register' ? (
            /* Student Registration Form */
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">
                    學生學號 (帳號) <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] text-slate-500 font-mono">
                    規定格式：32505030XX (共 10 碼)
                  </span>
                </div>
                <input
                  type="text"
                  maxLength={10}
                  placeholder="例如：3250503018"
                  value={studentId}
                  onChange={(e) => handleStudentIdChange(e.target.value)}
                  className={`w-full px-3 py-2 text-sm font-mono border rounded-lg focus:outline-hidden transition-all ${
                    studentId && !isValidStudentId(studentId)
                      ? 'border-rose-400 bg-rose-50/30 focus:border-rose-500'
                      : studentId && isValidStudentId(studentId)
                      ? 'border-emerald-500 bg-emerald-50/20 focus:border-emerald-600'
                      : 'border-slate-300 focus:border-indigo-600'
                  }`}
                  required
                />
                <p className="mt-1 text-[11px] text-slate-500">
                  ※ 系統規定帳號即為學號，以 32505030 開頭，後綴 2 位數字代表座號。
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  學生真實姓名 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="例如：王小明"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:border-indigo-600 focus:outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  電子郵件信箱 (安全驗證用) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  placeholder="例如：3250503018@univ.edu.tw"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:border-indigo-600 focus:outline-hidden"
                  required
                />
                <p className="mt-1 text-[11px] text-slate-500">
                  註冊後系統將發送 6 位數安全認證信以驗證學籍與防止冒繳。
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  就讀系所與年級
                </label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:border-indigo-600 focus:outline-hidden"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={!isValidStudentId(studentId) || !name || !email}
                  className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>建立學生帳號並發送郵件驗證碼</span>
                </button>
              </div>
            </form>
          ) : (
            /* Login Form */
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  學號 (32505030XX) 或 電子郵件
                </label>
                <input
                  type="text"
                  placeholder="輸入 3250503001 或教授信箱"
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:border-indigo-600 focus:outline-hidden"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                <span>登入平台</span>
              </button>

              {/* Quick Demo Accounts */}
              <div className="pt-3 border-t border-slate-100">
                <div className="text-[11px] font-semibold text-slate-500 mb-2">
                  快速以教授身分登入 (評審端)：
                </div>
                <div>
                  <button
                    type="button"
                    onClick={() => handleQuickSelectDemo('wangtsgood@gmail.com')}
                    className="w-full p-2.5 border border-slate-200 rounded-lg hover:border-indigo-400 bg-slate-50 hover:bg-indigo-50/40 text-left transition-colors"
                  >
                    <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                      <GraduationCap className="w-4 h-4 text-indigo-600" />
                      <span>王德順 教授 (評審中心)</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      審閱全班學生報告、線上即時評分與評語批改
                    </div>
                  </button>
                </div>
                <div className="mt-3 p-2.5 bg-slate-50 rounded-lg text-[11px] text-slate-500 text-center">
                  學生初次使用請點選上方「學生註冊 (學號 32505030XX)」建立帳號並進行信箱安全認證。
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
