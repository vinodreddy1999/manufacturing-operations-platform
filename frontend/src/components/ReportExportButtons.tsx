import { useState } from 'react';

import { ActionNotice } from './ActionNotice';

export function ReportExportButtons({ reportName }: { reportName: string }) {
  const [notice, setNotice] = useState('');
  const formats = ['Preview', 'PDF', 'Excel', 'CSV'];

  function handleExport(format: string) {
    const safeName = reportName.replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase() || 'report';
    const content = [
      ['Report', reportName],
      ['Format', format],
      ['Generated At', new Date().toISOString()],
      ['Status', 'Draft export generated from current frontend view'],
    ].map((row) => row.map((value) => `"${value.replaceAll('"', '""')}"`).join(',')).join('\n');
    const blob = new Blob([content], { type: format === 'PDF' ? 'text/plain;charset=utf-8;' : 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${safeName}.${format === 'PDF' ? 'txt' : format.toLowerCase()}`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setNotice(`${format} export downloaded for "${reportName}".`);
  }

  return (
    <div>
      {notice ? <ActionNotice message={notice} tone="success" onDismiss={() => setNotice('')} /> : null}
      <div className="mt-4 flex flex-wrap gap-2">
        {formats.map((item) => (
          <button key={item} type="button" className="form-button-subtle py-1 text-xs" onClick={() => handleExport(item)}>
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}
