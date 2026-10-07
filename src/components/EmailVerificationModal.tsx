import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Mail, ShieldCheck, Clock, CheckCircle2, AlertCircle, RefreshCw, ArrowRight, KeyRound } from 'lucide-react';

export const EmailVerificationModal: React.FC = () => {
  const {
    isVerificationModalOpen,
    activeVerificationUser,
    pendingEmailPayload,
    verifyEmailCode,
    resendVerificationCode,
    closeVerificationModal,
  } = useAuth();

  const [codeDigits, setCodeDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState<number>(300); // 5 minutes
  const [isResending, setIsResending] = useState<boolean>(false);
  const [showMailboxView, setShowMailboxView] = useState<boolean>(true);

  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Timer countdown
  useEffect(() => {
    if (!isVerificationModalOpen) return;
    setTimeLeft(300);
    const interval = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [isVerificationModalOpen, activeVerificationUser?.verificationCodeExpiresAt]);

  // Reset inputs on open
  useEffect(() => {
    if (isVerificationModalOpen) {
      setCodeDigits(['', '', '', '', '', '']);
      setErrorMsg('');
      setSuccessMsg('');
      setTimeout(() => {
        inputsRef.current[0]?.focus();
      }, 150);
    }
  }, [isVerificationModalOpen]);

  if (!isVerificationModalOpen || !activeVerificationUser) {
    return null;
  }

  const handleDigitChange = (index: number, val: string) => {
    const char = val.replace(/\D/g, '').slice(-1);
    const next = [...codeDigits];
    next[index] = char;
    setCodeDigits(next);
    setErrorMsg('');

    if (char && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !codeDigits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const next = ['', '', '', '', '', ''];
    for (let i = 0; i < pasted.length; i++) {
      next[i] = pasted[i];
    }
    setCodeDigits(next);

    const focusIdx = Math.min(pasted.length, 5);
    inputsRef.current[focusIdx]?.focus();
  };

  const fullCode = codeDigits.join('');

  const handleVerify = () => {
    if (fullCode.length < 6) {
      setErrorMsg('請輸入完整的 6 位數安全驗證碼');
      return;
    }

    const res = verifyEmailCode(fullCode);
    if (res.success) {
      setSuccessMsg(res.message);
    } else {
      setErrorMsg(res.message);
    }
  };

  const handleQuickFill = () => {
    const targetCode = activeVerificationUser.verificationCode || pendingEmailPayload?.code;
    if (targetCode && targetCode.length === 6) {
      setCodeDigits(targetCode.split(''));
      setErrorMsg('');
      inputsRef.current[5]?.focus();
    }
  };

  const handleResend = () => {
    setIsResending(true);
    const res = resendVerificationCode();
    setIsResending(false);
    if (res.success) {
      setSuccessMsg('新驗證碼已送出，請查看下方模擬校園信箱。');
      setTimeLeft(300);
      setCodeDigits(['', '', '', '', '', '']);
    } else {
      setErrorMsg(res.message);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">電子郵件身分安全性驗證</h2>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>學生帳號安全性綁定</span>
                <span aria-hidden="true">·</span>
                <span>學號：{activeVerificationUser.studentId}</span>
              </div>
            </div>
          </div>
          <button
            onClick={closeVerificationModal}
            className="text-slate-400 hover:text-slate-600 text-sm font-medium p-1.5"
            aria-label="關閉"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          <div className="text-sm text-slate-600 leading-relaxed">
            系統已寄送一封含有 6 位數安全代碼的認證信至：
            <span className="font-semibold text-slate-900 ml-1 bg-slate-100 px-2 py-0.5 rounded">
              {activeVerificationUser.email}
            </span>
            。請輸入該驗證碼以確認您為學號{' '}
            <span className="font-semibold text-slate-900">{activeVerificationUser.studentId}</span>{' '}
            之本人，保障期末報告提交與評分之學術誠信。
          </div>

          {/* 6-Digit PIN Input */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-medium text-slate-700">請輸入 6 位數安全驗證碼</span>
              <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>驗證碼有效時間：</span>
                <span className={`font-mono font-medium ${timeLeft < 60 ? 'text-rose-600' : 'text-slate-700'}`}>
                  {formatTime(timeLeft)}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 sm:gap-3 py-2">
              {codeDigits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => {
                    inputsRef.current[idx] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleDigitChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  onPaste={handlePaste}
                  className={`w-11 h-13 text-center text-xl font-bold font-mono rounded-lg border transition-all outline-hidden ${
                    digit
                      ? 'border-indigo-600 bg-indigo-50/40 text-indigo-900'
                      : 'border-slate-300 bg-white text-slate-900 hover:border-slate-400 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100'
                  }`}
                />
              ))}
            </div>

            {errorMsg && (
              <div className="flex items-center gap-1.5 text-xs text-rose-600 bg-rose-50 border border-rose-200 px-3 py-2 rounded-lg">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-lg">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={handleResend}
              disabled={isResending || timeLeft > 240}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />
              <span>重新發送驗證碼 {timeLeft > 240 ? `(${timeLeft - 240}s後可重發)` : ''}</span>
            </button>

            <button
              type="button"
              onClick={handleVerify}
              disabled={fullCode.length < 6}
              className="px-5 py-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center gap-2"
            >
              <span>確認驗證並啟用帳號</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Simulation Campus Mailbox Preview */}
          <div className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50/80">
            <div className="px-4 py-2.5 bg-slate-100/80 border-b border-slate-200 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 font-medium text-slate-700">
                <Mail className="w-3.5 h-3.5 text-indigo-600" />
                <span>校園安全郵件即時通報 (模擬學生收件匣)</span>
              </div>
              <button
                type="button"
                onClick={handleQuickFill}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2.5 py-1 rounded"
              >
                <KeyRound className="w-3 h-3" />
                <span>一鍵帶入此信件驗證碼</span>
              </button>
            </div>

            <div className="p-4 text-xs space-y-2 text-slate-700 bg-white">
              <div className="flex flex-col sm:flex-row sm:justify-between text-slate-500 pb-2 border-b border-slate-100 gap-1">
                <div>
                  <span className="font-semibold text-slate-700">寄件者：</span>
                  校園資安驗證中心 &lt;verify-security@univ.edu.tw&gt;
                </div>
                <div>
                  <span className="font-semibold text-slate-700">時間：</span>
                  {pendingEmailPayload?.sentAt || '剛剛'}
                </div>
              </div>
              <div>
                <span className="font-semibold text-slate-700">收件者：</span>
                {activeVerificationUser.name} &lt;{activeVerificationUser.email}&gt;
              </div>
              <div>
                <span className="font-semibold text-slate-700">主旨：</span>
                【重要通知】期末報告繳交平台 - 學號 {activeVerificationUser.studentId} 安全驗證碼通知
              </div>

              <div className="p-3 my-2 bg-slate-50 rounded border border-slate-200 text-slate-800 leading-relaxed font-sans">
                親愛的 {activeVerificationUser.name} 同學 您好：
                <br /><br />
                您正在註冊或登入「期末報告審閱與批改平台」，綁定之學號為{' '}
                <span className="font-mono font-bold text-slate-900">{activeVerificationUser.studentId}</span>。
                為確保帳號身分真實性與學術成績之防偽安全，您的專屬 6 位數安全驗證碼為：
                <div className="my-3 text-center">
                  <span className="inline-block px-5 py-2 bg-indigo-600 text-white font-mono text-2xl font-bold tracking-widest rounded-md shadow-xs">
                    {activeVerificationUser.verificationCode || pendingEmailPayload?.code || '849201'}
                  </span>
                </div>
                請於 5 分鐘內返回系統輸入以完成驗證。若非您本人操作，請儘速向授課教授或系辦公室回報。
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>防護機制：10碼學號限制 (32505030XX) 雙重電子郵件校驗</span>
          <button
            onClick={closeVerificationModal}
            className="text-slate-600 hover:text-slate-900 underline"
          >
            稍後再驗證
          </button>
        </div>
      </div>
    </div>
  );
};
