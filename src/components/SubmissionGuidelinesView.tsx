import React from 'react';
import { ShieldAlert, FileText, CheckCircle, Download, KeyRound, Clock } from 'lucide-react';

export const SubmissionGuidelinesView: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
          <span>作業繳交與身分安全守則</span>
          <span aria-hidden="true">·</span>
          <span>學術誠信指引</span>
        </div>
        <h1 className="text-xl font-bold text-slate-900">
          期末報告格式、帳號安全與檔案下載機制規範
        </h1>
        <p className="text-xs text-slate-600 mt-1 max-w-3xl leading-relaxed">
          請全體修課學生務必於截止日前詳閱以下作業繳交規範與帳號安全程序，以確保期末成績無誤登錄。
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        {/* Card 1: Student ID & Email Security */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
          <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
            <KeyRound className="w-4 h-4 text-indigo-600" />
            <span>1. 學號帳號與郵件安全驗證</span>
          </div>
          <ul className="space-y-2 text-slate-600 leading-relaxed list-disc list-inside">
            <li>
              <strong className="text-slate-800">帳號規定：</strong>學生帳號一律為 10 碼學號，格式必須符合{' '}
              <code className="text-indigo-600 bg-indigo-50 px-1 py-0.5 rounded font-mono font-bold">
                32505030XX
              </code>
              。
            </li>
            <li>
              <strong className="text-slate-800">身分安全認證：</strong>註冊後系統將發送 6 位數安全驗證碼至學校或填寫之電子郵箱。完成驗證前禁止提交報告，以杜絕冒名繳交。
            </li>
            <li>
              <strong className="text-slate-800">有效時限：</strong>驗證碼時效為 5 分鐘，逾時可於系統中點選「重新發送」。
            </li>
          </ul>
        </div>

        {/* Card 2: File Format & Upload */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
          <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
            <FileText className="w-4 h-4 text-emerald-600" />
            <span>2. 報告格式與版本控管</span>
          </div>
          <ul className="space-y-2 text-slate-600 leading-relaxed list-disc list-inside">
            <li>
              <strong className="text-slate-800">檔案格式：</strong>建議為標準 PDF 文件；若包含原始程式碼或附加展示檔案，可打包為 ZIP 壓縮檔。
            </li>
            <li>
              <strong className="text-slate-800">檔名建議：</strong>請以「學號_姓名_科目_期末報告.pdf」命名，如：
              <code className="block mt-1 font-mono text-[11px] bg-slate-100 p-1 rounded text-slate-800">
                3250503001_王小明_微機原理_期末報告.pdf
              </code>
            </li>
            <li>
              <strong className="text-slate-800">多版本重繳：</strong>截止日前可隨時重新上傳修訂版 (版本號自動遞增為 v2, v3)，教授將以最新版本評閱。
            </li>
          </ul>
        </div>

        {/* Card 3: Download & Grading */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
          <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
            <Download className="w-4 h-4 text-amber-600" />
            <span>3. 即時批閱與檔案下載機制</span>
          </div>
          <ul className="space-y-2 text-slate-600 leading-relaxed list-disc list-inside">
            <li>
              <strong className="text-slate-800">即時成績核定：</strong>教授線上即時審閱報告並給予百分制分數、等第與專屬批改意見。
            </li>
            <li>
              <strong className="text-slate-800">原檔下載機制：</strong>學生與教授皆可隨時在系統一鍵下載原始報告檔案，確保繳交完整性與留存備份。
            </li>
            <li>
              <strong className="text-slate-800">全班成績匯出：</strong>評審核定完成後，教授端可匯出全班成績 CSV 總表，便於教務系統登錄與統計。
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
