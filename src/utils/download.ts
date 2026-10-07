import { Submission } from '../types';

/**
 * Trigger download of raw file or dataUrl
 */
export function downloadFile(fileName: string, dataUrl?: string, fallbackContent?: string) {
  let url = dataUrl;
  let needRevoke = false;

  if (!url) {
    const content = fallbackContent || `【期末報告存檔】\n檔名: ${fileName}\n匯出時間: ${new Date().toLocaleString('zh-TW')}`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    url = URL.createObjectURL(blob);
    needRevoke = true;
  }

  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  if (needRevoke && url) {
    setTimeout(() => URL.revokeObjectURL(url!), 1000);
  }
}

/**
 * Generate CSV Gradebook for professor download
 */
export function exportGradebookCSV(submissions: Submission[]) {
  const headers = [
    '學號',
    '姓名',
    '系所',
    '繳交檔案',
    '版本',
    '繳交狀態',
    '繳交時間',
    '評定成績',
    '成績等級',
    '教授評語',
  ];

  const rows = submissions.map((s) => [
    `"${s.studentId}"`,
    `"${s.studentName}"`,
    `"${s.department}"`,
    `"${s.fileName.replace(/"/g, '""')}"`,
    `"v${s.version}"`,
    `"${
      s.status === 'graded'
        ? '已批改'
        : s.status === 'grading'
        ? '批改中'
        : s.status === 'resubmit_required'
        ? '需重繳'
        : '待批改'
    }"`,
    `"${s.submittedAt}"`,
    s.score !== null ? s.score : '',
    `"${s.gradeLetter || ''}"`,
    `"${(s.professorFeedback || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent =
    '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `期末報告全班成績總表_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}


