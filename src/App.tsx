import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Submission, SubmissionComment } from './types';
import { getStoredSubmissions, saveStoredSubmissions } from './utils/storage';
import { Navbar } from './components/Navbar';
import { StudentPortal } from './components/StudentPortal';
import { ProfessorPortal } from './components/ProfessorPortal';
import { GradingWorkspaceModal } from './components/GradingWorkspaceModal';
import { ReportPreviewModal } from './components/ReportPreviewModal';
import { EmailVerificationModal } from './components/EmailVerificationModal';
import { AuthModal } from './components/AuthModal';
import { SubmissionGuidelinesView } from './components/SubmissionGuidelinesView';
import { GraduationCap, ShieldCheck, Mail, BookOpen } from 'lucide-react';

const MainAppContent: React.FC = () => {
  const { currentUser, openVerificationModal } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [activeTab, setActiveTab] = useState<'submissions' | 'guidelines'>('submissions');

  // Modals
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [gradingSubmission, setGradingSubmission] = useState<Submission | null>(null);
  const [isGradingOpen, setIsGradingOpen] = useState(false);
  const [previewSubmission, setPreviewSubmission] = useState<Submission | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  useEffect(() => {
    setSubmissions(getStoredSubmissions());
  }, []);

  const handleOpenAuth = (mode: 'login' | 'register' = 'login') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  const handleSaveGrading = (updatedSubmission: Submission) => {
    const nextSubmissions = submissions.map((s) =>
      s.id === updatedSubmission.id ? updatedSubmission : s
    );
    setSubmissions(nextSubmissions);
    saveStoredSubmissions(nextSubmissions);
    setGradingSubmission(updatedSubmission);
  };

  const handleAddComment = (
    submissionId: string,
    commentData: Omit<SubmissionComment, 'id' | 'createdAt'>
  ) => {
    const newComment: SubmissionComment = {
      ...commentData,
      id: `comm_${Date.now()}`,
      createdAt: new Date().toLocaleString('zh-TW', { hour12: false }),
    };

    const nextSubmissions = submissions.map((s) => {
      if (s.id === submissionId) {
        return {
          ...s,
          comments: [...s.comments, newComment],
        };
      }
      return s;
    });

    setSubmissions(nextSubmissions);
    saveStoredSubmissions(nextSubmissions);

    if (gradingSubmission && gradingSubmission.id === submissionId) {
      setGradingSubmission({
        ...gradingSubmission,
        comments: [...gradingSubmission.comments, newComment],
      });
    }
  };

  const handleStudentSubmit = (data: {
    title: string;
    abstract: string;
    keywords: string[];
    fileName: string;
    fileSize: number;
    fileType: string;
    fileDataUrl?: string;
    textContent?: string;
  }) => {
    if (!currentUser || currentUser.role !== 'student') return;

    const existingIndex = submissions.findIndex((s) => s.studentId === currentUser.studentId);
    const now = new Date().toLocaleString('zh-TW', { hour12: false });

    if (existingIndex >= 0) {
      // Update / Resubmit new version
      const old = submissions[existingIndex];
      const updated: Submission = {
        ...old,
        title: data.title,
        abstract: data.abstract,
        keywords: data.keywords,
        fileName: data.fileName,
        fileSize: data.fileSize,
        fileType: data.fileType,
        fileDataUrl: data.fileDataUrl || old.fileDataUrl,
        textContent: data.textContent || old.textContent,
        version: old.version + 1,
        status: 'submitted',
        submittedAt: now,
        updatedAt: now,
      };

      const next = [...submissions];
      next[existingIndex] = updated;
      setSubmissions(next);
      saveStoredSubmissions(next);
    } else {
      // New submission
      const newSub: Submission = {
        id: `sub_${currentUser.studentId}`,
        studentId: currentUser.studentId!,
        studentName: currentUser.name,
        studentEmail: currentUser.email,
        department: currentUser.department,
        title: data.title,
        abstract: data.abstract,
        keywords: data.keywords,
        courseCode: '',
        courseName: '115學年度 第一學期 微機原理與微機介面技術 期末報告',
        submittedAt: now,
        updatedAt: now,
        version: 1,
        status: 'submitted',
        fileName: data.fileName,
        fileSize: data.fileSize,
        fileType: data.fileType,
        fileDataUrl: data.fileDataUrl,
        textContent: data.textContent,
        score: null,
        professorFeedback: '',
        comments: [],
      };

      const next = [newSub, ...submissions];
      setSubmissions(next);
      saveStoredSubmissions(next);
    }
  };

  const handleOpenGrading = (sub: Submission) => {
    setGradingSubmission(sub);
    setIsGradingOpen(true);
  };

  const handleOpenPreview = (sub: Submission) => {
    setPreviewSubmission(sub);
    setIsPreviewOpen(true);
  };

  const currentStudentSubmission =
    currentUser && currentUser.role === 'student'
      ? submissions.find((s) => s.studentId === currentUser.studentId) || null
      : null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 font-sans">
      {/* Top Navigation */}
      <Navbar
        onOpenAuth={handleOpenAuth}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {activeTab === 'guidelines' ? (
          <SubmissionGuidelinesView />
        ) : currentUser?.role === 'professor' ? (
          <ProfessorPortal
            submissions={submissions}
            onOpenGrading={handleOpenGrading}
            onOpenPreview={handleOpenPreview}
          />
        ) : currentUser?.role === 'student' ? (
          <StudentPortal
            submission={currentStudentSubmission}
            onSubmitReport={handleStudentSubmit}
            onAddComment={handleAddComment}
            onOpenPreview={handleOpenPreview}
          />
        ) : (
          /* Guest landing state */
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center max-w-xl mx-auto my-12 space-y-4">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-700 rounded-xl flex items-center justify-center mx-auto">
              <GraduationCap className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">歡迎使用期末報告審閱與批改平台</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              本系統要求學生帳號必須為學號 (32505030XX)，並經由校園電子郵件安全認證以保障繳交權利。教授端提供即時評閱、行內留言與原檔下載機制。
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => handleOpenAuth('login')}
                className="px-4 py-2 text-xs font-semibold text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                帳號登入
              </button>
              <button
                onClick={() => handleOpenAuth('register')}
                className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
              >
                註冊學生帳號 (學號 32505030XX)
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800">AcademiaSubmit</span>
            <span aria-hidden="true">·</span>
            <span>福建中醫藥大學 影像醫學系 王德順 教授</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>身分安全防護：學號 32505030XX 嚴格驗證</span>
            <span aria-hidden="true">·</span>
            <span>支援雙向留言與即時成績核發</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        defaultMode={authModalMode}
      />

      <EmailVerificationModal />

      <GradingWorkspaceModal
        submission={gradingSubmission}
        isOpen={isGradingOpen}
        onClose={() => setIsGradingOpen(false)}
        onSaveGrading={handleSaveGrading}
        onAddComment={handleAddComment}
      />

      <ReportPreviewModal
        submission={previewSubmission}
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
}
