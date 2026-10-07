import { Submission } from '../types';

/**
 * Trigger download of raw file or dataUrl
 */
export function downloadFile(fileName: string, dataUrl?: string, fallbackContent?: string) {
  let url = dataUrl;
  let needRevoke = false;

  if (!url) {
    const content = fallbackContent || `【期末專題報告存檔】\n檔名: ${fileName}\n匯出時間: ${new Date().toLocaleString('zh-TW')}`;
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
 * Generate and download an official grading certificate / report summary
 */
export function downloadGradingReport(submission: Submission) {
  const content = `===============================================================
福建中醫藥大學 影像醫學系 - 期末報告評分證明書
===============================================================

【學生資料】
學號：${submission.studentId}
姓名：${submission.studentName}
科系：${submission.department}
聯絡信箱：${submission.studentEmail}

【課程資訊】
課程名稱：${submission.courseName}
報告題目：${submission.title}
繳交時間：${submission.submittedAt}
報告版本：第 ${submission.version} 版 (檔名: ${submission.fileName})

---------------------------------------------------------------
【教授批改成果與評定分數】
---------------------------------------------------------------
總評得分：${submission.score !== null ? `${submission.score} 分` : '未完成評分'}
成績等級：${submission.gradeLetter || '待評定'}
審查狀態：${
    submission.status === 'graded'
      ? '已完成批改 (Graded)'
      : submission.status === 'grading'
      ? '評閱中 (Grading)'
      : submission.status === 'resubmit_required'
      ? '退回重繳 (Revision Required)'
      : '已繳交待批改 (Submitted)'
  }

評審教授：${submission.gradedBy || '王德順 教授'}
評審時間：${submission.gradedAt || '處理中'}

---------------------------------------------------------------
【指導教授評語與建議】
---------------------------------------------------------------
${submission.professorFeedback || '尚無總評評語'}

---------------------------------------------------------------
【線上留言討論紀錄 (${submission.comments.length} 則)】
---------------------------------------------------------------
${
  submission.comments.length === 0
    ? '無討論紀錄'
    : submission.comments
        .map(
          (c) =>
            `[${c.createdAt}] ${c.authorName} (${c.authorRole === 'professor' ? '教授' : '學生'}): ${c.content}`
        )
        .join('\n')
}

===============================================================
本文件由 AcademiaSubmit 學術報告審閱平台系統自動核發
產生日戳：${new Date().toLocaleString('zh-TW')}
===============================================================
`;

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `評分證明_${submission.studentId}_${submission.studentName}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Generate CSV Gradebook for professor download
 */
export function exportGradebookCSV(submissions: Submission[]) {
  const headers = [
    '學號',
    '姓名',
    '系所',
    '報告題目',
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
    `"${s.title.replace(/"/g, '""')}"`,
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

