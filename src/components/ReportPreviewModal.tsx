import React from 'react';
import { Submission } from '../types';
import { downloadFile } from '../utils/download';
import { FileText, Download, Award, CheckCircle, Clock } from 'lucide-react';

interface ReportPreviewModalProps {
  submission: Submission | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ReportPreviewModal: React.FC<ReportPreviewModalProps> = ({
  submission,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !submission) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 font-mono truncate max-w-md">
                {submission.fileName}
              </h2>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="font-mono">學號：{submission.studentId}</span>
                <span aria-hidden="true">·</span>
                <span>{submission.studentName}</span>
                <span aria-hidden="true">·</span>
                <span>版本：v{submission.version}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-sm font-medium p-1"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs">
            <div>
              <span className="text-slate-400 block mb-0.5">繳交狀態</span>
              <span className="font-semibold text-slate-800 flex items-center gap-1">
                {submission.status === 'graded' ? (
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                )}
                {submission.status === 'graded'
                  ? '已批改'
                  : submission.status === 'grading'
                  ? '評閱中'
                  : submission.status === 'resubmit_required'
                  ? '需補正重繳'
                  : '已繳交待批改'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">評審成績</span>
              <span className="font-bold text-base font-mono text-slate-900">
                {submission.score !== null ? `${submission.score} 分 (${submission.gradeLetter})` : '尚未核定'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">檔案規格</span>
              <span className="font-mono text-slate-700">
                {(submission.fileSize / 1024 / 1024).toFixed(2)} MB · {submission.fileName.split('.').pop()?.toUpperCase()}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">最後繳交時間</span>
              <span className="font-mono text-slate-700">{submission.submittedAt}</span>
            </div>
          </div>

          {/* Report Document Preview */}
          <div>
            <h3 className="font-semibold text-slate-900 mb-2 flex items-center justify-between">
              <span>報告內容預覽節錄</span>
              <span className="text-xs text-slate-500 font-mono">{submission.fileName}</span>
            </h3>
            <div className="bg-slate-900 text-slate-200 p-4 rounded-lg font-mono text-xs leading-relaxed max-h-60 overflow-y-auto whitespace-pre-wrap">
              {submission.textContent || '【本檔案為標準 PDF 格式文件，請點擊下方「下載原始報告檔案」以取得全文】'}
            </div>
          </div>

          {/* Professor feedback if graded */}
          {submission.professorFeedback && (
            <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-lg">
              <div className="font-semibold text-emerald-900 mb-1 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-emerald-700" />
                <span>教授評語與批改意見 ({submission.gradedBy || '王德順 教授'})</span>
              </div>
              <p className="text-xs sm:text-sm text-emerald-800 leading-relaxed">
                {submission.professorFeedback}
              </p>
            </div>
          )}
        </div>

        {/* Footer Downloads */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            檔案名稱：<span className="font-mono text-slate-700">{submission.fileName}</span>
          </div>
          <button
            onClick={() => downloadFile(submission.fileName, submission.fileDataUrl, submission.textContent)}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>下載原始報告檔案</span>
          </button>
        </div>
      </div>
    </div>
  );
};
