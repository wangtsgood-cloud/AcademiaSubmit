import React, { useState } from 'react';
import { Submission } from '../types';
import { exportGradebookCSV, downloadFile } from '../utils/download';
import {
  FileSpreadsheet,
  Search,
  Download,
  Award,
  Clock,
  CheckCircle,
  AlertTriangle,
  ArrowUpDown,
} from 'lucide-react';

interface ProfessorPortalProps {
  submissions: Submission[];
  onOpenGrading: (submission: Submission) => void;
  onOpenPreview: (submission: Submission) => void;
}

export const ProfessorPortal: React.FC<ProfessorPortalProps> = ({
  submissions,
  onOpenGrading,
  onOpenPreview,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'submitted' | 'grading' | 'graded' | 'resubmit_required'>('all');
  const [sortField, setSortField] = useState<'studentId' | 'submittedAt' | 'score'>('submittedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Statistics
  const totalCount = submissions.length;
  const gradedCount = submissions.filter((s) => s.status === 'graded').length;
  const pendingCount = submissions.filter((s) => s.status === 'submitted' || s.status === 'grading').length;
  const resubmitCount = submissions.filter((s) => s.status === 'resubmit_required').length;

  const gradedSubmissions = submissions.filter((s) => s.score !== null);
  const averageScore =
    gradedSubmissions.length > 0
      ? (
          gradedSubmissions.reduce((acc, curr) => acc + (curr.score || 0), 0) /
          gradedSubmissions.length
        ).toFixed(1)
      : '無';

  // Filter & Sort
  const filtered = submissions
    .filter((s) => {
      if (statusFilter !== 'all' && s.status !== statusFilter) return false;
      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        return (
          s.studentId.toLowerCase().includes(query) ||
          s.studentName.toLowerCase().includes(query) ||
          s.fileName.toLowerCase().includes(query)
        );
      }
      return true;
    })
    .sort((a, b) => {
      if (sortField === 'studentId') {
        return sortOrder === 'asc'
          ? a.studentId.localeCompare(b.studentId)
          : b.studentId.localeCompare(a.studentId);
      }
      if (sortField === 'score') {
        const scoreA = a.score ?? -1;
        const scoreB = b.score ?? -1;
        return sortOrder === 'asc' ? scoreA - scoreB : scoreB - scoreA;
      }
      return sortOrder === 'asc'
        ? a.submittedAt.localeCompare(b.submittedAt)
        : b.submittedAt.localeCompare(a.submittedAt);
    });

  const toggleSort = (field: 'studentId' | 'submittedAt' | 'score') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className="space-y-6">
      {/* Course Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>115學年度 第一學期</span>
            <span aria-hidden="true">·</span>
            <span className="font-semibold text-indigo-700">指導教授：王德順 教授</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">
            微機原理與微機介面技術 期末報告審核中心
          </h1>
          <p className="text-xs text-slate-600 mt-1 max-w-2xl">
            本系統支援學號 (32505030XX) 實名驗證繳交、報告即時核定、成績總評與全班成績報表匯出。
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => exportGradebookCSV(submissions)}
            className="px-4 py-2 text-xs font-semibold text-slate-800 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-2 shadow-xs"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>匯出全班成績總表 (CSV)</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-4 rounded-xl border border-slate-200">
        <div className="p-2">
          <span className="text-xs text-slate-500 block">總繳交報告數</span>
          <span className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
            {totalCount} <span className="text-xs font-normal text-slate-400">份</span>
          </span>
        </div>
        <div className="p-2">
          <span className="text-xs text-slate-500 block">已完成批改核定</span>
          <span className="text-2xl font-bold font-mono text-emerald-700 tabular-nums">
            {gradedCount} <span className="text-xs font-normal text-slate-400">份</span>
          </span>
        </div>
        <div className="p-2">
          <span className="text-xs text-slate-500 block">待批改 / 評閱中</span>
          <span className="text-2xl font-bold font-mono text-amber-600 tabular-nums">
            {pendingCount} <span className="text-xs font-normal text-slate-400">份</span>
          </span>
        </div>
        <div className="p-2">
          <span className="text-xs text-slate-500 block">全班平均成績</span>
          <span className="text-2xl font-bold font-mono text-indigo-700 tabular-nums">
            {averageScore} {averageScore !== '無' ? <span className="text-xs font-normal text-slate-400">分</span> : ''}
          </span>
        </div>
      </div>

      {/* Search, Filter & Table Deck */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {/* Filter bar */}
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/50">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg overflow-x-auto text-xs font-medium">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
                statusFilter === 'all' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              全部報告 ({totalCount})
            </button>
            <button
              onClick={() => setStatusFilter('submitted')}
              className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
                statusFilter === 'submitted' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              未批改待審
            </button>
            <button
              onClick={() => setStatusFilter('grading')}
              className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
                statusFilter === 'grading' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              評閱草稿中
            </button>
            <button
              onClick={() => setStatusFilter('graded')}
              className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
                statusFilter === 'graded' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              已核定完成
            </button>
            <button
              onClick={() => setStatusFilter('resubmit_required')}
              className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
                statusFilter === 'resubmit_required' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              需重繳 ({resubmitCount})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="搜尋學號 (32505030XX) 或姓名..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:border-indigo-600 focus:outline-hidden"
            />
          </div>
        </div>

        {/* Submissions Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-600">
              <tr>
                <th
                  onClick={() => toggleSort('studentId')}
                  className="py-3 px-4 font-semibold cursor-pointer hover:text-slate-900 whitespace-nowrap"
                >
                  <div className="flex items-center gap-1">
                    <span>學號 (帳號)</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-4 font-semibold whitespace-nowrap">學生姓名</th>
                <th className="py-3 px-4 font-semibold">期末報告檔案</th>
                <th
                  onClick={() => toggleSort('submittedAt')}
                  className="py-3 px-4 font-semibold cursor-pointer hover:text-slate-900 whitespace-nowrap"
                >
                  <div className="flex items-center gap-1">
                    <span>繳交時間</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-4 font-semibold whitespace-nowrap">審核狀態</th>
                <th
                  onClick={() => toggleSort('score')}
                  className="py-3 px-4 font-semibold cursor-pointer hover:text-slate-900 whitespace-nowrap"
                >
                  <div className="flex items-center gap-1">
                    <span>總成績 / 等級</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-4 font-semibold text-right whitespace-nowrap">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="space-y-1">
                      <p className="font-semibold text-slate-600">目前尚無已繳交之學生報告</p>
                      <p className="text-[11px] text-slate-400">
                        學生需先以學號 (32505030XX) 註冊並通過電子郵件安全驗證後上傳報告。
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Student ID */}
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                      {s.studentId}
                    </td>

                    {/* Student Name */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-semibold text-slate-900">{s.studentName}</div>
                      <div className="text-[11px] text-slate-400 font-sans">{s.department}</div>
                    </td>

                    {/* File & Download */}
                    <td className="py-3 px-4 max-w-sm">
                      <div className="font-mono font-semibold text-slate-900 truncate" title={s.fileName}>
                        {s.fileName}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                        <span className="font-mono">第 {s.version} 版</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono">{(s.fileSize / 1024 / 1024).toFixed(2)} MB</span>
                        <span aria-hidden="true">·</span>
                        <button
                          onClick={() => downloadFile(s.fileName, s.fileDataUrl, s.textContent)}
                          className="text-indigo-600 hover:text-indigo-800 underline font-semibold flex items-center gap-1"
                        >
                          <Download className="w-3 h-3" />
                          <span>下載</span>
                        </button>
                      </div>
                    </td>

                    {/* Submitted At */}
                    <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">
                      {s.submittedAt}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {s.status === 'graded' ? (
                        <span className="text-emerald-700 font-medium flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" /> 已完成批改
                        </span>
                      ) : s.status === 'grading' ? (
                        <span className="text-amber-700 font-medium flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> 評閱草稿中
                        </span>
                      ) : s.status === 'resubmit_required' ? (
                        <span className="text-rose-700 font-medium flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" /> 需補正重繳
                        </span>
                      ) : (
                        <span className="text-slate-600 font-medium flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> 待批改
                        </span>
                      )}
                    </td>

                    {/* Total Score & Grade */}
                    <td className="py-3 px-4 whitespace-nowrap font-mono tabular-nums">
                      {s.score !== null ? (
                        <div>
                          <span className="text-slate-900 font-bold">{s.score} 分</span>
                          <span className="text-indigo-700 font-bold ml-1.5">({s.gradeLetter})</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 font-sans">未評分</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right whitespace-nowrap space-x-1.5">
                      <button
                        onClick={() => onOpenPreview(s)}
                        className="px-2.5 py-1 text-slate-700 hover:text-slate-900 border border-slate-200 rounded hover:bg-slate-100 transition-colors"
                      >
                        預覽
                      </button>
                      <button
                        onClick={() => onOpenGrading(s)}
                        className="px-3 py-1 font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded transition-colors inline-flex items-center gap-1"
                      >
                        <Award className="w-3 h-3" />
                        <span>即時批改</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
