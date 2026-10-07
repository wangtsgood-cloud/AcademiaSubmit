import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Mail, GraduationCap, User as UserIcon, LogOut, ChevronDown, CheckCircle } from 'lucide-react';

interface NavbarProps {
  onOpenAuth: (mode?: 'login' | 'register') => void;
  activeTab: 'submissions' | 'guidelines';
  setActiveTab: (tab: 'submissions' | 'guidelines') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenAuth,
  activeTab,
  setActiveTab,
}) => {
  const {
    currentUser,
    users,
    switchUser,
    logout,
    pendingEmailPayload,
    openVerificationModal,
  } = useAuth();

  const [roleMenuOpen, setRoleMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xs border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-3">
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('submissions');
            }}
            className="text-lg font-bold tracking-tight text-slate-900 flex items-center gap-2"
          >
            <span>AcademiaSubmit</span>
            <span className="hidden sm:inline text-xs font-normal text-slate-400">· 期末報告審閱與批改平台</span>
          </a>
        </div>

        {/* Zone 2: Clean text navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          <button
            onClick={() => setActiveTab('submissions')}
            className={`transition-colors hover:text-slate-900 ${
              activeTab === 'submissions' ? 'text-slate-900 font-semibold' : ''
            }`}
          >
            {currentUser?.role === 'professor' ? '全班審閱總台' : '報告上傳與進度'}
          </button>
          <button
            onClick={() => setActiveTab('guidelines')}
            className={`transition-colors hover:text-slate-900 ${
              activeTab === 'guidelines' ? 'text-slate-900 font-semibold' : ''
            }`}
          >
            格式與繳交規範
          </button>
        </nav>

        {/* Zone 3: 1-2 primary actions */}
        <div className="flex items-center gap-3">
          {/* Simulated Email alert button if pending */}
          {pendingEmailPayload && (
            <button
              onClick={() => openVerificationModal()}
              className="relative p-2 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-medium"
              title="查看未讀驗證信件"
            >
              <Mail className="w-4 h-4" />
              <span className="hidden sm:inline">驗證信</span>
              <span className="w-2 h-2 rounded-full bg-rose-500 absolute top-1.5 right-1.5 animate-pulse" />
            </button>
          )}

          {currentUser ? (
            <div className="relative">
              <button
                onClick={() => setRoleMenuOpen(!roleMenuOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-medium text-slate-800 transition-colors"
              >
                {currentUser.role === 'professor' ? (
                  <GraduationCap className="w-4 h-4 text-indigo-600 shrink-0" />
                ) : (
                  <UserIcon className="w-4 h-4 text-emerald-600 shrink-0" />
                )}
                <div className="text-left">
                  <div className="font-semibold truncate max-w-[120px] sm:max-w-[160px]">
                    {currentUser.name}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    {currentUser.role === 'professor' ? '指導教授' : currentUser.studentId}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              </button>

              {/* User Switch Dropdown */}
              {roleMenuOpen && (
                <div
                  className="absolute right-0 mt-1 w-64 bg-white rounded-lg shadow-xl border border-slate-200 py-2 z-50 text-xs"
                  onMouseLeave={() => setRoleMenuOpen(false)}
                >
                  <div className="px-3 py-1 text-[11px] font-semibold text-slate-400">
                    目前登入身分
                  </div>
                  <div className="px-3 py-1.5 bg-slate-50 border-y border-slate-100 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-900">{currentUser.name}</div>
                      <div className="text-[11px] text-slate-500">{currentUser.email}</div>
                    </div>
                    {currentUser.isEmailVerified && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                        <CheckCircle className="w-3 h-3" />
                        已驗證
                      </span>
                    )}
                  </div>

                  <div className="px-3 pt-2 pb-1 text-[11px] font-semibold text-slate-400">
                    切換測試帳號 (教授 / 學生)
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {users.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => {
                          switchUser(u.id);
                          setRoleMenuOpen(false);
                        }}
                        className={`w-full text-left px-3 py-1.5 hover:bg-slate-100 flex items-center justify-between ${
                          u.id === currentUser.id ? 'bg-indigo-50/60 font-semibold text-indigo-900' : 'text-slate-700'
                        }`}
                      >
                        <div className="truncate">
                          <div>{u.name}</div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            {u.role === 'professor' ? '教授' : u.studentId}
                          </div>
                        </div>
                        {u.id === currentUser.id && (
                          <span className="text-[10px] text-indigo-600 font-semibold">當前</span>
                        )}
                      </button>
                    ))}
                  </div>

                  <div className="pt-2 mt-1 border-t border-slate-100 px-2 space-y-1">
                    <button
                      onClick={() => {
                        setRoleMenuOpen(false);
                        onOpenAuth('register');
                      }}
                      className="w-full text-left px-2 py-1 text-indigo-600 hover:bg-indigo-50 rounded"
                    >
                      + 註冊新學生 (32505030XX)
                    </button>
                    <button
                      onClick={() => {
                        setRoleMenuOpen(false);
                        logout();
                        onOpenAuth('login');
                      }}
                      className="w-full text-left px-2 py-1 text-rose-600 hover:bg-rose-50 rounded flex items-center gap-1.5"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      登出系統
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenAuth('login')}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 transition-colors"
              >
                登入
              </button>
              <button
                onClick={() => onOpenAuth('register')}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap"
              >
                學生註冊
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
