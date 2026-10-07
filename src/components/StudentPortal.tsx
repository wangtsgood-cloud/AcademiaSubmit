import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Submission, SubmissionComment } from '../types';
import { downloadFile, downloadGradingReport } from '../utils/download';
import {
  UploadCloud,
  FileText,
  Download,
  Award,
  Clock,
  CheckCircle,
  AlertCircle,
  ShieldCheck,
  Send,
  RefreshCw,
  Sparkles,
  Info,
} from 'lucide-react';

interface StudentPortalProps {
  submission: Submission | null;
  onSubmitReport: (data: {
    title: string;
    abstract: string;
    keywords: string[];
    fileName: string;
    fileSize: number;
    fileType: string;
    fileDataUrl?: string;
    textContent?: string;
  }) => void;
  onAddComment: (submissionId: string, comment: Omit<SubmissionComment, 'id' | 'createdAt'>) => void;
  onOpenPreview: (submission: Submission) => void;
}

export const StudentPortal: React.FC<StudentPortalProps> = ({
  submission,
  onSubmitReport,
  onAddComment,
  onOpenPreview,
}) => {
  const { currentUser, openVerificationModal } = useAuth();

  const [isEditing, setIsEditing] = useState<boolean>(!submission);
  const [title, setTitle] = useState<string>(submission?.title || '');
  const [abstract, setAbstract] = useState<string>(submission?.abstract || '');
  const [keywordInput, setKeywordInput] = useState<string>(
    submission?.keywords.join(', ') || '分散式快取, 系統容錯, 高併發'
  );

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileDataUrl, setFileDataUrl] = useState<string | undefined>(submission?.fileDataUrl);
  const [fileTextContent, setFileTextContent] = useState<string | undefined>(submission?.textContent);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Discussion state
  const [replyText, setReplyText] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!currentUser) return null;

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);

    // Read content
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setFileDataUrl(result);
    };
    reader.readAsDataURL(file);

    // If text or markdown, read text
    if (file.type.includes('text') || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
      const textReader = new FileReader();
      textReader.onload = (e) => {
        setFileTextContent(e.target?.result as string);
      };
      textReader.readAsText(file);
    } else {
      setFileTextContent(
        `【上傳文件：${file.name}】\n規格：${(file.size / 1024 / 1024).toFixed(2)} MB\n類型：${file.type || '二進位應用程式/文件'}\n上傳日期戳記：${new Date().toLocaleString('zh-TW')}`
      );
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser.isEmailVerified) {
      openVerificationModal(currentUser);
      return;
    }

    if (!title.trim()) {
      alert('請填寫期末專題報告題目');
      return;
    }
    if (!abstract.trim()) {
      alert('請填寫報告摘要說明');
      return;
    }
    if (!selectedFile && !submission) {
      alert('請選取要上傳的報告檔案 (PDF / Word / ZIP)');
      return;
    }

    setIsSubmitting(true);
    setUploadProgress(20);

    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            const fileName = selectedFile ? selectedFile.name : submission?.fileName || `${currentUser.studentId}_${currentUser.name}_期末報告.pdf`;
            const fileSize = selectedFile ? selectedFile.size : submission?.fileSize || 3500000;
            const fileType = selectedFile ? selectedFile.type : submission?.fileType || 'application/pdf';

            const keywords = keywordInput
              .split(/[,，]/)
              .map((k) => k.trim())
              .filter(Boolean);

            onSubmitReport({
              title: title.trim(),
              abstract: abstract.trim(),
              keywords,
              fileName,
              fileSize,
              fileType,
              fileDataUrl,
              textContent: fileTextContent,
            });

            setIsSubmitting(false);
            setIsEditing(false);
            setUploadProgress(0);
          }, 300);
          return 100;
        }
        return prev + 25;
      });
    }, 100);
  };

  const handleStudentReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !submission) return;

    onAddComment(submission.id, {
      authorId: currentUser.id,
      authorName: currentUser.name,
      authorRole: 'student',
      content: replyText.trim(),
    });
    setReplyText('');
  };

  return (
    <div className="space-y-6">
      {/* Student Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>學生入口</span>
            <span aria-hidden="true">·</span>
            <span>{currentUser.department}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono font-bold text-slate-800">學號：{currentUser.studentId}</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">
            {currentUser.name} 同學 · 期末專題報告提交專區
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            截止期限：<span className="font-semibold text-rose-600">2026/10/15 23:59 止</span> (逾期將自動關閉上傳權限)
          </p>
        </div>

        {/* Email Verification Status */}
        <div className="flex items-center gap-3">
          {currentUser.isEmailVerified ? (
            <div className="flex items-center gap-2 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-lg">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <div>
                <div className="font-semibold">電子郵件安全已核驗</div>
                <div className="text-[11px] text-emerald-700">學號與身分綁定完成</div>
              </div>
            </div>
          ) : (
            <button
              onClick={() => openVerificationModal(currentUser)}
              className="flex items-center gap-2 text-xs text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-300 px-3 py-2 rounded-lg transition-colors text-left"
            >
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <div>
                <div className="font-semibold text-amber-900">信箱尚未驗證 (點擊驗證)</div>
                <div className="text-[11px] text-amber-700">須驗證後方可繳交報告</div>
              </div>
            </button>
          )}
        </div>
      </div>

      {/* Main Container */}
      {!isEditing && submission ? (
        /* Submission Active Card & Results View */
        <div className="space-y-6">
          {/* Submission Status & Overview Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
              <div>
                <div className="text-xs text-slate-400">目前繳交版本：第 {submission.version} 版</div>
                <h2 className="text-lg font-bold text-slate-900 mt-0.5">{submission.title}</h2>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onOpenPreview(submission)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 border border-slate-300 rounded-lg transition-colors"
                >
                  報告預覽
                </button>
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:text-indigo-900 bg-indigo-50 border border-indigo-200 rounded-lg transition-colors flex items-center gap-1"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>更新/重繳版本</span>
                </button>
              </div>
            </div>

            {/* Status & File Details */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                <span className="text-slate-400 block mb-1">審查進度狀態</span>
                <span className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                  {submission.status === 'graded' ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      <span>已核定完成批改</span>
                    </>
                  ) : submission.status === 'grading' ? (
                    <>
                      <Clock className="w-4 h-4 text-amber-600" />
                      <span>教授評閱中 (草稿)</span>
                    </>
                  ) : submission.status === 'resubmit_required' ? (
                    <>
                      <AlertCircle className="w-4 h-4 text-rose-600" />
                      <span>退回要求修改重繳</span>
                    </>
                  ) : (
                    <>
                      <Clock className="w-4 h-4 text-slate-500" />
                      <span>已成功繳交，排隊待審中</span>
                    </>
                  )}
                </span>
                <span className="text-[11px] text-slate-500 block mt-1 font-mono">
                  繳交時間：{submission.submittedAt}
                </span>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                <span className="text-slate-400 block mb-1">已繳交檔案規格</span>
                <div className="font-mono font-semibold text-slate-800 text-sm truncate" title={submission.fileName}>
                  {submission.fileName}
                </div>
                <div className="flex items-center justify-between mt-1 text-[11px] text-slate-500">
                  <span>{(submission.fileSize / 1024 / 1024).toFixed(2)} MB</span>
                  <button
                    onClick={() => downloadFile(submission.fileName, submission.fileDataUrl, submission.textContent)}
                    className="text-indigo-600 hover:text-indigo-800 underline font-semibold flex items-center gap-1"
                  >
                    <Download className="w-3 h-3" /> 下載原始檔
                  </button>
                </div>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                <span className="text-slate-400 block mb-1">期末報告評定成績</span>
                <div className="flex items-baseline gap-2">
                  <span className="font-mono text-2xl font-bold text-slate-900 tabular-nums">
                    {submission.score !== null ? `${submission.score} 分` : '待評定'}
                  </span>
                  {submission.gradeLetter && (
                    <span className="text-sm font-bold text-indigo-700 font-mono">
                      ({submission.gradeLetter})
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-slate-500 block mt-0.5">
                  {submission.gradedBy ? `評審：${submission.gradedBy}` : '待教授發布評分'}
                </span>
              </div>
            </div>

            {/* Abstract preview */}
            <div>
              <div className="text-xs font-semibold text-slate-700 mb-1">報告摘要</div>
              <p className="text-xs text-slate-600 bg-slate-50/60 p-3 rounded-lg border border-slate-100 leading-relaxed">
                {submission.abstract}
              </p>
            </div>
          </div>

          {/* Professor Grading Feedback */}
          {submission.status === 'graded' && (
            <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-base font-bold text-slate-900">
                    教授評閱成績與總評
                  </h3>
                  <span className="text-xs font-mono font-bold text-indigo-700 ml-2 bg-indigo-50 px-2 py-0.5 rounded">
                    得分：{submission.score} 分 ({submission.gradeLetter})
                  </span>
                </div>

                <button
                  onClick={() => downloadGradingReport(submission)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>下載官方評分證明書</span>
                </button>
              </div>

              {/* Written feedback */}
              <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-lg text-xs leading-relaxed">
                <div className="font-semibold text-indigo-900 mb-1 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span>教授評語總評 ({submission.gradedBy || '王德順 教授'})</span>
                </div>
                <p className="text-slate-800 whitespace-pre-wrap">
                  {submission.professorFeedback || '無特別評語。'}
                </p>
              </div>
            </div>
          )}

          {/* Live Discussion & Questions Thread */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              師生即時留言討論區 ({submission.comments.length} 則)
            </h3>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {submission.comments.length === 0 ? (
                <div className="text-xs text-slate-400 py-4 text-center bg-slate-50 rounded-lg">
                  目前尚無留言。若對教授評分或報告修改有疑問，可在下方提問留言。
                </div>
              ) : (
                submission.comments.map((c) => (
                  <div
                    key={c.id}
                    className={`p-3.5 rounded-lg text-xs space-y-1.5 ${
                      c.authorRole === 'professor'
                        ? 'bg-indigo-50 border border-indigo-200 text-slate-900'
                        : 'bg-slate-50 border border-slate-200 text-slate-900 ml-4'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{c.authorName}</span>
                        <span className="text-[10px] bg-white px-1.5 py-0.5 rounded border border-slate-200 font-sans">
                          {c.authorRole === 'professor' ? '指導教授' : '學生本人'}
                        </span>
                        {c.pageOrSection && (
                          <span className="text-indigo-700 font-semibold">{c.pageOrSection}</span>
                        )}
                      </div>
                      <span className="font-mono">{c.createdAt}</span>
                    </div>
                    <p className="leading-relaxed whitespace-pre-wrap">{c.content}</p>
                  </div>
                ))
              )}
            </div>

            {/* Student Comment Form */}
            <form onSubmit={handleStudentReply} className="flex gap-2 pt-2">
              <input
                type="text"
                placeholder="向教授提出問題或回覆修改說明..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg focus:border-indigo-600 focus:outline-hidden"
              />
              <button
                type="submit"
                disabled={!replyText.trim()}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>發送留言</span>
              </button>
            </form>
          </div>
        </div>
      ) : (
        /* Report Upload Form */
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-lg font-bold text-slate-900">
              {submission ? `上傳第 ${submission.version + 1} 版修訂報告` : '繳交期末專題報告'}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              請確實填寫報告資訊，並上傳 PDF 或封裝壓縮檔。學號{' '}
              <span className="font-mono font-semibold text-slate-800">{currentUser.studentId}</span> 將作為唯一學術識別記號。
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                專題報告題目 (Title) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="例如：基於微服務架構之高併發分散式快取一致性研究"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:border-indigo-600 focus:outline-hidden"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                研究摘要 (Abstract) <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={4}
                placeholder="簡述研究背景、系統架構、核心創新方法、實驗數據結果與結論 (約 150-300 字)..."
                value={abstract}
                onChange={(e) => setAbstract(e.target.value)}
                className="w-full px-3.5 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:border-indigo-600 focus:outline-hidden leading-relaxed"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                關鍵字標籤 (以逗點分隔)
              </label>
              <input
                type="text"
                placeholder="例如：分散式系統, 快取機制, 高併發, 容錯"
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                className="w-full px-3.5 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:border-indigo-600 focus:outline-hidden"
              />
            </div>

            {/* Drag & Drop File Upload Box */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-800">
                  報告檔案上傳 (支援 PDF, DOCX, ZIP, PPTX) <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] text-indigo-700 font-medium">
                  檔名建議：請以「學號_姓名_期末報告.pdf」
                </span>
              </div>

              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-indigo-600 bg-indigo-50/50'
                    : selectedFile
                    ? 'border-emerald-400 bg-emerald-50/20'
                    : 'border-slate-300 hover:border-slate-400 bg-slate-50/50'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileSelect(e.target.files[0]);
                    }
                  }}
                  accept=".pdf,.docx,.doc,.zip,.pptx,.txt"
                  className="hidden"
                />

                <div className="flex flex-col items-center justify-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                    <UploadCloud className="w-6 h-6" />
                  </div>

                  {selectedFile ? (
                    <div>
                      <div className="text-sm font-bold text-slate-900 font-mono">
                        {selectedFile.name}
                      </div>
                      <div className="text-xs text-emerald-700 mt-0.5">
                        檔案大小：{(selectedFile.size / 1024 / 1024).toFixed(2)} MB · 點擊可替換
                      </div>
                    </div>
                  ) : submission ? (
                    <div>
                      <div className="text-xs text-slate-500">
                        保留目前檔案：<span className="font-mono text-slate-800">{submission.fileName}</span>
                      </div>
                      <div className="text-xs text-indigo-600 mt-1 font-semibold">
                        拖曳新檔案至此處，或點擊瀏覽選取替換
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="text-xs font-semibold text-slate-700">
                        點擊選取檔案，或將報告拖曳至此處
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        系統將自動紀錄學號、SHA 檔案特徵與上傳時間戳記
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Progress Bar when uploading */}
            {isSubmitting && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-slate-500">
                  <span>檔案加密傳輸與校驗中...</span>
                  <span className="font-mono">{uploadProgress}%</span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-600 h-full transition-all duration-200"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Action Row */}
            <div className="flex items-center justify-between pt-2">
              {submission && (
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  取消變更
                </button>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="ml-auto px-6 py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded-lg transition-colors flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                <span>確認繳交期末報告</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
