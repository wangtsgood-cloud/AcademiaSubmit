import React, { useState, useEffect } from 'react';
import { Submission, SubmissionComment } from '../types';
import { calculateGradeLetter } from '../utils/storage';
import { downloadFile, downloadGradingReport } from '../utils/download';
import {
  FileText,
  Download,
  Send,
  CheckCircle,
  MessageSquare,
  Award,
  Sparkles,
  BookOpen,
} from 'lucide-react';

interface GradingWorkspaceModalProps {
  submission: Submission | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveGrading: (updated: Submission) => void;
  onAddComment: (submissionId: string, comment: Omit<SubmissionComment, 'id' | 'createdAt'>) => void;
}

export const GradingWorkspaceModal: React.FC<GradingWorkspaceModalProps> = ({
  submission,
  isOpen,
  onClose,
  onSaveGrading,
  onAddComment,
}) => {
  if (!isOpen || !submission) return null;

  const [score, setScore] = useState<number>(submission.score ?? 88);
  const [feedback, setFeedback] = useState<string>(submission.professorFeedback || '');
  const [status, setStatus] = useState<Submission['status']>(submission.status);
  const [newCommentText, setNewCommentText] = useState<string>('');
  const [commentSection, setCommentSection] = useState<string>('');
  const [saveToast, setSaveToast] = useState<boolean>(false);

  // Sync state when submission opens
  useEffect(() => {
    if (submission) {
      setScore(submission.score ?? 88);
      setFeedback(submission.professorFeedback || '');
      setStatus(submission.status);
    }
  }, [submission]);

  const gradeLetter = calculateGradeLetter(score);

  const handleScoreChange = (val: number) => {
    const clamped = Math.max(0, Math.min(100, Math.round(val)));
    setScore(clamped);
  };

  const handleApplyPresetFeedback = (phrase: string) => {
    if (feedback.includes(phrase)) return;
    setFeedback((prev) => (prev ? `${prev}；${phrase}` : phrase));
  };

  const handleSave = (newStatus?: Submission['status']) => {
    const finalStatus = newStatus || status;
    const now = new Date().toLocaleString('zh-TW', { hour12: false });
    const updated: Submission = {
      ...submission,
      score,
      gradeLetter,
      professorFeedback: feedback,
      status: finalStatus,
      gradedAt: now,
      gradedBy: '王德順 教授',
      updatedAt: now,
    };

    onSaveGrading(updated);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2500);
  };

  const handleSendComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    onAddComment(submission.id, {
      authorId: 'user_prof_001',
      authorName: '王德順 教授',
      authorRole: 'professor',
      content: newCommentText.trim(),
      pageOrSection: commentSection.trim() || undefined,
    });

    setNewCommentText('');
    setCommentSection('');
  };

  const presetFeedbackPhrases = [
    '報告結構嚴謹，論點清晰',
    '實驗數據詳盡完整，成果優異',
    '建議擴充邊界測試與容錯機制',
    '圖表排版工整，說明扼要',
    '結論部分建議補充未來改進方向',
    '符合期末專題報告規範',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs">
      <div className="w-full max-w-6xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col h-[92vh]">
        {/* Header */}
        <div className="px-6 py-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900">
                  教授即時批改工作台 · {submission.studentName}
                </h2>
                <span className="font-mono text-xs text-slate-500 bg-slate-200/60 px-2 py-0.5 rounded">
                  {submission.studentId}
                </span>
              </div>
              <div className="text-xs text-slate-500 truncate max-w-lg">
                {submission.title}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {saveToast && (
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" /> 已即時儲存！
              </span>
            )}
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded text-sm"
            >
              ✕
            </button>
          </div>
        </div>

        {/* 2-Zone Split Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-hidden divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
          {/* Left Zone: Student Submission Context & Document Reader (5 cols) */}
          <div className="lg:col-span-5 p-5 overflow-y-auto space-y-4 bg-slate-50/50">
            {/* Quick Actions & Meta */}
            <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs text-slate-400">繳交學生</div>
                  <div className="font-bold text-slate-900 text-sm">{submission.studentName}</div>
                  <div className="text-xs text-slate-500 font-mono">{submission.studentId} · {submission.department}</div>
                </div>
                <button
                  onClick={() => downloadFile(submission.fileName, submission.fileDataUrl, submission.textContent)}
                  className="px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>下載原檔</span>
                </button>
              </div>

              <div className="text-xs grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                <div>
                  <span className="text-slate-400">報告版本：</span>
                  <span className="font-semibold text-slate-700">v{submission.version}</span>
                </div>
                <div>
                  <span className="text-slate-400">繳交時間：</span>
                  <span className="font-mono text-slate-700">{submission.submittedAt}</span>
                </div>
                <div>
                  <span className="text-slate-400">檔案大小：</span>
                  <span className="font-mono text-slate-700">{(submission.fileSize / 1024 / 1024).toFixed(2)} MB</span>
                </div>
                <div>
                  <span className="text-slate-400">審查狀態：</span>
                  <span className="font-semibold text-slate-800">
                    {submission.status === 'graded' ? '已核定' : submission.status === 'grading' ? '評閱中' : '待批改'}
                  </span>
                </div>
              </div>
            </div>

            {/* Abstract */}
            <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-2">
              <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-slate-500" />
                <span>報告摘要 (Abstract)</span>
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {submission.abstract}
              </p>
              {submission.keywords.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {submission.keywords.map((kw, i) => (
                    <span key={i} className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                      {kw}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Document Text / Excerpt Preview */}
            <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  <span>報告內容節錄</span>
                </h3>
                <span className="text-[11px] font-mono text-slate-400">{submission.fileName}</span>
              </div>
              <div className="bg-slate-900 text-slate-100 p-3.5 rounded-lg text-xs font-mono leading-relaxed max-h-56 overflow-y-auto whitespace-pre-wrap">
                {submission.textContent || '【標準 PDF 報告文件，可點選上方按鈕下載全文】'}
              </div>
            </div>
          </div>

          {/* Right Zone: Grading Deck & Comments (7 cols) */}
          <div className="lg:col-span-7 p-5 overflow-y-auto space-y-5 bg-white">
            {/* Live Score Tally Box */}
            <div className="bg-slate-900 text-white p-4 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 uppercase tracking-wider block font-medium">
                  期末評定成績
                </span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-3xl font-extrabold font-mono text-white tabular-nums">
                    {score}
                  </span>
                  <span className="text-xs text-slate-400">/ 100 分</span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs text-slate-400 block font-medium">核定等第</span>
                <span className="text-2xl font-bold font-mono text-amber-400">
                  {gradeLetter}
                </span>
              </div>
            </div>

            {/* Direct Score Slider & Numeric Input */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <label className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-indigo-600" />
                  <span>設定成績分數 (0 - 100 分)</span>
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={score}
                    onChange={(e) => handleScoreChange(Number(e.target.value))}
                    className="w-16 text-right px-2 py-1 text-sm font-mono font-bold border border-slate-300 rounded bg-white"
                  />
                  <span className="text-slate-600 font-mono font-semibold">分</span>
                </div>
              </div>

              <input
                type="range"
                min={0}
                max={100}
                value={score}
                onChange={(e) => handleScoreChange(Number(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
              />

              <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                <span>0 分 (不通過)</span>
                <span>60 分 (合格及格)</span>
                <span>80 分 (良好)</span>
                <span>100 分 (卓越)</span>
              </div>
            </div>

            {/* Professor Feedback Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-900">
                  教授評語與指導建議
                </label>
                <span className="text-[11px] text-slate-400">點擊下方常用標籤可快速帶入</span>
              </div>

              {/* Quick Tags */}
              <div className="flex flex-wrap gap-1.5">
                {presetFeedbackPhrases.map((phrase, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleApplyPresetFeedback(phrase)}
                    className="text-[11px] px-2 py-0.5 rounded border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors"
                  >
                    + {phrase}
                  </button>
                ))}
              </div>

              <textarea
                rows={4}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="輸入給學生的整體評價、修改建議或肯定要點..."
                className="w-full p-3 text-xs border border-slate-300 rounded-lg focus:border-indigo-600 focus:outline-hidden"
              />
            </div>

            {/* Status & Action Buttons */}
            <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-600">審定狀態：</span>
                <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg text-xs">
                  <button
                    type="button"
                    onClick={() => setStatus('grading')}
                    className={`px-2.5 py-1 rounded-md transition-colors ${
                      status === 'grading' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600'
                    }`}
                  >
                    評閱中 (草稿)
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatus('graded')}
                    className={`px-2.5 py-1 rounded-md transition-colors ${
                      status === 'graded' ? 'bg-emerald-600 text-white shadow-xs font-semibold' : 'text-slate-600'
                    }`}
                  >
                    核定完成 (已批改)
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatus('resubmit_required')}
                    className={`px-2.5 py-1 rounded-md transition-colors ${
                      status === 'resubmit_required' ? 'bg-rose-600 text-white shadow-xs font-semibold' : 'text-slate-600'
                    }`}
                  >
                    退回重繳
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => downloadGradingReport({ ...submission, score, gradeLetter, professorFeedback: feedback })}
                  className="px-3 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 border border-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <Award className="w-3.5 h-3.5 text-indigo-600" />
                  <span>匯出評分證明</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSave(status)}
                  className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>儲存並發布評核</span>
                </button>
              </div>
            </div>

            {/* Real-time Threaded Comments & Discussion */}
            <div className="pt-4 border-t border-slate-200 space-y-3">
              <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
                <span>師生即時討論與問答串 ({submission.comments.length} 則)</span>
              </h3>

              {/* Comments List */}
              <div className="space-y-2.5 max-h-52 overflow-y-auto pr-1">
                {submission.comments.length === 0 ? (
                  <div className="text-xs text-slate-400 py-3 text-center bg-slate-50 rounded-lg">
                    尚無師生討論留言，教授可於下方針對特定章節提出即時回饋。
                  </div>
                ) : (
                  submission.comments.map((c) => (
                    <div
                      key={c.id}
                      className={`p-3 rounded-lg text-xs space-y-1 ${
                        c.authorRole === 'professor'
                          ? 'bg-indigo-50/60 border border-indigo-100 text-indigo-950 ml-2'
                          : 'bg-slate-50 border border-slate-200 text-slate-900 mr-2'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-slate-800">{c.authorName}</span>
                          {c.pageOrSection && (
                            <span className="bg-white/80 px-1.5 py-0.5 rounded text-indigo-700 font-medium">
                              {c.pageOrSection}
                            </span>
                          )}
                        </div>
                        <span className="font-mono">{c.createdAt}</span>
                      </div>
                      <p className="leading-relaxed">{c.content}</p>
                    </div>
                  ))
                )}
              </div>

              {/* New Comment Input */}
              <form onSubmit={handleSendComment} className="space-y-2 pt-1">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="指定章節/頁碼 (選填，如：第 8 頁圖 2)"
                    value={commentSection}
                    onChange={(e) => setCommentSection(e.target.value)}
                    className="w-1/3 px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:border-indigo-600 focus:outline-hidden"
                  />
                  <input
                    type="text"
                    placeholder="輸入給學生的即時指引或回覆..."
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:border-indigo-600 focus:outline-hidden"
                  />
                  <button
                    type="submit"
                    disabled={!newCommentText.trim()}
                    className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center gap-1"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>傳送</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

